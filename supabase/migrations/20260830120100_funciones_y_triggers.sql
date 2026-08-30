-- =============================================================================
-- Funciones de apoyo, triggers y RPCs con privilegios
--
-- Regla que se sigue en todo este archivo: cada función SECURITY DEFINER vive
-- en el esquema `private` (no expuesto) o revoca EXECUTE de los roles públicos,
-- fija `search_path = ''` y comprueba la identidad de quien la llama en el
-- cuerpo. Una SECURITY DEFINER en `public` sin revoke es un endpoint público:
-- Postgres otorga EXECUTE a PUBLIC por defecto en toda función nueva.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Helpers de rol para las políticas RLS
--
-- Son SECURITY DEFINER porque necesitan leer `profiles` sin quedar atrapadas
-- en el RLS de la propia `profiles` (que a su vez las usaría: recursión).
-- Viven en `private`, que no se expone por la Data API.
-- ----------------------------------------------------------------------------

create or replace function private.rol_actual()
returns public.guild_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function private.es_miembro_activo()
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
  );
$$;

-- Puede gestionar usuarios (aprobar, cambiar roles, eliminar).
create or replace function private.es_admin()
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
      and p.role in ('Maestro del Gremio', 'Mano Derecha')
  );
$$;

-- Puede VER métricas y auditoría, pero no gestionar usuarios.
--
-- Esta separación arregla la incoherencia de la versión anterior: el front
-- dejaba entrar a 'Oficial' a las pantallas de admin, pero el backend solo
-- autorizaba 'Maestro del Gremio' y 'Mano Derecha', así que un Oficial veía
-- la pantalla y recibía 403 en cada llamada.
create or replace function private.es_oficial()
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
      and p.role in ('Maestro del Gremio', 'Mano Derecha', 'Oficial')
  );
$$;

revoke execute on function private.rol_actual()        from public, anon, authenticated;
revoke execute on function private.es_miembro_activo() from public, anon, authenticated;
revoke execute on function private.es_admin()          from public, anon, authenticated;
revoke execute on function private.es_oficial()        from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Alta automática de perfil al crearse un usuario en auth.users
--
-- Cubre los tres caminos de login por igual (contraseña, Discord, Steam):
-- el perfil siempre nace 'pending'/'Invitado' y necesita aprobación de un
-- admin, sin importar por dónde entró.
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
  -- Orden de preferencia para el nombre visible. Ojo: raw_user_meta_data lo
  -- controla el usuario, así que sirve para mostrar pero NUNCA para autorizar.
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

  -- El nombre es unique; si ya existe le agregamos sufijo en vez de reventar
  -- el alta del usuario (que dejaría una cuenta de auth sin perfil).
  nombre_final := nombre_base;
  while exists (select 1 from public.profiles p where p.name = nombre_final::citext) loop
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- updated_at automático en builds
-- ----------------------------------------------------------------------------

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger builds_set_updated_at
  before update on public.builds
  for each row
  execute function public.tocar_updated_at();

-- ----------------------------------------------------------------------------
-- Heartbeat de actividad
--
-- Actualiza last_seen y, como mucho una vez por hora y por usuario, deja un
-- registro en activity_logs. Ese rate limit evita inflar la tabla con una fila
-- por navegación: para las métricas de "a qué hora se conecta la gente" la
-- granularidad horaria alcanza.
-- ----------------------------------------------------------------------------

create or replace function public.registrar_actividad()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    return;
  end if;

  update public.profiles
  set last_seen = now()
  where id = uid;

  if not exists (
    select 1
    from public.activity_logs a
    where a.profile_id = uid
      and a.occurred_at > now() - interval '1 hour'
  ) then
    insert into public.activity_logs (profile_id) values (uid);
  end if;
end;
$$;

revoke execute on function public.registrar_actividad() from public, anon;
grant  execute on function public.registrar_actividad() to authenticated;

-- ----------------------------------------------------------------------------
-- Gestión de usuarios (solo admin)
--
-- Cambiar rol y estado va por RPC en vez de UPDATE directo. Así el permiso de
-- UPDATE sobre `profiles` se puede limitar a nivel columna (nombre y avatar),
-- y no hay forma de que alguien se auto-ascienda a Maestro del Gremio con un
-- PATCH a su propia fila. El audit log queda en la misma transacción.
-- ----------------------------------------------------------------------------

