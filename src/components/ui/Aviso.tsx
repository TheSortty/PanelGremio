import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

type Tono = 'error' | 'exito' | 'info'

const TONOS: Record<Tono, string> = {
  error: 'border-peligro/40 bg-peligro-fondo/40 text-peligro',
  exito: 'border-exito/40 bg-exito-fondo/40 text-exito',
  info: 'border-borde bg-superficie-alta text-texto-suave',
}

export function Aviso({
  tono = 'info',
  children,
  className,
}: {
  tono?: Tono
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        TONOS[tono],
        className,
      )}
    >
      {children}
    </div>
  )
}
