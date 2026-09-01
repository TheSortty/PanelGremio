export const TIPOS_EVENTO = [
  'ZvZ',
  'GvG',
  'Mazmorra',
  'Recolección',
  'Faction',
  'Otro',
] as const
export type TipoEvento = (typeof TIPOS_EVENTO)[number]

export const RESPUESTAS = ['voy', 'quizas', 'no_voy'] as const
export type Respuesta = (typeof RESPUESTAS)[number]

export const ETIQUETAS_RESPUESTA: Record<Respuesta, string> = {
  voy: 'Voy',
  quizas: 'Quizás',
  no_voy: 'No voy',
}

export type Evento = {
  id: string
  titulo: string
  tipo: TipoEvento
  descripcion: string | null
  comienza_en: string
  lugar: string | null
  ip_minimo: number | null
  creado_por: string | null
  autor: { id: string; name: string } | null
}

export type Asistencia = {
  profile_id: string
  respuesta: Respuesta
  rol: string | null
  nombre: string
}

/** Cuántos dijeron cada cosa. Es el número que mira un caller. */
export function contarRespuestas(asistencias: Asistencia[]) {
  return {
    voy: asistencias.filter((a) => a.respuesta === 'voy').length,
    quizas: asistencias.filter((a) => a.respuesta === 'quizas').length,
    no_voy: asistencias.filter((a) => a.respuesta === 'no_voy').length,
  }
}

/**
 * Cuántos confirmaron por rol.
 *
 * Solo cuenta a los que dijeron que van: saber que "quizás venga un sanador" no
 * sirve para decidir si sale la party.
 */
export function porRol(asistencias: Asistencia[]): Record<string, number> {
  const cuenta: Record<string, number> = {}
  for (const a of asistencias) {
    if (a.respuesta !== 'voy' || !a.rol) continue
    cuenta[a.rol] = (cuenta[a.rol] ?? 0) + 1
  }
  return cuenta
}

export function yaPaso(comienzaEn: string, ahora = new Date()): boolean {
  return new Date(comienzaEn).getTime() < ahora.getTime()
}
