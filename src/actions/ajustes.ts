'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { exigirAdmin } from '@/lib/auth/sesion'
import { buscarGremio } from '@/lib/albion/killboard'
import { REGIONES, type Region } from '@/lib/albion/regiones'
import { createClient } from '@/lib/supabase/server'

export type ResultadoAjustes = { ok: true } | { ok: false; error: string }

const esquema = z.object({
  albion_guild_id: z.string().trim().max(64),
  albion_guild_name: z.string().trim().max(120),
  region: z.enum(Object.keys(REGIONES) as [Region, ...Region[]]),
})

/**
 * Busca gremios en Albion para poder elegir el correcto.
 *
 * Se devuelve la lista y no el primero: hay gremios con nombres parecidos, y
 * elegir por nosotros el que más se parece es la forma de terminar mostrando el
 * killboard de otra gente.
 */
export async function buscarGremioEnAlbion(nombre: string, region: string) {
  await exigirAdmin()

  const valida = (
    region in REGIONES ? region : 'americas'
  ) as Region

  return buscarGremio(nombre, valida)
}

export async function guardarAjustes(entrada: unknown): Promise<ResultadoAjustes> {
  const admin = await exigirAdmin()

  const validado = esquema.safeParse(entrada)
  if (!validado.success) {
    return { ok: false, error: 'Revisá los datos del gremio.' }
  }

  const d = validado.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('ajustes')
    .update({
      albion_guild_id: d.albion_guild_id || null,
      albion_guild_name: d.albion_guild_name || null,
      region: d.region,
      actualizado_en: new Date().toISOString(),
      actualizado_por: admin.id,
    })
    .eq('id', true)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/killboard')
  revalidatePath('/admin/ajustes')
  return { ok: true }
}
