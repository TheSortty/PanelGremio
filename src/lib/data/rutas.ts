import 'server-only'

import { parsearPasos, type Ruta } from '@/lib/domain/rutas'
import { createClient } from '@/lib/supabase/server'

const SELECCION = `
  id, name, origin, destination, notes, steps, created_at, updated_at,
  author:profiles!routes_author_id_fkey ( id, name )
` as const

type FilaCruda = {
  id: string
  name: string
  origin: string
  destination: string | null
  notes: string | null
  steps: unknown
  created_at: string
  updated_at: string
  author: { id: string; name: string } | null
}

function aRuta(fila: FilaCruda): Ruta {
  return { ...fila, steps: parsearPasos(fila.steps) }
}

/**
 * Listado de rutas.
 *
 * La búsqueda mira el nombre de la ruta y el mapa de entrada, que son las dos
 * formas en que alguien busca una: "la de Fort Sterling" o "la que va al norte".
 */
export async function listarRutas(busqueda?: string): Promise<Ruta[]> {
  const supabase = await createClient()

  let consulta = supabase
    .from('routes')
    .select(SELECCION)
    .order('created_at', { ascending: false })
    // Límite explícito: PostgREST corta en 1000 y no lo informa.
    .limit(200)

  const termino = busqueda?.trim()
  if (termino) {
    // Se sacan los caracteres que parten la expresión del .or() en dos.
    const limpio = termino.replace(/[(),*]/g, ' ').trim()
    if (limpio) {
      consulta = consulta.or(`name.ilike.*${limpio}*,origin.ilike.*${limpio}*`)
    }
  }

  const { data, error } = await consulta
  if (error) throw new Error(error.message)

  return (data as unknown as FilaCruda[]).map(aRuta)
}

export async function obtenerRuta(id: string): Promise<Ruta | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('routes')
    .select(SELECCION)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return aRuta(data as unknown as FilaCruda)
}
