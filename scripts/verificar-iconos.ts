/**
 * Comprueba que exista arte para cada icono que el panel puede llegar a pedir.
 *
 * Recorre todo el catálogo —cada ítem con cada uno de sus encantamientos y
 * cada hechizo referenciado por algún ítem— y pregunta por cada uno al
 * servicio de render. Distingue las dos respuestas que importan:
 *
 *   404  no hay arte. Definitivo.
 *   502  el servicio falló. Transitorio: se reintenta.
 *
 * Sin esa distinción cualquier medición da un número inventado, porque el
 * servicio devuelve 502 de forma intermitente en un pedido de cada diez.
 *
 * Sirve para dos cosas: saber cuánto del catálogo tiene imagen, y dejar la
 * lista de lo que falta en data/iconos-faltantes.json para poder revisarla.
 *
 *   npx tsx scripts/verificar-iconos.ts            todo
 *   npx tsx scripts/verificar-iconos.ts hechizos   solo habilidades
 *   npx tsx scripts/verificar-iconos.ts items      solo ítems
 *
 * Con --aplicar, además escribe items.icon_ok, que es lo que usa el selector
 * de builds para no ofrecer objetos que no puede dibujar. Solo se escribe
 * cuando el resultado es concluyente: un indeterminado (se agotaron los
 * reintentos) no toca la fila, porque marcaría como inexistente algo que solo
 * tuvo mala suerte.
 */

import fs from 'node:fs'
import path from 'node:path'

import { clienteAdmin, DIR_DATOS } from './lib/comun'

const RENDER = 'https://render.albiononline.com/v1'
const CONCURRENCIA = 16
const INTENTOS = 4

/**
 * Equipo real al que el servicio de render no le tiene arte.
 *
 * De los 468 objetos sin icono, 463 resultaron ser cosméticos: banderines,
 * laúdes, jarras de cerveza, calabazas de Halloween, ítems de DEBUG y los dos
 * interruptores "Ocultar arma principal" y "Ocultar arma secundaria". Ninguno
 * se puede llevar a una pelea.
 *
 * Los cinco de acá son la excepción: las Manos negras son un arma de verdad, de
 * las que se usan en ZvZ, y el 404 es una falta del servicio de imágenes y no
 * del juego. Sacarlas del planificador sería perder un arma jugable por un
 * problema de dibujo, así que se dejan disponibles y muestran el reemplazo con
 * el nombre.
 *
 * Si en el futuro aparece arte para ellas, sobra quitarlas de esta lista: el
 * script las va a marcar como cualquier otra.
 */
const EQUIPO_SIN_ARTE = new Set([
  'T4_2H_IRONGAUNTLETS_HELL',
  'T5_2H_IRONGAUNTLETS_HELL',
  'T6_2H_IRONGAUNTLETS_HELL',
  'T7_2H_IRONGAUNTLETS_HELL',
  'T8_2H_IRONGAUNTLETS_HELL',
])

type Resultado = 'ok' | 'falta' | 'indeterminado'

async function probar(url: string): Promise<Resultado> {
  for (let i = 0; i < INTENTOS; i++) {
    try {
      const r = await fetch(url, { method: 'GET' })
      if (r.status === 404) return 'falta'
      if (r.ok) {
        // Hay que consumir el cuerpo o el socket queda colgado.
        await r.arrayBuffer()
        return 'ok'
      }
    } catch {
      // Se trata como un 5xx.
    }
    await new Promise((s) => setTimeout(s, 250 * (i + 1)))
  }
  return 'indeterminado'
}

async function enParalelo<T>(xs: T[], n: number, f: (x: T) => Promise<void>) {
  let i = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < xs.length) {
        const x = xs[i++]
        if (x !== undefined) await f(x)
      }
    }),
  )
}

/**
 * PostgREST corta en 1000 filas y no avisa. Cualquier consulta de catálogo
 * tiene que pedir por rangos o devuelve un recorte silencioso.
 */
