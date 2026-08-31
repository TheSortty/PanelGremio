import { z } from 'zod'

/**
 * Rutas por los caminos avalonianos.
 *
 * Una ruta es una secuencia: se entra por un mapa, se cruzan otros, se toman
 * portales y se sale en algún lado. No hay geografía que dibujar —los portales
 * rotan y expiran—, así que lo que se guarda y se muestra es el orden.
 */

export const TIPOS_PASO = ['portal', 'mapa', 'salida'] as const
export type TipoPaso = (typeof TIPOS_PASO)[number]

export const ETIQUETAS_PASO: Record<TipoPaso, string> = {
  portal: 'Portal',
  mapa: 'Mapa',
  salida: 'Salida',
}

export const DESCRIPCIONES_PASO: Record<TipoPaso, string> = {
  portal: 'Un portal que hay que tomar.',
  mapa: 'Un mapa de camino que se cruza.',
  salida: 'La salida a zona conocida.',
}

export const pasoSchema = z.object({
  name: z.string().trim().min(1, 'El paso necesita un nombre').max(120),
  kind: z.enum(TIPOS_PASO),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})

export type Paso = z.infer<typeof pasoSchema>

export const rutaInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre necesita al menos 2 caracteres')
    .max(120, 'El nombre no puede pasar de 120 caracteres'),
  origin: z
    .string()
    .trim()
    .min(2, 'Decí desde qué mapa se entra')
    .max(120, 'El nombre del mapa no puede pasar de 120 caracteres'),
  destination: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
  // 40 pasos es más de lo que cualquier ruta real necesita; el tope está para
  // que un cliente roto no escriba un JSON de un megabyte.
  steps: z.array(pasoSchema).max(40, 'Una ruta no puede tener más de 40 pasos'),
})

export type RutaInput = z.infer<typeof rutaInputSchema>

export type Ruta = {
  id: string
  name: string
  origin: string
  destination: string | null
  notes: string | null
  steps: Paso[]
  created_at: string
  updated_at: string
  author: { id: string; name: string } | null
}

/**
 * Convierte lo que vino de la base en pasos utilizables.
 *
 * El JSONB puede tener cualquier forma: lo escribió una versión anterior de la
 * aplicación, o alguien con acceso a la base. Se descarta en silencio lo que no
 * encaje en vez de reventar la página entera por un paso mal formado.
 */
export function parsearPasos(valor: unknown): Paso[] {
  if (!Array.isArray(valor)) return []

  return valor.flatMap((crudo) => {
    const resultado = pasoSchema.safeParse(crudo)
    return resultado.success ? [resultado.data] : []
  })
}

/**
 * Cuántos portales hay que tomar.
 *
 * Se cuenta desde los pasos y no se guarda en una columna aparte a propósito:
 * un contador guardado se desincroniza en cuanto alguien edita un paso y se
 * olvida de actualizarlo, y entonces la pantalla miente sobre el dato que más
 * se mira.
 */
export function contarPortales(pasos: Paso[]): number {
  return pasos.filter((p) => p.kind === 'portal').length
}

/** Resumen para el listado: portales, mapas cruzados y pasos totales. */
export function resumirRuta(pasos: Paso[]) {
  return {
    portales: contarPortales(pasos),
    mapas: pasos.filter((p) => p.kind === 'mapa').length,
    pasos: pasos.length,
  }
}
