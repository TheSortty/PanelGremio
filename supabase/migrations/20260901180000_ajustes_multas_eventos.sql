-- ----------------------------------------------------------------------------
-- Ajustes del gremio, multas y eventos.
--
-- Son tres cosas distintas en una sola migración porque las tres nacen de la
-- misma decisión: que el panel sea el lugar donde se cargan los datos y Discord
-- el lugar donde se anuncian, y no al revés.
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- 1. Ajustes
--
-- Una sola fila. El killboard necesita saber a qué gremio de Albion mirar, y
-- eso no puede estar en el código: el nombre del gremio es un dato del gremio,
-- no del programa. Buscarlo en la API tampoco alcanza —hay gremios con nombres
-- parecidos— así que se guarda el id que devuelve la búsqueda.
--
-- El truco de `id boolean primary key default true check (id)` fuerza que exista
-- como mucho una fila: cualquier segundo insert choca contra la clave. Es
-- preferible a una tabla clave-valor, donde cada ajuste sería texto y habría
-- que convertirlo a mano en cada lectura.
-- ----------------------------------------------------------------------------

create table public.ajustes (
  id                 boolean primary key default true check (id),

  -- Identificación en Albion. El id sale de la búsqueda de la API; el nombre se
  -- guarda al lado solo para mostrarlo sin volver a consultar.
  albion_guild_id    text check (albion_guild_id is null or length(albion_guild_id) <= 64),
  albion_guild_name  text check (albion_guild_name is null or length(albion_guild_name) <= 120),

  -- 'americas' | 'europe' | 'asia'. Cada región es un mundo aparte: el mismo
  -- nombre de gremio puede existir en las tres y no ser el mismo gremio.
  region             text not null default 'americas'
                     check (region in ('americas', 'europe', 'asia')),

  actualizado_en     timestamptz not null default now(),
  actualizado_por    uuid references public.profiles(id) on delete set null
);

comment on table public.ajustes is
  'Configuración del gremio. Una sola fila, forzada por la clave booleana.';

insert into public.ajustes (id) values (true) on conflict do nothing;

alter table public.ajustes enable row level security;
grant select on public.ajustes to authenticated;
grant update on public.ajustes to authenticated;

create policy "todos leen los ajustes"
  on public.ajustes for select
  to authenticated
  using ((select private.es_miembro_activo()));

create policy "solo el admin cambia los ajustes"
  on public.ajustes for update
  to authenticated
  using ((select private.es_admin()))
  with check ((select private.es_admin()));


-- ----------------------------------------------------------------------------
-- 2. Multas
--
-- Hoy viven en un canal de Discord. Un registro de sanciones tiene que poder
-- consultarse y auditarse: en un chat, a los tres meses alguien dice "yo nunca
-- vi eso" y no hay forma de resolverlo. Acá cada multa tiene autor, fecha,
-- motivo y estado, y el historial de decisiones queda además en audit_logs.
-- ----------------------------------------------------------------------------

create type public.estado_multa as enum ('pendiente', 'pagada', 'perdonada');

create table public.fines (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,

  -- En plata del juego. Puede ser 0: hay sanciones que son solo una
  -- advertencia registrada, y borrarlas del registro sería perder el
  -- antecedente.
  monto       bigint not null default 0 check (monto >= 0),

  motivo      text not null check (length(trim(motivo)) between 3 and 500),
  estado      public.estado_multa not null default 'pendiente',

  -- Quién la puso. Se conserva aunque el oficial se vaya del gremio.
  emitida_por uuid references public.profiles(id) on delete set null,
  emitida_en  timestamptz not null default now(),
  saldada_en  timestamptz,

  -- Coherencia entre estado y fecha: una multa saldada tiene cuándo, y una
  -- pendiente no puede tenerlo.
  constraint saldada_con_fecha check (
    (estado = 'pendiente' and saldada_en is null)
    or (estado <> 'pendiente' and saldada_en is not null)
  )
);

comment on table public.fines is
  'Multas del gremio. Reemplaza al canal de Discord: consultable y con autor.';

create index fines_por_miembro_idx on public.fines (profile_id, emitida_en desc);
create index fines_pendientes_idx  on public.fines (emitida_en desc)
  where estado = 'pendiente';

alter table public.fines enable row level security;
grant select, insert, update, delete on public.fines to authenticated;

/*
  Cada uno ve las suyas; los oficiales ven todas.

  Que un miembro vea su propia multa no es un detalle: si no la ve, tiene que
  preguntar en el chat, y volvemos al problema que esto viene a resolver.
*/
create policy "ve las suyas, el oficial todas"
  on public.fines for select
  to authenticated
  using (
    profile_id = (select auth.uid()) or (select private.es_oficial())
  );

