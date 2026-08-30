/**
 * Parseo de los dumps de Albion (ao-bin-dumps).
 *
 * Son XML convertido a JSON, con las rarezas típicas de esa conversión:
 * los atributos vienen con prefijo `@`, y un nodo que aparece una sola vez es
 * un objeto mientras que si aparece varias veces es un array. Todo lo que entra
 * acá se normaliza antes de usarse.
 */

import type { Enums } from '../../src/lib/db/database.types'

type ItemType = Enums<'item_type'>
type SpellSlot = Enums<'spell_slot'>

/** Un nodo del XML que puede venir suelto o en array. */
export function comoArray<T>(valor: T | T[] | undefined | null): T[] {
  if (valor == null) return []
  return Array.isArray(valor) ? valor : [valor]
}

// -----------------------------------------------------------------------------
// Tipo de ítem
//
// El seed anterior deducía el tipo con coincidencias de texto sobre el
// UniqueName ('_CAPE', 'HEAD_', 'SHOES_'...). Es frágil: cualquier ítem nuevo
// que no encaje en el patrón cae en 'unknown'. El dump ya trae `@slottype`,
// que es el dato real, así que usamos eso.
// -----------------------------------------------------------------------------

const POR_SLOTTYPE: Record<string, ItemType> = {
  mainhand: 'weapon',
  offhand: 'offhand',
  head: 'helmet',
  armor: 'chest',
  shoes: 'boots',
  cape: 'cape',
  bag: 'bag',
}

export function tipoDeItem(
  seccion: string,
  nodo: Record<string, unknown>,
): ItemType {
  const slotType = String(nodo['@slottype'] ?? '')

  if (seccion === 'weapon' || seccion === 'equipmentitem') {
    return POR_SLOTTYPE[slotType] ?? 'other'
  }

  if (seccion === 'mount') return 'mount'

  if (seccion === 'consumableitem') {
    const sub = String(nodo['@shopsubcategory1'] ?? '')
    if (sub === 'potions') return 'potion'
    if (sub === 'food') return 'food'
    return 'other'
  }

  if (seccion === 'simpleitem') {
    const cat = String(nodo['@shopcategory'] ?? '')
    if (cat === 'tools') return 'tool'
    return 'other'
  }

  return 'other'
}

/** Secciones del dump que aportan ítems usables en una build. */
export const SECCIONES_ITEMS = [
  'weapon',
  'equipmentitem',
  'consumableitem',
  'mount',
] as const

// -----------------------------------------------------------------------------
// Slots de hechizo
//
// En el dump, cada entrada de `craftingspelllist.craftspell` es un hechizo que
// el ítem puede llevar. El atributo `@slots` dice en qué slot activo va
// ("1" | "2" | "3" -> Q | W | E), pero SOLO las armas lo traen.
//
// Las armaduras lo omiten en todas sus entradas, activas y pasivas por igual:
// un casco de placas lista ENERGY_BARRIER, STONESKIN y BLOCK (activas) junto a
// PASSIVE_MR_AR y compañía, sin ningún atributo que las distinga. Deducirlo de
// la ausencia de `@slots` mandaría las tres activas a la pasiva.
//
// La fuente confiable es spells.json, que ya trae las activas y las pasivas en
// listas separadas. Por eso hay que pasarle acá el conjunto de pasivas.
//
// El backend anterior no llegaba ni a este problema: leía `item.spellslots`,
// una clave que el dump de localización que usaba no tiene. Siempre daba
// undefined, la columna quedaba en NULL para todos los ítems y el endpoint de
// hechizos devolvía `{}`. El selector de habilidades nunca mostró nada.
// -----------------------------------------------------------------------------

const SLOT_POR_NUMERO: Record<string, SpellSlot> = {
  '1': 'Q',
  '2': 'W',
  '3': 'E',
}

export type HechizoDeItem = {
  spellId: string
  slot: SpellSlot
  position: number
}

type NodoItem = Record<string, any>

