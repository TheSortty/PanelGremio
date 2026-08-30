import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'
type Tamano = 'sm' | 'md'

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-acento text-white hover:bg-acento-fuerte disabled:hover:bg-acento',
  secundario:
    'bg-superficie-alta text-texto hover:bg-borde disabled:hover:bg-superficie-alta',
  peligro:
    'bg-peligro-fondo text-peligro hover:bg-peligro hover:text-white disabled:hover:bg-peligro-fondo',
  fantasma: 'text-texto-suave hover:bg-superficie-alta hover:text-texto',
}

const TAMANOS: Record<Tamano, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante
  tamano?: Tamano
  children: ReactNode
}

export function Boton({
  variante = 'primario',
  tamano = 'md',
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        TAMANOS[tamano],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
