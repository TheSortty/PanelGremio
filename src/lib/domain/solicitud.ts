import { z } from 'zod'

/**
 * La solicitud de ingreso.
 *
 * Los campos son exactamente los que el gremio pide hoy en su plantilla de
 * Discord. No se agregó ninguna pregunta ni se sacó ninguna: si el formulario
 * pidiera cosas distintas de las que el staff está acostumbrado a leer, la
 * pantalla no reemplazaría al canal, competiría con él.
 */

export const DISPOSITIVOS = ['PC', 'Móvil', 'Tablet'] as const
export type Dispositivo = (typeof DISPOSITIVOS)[number]

export const TIPOS_CUENTA = ['primera', 'segunda'] as const
export type TipoCuenta = (typeof TIPOS_CUENTA)[number]

export const ETIQUETAS_CUENTA: Record<TipoCuenta, string> = {
  primera: 'Primera cuenta',
  segunda: 'Segunda cuenta',
}

/** Qué contenido le gusta. Se admite más de uno: casi nadie hace una sola cosa. */
export const CONTENIDOS = ['PvP', 'PvE', 'Crafter', 'Farmer'] as const
export type Contenido = (typeof CONTENIDOS)[number]

/**
 * Roles dentro del juego.
 *
 * Es una lista cerrada y no texto libre porque el punto de tener el dato en una
 * columna es poder preguntarle a la base "cuántos sanadores hay". Con texto
 * libre llegan "healer", "Healer", "sanador", "curador" y "heal" y la pregunta
 * deja de tener respuesta.
 *
 * Si al gremio le falta un rol, se agrega acá.
 */
export const ROLES_JUEGO = [
  'Tanque',
  'Sanador',
  'DPS cuerpo a cuerpo',
  'DPS a distancia',
  'Soporte',
  'Montura de batalla',
  'Recolector',
  'Crafteador',
] as const
export type RolJuego = (typeof ROLES_JUEGO)[number]

export const solicitudSchema = z.object({
  edad: z.coerce
    .number()
    .int()
    .min(13, 'Hay que tener al menos 13 años')
    .max(99, 'Revisá la edad'),
  horario: z
    .string()
    .trim()
    .min(2, 'Contá en qué horario jugás')
    .max(200, 'El horario no puede pasar de 200 caracteres'),
  dispositivo: z.enum(DISPOSITIVOS),
  gremio_anterior: z.string().trim().max(120).optional().or(z.literal('')),
  cuenta: z.enum(TIPOS_CUENTA),
  rol_juego_principal: z.enum(ROLES_JUEGO),
  // El secundario es opcional: hay gente que juega un solo rol.
  rol_juego_secundario: z.enum(ROLES_JUEGO).optional().or(z.literal('')),
  quien_lo_trajo: z.string().trim().max(120).optional().or(z.literal('')),
  contenido: z
    .array(z.enum(CONTENIDOS))
    .min(1, 'Elegí al menos un tipo de contenido')
    .max(4),
  discord: z.string().trim().max(60).optional().or(z.literal('')),
})

export type SolicitudInput = z.infer<typeof solicitudSchema>

export type Solicitud = SolicitudInput & {
  id: string
  profile_id: string
  captura_stats: string
  captura_perfil: string
  enviada_en: string
  actualizada_en: string
}

/**
 * Las dos capturas que el gremio exige.
 *
 * Están acá y no sueltas en el formulario porque el nombre del archivo en el
 * bucket depende de la clave: `{uid}/{clave}.{ext}`.
 */
export const CAPTURAS = [
  {
    clave: 'stats',
    etiqueta: 'Tus estadísticas personales',
    ayuda: 'La pantalla de fama, puntos y misiones de tu personaje.',
  },
  {
    clave: 'perfil',
    etiqueta: 'El perfil de tu cuenta',
    ayuda: 'La pantalla de selección de personaje, donde se ve el servidor.',
  },
] as const

export type ClaveCaptura = (typeof CAPTURAS)[number]['clave']

/** 5 MB, el mismo tope que declara el bucket. */
export const MAXIMO_CAPTURA = 5 * 1024 * 1024

export const TIPOS_IMAGEN = ['image/png', 'image/jpeg', 'image/webp'] as const

export function rutaCaptura(uid: string, clave: ClaveCaptura, tipo: string) {
  const extension =
    tipo === 'image/png' ? 'png' : tipo === 'image/webp' ? 'webp' : 'jpg'
  return `${uid}/${clave}.${extension}`
}
