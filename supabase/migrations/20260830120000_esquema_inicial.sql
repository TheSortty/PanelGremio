-- =============================================================================
-- Panel del Gremio — esquema inicial
-- Migración desde el schema Prisma/MySQL original a Postgres/Supabase.
--
-- Cambios de fondo respecto del schema viejo:
--   * `role` y `status` pasan de String libre a enums (antes cualquier string
--     entraba en la base y el front asumía que era válido).
--   * Se elimina la columna `online`: nunca se actualizaba, así que siempre
--     era false. Ahora se deriva de `last_seen` (ver vista `guild_members`).
--   * Se agrega `item_spells`: el backend viejo adivinaba el slot de cada
--     hechizo por posición en el array (`index < 3 -> Q`). Ahora el slot real
--     se resuelve una vez, al sembrar, y queda guardado.
--   * Se agrega `ai_guide` a builds: antes la guía se generaba y se perdía.
--   * Se agrega `map_markers`: antes los marcadores del mapa eran estado local
--     de React y desaparecían al recargar.
-- =============================================================================

create extension if not exists citext;
create extension if not exists pg_trgm;

-- Esquema privado para funciones de apoyo de las políticas RLS.
-- No se expone por la Data API, así que nada de acá es invocable desde el cliente.
create schema if not exists private;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type public.guild_role as enum (
  'Maestro del Gremio',
  'Mano Derecha',
  'Oficial',
  'Miembro',
  'Iniciado',
  'Invitado'
);

create type public.user_status as enum ('pending', 'active', 'rejected');

create type public.item_type as enum (
  'weapon', 'offhand', 'helmet', 'chest', 'boots', 'cape',
  'potion', 'food', 'mount', 'bag', 'tool', 'other'
);

create type public.spell_slot as enum ('Q', 'W', 'E', 'Passive');

create type public.marker_type as enum ('transport', 'gank', 'objective');

-- ----------------------------------------------------------------------------
-- profiles — datos de gremio de cada usuario de auth.users
--
-- Las credenciales viven en auth.users (gestionado por Supabase Auth).
-- Acá va solo lo del dominio: nombre de personaje, rol y estado de aprobación.
-- ----------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        citext not null unique,
  avatar_url  text,
  role        public.guild_role  not null default 'Invitado',
  status      public.user_status not null default 'pending',
  steam_id    text unique,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),

  constraint profiles_name_no_vacio check (length(trim(name::text)) between 2 and 40)
);

comment on table public.profiles is
  'Perfil de gremio. 1:1 con auth.users. El registro entra como pending/Invitado y un admin lo aprueba.';
comment on column public.profiles.steam_id is
  'SteamID64, cuando el usuario vinculó Steam. El login por Steam lo resuelve /auth/steam/callback.';

create index profiles_status_idx    on public.profiles (status);
create index profiles_role_idx      on public.profiles (role);
create index profiles_last_seen_idx on public.profiles (last_seen desc);

-- ----------------------------------------------------------------------------
-- builds
-- ----------------------------------------------------------------------------

create table public.builds (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null,
  description text,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  equipment   jsonb not null default '{}'::jsonb,
  consumables jsonb not null default '{}'::jsonb,
  abilities   jsonb not null default '{}'::jsonb,
  ai_guide    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint builds_title_no_vacio check (length(trim(title)) between 1 and 120),
  constraint builds_equipment_es_objeto   check (jsonb_typeof(equipment) = 'object'),
  constraint builds_consumables_es_objeto check (jsonb_typeof(consumables) = 'object'),
  constraint builds_abilities_es_objeto   check (jsonb_typeof(abilities) = 'object')
);

comment on column public.builds.ai_guide is
  'Guía generada por IA, cacheada. En la versión anterior se generaba en cada visita y no se guardaba.';

-- FK indexada: Postgres no lo hace solo y sin esto el JOIN con el autor escanea la tabla.
create index builds_author_id_idx  on public.builds (author_id);
create index builds_category_idx   on public.builds (category);
create index builds_created_at_idx on public.builds (created_at desc);

-- ----------------------------------------------------------------------------
-- audit_logs
--
-- actor_name se guarda desnormalizado a propósito: es una foto del nombre al
-- momento del hecho. Si después el usuario se renombra o se borra, el registro
-- histórico tiene que seguir diciendo quién lo hizo.
-- ----------------------------------------------------------------------------

create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  actor_name  text not null,
  action      text not null,
  target_id   text,
  target_type text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_id_idx   on public.audit_logs (actor_id);

-- ----------------------------------------------------------------------------
-- activity_logs — un registro por conexión, alimenta la página de Métricas
--
-- En la versión anterior esta tabla existía pero NADIE escribía en ella:
-- las métricas siempre estaban vacías. Ahora se escribe en cada login
-- (ver public.registrar_actividad).
-- ----------------------------------------------------------------------------

create table public.activity_logs (
  id         bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  occurred_at timestamptz not null default now()
);

create index activity_logs_profile_id_idx  on public.activity_logs (profile_id);
create index activity_logs_occurred_at_idx on public.activity_logs (occurred_at desc);

-- ----------------------------------------------------------------------------
-- items / spells — datos de referencia de Albion, se cargan con los seeds
-- ----------------------------------------------------------------------------

create table public.items (
  id       text primary key,
  name     text not null,
  type     public.item_type not null,
  icon_url text not null
);

-- Filtrar por tipo y buscar por nombre es la consulta caliente del selector de
-- ítems. El índice compuesto cubre el filtro, el trigrama cubre el ILIKE.
create index items_type_idx      on public.items (type);
create index items_name_trgm_idx on public.items using gin (name gin_trgm_ops);

create table public.spells (
  id       text primary key,
  name     text not null,
  icon_url text not null
);

-- Slots resueltos ítem -> hechizo.
-- Reemplaza al agrupado por índice del backend viejo, que era una adivinanza.
create table public.item_spells (
  item_id  text not null references public.items (id) on delete cascade,
  spell_id text not null references public.spells (id) on delete cascade,
  slot     public.spell_slot not null,
  position smallint not null,

  primary key (item_id, slot, position)
);

create index item_spells_item_id_idx  on public.item_spells (item_id);
create index item_spells_spell_id_idx on public.item_spells (spell_id);

-- ----------------------------------------------------------------------------
-- map_markers — antes era estado de React y se perdía al recargar
-- ----------------------------------------------------------------------------

create table public.map_markers (
  id         uuid primary key default gen_random_uuid(),
  x          double precision not null,
  y          double precision not null,
  type       public.marker_type not null,
  label      text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),

  constraint map_markers_x_en_rango check (x >= 0 and x <= 100),
  constraint map_markers_y_en_rango check (y >= 0 and y <= 100)
);

create index map_markers_created_by_idx on public.map_markers (created_by);

-- ----------------------------------------------------------------------------
-- Vista de miembros del gremio
--
-- `online` se calcula acá en vez de guardarse. La columna booleana anterior
-- nunca se actualizaba, así que siempre valía false.
-- security_invoker: la vista respeta el RLS de quien la consulta, no el del
-- dueño. Sin esto, una vista es un agujero que saltea RLS.
-- ----------------------------------------------------------------------------

create view public.guild_members
with (security_invoker = true) as
select
  p.id,
  p.name,
  p.avatar_url,
  p.role,
  p.last_seen,
  (p.last_seen > now() - interval '5 minutes') as online
from public.profiles p
where p.status = 'active';

comment on view public.guild_members is
  'Miembros aprobados. `online` se deriva de last_seen (heartbeat de 5 minutos).';
