import 'server-only'

import type { Region } from '@/lib/albion/regiones'
import { createClient } from '@/lib/supabase/server'

export type Ajustes = {
  albion_guild_id: string | null
  albion_guild_name: string | null
  region: Region
}

/**
 * La configuración del gremio.
 *
 * La tabla tiene una sola fila, forzada por la clave booleana. Si por lo que
 * fuera no estuviera, se devuelven valores por defecto en vez de reventar: una
 * pantalla sin killboard es mejor que una pantalla rota.
 */
export async function obtenerAjustes(): Promise<Ajustes> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ajustes')
    .select('albion_guild_id, albion_guild_name, region')
    .eq('id', true)
    .maybeSingle()

  return {
    albion_guild_id: data?.albion_guild_id ?? null,
    albion_guild_name: data?.albion_guild_name ?? null,
    region: (data?.region ?? 'americas') as Region,
  }
}
