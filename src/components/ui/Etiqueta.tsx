import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

type Tono = 'neutro' | 'exito' | 'alerta' | 'peligro' | 'acento'

const TONOS: Record<Tono, string> = {
  neutro: 'bg-superficie-alta text-texto-suave',
  exito: 'bg-exito-fondo text-exito',
  alerta: 'bg-alerta-fondo text-alerta',
  peligro: 'bg-peligro-fondo text-peligro',
  acento: 'bg-acento-suave text-texto',
}

export function Etiqueta({
  tono = 'neutro',
  children,
  className,
}: {
  tono?: Tono
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  )
}
