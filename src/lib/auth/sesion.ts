import 'server-only'

import { redirect } from 'next/navigation'
import { cache } from 'react'

import type { Tables } from '@/lib/db/database.types'
import { esAdmin, esOficial } from '@/lib/domain/roles'
import { createClient } from '@/lib/supabase/server'

export type Perfil = Tables<'profiles'>

/**
 * Perfil del usuario de la petición actual, o null si no hay sesión.
 *
 * Envuelto en cache() de React: varios Server Components de la misma página
 * pueden pedir el perfil y se resuelve una sola consulta por petición. Es el
 * reemplazo del AuthContext, que hacía un fetch en el cliente y obligaba a
 * mostrar un spinner de pantalla completa en cada carga.
 */
export const obtenerPerfil = cache(async (): Promise<Perfil | null> => {
  const supabase = await createClient()

  // getUser() y no getSession(): getSession lee la cookie sin validar la firma
  // del token contra el servidor de auth, así que del lado del servidor no es
  // confiable para decidir permisos.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: perfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return perfil ?? null
})

/**
 * Exige sesión con el perfil ya aprobado.
 *
 * Un usuario 'pending' tiene sesión válida pero todavía no fue aceptado en el
 * gremio, así que va a la pantalla de espera en lugar del panel.
 */
export async function exigirMiembroActivo(): Promise<Perfil> {
  const perfil = await obtenerPerfil()

  if (!perfil) redirect('/login')
  if (perfil.status !== 'active') redirect('/auth/pendiente')

  return perfil
}

/** Exige permisos de lectura de métricas y auditoría (Oficial o superior). */
export async function exigirOficial(): Promise<Perfil> {
  const perfil = await exigirMiembroActivo()
  if (!esOficial(perfil.role)) redirect('/panel')
  return perfil
}

/** Exige permisos de gestión de usuarios (Maestro del Gremio o Mano Derecha). */
export async function exigirAdmin(): Promise<Perfil> {
  const perfil = await exigirMiembroActivo()
  if (!esAdmin(perfil.role)) redirect('/panel')
  return perfil
}
