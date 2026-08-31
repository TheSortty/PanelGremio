import type { ReactNode } from 'react'

import { IconoAlerta, IconoExito, IconoInfo } from '@/components/ui/Iconos'
import { cn } from '@/lib/utils/cn'

type Tono = 'error' | 'exito' | 'info'

const TONOS: Record<Tono, string> = {
  error: 'border-peligro/40 bg-peligro-fondo/40 text-peligro',
  exito: 'border-exito/40 bg-exito-fondo/40 text-exito',
  info: 'border-borde bg-superficie-alta text-texto-suave',
}

/*
  Cada tono lleva su icono. No es decoración: el color solo no alcanza para
  distinguir un error de una confirmación si quien mira no diferencia rojo de
  verde, que es una de cada doce personas con visión masculina.
*/
const ICONOS: Record<Tono, typeof IconoInfo> = {
  error: IconoAlerta,
  exito: IconoExito,
  info: IconoInfo,
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
  const Icono = ICONOS[tono]

  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
        TONOS[tono],
        className,
      )}
    >
      <Icono className="mt-0.5 shrink-0 text-base" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}
