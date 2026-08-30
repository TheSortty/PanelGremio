'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils/cn'

export type Enlace = { href: string; etiqueta: string }

/**
 * Navegación principal.
 *
 * La versión anterior guardaba la página actual en un useState dentro de
 * App.tsx. Eso significaba: una sola URL para toda la aplicación, sin poder
 * compartir el enlace de una build, sin botón atrás, y recargando siempre en
 * el panel. Ahora cada sección es una ruta de verdad.
 */
export function Navegacion({ enlaces }: { enlaces: Enlace[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Secciones">
      {enlaces.map(({ href, etiqueta }) => {
        // Una subruta (/builds/nueva) tiene que marcar activo a /builds.
        const activo = pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              activo
                ? 'bg-acento text-white'
                : 'text-texto-suave hover:bg-superficie-alta hover:text-texto',
            )}
          >
            {etiqueta}
          </Link>
        )
      })}
    </nav>
  )
}
