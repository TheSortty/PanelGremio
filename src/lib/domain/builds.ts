import { z } from 'zod'

import type { Enums } from '@/lib/db/database.types'

export type SpellSlot = Enums<'spell_slot'>
export type ItemType = Enums<'item_type'>

// -----------------------------------------------------------------------------
// Slots
// -----------------------------------------------------------------------------

export const SLOTS_EQUIPO = [
  'weapon',
  'offhand',
  'helmet',
  'chest',
  'boots',
  'cape',
] as const
export type SlotEquipo = (typeof SLOTS_EQUIPO)[number]

export const SLOTS_CONSUMIBLE = ['potion', 'food'] as const
export type SlotConsumible = (typeof SLOTS_CONSUMIBLE)[number]

export const NOMBRES_SLOT: Record<SlotEquipo | SlotConsumible, string> = {
  weapon: 'Arma',
  offhand: 'Mano secundaria',
  helmet: 'Casco',
  chest: 'Pecho',
  boots: 'Botas',
  cape: 'Capa',
  potion: 'Poción',
  food: 'Comida',
}

export function esSlotEquipo(slot: string): slot is SlotEquipo {
  return (SLOTS_EQUIPO as readonly string[]).includes(slot)
}

// -----------------------------------------------------------------------------
// Claves de habilidad
//
// ACÁ ESTABA EL BUG MÁS FEO DE LA VERSIÓN ANTERIOR.
//
// El creador de builds guardaba las habilidades con claves tipo `weapon_Q` y
// `helmet_Passive`, armadas con un template inline. El visor las leía como
// `weapon_q`, `helmet_d`, `chest_r`, `boots_f` — otro criterio, escrito en otro
// momento. Ninguna clave coincidía, así que las habilidades se guardaban bien
// y no se mostraban NUNCA. Como el objeto es un Record<string, ...>, TypeScript
// no podía avisar de nada.
//
// La solución no es "arreglar las cadenas": es que exista un único lugar donde
// se construyen y se leen. Si hay que cambiar el formato, se cambia acá y las
// dos puntas se mueven juntas.
// -----------------------------------------------------------------------------

export function claveHabilidad(slot: SlotEquipo, spellSlot: SpellSlot): string {
  return `${slot}:${spellSlot}`
}

export function parsearClaveHabilidad(
  clave: string,
): { slot: SlotEquipo; spellSlot: SpellSlot } | null {
  const [slot, spellSlot] = clave.split(':')
  if (!slot || !spellSlot) return null
  if (!esSlotEquipo(slot)) return null
  if (!['Q', 'W', 'E', 'Passive'].includes(spellSlot)) return null
  return { slot, spellSlot: spellSlot as SpellSlot }
}

export const ETIQUETAS_SPELL_SLOT: Record<SpellSlot, string> = {
  Q: 'Q',
  W: 'W',
  E: 'E',
  Passive: 'Pasiva',
}

// -----------------------------------------------------------------------------
// Formas guardadas en JSONB
//
// Se guarda solo lo mínimo para volver a dibujar la build (id, nombre, icono).
// La versión anterior serializaba el objeto Item entero, con su mapa completo
// de habilidades adentro: filas enormes y datos duplicados que quedaban
// desactualizados en cuanto cambiaba el catálogo.
// -----------------------------------------------------------------------------

// Se guarda el mínimo indispensable. El icono se calcula a partir del id
// (ver urlIconoItem) y las stats se leen en vivo de la tabla `items` al abrir
// la build: así, si un parche rebalancea un arma, la build muestra los valores
// actuales en lugar de una foto vieja.
//
// Antes se serializaba el objeto Item entero, con su icon_url congelada y su
// mapa completo de habilidades adentro.
export const refItemSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  /** Nivel de encantamiento, 0 a 4. Cambia el poder del ítem y su icono. */
  ench: z.number().int().min(0).max(4).default(0),
})
export type RefItem = z.infer<typeof refItemSchema>

export const refHechizoSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
})
export type RefHechizo = z.infer<typeof refHechizoSchema>

export const equipoSchema = z.object({
  weapon: refItemSchema.nullable().default(null),
  offhand: refItemSchema.nullable().default(null),
  helmet: refItemSchema.nullable().default(null),
  chest: refItemSchema.nullable().default(null),
  boots: refItemSchema.nullable().default(null),
  cape: refItemSchema.nullable().default(null),
})
export type Equipo = z.infer<typeof equipoSchema>

export const consumiblesSchema = z.object({
  potion: refItemSchema.nullable().default(null),
  food: refItemSchema.nullable().default(null),
})
export type Consumibles = z.infer<typeof consumiblesSchema>

/**
 * Las claves se validan contra parsearClaveHabilidad, así que una clave con
 * formato viejo o inventado no entra a la base.
 */
export const habilidadesSchema = z.record(
  z.string().refine((k) => parsearClaveHabilidad(k) !== null, {
    message: 'Clave de habilidad inválida (se espera "slot:SpellSlot")',
  }),
  refHechizoSchema,
)
export type Habilidades = z.infer<typeof habilidadesSchema>

/**
 * Un arma a dos manos ocupa también la mano secundaria.
 *
 * Es la única regla de compatibilidad que el dump permite verificar sin
 * inventar nada: `@twohanded` viene declarado por ítem (581 de 2104 lo son).
 */
export function conflictoDeSlots(
  equipo: Equipo,
  esDosManos: (itemId: string) => boolean,
): string | null {
  const arma = equipo.weapon
  if (arma && equipo.offhand && esDosManos(arma.id)) {
    return `${arma.name} es un arma a dos manos: no se puede llevar nada en la mano secundaria.`
  }
  return null
}

export const CATEGORIAS_BUILD = [
  'PvE',
  'PvP',
  'ZvZ',
  'GvG',
  'Ganking',
  'Avaloniano',
  'Escape',
] as const

export const buildInputSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(120),
  category: z.enum(CATEGORIAS_BUILD),
  description: z.string().trim().max(2000).optional().default(''),
  equipment: equipoSchema,
  consumables: consumiblesSchema,
  abilities: habilidadesSchema,
})
export type BuildInput = z.infer<typeof buildInputSchema>

export const EQUIPO_VACIO: Equipo = {
  weapon: null,
  offhand: null,
  helmet: null,
  chest: null,
  boots: null,
  cape: null,
}

export const CONSUMIBLES_VACIOS: Consumibles = { potion: null, food: null }

/** Una build tal como la usa la interfaz, con el JSONB ya parseado. */
export type Build = {
  id: string
  title: string
  category: string
  description: string | null
  equipment: Equipo
  consumables: Consumibles
  abilities: Habilidades
  guide: string | null
  created_at: string
  author: { id: string; name: string } | null
}

/**
 * Parseo defensivo del JSONB.
 *
 * La base garantiza que es un objeto, pero no su forma: hay filas creadas por
 * versiones anteriores del código. Si algo no valida, se cae a vacío en vez de
 * romper el render de toda la página.
 */
export function parsearEquipo(valor: unknown): Equipo {
  const r = equipoSchema.safeParse(valor)
  return r.success ? r.data : { ...EQUIPO_VACIO }
}

export function parsearConsumibles(valor: unknown): Consumibles {
  const r = consumiblesSchema.safeParse(valor)
  return r.success ? r.data : { ...CONSUMIBLES_VACIOS }
}

export function parsearHabilidades(valor: unknown): Habilidades {
  const r = habilidadesSchema.safeParse(valor)
  return r.success ? r.data : {}
}
