import Link from 'next/link'

import { GuiaIA } from '@/components/builds/GuiaIA'
import { IconoHechizo, IconoItem } from '@/components/builds/Icono'
import { ListaStats } from '@/components/builds/ListaStats'
import { Aviso } from '@/components/ui/Aviso'
import { Card, CardTitulo } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import type { Encantamiento } from '@/lib/domain/albion'
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
import {
  poderConEncantamiento,
  type DatosItem,
  type ResumenBuild,
} from '@/lib/domain/calculo'
import { fechaCorta } from '@/lib/utils/formato'

const ORDEN_SLOTS: SpellSlot[] = ['Q', 'W', 'E', 'Passive']

function Pieza({
  slot,
  item,
  datos,
  habilidades,
}: {
  slot: SlotEquipo
  item: RefItem | null
  datos: DatosItem | undefined
  habilidades: RefHechizo[]
}) {
  const ench = (item?.ench ?? 0) as Encantamiento
  const poder = datos ? poderConEncantamiento(datos, ench) : null

  return (
    <div className="rounded-lg border border-borde-suave bg-fondo p-3">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="flex size-16 items-center justify-center rounded-lg border border-borde bg-superficie">
            {item ? (
              <IconoItem
                id={item.id}
                nombre={item.name}
                encantamiento={ench}
                tamano="chico"
                className="size-14 rounded"
              />
            ) : (
              <span className="px-1 text-center text-[10px] uppercase leading-tight text-texto-tenue">
                {NOMBRES_SLOT[slot]}
              </span>
            )}
          </div>
          {ench > 0 && (
            <span className="absolute -right-1 -top-1 rounded bg-acento px-1 text-[10px] font-bold text-white">
              .{ench}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-texto-tenue">
            {NOMBRES_SLOT[slot]}
          </p>
          <p className="truncate text-sm font-medium">
            {item?.name ?? 'Sin asignar'}
          </p>
          {(datos?.tier != null || poder != null) && (
            <p className="text-xs text-texto-tenue">
              {datos?.tier != null && `T${datos.tier}`}
              {datos?.tier != null && poder != null && ' · '}
              {poder != null && `${poder} poder`}
            </p>
          )}

          {habilidades.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {habilidades.map((h) => (
                <IconoHechizo
                  key={h.id}
                  id={h.id}
                  nombre={h.name}
                  className="size-7 rounded border border-borde bg-superficie"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {datos && <ListaStats stats={datos.stats} />}
    </div>
  )
}

export function VisorBuild({
  build,
  datosItems,
  resumen,
  puedeGenerarGuia,
}: {
  build: Build
  datosItems: Map<string, DatosItem>
  resumen: ResumenBuild
  puedeGenerarGuia: boolean
}) {
  /**
   * Lee con claveHabilidad(), el mismo helper que usó el creador para escribir.
   *
   * Antes esto era una lista literal (`build.abilities.weapon_q`, `helmet_d`,
   * `chest_r`, `boots_f`) que no coincidía con ninguna clave guardada: las
   * habilidades no se mostraban nunca.
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

        <div className="mt-4 flex flex-wrap gap-4 border-t border-borde-suave pt-4">
          <div>
            <p className="text-xs text-texto-tenue">Poder de ítem promedio</p>
            <p className="text-2xl font-bold tabular-nums">
              {resumen.poderPromedio ?? '—'}
            </p>
            <p className="text-xs text-texto-tenue">
              sobre {resumen.piezasConPoder} de {SLOTS_EQUIPO.length} piezas
            </p>
          </div>

          {resumen.tierMinimo !== null && (
            <div>
              <p className="text-xs text-texto-tenue">Tier</p>
              <p className="text-2xl font-bold tabular-nums">
                {resumen.tierMinimo === resumen.tierMaximo
                  ? `T${resumen.tierMinimo}`
                  : `T${resumen.tierMinimo}–T${resumen.tierMaximo}`}
              </p>
              <p className="text-xs text-texto-tenue">del equipamiento</p>
            </div>
          )}
        </div>

        {resumen.advertencias.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {resumen.advertencias.map((a) => (
              <Aviso key={a} tono="info">
                {a}
              </Aviso>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardTitulo>Equipamiento</CardTitulo>
            <div className="grid gap-3 sm:grid-cols-2">
              {SLOTS_EQUIPO.map((slot) => {
                const item = build.equipment[slot]
                return (
                  <Pieza
                    key={slot}
                    slot={slot}
                    item={item}
                    datos={item ? datosItems.get(item.id) : undefined}
                    habilidades={habilidadesDe(slot)}
                  />
                )
              })}
            </div>
            <p className="mt-3 text-xs text-texto-tenue">
              Las stats se muestran por pieza y no se suman: el dump del juego
              declara armadura y resistencias solo en algunos slots, así que un
              total sería un número preciso y equivocado.
            </p>
          </Card>

          <Card>
            <CardTitulo>Consumibles</CardTitulo>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['potion', 'food'] as const).map((slot) => {
                const item = build.consumables[slot]
                return (
                  <div key={slot} className="flex items-center gap-3">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-borde bg-fondo">
                      {item && (
                        <IconoItem
                          id={item.id}
                          nombre={item.name}
                          tamano="mini"
                          className="size-12 rounded"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-texto-tenue">
                        {NOMBRES_SLOT[slot]}
                      </p>
                      <p className="truncate text-sm">
                        {item?.name ?? 'Sin asignar'}
                      </p>
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
