import { TablaUsuarios } from '@/components/admin/TablaUsuarios'
import { Aviso } from '@/components/ui/Aviso'
import { exigirAdmin } from '@/lib/auth/sesion'
import { firmarCapturas, obtenerSolicitudes } from '@/lib/data/solicitudes'
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

  /*
    Las solicitudes de los que están en pantalla, y las URLs firmadas de sus
    capturas.

    Se firman en el servidor y para esta visita: el bucket es privado, así que
    no hay una URL permanente que se pueda pegar en un chat. Duran cinco
    minutos, que alcanza para revisar y no para repartir.
  */
  const ids = (usuarios ?? []).map((u) => u.id)
  const solicitudes = await obtenerSolicitudes(ids)

  const rutas = [...solicitudes.values()].flatMap((s) => [
    s.captura_stats,
    s.captura_perfil,
  ])
  const capturas = await firmarCapturas(rutas)

  return (
    <TablaUsuarios
        usuarios={usuarios ?? []}
        filtroActual={filtro}
        idAdmin={admin.id}
      rolAdmin={admin.role}
      solicitudes={Object.fromEntries(solicitudes)}
      capturas={Object.fromEntries(capturas)}
    />
  )
}
