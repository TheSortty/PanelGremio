import { Card } from '@/components/ui/Card'
import { Vacio } from '@/components/ui/Vacio'
import { exigirOficial } from '@/lib/auth/sesion'
import { createClient } from '@/lib/supabase/server'
import { fechaHora } from '@/lib/utils/formato'

export const metadata = { title: 'Registro' }

const ACCIONES: Record<string, string> = {
  user_role_changed: 'Cambió un rol',
  user_status_changed: 'Cambió un estado',
  user_deleted: 'Eliminó un usuario',
}

function detallesLegibles(detalles: unknown): string {
  if (!detalles || typeof detalles !== 'object') return '—'

  const partes = Object.entries(detalles as Record<string, unknown>)
    .filter(([, valor]) => valor != null)
    .map(([clave, valor]) => `${clave}: ${String(valor)}`)

  return partes.length > 0 ? partes.join(' · ') : '—'
}

export default async function Registro() {
  // Oficial o superior. La política RLS de audit_logs aplica exactamente el
  // mismo criterio, así que la pantalla y la base no pueden discrepar.
  await exigirOficial()

  const supabase = await createClient()
  const { data: registros } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Registro de auditoría</h1>
        <p className="mt-0.5 text-sm text-texto-tenue">
          Historial de acciones administrativas.
        </p>
      </div>

      <Card>
        {!registros || registros.length === 0 ? (
          <Vacio
            titulo="Sin actividad registrada"
            descripcion="Acá aparecen las aprobaciones, cambios de rol y bajas de usuarios."
          />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[38rem] text-sm">
              <thead>
                <tr className="border-b border-borde text-left">
                  {['Fecha', 'Autor', 'Acción', 'Detalles'].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wider text-texto-tenue"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde-suave">
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td className="whitespace-nowrap py-2.5 pr-4 text-texto-tenue">
                      {fechaHora(registro.created_at)}
                    </td>
                    <td className="py-2.5 pr-4 font-medium">
                      {registro.actor_name}
                    </td>
                    <td className="py-2.5 pr-4 text-texto-suave">
                      {ACCIONES[registro.action] ?? registro.action}
                    </td>
                    <td className="py-2.5 text-texto-tenue">
                      {detallesLegibles(registro.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