async function todasLasFilas<T>(
  consulta: (
    desde: number,
    hasta: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const todo: T[] = []
  const TANDA = 1000
  for (let desde = 0; ; desde += TANDA) {
    const { data, error } = await consulta(desde, desde + TANDA - 1)
    if (error) throw new Error(error.message)
    if (!data?.length) break
    todo.push(...data)
    if (data.length < TANDA) break
  }
  return todo
}

async function main() {
  const argumentos = process.argv.slice(2)
  const aplicar = argumentos.includes('--aplicar')
  const que = argumentos.find((a) => !a.startsWith('--')) ?? 'todo'
  const supabase = clienteAdmin()

  const objetivos: { clase: 'item' | 'hechizo'; id: string; url: string }[] = []

  if (que === 'todo' || que === 'hechizos') {
    const links = await todasLasFilas<{ spell_id: string }>((d, h) =>
      supabase.from('item_spells').select('spell_id').range(d, h),
    )
    const ids = [...new Set(links.map((l) => l.spell_id))].sort()
    console.log(`hechizos referenciados por algún ítem: ${ids.length}`)
    for (const id of ids) {
      objetivos.push({
        clase: 'hechizo',
        id,
        url: `${RENDER}/spell/${encodeURIComponent(id)}.png?size=64`,
      })
    }
  }

  if (que === 'todo' || que === 'items') {
    const items = await todasLasFilas<{ id: string; enchantments: unknown }>((d, h) =>
      supabase.from('items').select('id, enchantments').range(d, h),
    )
    console.log(`ítems en el catálogo: ${items.length}`)
    for (const it of items) {
      objetivos.push({
        clase: 'item',
        id: it.id,
        url: `${RENDER}/item/${encodeURIComponent(it.id)}.png?size=128`,
      })
      const niveles =
        it.enchantments && typeof it.enchantments === 'object'
          ? Object.keys(it.enchantments as Record<string, unknown>)
          : []
      for (const nivel of niveles) {
        const ident = `${it.id}@${nivel}`
        objetivos.push({
          clase: 'item',
          id: ident,
          url: `${RENDER}/item/${encodeURIComponent(ident)}.png?size=128`,
        })
      }
    }
  }

  console.log(`\ncomprobando ${objetivos.length} iconos (concurrencia ${CONCURRENCIA})...\n`)

  const faltan: string[] = []
  const indeterminados: string[] = []
  let hechos = 0
  const arranque = Date.now()

  await enParalelo(objetivos, CONCURRENCIA, async (o) => {
    const r = await probar(o.url)
    if (r === 'falta') faltan.push(`${o.clase}:${o.id}`)
    if (r === 'indeterminado') indeterminados.push(`${o.clase}:${o.id}`)

    hechos++
    if (hechos % 250 === 0) {
      const seg = (Date.now() - arranque) / 1000
      const restan = ((objetivos.length - hechos) / (hechos / seg) / 60).toFixed(1)
      process.stdout.write(
        `  ${hechos}/${objetivos.length}  faltan=${faltan.length}  ~${restan} min restantes\n`,
      )
    }
  })

  const ok = objetivos.length - faltan.length - indeterminados.length
  const pct = ((ok / objetivos.length) * 100).toFixed(2)

  console.log(`\n---------------------------------------`)
  console.log(`comprobados     ${objetivos.length}`)
  console.log(`con icono       ${ok}  (${pct} %)`)
  console.log(`sin arte (404)  ${faltan.length}`)
  console.log(`indeterminados  ${indeterminados.length}`)

  fs.mkdirSync(DIR_DATOS, { recursive: true })
  const salida = path.join(DIR_DATOS, 'iconos-faltantes.json')
  fs.writeFileSync(
    salida,
    JSON.stringify(
      { generado: new Date().toISOString(), comprobados: objetivos.length, faltan, indeterminados },
      null,
      2,
    ),
  )
  console.log(`\ndetalle en ${salida}`)

  if (!aplicar) {
    console.log('\n(sin --aplicar no se escribió nada en la base)\n')
    return
  }

  /*
    Se escribe solo el ítem base, sin encantamientos: si T4_MAIN_SWORD tiene
    arte, sus @1..@4 también. Al revés no aporta nada, porque el selector
    ofrece el ítem, no cada nivel de encantamiento por separado.

    Los indeterminados quedan sin tocar a propósito. En la corrida completa
    fueron cuarenta, todos del estilo T5_2H_BOW@3: arcos que existen y que solo
    tuvieron la mala suerte de agotar los reintentos. Marcarlos como
    inexistentes habría sacado los arcos del selector.
  */
  const sinArte = [
    ...new Set(
      faltan
        .filter((f) => f.startsWith('item:'))
        .map((f) => f.slice('item:'.length).split('@')[0]!),
    ),
  ].filter((id) => !EQUIPO_SIN_ARTE.has(id))
  const conArte = [
    ...new Set(
      objetivos
        .filter((o) => o.clase === 'item' && !o.id.includes('@'))
        .map((o) => o.id),
    ),
  ].filter((id) => !sinArte.includes(id))

  console.log(`\nescribiendo icon_ok: ${conArte.length} con arte, ${sinArte.length} sin arte`)

  for (const [valor, ids] of [
    [false, sinArte],
    [true, conArte],
  ] as const) {
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await supabase
        .from('items')
        .update({ icon_ok: valor })
        .in('id', ids.slice(i, i + 200))
      if (error) throw new Error(error.message)
    }
  }

  console.log('listo.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
