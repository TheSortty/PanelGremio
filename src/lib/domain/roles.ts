import type { Enums } from '@/lib/db/database.types'

export type GuildRole = Enums<'guild_role'>
export type UserStatus = Enums<'user_status'>

/**
 * Jerarquía, de mayor a menor autoridad.
 *
 * El índice ES el rango: 0 manda sobre todos. Es el mismo orden que
 * private.rango_rol() en la base.
 */
export const ROLES = [
  'Maestro del Gremio',
  'Mano Derecha',
  'Oficial',
  'Miembro',
  'Iniciado',
  'Invitado',
] as const satisfies readonly GuildRole[]

export function rangoDeRol(rol: GuildRole): number {
  const i = ROLES.indexOf(rol as (typeof ROLES)[number])
  return i === -1 ? ROLES.length : i
}

/** ¿El rol llega al nivel mínimo pedido? Menor rango es más autoridad. */
function alMenos(rol: GuildRole | null | undefined, minimo: GuildRole): boolean {
  if (!rol) return false
  return rangoDeRol(rol) <= rangoDeRol(minimo)
}

/**
 * Capacidades del panel.
 *
 * Espejo exacto de las funciones private.* de la base, que son las que mandan
 * de verdad vía RLS. Esto solo decide qué se dibuja: si las dos se desincronizan
 * vuelve el problema que tenía la versión anterior, donde el front dejaba
 * entrar a un Oficial a las pantallas de administración y el backend le
 * devolvía 403 en cada llamada.
 *
 * Cada rol suma una capacidad sobre el anterior. Antes había seis roles con
 * solo tres niveles reales: Invitado, Iniciado y Miembro hacían lo mismo.
 */

/** Invitado y superiores: leer builds, rutas y panel. */
export const puedeLeer = (rol: GuildRole | null | undefined) =>
  alMenos(rol, 'Invitado')

/** Iniciado y superiores: crear y editar sus propias builds. */
export const puedeCrearBuilds = (rol: GuildRole | null | undefined) =>
  alMenos(rol, 'Iniciado')

/** Miembro y superiores: cargar rutas avalonianas. */
export const puedeUsarMapa = (rol: GuildRole | null | undefined) =>
  alMenos(rol, 'Miembro')

/** Oficial y superiores: editar y borrar builds y rutas ajenas. */
export const esOficial = (rol: GuildRole | null | undefined) =>
  alMenos(rol, 'Oficial')

/** Mano Derecha y superiores: aprobar cuentas, cambiar roles, dar de baja. */
export const esAdmin = (rol: GuildRole | null | undefined) =>
  alMenos(rol, 'Mano Derecha')

/** Solo el Maestro del Gremio: transferir el liderazgo. */
export const esMaestro = (rol: GuildRole | null | undefined) =>
  alMenos(rol, 'Maestro del Gremio')

// Alias por lo que hace, no por el rol que lo habilita.
export const puedeVerMetricas = esOficial
export const puedeGestionarUsuarios = esAdmin
export const puedeTransferirLiderazgo = esMaestro

/** ¿Puede editar o borrar esta build? */
export function puedeEditarBuild(
  rol: GuildRole | null | undefined,
  autorId: string | null | undefined,
  usuarioId: string,
): boolean {
  if (esOficial(rol)) return true
  return autorId === usuarioId && puedeCrearBuilds(rol)
}

export const ETIQUETAS_ESTADO: Record<UserStatus, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  rejected: 'Rechazado',
}

/** Lo que suma cada rol respecto del anterior. Se muestra en Administración. */
export const CAPACIDAD_DE_ROL: Record<GuildRole, string> = {
  'Maestro del Gremio': 'Manda sobre todo; puede transferir el liderazgo',
  'Mano Derecha': 'Aprueba cuentas, cambia roles y da de baja',
  Oficial: 'Edita y borra builds y rutas de cualquiera',
  Miembro: 'Crea builds y carga rutas avalonianas',
  Iniciado: 'Crea y edita sus propias builds',
  Invitado: 'Solo lectura',
}
