'use client'

import { useState } from 'react'

import { Boton } from '@/components/ui/Boton'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { IconoPergamino } from '@/components/ui/Iconos'
import { Modal } from '@/components/ui/Modal'
import { ETIQUETAS_CUENTA, type Solicitud, type TipoCuenta } from '@/lib/domain/solicitud'
import { fechaHora } from '@/lib/utils/formato'

/**
 * La solicitud de un postulante, para el staff.
 *
 * Se abre en un diálogo y no en una página aparte porque la decisión se toma en
 * la misma pantalla donde están los botones de aprobar y rechazar: mandar al
 * revisor a otra ruta y hacerlo volver es exactamente la fricción que hoy hace
 * que las solicitudes queden sin responder.
 *
 * Las capturas se muestran con URLs firmadas que el servidor generó para esta
 * visita. El bucket es privado: son fotos de la cuenta de alguien.
 */
export function FichaSolicitud({
  nombre,
  solicitud,
  capturas,
}: {
  nombre: string
  solicitud: Solicitud
  /** Ruta en el bucket -> URL firmada. */
  capturas: Record<string, string>
}) {
  const [abierta, setAbierta] = useState(false)

  const urlStats = capturas[solicitud.captura_stats]
  const urlPerfil = capturas[solicitud.captura_perfil]

  return (
    <>
      <Boton tamano="sm" variante="secundario" onClick={() => setAbierta(true)}>
        <IconoPergamino className="text-sm" />
        Solicitud
      </Boton>

      <Modal
        abierto={abierta}
        onCerrar={() => setAbierta(false)}
        titulo={`Solicitud de ${nombre}`}
      >
        <dl className="space-y-3 text-sm">
          <Dato etiqueta="Edad" valor={String(solicitud.edad)} />
          <Dato etiqueta="Horario" valor={solicitud.horario} />
          <Dato etiqueta="Dispositivo" valor={solicitud.dispositivo} />
          <Dato
            etiqueta="Cuenta"
            valor={ETIQUETAS_CUENTA[solicitud.cuenta as TipoCuenta]}
          />
          <Dato
            etiqueta="Rol"
            valor={
              solicitud.rol_juego_secundario
                ? `${solicitud.rol_juego_principal} · ${solicitud.rol_juego_secundario}`
                : solicitud.rol_juego_principal
            }
          />

          <div>
            <dt className="grabado">Contenido</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {solicitud.contenido.map((c) => (
                <Etiqueta key={c} tono="acento">
                  {c}
                </Etiqueta>
              ))}
            </dd>
          </div>

          <Dato etiqueta="Gremio anterior" valor={solicitud.gremio_anterior || '—'} />
          <Dato etiqueta="Lo trajo" valor={solicitud.quien_lo_trajo || '—'} />
          <Dato etiqueta="Discord" valor={solicitud.discord || '—'} />
          <Dato etiqueta="Enviada" valor={fechaHora(solicitud.enviada_en)} />
        </dl>

        <div className="mt-5 space-y-3 border-t border-borde-suave pt-4">
          <p className="grabado">Capturas</p>

          {[
            { url: urlStats, titulo: 'Estadísticas personales' },
            { url: urlPerfil, titulo: 'Perfil de la cuenta' },
          ].map(({ url, titulo }) =>
            url ? (
              // Se abre en pestaña nueva para poder verla en grande: dentro del
              // diálogo entra chica y hay que revisar detalles.
              <a
                key={titulo}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-borde transition-colors hover:border-acento"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={titulo} className="w-full" />
                <span className="block px-3 py-2 text-xs text-texto-tenue">
                  {titulo} — abrir en grande
                </span>
              </a>
            ) : (
              <p key={titulo} className="text-sm text-peligro">
                No se pudo cargar la captura de {titulo.toLowerCase()}.
              </p>
            ),
          )}
        </div>
      </Modal>
    </>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="grabado">{etiqueta}</dt>
      <dd className="mt-0.5 text-texto-suave">{valor}</dd>
    </div>
  )
}
