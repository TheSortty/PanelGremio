import { GraficoActividad } from '@/components/metricas/GraficoActividad'
import { exigirOficial } from '@/lib/auth/sesion'

export const metadata = { title: 'Métricas' }

export default async function Metricas() {
  await exigirOficial()

  // La agregación la hace la base (public.metricas_actividad). La consulta se
  // dispara desde el componente cliente, que es el único que conoce la zona
  // horaria del navegador.
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Métricas de actividad</h1>
        <p className="mt-0.5 text-sm text-texto-tenue">
          Cuándo se conecta el gremio. Útil para elegir horario de eventos.
        </p>
      </div>

      <GraficoActividad />
    </div>
  )
}
