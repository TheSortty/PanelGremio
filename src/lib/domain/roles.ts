import type { Enums } from '@/lib/db/database.types'

export type GuildRole = Enums<'guild_role'>
export type UserStatus = Enums<'user_status'>

/** De mayor a menor autoridad. El índice sirve para comparar jerarquía. */
export const ROLES: readonly GuildRole[] = [
  'Maestro del Gremio',
  'Mano Derecha',
  'Oficial',
  'Miembro',
  'Iniciado',
  'Invitado',
] as const

/**
 * Permisos del panel.
 *
 * Esto es el espejo exacto de las funciones private.es_admin() y
 * private.es_oficial() de la base. La base sigue siendo la autoridad —estas
 * funciones solo deciden qué se dibuja en pantalla—, pero tienen que coincidir
 * o pasa lo de la versión anterior: el front dejaba entrar a 'Oficial' a las
 * pantallas de administración y el backend le devolvía 403 en cada llamada.
 *
 * La regla, ahora explícita: un Oficial VE métricas y auditoría, pero no
 * gestiona usuarios.
 */
const ROLES_ADMIN: readonly GuildRole[] = ['Maestro del Gremio', 'Mano Derecha']
const ROLES_OFICIAL: readonly GuildRole[] = [
  'Maestro del Gremio',
  'Mano Derecha',
  'Oficial',
]

export function esAdmin(rol: GuildRole | null | undefined): boolean {
  return rol != null && ROLES_ADMIN.includes(rol)
}

export function esOficial(rol: GuildRole | null | undefined): boolean {
  return rol != null && ROLES_OFICIAL.includes(rol)
}

/** Puede ver métricas y el registro de auditoría. */
export const puedeVerMetricas = esOficial
/** Puede aprobar, cambiar roles y eliminar usuarios. */
export const puedeGestionarUsuarios = esAdmin

export function rangoDeRol(rol: GuildRole): number {
  const i = ROLES.indexOf(rol)
  return i === -1 ? ROLES.length : i
}

export const ETIQUETAS_ESTADO: Record<UserStatus, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  rejected: 'Rechazado',
}
