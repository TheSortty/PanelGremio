import 'server-only'

import type { Solicitud } from '@/lib/domain/solicitud'
import { createClient } from '@/lib/supabase/server'

const CAMPOS = `
  id, profile_id, edad, horario, dispositivo, gremio_anterior, cuenta,
  rol_juego_principal, rol_juego_secundario, quien_lo_trajo, contenido,
  discord, captura_stats, captura_perfil, enviada_en, actualizada_en
` as const

/**
 * La solicitud de una persona.
 *
 * La política RLS deja verla a quien la mandó y a un admin, así que esta misma
 * función sirve para el formulario del postulante y para la revisión del staff.
 */
export async function obtenerSolicitud(
  profileId: string,
): Promise<Solicitud | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('applications')
    .select(CAMPOS)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as Solicitud
}

/** Las solicitudes de varias personas, indexadas por perfil. */
export async function obtenerSolicitudes(
  ids: string[],
): Promise<Map<string, Solicitud>> {
  const porPerfil = new Map<string, Solicitud>()
  if (ids.length === 0) return porPerfil

  const supabase = await createClient()

  // En tandas: la lista de administración puede traer 500 perfiles y un .in()
  // con 500 uuid arma una URL enorme.
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await supabase
      .from('applications')
      .select(CAMPOS)
      .in('profile_id', ids.slice(i, i + 100))

    for (const fila of (data ?? []) as unknown as Solicitud[]) {
      porPerfil.set(fila.profile_id, fila)
    }
  }

  return porPerfil
}

/**
 * URLs firmadas para ver las capturas.
 *
 * El bucket es privado —son fotos de la cuenta de alguien—, así que no hay una
 * URL permanente. Se firma una que dura poco y solo sirve para esta visita a la
 * pantalla de revisión.
 */
export async function firmarCapturas(
  rutas: string[],
  segundos = 300,
): Promise<Map<string, string>> {
  const firmadas = new Map<string, string>()
  if (rutas.length === 0) return firmadas

  const supabase = await createClient()
  const { data } = await supabase.storage
    .from('solicitudes')
    .createSignedUrls(rutas, segundos)

  for (const item of data ?? []) {
    if (item.signedUrl && item.path) firmadas.set(item.path, item.signedUrl)
  }

  return firmadas
}
