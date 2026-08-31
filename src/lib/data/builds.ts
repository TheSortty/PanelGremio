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
  id, title, category, description, guide, created_at,
  author:profiles!builds_author_id_fkey ( id, name )
` as const

type FilaCruda = {
  id: string
  title: string
  category: string
  description: string | null
  guide: string | null
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
    guide: fila.guide,
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
 * Trae `equipment` y `abilities` porque la vista de cuadrícula dibuja las dos
 * cosas; `consumables` no, que ahí no se muestran. La versión anterior traía
 * siempre la fila completa, guía incluida, para pintar seis iconos.
 */
export async function listarBuilds(categoria?: string, busqueda?: string) {
  const supabase = await createClient()

  let consulta = supabase
    .from('builds')
    .select(`${SELECCION}, equipment, abilities`)
    .order('created_at', { ascending: false })
    .limit(200)

  if (categoria) consulta = consulta.eq('category', categoria)

  /*
    La búsqueda mira el título y el nombre del arma.

    El arma vive dentro del JSONB de equipment, y PostgREST sabe navegarlo:
    `equipment->weapon->>name` se filtra igual que una columna. Comprobado
    contra la base real antes de escribirlo, porque si la ruta estuviera mal no
    daría error: devolvería cero filas en silencio, que es la peor forma de
    fallar para un buscador.

    Se filtra en la base y no en el cliente porque el listado corta en 200
    filas: filtrar después de traerlas buscaría solo dentro de esas 200.

    El término se escapa. Sin eso, una coma parte la expresión del .or() en dos
    condiciones y la consulta hace cualquier cosa.
  */
  const termino = busqueda?.trim()
  if (termino) {
    const limpio = termino.replace(/[(),*]/g, ' ').trim()
    if (limpio) {
      consulta = consulta.or(
        `title.ilike.*${limpio}*,equipment->weapon->>name.ilike.*${limpio}*`,
      )
    }
  }

  const { data, error } = await consulta
  if (error) throw new Error(error.message)

  return (data as unknown as FilaCruda[]).map((fila) =>
    aBuild({ ...fila, consumables: {} }),
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
