import { Card } from '@/components/ui/Card'
import { IconoPergamino } from '@/components/ui/Iconos'
import { Vacio } from '@/components/ui/Vacio'
import { exigirAdmin } from '@/lib/auth/sesion'
import { createClient } from '@/lib/supabase/server'
import { fechaHora } from '@/lib/utils/formato'

export const metadata = { title: 'Registro' }

/**
 * Las cinco acciones que la base registra hoy.
 *
 * Faltaban dos: `map_cleared` y `leadership_transferred`, que se agregaron con
 * la jerarquía de roles y el mapa moderable pero nunca llegaron a esta tabla.
 * Se mostraban con el identificador crudo, que es justo lo que un registro de
 * auditoría no tiene que hacer: lo lee alguien que quiere entender qué pasó,
 * no el nombre interno de la función.
 *
 * El `?? registro.action` de abajo es la red: si mañana se agrega una acción y
 * nadie toca este archivo, se ve fea pero se ve.
 */
const ACCIONES: Record<string, string> = {
  user_role_changed: 'Cambió un rol',
  user_status_changed: 'Cambió un estado',
  user_deleted: 'Eliminó un usuario',
  map_cleared: 'Limpió el mapa',
  leadership_transferred: 'Transfirió el liderazgo',
}

function detallesLegibles(detalles: unknown): string {
  if (!detalles || typeof detalles !== 'object') return '—'

  const partes = Object.entries(detalles as Record<string, unknown>)
    .filter(([, valor]) => valor != null)
    .map(([clave, valor]) => `${clave}: ${String(valor)}`)

  return partes.length > 0 ? partes.join(' · ') : '—'
}

export default async function Registro() {
  /*
    El registro pasó a ser una pestaña de Administración, así que exige lo mismo
    que Administración. La política RLS de audit_logs sigue siendo más amplia
    —deja leer a un Oficial— y está bien que así sea: la autoridad es la base, y
    esta pantalla simplemente no es el único camino a esos datos.
  */
  await exigirAdmin()

  const supabase = await createClient()
  const { data: registros } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <Card>
      {!registros || registros.length === 0 ? (
        <Vacio
          icono={IconoPergamino}
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
                    className="grabado pb-2 pr-4 text-left"
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
  )
}
