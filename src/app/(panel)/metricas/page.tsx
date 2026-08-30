import { GraficoActividad } from '@/components/metricas/GraficoActividad'
import { Aviso } from '@/components/ui/Aviso'
import { Vacio } from '@/components/ui/Vacio'
import { exigirOficial } from '@/lib/auth/sesion'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Métricas' }

export default async function Metricas() {
  await exigirOficial()

  const supabase = await createClient()

  /**
   * Se pide el nombre del miembro por la relación de la FK.
   *
   * La versión anterior devolvía las filas crudas de ActivityLog, que traen
   * `userId`, mientras el front leía `log.memberId`. Esa propiedad era siempre
   * undefined, así que los conjuntos de "miembros activos" se llenaban con un
   * único valor undefined y los modales salían vacíos.
   */
  const { data: registros, error } = await supabase
    .from('activity_logs')
    .select('occurred_at, profiles!activity_logs_profile_id_fkey ( name )')
    .order('occurred_at', { ascending: false })
    .limit(5000)

  if (error) {
    return <Aviso tono="error">No pudimos cargar las métricas: {error.message}</Aviso>
  }

  const eventos = (registros ?? []).map((r) => ({
    fecha: r.occurred_at,
    miembro:
      (r.profiles as unknown as { name: string } | null)?.name ?? 'desconocido',
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Métricas de actividad</h1>
        <p className="mt-0.5 text-sm text-texto-tenue">
          Cuándo se conecta el gremio. Útil para elegir horario de eventos.
        </p>
      </div>

      {eventos.length === 0 ? (
        <Vacio
          titulo="Todavía no hay datos de actividad"
          descripcion="Se registra una conexión por miembro y por hora. Los gráficos se llenan a medida que la gente entra al panel."
        />
      ) : (
        <GraficoActividad eventos={eventos} />
      )}
    </div>
  )
}
