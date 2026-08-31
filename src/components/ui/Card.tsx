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
        // .losa lleva el bisel de piedra; ver globals.css
        'losa p-5',
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
