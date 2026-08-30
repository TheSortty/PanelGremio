/**
 * Descarga los dumps de datos de Albion.
 *
 * Estos archivos pesan decenas de MB y se regeneran con cada parche del juego,
 * así que no van al repositorio: se descargan cuando hacen falta. En la versión
 * anterior estaban commiteados y sumaban 36 MB al clone.
 *
 *   npm run data:download                  -> items + spells (~31 MB)
 *   npm run data:download -- --localizacion -> agrega nombres en español (~87 MB)
 */

import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

import { DIR_DATOS } from './lib/comun'

const BASE = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master'

type Descarga = { nombre: string; url: string; descripcion: string }

const BASICOS: Descarga[] = [
  {
    nombre: 'items.json',
    url: `${BASE}/formatted/items.json`,
    descripcion: 'nombres de ítems traducidos',
  },
  {
    nombre: 'items-raw.json',
    url: `${BASE}/items.json`,
    descripcion: 'tipos de ítem y listas de hechizos',
  },
  {
    nombre: 'spells.json',
    url: `${BASE}/spells.json`,
    descripcion: 'catálogo de hechizos',
  },
]

const LOCALIZACION: Descarga = {
  nombre: 'localization.json',
  url: `${BASE}/localization.json`,
  descripcion: 'traducciones (nombres de hechizos en español)',
}

function formatearMB(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function descargar({ nombre, url, descripcion }: Descarga) {
  const destino = path.join(DIR_DATOS, nombre)
  process.stdout.write(`  ${nombre.padEnd(22)} ${descripcion}\n`)

  const respuesta = await fetch(url)
  if (!respuesta.ok || !respuesta.body) {
    throw new Error(`No se pudo descargar ${nombre}: HTTP ${respuesta.status}`)
  }

  // Se escribe a un temporal y se renombra al final: si la descarga se corta,
  // no queda un JSON truncado que después reviente el seed con un error raro.
  const temporal = `${destino}.parcial`
  await pipeline(
    Readable.fromWeb(respuesta.body as any),
    fs.createWriteStream(temporal),
  )
  fs.renameSync(temporal, destino)

  const { size } = fs.statSync(destino)
  process.stdout.write(`  ${' '.repeat(22)} listo (${formatearMB(size)})\n`)
}

async function main() {
  const conLocalizacion = process.argv.includes('--localizacion')

  fs.mkdirSync(DIR_DATOS, { recursive: true })

  console.log('\nDescargando dumps de Albion desde ao-bin-dumps...\n')

  const pendientes = conLocalizacion ? [...BASICOS, LOCALIZACION] : BASICOS

  for (const descarga of pendientes) {
    await descargar(descarga)
  }

  if (!conLocalizacion) {
    console.log(
      '\nNota: sin localization.json los hechizos se muestran con su nombre\n' +
        'interno (por ejemplo "Fireball Staff"). Para tenerlos en español:\n\n' +
        '    npm run data:download -- --localizacion\n',
    )
  }

  console.log('\nListo. Ahora: npm run seed\n')
}

main().catch((error) => {
  console.error('\nFalló la descarga:', error.message)
  process.exit(1)
})
