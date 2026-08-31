'use client'

import { useOptimistic, useState, useTransition } from 'react'

import { limpiarMapa, renombrarMarcador } from '@/actions/mapa'
import { MapaRoyal } from '@/components/mapa/MapaRoyal'
import { crearMarcador, eliminarMarcador } from '@/actions/marcadores'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card } from '@/components/ui/Card'
import { IconoBandera, IconoCalavera, IconoCarro } from '@/components/ui/Iconos'
import { Modal } from '@/components/ui/Modal'
import type { Tables } from '@/lib/db/database.types'
import { cn } from '@/lib/utils/cn'

type Marcador = Pick<
  Tables<'map_markers'>,
  'id' | 'x' | 'y' | 'type' | 'label' | 'created_by'
>
type TipoMarcador = Marcador['type']

/**
 * Los tres tipos de marcador, cada uno con su glifo.
 *
 * Antes eran puntos de colores. Sobre una captura del mapa real —verde,
 * marrón y agua— tres círculos de 16 px se distinguían mal entre sí y peor
 * del terreno, y quien no diferencia rojo de verde no los distinguía en
 * absoluto. La forma resuelve las dos cosas: una bandera, un carro y una
 * calavera se leen aunque el color se pierda.
 */
const TIPOS: {
  valor: TipoMarcador
  etiqueta: string
  color: string
  icono: typeof IconoBandera
}[] = [
  { valor: 'objective', etiqueta: 'Objetivo', color: 'bg-alerta', icono: IconoBandera },
  { valor: 'transport', etiqueta: 'Transporte', color: 'bg-acento', icono: IconoCarro },
  { valor: 'gank', etiqueta: 'Gank', color: 'bg-peligro', icono: IconoCalavera },
]

const COLOR_POR_TIPO: Record<TipoMarcador, string> = {
  objective: 'bg-alerta text-sobre-acento',
  transport: 'bg-acento text-sobre-acento',
  gank: 'bg-peligro text-sobre-acento',
}

const ICONO_POR_TIPO: Record<TipoMarcador, typeof IconoBandera> = {
  objective: IconoBandera,
  transport: IconoCarro,
  gank: IconoCalavera,
}

const NOMBRE_POR_TIPO: Record<TipoMarcador, string> = {
  objective: 'objetivo',
  transport: 'transporte',
  gank: 'gank',
}