create or replace function public.admin_cambiar_rol(
  usuario_id uuid,
  nuevo_rol  public.guild_role
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor    public.profiles;
  anterior public.profiles;
  after    public.profiles;
begin
  select * into actor from public.profiles where id = (select auth.uid());

  if actor is null or actor.status <> 'active'
     or actor.role not in ('Maestro del Gremio', 'Mano Derecha') then
    raise exception 'No autorizado: se requiere rol de administrador'
      using errcode = '42501';
  end if;

  select * into anterior from public.profiles where id = usuario_id;
  if anterior is null then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;

  if usuario_id = actor.id then
    raise exception 'No podés cambiar tu propio rol' using errcode = '42501';
  end if;

  -- Solo el Maestro del Gremio puede crear otro Maestro del Gremio o tocar a uno.
  if (nuevo_rol = 'Maestro del Gremio' or anterior.role = 'Maestro del Gremio')
     and actor.role <> 'Maestro del Gremio' then
    raise exception 'Solo el Maestro del Gremio puede asignar o modificar ese rol'
      using errcode = '42501';
  end if;

  update public.profiles set role = nuevo_rol where id = usuario_id
  returning * into after;

  if anterior.role is distinct from after.role then
    insert into public.audit_logs (actor_id, actor_name, action, target_id, target_type, details)
    values (
      actor.id, actor.name::text, 'user_role_changed',
      usuario_id::text, 'user',
      jsonb_build_object('de', anterior.role, 'a', after.role, 'usuario', after.name::text)
    );
  end if;

  return after;
end;
$$;

create or replace function public.admin_cambiar_estado(
  usuario_id   uuid,
  nuevo_estado public.user_status
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor    public.profiles;
  anterior public.profiles;
  after    public.profiles;
begin
  select * into actor from public.profiles where id = (select auth.uid());

  if actor is null or actor.status <> 'active'
     or actor.role not in ('Maestro del Gremio', 'Mano Derecha') then
    raise exception 'No autorizado: se requiere rol de administrador'
      using errcode = '42501';
  end if;

  select * into anterior from public.profiles where id = usuario_id;
  if anterior is null then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;

  if usuario_id = actor.id then
    raise exception 'No podés cambiar tu propio estado' using errcode = '42501';
  end if;

  if anterior.role = 'Maestro del Gremio' and actor.role <> 'Maestro del Gremio' then
    raise exception 'Solo el Maestro del Gremio puede modificar a otro Maestro del Gremio'
      using errcode = '42501';
  end if;

  update public.profiles set status = nuevo_estado where id = usuario_id
  returning * into after;

  -- Al aprobar a alguien que sigue en 'Invitado', se lo promueve a 'Miembro'.
  -- Antes había que hacer dos pasos y era fácil dejar gente activa sin permisos.
  if nuevo_estado = 'active' and after.role = 'Invitado' then
    update public.profiles set role = 'Miembro' where id = usuario_id
    returning * into after;
  end if;

  if anterior.status is distinct from after.status then
    insert into public.audit_logs (actor_id, actor_name, action, target_id, target_type, details)
    values (
      actor.id, actor.name::text, 'user_status_changed',
      usuario_id::text, 'user',
      jsonb_build_object('de', anterior.status, 'a', after.status, 'usuario', after.name::text)
    );
  end if;

  return after;
end;
$$;

create or replace function public.admin_eliminar_usuario(usuario_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor    public.profiles;
  objetivo public.profiles;
begin
  select * into actor from public.profiles where id = (select auth.uid());

  if actor is null or actor.status <> 'active'
     or actor.role not in ('Maestro del Gremio', 'Mano Derecha') then
    raise exception 'No autorizado: se requiere rol de administrador'
      using errcode = '42501';
  end if;

  if usuario_id = actor.id then
    raise exception 'No podés eliminar tu propia cuenta' using errcode = '42501';
  end if;

  select * into objetivo from public.profiles where id = usuario_id;
  if objetivo is null then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;

  if objetivo.role = 'Maestro del Gremio' then
    raise exception 'No se puede eliminar al Maestro del Gremio' using errcode = '42501';
  end if;

  insert into public.audit_logs (actor_id, actor_name, action, target_id, target_type, details)
  values (
    actor.id, actor.name::text, 'user_deleted',
    usuario_id::text, 'user',
    jsonb_build_object('usuario', objetivo.name::text)
  );

  -- Borrar de auth.users cascadea a profiles, y de ahí a builds y activity_logs.
  -- audit_logs sobrevive porque actor_id es ON DELETE SET NULL y actor_name
  -- guarda el nombre.
  delete from auth.users where id = usuario_id;
end;
$$;

revoke execute on function public.admin_cambiar_rol(uuid, public.guild_role)     from public, anon;
revoke execute on function public.admin_cambiar_estado(uuid, public.user_status) from public, anon;
revoke execute on function public.admin_eliminar_usuario(uuid)                   from public, anon;

grant execute on function public.admin_cambiar_rol(uuid, public.guild_role)     to authenticated;
grant execute on function public.admin_cambiar_estado(uuid, public.user_status) to authenticated;
grant execute on function public.admin_eliminar_usuario(uuid)                   to authenticated;

-- ----------------------------------------------------------------------------
-- Hechizos disponibles para un ítem
--
-- El endpoint viejo leía el JSON crudo de spellSlots y repartía los hechizos
-- por posición en el array. Ahora los slots ya están resueltos en item_spells
-- y esto es una lectura directa.
-- ----------------------------------------------------------------------------

-- "position" va entre comillas: en Postgres es palabra clave de tipo col_name
-- y, aunque sirve como nombre de columna en un CREATE TABLE, no se acepta sin
-- comillas en la lista de un RETURNS TABLE.
create or replace function public.hechizos_de_item(item text)
returns table (
  slot       public.spell_slot,
  id         text,
  name       text,
  icon_url   text,
  "position" smallint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select isp.slot, s.id, s.name, s.icon_url, isp.position
  from public.item_spells isp
  join public.spells s on s.id = isp.spell_id
  where isp.item_id = item
  order by isp.slot, isp.position;
$$;

revoke execute on function public.hechizos_de_item(text) from public, anon;
grant  execute on function public.hechizos_de_item(text) to authenticated;
