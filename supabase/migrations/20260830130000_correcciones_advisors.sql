-- =============================================================================
-- Correcciones detectadas por `supabase db advisors` sobre la base ya aplicada.
--
-- Se corrigen cuatro cosas:
--   1. Un cast sin calificar dentro de handle_new_user que habría roto TODOS
--      los registros de usuario.
--   2. Dos funciones de trigger expuestas como endpoints RPC públicos.
--   3. Extensiones instaladas en el esquema `public`.
--   4. Políticas RLS permisivas duplicadas sobre la misma acción.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1 y 3. Extensiones fuera de `public`
--
-- Supabase recomienda el esquema `extensions`, que ya está en el search_path
-- de los roles de la API. Se mueven citext y pg_trgm: las columnas, índices y
-- clases de operadores que dependen de ellas siguen funcionando, porque el
-- tipo conserva su OID y solo cambia de esquema.
-- ----------------------------------------------------------------------------

create schema if not exists extensions;

alter extension citext  set schema extensions;
alter extension pg_trgm set schema extensions;

-- ----------------------------------------------------------------------------
-- 2. handle_new_user: cast calificado + sin exposición por RPC
--
-- EL BUG: la función declara `set search_path = ''` (correcto, evita que un
-- objeto malicioso en otro esquema secuestre una llamada) pero después hacía
-- `nombre_final::citext` sin calificar. Con el search_path vacío ese nombre de
-- tipo no resuelve.
--
-- No falla al crear la función: plpgsql solo compila el cuerpo la primera vez
-- que se ejecuta. Así que la migración aplicaba sin una queja y el error
-- aparecía recién en el primer `signUp` real, abortando la inserción en
-- auth.users y dejando al usuario sin poder registrarse.
--
-- Ahora el tipo va calificado como extensions.citext.
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nombre_base   text;
  nombre_final  text;
  sufijo        int := 0;
begin
  nombre_base := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nombre_gremio'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'user_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Jugador'
  );

  nombre_base := left(nombre_base, 36);
  if length(trim(nombre_base)) < 2 then
    nombre_base := 'Jugador';
  end if;

  nombre_final := nombre_base;
  while exists (
    select 1 from public.profiles p
    where p.name = nombre_final::extensions.citext
  ) loop
    sufijo := sufijo + 1;
    nombre_final := nombre_base || '-' || sufijo::text;
    if sufijo > 500 then
      nombre_final := nombre_base || '-' || replace(new.id::text, '-', '');
      exit;
    end if;
  end loop;

  insert into public.profiles (id, name, avatar_url, steam_id)
  values (
    new.id,
    nombre_final,
    nullif(trim(coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )), ''),
    nullif(trim(new.raw_app_meta_data ->> 'steam_id'), '')
  );

  return new;
end;
$$;

-- Postgres otorga EXECUTE a PUBLIC en toda función nueva, así que estas dos
-- funciones de trigger quedaban publicadas como /rest/v1/rpc/<nombre>.
-- Un trigger se ejecuta con los privilegios de la tabla, no del que llama:
-- revocar el EXECUTE no lo afecta en nada y cierra el endpoint.
revoke execute on function public.handle_new_user()  from public, anon, authenticated;
revoke execute on function public.tocar_updated_at() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Una sola política permisiva por acción
--
-- Cuando hay varias políticas permisivas para el mismo rol y la misma acción,
-- Postgres las evalúa TODAS en cada consulta y combina el resultado con OR.
-- Escribir ese OR a mano en una única política hace exactamente lo mismo con
-- una sola pasada.
-- ----------------------------------------------------------------------------

drop policy "perfil propio visible"          on public.profiles;
drop policy "miembros activos se ven entre si" on public.profiles;
drop policy "admin ve todos los perfiles"    on public.profiles;

create policy "lectura de perfiles"
  on public.profiles for select
  to authenticated
  using (
    -- El perfil propio siempre, incluso estando pendiente de aprobación
    -- (lo necesita la pantalla de espera).
    (select auth.uid()) = id
    -- Los miembros aprobados se ven entre sí.
    or (status = 'active' and (select private.es_miembro_activo()))
    -- Los admins ven todo, incluidas las solicitudes pendientes.
    or (select private.es_admin())
  );

drop policy "oficiales leen actividad"  on public.activity_logs;
drop policy "actividad propia visible"  on public.activity_logs;

create policy "lectura de actividad"
  on public.activity_logs for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select private.es_oficial())
  );
