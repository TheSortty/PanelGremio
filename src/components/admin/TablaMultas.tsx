'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import {
  borrarMulta,
  ponerMulta,
  reabrirMulta,
  resolverMulta,
} from '@/actions/multas'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card, CardTitulo } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { IconoMas, IconoPapelera } from '@/components/ui/Iconos'
import { Modal } from '@/components/ui/Modal'
import { Vacio } from '@/components/ui/Vacio'
import type { Multa } from '@/lib/data/multas'
import { plata } from '@/lib/mercado/economia'
import { fechaCorta } from '@/lib/utils/formato'

const TONO = {
  pendiente: 'alerta',
  pagada: 'exito',
  perdonada: 'neutro',
} as const

const ETIQUETA_ESTADO = {
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  perdonada: 'Perdonada',
} as const

/**
 * Las multas del gremio.
 *
 * PERDONAR NO ES BORRAR
 *
 * Son dos acciones distintas y a propósito: perdonar deja el antecedente
 * —queda que hubo una sanción y que se decidió no cobrarla—, borrar la
 * desaparece. Por eso perdonar lo puede hacer un oficial y borrar solo el
 * admin. Un registro de sanciones que se puede vaciar sin dejar rastro no es un
 * registro.
 */
export function TablaMultas({
  multas,
  miembros,
  esAdmin,
}: {
  multas: Multa[]
  miembros: { id: string; name: string }[]
  esAdmin: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  const [creando, setCreando] = useState(false)
  const [miembro, setMiembro] = useState('')
  const [monto, setMonto] = useState('')
  const [motivo, setMotivo] = useState('')

  const [borrando, setBorrando] = useState<Multa | null>(null)

  function ejecutar(accion: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    iniciar(async () => {
      const r = await accion()
      if (!r.ok) setError(r.error ?? 'No se pudo completar.')
      else router.refresh()
    })
  }

  function crear() {
    ejecutar(async () => {
      const r = await ponerMulta({ profile_id: miembro, monto: monto || 0, motivo })
      if (r.ok) {
        setCreando(false)
        setMiembro('')
        setMonto('')
        setMotivo('')
      }
      return r
    })
  }

  const totalPendiente = multas
    .filter((m) => m.estado === 'pendiente')
    .reduce((t, m) => t + Number(m.monto), 0)

  return (
    <div className="space-y-4">
      {error && <Aviso tono="error">{error}</Aviso>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-texto-suave">
          {multas.length} multa{multas.length === 1 ? '' : 's'}
          {totalPendiente > 0 && (
            <>
              {' · '}
              <span className="font-semibold tabular-nums text-alerta">
                {plata(totalPendiente)}
              </span>{' '}
              sin cobrar
            </>
          )}
        </p>
        <Boton onClick={() => setCreando(true)}>
          <IconoMas className="text-sm" />
          Poner una multa
        </Boton>
      </div>

      <Card>
        {multas.length === 0 ? (
          <Vacio
            titulo="Sin multas"
            descripcion="Cuando pongas una, el miembro la va a ver en su perfil."
          />
        ) : (
          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-borde text-left">
                  <th className="grabado pb-2 pr-4 text-left">Miembro</th>
                  <th className="grabado pb-2 pr-4 text-left">Motivo</th>
                  <th className="grabado pb-2 pr-4 text-right">Monto</th>
                  <th className="grabado pb-2 pr-4 text-left">Estado</th>
                  <th className="grabado pb-2 pr-4 text-left">Puesta</th>
                  <th className="grabado pb-2 text-left" />
                </tr>
              </thead>
              <tbody className="divide-y divide-borde-suave">
                {multas.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-superficie-alta/40">
                    <td className="py-2.5 pr-4 font-medium">
                      {m.miembro?.name ?? '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-texto-suave">{m.motivo}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {m.monto > 0 ? plata(m.monto) : '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Etiqueta tono={TONO[m.estado]}>
                        {ETIQUETA_ESTADO[m.estado]}
                      </Etiqueta>
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-4 text-texto-tenue">
                      {fechaCorta(m.emitida_en)}
                      {m.oficial && (
                        <span className="block text-xs">por {m.oficial.name}</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-1.5">
                        {m.estado === 'pendiente' ? (
                          <>
                            <Boton
                              tamano="sm"
                              variante="secundario"
                              disabled={pendiente}
                              onClick={() => ejecutar(() => resolverMulta(m.id, 'pagada'))}
                            >
                              Pagada
                            </Boton>
                            <Boton
                              tamano="sm"
                              variante="fantasma"
                              disabled={pendiente}
                              onClick={() =>
                                ejecutar(() => resolverMulta(m.id, 'perdonada'))
                              }
                            >
                              Perdonar
                            </Boton>
                          </>
                        ) : (
                          <Boton
                            tamano="sm"
                            variante="fantasma"
                            disabled={pendiente}
                            onClick={() => ejecutar(() => reabrirMulta(m.id))}
                          >
                            Reabrir
                          </Boton>
                        )}

                        {esAdmin && (
                          <Boton
                            tamano="sm"
                            variante="peligro"
                            disabled={pendiente}
                            onClick={() => setBorrando(m)}
                            aria-label={`Borrar la multa de ${m.miembro?.name}`}
                          >
                            <IconoPapelera className="text-sm" />
                          </Boton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        abierto={creando}
        onCerrar={() => setCreando(false)}
        titulo="Poner una multa"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">Miembro</span>
            <select
              className="campo"
              value={miembro}
              onChange={(e) => setMiembro(e.target.value)}
            >
              <option value="">Elegí a quién</option>
              {miembros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">
              Monto <span className="text-texto-tenue">(0 = solo advertencia)</span>
            </span>
            <input
              type="number"
              className="campo"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              min={0}
              placeholder="0"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">Motivo</span>
            <textarea
              className="campo min-h-20 resize-y"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={500}
              placeholder="No devolvió el set prestado del ZvZ del sábado"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setCreando(false)}>
            Cancelar
          </Boton>
          <Boton
            onClick={crear}
            disabled={pendiente || !miembro || motivo.trim().length < 3}
          >
            {pendiente ? 'Guardando…' : 'Poner la multa'}
          </Boton>
        </div>
      </Modal>

      <Modal
        abierto={borrando !== null}
        onCerrar={() => setBorrando(null)}
        titulo="Borrar la multa"
      >
        <p className="text-sm text-texto-suave">
          Borrar no es lo mismo que perdonar: perdonar deja el antecedente,
          borrar lo hace desaparecer. Si lo que querés es no cobrarla, usá
          Perdonar.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setBorrando(null)}>
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            disabled={pendiente}
            onClick={() => {
              const m = borrando
              setBorrando(null)
              if (m) ejecutar(() => borrarMulta(m.id))
            }}
          >
            Borrar igual
          </Boton>
        </div>
      </Modal>
    </div>
  )
}
