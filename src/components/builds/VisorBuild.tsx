import Link from 'next/link'

import { GuiaIA } from '@/components/builds/GuiaIA'
import { Card, CardTitulo } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import {
  NOMBRES_SLOT,
  SLOTS_EQUIPO,
  claveHabilidad,
  type Build,
  type RefHechizo,
  type RefItem,
  type SlotEquipo,
  type SpellSlot,
} from '@/lib/domain/builds'
import { fechaCorta } from '@/lib/utils/formato'

const ORDEN_SLOTS: SpellSlot[] = ['Q', 'W', 'E', 'Passive']

function Habilidad({ hechizo }: { hechizo: RefHechizo }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={hechizo.icon_url}
      alt={hechizo.name}
      title={hechizo.name}
      className="size-7 rounded border border-borde bg-fondo"
      loading="lazy"
    />
  )
}

function Pieza({
  slot,
  item,
  habilidades,
}: {
  slot: SlotEquipo
  item: RefItem | null
  habilidades: RefHechizo[]
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex size-20 items-center justify-center rounded-lg border border-borde bg-fondo">
        {item ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.icon_url}
            alt={item.name}
            title={item.name}
            className="size-16"
            loading="lazy"
          />
        ) : (
          <span className="text-[10px] uppercase tracking-wide text-texto-tenue">
            {NOMBRES_SLOT[slot]}
          </span>
        )}
      </div>

      {habilidades.length > 0 && (
        <div className="flex gap-1">
          {habilidades.map((h) => (
            <Habilidad key={h.id} hechizo={h} />
          ))}
        </div>
      )}

      {item && (
        <p className="max-w-24 text-center text-[11px] leading-tight text-texto-tenue">
          {item.name}
        </p>
      )}
    </div>
  )
}

export function VisorBuild({
  build,
  puedeGenerarGuia,
}: {
  build: Build
  puedeGenerarGuia: boolean
}) {
  /**
   * Lee las habilidades con claveHabilidad(), el mismo helper que usó el
   * creador para escribirlas.
   *
   * Antes esto era una lista literal de claves (`build.abilities.weapon_q`,
   * `helmet_d`, `chest_r`, `boots_f`) que no coincidía con ninguna de las que
   * el creador guardaba: las habilidades no se mostraban nunca.
   */
  function habilidadesDe(slot: SlotEquipo): RefHechizo[] {
    return ORDEN_SLOTS.map((s) => build.abilities[claveHabilidad(slot, s)]).filter(
      (h): h is RefHechizo => Boolean(h),
    )
  }

  return (
    <div className="space-y-5">
      <Link
        href="/builds"
        className="inline-flex items-center gap-1.5 text-sm text-texto-suave transition-colors hover:text-texto"
      >
        <svg
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
        </svg>
        Volver a builds
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{build.title}</h1>
            <p className="mt-1 text-sm text-texto-tenue">
              por {build.author?.name ?? 'autor desconocido'} ·{' '}
              {fechaCorta(build.created_at)}
            </p>
          </div>
          <Etiqueta tono="acento">{build.category}</Etiqueta>
        </div>

        {build.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-texto-suave">
            {build.description}
          </p>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardTitulo>Equipamiento</CardTitulo>
            <div className="grid grid-cols-3 justify-items-center gap-4 sm:grid-cols-6">
              {SLOTS_EQUIPO.map((slot) => (
                <Pieza
                  key={slot}
                  slot={slot}
                  item={build.equipment[slot]}
                  habilidades={habilidadesDe(slot)}
                />
              ))}
            </div>
          </Card>

          <Card>
            <CardTitulo>Consumibles</CardTitulo>
            <div className="flex flex-wrap gap-6">
              {(['potion', 'food'] as const).map((slot) => {
                const item = build.consumables[slot]
                return (
                  <div key={slot} className="flex items-center gap-2.5">
                    <div className="flex size-14 items-center justify-center rounded-lg border border-borde bg-fondo">
                      {item ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.icon_url}
                          alt={item.name}
                          className="size-11"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="text-sm">
                      <p className="text-xs text-texto-tenue">
                        {NOMBRES_SLOT[slot]}
                      </p>
                      <p>{item?.name ?? 'Sin asignar'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <GuiaIA
          buildId={build.id}
          guiaInicial={build.ai_guide}
          habilitado={puedeGenerarGuia}
        />
      </div>
    </div>
  )
}
