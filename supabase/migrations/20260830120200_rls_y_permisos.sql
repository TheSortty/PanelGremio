-- =============================================================================
-- RLS y permisos
--
-- Dos capas distintas que hay que configurar juntas:
--   1. GRANT  -> decide si el rol puede tocar la tabla (y qué columnas).
--   2. RLS    -> decide qué FILAS ve una vez que puede tocarla.
--
-- Desde 2026 Supabase ya no expone las tablas nuevas a la Data API
-- automáticamente, así que los GRANT de acá abajo son obligatorios, no
-- decorativos.
--
-- En los USING/WITH CHECK se escribe (select auth.uid()) y no auth.uid():
-- envuelto en subconsulta, Postgres lo evalúa una vez en lugar de una vez
-- por fila.
-- =============================================================================

alter table public.profiles      enable row level security;
alter table public.builds        enable row level security;
alter table public.audit_logs    enable row level security;
alter table public.activity_logs enable row level security;
alter table public.items         enable row level security;
alter table public.spells        enable row level security;
alter table public.item_spells   enable row level security;
alter table public.map_markers   enable row level security;

-- Punto de partida: anon no toca nada. Se habilita explícitamente lo que va.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from anon;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------

-- UPDATE se otorga SOLO sobre name y avatar_url. `role` y `status` quedan fuera
-- del grant, así que ni siquiera un UPDATE directo malicioso puede tocarlos:
-- los cambia únicamente admin_cambiar_rol / admin_cambiar_estado.
grant select                     on public.profiles to authenticated;
grant update (name, avatar_url)  on public.profiles to authenticated;

-- Cada quien ve siempre su propio perfil, aunque esté pending
-- (lo necesita la pantalla de "esperando aprobación").
create policy "perfil propio visible"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Los miembros activos se ven entre sí.
create policy "miembros activos se ven entre si"
  on public.profiles for select
  to authenticated
  using (status = 'active' and (select private.es_miembro_activo()));

-- Los admins ven todo, incluidas las solicitudes pendientes.
create policy "admin ve todos los perfiles"
  on public.profiles for select
  to authenticated
  using ((select private.es_admin()));

-- USING y WITH CHECK: sin WITH CHECK, un usuario podría reasignar la fila a otro id.
create policy "editar perfil propio"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ----------------------------------------------------------------------------
-- builds
-- ----------------------------------------------------------------------------

grant select, insert, update, delete on public.builds to authenticated;

create policy "miembros activos leen builds"
  on public.builds for select
  to authenticated
  using ((select private.es_miembro_activo()));

create policy "miembros activos crean builds"
  on public.builds for insert
  to authenticated
  with check (
    (select private.es_miembro_activo())
    and author_id = (select auth.uid())
  );

create policy "autor edita su build"
  on public.builds for update
  to authenticated
  using (author_id = (select auth.uid()) or (select private.es_oficial()))
  with check (author_id = (select auth.uid()) or (select private.es_oficial()));

create policy "autor u oficial borra build"
  on public.builds for delete
  to authenticated
  using (author_id = (select auth.uid()) or (select private.es_oficial()));

-- ----------------------------------------------------------------------------
-- audit_logs — lectura para oficiales; nadie escribe directo
--
-- Sin políticas de INSERT/UPDATE/DELETE: las filas las crean únicamente las
-- funciones SECURITY DEFINER de gestión, que saltean RLS. Así el historial no
-- se puede falsear ni borrar desde el cliente.
-- ----------------------------------------------------------------------------

grant select on public.audit_logs to authenticated;

create policy "oficiales leen auditoria"
  on public.audit_logs for select
  to authenticated
  using ((select private.es_oficial()));

-- ----------------------------------------------------------------------------
-- activity_logs
-- ----------------------------------------------------------------------------

grant select on public.activity_logs to authenticated;

create policy "oficiales leen actividad"
  on public.activity_logs for select
  to authenticated
  using ((select private.es_oficial()));

create policy "actividad propia visible"
  on public.activity_logs for select
  to authenticated
  using (profile_id = (select auth.uid()));

-- Las inserciones pasan por public.registrar_actividad(), que es SECURITY DEFINER.

-- ----------------------------------------------------------------------------
-- items / spells / item_spells — datos de referencia, solo lectura
--
-- Los seeds corren con la service_role key, que saltea RLS. Por eso no hace
-- falta ninguna política de escritura acá.
-- ----------------------------------------------------------------------------

grant select on public.items       to authenticated;
grant select on public.spells      to authenticated;
grant select on public.item_spells to authenticated;

create policy "items legibles por autenticados"
  on public.items for select
  to authenticated
  using (true);

create policy "spells legibles por autenticados"
  on public.spells for select
  to authenticated
  using (true);

create policy "item_spells legibles por autenticados"
  on public.item_spells for select
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- map_markers
-- ----------------------------------------------------------------------------

grant select, insert, delete on public.map_markers to authenticated;

create policy "miembros activos ven marcadores"
  on public.map_markers for select
  to authenticated
  using ((select private.es_miembro_activo()));

create policy "miembros activos crean marcadores"
  on public.map_markers for insert
  to authenticated
  with check (
    (select private.es_miembro_activo())
    and created_by = (select auth.uid())
  );

create policy "autor u oficial borra marcador"
  on public.map_markers for delete
  to authenticated
  using (created_by = (select auth.uid()) or (select private.es_oficial()));

-- ----------------------------------------------------------------------------
-- Vista guild_members
--
-- Es security_invoker, así que hereda el RLS de public.profiles de quien
-- consulta. El grant solo la hace alcanzable.
-- ----------------------------------------------------------------------------

grant select on public.guild_members to authenticated;

-- ----------------------------------------------------------------------------
-- Tablas futuras: que no se expongan solas por descuido
-- ----------------------------------------------------------------------------

alter default privileges in schema public
  revoke all on tables from anon, authenticated;
