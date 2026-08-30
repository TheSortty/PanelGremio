-- =============================================================================
-- Stats de ítems, encantamientos, y iconos calculados
--
-- DOS CAMBIOS DE FONDO
--
-- 1. Se guardan las estadísticas de combate que el dump ya traía y estábamos
--    tirando: poder de ítem, tier, armadura, resistencias, bonificaciones.
--
-- 2. Se elimina `icon_url` de items y spells.
--
--    Era dato derivado: la URL siempre es el id metido en una plantilla. Al
--    guardarla congelada perdíamos poder pedir la misma imagen en otro tamaño
--    (un icono de 40 px estaba bajando 80 KB) o con encantamiento aplicado.
--    Ahora la calcula la aplicación con urlIconoItem() / urlIconoHechizo(),
--    que reciben tamaño y nivel de encantamiento.
--
--    Además arregla un error real: para los hechizos se estaba guardando el
--    endpoint armado con `@uisprite`, cuando el que responde es el que usa
--    `@uniquename`. Medido sobre los hechizos que un ítem referencia:
--    16/16 responden 200 con uniquename, 1/16 con uisprite. Todos los iconos
--    de habilidades estaban rotos.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- items: stats
-- ----------------------------------------------------------------------------

alter table public.items
  add column tier         smallint,
  add column item_power   integer,
  add column two_handed   boolean not null default false,
  -- {"1": 800, "2": 900, "3": 1000} — poder de ítem por nivel de encantamiento.
  add column enchantments jsonb   not null default '{}'::jsonb,
  -- Solo las stats no nulas del ítem. Ver scripts/lib/albion.ts para las claves.
  add column stats        jsonb   not null default '{}'::jsonb;

comment on column public.items.item_power is
  'Poder de ítem base, sin encantar. Es el único valor que el dump completa para todos los ítems.';
comment on column public.items.stats is
  'Stats declaradas y distintas de cero. OJO: el dump no trae las fórmulas de escalado, así que muchos slots (casco, botas) declaran cero en todo salvo item_power. No sirven para calcular totales de combate.';
comment on column public.items.two_handed is
  'Un arma a dos manos ocupa también la mano secundaria: la interfaz bloquea ese slot.';

-- El selector filtra por tipo y tier a la vez.
create index items_type_tier_idx on public.items (type, tier);

-- ----------------------------------------------------------------------------
-- Se van las URLs guardadas
-- ----------------------------------------------------------------------------

alter table public.items  drop column icon_url;
alter table public.spells drop column icon_url;

-- ----------------------------------------------------------------------------
-- hechizos_de_item ya no devuelve icon_url
-- ----------------------------------------------------------------------------

drop function if exists public.hechizos_de_item(text);

create or replace function public.hechizos_de_item(item text)
returns table (
  slot       public.spell_slot,
  id         text,
  name       text,
  "position" smallint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select isp.slot, s.id, s.name, isp.position
  from public.item_spells isp
  join public.spells s on s.id = isp.spell_id
  where isp.item_id = item
  order by isp.slot, isp.position;
$$;

revoke execute on function public.hechizos_de_item(text) from public, anon;
grant  execute on function public.hechizos_de_item(text) to authenticated;
