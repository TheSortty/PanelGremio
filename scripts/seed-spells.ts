/**
 * Carga el catálogo de hechizos.
 *
 * Diferencias con el seed anterior:
 *   - No hace TRUNCATE. Aquel borraba la tabla entera antes de recargar, lo que
 *     rompe las claves foráneas de item_spells y deja la base inconsistente si
 *     el proceso falla a mitad de camino. Acá es un upsert: idempotente y sin
 *     ventana de datos rotos.
 *   - Un upsert por lote en vez de uno por hechizo (eran ~8.000 viajes).
 *   - Usa el nombre traducido cuando está localization.json, en vez de mostrar
 *     el identificador interno.
 */

import {
  comoArray,
  construirMapaLocalizacion,
  nombreLegible,
  urlIconoHechizo,
} from './lib/albion'
import { clienteAdmin, insertarEnLotes, leerJson, DIR_DATOS } from './lib/comun'

import fs from 'node:fs'
import path from 'node:path'

type FilaHechizo = { id: string; name: string; icon_url: string }

async function main() {
  const supabase = clienteAdmin()

  console.log('\nLeyendo data/spells.json...')
  const datos = leerJson('spells.json')
  const contenedor = datos.spells ?? datos

  // Nombres en español, si el dump de localización está descargado.
  let localizacion: Map<string, string> | null = null
  const rutaLoc = path.join(DIR_DATOS, 'localization.json')

  if (fs.existsSync(rutaLoc)) {
    console.log('Leyendo data/localization.json (puede tardar)...')
    localizacion = construirMapaLocalizacion(leerJson('localization.json'))
    console.log(`  ${localizacion.size} traducciones cargadas`)
  } else {
    console.log(
      'Sin data/localization.json: se usan nombres derivados del identificador.',
    )
  }

  const porId = new Map<string, FilaHechizo>()

  // togglespell son las alternables (por ejemplo las auras); van al mismo
  // catálogo porque un ítem puede referenciarlas igual que a cualquier otra.
  for (const clave of ['activespell', 'passivespell', 'togglespell']) {
    for (const hechizo of comoArray<any>(contenedor?.[clave])) {
      const id = String(hechizo?.['@uniquename'] ?? '').trim()
      if (!id) continue

      // Sin sprite no hay icono que mostrar; para la interfaz no sirve.
      const sprite = String(hechizo?.['@uisprite'] ?? '').trim()
      if (!sprite) continue

      const traducido = localizacion?.get(`@SPELLS_${id}`)

      porId.set(id, {
        id,
        name: traducido || nombreLegible(id),
        icon_url: urlIconoHechizo(sprite),
      })
    }
  }

  const filas = [...porId.values()]
  console.log(`\n${filas.length} hechizos a cargar.\n`)

  await insertarEnLotes('hechizos', filas, 500, (lote) =>
    supabase.from('spells').upsert(lote, { onConflict: 'id' }),
  )

  console.log('\nListo.\n')
}

main().catch((error) => {
  console.error('\nFalló el seed de hechizos:', error)
  process.exit(1)
})
