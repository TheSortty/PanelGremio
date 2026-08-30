-- =============================================================================
-- Jerarquía de roles escalonada
--
-- EL PROBLEMA
--
-- Había seis roles pero solo tres niveles de permiso reales. Medido contra la
-- base: Invitado, Iniciado y Miembro podían exactamente lo mismo (leer y crear
-- builds, usar el mapa). Eran etiqueta social, no permisos. Y un Invitado
-- activo tenía acceso completo de miembro, al revés de lo que decía el README.
--
-- AHORA cada rol agrega una capacidad concreta sobre el anterior:
--
--   Invitado      leer
--   Iniciado      + crear y editar sus propias builds
--   Miembro       + poner marcadores en el mapa
--   Oficial       + editar builds ajenas, moderar el mapa, ver métricas
--   Mano Derecha  + gestionar usuarios (aprobar, roles, bajas)
--   Maestro       + transferir el liderazgo
--
-- El orden vive en private.rango_rol(): 0 es la máxima autoridad. Comparar por
-- rango en vez de por listas de roles sueltas evita que agregar un rol nuevo
-- obligue a tocar cada política.
-- =============================================================================

create or replace function private.rango_rol(rol public.guild_role)
returns int
language sql
immutable
set search_path = ''
as $$
  select case rol
    when 'Maestro del Gremio' then 0
    when 'Mano Derecha'       then 1
    when 'Oficial'            then 2
    when 'Miembro'            then 3
    when 'Iniciado'           then 4
    when 'Invitado'           then 5
  end;
$$;

/*
  Predicado base: ¿el que llama está activo y con rango suficiente?

  Un rango MENOR es más autoridad, así que "tiene al menos el nivel Miembro"
  se escribe rango <= rango('Miembro').
*/
create or replace function private.tiene_rango(minimo public.guild_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
      and private.rango_rol(p.role) <= private.rango_rol(minimo)
  );
$$;

-- Capacidades con nombre, para que las políticas se lean solas.
create or replace function private.puede_crear_builds()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.tiene_rango('Iniciado'); $$;

create or replace function private.puede_usar_mapa()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.tiene_rango('Miembro'); $$;

create or replace function private.es_maestro()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.tiene_rango('Maestro del Gremio'); $$;

-- Las políticas RLS se evalúan con los privilegios de quien consulta, así que
-- `authenticated` necesita EXECUTE. Siguen en el esquema `private`, que la
-- Data API no expone, de modo que no son invocables por RPC.
grant execute on function private.rango_rol(public.guild_role) to authenticated;
grant execute on function private.tiene_rango(public.guild_role) to authenticated;
grant execute on function private.puede_crear_builds()          to authenticated;
grant execute on function private.puede_usar_mapa()             to authenticated;
grant execute on function private.es_maestro()                  to authenticated;

-- ----------------------------------------------------------------------------
-- builds
-- ----------------------------------------------------------------------------

drop policy "miembros activos crean builds" on public.builds;
drop policy "autor edita su build"          on public.builds;
drop policy "autor u oficial borra build"   on public.builds;

-- Crear: de Iniciado para arriba. Un Invitado ya no puede.
create policy "crear builds"
  on public.builds for insert
  to authenticated
  with check (
    (select private.puede_crear_builds())
    and author_id = (select auth.uid())
  );

-- Editar: el autor su propia build, un Oficial cualquiera.
-- El WITH CHECK repite la condición para que nadie reasigne la autoría.
create policy "editar builds"
  on public.builds for update
  to authenticated
  using (
    (author_id = (select auth.uid()) and (select private.puede_crear_builds()))
    or (select private.es_oficial())
  )
  with check (
    (author_id = (select auth.uid()) and (select private.puede_crear_builds()))
    or (select private.es_oficial())
  );

create policy "borrar builds"
  on public.builds for delete
  to authenticated
  using (
    (author_id = (select auth.uid()) and (select private.puede_crear_builds()))
    or (select private.es_oficial())
  );

