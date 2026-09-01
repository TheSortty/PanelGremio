-- ----------------------------------------------------------------------------
-- Solicitudes de ingreso.
--
-- QUÉ REEMPLAZA
--
-- Hoy el postulante copia una plantilla en un canal de Discord y la rellena a
-- mano. Eso trae tres problemas que un formulario resuelve solos: la gente
-- borra campos o los contesta a medias, las respuestas quedan sueltas en un
-- hilo que se pierde con el scroll, y no hay forma de buscar "quién juega de
-- sanador en horario de noche" sin leer todo de nuevo.
--
-- Acá cada campo es una columna, así que la solicitud llega completa o no
-- llega, queda atada al usuario que la mandó, y se puede consultar.
--
-- LOS CAMPOS SON LOS DE LA PLANTILLA
--
-- Se respetan uno a uno los que pide el gremio hoy. No se agregan preguntas
-- nuevas: si la plantilla cambia, cambia acá.
--
-- POR QUÉ UNA TABLA APARTE Y NO COLUMNAS EN profiles
--
-- Una solicitud es un trámite con su propio ciclo —se envía, se revisa, se
-- resuelve— y deja de ser interesante una vez resuelta. El perfil, en cambio,
-- vive mientras el miembro esté en el gremio. Mezclarlos llenaría profiles de
-- columnas que solo importan el primer día, y obligaría a decidir qué hacer
-- con ellas cuando alguien se va y vuelve.
-- ----------------------------------------------------------------------------

create type public.dispositivo_juego as enum ('PC', 'Móvil', 'Tablet');
create type public.tipo_cuenta as enum ('primera', 'segunda');

create table public.applications (
  id            uuid primary key default gen_random_uuid(),

  -- Una solicitud por persona. Si la rechazan y vuelve a postularse, se
  -- actualiza la misma fila: el historial de decisiones va en audit_logs.
  profile_id    uuid not null unique
                references public.profiles(id) on delete cascade,

  edad          int not null check (edad between 13 and 99),
  horario       text not null check (length(trim(horario)) between 2 and 200),
  dispositivo   public.dispositivo_juego not null,

  -- Puede no haber gremio anterior: es el primer gremio de mucha gente.
  gremio_anterior text check (gremio_anterior is null or length(gremio_anterior) <= 120),

  cuenta        public.tipo_cuenta not null,

  -- Rol DENTRO del juego (tanque, sanador…), no el rango en el gremio. Se
  -- nombran distinto a propósito para que nadie los confunda con guild_role.
  rol_juego_principal  text not null check (length(trim(rol_juego_principal)) between 2 and 60),
  rol_juego_secundario text check (rol_juego_secundario is null or length(rol_juego_secundario) <= 60),

  quien_lo_trajo text check (quien_lo_trajo is null or length(quien_lo_trajo) <= 120),

  -- PvP / PvE / Crafter / Farmer. Se admite más de uno porque casi nadie hace
  -- una sola cosa, y saber que alguien farmea Y pelea cambia dónde ubicarlo.
  contenido     text[] not null default '{}'
                check (array_length(contenido, 1) between 1 and 4),

  -- Rutas dentro del bucket `solicitudes`. El gremio rechaza las solicitudes
  -- sin capturas, así que las dos son obligatorias.
  captura_stats  text not null,
  captura_perfil text not null,

  -- Contacto de Discord, para que el reclutador sepa a quién escribirle.
  discord       text check (discord is null or length(discord) <= 60),

  enviada_en    timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

comment on table public.applications is
  'Solicitud de ingreso. Reemplaza a la plantilla que hoy se copia a mano en '
  'Discord: mismos campos, pero completos, atados al usuario y consultables.';

create index applications_enviadas_idx on public.applications (enviada_en desc);

-- La función existente, tocar_updated_at, escribe en una columna `updated_at`
-- que acá no existe. Se hace una propia en vez de renombrar la columna:
-- `actualizada_en` acompaña al vocabulario del resto de esta tabla.
create or replace function public.tocar_actualizada_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizada_en := now();
  return new;
end;
$$;

create trigger applications_actualizada_en
  before update on public.applications
  for each row
  execute function public.tocar_actualizada_en();

-- ----------------------------------------------------------------------------
-- RLS
--
-- Un postulante está en estado 'pending', así que NO pasa es_miembro_activo().
-- Por eso las políticas de acá se escriben contra auth.uid() directo: es la
-- única tabla del proyecto que tiene que dejar escribir a alguien que todavía
-- no es miembro. Es exactamente para eso que existe.
-- ----------------------------------------------------------------------------

alter table public.applications enable row level security;

grant select, insert, update on public.applications to authenticated;

create policy "cada uno ve su solicitud"
  on public.applications for select
  to authenticated
  using (profile_id = (select auth.uid()) or (select private.es_admin()));

create policy "cada uno manda la suya"
  on public.applications for insert
  to authenticated
  with check (profile_id = (select auth.uid()));

-- Se puede corregir mientras no esté resuelta. Una vez aprobado, el perfil ya
-- existe y los datos se cambian desde el perfil.
create policy "se corrige mientras esté pendiente"
  on public.applications for update
  to authenticated
  using (
    profile_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.status = 'pending'
    )
  )
  with check (profile_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- Capturas
--
-- Bucket privado: son fotos de la cuenta de alguien, no van a una URL pública
-- que se pueda adivinar. Se leen con URLs firmadas de duración corta.
--
-- La convención de ruta es `{uid}/{stats|perfil}.{ext}`, y las políticas la
-- hacen cumplir: la primera carpeta del path tiene que ser el uid de quien
-- sube. Sin eso, cualquiera podría escribir sobre la carpeta de otro.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'solicitudes',
  'solicitudes',
  false,
  5 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "sube sus propias capturas"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'solicitudes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "reemplaza sus propias capturas"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'solicitudes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "ve sus capturas, y el admin todas"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'solicitudes'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.es_admin())
    )
  );
