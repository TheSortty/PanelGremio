'use client'

import { useEffect, useRef, useState } from 'react'

import { BotonSalir } from '@/components/auth/BotonSalir'
import type { GuildRole } from '@/lib/domain/roles'

export function MenuUsuario({
  nombre,
  rol,
  avatarUrl,
}: {
  nombre: string
  rol: GuildRole
  avatarUrl: string | null
}) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    function alClicAfuera(evento: MouseEvent) {
      if (!contenedor.current?.contains(evento.target as Node)) {
        setAbierto(false)
      }
    }
    function alEscape(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('mousedown', alClicAfuera)
    document.addEventListener('keydown', alEscape)
    return () => {
      document.removeEventListener('mousedown', alClicAfuera)
      document.removeEventListener('keydown', alEscape)
    }
  }, [abierto])

  return (
    <div className="relative shrink-0" ref={contenedor}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-superficie-alta"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-acento-suave text-xs font-semibold uppercase">
            {nombre.slice(0, 2)}
          </span>
        )}
        <span className="hidden text-sm font-medium sm:inline">{nombre}</span>
        <svg
          className={`size-4 text-texto-tenue transition-transform ${abierto ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-52 overflow-hidden rounded-lg border border-borde bg-superficie shadow-xl"
        >
          <div className="border-b border-borde-suave px-3 py-2.5">
            <p className="truncate text-sm font-medium">{nombre}</p>
            <p className="text-xs text-acento">{rol}</p>
          </div>
          <div className="p-1.5">
            <BotonSalir className="[&>button]:w-full [&>button]:justify-start" />
          </div>
        </div>
      )}
    </div>
  )
}
