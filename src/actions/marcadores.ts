'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { createClient } from '@/lib/supabase/server'

const marcadorSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  type: z.enum(['transport', 'gank', 'objective']),
  label: z.string().trim().max(120).optional(),
})

export type ResultadoMarcador = { ok: true } | { ok: false; error: string }

/**
 * Guarda un marcador del mapa.
 *
 * En la versión anterior los marcadores vivían en un useState: se perdían al
 * recargar y no los veía nadie más, lo que dejaba a la página de "planificación
 * estratégica" sin ninguna utilidad compartida.
 */
export async function crearMarcador(entrada: unknown): Promise<ResultadoMarcador> {
  const perfil = await exigirMiembroActivo()

  const validado = marcadorSchema.safeParse(entrada)
  if (!validado.success) {
    return { ok: false, error: 'Marcador inválido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('map_markers').insert({
    ...validado.data,
    label: validado.data.label || null,
    created_by: perfil.id,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/rutas')
  return { ok: true }
}

export async function eliminarMarcador(id: string): Promise<ResultadoMarcador> {
  await exigirMiembroActivo()

  const supabase = await createClient()

  // Sin filtro por autor: de eso se encarga la política RLS, que deja borrar
  // al creador o a un oficial.
  const { error, count } = await supabase
    .from('map_markers')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  if (count === 0) {
    return { ok: false, error: 'No podés eliminar este marcador.' }
  }

  revalidatePath('/rutas')
  return { ok: true }
}
