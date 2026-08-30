'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { buildInputSchema } from '@/lib/domain/builds'
import { createClient } from '@/lib/supabase/server'

export type ResultadoAccion =
  | { ok: true }
  | { ok: false; error: string; campos?: Record<string, string[]> }

/**
 * Crea una build.
 *
 * Server Action en vez de un POST a la API: no hace falta un endpoint, ni
 * serializar a mano, ni un fetch en el cliente.
 *
 * Los datos se validan con zod antes de tocar la base. La versión anterior
 * mandaba el objeto Build completo tal cual salía del estado de React —con
 * `id: ''` y `author: null` incluidos— y el backend lo insertaba sin revisar
 * nada.
 */
export async function crearBuild(entrada: unknown): Promise<ResultadoAccion> {
  const perfil = await exigirMiembroActivo()

  const validado = buildInputSchema.safeParse(entrada)
  if (!validado.success) {
    return {
      ok: false,
      error: 'Revisá los datos de la build.',
      campos: validado.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { title, category, description, equipment, consumables, abilities } =
    validado.data

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('builds')
    .insert({
      title,
      category,
      description: description || null,
      // author_id lo exige también la política RLS de inserción, así que
      // aunque acá se mandara otro id, la base rechazaría la fila.
      author_id: perfil.id,
      equipment,
      consumables,
      abilities,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/builds')
  redirect(`/builds/${data.id}`)
}

export async function eliminarBuild(id: string): Promise<ResultadoAccion> {
  await exigirMiembroActivo()

  const supabase = await createClient()

  // Quién puede borrar lo decide la política RLS (autor u oficial). Si no
  // corresponde, no borra ninguna fila.
  const { error, count } = await supabase
    .from('builds')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  if (count === 0) {
    return { ok: false, error: 'No tenés permiso para eliminar esta build.' }
  }

  revalidatePath('/builds')
  redirect('/builds')
}
