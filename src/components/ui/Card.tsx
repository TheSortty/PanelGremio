import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-panel border border-borde-suave bg-superficie p-5 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardTitulo({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3 className={cn('mb-4 text-base font-semibold text-texto', className)}>
      {children}
    </h3>
  )
}
