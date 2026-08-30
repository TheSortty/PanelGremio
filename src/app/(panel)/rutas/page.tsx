import { MapaEstrategico } from '@/components/mapa/MapaEstrategico'
import { Aviso } from '@/components/ui/Aviso'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Rutas' }

export default async function Rutas() {
  await exigirMiembroActivo()
  const supabase = await createClient()

  const { data: marcadores, error } = await supabase
    .from('map_markers')
    .select('id, x, y, type, label, created_by')
    .order('created_at', { ascending: true })
    .limit(500)

  if (error) {
    return <Aviso tono="error">No pudimos cargar el mapa: {error.message}</Aviso>
  }

  return <MapaEstrategico marcadoresIniciales={marcadores ?? []} />
}
