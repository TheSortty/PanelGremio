'use client'

import { useCallback, useState, useTransition } from 'react'

import { crearBuild } from '@/actions/builds'
import { SelectorHechizo } from '@/components/builds/SelectorHechizo'
import { SelectorItem } from '@/components/builds/SelectorItem'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card, CardTitulo } from '@/components/ui/Card'
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
import { createClient } from '@/lib/supabase/client'

const ORDEN_SLOTS: SpellSlot[] = ['Q', 'W', 'E', 'Passive']

type HechizosPorSlot = Partial<Record<SpellSlot, RefHechizo[]>>

export function CreadorBuild() {
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_BUILD[0])
  const [descripcion, setDescripcion] = useState('')
  const [equipo, setEquipo] = useState<Equipo>({ ...EQUIPO_VACIO })
  const [consumibles, setConsumibles] = useState<Consumibles>({
    ...CONSUMIBLES_VACIOS,
  })
  const [habilidades, setHabilidades] = useState<Habilidades>({})
  const [hechizosDisponibles, setHechizosDisponibles] = useState<
    Partial<Record<SlotEquipo, HechizosPorSlot>>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [guardando, iniciarGuardado] = useTransition()

  /**
   * Trae las habilidades del ítem elegido.
   *
   * Llama a hechizos_de_item(), que lee la tabla item_spells ya resuelta.
   * El endpoint anterior repartía los hechizos por su posición en un array
   * (`index < 3` iba a Q, etc.), y encima siempre recibía una lista vacía
   * porque la columna de origen nunca se llegaba a cargar.
   */
  const cargarHechizos = useCallback(
    async (slot: SlotEquipo, itemId: string | null) => {
      if (!itemId) {
        setHechizosDisponibles((prev) => ({ ...prev, [slot]: {} }))
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.rpc('hechizos_de_item', {
        item: itemId,
      })

      if (error || !data) {
        setHechizosDisponibles((prev) => ({ ...prev, [slot]: {} }))
        return
      }

      const agrupados: HechizosPorSlot = {}
      for (const fila of data) {
        ;(agrupados[fila.slot] ??= []).push({
          id: fila.id,
          name: fila.name,
          icon_url: fila.icon_url,
        })
      }

      setHechizosDisponibles((prev) => ({ ...prev, [slot]: agrupados }))
    },
    [],
  )

  function elegirItem(slot: SlotEquipo, item: RefItem | null) {
    setEquipo((prev) => ({ ...prev, [slot]: item }))

    // Al cambiar el ítem, sus habilidades ya no aplican. Se limpian usando el
    // mismo helper de claves que las escribió, así no puede quedar ninguna
    // huérfana por una diferencia de formato.
    setHabilidades((prev) => {
      const siguiente = { ...prev }
      for (const spellSlot of ORDEN_SLOTS) {
        delete siguiente[claveHabilidad(slot, spellSlot)]
      }
      return siguiente
    })

    void cargarHechizos(slot, item?.id ?? null)
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

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    iniciarGuardado(async () => {
      const resultado = await crearBuild({
        title: titulo,
        category: categoria,
        description: descripcion,
        equipment: equipo,
        consumables: consumibles,
        abilities: habilidades,
      })

      // Cuando sale bien, la acción hace redirect y esto no se ejecuta.
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

          <div className="sm:col-span-2">
            <label
              htmlFor="descripcion"
              className="mb-1 block text-xs text-texto-suave"
            >
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
        <div className="grid gap-5 sm:grid-cols-2">
          {SLOTS_EQUIPO.map((slot) => {
            const disponibles = hechizosDisponibles[slot] ?? {}

            return (
              <div key={slot}>
                <p className="mb-1 text-xs font-medium text-texto-suave">
                  {NOMBRES_SLOT[slot]}
                </p>

                <SelectorItem
                  tipo={slot}
                  seleccionado={equipo[slot]}
                  onSeleccionar={(item) => elegirItem(slot, item)}
                  etiqueta={NOMBRES_SLOT[slot]}
                />

                {ORDEN_SLOTS.map((spellSlot) => (
                  <SelectorHechizo
                    key={spellSlot}
                    slot={slot}
                    spellSlot={spellSlot}
                    hechizos={disponibles[spellSlot] ?? []}
                    seleccionado={
                      habilidades[claveHabilidad(slot, spellSlot)] ?? null
                    }
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

      {error && <Aviso tono="error">{error}</Aviso>}

      <div className="flex justify-end gap-2">
        <Boton type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar build'}
        </Boton>
      </div>
    </form>
  )
}
