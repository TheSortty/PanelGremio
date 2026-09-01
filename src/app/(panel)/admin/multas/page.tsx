import { TablaMultas } from '@/components/admin/TablaMultas'
import { exigirAdmin } from '@/lib/auth/sesion'
import { listarMultas } from '@/lib/data/multas'
import { esAdmin } from '@/lib/domain/roles'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Multas' }

export default async function Multas() {
  const admin = await exigirAdmin()

  const multas = await listarMultas()

  // Solo se puede multar a miembros activos: a un pendiente no se lo sanciona,
  // se lo rechaza.
  const supabase = await createClient()
  const { data: miembros } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('status', 'active')
    .order('name')
    .limit(500)

  return (
    <TablaMultas
      multas={multas}
      miembros={miembros ?? []}
      esAdmin={esAdmin(admin.role)}
    />
  )
}
