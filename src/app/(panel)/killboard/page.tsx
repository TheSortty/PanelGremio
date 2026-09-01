import Link from 'next/link'

import { IconoItem } from '@/components/builds/Icono'
import { Card } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { IconoCalavera } from '@/components/ui/Iconos'
import { Vacio } from '@/components/ui/Vacio'
import { ultimasMuertes } from '@/lib/albion/killboard'
import { REGIONES } from '@/lib/albion/regiones'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { obtenerAjustes } from '@/lib/data/ajustes'
import { puedeGestionarUsuarios } from '@/lib/domain/roles'
import { plata } from '@/lib/mercado/economia'
import { tiempoRelativo } from '@/lib/utils/formato'
import { cn } from '@/lib/utils/cn'

export const metadata = { title: 'Killboard' }

export default async function Killboard() {
  const perfil = await exigirMiembroActivo()
  const ajustes = await obtenerAjustes()

  if (!ajustes.albion_guild_id) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Killboard</h1>
        <Vacio
          icono={IconoCalavera}
          titulo="Falta decir cuál es el gremio"
          descripcion="El killboard sale de la API de Albion, y para pedirlo hay que saber a qué gremio mirar."
          accion={
            puedeGestionarUsuarios(perfil.role) ? (
              <Link
                href="/admin/ajustes"
                className="rounded-lg bg-acento px-5 py-2.5 text-sm font-medium text-sobre-acento"
              >
                Configurarlo
              </Link>
            ) : undefined
          }
        />
      </div>
    )
  }

  const { muertes, disponible } = await ultimasMuertes(
    ajustes.albion_guild_id,
    ajustes.region,
    50,
  )

  const aFavor = muertes.filter((m) => m.aFavor).length
  const enContra = muertes.length - aFavor
  const famaGanada = muertes
    .filter((m) => m.aFavor)
    .reduce((t, m) => t + m.fama, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Killboard</h1>
          <p className="mt-0.5 text-sm text-texto-tenue">
            {ajustes.albion_guild_name} · {REGIONES[ajustes.region].etiqueta}
          </p>
        </div>
      </div>

      {!disponible ? (
        <Vacio
          icono={IconoCalavera}
          titulo="La API de Albion no respondió"
          descripcion="Pasa cada tanto y se arregla solo. Probá de nuevo en un rato."
        />
      ) : muertes.length === 0 ? (
        <Vacio
          icono={IconoCalavera}
          titulo="Sin muertes registradas"
          descripcion="Albion solo publica los eventos recientes. Si el gremio estuvo tranquilo, no hay nada que mostrar."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="grabado">A favor</p>
              <p className="mt-1.5 font-titulo text-3xl font-bold tabular-nums text-exito">
                {aFavor}
              </p>
            </Card>
            <Card>
              <p className="grabado">En contra</p>
              <p className="mt-1.5 font-titulo text-3xl font-bold tabular-nums text-peligro">
                {enContra}
              </p>
            </Card>
            <Card>
              <p className="grabado">Fama ganada</p>
              <p className="mt-1.5 font-titulo text-3xl font-bold tabular-nums">
                {plata(famaGanada)}
              </p>
            </Card>
          </div>

          <Card>
            <div className="-mx-6 overflow-x-auto px-6">
              <table className="w-full min-w-[46rem] text-sm">
                <thead>
                  <tr className="border-b border-borde text-left">
                    <th className="grabado pb-2 pr-4 text-left">Mató</th>
                    <th className="grabado pb-2 pr-4 text-left">Murió</th>
                    <th className="grabado pb-2 pr-4 text-right">Fama</th>
                    <th className="grabado pb-2 pr-4 text-right">Gente</th>
                    <th className="grabado pb-2 text-left">Cuándo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde-suave">
                  {muertes.map((m) => (
                    <tr
                      key={m.id}
                      className={cn(
                        'transition-colors hover:bg-superficie-alta/40',
                        // Una franja de color a la izquierda dice de un vistazo
                        // si la fila es una victoria o una baja.
                        m.aFavor
                          ? 'border-l-2 border-l-exito'
                          : 'border-l-2 border-l-peligro',
                      )}
                    >
                      <td className="py-2 pl-2 pr-4">
                        <Combatiente {...m.killer} />
                      </td>
                      <td className="py-2 pr-4">
                        <Combatiente {...m.victima} />
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-texto-suave">
                        {plata(m.fama)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-texto-tenue">
                        {m.participantes}
                      </td>
                      <td className="whitespace-nowrap py-2 text-texto-tenue">
                        {tiempoRelativo(m.fecha.toISOString())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-texto-tenue">
              Datos de la API oficial de Albion, actualizados cada cinco minutos.
              Solo publica los eventos recientes: esto no es el historial
              completo del gremio.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}

function Combatiente({
  nombre,
  gremio,
  ip,
  arma,
}: {
  nombre: string
  gremio: string | null
  ip: number
  arma: string | null
}) {
  return (
    <div className="flex items-center gap-2.5">
      {arma ? (
        <IconoItem
          id={arma.split('@')[0]!}
          nombre={arma}
          encantamiento={(Number(arma.split('@')[1]) || 0) as 0 | 1 | 2 | 3 | 4}
          tamano="mini"
          className="size-9 shrink-0 rounded-lg border border-borde bg-superficie-alta"
        />
      ) : (
        <span className="size-9 shrink-0 rounded-lg border border-dashed border-borde" />
      )}
      <div className="min-w-0">
        <p className="truncate font-medium">{nombre}</p>
        <p className="truncate text-xs text-texto-tenue">
          {gremio ?? 'sin gremio'} · {ip} IP
        </p>
      </div>
    </div>
  )
}
