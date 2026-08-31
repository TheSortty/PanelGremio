import type { ComponentType, SVGProps } from 'react'

import { TablaMiembros } from '@/components/panel/TablaMiembros'
import { Card } from '@/components/ui/Card'
import { Aviso } from '@/components/ui/Aviso'
import { IconoEstandarte, IconoLlama, IconoYelmo } from '@/components/ui/Iconos'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Panel' }

/**
 * Una cifra del gremio.
 *
 * El icono va apagado y a la derecha: identifica la tarjeta de un vistazo sin
 * competir con el número, que es lo que se viene a leer.
 */
function Estadistica({
  titulo,
  valor,
  detalle,
  icono: Icono,
}: {
  titulo: string
  valor: string | number
  detalle?: string
  icono: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="grabado">{titulo}</p>
        <Icono className="shrink-0 text-lg text-acento/45" />
      </div>
      <p className="mt-1.5 font-titulo text-3xl font-bold tabular-nums">{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-texto-tenue">{detalle}</p>}
    </Card>
  )
}

export default async function Panel() {
  await exigirMiembroActivo()
  const supabase = await createClient()

  // Se pide a la vista guild_members, donde `online` se calcula a partir de
  // last_seen. La columna booleana de la versión anterior nunca se escribía,
  // así que este número siempre era 0.
  const { data: miembros, error } = await supabase
    .from('guild_members')
    .select('*')
    .order('last_seen', { ascending: false })
    // Límite explícito: PostgREST corta en 1000 filas por defecto y no lo
    // informa. Mejor decidir el número acá que descubrir el recorte después.
    .limit(500)

  if (error) {
    return (
      <Aviso tono="error">
        No pudimos cargar los miembros del gremio: {error.message}
      </Aviso>
    )
  }

  const total = miembros?.length ?? 0
  const enLinea = miembros?.filter((m) => m.online).length ?? 0

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Estadistica titulo="Miembros totales" valor={total} icono={IconoYelmo} />
        <Estadistica
          titulo="En línea ahora"
          valor={enLinea}
          detalle="Activos en los últimos 5 minutos"
          icono={IconoLlama}
        />
        <Card>
          <div className="flex items-start justify-between gap-3">
            <p className="grabado">Próximo evento</p>
            <IconoEstandarte className="shrink-0 text-lg text-acento/45" />
          </div>
          <p className="mt-1.5 font-titulo text-lg font-semibold leading-snug">
            ZvZ — mañana 18:00 UTC
          </p>
          <p className="mt-0.5 text-xs text-texto-tenue">
            Fijo en el código; todavía no hay calendario de eventos.
          </p>
        </Card>
      </div>

      <TablaMiembros miembros={miembros ?? []} />
    </div>
  )
}
