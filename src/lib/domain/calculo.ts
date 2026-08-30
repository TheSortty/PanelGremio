import type { Encantamiento } from '@/lib/domain/albion'
import {
  SLOTS_EQUIPO,
  type Build,
  type SlotEquipo,
} from '@/lib/domain/builds'

/**
 * Datos vivos de un ítem, leídos de la tabla `items` al abrir la build.
 */
export type DatosItem = {
  id: string
  name: string
  tier: number | null
  item_power: number | null
  two_handed: boolean
  enchantments: Record<string, number>
  stats: Record<string, number>
}

/**
 * Poder de un ítem con su encantamiento aplicado.
 *
 * El dump trae el poder por nivel: T4 va 700 -> 800 -> 900 -> 1000. Si el nivel
 * pedido no está declarado, se cae al valor base en vez de extrapolar.
 */
export function poderConEncantamiento(
  item: DatosItem,
  encantamiento: Encantamiento,
): number | null {
  if (encantamiento > 0) {
    const declarado = item.enchantments[String(encantamiento)]
    if (typeof declarado === 'number') return declarado
  }
  return item.item_power
}

export type ResumenBuild = {
  /** Poder de ítem promedio de las piezas equipadas. */
  poderPromedio: number | null
  /** Piezas de equipamiento con poder conocido, sobre el total de slots. */
  piezasConPoder: number
  piezasEquipadas: number
  /** Tier más bajo del equipo: es el que limita en la práctica. */
  tierMinimo: number | null
  tierMaximo: number | null
  /** Advertencias de compatibilidad, no de balance. */
  advertencias: string[]
}

/**
 * Resumen de una build.
 *
 * QUÉ CALCULA Y QUÉ NO
 *
 * Calcula el poder de ítem promedio, que es como Albion determina el IP de un
 * personaje: el promedio sobre las piezas equipadas. Ese dato está completo en
 * el dump (2006 de 2104 ítems lo declaran), así que es confiable.
 *
 * NO calcula vida, armadura ni resistencia totales, y es a propósito. El dump
 * declara esas stats solo en algunas piezas: el pecho trae armadura y
 * resistencias reales, pero los cascos y las botas vienen en cero en todo salvo
 * el poder de ítem. En el juego un casco evidentemente da armadura; ese número
 * sale de fórmulas de escalado que este dump no incluye.
 *
 * Sumar lo declarado daría un total que parece preciso y está mal. Se muestran
 * entonces las stats por ítem, atribuidas a su pieza, y ningún total inventado.
 */
export function resumirBuild(
  build: Build,
  porId: Map<string, DatosItem>,
): ResumenBuild {
  const poderes: number[] = []
  const tiers: number[] = []
  let equipadas = 0

  for (const slot of SLOTS_EQUIPO) {
    const ref = build.equipment[slot]
    if (!ref) continue
    equipadas++

    const datos = porId.get(ref.id)
    if (!datos) continue

    const poder = poderConEncantamiento(datos, (ref.ench ?? 0) as Encantamiento)
    if (poder !== null) poderes.push(poder)
    if (datos.tier !== null) tiers.push(datos.tier)
  }

  const advertencias: string[] = []

  // Dos manos: la única incompatibilidad que el dump permite verificar.
  const arma = build.equipment.weapon
  if (arma && build.equipment.offhand) {
    const datosArma = porId.get(arma.id)
    if (datosArma?.two_handed) {
      advertencias.push(
        `${arma.name} es a dos manos: la mano secundaria no se puede usar.`,
      )
    }
  }

  if (equipadas > 0 && equipadas < SLOTS_EQUIPO.length) {
    const faltan = SLOTS_EQUIPO.length - equipadas
    advertencias.push(
      `Faltan ${faltan} ${faltan === 1 ? 'pieza' : 'piezas'} por definir.`,
    )
  }

  return {
    poderPromedio: poderes.length
      ? Math.round(poderes.reduce((a, b) => a + b, 0) / poderes.length)
      : null,
    piezasConPoder: poderes.length,
    piezasEquipadas: equipadas,
    tierMinimo: tiers.length ? Math.min(...tiers) : null,
    tierMaximo: tiers.length ? Math.max(...tiers) : null,
    advertencias,
  }
}

/** Slots que quedan bloqueados por lo ya elegido. */
export function slotsBloqueados(
  equipo: Build['equipment'],
  porId: Map<string, DatosItem>,
): Partial<Record<SlotEquipo, string>> {
  const bloqueados: Partial<Record<SlotEquipo, string>> = {}

  const arma = equipo.weapon
  if (arma && porId.get(arma.id)?.two_handed) {
    bloqueados.offhand = 'Ocupada por un arma a dos manos'
  }

  return bloqueados
}
