-- ----------------------------------------------------------------------------
-- limpiar_mapa() fallaba siempre: "DELETE requires a WHERE clause"
--
-- Supabase deja `sql_safe_updates` activo para el rol `authenticated`, una red
-- de seguridad que rechaza cualquier DELETE o UPDATE sin WHERE. Ese ajuste es
-- de sesión y NO lo cambia el `security definer`: la función se ejecuta con los
-- privilegios del dueño, pero con los GUC de quien la llama.
--
-- Así que este DELETE, que borra el mapa entero a propósito, chocaba con la
-- protección. La migración original aplicó sin problema porque plpgsql compila
-- el cuerpo la primera vez que se ejecuta, no al crearlo.
--
-- El arreglo es un `where true`: expresa la misma intención (borrar todo) de
-- forma explícita, que es justamente lo que sql_safe_updates quiere obligar a
-- escribir. Se prefiere a apagar el ajuste con `set local`, porque desactivar
-- una protección para toda la función también taparía un futuro DELETE sin
-- WHERE que sí fuera un error.
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

  with eliminados as (delete from public.map_markers where true returning 1)
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