create policy "el oficial pone multas"
  on public.fines for insert
  to authenticated
  with check ((select private.es_oficial()));

create policy "el oficial las modifica"
  on public.fines for update
  to authenticated
  using ((select private.es_oficial()))
  with check ((select private.es_oficial()));

-- Borrar es distinto de perdonar: perdonar deja el antecedente, borrar lo
-- desaparece. Por eso solo el admin puede.
create policy "solo el admin las borra"
  on public.fines for delete
  to authenticated
  using ((select private.es_admin()));


-- ----------------------------------------------------------------------------
-- 3. Eventos
--
-- El panel mostraba "ZvZ — mañana 18:00 UTC" escrito a mano en el código. Esto
-- lo reemplaza con eventos de verdad y con confirmación de asistencia, que es
-- el dato que a un caller le importa antes de armar la composición.
-- ----------------------------------------------------------------------------

create type public.tipo_evento as enum (
  'ZvZ', 'GvG', 'Mazmorra', 'Recolección', 'Faction', 'Otro'
);

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null check (length(trim(titulo)) between 3 and 140),
  tipo        public.tipo_evento not null default 'Otro',
  descripcion text check (descripcion is null or length(descripcion) <= 4000),

  -- Con zona horaria: el gremio juega desde varios husos y "18:00" a secas es
  -- ambiguo. El navegador lo muestra en la hora de cada uno.
  comienza_en timestamptz not null,

  -- Dónde se junta la gente. Texto libre: puede ser una ciudad, un portal o un
  -- canal de voz.
  lugar       text check (lugar is null or length(lugar) <= 120),

  -- Poder de ítem mínimo sugerido. Null = sin requisito.
  ip_minimo   int check (ip_minimo is null or ip_minimo between 0 and 2000),

  creado_por  uuid references public.profiles(id) on delete set null,
  creado_en   timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.events is
  'Eventos del gremio con confirmación de asistencia. Reemplaza al ZvZ fijo '
  'que estaba escrito en el código del panel.';

create index events_proximos_idx on public.events (comienza_en desc);

create trigger events_actualizado_en
  before update on public.events
  for each row
  execute function public.tocar_updated_at();

alter table public.events enable row level security;
grant select, insert, update, delete on public.events to authenticated;

create policy "miembros activos ven eventos"
  on public.events for select
  to authenticated
  using ((select private.es_miembro_activo()));

create policy "el oficial crea eventos"
  on public.events for insert
  to authenticated
  with check ((select private.es_oficial()) and creado_por = (select auth.uid()));

create policy "autor u oficial edita el evento"
  on public.events for update
  to authenticated
  using (creado_por = (select auth.uid()) or (select private.es_oficial()))
  with check (creado_por = (select auth.uid()) or (select private.es_oficial()));

create policy "autor u oficial borra el evento"
  on public.events for delete
  to authenticated
  using (creado_por = (select auth.uid()) or (select private.es_oficial()));


-- Asistencia
create type public.respuesta_evento as enum ('voy', 'quizas', 'no_voy');

create table public.event_attendance (
  event_id   uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  respuesta  public.respuesta_evento not null,

  -- Con qué rol piensa ir. Ayuda al caller a ver si le faltan sanadores antes
  -- de que empiece, que es justamente para lo que sirve confirmar.
  rol        text check (rol is null or length(rol) <= 60),

  respondido_en timestamptz not null default now(),

  primary key (event_id, profile_id)
);

comment on table public.event_attendance is
  'Quién confirma a cada evento y con qué rol. La clave compuesta hace que '
  'cambiar la respuesta actualice la fila en vez de agregar otra.';

alter table public.event_attendance enable row level security;
grant select, insert, update, delete on public.event_attendance to authenticated;

create policy "miembros activos ven la asistencia"
  on public.event_attendance for select
  to authenticated
  using ((select private.es_miembro_activo()));

-- Cada uno responde por sí mismo. Nadie anota a otro.
create policy "cada uno confirma la suya"
  on public.event_attendance for insert
  to authenticated
  with check (
    (select private.es_miembro_activo()) and profile_id = (select auth.uid())
  );

create policy "cada uno cambia la suya"
  on public.event_attendance for update
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "cada uno retira la suya"
  on public.event_attendance for delete
  to authenticated
  using (profile_id = (select auth.uid()) or (select private.es_oficial()));
