'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { Spinner } from '@/components/ui/Cargando'
import type { ItemType, RefItem } from '@/lib/domain/builds'
import { createClient } from '@/lib/supabase/client'

/**
 * Buscador de ítems por tipo.
 *
 * Cambios respecto de la versión anterior:
 *   - La consulta se cancela con AbortController cuando cambia el término. Sin
 *     eso, una respuesta lenta de una búsqueda vieja podía llegar después de
 *     una nueva y pisar los resultados.
 *   - Trae 30 filas como máximo. Antes no había límite: pedir type=weapon
 *     devolvía cientos de ítems en cada tecla.
 *   - Se puede quitar la selección; antes, una vez elegido un ítem, no había
 *     forma de dejar el slot vacío.
 */
export function SelectorItem({
  tipo,
  seleccionado,
  onSeleccionar,
  etiqueta,
}: {
  tipo: ItemType
  seleccionado: RefItem | null
  onSeleccionar: (item: RefItem | null) => void
  etiqueta: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [items, setItems] = useState<RefItem[]>([])
  const [cargando, setCargando] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const idLista = useId()

  useEffect(() => {
    if (!abierto) return

    function alClicAfuera(e: MouseEvent) {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false)
    }
    function alEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('mousedown', alClicAfuera)
    document.addEventListener('keydown', alEscape)
    return () => {
      document.removeEventListener('mousedown', alClicAfuera)
      document.removeEventListener('keydown', alEscape)
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return

    const controlador = new AbortController()
    setCargando(true)

    const temporizador = setTimeout(async () => {
      const supabase = createClient()

      let consulta = supabase
        .from('items')
        .select('id, name, icon_url')
        .eq('type', tipo)
        .order('name')
        .limit(30)
        .abortSignal(controlador.signal)

      const termino = busqueda.trim()
      if (termino) consulta = consulta.ilike('name', `%${termino}%`)

      const { data, error } = await consulta

      if (controlador.signal.aborted) return
      if (!error && data) setItems(data)
      setCargando(false)
    }, 250)

    return () => {
      clearTimeout(temporizador)
      controlador.abort()
    }
  }, [abierto, tipo, busqueda])

  return (
    <div className="relative" ref={contenedor}>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={abierto}
          aria-controls={abierto ? idLista : undefined}
          className="campo flex flex-1 items-center gap-2 text-left"
        >
          {seleccionado ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={seleccionado.icon_url}
                alt=""
                className="size-6 shrink-0"
                loading="lazy"
              />
              <span className="truncate">{seleccionado.name}</span>
            </>
          ) : (
            <span className="text-texto-tenue">Elegir {etiqueta.toLowerCase()}</span>
          )}
        </button>

        {seleccionado && (
          <button
            type="button"
            onClick={() => onSeleccionar(null)}
            aria-label={`Quitar ${etiqueta.toLowerCase()}`}
            className="rounded-lg border border-borde px-2 text-texto-tenue transition-colors hover:border-peligro hover:text-peligro"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {abierto && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-borde bg-superficie-alta shadow-xl">
          <input
            autoFocus
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…"
            aria-label={`Buscar ${etiqueta.toLowerCase()}`}
            className="w-full border-b border-borde bg-fondo px-3 py-2 text-sm outline-none"
          />

          <ul id={idLista} role="listbox" className="max-h-56 overflow-y-auto">
            {cargando ? (
              <li className="flex justify-center py-6">
                <Spinner className="size-5" />
              </li>
            ) : items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-texto-tenue">
                Sin resultados
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={seleccionado?.id === item.id}
                    onClick={() => {
                      onSeleccionar(item)
                      setAbierto(false)
                      setBusqueda('')
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-acento"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.icon_url}
                      alt=""
                      className="size-7 shrink-0"
                      loading="lazy"
                    />
                    <span className="truncate">{item.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
