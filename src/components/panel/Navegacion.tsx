'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType, SVGProps } from 'react'

import {
  IconoEscudo,
  IconoEspada,
  IconoLlave,
  IconoMapa,
} from '@/components/ui/Iconos'
import { cn } from '@/lib/utils/cn'

export type Enlace = { href: string; etiqueta: string }

/**
 * Icono de cada sección, resuelto por ruta.
 *
 * Va acá y no en el layout para que la lista de enlaces siga siendo datos
 * simples y se pueda pasar del servidor al cliente: un componente de React no
 * se serializa al cruzar esa frontera.
 */
const ICONOS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  '/panel': IconoEscudo,
  '/builds': IconoEspada,
  '/rutas': IconoMapa,
  '/admin': IconoLlave,
}

/**
 * Navegación principal.
 *
 * La versión anterior guardaba la página actual en un useState dentro de
 * App.tsx. Eso significaba: una sola URL para toda la aplicación, sin poder
 * compartir el enlace de una build, sin botón atrás, y recargando siempre en
 * el panel. Ahora cada sección es una ruta de verdad.
 *
 * La sección activa se marca con una línea de oro abajo, como el reflejo de la
 * antorcha sobre la piedra, en vez de rellenar el botón entero: con seis
 * secciones, seis bloques de color pesaban más que el contenido.
 */
export function Navegacion({
  enlaces,
  pendientes = 0,
}: {
  enlaces: Enlace[]
  /** Solicitudes esperando aprobación. Marca Administración. */
  pendientes?: number
}) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-0.5 overflow-x-auto" aria-label="Secciones">
      {enlaces.map(({ href, etiqueta }) => {
        // Una subruta (/builds/nueva) tiene que marcar activo a /builds.
        const activo = pathname === href || pathname.startsWith(`${href}/`)
        const Icono = ICONOS[href]

        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? 'page' : undefined}
            className={cn(
              'relative flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
              'after:absolute after:inset-x-2.5 after:bottom-0 after:h-px after:transition-colors',
              activo
                ? 'text-acento after:bg-acento'
                : 'text-texto-suave after:bg-transparent hover:bg-superficie-alta hover:text-texto',
            )}
          >
            {Icono && <Icono className="text-base" />}
            {/* En pantallas chicas queda solo el icono: las etiquetas no
                entran y la barra terminaba con scroll horizontal siempre. */}
            <span className="hidden sm:inline">{etiqueta}</span>
            <span className="sr-only sm:hidden">{etiqueta}</span>

            {href === '/admin' && pendientes > 0 && (
              <span
                title={`${pendientes} solicitud${pendientes === 1 ? '' : 'es'} sin resolver`}
                className="ml-0.5 rounded-full bg-alerta px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums text-sobre-acento"
              >
                {pendientes}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
