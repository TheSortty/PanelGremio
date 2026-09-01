import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Asistencia } from '@/components/eventos/Asistencia'
import { AccionesEvento } from '@/components/eventos/AccionesEvento'
import { Card, CardTitulo } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { asistenciasDe, miRespuesta, obtenerEvento } from '@/lib/data/eventos'
import {
  ETIQUETAS_RESPUESTA,
  RESPUESTAS,
  contarRespuestas,
  porRol,
  yaPaso,
  type Respuesta,
} from '@/lib/domain/eventos'
import { puedeEditarBuild } from '@/lib/domain/roles'
import { fechaHora } from '@/lib/utils/formato'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const evento = await obtenerEvento(id)
  return { title: evento?.titulo ?? 'Evento' }
}

export default async function DetalleEvento({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const perfil = await exigirMiembroActivo()
  const { id } = await params

  const evento = await obtenerEvento(id)
  if (!evento) notFound()

  const [asistencias, mia] = await Promise.all([
    asistenciasDe(id),
    miRespuesta(id, perfil.id),
  ])

  const cuenta = contarRespuestas(asistencias)
  const roles = porRol(asistencias)
  const cerrado = yaPaso(evento.comienza_en)
  const puedeEditar = puedeEditarBuild(perfil.role, evento.autor?.id, perfil.id)

  return (
    <div className="space-y-5">
      <Link
        href="/eventos"
        className="inline-block text-sm text-texto-suave transition-colors hover:text-texto"
      >
        ← Volver a eventos
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Etiqueta tono="acento">{evento.tipo}</Etiqueta>
              {cerrado && <Etiqueta>Ya pasó</Etiqueta>}
            </div>
            <h1 className="mt-2 text-2xl font-bold">{evento.titulo}</h1>
            <p className="mt-1 text-sm text-texto-suave">
              {fechaHora(evento.comienza_en)}
            </p>
            <p className="mt-0.5 text-xs text-texto-tenue">
              por {evento.autor?.name ?? 'desconocido'}
            </p>
          </div>
          {puedeEditar && (
            <AccionesEvento eventoId={evento.id} titulo={evento.titulo} />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-borde-suave pt-4">
          {evento.lugar && <Etiqueta>Punto de reunión: {evento.lugar}</Etiqueta>}
          {evento.ip_minimo !== null && (
            <Etiqueta>IP mínimo: {evento.ip_minimo}</Etiqueta>
          )}
        </div>

        {evento.descripcion && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-texto-suave">
            {evento.descripcion}
          </p>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitulo>Quiénes van</CardTitulo>

          <div className="mb-5 grid grid-cols-3 gap-3">
            {RESPUESTAS.map((r) => (
              <div key={r} className="rounded-lg border border-borde-suave bg-fondo p-3">
                <p className="grabado">{ETIQUETAS_RESPUESTA[r]}</p>
                <p className="mt-1 font-titulo text-2xl font-bold tabular-nums">
                  {cuenta[r]}
                </p>
              </div>
            ))}
          </div>

          {Object.keys(roles).length > 0 && (
            <div className="mb-5">
              <p className="grabado mb-2">Composición confirmada</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(roles)
                  .sort((a, b) => b[1] - a[1])
                  .map(([rol, n]) => (
                    <Etiqueta key={rol} tono="acento">
                      {n}× {rol}
                    </Etiqueta>
                  ))}
              </div>
            </div>
          )}

          {asistencias.length === 0 ? (
            <p className="text-sm text-texto-tenue">Todavía no respondió nadie.</p>
          ) : (
            <ul className="divide-y divide-borde-suave">
              {asistencias.map((a) => (
                <li
                  key={a.profile_id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="truncate font-medium">{a.nombre}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {a.rol && (
                      <span className="text-xs text-texto-tenue">{a.rol}</span>
                    )}
                    <Etiqueta
                      tono={
                        a.respuesta === 'voy'
                          ? 'exito'
                          : a.respuesta === 'quizas'
                            ? 'alerta'
                            : 'peligro'
                      }
                    >
                      {ETIQUETAS_RESPUESTA[a.respuesta]}
                    </Etiqueta>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitulo>{cerrado ? 'Tu respuesta' : '¿Vas?'}</CardTitulo>
          <Asistencia
            eventoId={evento.id}
            respuestaInicial={(mia?.respuesta as Respuesta) ?? null}
            rolInicial={mia?.rol ?? null}
            cerrado={cerrado}
          />
        </Card>
      </div>
    </div>
  )
}
