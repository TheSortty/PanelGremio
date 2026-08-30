'use server'

import { revalidatePath } from 'next/cache'

import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { puedeModerarMapa } from '@/lib/domain/roles'
import { createClient } from '@/lib/supabase/server'

export type ResultadoMapa =
  | { ok: true; borrados: number }
  | { ok: false; error: string }

/**
 * Borra todos los marcadores del mapa.
 *
 * Es destructivo y sin deshacer, así que lo hace una función SECURITY DEFINER
 * que verifica el rol y deja constancia en el registro de auditoría en la
 * misma transacción.
 */
export async function limpiarMapa(): Promise<ResultadoMapa> {
  const perfil = await exigirMiembroActivo()

  // Chequeo temprano solo para dar un mensaje claro; la autoridad es la
  // función de la base, que vuelve a verificar.
  if (!puedeModerarMapa(perfil.role)) {
    return { ok: false, error: 'Se requiere rol de Oficial o superior.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('limpiar_mapa')

  if (error) return { ok: false, error: error.message }

  revalidatePath('/rutas')
  return { ok: true, borrados: data ?? 0 }
}

export async function renombrarMarcador(
  id: string,
  etiqueta: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await exigirMiembroActivo()

  const limpia = etiqueta.trim().slice(0, 120)
  const supabase = await createClient()

  const { error, count } = await supabase
    .from('map_markers')
    .update({ label: limpia || null }, { count: 'exact' })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  if (count === 0) return { ok: false, error: 'No podés editar este marcador.' }

  revalidatePath('/rutas')
  return { ok: true }
}
