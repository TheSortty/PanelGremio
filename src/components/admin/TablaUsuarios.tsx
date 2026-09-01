'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import {
  cambiarEstado,
  cambiarRol,
  eliminarUsuario,
  transferirLiderazgo,
} from '@/actions/usuarios'
import { FichaSolicitud } from '@/components/admin/FichaSolicitud'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { Modal } from '@/components/ui/Modal'
import { Vacio } from '@/components/ui/Vacio'
import {
  CAPACIDAD_DE_ROL,
  ETIQUETAS_ESTADO,
  ROLES,
  esMaestro,
  type GuildRole,
  type UserStatus,
} from '@/lib/domain/roles'
import type { Solicitud } from '@/lib/domain/solicitud'
import { cn } from '@/lib/utils/cn'
import { fechaCorta, tiempoRelativo } from '@/lib/utils/formato'

type Usuario = {
  id: string
  name: string
  avatar_url: string | null
  role: GuildRole
  status: UserStatus
  created_at: string
  last_seen: string
}

const TONO_ESTADO: Record<UserStatus, 'exito' | 'alerta' | 'peligro'> = {
  active: 'exito',
  pending: 'alerta',
  rejected: 'peligro',
}

const FILTROS = [
  { valor: 'pending', etiqueta: 'Pendientes' },
  { valor: 'active', etiqueta: 'Activos' },
  { valor: 'all', etiqueta: 'Todos' },
] as const

