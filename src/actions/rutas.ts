'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { rutaInputSchema } from '@/lib/domain/rutas'
import { puedeUsarMapa } from '@/lib/domain/roles'
import { createClient } from '@/lib/supabase/server'

export type ResultadoRuta =
  | { ok: true }
  | { ok: false; error: string; campos?: Record<string, string[]> }

function limpiar(entrada: unknown) {
  const validado = rutaInputSchema.safeParse(entrada)
  if (!validado.success) {
    return {
      ok: false as const,
      error: 'Revisá los datos de la ruta.',
      campos: validado.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { name, origin, destination, notes, steps } = validado.data
  return {
    ok: true as const,
    fila: {
      name,
      origin,
      destination: destination || null,
      notes: notes || null,
      // Los pasos van tal cual salieron de zod: con las notas vacías
      // normalizadas a undefined y sin campos de más.
      steps: steps.map((p) => ({
        name: p.name,
        kind: p.kind,
        ...(p.notes ? { notes: p.notes } : {}),
      })),
    },
  }
}

export async function crearRuta(entrada: unknown): Promise<ResultadoRuta> {
  const perfil = await exigirMiembroActivo()

  // Chequeo temprano solo para dar un mensaje claro; la autoridad es la
  // política RLS, que vuelve a verificar.
  if (!puedeUsarMapa(perfil.role)) {
    return { ok: false, error: 'Se requiere rol de Miembro o superior.' }
  }

  const limpio = limpiar(entrada)
  if (!limpio.ok) return limpio

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('routes')
    // author_id lo exige también la política de inserción, así que aunque acá
    // se mandara otro id la base rechazaría la fila.
    .insert({ ...limpio.fila, author_id: perfil.id })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/rutas')
  redirect(`/rutas/${data.id}`)
}

export async function actualizarRuta(
  id: string,
  entrada: unknown,
): Promise<ResultadoRuta> {
  await exigirMiembroActivo()

  const limpio = limpiar(entrada)
  if (!limpio.ok) return limpio

  const supabase = await createClient()

  // Sin filtro por autor: eso lo decide la política RLS, que deja editar al
  // autor y a un oficial. Si no corresponde, no actualiza ninguna fila.
  const { error, count } = await supabase
    .from('routes')
    .update(limpio.fila, { count: 'exact' })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  if (count === 0) {
    return { ok: false, error: 'No tenés permiso para editar esta ruta.' }
  }

  revalidatePath('/rutas')
  revalidatePath(`/rutas/${id}`)
  redirect(`/rutas/${id}`)
}

export async function eliminarRuta(id: string): Promise<ResultadoRuta> {
  await exigirMiembroActivo()

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('routes')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  if (count === 0) {
    return { ok: false, error: 'No tenés permiso para eliminar esta ruta.' }
  }

  revalidatePath('/rutas')
  redirect('/rutas')
}
