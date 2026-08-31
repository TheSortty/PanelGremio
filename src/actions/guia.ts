'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { createClient } from '@/lib/supabase/server'

export type ResultadoGuia =
  | { ok: true; guia: string }
  | { ok: false; error: string }

/**
 * Guarda la guía de una build.
 *
 * Antes esto llamaba a Gemini y guardaba lo que devolviera. Se sacó: una guía
 * de build es criterio —cuándo entrar, a quién no pelear, qué comprar
 * primero—, y eso lo tiene quien juega la build, no un modelo que solo vio la
 * lista de ítems. El texto generado además sonaba a manual y había que leerlo
 * entero para descubrir que no decía nada.
 *
 * Quién puede escribir lo decide la política RLS de `builds`: el autor la suya,
 * un Oficial cualquiera. Acá no se vuelve a filtrar por autor a propósito;
 * duplicar la regla en dos capas es lo que hace que se desincronicen. Si la
 * política rechaza, no se actualiza ninguna fila y se informa.
 */
const guiaSchema = z
  .string()
  .max(20000, 'La guía no puede pasar de 20.000 caracteres')

export async function guardarGuia(
  buildId: string,
  texto: string,
): Promise<ResultadoGuia> {
  await exigirMiembroActivo()

  const validada = guiaSchema.safeParse(texto)
  if (!validada.success) {
    return {
      ok: false,
      error: validada.error.issues[0]?.message ?? 'Guía inválida.',
    }
  }

  const limpia = validada.data.trim()

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('builds')
    .update({ guide: limpia || null }, { count: 'exact' })
    .eq('id', buildId)

  if (error) return { ok: false, error: error.message }
  if (count === 0) {
    return { ok: false, error: 'No tenés permiso para editar esta build.' }
  }

  revalidatePath(`/builds/${buildId}`)
  return { ok: true, guia: limpia }
}
