/**
 * El modelo económico que usan las tres calculadoras.
 *
 * Está todo en un archivo y no repartido en cada pantalla porque son las
 * mismas reglas: se compra a un precio, se vende a otro, y en el medio el juego
 * se queda con un porcentaje. Si el impuesto cambia con un parche, cambia acá.
 *
 * LOS NÚMEROS SON PARÁMETROS, NO VERDADES
 *
 * Los valores por defecto son los que rigen hoy, pero el juego los ajusta y
 * además dependen de si la cuenta tiene premium. Por eso son parámetros con un
 * valor inicial y no constantes escondidas dentro de una fórmula: cuando dejen
 * de valer, se corrigen desde la pantalla sin tocar el código.
 */

/** Impuesto sobre lo que se cobra al vender. */
export const IMPUESTO_VENTA = {
  /** Con premium. */
  premium: 0.04,
  /** Sin premium. */
  normal: 0.08,
} as const

/**
 * Comisión por publicar una orden de venta, sobre el precio publicado.
 *
 * Solo se paga al PUBLICAR una orden y esperar. Si en cambio se vende contra
 * una orden de compra que ya existe, no hay comisión: por eso el flip al Black
 * Market no la paga y el crafteo, que normalmente se publica, sí.
 */
export const COMISION_ORDEN = 0.015

/**
 * Tasa de retorno de materiales al craftear.
 *
 * Al craftear, una parte de los materiales vuelve. El valor base en una
 * estación de ciudad ronda el 15,2 %; sube con el bonus de la ciudad
 * especializada y bastante más usando foco. Es el parámetro que más mueve el
 * resultado de la calculadora de crafteo, así que se expone en la pantalla en
 * vez de quedar fijo.
 */
export const RETORNO = {
  sinBonus: 0.152,
  conBonus: 0.248,
  conFoco: 0.435,
} as const

export type Impuestos = {
  /** Fracción del ingreso que se lleva el juego al vender. */
  venta: number
  /** Fracción extra por publicar la orden. 0 si se vende contra una orden existente. */
  comision: number
}

export function impuestos(premium: boolean, publicaOrden: boolean): Impuestos {
  return {
    venta: premium ? IMPUESTO_VENTA.premium : IMPUESTO_VENTA.normal,
    comision: publicaOrden ? COMISION_ORDEN : 0,
  }
}

/** Lo que queda en el bolsillo después de vender a `precio`. */
export function ingresoNeto(precio: number, i: Impuestos): number {
  return precio * (1 - i.venta - i.comision)
}

export type Operacion = {
  /** Lo que se paga. */
  costo: number
  /** Lo que se cobra, ya sin impuestos. */
  ingreso: number
  /** Ingreso menos costo. Puede ser negativo, y mostrarlo así es el punto. */
  ganancia: number
  /** Ganancia sobre lo invertido. null si el costo es 0, para no dividir por cero. */
  margen: number | null
}

export function operacion(costo: number, precioVenta: number, i: Impuestos): Operacion {
  const ingreso = ingresoNeto(precioVenta, i)
  const ganancia = ingreso - costo
  return {
    costo,
    ingreso,
    ganancia,
    margen: costo > 0 ? ganancia / costo : null,
  }
}

/**
 * Cuán confiable es un precio, por su antigüedad.
 *
 * Los datos los suben jugadores paseando por el mercado, así que un precio
 * puede tener horas o días. Un flip calculado sobre un precio de anteayer es
 * una invitación a perder plata, y la única defensa es mostrar la edad al lado
 * del número.
 */
export type Frescura = 'fresco' | 'tibio' | 'viejo' | 'sin-datos'

export function frescura(fecha: Date | null, ahora = new Date()): Frescura {
  if (!fecha) return 'sin-datos'

  const horas = (ahora.getTime() - fecha.getTime()) / 3_600_000
  if (horas <= 6) return 'fresco'
  if (horas <= 24) return 'tibio'
  return 'viejo'
}

export const ETIQUETAS_FRESCURA: Record<Frescura, string> = {
  fresco: 'menos de 6 h',
  tibio: 'menos de 24 h',
  viejo: 'más de un día',
  'sin-datos': 'sin datos',
}

/** La menos confiable de varias fechas: una operación vale lo que su peor dato. */
export function peorFrescura(fechas: (Date | null)[], ahora = new Date()): Frescura {
  const orden: Frescura[] = ['fresco', 'tibio', 'viejo', 'sin-datos']
  let peor: Frescura = 'fresco'
  for (const f of fechas) {
    const actual = frescura(f, ahora)
    if (orden.indexOf(actual) > orden.indexOf(peor)) peor = actual
  }
  return peor
}

/**
 * ¿Este precio es una publicación troll?
 *
 * EL CASO QUE OBLIGÓ A ESCRIBIR ESTO
 *
 * La API devolvía, para tres peces distintos y en la misma ciudad:
 *
 *     T7_FISH_FRESHWATER_ALL_COMMON   12.111.011
 *     T7_FISH_SALTWATER_ALL_COMMON    12.111.011
 *     T8_FISH_FRESHWATER_ALL_COMMON   12.111.011
 *
 * Un pez común de T7 se negocia alrededor de 3.000. Alguien publicó una pieza
 * a doce millones, y como la API informa el precio MÁS BAJO publicado, ese pasa
 * a ser "el precio". Es un dato correcto y una respuesta inútil: la calculadora
 * recomendaba vender crudo por once millones.
 *
 * CÓMO SE DETECTA
 *
 * No con un umbral en plata —lo que es absurdo para un pez es normal para una
 * pieza de T8—, sino comparando el precio contra el mismo ítem en las otras
 * ciudades. Un precio real varía entre ciudades; una publicación troll se
 * despega de todas. Se usa la mediana y no el promedio justamente porque el
 * promedio lo arrastra el propio valor extremo que se quiere detectar.
 *
 * El múltiplo es deliberadamente generoso: entre ciudades hay diferencias
 * legítimas grandes, y marcar de más esconde oportunidades verdaderas.
 */
export const MULTIPLO_SOSPECHOSO = 5

export function mediana(valores: number[]): number | null {
  const utiles = valores.filter((v) => v > 0).sort((a, b) => a - b)
  if (utiles.length === 0) return null

  const medio = Math.floor(utiles.length / 2)
  return utiles.length % 2 === 0
    ? (utiles[medio - 1]! + utiles[medio]!) / 2
    : utiles[medio]!
}

export function esSospechoso(precio: number, referencias: number[]): boolean {
  if (precio <= 0) return false

  const m = mediana(referencias)
  // Sin con qué comparar no se puede afirmar nada, y afirmar de más sería peor
  // que no decir nada.
  if (m === null || m <= 0) return false

  return precio > m * MULTIPLO_SOSPECHOSO
}

/** Miles con separador y sin decimales: la plata del juego es entera. */
export function plata(valor: number): string {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(
    Math.round(valor),
  )
}

export function porcentaje(valor: number | null): string {
  if (valor === null) return '—'
  return `${valor >= 0 ? '+' : ''}${(valor * 100).toFixed(1)} %`
}
