'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition, type ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

/**
 * Controles de las calculadoras.
 *
 * Todos escriben en la URL en vez de en un estado local. Es lo que permite
 * mandarle a alguien "mirá esto" con el enlace ya filtrado, y además evita el
 * problema de que el servidor calcule con unos parámetros y la pantalla muestre
 * otros: acá los parámetros SON la URL, y el servidor lee lo mismo que se ve.
 */
export function Selector({
  nombre,
  etiqueta,
  valor,
  opciones,
  ayuda,
}: {
  nombre: string
  etiqueta: string
  valor: string
  opciones: { valor: string; etiqueta: string }[]
  ayuda?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const parametros = useSearchParams()
  const [pendiente, iniciar] = useTransition()

  function cambiar(nuevo: string) {
    const siguientes = new URLSearchParams(parametros)
    siguientes.set(nombre, nuevo)
    iniciar(() => router.replace(`${pathname}?${siguientes}`, { scroll: false }))
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm text-texto-suave">{etiqueta}</span>
      <select
        className={cn('campo', pendiente && 'opacity-60')}
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        disabled={pendiente}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      {ayuda && <span className="mt-1 block text-xs text-texto-tenue">{ayuda}</span>}
    </label>
  )
}

export function Interruptor({
  nombre,
  etiqueta,
  activo,
  ayuda,
}: {
  nombre: string
  etiqueta: string
  activo: boolean
  ayuda?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const parametros = useSearchParams()
  const [pendiente, iniciar] = useTransition()

  function alternar() {
    const siguientes = new URLSearchParams(parametros)
    siguientes.set(nombre, activo ? '0' : '1')
    iniciar(() => router.replace(`${pathname}?${siguientes}`, { scroll: false }))
  }

  return (
    <div>
      <span className="mb-1 block text-sm text-texto-suave">{etiqueta}</span>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        onClick={alternar}
        disabled={pendiente}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
          activo
            ? 'border-acento/50 bg-acento-suave/30 text-texto'
            : 'border-borde bg-fondo text-texto-tenue',
          pendiente && 'opacity-60',
        )}
      >
        {activo ? 'Sí' : 'No'}
        <span
          className={cn(
            'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
            activo ? 'bg-acento' : 'bg-borde',
          )}
        >
          <span
            className={cn(
              'size-4 rounded-full bg-fondo transition-transform',
              activo && 'translate-x-4',
            )}
          />
        </span>
      </button>
      {ayuda && <span className="mt-1 block text-xs text-texto-tenue">{ayuda}</span>}
    </div>
  )
}

export function Controles({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  )
}
