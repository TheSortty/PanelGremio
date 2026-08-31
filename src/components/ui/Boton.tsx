import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'
type Tamano = 'sm' | 'md'

/*
  El acento es oro de antorcha, no índigo: encima va texto oscuro, no blanco.
  Oro con blanco encima queda por debajo de 3:1 de contraste y se vuelve ilegible
  al sol o en una pantalla mala.
*/
const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-acento text-sobre-acento hover:bg-acento-fuerte disabled:hover:bg-acento',
  secundario:
    'border border-borde bg-superficie-alta text-texto hover:border-acento/50 hover:bg-borde disabled:hover:border-borde disabled:hover:bg-superficie-alta',
  peligro:
    'bg-peligro-fondo text-peligro hover:bg-peligro hover:text-texto disabled:hover:bg-peligro-fondo disabled:hover:text-peligro',
  fantasma: 'text-texto-suave hover:bg-superficie-alta hover:text-texto',
}

const TAMANOS: Record<Tamano, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
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
