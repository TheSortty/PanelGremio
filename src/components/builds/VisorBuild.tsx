import Link from 'next/link'

import { AccionesBuild } from '@/components/builds/AccionesBuild'
import { FichaItem } from '@/components/builds/FichaItem'
import { GuiaBuild } from '@/components/builds/GuiaBuild'
import { ListaStats } from '@/components/builds/ListaStats'
import { Aviso } from '@/components/ui/Aviso'
import { Card, CardTitulo } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import type { Encantamiento } from '@/lib/domain/albion'
import {
  NOMBRES_SLOT,
  SLOTS_CONSUMIBLE,
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

function IconoVolver() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 19-7-7 7-7" />
    </svg>
  )
}

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
    <div className="rounded-lg border border-borde-suave bg-fondo p-4">
      <div className="flex items-start gap-4">
        {/* Misma ficha que usa el listado: tier en romanos, rombos del
            encantamiento y habilidades colgando abajo. */}
        <FichaItem
          item={item}
          habilidades={habilidades}
          tamano="lg"
          vacia={NOMBRES_SLOT[slot]}
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="grabado">{NOMBRES_SLOT[slot]}</p>
          <p className="mt-0.5 truncate font-medium">
            {item?.name ?? 'Sin asignar'}
          </p>
          {poder != null && (
            <p className="mt-0.5 text-sm text-texto-tenue">
              <span className="tabular-nums text-texto-suave">{poder}</span> de
              poder
            </p>
          )}
          {datos && <ListaStats stats={datos.stats} />}
        </div>
      </div>
    </div>
  )
}

export function VisorBuild({
  build,
  datosItems,
  resumen,
  puedeEditar,
}: {
  build: Build
  datosItems: Map<string, DatosItem>
  resumen: ResumenBuild
  puedeEditar: boolean
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
        <IconoVolver />
        Volver a builds
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{build.title}</h1>
            <p className="mt-1 text-sm text-texto-tenue">
              por {build.author?.name ?? 'autor desconocido'} ·{' '}
              {fechaCorta(build.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Etiqueta tono="acento">{build.category}</Etiqueta>
            {puedeEditar && (
              <AccionesBuild buildId={build.id} titulo={build.title} />
            )}
          </div>
        </div>

        {build.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-texto-suave">
            {build.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-4 border-t border-borde-suave pt-4">
          <div>
            <p className="grabado">Poder de ítem promedio</p>
            <p className="text-2xl font-bold tabular-nums">
              {resumen.poderPromedio ?? '—'}
            </p>
            <p className="text-xs text-texto-tenue">
              sobre {resumen.piezasConPoder} de {SLOTS_EQUIPO.length} piezas
            </p>
          </div>

          {resumen.tierMinimo !== null && (
            <div>
              <p className="grabado">Tier</p>
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
            <div className="grid gap-4 sm:grid-cols-2">
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
              {SLOTS_CONSUMIBLE.map((slot) => {
                const item = build.consumables[slot]
                return (
                  <div key={slot} className="flex items-center gap-4">
                    {/* La misma ficha que el equipamiento: antes era un cuadro
                        aparte que, con el slot vacío, quedaba como una caja
                        negra sin explicación. */}
                    <FichaItem
                      item={item}
                      tamano="md"
                      vacia={NOMBRES_SLOT[slot]}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="grabado">{NOMBRES_SLOT[slot]}</p>
                      <p className="mt-0.5 truncate">
                        {item?.name ?? 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <GuiaBuild
          buildId={build.id}
          guiaInicial={build.guide}
          puedeEditar={puedeEditar}
        />
      </div>
    </div>
  )
}