-- ----------------------------------------------------------------------------
-- map_markers
-- ----------------------------------------------------------------------------

drop policy "miembros activos crean marcadores" on public.map_markers;

create policy "crear marcadores"
  on public.map_markers for insert
  to authenticated
  with check (
    (select private.puede_usar_mapa())
    and created_by = (select auth.uid())
  );

-- Editar la etiqueta de un marcador. La columna `label` existía desde el
-- principio pero no había forma de escribirla.
grant update (label) on public.map_markers to authenticated;

create policy "editar etiqueta de marcador"
  on public.map_markers for update
  to authenticated
  using (created_by = (select auth.uid()) or (select private.es_oficial()))
  with check (created_by = (select auth.uid()) or (select private.es_oficial()));

-- ----------------------------------------------------------------------------
-- Moderación del mapa
-- ----------------------------------------------------------------------------

create or replace function public.limpiar_mapa()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor    public.profiles;
  borrados integer;
begin
  select * into actor from public.profiles where id = (select auth.uid());

  if actor is null or actor.status <> 'active'
     or private.rango_rol(actor.role) > private.rango_rol('Oficial') then
    raise exception 'No autorizado: se requiere rol de Oficial o superior'
      using errcode = '42501';
  end if;

  with eliminados as (delete from public.map_markers returning 1)
  select count(*) into borrados from eliminados;

  -- Borrar el mapa entero es destructivo y sin deshacer: queda auditado.
  insert into public.audit_logs (actor_id, actor_name, action, target_type, details)
  values (actor.id, actor.name::text, 'map_cleared', 'map',
          jsonb_build_object('marcadores', borrados));

  return borrados;
end;
$$;

revoke execute on function public.limpiar_mapa() from public, anon;
grant  execute on function public.limpiar_mapa() to authenticated;

-- ----------------------------------------------------------------------------
-- Transferencia de liderazgo
--
-- Antes no existía salida: admin_cambiar_rol impide que un Maestro se cambie
-- el rol a sí mismo y solo un Maestro puede asignar ese rol, así que si el
-- Maestro dejaba el gremio nadie podía sucederlo sin tocar la base a mano.
--
-- Es una sola transacción: el sucesor pasa a Maestro y el saliente baja a Mano
-- Derecha. Hacerlo en dos pasos podría dejar dos Maestros o ninguno.
-- ----------------------------------------------------------------------------

create or replace function public.transferir_liderazgo(nuevo_maestro uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor    public.profiles;
  sucesor  public.profiles;
begin
  select * into actor from public.profiles where id = (select auth.uid());

  if actor is null or actor.status <> 'active'
     or actor.role <> 'Maestro del Gremio' then
    raise exception 'Solo el Maestro del Gremio puede transferir el liderazgo'
      using errcode = '42501';
  end if;

  if nuevo_maestro = actor.id then
    raise exception 'Ya sos el Maestro del Gremio' using errcode = '42501';
  end if;

  select * into sucesor from public.profiles where id = nuevo_maestro;

  if sucesor is null then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;

  if sucesor.status <> 'active' then
    raise exception 'El sucesor tiene que ser un miembro activo'
      using errcode = '42501';
  end if;

  update public.profiles set role = 'Maestro del Gremio' where id = nuevo_maestro;
  update public.profiles set role = 'Mano Derecha'       where id = actor.id;

  insert into public.audit_logs (actor_id, actor_name, action, target_id, target_type, details)
  values (actor.id, actor.name::text, 'leadership_transferred',
          nuevo_maestro::text, 'user',
          jsonb_build_object(
            'sucesor', sucesor.name::text,
            'saliente', actor.name::text,
            'rol_saliente', 'Mano Derecha'
          ));
end;
$$;

revoke execute on function public.transferir_liderazgo(uuid) from public, anon;
grant  execute on function public.transferir_liderazgo(uuid) to authenticated;
