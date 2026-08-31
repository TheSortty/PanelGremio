'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { IconoPergamino, IconoYelmo } from '@/components/ui/Iconos'
import { cn } from '@/lib/utils/cn'

/**
 * Pestañas de la sección de administración.
 *
 * El registro de auditoría vivía en la barra principal, al lado de Builds y
 * Rutas. Eso lo ponía al mismo nivel que las secciones que usa todo el gremio,
 * cuando en realidad es la contracara de lo que se hace en Administración: se
 * entra a ver quién cambió qué rol, justo después de cambiarlo. Acá quedan
 * juntas las dos mitades de la misma tarea, y la barra de arriba pierde un
 * ítem que a la mayoría no le servía.
 */
const PESTANAS = [
  { href: '/admin', etiqueta: 'Usuarios', icono: IconoYelmo },
  { href: '/admin/registro', etiqueta: 'Registro', icono: IconoPergamino },
] as const

export function PestanasAdmin({ pendientes }: { pendientes: number }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 border-b border-borde-suave">
      {PESTANAS.map(({ href, etiqueta, icono: Icono }) => {
        const activa = pathname === href

        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? 'page' : undefined}
            className={cn(
              'relative -mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              activa
                ? 'border-acento text-acento'
                : 'border-transparent text-texto-suave hover:text-texto',
            )}
          >
            <Icono className="text-base" />
            {etiqueta}
            {href === '/admin' && pendientes > 0 && (
              <span className="rounded-full bg-alerta px-1.5 py-0.5 text-[11px] font-bold leading-none text-sobre-acento tabular-nums">
                {pendientes}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
