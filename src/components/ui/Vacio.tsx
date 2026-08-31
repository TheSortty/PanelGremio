import type { ComponentType, ReactNode, SVGProps } from 'react'

import { IconoEstandarte } from '@/components/ui/Iconos'

/**
 * Pantalla vacía.
 *
 * Un vacío es una invitación a hacer algo, no un mensaje de error: por eso
 * lleva la acción a mano y un texto que dice qué va a pasar, en vez de
 * limitarse a informar que no hay nada.
 */
export function Vacio({
  titulo,
  descripcion,
  accion,
  icono: Icono = IconoEstandarte,
}: {
  titulo: string
  descripcion?: string
  accion?: ReactNode
  icono?: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <div className="rounded-panel border border-dashed border-borde px-6 py-14 text-center">
      <Icono className="mx-auto mb-3 text-3xl text-acento/35" />
      <p className="font-medium text-texto">{titulo}</p>
      {descripcion && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-texto-tenue">
          {descripcion}
        </p>
      )}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  )
}