export function TablaUsuarios({
  usuarios,
  filtroActual,
  idAdmin,
  rolAdmin,
  solicitudes,
  capturas,
}: {
  usuarios: Usuario[]
  filtroActual: string
  idAdmin: string
  rolAdmin: GuildRole
  /** Solicitud de cada postulante, indexada por id de perfil. */
  solicitudes: Record<string, Solicitud>
  /** Ruta en el bucket -> URL firmada, para mostrar las capturas. */
  capturas: Record<string, string>
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [aEliminar, setAEliminar] = useState<Usuario | null>(null)
  const [aSuceder, setASuceder] = useState<Usuario | null>(null)
  const [pendiente, iniciar] = useTransition()

  function ejecutar(accion: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    iniciar(async () => {
      const resultado = await accion()
      if (!resultado.ok) setError(resultado.error ?? 'Algo salió mal.')
      else router.refresh()
    })
  }

  return (
    <>
      <Card>
        <div className="mb-4 flex gap-1.5">
          {FILTROS.map(({ valor, etiqueta }) => (
            <Link
              key={valor}
              href={`/admin?filtro=${valor}`}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                filtroActual === valor
                  ? 'bg-acento text-sobre-acento'
                  : 'bg-superficie-alta text-texto-suave hover:text-texto',
              )}
            >
              {etiqueta}
            </Link>
          ))}
        </div>

        {error && (
          <Aviso tono="error" className="mb-3">
            {error}
          </Aviso>
        )}

        {usuarios.length === 0 ? (
          <Vacio titulo="No hay usuarios en esta vista" />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-borde text-left">
                  {['Nombre', 'Rol', 'Estado', 'Registro', 'Última vez', ''].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="grabado pb-2 pr-4 text-left"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde-suave">
                {usuarios.map((usuario) => {
                  const esUnoMismo = usuario.id === idAdmin
                  // Solo el Maestro del Gremio puede tocar a otro Maestro.
                  // Es el mismo criterio que aplica admin_cambiar_rol en la base.
                  const esMaestroAjeno =
                    usuario.role === 'Maestro del Gremio' &&
                    rolAdmin !== 'Maestro del Gremio'
                  const bloqueado = esUnoMismo || esMaestroAjeno || pendiente

                  return (
                    <tr key={usuario.id}>
                      <td className="py-2.5 pr-4 font-medium">
                        {usuario.name}
                        {esUnoMismo && (
                          <span className="ml-1.5 text-xs text-texto-tenue">(vos)</span>
                        )}
                      </td>

                      <td className="py-2.5 pr-4">
                        <select
                          value={usuario.role}
                          disabled={bloqueado}
                          onChange={(e) =>
                            ejecutar(() => cambiarRol(usuario.id, e.target.value))
                          }
                          aria-label={`Rol de ${usuario.name}`}
                          className="rounded-md border border-borde bg-superficie-alta px-2 py-1 text-xs disabled:opacity-50"
                        >
                          {ROLES.map((rol) => (
                            <option key={rol} value={rol} title={CAPACIDAD_DE_ROL[rol]}>
                              {rol}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2.5 pr-4">
                        <Etiqueta tono={TONO_ESTADO[usuario.status]}>
                          {ETIQUETAS_ESTADO[usuario.status]}
                        </Etiqueta>
                      </td>

                      <td className="whitespace-nowrap py-2.5 pr-4 text-texto-tenue">
                        {fechaCorta(usuario.created_at)}
                      </td>

                      <td className="whitespace-nowrap py-2.5 pr-4 text-texto-tenue">
                        {tiempoRelativo(usuario.last_seen)}
                      </td>

                      <td className="py-2.5">
                        <div className="flex justify-end gap-1.5">
                          {/* La solicitud primero: se lee ANTES de decidir. */}
                          {solicitudes[usuario.id] && (
                            <FichaSolicitud
                              nombre={usuario.name}
                              solicitud={solicitudes[usuario.id]!}
                              capturas={capturas}
                            />
                          )}
                          {usuario.status !== 'active' && (
                            <Boton
                              tamano="sm"
                              variante="secundario"
                              disabled={bloqueado}
                              onClick={() =>
                                ejecutar(() => cambiarEstado(usuario.id, 'active'))
                              }
                            >
                              Aprobar
                            </Boton>
                          )}
                          {usuario.status === 'pending' && (
                            <Boton
                              tamano="sm"
                              variante="secundario"
                              disabled={bloqueado}
                              onClick={() =>
                                ejecutar(() => cambiarEstado(usuario.id, 'rejected'))
                              }
                            >
                              Rechazar
                            </Boton>
                          )}
                          {/* Ceder el liderazgo: solo el Maestro, y solo a un
                              miembro activo que no sea él mismo. Antes no
                              existía forma de hacerlo desde la aplicación. */}
                          {esMaestro(rolAdmin) &&
                            !esUnoMismo &&
                            usuario.status === 'active' && (
                              <Boton
                                tamano="sm"
                                variante="secundario"
                                disabled={pendiente}
                                onClick={() => setASuceder(usuario)}
                              >
                                Ceder mando
                              </Boton>
                            )}
                          <Boton
                            tamano="sm"
                            variante="peligro"
                            disabled={bloqueado}
                            onClick={() => setAEliminar(usuario)}
                          >
                            Eliminar
                          </Boton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/*
        Confirmación en un modal en vez de window.confirm(), que bloquea el hilo
        del navegador, no se puede estilar y en algunos contextos ni aparece.
      */}
      <Modal
        abierto={aEliminar !== null}
        onCerrar={() => setAEliminar(null)}
        titulo="Eliminar usuario"
      >
        <p className="text-sm text-texto-suave">
          Se va a eliminar la cuenta de{' '}
          <span className="font-medium text-texto">{aEliminar?.name}</span> y
          todas sus builds. Esta acción no se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setAEliminar(null)}>
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            disabled={pendiente}
            onClick={() => {
              const objetivo = aEliminar
              setAEliminar(null)
              if (objetivo) ejecutar(() => eliminarUsuario(objetivo.id))
            }}
          >
            {pendiente ? 'Eliminando…' : 'Eliminar'}
          </Boton>
        </div>
      </Modal>

      <Modal
        abierto={aSuceder !== null}
        onCerrar={() => setASuceder(null)}
        titulo="Ceder el liderazgo"
      >
        <p className="text-sm text-texto-suave">
          <span className="font-medium text-texto">{aSuceder?.name}</span> pasa a
          ser Maestro del Gremio, y vos bajás a Mano Derecha.
        </p>
        <p className="mt-2 text-sm text-texto-tenue">
          Los dos cambios ocurren juntos. Después de esto ya no vas a poder
          revertirlo por tu cuenta: solo el nuevo Maestro puede devolverte el
          mando.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setASuceder(null)}>
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            disabled={pendiente}
            onClick={() => {
              const objetivo = aSuceder
              setASuceder(null)
              if (objetivo) ejecutar(() => transferirLiderazgo(objetivo.id))
            }}
          >
            {pendiente ? 'Transfiriendo…' : 'Ceder el mando'}
          </Boton>
        </div>
      </Modal>
    </>
  )
}
