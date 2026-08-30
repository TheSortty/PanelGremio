/**
 * Carga los ítems y resuelve qué hechizo va en qué slot.
 *
 * Cruza los dos dumps:
 *   - data/items.json      (formatted) -> nombres traducidos al español
 *   - data/items-raw.json  (canónico)  -> tipo de ítem y lista de hechizos
 *
 * El seed anterior usaba solo el primero y leía `item.spellslots`, una clave
 * que ese archivo no tiene. Siempre daba undefined, así que la columna quedaba
 * en NULL para todos los ítems y el selector de habilidades no mostraba nada.
 *
 * Correr después de seed-spells: item_spells tiene una FK contra spells.
 */

import {
  SECCIONES_ITEMS,
  comoArray,
  hechizosDeItem,
  idsDeHechizosPasivos,
  nombreLegible,
  tipoDeItem,
  urlIconoItem,
} from './lib/albion'
import { clienteAdmin, insertarEnLotes, leerJson } from './lib/comun'

import type { Enums } from '../src/lib/db/database.types'

type FilaItem = {
  id: string
  name: string
  type: Enums<'item_type'>
  icon_url: string
}

type FilaItemSpell = {
  item_id: string
  spell_id: string
  slot: Enums<'spell_slot'>
  position: number
}

async function main() {
  const supabase = clienteAdmin()

  console.log('\nLeyendo dumps...')
  const formateados = leerJson<any[]>('items.json')
  const crudos = leerJson('items-raw.json').items

  // Necesario para clasificar las habilidades de armadura: ahí el dump de
  // ítems no distingue activas de pasivas, y la única fuente confiable es el
  // catálogo de hechizos.
  const idsPasivos = idsDeHechizosPasivos(leerJson('spells.json'))
  console.log(`  ${idsPasivos.size} hechizos pasivos identificados`)

  // Nombre en español por id.
  const nombres = new Map<string, string>()
  for (const item of formateados) {
    const id = item?.UniqueName
    const nombre = item?.LocalizedNames?.['ES-ES'] ?? item?.LocalizedNames?.['EN-US']
    if (id && nombre) nombres.set(String(id), String(nombre))
  }
  console.log(`  ${nombres.size} nombres traducidos`)

  // Índice global por id: hace falta para resolver los @reference de las listas
  // de hechizos, que pueden apuntar a cualquier sección.
  const porId = new Map<string, any>()
  for (const seccion of Object.keys(crudos)) {
    for (const nodo of comoArray<any>(crudos[seccion])) {
      const id = nodo?.['@uniquename']
      if (id) porId.set(String(id), nodo)
    }
  }
  console.log(`  ${porId.size} ítems en el dump canónico`)

  const items: FilaItem[] = []
  const itemSpells: FilaItemSpell[] = []
  const idsDeItems = new Set<string>()

  for (const seccion of SECCIONES_ITEMS) {
    for (const nodo of comoArray<any>(crudos[seccion])) {
      const id = String(nodo?.['@uniquename'] ?? '').trim()
      if (!id || idsDeItems.has(id)) continue

      const tipo = tipoDeItem(seccion, nodo)
      if (tipo === 'other') continue

      idsDeItems.add(id)
      items.push({
        id,
        name: nombres.get(id) ?? nombreLegible(id),
        type: tipo,
        icon_url: urlIconoItem(id),
      })

      for (const h of hechizosDeItem(nodo, porId, idsPasivos)) {
        itemSpells.push({
          item_id: id,
          spell_id: h.spellId,
          slot: h.slot,
          position: h.position,
        })
      }
    }
  }

  console.log(`\n${items.length} ítems, ${itemSpells.length} vínculos ítem-hechizo.\n`)

  await insertarEnLotes('ítems', items, 500, (lote) =>
    supabase.from('items').upsert(lote, { onConflict: 'id' }),
  )

  // Un ítem puede referenciar un hechizo que no está en la tabla `spells`
  // (por ejemplo, uno sin sprite, que seed-spells descarta). Esas filas
  // violarían la FK, así que se filtran acá en vez de hacer fallar todo el lote.
  //
  // OJO con cómo se consulta esto: PostgREST corta las respuestas en 1000 filas
  // por defecto (db-max-rows) y NO avisa. Un `.select('id')` pelado sobre una
  // tabla de 7.600 hechizos devuelve 1000 en silencio, y el filtro de abajo
  // descarta como inválido todo lo que no entró en esa página.
  //
  // Por eso se preguntan solo los ids que hacen falta, en tandas acotadas.
  const idsReferenciados = [...new Set(itemSpells.map((v) => v.spell_id))]
  const idsValidos = new Set<string>()
  const TANDA = 300

  for (let i = 0; i < idsReferenciados.length; i += TANDA) {
    const tanda = idsReferenciados.slice(i, i + TANDA)
    const { data, error } = await supabase
      .from('spells')
      .select('id')
      .in('id', tanda)

    if (error) {
      console.error('\nNo pude leer la tabla de hechizos:', error.message)
      console.error('¿Corriste `npm run seed:spells` primero?')
      process.exit(1)
    }
    for (const fila of data) idsValidos.add(fila.id)
  }
  const vinculosValidos = itemSpells.filter((v) => idsValidos.has(v.spell_id))
  const descartados = itemSpells.length - vinculosValidos.length

  if (descartados > 0) {
    console.log(
      `\n  ${descartados} vínculos apuntan a hechizos que no están en el catálogo; se omiten.`,
    )
  }

  console.log()
  await insertarEnLotes('vínculos', vinculosValidos, 500, (lote) =>
    supabase
      .from('item_spells')
      .upsert(lote, { onConflict: 'item_id,slot,position' }),
  )

  // Resumen por tipo, para poder ver de un vistazo que la clasificación no se
  // rompió con un parche nuevo del juego.
  const porTipo = new Map<string, number>()
  for (const i of items) porTipo.set(i.type, (porTipo.get(i.type) ?? 0) + 1)

  console.log('\nÍtems por tipo:')
  for (const [tipo, cantidad] of [...porTipo].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tipo.padEnd(10)} ${cantidad}`)
  }

  const conHechizos = new Set(vinculosValidos.map((v) => v.item_id)).size
  console.log(`\n${conHechizos} ítems tienen hechizos asociados.\n`)
}

main().catch((error) => {
  console.error('\nFalló el seed de ítems:', error)
  process.exit(1)
})