/**
 * Resuelve los hechizos de un ítem, siguiendo los `@reference`.
 *
 * 1078 ítems no declaran su lista de hechizos: apuntan a la de otro ítem
 * (normalmente la misma pieza en un tier más bajo). Esas referencias pueden
 * encadenarse, así que se sigue la cadena con un conjunto de visitados para
 * no colgarse si el dump trae un ciclo.
 */
export function hechizosDeItem(
  item: NodoItem,
  porId: Map<string, NodoItem>,
  idsPasivos: ReadonlySet<string>,
): HechizoDeItem[] {
  let actual: NodoItem | undefined = item
  const visitados = new Set<string>()

  while (actual) {
    const id = String(actual['@uniquename'] ?? '')
    if (id && visitados.has(id)) break
    if (id) visitados.add(id)

    const lista = actual.craftingspelllist
    if (!lista) return []

    const referencia = lista['@reference']
    if (!referencia) {
      return extraerHechizos(lista, idsPasivos)
    }

    actual = porId.get(String(referencia))
  }

  return []
}

function extraerHechizos(
  lista: NodoItem,
  idsPasivos: ReadonlySet<string>,
): HechizoDeItem[] {
  const resultado: HechizoDeItem[] = []
  // Contador por slot: dos hechizos del mismo slot no pueden compartir position
  // (es parte de la clave primaria de item_spells).
  const siguientePosicion: Record<string, number> = {
    Q: 0,
    W: 0,
    E: 0,
    Passive: 0,
  }
  const vistos = new Set<string>()

  for (const entrada of comoArray<NodoItem>(lista.craftspell)) {
    const spellId = String(entrada['@uniquename'] ?? '').trim()
    if (!spellId) continue

    const numeroSlot = entrada['@slots']

    let slot: SpellSlot
    if (numeroSlot !== undefined) {
      // Arma: el dump dice explícitamente en qué slot activo va.
      slot = SLOT_POR_NUMERO[String(numeroSlot)] ?? 'E'
    } else if (idsPasivos.has(spellId)) {
      slot = 'Passive'
    } else {
      // Activa sin número de slot: es una pieza de armadura, que tiene un solo
      // slot activo (@activespellslots vale 1 en todas). Va a Q, y la interfaz
      // lo rotula "Activa" en vez de "Q" cuando el slot no es un arma.
      slot = 'Q'
    }

    // Un mismo hechizo repetido en el mismo slot rompería la PK.
    const clave = `${slot}:${spellId}`
    if (vistos.has(clave)) continue
    vistos.add(clave)

    resultado.push({
      spellId,
      slot,
      position: siguientePosicion[slot]!++,
    })
  }

  return resultado
}

/**
 * Ids de los hechizos pasivos, según spells.json.
 *
 * Es el único dato que permite separar activas de pasivas en las armaduras,
 * porque ahí el dump de ítems no las distingue.
 */
export function idsDeHechizosPasivos(datosSpells: any): Set<string> {
  const contenedor = datosSpells?.spells ?? datosSpells
  const ids = new Set<string>()

  for (const hechizo of comoArray<NodoItem>(contenedor?.passivespell)) {
    const id = String(hechizo?.['@uniquename'] ?? '').trim()
    if (id) ids.add(id)
  }

  return ids
}

// -----------------------------------------------------------------------------
// Stats
//
// El dump trae decenas de atributos por ítem; acá se quedan solo los que la
// interfaz muestra. Se descartan los que valen cero: guardarlos infla el JSON
// y, sobre todo, haría creer que el ítem "tiene" esa stat en cero cuando en
// realidad el dump no la modela (los cascos declaran cero en todo salvo
// item_power, pero en el juego evidentemente dan armadura: el escalado sale
// de fórmulas que este dump no incluye).
// -----------------------------------------------------------------------------

