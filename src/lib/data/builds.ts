import 'server-only'

import {
  parsearConsumibles,
  parsearEquipo,
  parsearHabilidades,
  type Build,
} from '@/lib/domain/builds'
import { createClient } from '@/lib/supabase/server'

// El autor viene por la relación de la FK; se piden solo id y nombre para no
// exponer el correo ni el estado del resto de los miembros.
const SELECCION = `
  id, title, category, description, ai_guide, created_at,
  author:profiles!builds_author_id_fkey ( id, name )
` as const

type FilaCruda = {
  id: string
  title: string
  category: string
  description: string | null
  ai_guide: string | null
  created_at: string
  equipment: unknown
  consumables: unknown
  abilities: unknown
  author: { id: string; name: string } | null
}

function aBuild(fila: FilaCruda): Build {
  return {
    id: fila.id,
    title: fila.title,
    category: fila.category,
    description: fila.description,
    ai_guide: fila.ai_guide,
    created_at: fila.created_at,
    author: fila.author,
    equipment: parsearEquipo(fila.equipment),
    consumables: parsearConsumibles(fila.consumables),
    abilities: parsearHabilidades(fila.abilities),
  }
}

/**
 * Listado de builds.
 *
 * `equipment` se trae para poder dibujar los iconos en las tarjetas, pero
 * `abilities` no: en el listado no se muestran y son la parte más pesada del
 * JSON. La versión anterior traía siempre las filas completas.
 */
export async function listarBuilds(categoria?: string) {
  const supabase = await createClient()

  let consulta = supabase
    .from('builds')
    .select(`${SELECCION}, equipment`)
    .order('created_at', { ascending: false })
    .limit(200)

  if (categoria) consulta = consulta.eq('category', categoria)

  const { data, error } = await consulta
  if (error) throw new Error(error.message)

  return (data as unknown as FilaCruda[]).map((fila) =>
    aBuild({ ...fila, consumables: {}, abilities: {} }),
  )
}

export async function obtenerBuild(id: string): Promise<Build | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('builds')
    .select(`${SELECCION}, equipment, consumables, abilities`)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return aBuild(data as unknown as FilaCruda)
}
