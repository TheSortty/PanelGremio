-- ----------------------------------------------------------------------------
-- Marca qué ítems tienen arte y cuáles no.
--
-- Al comprobar los 7.515 iconos que el panel puede llegar a pedir aparecieron
-- 466 que el servicio de render devuelve como 404 definitivo. Mirando qué son,
-- casi todos resultaron ser cosas que no se pueden equipar en una build:
--
--     102  UNIQUE_HEAD_*        sombreros de founder pack y de starter pack
--      86  T*_CAPE_CLOTH_*      capas decorativas y estandartes de arena
--      80  UNIQUE_SHOES_*       botas de recompensa cosmética
--      16  offhand              incluye "Ocultar arma secundaria", que es un
--                               interruptor de apariencia, no un objeto
--       5  UNIQUE_MOUNT_*       monturas de prueba (…_01_TEST)
--       2  potion               prototipos del maestro de armas
--
-- Es decir: el 44 % de la lista de capas del selector eran adornos que ni
-- siquiera se dibujaban. El seed los cargaba porque el dump del juego los trae
-- mezclados con el equipo real y no hay ninguna marca que los separe.
--
-- En vez de adivinar con patrones sobre el nombre —que dejaría afuera equipo
-- legítimo y adentro adornos nuevos— se usa la evidencia: si el juego no tiene
-- arte para el objeto, el objeto no entra al planificador de builds. La columna
-- la escribe scripts/verificar-iconos.ts, que lo comprueba contra el servicio.
--
-- Se distingue el 404 (definitivo) del 502 (intermitente y frecuente en este
-- servicio); sin esa distinción la comprobación marcaría como inexistente
-- cualquier cosa que fallara una vez.
-- ----------------------------------------------------------------------------

alter table public.items
  add column if not exists icon_ok boolean not null default true;

comment on column public.items.icon_ok is
  'false = render.albiononline.com no tiene arte para este ítem (404 confirmado). '
  'Lo escribe scripts/verificar-iconos.ts. El selector de builds solo ofrece los true.';

-- El selector filtra por type + icon_ok y ordena por tier: el índice cubre
-- exactamente esa consulta.
create index if not exists items_type_icon_ok_idx
  on public.items (type, icon_ok, tier desc);