const MAPA_STATS: Record<string, string> = {
  '@attackdamage': 'attack_damage',
  '@attackspeed': 'attack_speed',
  '@attackrange': 'attack_range',
  '@physicalarmor': 'physical_armor',
  '@magicresistance': 'magic_resistance',
  '@crowdcontrolresistance': 'cc_resistance',
  '@hitpointsmax': 'hitpoints_max',
  '@energymax': 'energy_max',
  '@hitpointsregenerationbonus': 'hp_regen',
  '@energyregenerationbonus': 'energy_regen',
  '@physicalattackdamagebonus': 'physical_attack_bonus',
  '@magicattackdamagebonus': 'magic_attack_bonus',
  '@physicalspelldamagebonus': 'physical_spell_bonus',
  '@magicspelldamagebonus': 'magic_spell_bonus',
  '@healbonus': 'heal_bonus',
  '@magiccooldownreduction': 'cooldown_reduction',
  '@magiccasttimereduction': 'cast_time_reduction',
  '@movespeedbonus': 'move_speed_bonus',
  '@attackspeedbonus': 'attack_speed_bonus',
  '@threatbonus': 'threat_bonus',
  '@maxload': 'max_load',
  '@weight': 'weight',
}

export function statsDeItem(nodo: NodoItem): Record<string, number> {
  const stats: Record<string, number> = {}

  for (const [origen, destino] of Object.entries(MAPA_STATS)) {
    const crudo = nodo[origen]
    if (crudo === undefined) continue

    const n = Number.parseFloat(String(crudo))
    if (Number.isNaN(n) || n === 0) continue

    stats[destino] = n
  }

  return stats
}

export function tierDeItem(nodo: NodoItem): number | null {
  const t = Number.parseInt(String(nodo['@tier'] ?? ''), 10)
  return Number.isNaN(t) ? null : t
}

export function poderDeItem(nodo: NodoItem): number | null {
  const p = Number.parseInt(String(nodo['@itempower'] ?? ''), 10)
  return Number.isNaN(p) ? null : p
}

export function esDosManos(nodo: NodoItem): boolean {
  return String(nodo['@twohanded'] ?? '') === 'true'
}

/**
 * Poder de ítem por nivel de encantamiento: {"1": 800, "2": 900, "3": 1000}.
 *
 * El encantamiento cambia el poder del ítem y también su icono (la API de
 * render acepta `T4_MAIN_SWORD@2`), así que la interfaz necesita los dos datos.
 */
export function encantamientosDeItem(nodo: NodoItem): Record<string, number> {
  const resultado: Record<string, number> = {}

  for (const e of comoArray<NodoItem>(nodo.enchantments?.enchantment)) {
    const nivel = String(e['@enchantmentlevel'] ?? '').trim()
    const poder = Number.parseInt(String(e['@itempower'] ?? ''), 10)
    if (nivel && !Number.isNaN(poder)) resultado[nivel] = poder
  }

  return resultado
}

// -----------------------------------------------------------------------------
// Localización (formato TMX)
//
// localization.json es tmx.body.tu[], cada uno con @tuid y una lista de
// traducciones tuv[] con @xml:lang y seg.
// -----------------------------------------------------------------------------

export function construirMapaLocalizacion(
  localizacion: any,
  idioma = 'ES-ES',
): Map<string, string> {
  const mapa = new Map<string, string>()
  const unidades = comoArray<NodoItem>(localizacion?.tmx?.body?.tu)

  for (const unidad of unidades) {
    const tuid = String(unidad['@tuid'] ?? '')
    if (!tuid) continue

    for (const traduccion of comoArray<NodoItem>(unidad.tuv)) {
      if (traduccion['@xml:lang'] !== idioma) continue
      const texto = traduccion.seg
      if (typeof texto === 'string' && texto.trim()) {
        mapa.set(tuid, texto.trim())
      }
      break
    }
  }

  return mapa
}

/**
 * Nombre legible cuando no hay traducción.
 * "FIREBALL_STAFF" -> "Fireball Staff". Mejor que mostrar el ID crudo.
 */
export function nombreLegible(uniqueName: string): string {
  return uniqueName
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
