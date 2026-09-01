'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { exigirMiembroActivo, exigirOficial } from '@/lib/auth/sesion'
import { avisarEvento } from '@/lib/discord/aviso'
import { TIPOS_EVENTO, RESPUESTAS } from '@/lib/domain/eventos'
import { createClient } from '@/lib/supabase/server'

export type ResultadoEvento = { ok: true } | { ok: false; error: string }

const esquema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'El título necesita al menos 3 caracteres')
    .max(140),
  tipo: z.enum(TIPOS_EVENTO),
  descripcion: z.string().trim().max(4000).optional().or(z.literal('')),
  // Llega como valor de un <input type="datetime-local">, que no trae zona: lo
  // interpreta el navegador en su hora local y acá se guarda en UTC.
  comienza_en: z.string().min(1, 'Poné cuándo empieza'),
  lugar: z.string().trim().max(120).optional().or(z.literal('')),
  ip_minimo: z.coerce.number().int().min(0).max(2000).optional(),
})

export async function crearEvento(entrada: unknown): Promise<ResultadoEvento> {
  const oficial = await exigirOficial()

  const validado = esquema.safeParse(entrada)
  if (!validado.success) {
    return {
      ok: false,
      error: validado.error.issues[0]?.message ?? 'Revisá los datos del evento.',
    }
  }

  const d = validado.data
  const cuando = new Date(d.comienza_en)
  if (Number.isNaN(cuando.getTime())) {
    return { ok: false, error: 'La fecha no es válida.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .insert({
      titulo: d.titulo,
      tipo: d.tipo,
      descripcion: d.descripcion || null,
      comienza_en: cuando.toISOString(),
      lugar: d.lugar || null,
      ip_minimo: d.ip_minimo ?? null,
      creado_por: oficial.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  // Primero la web, después Discord. Si el webhook falla, el evento ya existe.
  await avisarEvento({
    id: data.id,
    titulo: d.titulo,
    tipo: d.tipo,
    comienzaEn: cuando,
    lugar: d.lugar || null,
    ipMinimo: d.ip_minimo ?? null,
    descripcion: d.descripcion || null,
  })

  revalidatePath('/eventos')
  revalidatePath('/panel')
  redirect(`/eventos/${data.id}`)
}

export async function eliminarEvento(id: string): Promise<ResultadoEvento> {
  await exigirMiembroActivo()

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('events')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  if (count === 0) {
    return { ok: false, error: 'No tenés permiso para eliminar este evento.' }
  }

  revalidatePath('/eventos')
  revalidatePath('/panel')
  redirect('/eventos')
}

/**
 * Confirmar, dudar o bajarse.
 *
 * Es un upsert sobre la clave (evento, persona): cambiar de opinión actualiza
 * la fila en vez de dejar dos respuestas contradictorias. Es lo que hace que el
 * conteo del caller sea confiable.
 */
export async function responderEvento(
  eventoId: string,
  respuesta: string,
  rol?: string,
): Promise<ResultadoEvento> {
  const perfil = await exigirMiembroActivo()

  if (!RESPUESTAS.includes(respuesta as (typeof RESPUESTAS)[number])) {
    return { ok: false, error: 'Respuesta inválida.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('event_attendance').upsert(
    {
      event_id: eventoId,
      profile_id: perfil.id,
      respuesta: respuesta as 'voy' | 'quizas' | 'no_voy',
      rol: rol?.trim() || null,
      respondido_en: new Date().toISOString(),
    },
    { onConflict: 'event_id,profile_id' },
  )

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/eventos/${eventoId}`)
  revalidatePath('/eventos')
  revalidatePath('/panel')
  return { ok: true }
}
