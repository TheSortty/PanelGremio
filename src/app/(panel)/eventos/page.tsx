import Link from 'next/link'

import { Boton } from '@/components/ui/Boton'
import { Card } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { IconoEstandarte, IconoMas } from '@/components/ui/Iconos'
import { Vacio } from '@/components/ui/Vacio'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { confirmadosPorEvento, listarEventos } from '@/lib/data/eventos'
import { yaPaso } from '@/lib/domain/eventos'
import { esOficial } from '@/lib/domain/roles'
import { fechaHora } from '@/lib/utils/formato'
import { cn } from '@/lib/utils/cn'

export const metadata = { title: 'Eventos' }

export default async function Eventos() {
  const perfil = await exigirMiembroActivo()
  const puedeCrear = esOficial(perfil.role)

  const eventos = await listarEventos()
  const confirmados = await confirmadosPorEvento(eventos.map((e) => e.id))

  const proximos = eventos.filter((e) => !yaPaso(e.comienza_en)).reverse()
  const pasados = eventos.filter((e) => yaPaso(e.comienza_en))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Eventos</h1>
          <p className="mt-0.5 text-sm text-texto-tenue">
            Qué se juega y quién va. Las horas se muestran en la tuya.
          </p>
        </div>
        {puedeCrear && (
          <Link href="/eventos/nuevo">
            <Boton>
              <IconoMas className="text-sm" />
              Nuevo evento
            </Boton>
          </Link>
        )}
      </div>

      {eventos.length === 0 ? (
        <Vacio
          icono={IconoEstandarte}
          titulo="Todavía no hay eventos"
          descripcion="Creá el primero y el gremio va a poder confirmar asistencia."
          accion={
            puedeCrear ? (
              <Link href="/eventos/nuevo">
                <Boton>
                  <IconoMas className="text-sm" />
                  Nuevo evento
                </Boton>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {proximos.length > 0 && (
            <section className="space-y-3">
              <h2 className="grabado">Próximos</h2>
              {proximos.map((e) => (
                <Fila
                  key={e.id}
                  evento={e}
                  confirmados={confirmados.get(e.id) ?? 0}
                />
              ))}
            </section>
          )}

          {pasados.length > 0 && (
            <section className="space-y-3">
              <h2 className="grabado">Ya pasaron</h2>
              {pasados.map((e) => (
                <Fila
                  key={e.id}
                  evento={e}
                  confirmados={confirmados.get(e.id) ?? 0}
                  pasado
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function Fila({
  evento,
  confirmados,
  pasado,
}: {
  evento: {
    id: string
    titulo: string
    tipo: string
    comienza_en: string
    lugar: string | null
    ip_minimo: number | null
  }
  confirmados: number
  pasado?: boolean
}) {
  return (
    <Link
      href={`/eventos/${evento.id}`}
      className={cn(
        'losa flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:border-acento',
        // Los pasados se atenúan pero no se esconden: sirven para ver qué se
        // hizo y quién fue.
        pasado && 'opacity-60',
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Etiqueta tono="acento">{evento.tipo}</Etiqueta>
          <h3 className="truncate text-lg font-semibold">{evento.titulo}</h3>
        </div>
        <p className="mt-1 text-sm text-texto-suave">
          {fechaHora(evento.comienza_en)}
          {evento.lugar && ` · ${evento.lugar}`}
          {evento.ip_minimo !== null && ` · ${evento.ip_minimo} IP mínimo`}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-titulo text-2xl font-bold tabular-nums text-exito">
          {confirmados}
        </p>
        <p className="grabado">confirmados</p>
      </div>
    </Link>
  )
}
