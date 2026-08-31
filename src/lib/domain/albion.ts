/**
 * URLs de la API de render de Albion y catálogo de stats.
 *
 * Este archivo es la única fuente de verdad de cómo se arma una URL de imagen.
 * Antes las URLs se guardaban congeladas en la base, lo que impedía pedir la
 * misma imagen en otro tamaño y arrastró un error silencioso durante todo el
 * proyecto anterior (ver urlIconoHechizo).
 */

/*
  Las imágenes no se piden directo a render.albiononline.com sino a nuestra
  propia ruta /icono, que reintenta los 502 intermitentes del servicio y cachea
  el resultado un año. El detalle está en src/app/icono/[tipo]/[nombre]/route.ts.
*/
const ICONOS = '/icono'

/**
 * Tamaños medidos contra la API real (espada T4):
 *
 *   sin parámetros -> 74.617 b
 *   size=128       -> 31.617 b
 *   size=64        ->  7.833 b
 *
 * El icono por defecto pesa casi 10 veces más que el de 64 px. En el selector
 * de ítems se muestran 30 a la vez, en cuadros de 28 px: pedir el tamaño
 * grande ahí bajaba más de 2 MB para dibujar miniaturas.
 */
export const TAMANOS_ICONO = {
  mini: 64, // listas y selectores
  chico: 128, // slots de equipamiento
  grande: 217, // detalle
} as const

export type TamanoIcono = keyof typeof TAMANOS_ICONO

/** Nivel de encantamiento. 0 es el ítem sin encantar. */
export type Encantamiento = 0 | 1 | 2 | 3 | 4

export function urlIconoItem(
  id: string,
  opciones: { encantamiento?: Encantamiento; tamano?: TamanoIcono } = {},
): string {
  const { encantamiento = 0, tamano = 'chico' } = opciones

  // El encantamiento va en el propio identificador: T4_MAIN_SWORD@2.
  // Verificado contra la API: @1, @2 y @3 devuelven imágenes distintas.
  const identificador = encantamiento > 0 ? `${id}@${encantamiento}` : id

  return `${ICONOS}/item/${encodeURIComponent(identificador)}.png?s=${TAMANOS_ICONO[tamano]}`
}

/**
 * Icono de un hechizo.
 *
 * Va el `@uniquename` del hechizo (HEROICSTRIKE2), NO su `@uisprite`
 * (PASSIVE_DAZE). Es un error fácil de cometer porque el dump trae los dos y
 * el sprite suena a "lo que hay que pedirle al renderizador".
 *
 * Medido sobre hechizos realmente referenciados por ítems:
 *   uniquename -> 16/16 responden 200
 *   uisprite   ->  1/16 responden 200
 *
 * El proyecto anterior usaba uisprite, así que ningún icono de habilidad
 * cargaba nunca.
 */
export function urlIconoHechizo(
  id: string,
  opciones: { tamano?: TamanoIcono } = {},
): string {
  const { tamano = 'mini' } = opciones
  return `${ICONOS}/hechizo/${encodeURIComponent(id)}.png?s=${TAMANOS_ICONO[tamano]}`
}

// -----------------------------------------------------------------------------
// Stats
// -----------------------------------------------------------------------------

export type Stats = Record<string, number | string | undefined>

type DefinicionStat = {
  etiqueta: string
  formato: 'entero' | 'porcentaje' | 'decimal' | 'texto'
  /** Para las stats donde un número más alto es peor. */
  invertida?: boolean
}

/**
 * Stats que se muestran, en orden de relevancia.
 *
 * Las claves salen del dump (`@physicalarmor` -> `physical_armor`). Cualquier
 * atributo que no esté acá simplemente no se dibuja: el dump trae decenas de
 * campos internos (sonidos de crafteo, offsets de huesos) que no le importan
 * a nadie.
 */
export const DEFINICIONES_STAT: Record<string, DefinicionStat> = {
  attack_damage: { etiqueta: 'Daño de ataque', formato: 'entero' },
  attack_speed: { etiqueta: 'Velocidad de ataque', formato: 'decimal' },
  attack_range: { etiqueta: 'Alcance', formato: 'decimal' },
  physical_armor: { etiqueta: 'Armadura física', formato: 'entero' },
  magic_resistance: { etiqueta: 'Resistencia mágica', formato: 'entero' },
  cc_resistance: { etiqueta: 'Resistencia a control', formato: 'entero' },
  hitpoints_max: { etiqueta: 'Vida', formato: 'entero' },
  energy_max: { etiqueta: 'Energía', formato: 'entero' },
  hp_regen: { etiqueta: 'Regeneración de vida', formato: 'porcentaje' },
  energy_regen: { etiqueta: 'Regeneración de energía', formato: 'porcentaje' },
  physical_attack_bonus: { etiqueta: 'Bono daño físico', formato: 'porcentaje' },
  magic_attack_bonus: { etiqueta: 'Bono daño mágico', formato: 'porcentaje' },
  physical_spell_bonus: { etiqueta: 'Bono hechizo físico', formato: 'porcentaje' },
  magic_spell_bonus: { etiqueta: 'Bono hechizo mágico', formato: 'porcentaje' },
  heal_bonus: { etiqueta: 'Bono de curación', formato: 'porcentaje' },
  cooldown_reduction: { etiqueta: 'Reducción de recarga', formato: 'porcentaje' },
  cast_time_reduction: { etiqueta: 'Reducción de casteo', formato: 'porcentaje' },
  move_speed_bonus: { etiqueta: 'Velocidad de movimiento', formato: 'porcentaje' },
  attack_speed_bonus: { etiqueta: 'Bono vel. de ataque', formato: 'porcentaje' },
  threat_bonus: { etiqueta: 'Amenaza', formato: 'porcentaje' },
  max_load: { etiqueta: 'Carga máxima', formato: 'entero' },
  weight: { etiqueta: 'Peso', formato: 'decimal', invertida: true },
}

export function formatearStat(clave: string, valor: number | string): string {
  const def = DEFINICIONES_STAT[clave]
  if (!def) return String(valor)

  const n = typeof valor === 'number' ? valor : Number(valor)
  if (Number.isNaN(n)) return String(valor)

  switch (def.formato) {
    case 'porcentaje': {
      // En el dump estos vienen como fracción (0.1 = 10 %).
      const pct = n * 100
      const signo = pct > 0 ? '+' : ''
      return `${signo}${Number(pct.toFixed(1))} %`
    }
    case 'decimal':
      return String(Number(n.toFixed(2)))
    case 'entero':
      return String(Math.round(n))
    default:
      return String(valor)
  }
}

export function etiquetaStat(clave: string): string {
  return DEFINICIONES_STAT[clave]?.etiqueta ?? clave
}

/** Stats con valor, en el orden de DEFINICIONES_STAT. */
export function statsVisibles(stats: Stats | null | undefined) {
  if (!stats) return []

  return Object.keys(DEFINICIONES_STAT)
    .filter((clave) => {
      const v = stats[clave]
      return v !== undefined && v !== null && v !== 0 && v !== ''
    })
    .map((clave) => ({
      clave,
      etiqueta: etiquetaStat(clave),
      valor: formatearStat(clave, stats[clave] as number | string),
    }))
}
