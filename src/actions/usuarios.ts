'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { exigirAdmin } from '@/lib/auth/sesion'
import { ROLES, esMaestro } from '@/lib/domain/roles'
import { createClient } from '@/lib/supabase/server'

export type ResultadoUsuario = { ok: true } | { ok: false; error: string }

const rolSchema = z.enum(ROLES as unknown as [string, ...string[]])
const estadoSchema = z.enum(['pending', 'active', 'rejected'])

/**
 * Todas las acciones de acá delegan en funciones SECURITY DEFINER de la base.
 *
 * Es a propósito: al rol `authenticated` se le otorgó UPDATE sobre `profiles`
 * únicamente en las columnas `name` y `avatar_url`. `role` y `status` no están
 * en ese grant, así que ni siquiera una petición armada a mano puede tocarlos.
 * Los cambia solo la función, que verifica quién llama y escribe el registro de
 * auditoría en la misma transacción.
 *
 * El backend anterior hacía un `prisma.user.update({ data: updates })` con el
 * cuerpo de la petición tal cual llegaba.
 */

export async function cambiarRol(
  usuarioId: string,
  rol: string,
): Promise<ResultadoUsuario> {
  await exigirAdmin()

  const valido = rolSchema.safeParse(rol)
  if (!valido.success) return { ok: false, error: 'Rol inválido.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_cambiar_rol', {
    usuario_id: usuarioId,
    nuevo_rol: valido.data as never,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath('/registro')
  return { ok: true }
}

export async function cambiarEstado(
  usuarioId: string,
  estado: string,
): Promise<ResultadoUsuario> {
  await exigirAdmin()

  const valido = estadoSchema.safeParse(estado)
  if (!valido.success) return { ok: false, error: 'Estado inválido.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_cambiar_estado', {
    usuario_id: usuarioId,
    nuevo_estado: valido.data,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath('/registro')
  revalidatePath('/panel')
  return { ok: true }
}

/**
 * Cede el liderazgo del gremio.
 *
 * Antes no había salida: admin_cambiar_rol impide que un Maestro se cambie el
 * rol a sí mismo y solo un Maestro puede asignar ese rol, así que si el Maestro
 * dejaba el gremio nadie podía sucederlo sin editar la base a mano.
 *
 * Los dos cambios (sucesor a Maestro, saliente a Mano Derecha) ocurren en una
 * sola transacción: en dos pasos podría quedar el gremio con dos Maestros o
 * con ninguno.
 */
export async function transferirLiderazgo(
  sucesorId: string,
): Promise<ResultadoUsuario> {
  const perfil = await exigirAdmin()

  if (!esMaestro(perfil.role)) {
    return {
      ok: false,
      error: 'Solo el Maestro del Gremio puede transferir el liderazgo.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('transferir_liderazgo', {
    nuevo_maestro: sucesorId,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath('/registro')
  return { ok: true }
}

export async function eliminarUsuario(
  usuarioId: string,
): Promise<ResultadoUsuario> {
  await exigirAdmin()

  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_eliminar_usuario', {
    usuario_id: usuarioId,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath('/registro')
  return { ok: true }
}
