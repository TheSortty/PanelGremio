-- ----------------------------------------------------------------------------
-- Rutas por los caminos avalonianos.
--
-- QUÉ ERA "RUTAS" HASTA ACÁ
--
-- Un mapa del continente real con chinches de colores. Servía para señalar un
-- punto —"gank acá"—, pero no para lo que la sección tenía que resolver: cómo
-- se llega rápido de un lado a otro por los caminos avalonianos.
--
-- POR QUÉ UNA CADENA Y NO UN MAPA
--
-- Los caminos avalonianos no tienen geografía estable: son mapas conectados por
-- portales que rotan y expiran. Dibujarlos sobre un plano sería inventar una
-- forma que el juego no tiene. Lo que sí es estable mientras el portal dure es
-- la SECUENCIA: entrás por acá, cruzás estos mapas, tomás estos portales, salís
-- allá. Por eso una ruta es una lista ordenada de pasos.
--
-- POR QUÉ LOS PASOS VAN EN JSONB
--
-- Una tabla hija con `position` obligaría a un unique diferible y a reordenar
-- filas para mover un paso de lugar. Los pasos siempre se leen y se escriben
-- junto con su ruta, nunca por separado, así que van en la misma fila: es el
-- mismo criterio con el que `builds` guarda el equipamiento.
-- ----------------------------------------------------------------------------

create table public.routes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 2 and 120),
  -- Desde qué mapa se entra. Es lo primero que alguien busca.
  origin      text not null check (length(trim(origin)) between 2 and 120),
  -- A dónde se sale. Puede no saberse todavía si la ruta está a medio explorar.
  destination text check (destination is null or length(trim(destination)) <= 120),
  notes       text check (notes is null or length(notes) <= 4000),
  /*
    [{ "name": "...", "kind": "portal" | "mapa" | "salida", "notes": "..." }]

    El tipo se valida en la aplicación con zod. Acá solo se exige que sea un
    arreglo: un CHECK que recorra el JSON se ejecutaría en cada escritura y
    quedaría desincronizado del schema de la aplicación a la primera adición.
  */
  steps       jsonb not null default '[]'::jsonb
              check (jsonb_typeof(steps) = 'array'),
  author_id   uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.routes is
  'Rutas por los caminos avalonianos: secuencia de mapas y portales para llegar '
  'de un lado a otro. Reemplaza al mapa de chinches del continente real.';

comment on column public.routes.steps is
  'Pasos ordenados. Cada uno: name, kind (portal|mapa|salida) y notes opcional. '
  'La cantidad de portales se cuenta desde acá, no se guarda aparte.';

create index routes_origin_idx  on public.routes (origin);
create index routes_creadas_idx on public.routes (created_at desc);

create trigger routes_updated_at
  before update on public.routes
  for each row
  execute function public.tocar_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
--
-- Mismo criterio que builds, que es el que el gremio ya conoce: la lee
-- cualquier miembro activo, la crea quien puede usar el mapa (Miembro o
-- superior: un Iniciado mira pero no escribe), y la modifica o borra su autor o
-- un Oficial.
-- ----------------------------------------------------------------------------

alter table public.routes enable row level security;

grant select, insert, update, delete on public.routes to authenticated;

create policy "miembros activos leen rutas"
  on public.routes for select
  to authenticated
  using ((select private.es_miembro_activo()));

create policy "miembros crean rutas"
  on public.routes for insert
  to authenticated
  with check (
    (select private.puede_usar_mapa())
    and author_id = (select auth.uid())
  );

create policy "autor u oficial edita ruta"
  on public.routes for update
  to authenticated
  using (author_id = (select auth.uid()) or (select private.es_oficial()))
  with check (author_id = (select auth.uid()) or (select private.es_oficial()));

create policy "autor u oficial borra ruta"
  on public.routes for delete
  to authenticated
  using (author_id = (select auth.uid()) or (select private.es_oficial()));
