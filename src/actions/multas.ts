'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { exigirOficial, exigirAdmin } from '@/lib/auth/sesion'
import { avisarMulta } from '@/lib/discord/aviso'
import { createClient } from '@/lib/supabase/server'

export type ResultadoMulta = { ok: true } | { ok: false; error: string }

const esquema = z.object({
  profile_id: z.string().uuid(),
  monto: z.coerce.number().int().min(0).max(1_000_000_000),
  motivo: z
    .string()
    .trim()
    .min(3, 'Escribí el motivo')
    .max(500, 'El motivo no puede pasar de 500 caracteres'),
})

export async function ponerMulta(entrada: unknown): Promise<ResultadoMulta> {
  const oficial = await exigirOficial()

  const validado = esquema.safeParse(entrada)
  if (!validado.success) {
    return {
      ok: false,
      error: validado.error.issues[0]?.message ?? 'Revisá los datos.',
    }
  }

  const d = validado.data
  const supabase = await createClient()

  const { error } = await supabase.from('fines').insert({
    profile_id: d.profile_id,
    monto: d.monto,
    motivo: d.motivo,
    emitida_por: oficial.id,
  })

  if (error) return { ok: false, error: error.message }

  // Se anuncia DESPUÉS de guardar: si Discord falla, la multa igual quedó.
  const { data: multado } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', d.profile_id)
    .maybeSingle()

  await avisarMulta({
    miembro: multado?.name ?? 'un miembro',
    monto: d.monto,
    motivo: d.motivo,
    emitidaPor: oficial.name,
  })

  revalidatePath('/admin/multas')
  revalidatePath('/perfil')
  return { ok: true }
}

/**
 * Marca una multa como saldada o perdonada.
 *
 * Perdonar NO es lo mismo que borrar: el antecedente queda. Por eso esto es un
 * cambio de estado y no un delete, y por eso borrar de verdad está reservado al
 * admin en una acción aparte.
 */
export async function resolverMulta(
  id: string,
  estado: 'pagada' | 'perdonada',
): Promise<ResultadoMulta> {
  await exigirOficial()

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('fines')
    .update(
      { estado, saldada_en: new Date().toISOString() },
      { count: 'exact' },
    )
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  if (count === 0) return { ok: false, error: 'No se pudo actualizar la multa.' }

  revalidatePath('/admin/multas')
  revalidatePath('/perfil')
  return { ok: true }
}

export async function reabrirMulta(id: string): Promise<ResultadoMulta> {
  await exigirOficial()

  const supabase = await createClient()
  const { error } = await supabase
    .from('fines')
    .update({ estado: 'pendiente', saldada_en: null })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/multas')
  revalidatePath('/perfil')
  return { ok: true }
}

export async function borrarMulta(id: string): Promise<ResultadoMulta> {
  await exigirAdmin()

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('fines')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  if (count === 0) return { ok: false, error: 'No tenés permiso para borrarla.' }

  revalidatePath('/admin/multas')
  revalidatePath('/perfil')
  return { ok: true }
}