export function MapaEstrategico({
  marcadoresIniciales,
  puedeEditar,
  puedeModerar,
}: {
  marcadoresIniciales: Marcador[]
  /** Miembro o superior. Un Iniciado o un Invitado solo miran. */
  puedeEditar: boolean
  /** Oficial o superior: borra marcadores ajenos y limpia el mapa. */
  puedeModerar: boolean
}) {
  const [tipo, setTipo] = useState<TipoMarcador>('objective')
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<Marcador | null>(null)
  const [etiqueta, setEtiqueta] = useState('')
  const [confirmandoLimpieza, setConfirmandoLimpieza] = useState(false)
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
    if (!puedeEditar) return

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
            {puedeEditar
              ? 'Hacé clic para agregar un marcador. Lo ve todo el gremio.'
              : 'Solo lectura: se requiere rol de Miembro para poner marcadores.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {puedeModerar && marcadores.length > 0 && (
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() => setConfirmandoLimpieza(true)}
            >
              Limpiar mapa
            </Boton>
          )}

          {puedeEditar && (
            <div
              className="flex items-center gap-1 rounded-lg bg-superficie-alta p-1"
              role="radiogroup"
              aria-label="Tipo de marcador"
            >
          {TIPOS.map(({ valor, etiqueta: nombreTipo, color, icono: IconoTipo }) => (
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
              <IconoTipo
                className={cn(
                  'text-sm',
                  tipo === valor ? color.replace('bg-', 'text-') : undefined,
                )}
              />
              {nombreTipo}
            </button>
          ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <Aviso tono="error" className="mb-3">
          {error}
        </Aviso>
      )}

      <div
        onClick={alHacerClic}
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-lg border border-borde',
          puedeEditar ? 'cursor-crosshair' : 'cursor-default',
        )}
      >
        {/* El mapa va detrás y sin capturar el puntero: los clics tienen que
            llegar al contenedor, que es el que calcula la posición. */}
        <MapaRoyal className="pointer-events-none absolute inset-0 size-full" />
        {marcadores.map((marcador) => {
          const IconoMarcador = ICONO_POR_TIPO[marcador.type]

          return (
          <button
            key={marcador.id}
            type="button"
            onClick={(e) => {
              // Sin esto, el clic burbujea al mapa y crea otro marcador justo
              // encima del que se acaba de tocar.
              e.stopPropagation()
              if (!puedeEditar) return
              setEditando(marcador)
              setEtiqueta(marcador.label ?? '')
            }}
            title={
              marcador.label
                ? `${marcador.label} (${NOMBRE_POR_TIPO[marcador.type]})`
                : `Marcador de ${NOMBRE_POR_TIPO[marcador.type]}`
            }
            aria-label={
              marcador.label ?? `Marcador de ${NOMBRE_POR_TIPO[marcador.type]}`
            }
            style={{ left: `${marcador.x}%`, top: `${marcador.y}%` }}
            className={cn(
              'absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_1px_4px_oklch(0_0_0/0.6)] ring-2 ring-fondo/70 transition-transform hover:scale-125',
              COLOR_POR_TIPO[marcador.type],
            )}
          >
            <IconoMarcador className="text-[13px]" />
          </button>
          )
        })}
      </div>

      <p className="mt-2 text-xs text-texto-tenue">
        {marcadores.length} marcador{marcadores.length === 1 ? '' : 'es'}
        {puedeEditar && '. Hacé clic en uno para nombrarlo o eliminarlo.'}
      </p>

      {/* Nombrar o eliminar un marcador. La columna `label` existía desde la
          primera migración pero no había forma de escribirla. */}
      <Modal
        abierto={editando !== null}
        onCerrar={() => setEditando(null)}
        titulo="Marcador"
      >
        <label htmlFor="etiqueta" className="mb-1 block text-xs text-texto-suave">
          Nombre (opcional)
        </label>
        <input
          id="etiqueta"
          className="campo"
          value={etiqueta}
          onChange={(e) => setEtiqueta(e.target.value)}
          maxLength={120}
          placeholder="Portal de salida, punto de reunión…"
        />
        <div className="mt-5 flex justify-between gap-2">
          <Boton
            variante="peligro"
            onClick={() => {
              const m = editando
              setEditando(null)
              if (m) quitar(m.id)
            }}
          >
            Eliminar
          </Boton>
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Boton>
            <Boton
              onClick={() => {
                const m = editando
                setEditando(null)
                if (!m) return
                iniciar(async () => {
                  const r = await renombrarMarcador(m.id, etiqueta)
                  if (!r.ok) setError(r.error)
                })
              }}
            >
              Guardar
            </Boton>
          </div>
        </div>
      </Modal>

      <Modal
        abierto={confirmandoLimpieza}
        onCerrar={() => setConfirmandoLimpieza(false)}
        titulo="Limpiar el mapa"
      >
        <p className="text-sm text-texto-suave">
          Se van a borrar los {marcadores.length} marcadores del gremio. No se
          puede deshacer, y queda registrado en la auditoría.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton
            variante="secundario"
            onClick={() => setConfirmandoLimpieza(false)}
          >
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            onClick={() => {
              setConfirmandoLimpieza(false)
              iniciar(async () => {
                const r = await limpiarMapa()
                if (!r.ok) setError(r.error)
              })
            }}
          >
            Borrar todo
          </Boton>
        </div>
      </Modal>
    </Card>
  )
}
