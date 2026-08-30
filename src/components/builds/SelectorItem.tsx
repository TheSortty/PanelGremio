'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { IconoItem } from '@/components/builds/Icono'
import { Spinner } from '@/components/ui/Cargando'
import type { Encantamiento } from '@/lib/domain/albion'
import type { ItemType, RefItem } from '@/lib/domain/builds'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

/** Tiers jugables. Por debajo de T4 casi nada se usa en contenido de gremio. */
const TIERS = [4, 5, 6, 7, 8] as const

type Resultado = {
  id: string
  name: string
  tier: number | null
  item_power: number | null
  two_handed: boolean
}

export function SelectorItem({
  tipo,
  seleccionado,
  onSeleccionar,
  etiqueta,
  deshabilitado,
  motivoDeshabilitado,
}: {
  tipo: ItemType
  seleccionado: RefItem | null
  onSeleccionar: (item: RefItem | null) => void
  etiqueta: string
  deshabilitado?: boolean
  motivoDeshabilitado?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [tier, setTier] = useState<number | null>(null)
  const [items, setItems] = useState<Resultado[]>([])
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
        .select('id, name, tier, item_power, two_handed')
        .eq('type', tipo)
        // Por tier y después alfabético: agrupa las variantes de un mismo ítem.
        .order('tier', { ascending: false })
        .order('name')
        .limit(40)
        .abortSignal(controlador.signal)

      if (tier !== null) consulta = consulta.eq('tier', tier)

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
  }, [abierto, tipo, busqueda, tier])

  if (deshabilitado) {
    return (
      <div className="campo flex items-center gap-2 opacity-50">
        <span className="text-xs text-texto-tenue">
          {motivoDeshabilitado ?? 'No disponible'}
        </span>
      </div>
    )
  }

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
              <IconoItem
                id={seleccionado.id}
                nombre={seleccionado.name}
                encantamiento={(seleccionado.ench ?? 0) as Encantamiento}
                tamano="mini"
                className="size-6 shrink-0 rounded"
              />
              <span className="truncate">{seleccionado.name}</span>
            </>
          ) : (
            <span className="text-texto-tenue">
              Elegir {etiqueta.toLowerCase()}
            </span>
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

          <div className="flex gap-1 border-b border-borde px-2 py-1.5">
            <button
              type="button"
              onClick={() => setTier(null)}
              className={cn(
                'rounded px-1.5 py-0.5 text-xs font-medium transition-colors',
                tier === null
                  ? 'bg-acento text-white'
                  : 'text-texto-tenue hover:text-texto',
              )}
            >
              Todos
            </button>
            {TIERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(tier === t ? null : t)}
                className={cn(
                  'rounded px-1.5 py-0.5 text-xs font-medium transition-colors',
                  tier === t
                    ? 'bg-acento text-white'
                    : 'text-texto-tenue hover:text-texto',
                )}
              >
                T{t}
              </button>
            ))}
          </div>

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
                      onSeleccionar({ id: item.id, name: item.name, ench: 0 })
                      setAbierto(false)
                      setBusqueda('')
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-acento"
                  >
                    {/* Tamaño mini: el icono por defecto de la API pesa ~80 KB
                        y acá se dibuja en 28 px. */}
                    <IconoItem
                      id={item.id}
                      nombre={item.name}
                      tamano="mini"
                      className="size-7 shrink-0 rounded"
                    />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="shrink-0 text-xs text-texto-tenue">
                      {item.tier !== null && `T${item.tier}`}
                      {item.two_handed && ' · 2M'}
                    </span>
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
