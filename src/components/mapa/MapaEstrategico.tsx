'use client'

import { useOptimistic, useState, useTransition } from 'react'

import { crearMarcador, eliminarMarcador } from '@/actions/marcadores'
import { Aviso } from '@/components/ui/Aviso'
import { Card } from '@/components/ui/Card'
import type { Tables } from '@/lib/db/database.types'
import { cn } from '@/lib/utils/cn'

type Marcador = Pick<
  Tables<'map_markers'>,
  'id' | 'x' | 'y' | 'type' | 'label' | 'created_by'
>
type TipoMarcador = Marcador['type']

const TIPOS: { valor: TipoMarcador; etiqueta: string; color: string }[] = [
  { valor: 'objective', etiqueta: 'Objetivo', color: 'bg-alerta' },
  { valor: 'transport', etiqueta: 'Transporte', color: 'bg-acento' },
  { valor: 'gank', etiqueta: 'Gank', color: 'bg-peligro' },
]

const COLOR_POR_TIPO: Record<TipoMarcador, string> = {
  objective: 'bg-alerta',
  transport: 'bg-acento',
  gank: 'bg-peligro',
}

const NOMBRE_POR_TIPO: Record<TipoMarcador, string> = {
  objective: 'objetivo',
  transport: 'transporte',
  gank: 'gank',
}

export function MapaEstrategico({
  marcadoresIniciales,
}: {
  marcadoresIniciales: Marcador[]
}) {
  const [tipo, setTipo] = useState<TipoMarcador>('objective')
  const [error, setError] = useState<string | null>(null)
  const [, iniciar] = useTransition()

  /**
   * useOptimistic: el marcador aparece apenas se hace clic, sin esperar el
   * viaje al servidor. Si la acción falla, React revierte el estado solo.
   */
  const [marcadores, aplicarOptimista] = useOptimistic(
    marcadoresIniciales,
    (
      estado: Marcador[],
      accion: { tipo: 'agregar'; marcador: Marcador } | { tipo: 'quitar'; id: string },
    ) =>
      accion.tipo === 'agregar'
        ? [...estado, accion.marcador]
        : estado.filter((m) => m.id !== accion.id),
  )

  function alHacerClic(evento: React.MouseEvent<HTMLDivElement>) {
    const rect = evento.currentTarget.getBoundingClientRect()
    const x = ((evento.clientX - rect.left) / rect.width) * 100
    const y = ((evento.clientY - rect.top) / rect.height) * 100

    setError(null)

    iniciar(async () => {
      aplicarOptimista({
        tipo: 'agregar',
        marcador: {
          id: `temporal-${Date.now()}`,
          x,
          y,
          type: tipo,
          label: null,
          created_by: null,
        },
      })

      const resultado = await crearMarcador({ x, y, type: tipo })
      if (!resultado.ok) setError(resultado.error)
    })
  }

  function quitar(id: string) {
    setError(null)
    iniciar(async () => {
      aplicarOptimista({ tipo: 'quitar', id })
      const resultado = await eliminarMarcador(id)
      if (!resultado.ok) setError(resultado.error)
    })
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Mapa estratégico</h1>
          <p className="mt-0.5 text-sm text-texto-tenue">
            Hacé clic para agregar un marcador. Lo ve todo el gremio.
          </p>
        </div>

        <div
          className="flex items-center gap-1 rounded-lg bg-superficie-alta p-1"
          role="radiogroup"
          aria-label="Tipo de marcador"
        >
          {TIPOS.map(({ valor, etiqueta, color }) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={tipo === valor}
              onClick={() => setTipo(valor)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                tipo === valor
                  ? 'bg-borde text-texto'
                  : 'text-texto-tenue hover:text-texto',
              )}
            >
              <span className={cn('size-2 rounded-full', color)} />
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Aviso tono="error" className="mb-3">
          {error}
        </Aviso>
      )}

      <div
        onClick={alHacerClic}
        className="relative aspect-video w-full cursor-crosshair overflow-hidden rounded-lg border border-borde bg-superficie-alta bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://albiononline.com/assets/images/uploads/media/data/26/map_royal_continent.jpg')",
        }}
      >
        {marcadores.map((marcador) => (
          <button
            key={marcador.id}
            type="button"
            onClick={(e) => {
              // Sin esto, el clic para borrar burbujea al mapa y crea otro
              // marcador justo encima del que se acaba de eliminar.
              e.stopPropagation()
              quitar(marcador.id)
            }}
            title={`Eliminar marcador de ${NOMBRE_POR_TIPO[marcador.type]}`}
            aria-label={`Eliminar marcador de ${NOMBRE_POR_TIPO[marcador.type]}`}
            style={{ left: `${marcador.x}%`, top: `${marcador.y}%` }}
            className={cn(
              'absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125',
              COLOR_POR_TIPO[marcador.type],
            )}
          />
        ))}
      </div>

      <p className="mt-2 text-xs text-texto-tenue">
        {marcadores.length} marcador{marcadores.length === 1 ? '' : 'es'}. Hacé
        clic en uno para eliminarlo.
      </p>
    </Card>
  )
}
