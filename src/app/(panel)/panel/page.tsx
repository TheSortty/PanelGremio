import { TablaMiembros } from '@/components/panel/TablaMiembros'
import { Card } from '@/components/ui/Card'
import { Aviso } from '@/components/ui/Aviso'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Panel' }

function Estadistica({
  titulo,
  valor,
  detalle,
}: {
  titulo: string
  valor: string | number
  detalle?: string
}) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wider text-texto-tenue">
        {titulo}
      </p>
      <p className="mt-1.5 text-3xl font-bold tabular-nums">{valor}</p>
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
        <Estadistica titulo="Miembros totales" valor={total} />
        <Estadistica
          titulo="En línea ahora"
          valor={enLinea}
          detalle="Activos en los últimos 5 minutos"
        />
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-texto-tenue">
            Próximo evento
          </p>
          <p className="mt-1.5 text-lg font-semibold leading-snug">
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
