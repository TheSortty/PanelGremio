-- ----------------------------------------------------------------------------
-- La guía de la build la escribe una persona, no un modelo.
--
-- La columna se llamaba `ai_guide` y la llenaba una llamada a Gemini. Se
-- renombra a `guide` porque el nombre de una columna describe qué guarda, no
-- quién la escribió, y ahora la escribe el autor de la build.
--
-- Es un rename y no una columna nueva: el texto que ya esté cargado se
-- conserva y queda editable. Nadie pierde lo que tenía.
--
-- El permiso no cambia: `guide` ya está cubierto por la política de UPDATE de
-- builds, que deja escribir al autor y a un Oficial. No hace falta un grant a
-- nivel columna como en profiles, porque acá el dueño de la fila puede
-- modificar la fila entera.
-- ----------------------------------------------------------------------------

alter table public.builds rename column ai_guide to guide;

comment on column public.builds.guide is
  'Guía escrita por el autor de la build, en markdown. Antes era ai_guide y la '
  'generaba un modelo; ahora la escribe quien conoce la build.';
