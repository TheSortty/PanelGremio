import { TablaUsuarios } from '@/components/admin/TablaUsuarios'
import { Aviso } from '@/components/ui/Aviso'
import { exigirAdmin } from '@/lib/auth/sesion'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Usuarios' }

const FILTROS = ['pending', 'active', 'all'] as const
type Filtro = (typeof FILTROS)[number]

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>
}) {
  const admin = await exigirAdmin()
  const { filtro: filtroCrudo } = await searchParams

  const filtro: Filtro = FILTROS.includes(filtroCrudo as Filtro)
    ? (filtroCrudo as Filtro)
    // Por defecto se muestran las solicitudes pendientes: es lo que un admin
    // entra a resolver.
    : 'pending'

  const supabase = await createClient()

  let consulta = supabase
    .from('profiles')
    .select('id, name, avatar_url, role, status, created_at, last_seen')
    .order('created_at', { ascending: false })
    .limit(500)

  if (filtro !== 'all') consulta = consulta.eq('status', filtro)

  const { data: usuarios, error } = await consulta

  if (error) {
    return <Aviso tono="error">No pudimos cargar los usuarios: {error.message}</Aviso>
  }

  return (
    <TablaUsuarios
        usuarios={usuarios ?? []}
        filtroActual={filtro}
        idAdmin={admin.id}
      rolAdmin={admin.role}
    />
  )
}
