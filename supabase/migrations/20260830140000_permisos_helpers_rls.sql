-- =============================================================================
-- Permisos de ejecución para los helpers de RLS
--
-- EL PROBLEMA
--
-- La migración inicial revocaba EXECUTE sobre private.es_miembro_activo(),
-- es_admin(), es_oficial() y rol_actual() a todos los roles públicos, con la
-- idea de que nadie pudiera invocarlas.
--
-- Pero las expresiones de una política RLS se evalúan con los privilegios del
-- rol que hace la consulta, no del dueño de la tabla. Sin EXECUTE, cualquier
-- consulta que pasara por una de esas políticas moría con
-- "permission denied for function es_miembro_activo".
--
-- El efecto era silencioso y amplio: guild_members devolvía vacío, la
-- auditoría devolvía vacío, y crear una build fallaba con un 42501 que parecía
-- una denegación de RLS legítima. Todo el panel quedaba en blanco para
-- cualquiera que no fuera service_role.
--
-- LA CORRECCIÓN
--
-- Se otorga EXECUTE a `authenticated`. Esto NO abre las funciones al exterior:
-- viven en el esquema `private`, que no está entre los esquemas expuestos por
-- la Data API, así que no existe /rest/v1/rpc/es_admin. Solo son alcanzables
-- desde adentro de las políticas.
--
-- Y aunque un usuario pudiera llamarlas, cada una resuelve su respuesta a
-- partir de (select auth.uid()): lo único que devuelven es información sobre
-- quien pregunta.
--
-- A `anon` no se le otorga nada: no tiene GRANT sobre ninguna tabla y todas
-- las políticas apuntan a `authenticated`.
-- =============================================================================

grant usage on schema private to authenticated;

grant execute on function private.rol_actual()        to authenticated;
grant execute on function private.es_miembro_activo() to authenticated;
grant execute on function private.es_admin()          to authenticated;
grant execute on function private.es_oficial()        to authenticated;
