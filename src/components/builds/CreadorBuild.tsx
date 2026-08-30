'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'

import { actualizarBuild, crearBuild } from '@/actions/builds'
import { SelectorEncantamiento } from '@/components/builds/SelectorEncantamiento'
import { SelectorHechizo } from '@/components/builds/SelectorHechizo'
import { SelectorItem } from '@/components/builds/SelectorItem'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card, CardTitulo } from '@/components/ui/Card'
import type { Encantamiento } from '@/lib/domain/albion'
import {
  CATEGORIAS_BUILD,
  CONSUMIBLES_VACIOS,
  EQUIPO_VACIO,
  NOMBRES_SLOT,
  SLOTS_EQUIPO,
  claveHabilidad,
  type Consumibles,
  type Equipo,
  type Habilidades,
  type RefHechizo,
  type RefItem,
  type SlotEquipo,
  type SpellSlot,
} from '@/lib/domain/builds'
import type { DatosItem } from '@/lib/domain/calculo'
import { poderConEncantamiento } from '@/lib/domain/calculo'
import { createClient } from '@/lib/supabase/client'

const ORDEN_SLOTS: SpellSlot[] = ['Q', 'W', 'E', 'Passive']

type HechizosPorSlot = Partial<Record<SpellSlot, RefHechizo[]>>

export type BuildInicial = {
  id: string
  title: string
  category: string
  description: string
  equipment: Equipo
  consumables: Consumibles
  abilities: Habilidades
}

/**
 * Formulario de build, para crear y para editar.
 *
 * Con `inicial` edita esa build; sin él, crea una nueva. Un solo componente
 * para los dos casos evita que el editor y el creador se separen con el
 * tiempo, que es exactamente cómo nació el bug de las claves de habilidad.
 */
