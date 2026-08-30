-- =============================================================================
-- Agregación de métricas en la base
--
-- La página de Métricas traía las filas crudas de activity_logs con
-- `.limit(5000)` y las agrupaba en el navegador. Dos problemas:
--
--   1. PostgREST corta las respuestas en 1000 filas (db-max-rows) y no avisa,
--      así que ese 5000 era mentira: con el tiempo los gráficos habrían
--      mostrado solo el último tramo de actividad, sin ninguna señal de que
--      faltaban datos. Es el mismo modo de falla que se comió los 11.938
--      vínculos ítem-hechizo en el seed.
--
--   2. Mandar miles de filas al navegador para contarlas es trabajo de más:
--      el resultado son 168 celdas (7 días x 24 horas) como mucho.
--
-- Ahora agrupa Postgres y devuelve, a lo sumo, esas 168 filas.
-- =============================================================================

create or replace function public.metricas_actividad(zona text default 'UTC')
returns table (
  dia         smallint,
  hora        smallint,
  conexiones  bigint,
  miembros    text[]
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  zona_valida text := zona;
begin
  -- Una zona horaria inválida haría fallar la consulta entera. Ante un valor
  -- desconocido se cae a UTC, que es lo que la interfaz rotula por defecto.
  if not exists (
    select 1 from pg_catalog.pg_timezone_names t where t.name = zona
  ) then
    zona_valida := 'UTC';
  end if;

  return query
  select
    extract(dow  from a.occurred_at at time zone zona_valida)::smallint as dia,
    extract(hour from a.occurred_at at time zone zona_valida)::smallint as hora,
    count(*)                                          as conexiones,
    array_agg(distinct p.name::text)                  as miembros
  from public.activity_logs a
  join public.profiles p on p.id = a.profile_id
  group by 1, 2
  order by 1, 2;
end;
$$;

comment on function public.metricas_actividad(text) is
  'Actividad agrupada por día de la semana y hora, en la zona horaria indicada. Máximo 168 filas.';

-- security invoker: la función respeta el RLS de activity_logs y profiles, así
-- que solo devuelve lo que quien llama ya podría leer. Igual se restringe el
-- EXECUTE, porque la página de Métricas es para oficiales.
revoke execute on function public.metricas_actividad(text) from public, anon;
grant  execute on function public.metricas_actividad(text) to authenticated;
