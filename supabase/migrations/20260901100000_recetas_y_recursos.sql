-- ----------------------------------------------------------------------------
-- Recetas de crafteo, recursos y pescado.
--
-- Hasta acá el catálogo tenía solo lo que se equipa. Para calcular si conviene
-- craftear o pescar hacen falta dos cosas más: qué lleva cada receta, y los
-- materiales, que no son equipo y por eso el seed los descartaba.
--
-- POR QUÉ VA EN LA BASE Y NO EN UN JSON DEL REPO
--
-- Los dumps del juego (data/*.json, 55 MB) están en .gitignore: se descargan
-- con `npm run data:download` y no se versionan. En Cloudflare no existen. Todo
-- lo que la aplicación necesite en tiempo de ejecución tiene que estar en la
-- base, igual que los ítems y los hechizos.
-- ----------------------------------------------------------------------------

-- Los materiales y el pescado no encajaban en ninguno de los tipos existentes.
-- Un enum admite valores nuevos sin reescribir la columna.
alter type public.item_type add value if not exists 'resource';
alter type public.item_type add value if not exists 'fish';

alter table public.items
  add column if not exists crafting jsonb;

comment on column public.items.crafting is
  'Receta: { silver, focus, amount, resources: [{ id, count }] }. Sale de '
  'craftingrequirements del dump. NULL = el ítem no se craftea.';

-- El calculador de crafteo pide "todo lo que tenga receta, de este tier".
-- Parcial: la mitad del catálogo no se craftea y no tiene sentido indexarla.
create index if not exists items_crafteables_idx
  on public.items (tier, type)
  where crafting is not null;
