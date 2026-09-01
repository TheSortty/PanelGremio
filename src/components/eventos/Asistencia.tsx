'use client'

import { useState, useTransition } from 'react'

import { responderEvento } from '@/actions/eventos'
import { Aviso } from '@/components/ui/Aviso'
import {
  ETIQUETAS_RESPUESTA,
  RESPUESTAS,
  type Respuesta,
} from '@/lib/domain/eventos'
import { ROLES_JUEGO } from '@/lib/domain/solicitud'
import { cn } from '@/lib/utils/cn'

/**
 * Confirmar asistencia a un evento.
 *
 * El rol va junto con la respuesta y no aparte: lo que el caller necesita antes
 * de armar la composición no es "van doce", es "van doce y tres son sanadores".
 * Pedirlo en un segundo paso garantizaría que la mitad no lo complete.
 *
 * Solo se pregunta el rol a quien dice que va o que quizás: a quien se baja no
 * le sirve de nada y sería una pregunta de más.
 */
const ESTILOS: Record<Respuesta, string> = {
  voy: 'border-exito bg-exito-fondo/40 text-exito',
  quizas: 'border-alerta bg-alerta-fondo/40 text-alerta',
  no_voy: 'border-peligro bg-peligro-fondo/40 text-peligro',
}

export function Asistencia({
  eventoId,
  respuestaInicial,
  rolInicial,
  cerrado,
}: {
  eventoId: string
  respuestaInicial: Respuesta | null
  rolInicial: string | null
  /** El evento ya pasó: se muestra lo que respondió pero no se puede cambiar. */
  cerrado: boolean
}) {
  const [respuesta, setRespuesta] = useState<Respuesta | null>(respuestaInicial)
  const [rol, setRol] = useState(rolInicial ?? '')
  const [error, setError] = useState<string | null>(null)
  const [guardando, iniciar] = useTransition()

  function responder(nueva: Respuesta, nuevoRol = rol) {
    setError(null)
    const antes = respuesta
    setRespuesta(nueva)

    iniciar(async () => {
      const r = await responderEvento(eventoId, nueva, nuevoRol)
      if (!r.ok) {
        // Se revierte para no dejar la pantalla diciendo algo que no se guardó.
        setRespuesta(antes)
        setError(r.error)
      }
    })
  }

  if (cerrado) {
    return (
      <p className="text-sm text-texto-tenue">
        {respuesta
          ? `Respondiste "${ETIQUETAS_RESPUESTA[respuesta]}"${rol ? ` como ${rol}` : ''}.`
          : 'No respondiste a este evento.'}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tu respuesta">
        {RESPUESTAS.map((r) => {
          const activa = respuesta === r
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={activa}
              disabled={guardando}
              onClick={() => responder(r)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60',
                activa
                  ? ESTILOS[r]
                  : 'border-borde bg-superficie-alta text-texto-suave hover:text-texto',
              )}
            >
              {ETIQUETAS_RESPUESTA[r]}
            </button>
          )
        })}
      </div>

      {respuesta && respuesta !== 'no_voy' && (
        <label className="block max-w-64">
          <span className="mb-1 block text-sm text-texto-suave">
            ¿Con qué rol vas?
          </span>
          <select
            className="campo"
            value={rol}
            disabled={guardando}
            onChange={(e) => {
              setRol(e.target.value)
              responder(respuesta, e.target.value)
            }}
          >
            <option value="">Sin definir</option>
            {ROLES_JUEGO.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && <Aviso tono="error">{error}</Aviso>}
    </div>
  )
}