export function CreadorBuild({ inicial }: { inicial?: BuildInicial }) {
  const editando = inicial !== undefined

  const [titulo, setTitulo] = useState(inicial?.title ?? '')
  const [categoria, setCategoria] = useState<string>(
    inicial?.category ?? CATEGORIAS_BUILD[0],
  )
  const [descripcion, setDescripcion] = useState(inicial?.description ?? '')
  const [equipo, setEquipo] = useState<Equipo>(
    inicial?.equipment ?? { ...EQUIPO_VACIO },
  )
  const [consumibles, setConsumibles] = useState<Consumibles>(
    inicial?.consumables ?? { ...CONSUMIBLES_VACIOS },
  )
  const [habilidades, setHabilidades] = useState<Habilidades>(
    inicial?.abilities ?? {},
  )
  const [hechizosDisponibles, setHechizosDisponibles] = useState<
    Partial<Record<SlotEquipo, HechizosPorSlot>>
  >({})
  // Datos vivos de los ítems elegidos: hacen falta para el encantamiento,
  // el bloqueo de mano secundaria y el poder promedio.
  const [datosItems, setDatosItems] = useState<Record<string, DatosItem>>({})
  const [error, setError] = useState<string | null>(null)
  const [guardando, iniciarGuardado] = useTransition()

  const cargarItem = useCallback(async (slot: SlotEquipo, itemId: string) => {
    const supabase = createClient()

    const [{ data: item }, { data: hechizos }] = await Promise.all([
      supabase
        .from('items')
        .select('id, name, tier, item_power, two_handed, enchantments, stats')
        .eq('id', itemId)
        .maybeSingle(),
      // Lee item_spells, ya resuelta al sembrar. El endpoint anterior repartía
      // los hechizos por su posición en un array.
      supabase.rpc('hechizos_de_item', { item: itemId }),
    ])

    if (item) {
      setDatosItems((prev) => ({
        ...prev,
        [item.id]: {
          id: item.id,
          name: item.name,
          tier: item.tier,
          item_power: item.item_power,
          two_handed: item.two_handed,
          enchantments: (item.enchantments ?? {}) as Record<string, number>,
          stats: (item.stats ?? {}) as Record<string, number>,
        },
      }))
    }

    const agrupados: HechizosPorSlot = {}
    for (const fila of hechizos ?? []) {
      ;(agrupados[fila.slot] ??= []).push({ id: fila.id, name: fila.name })
    }
    setHechizosDisponibles((prev) => ({ ...prev, [slot]: agrupados }))
  }, [])

  // Al editar hay que traer los datos de las piezas que ya estaban puestas:
  // sin ellos no se dibujan los selectores de encantamiento ni se sabe si el
  // arma es a dos manos.
  useEffect(() => {
    if (!inicial) return
    for (const slot of SLOTS_EQUIPO) {
      const ref = inicial.equipment[slot]
      if (ref) void cargarItem(slot, ref.id)
    }
    // Solo al montar: después el estado lo maneja elegirItem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function elegirItem(slot: SlotEquipo, item: RefItem | null) {
    setEquipo((prev) => {
      const siguiente = { ...prev, [slot]: item }

      // Si el arma nueva es a dos manos, la mano secundaria se libera sola en
      // vez de quedar en un estado que la base y el juego rechazarían.
      if (slot === 'weapon' && item && datosItems[item.id]?.two_handed) {
        siguiente.offhand = null
      }
      return siguiente
    })

    setHabilidades((prev) => {
      const siguiente = { ...prev }
      for (const spellSlot of ORDEN_SLOTS) {
        delete siguiente[claveHabilidad(slot, spellSlot)]
      }
      return siguiente
    })

    if (item) void cargarItem(slot, item.id)
    else setHechizosDisponibles((prev) => ({ ...prev, [slot]: {} }))
  }

  function cambiarEncantamiento(slot: SlotEquipo, nivel: Encantamiento) {
    setEquipo((prev) => {
      const actual = prev[slot]
      if (!actual) return prev
      return { ...prev, [slot]: { ...actual, ench: nivel } }
    })
  }

  function elegirHechizo(
    slot: SlotEquipo,
    spellSlot: SpellSlot,
    hechizo: RefHechizo | null,
  ) {
    const clave = claveHabilidad(slot, spellSlot)
    setHabilidades((prev) => {
      const siguiente = { ...prev }
      if (hechizo) siguiente[clave] = hechizo
      else delete siguiente[clave]
      return siguiente
    })
  }

  // Resumen en vivo mientras se arma la build.
  const armaEsDosManos = Boolean(
    equipo.weapon && datosItems[equipo.weapon.id]?.two_handed,
  )

  const poderes = SLOTS_EQUIPO.map((slot) => {
    const ref = equipo[slot]
    if (!ref) return null
    const datos = datosItems[ref.id]
    if (!datos) return null
    return poderConEncantamiento(datos, (ref.ench ?? 0) as Encantamiento)
  }).filter((p): p is number => p !== null)

  const poderPromedio = poderes.length
    ? Math.round(poderes.reduce((a, b) => a + b, 0) / poderes.length)
    : null

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const datos = {
      title: titulo,
      category: categoria,
      description: descripcion,
      equipment: equipo,
      consumables: consumibles,
      abilities: habilidades,
    }

    iniciarGuardado(async () => {
      const resultado = editando
        ? await actualizarBuild(inicial.id, datos)
        : await crearBuild(datos)

      // Si sale bien, la acción redirige y esto no llega a ejecutarse.
      if (resultado && !resultado.ok) setError(resultado.error)
    })
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <Card>
        <CardTitulo>Información básica</CardTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="titulo" className="mb-1 block text-xs text-texto-suave">
              Título
            </label>
            <input
              id="titulo"
              className="campo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              maxLength={120}
              placeholder="Espada de hielo para ZvZ"
            />
          </div>

          <div>
            <label htmlFor="categoria" className="mb-1 block text-xs text-texto-suave">
              Categoría
            </label>
            <select
              id="categoria"
              className="campo"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {CATEGORIAS_BUILD.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="w-full rounded-lg border border-borde-suave bg-fondo px-3 py-2">
              <p className="text-xs text-texto-tenue">Poder de ítem promedio</p>
              <p className="text-lg font-bold tabular-nums">
                {poderPromedio ?? '—'}
                {poderes.length > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-texto-tenue">
                    sobre {poderes.length} de {SLOTS_EQUIPO.length} piezas
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="descripcion" className="mb-1 block text-xs text-texto-suave">
              Descripción
            </label>
            <textarea
              id="descripcion"
              className="campo resize-y"
              rows={3}
              maxLength={2000}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Cuándo usarla, con qué combina, qué evitar…"
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitulo>Equipamiento y habilidades</CardTitulo>

        {armaEsDosManos && (
          <Aviso tono="info" className="mb-4">
            {equipo.weapon?.name} es un arma a dos manos: la mano secundaria
            queda ocupada.
          </Aviso>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {SLOTS_EQUIPO.map((slot) => {
            const disponibles = hechizosDisponibles[slot] ?? {}
            const ref = equipo[slot]
            const datos = ref ? datosItems[ref.id] : undefined
            const bloqueado = slot === 'offhand' && armaEsDosManos

            return (
              <div key={slot}>
                <p className="mb-1 text-xs font-medium text-texto-suave">
                  {NOMBRES_SLOT[slot]}
                  {datos?.tier != null && (
                    <span className="ml-1.5 text-texto-tenue">T{datos.tier}</span>
                  )}
                </p>

                <SelectorItem
                  tipo={slot}
                  seleccionado={ref}
                  onSeleccionar={(item) => elegirItem(slot, item)}
                  etiqueta={NOMBRES_SLOT[slot]}
                  deshabilitado={bloqueado}
                  motivoDeshabilitado="Ocupada por el arma a dos manos"
                />

                {ref && datos && (
                  <SelectorEncantamiento
                    valor={(ref.ench ?? 0) as Encantamiento}
                    disponibles={datos.enchantments}
                    onCambiar={(nivel) => cambiarEncantamiento(slot, nivel)}
                  />
                )}

                {ORDEN_SLOTS.map((spellSlot) => (
                  <SelectorHechizo
                    key={spellSlot}
                    slot={slot}
                    spellSlot={spellSlot}
                    hechizos={disponibles[spellSlot] ?? []}
                    seleccionado={habilidades[claveHabilidad(slot, spellSlot)] ?? null}
                    onSeleccionar={(h) => elegirHechizo(slot, spellSlot, h)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <CardTitulo>Consumibles</CardTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-texto-suave">Poción</p>
            <SelectorItem
              tipo="potion"
              seleccionado={consumibles.potion}
              onSeleccionar={(item) =>
                setConsumibles((prev) => ({ ...prev, potion: item }))
              }
              etiqueta="Poción"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-texto-suave">Comida</p>
            <SelectorItem
              tipo="food"
              seleccionado={consumibles.food}
              onSeleccionar={(item) =>
                setConsumibles((prev) => ({ ...prev, food: item }))
              }
              etiqueta="Comida"
            />
          </div>
        </div>
      </Card>

      {editando && (
        <Aviso tono="info">
          Al cambiar el equipamiento se descarta la guía de IA generada, porque
          describe la build anterior.
        </Aviso>
      )}

      {error && <Aviso tono="error">{error}</Aviso>}

      <div className="flex justify-end gap-2">
        <Boton type="submit" disabled={guardando}>
          {guardando
            ? 'Guardando…'
            : editando
              ? 'Guardar cambios'
              : 'Crear build'}
        </Boton>
      </div>
    </form>
  )
}
