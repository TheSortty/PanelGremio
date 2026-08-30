import type { ReactNode } from 'react'

export function Vacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}) {
  return (
    <div className="rounded-panel border border-dashed border-borde px-6 py-14 text-center">
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
