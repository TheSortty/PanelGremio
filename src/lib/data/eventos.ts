import 'server-only'

import type { Asistencia, Evento } from '@/lib/domain/eventos'
import { createClient } from '@/lib/supabase/server'

const CAMPOS = `
  id, titulo, tipo, descripcion, comienza_en, lugar, ip_minimo, creado_por,
  autor:profiles!events_creado_por_fkey ( id, name )
` as const

/**
 * Eventos, del más próximo al más lejano.
 *
 * Los que ya pasaron van al final y no se ocultan: sirven para ver qué se hizo
 * y quién fue, que es la mitad de para qué existe un calendario de gremio.
 */
export async function listarEventos(): Promise<Evento[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(CAMPOS)
    .order('comienza_en', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Evento[]
}

export async function obtenerEvento(id: string): Promise<Evento | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(CAMPOS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as unknown as Evento) ?? null
}

/** Quiénes respondieron a un evento, con su nombre resuelto. */
export async function asistenciasDe(eventoId: string): Promise<Asistencia[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('event_attendance')
    .select('profile_id, respuesta, rol, perfil:profiles!event_attendance_profile_id_fkey ( name )')
    .eq('event_id', eventoId)
    .limit(500)

  return (data ?? []).map((a) => ({
    profile_id: a.profile_id,
    respuesta: a.respuesta,
    rol: a.rol,
    nombre:
      (a as unknown as { perfil?: { name?: string } }).perfil?.name ?? 'desconocido',
  })) as Asistencia[]
}

/** Cuántos confirmaron a cada evento. Para el listado, sin traer los nombres. */
export async function confirmadosPorEvento(
  ids: string[],
): Promise<Map<string, number>> {
  const cuenta = new Map<string, number>()
  if (ids.length === 0) return cuenta

  const supabase = await createClient()
  const { data } = await supabase
    .from('event_attendance')
    .select('event_id')
    .in('event_id', ids)
    .eq('respuesta', 'voy')
    .limit(1000)

  for (const fila of data ?? []) {
    cuenta.set(fila.event_id, (cuenta.get(fila.event_id) ?? 0) + 1)
  }

  return cuenta
}

/** La respuesta de una persona a un evento, si respondió. */
export async function miRespuesta(
  eventoId: string,
  profileId: string,
): Promise<{ respuesta: string; rol: string | null } | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('event_attendance')
    .select('respuesta, rol')
    .eq('event_id', eventoId)
    .eq('profile_id', profileId)
    .maybeSingle()

  return data ?? null
}
