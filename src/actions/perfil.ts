'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { obtenerPerfil } from '@/lib/auth/sesion'
import { createClient } from '@/lib/supabase/server'

export type ResultadoPerfil =
  | { ok: true; mensaje: string }
  | { ok: false; error: string }

const nombreSchema = z
  .string()
  .trim()
  .min(2, 'El nombre necesita al menos 2 caracteres')
  .max(36, 'El nombre no puede pasar de 36 caracteres')

/**
 * Cambia el nombre de personaje.
 *
 * Al rol `authenticated` se le otorgó UPDATE sobre `profiles` solo en las
 * columnas `name` y `avatar_url`, así que esta acción no puede tocar el rol ni
 * el estado aunque quisiera.
 */
export async function cambiarNombre(nombre: string): Promise<ResultadoPerfil> {
  const perfil = await obtenerPerfil()
  if (!perfil) return { ok: false, error: 'No hay sesión.' }

  const validado = nombreSchema.safeParse(nombre)
  if (!validado.success) {
    return { ok: false, error: validado.error.issues[0]?.message ?? 'Nombre inválido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ name: validado.data })
    .eq('id', perfil.id)

  if (error) {
    // El nombre es unique y citext, así que "Sortty" y "sortty" chocan.
    if (error.code === '23505') {
      return { ok: false, error: 'Ese nombre ya está en uso por otro miembro.' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath('/perfil')
  revalidatePath('/panel')
  return { ok: true, mensaje: 'Nombre actualizado.' }
}

const contrasenaSchema = z
  .string()
  .min(8, 'La contraseña necesita al menos 8 caracteres')
  .max(72, 'La contraseña no puede pasar de 72 caracteres')

/**
 * Cambia la contraseña.
 *
 * Se verifica la contraseña actual con un signInWithPassword antes de aceptar
 * la nueva. Supabase no lo exige por defecto: `updateUser({ password })` cambia
 * la clave con solo tener la sesión abierta. Eso significa que alguien que
 * agarre la computadora desbloqueada puede quedarse con la cuenta sin conocer
 * la contraseña. La comprobación previa cierra esa puerta.
 */
export async function cambiarContrasena(
  actual: string,
  nueva: string,
): Promise<ResultadoPerfil> {
  const perfil = await obtenerPerfil()
  if (!perfil) return { ok: false, error: 'No hay sesión.' }

  const validada = contrasenaSchema.safeParse(nueva)
  if (!validada.success) {
    return { ok: false, error: validada.error.issues[0]?.message ?? 'Contraseña inválida.' }
  }
  if (actual === nueva) {
    return { ok: false, error: 'La contraseña nueva es igual a la actual.' }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return {
      ok: false,
      error:
        'Esta cuenta no tiene contraseña: entrás con Discord o Steam. Cambiá la clave en ese proveedor.',
    }
  }

  // Verificación de la contraseña actual.
  const { error: eVerificacion } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: actual,
  })
  if (eVerificacion) {
    return { ok: false, error: 'La contraseña actual no es correcta.' }
  }

  const { error } = await supabase.auth.updateUser({ password: validada.data })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/perfil')
  return { ok: true, mensaje: 'Contraseña actualizada.' }
}
