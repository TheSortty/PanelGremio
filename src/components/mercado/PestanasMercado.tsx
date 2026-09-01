'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils/cn'

const PESTANAS = [
  { href: '/mercado', etiqueta: 'Black Market' },
  { href: '/mercado/crafteo', etiqueta: 'Crafteo' },
  { href: '/mercado/pesca', etiqueta: 'Pesca' },
] as const

export function PestanasMercado() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-borde-suave">
      {PESTANAS.map(({ href, etiqueta }) => {
        const activa = pathname === href

        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? 'page' : undefined}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              activa
                ? 'border-acento text-acento'
                : 'border-transparent text-texto-suave hover:text-texto',
            )}
          >
            {etiqueta}
          </Link>
        )
      })}
    </div>
  )
}
