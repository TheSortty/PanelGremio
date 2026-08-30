import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

import type { Database } from '../../src/lib/db/database.types'

export const DIR_DATOS = path.join(process.cwd(), 'data')

/**
 * Carga las variables de .env.local.
 *
 * Los seeds corren con tsx, fuera de Next.js, así que nadie carga el .env por
 * nosotros. Es un parser mínimo a propósito: no hace falta una dependencia
 * más para leer cuatro líneas.
 */
export function cargarEnv() {
  for (const archivo of ['.env.local', '.env']) {
    const ruta = path.join(process.cwd(), archivo)
    if (!fs.existsSync(ruta)) continue

    for (const linea of fs.readFileSync(ruta, 'utf8').split('\n')) {
      const limpia = linea.trim()
      if (!limpia || limpia.startsWith('#')) continue

      const igual = limpia.indexOf('=')
      if (igual === -1) continue

      const clave = limpia.slice(0, igual).trim()
      let valor = limpia.slice(igual + 1).trim()
      if (
        (valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))
      ) {
        valor = valor.slice(1, -1)
      }
      if (!(clave in process.env)) process.env[clave] = valor
    }
  }
}

/**
 * Cliente con la clave secreta.
 *
 * Los seeds escriben en tablas de referencia que no tienen políticas de
 * escritura: la service_role saltea RLS, que es exactamente lo que se quiere acá
 * y en ningún otro lado.
 */
export function clienteAdmin() {
  cargarEnv()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const clave = process.env.SUPABASE_SECRET_KEY

  if (!url || !clave) {
    console.error(
      '\nFaltan variables de entorno.\n' +
        'Necesito NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local\n' +
        'Copiá .env.example a .env.local y completá los valores del panel de Supabase.\n',
    )
    process.exit(1)
  }

  return createClient<Database>(url, clave, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function leerJson<T = any>(nombreArchivo: string): T {
  const ruta = path.join(DIR_DATOS, nombreArchivo)

  if (!fs.existsSync(ruta)) {
    console.error(
      `\nNo encuentro data/${nombreArchivo}\n` +
        'Descargá los dumps primero:\n\n' +
        '    npm run data:download\n',
    )
    process.exit(1)
  }

  return JSON.parse(fs.readFileSync(ruta, 'utf8')) as T
}

/**
 * Inserta en lotes.
 *
 * Un upsert por fila, como hacían los seeds anteriores, son ~12.000 viajes de
 * ida y vuelta a la base. En lotes de 500 son ~24, y tarda segundos en vez de
 * varios minutos.
 */
export async function insertarEnLotes<T>(
  etiqueta: string,
  filas: T[],
  tamanoLote: number,
  // PromiseLike y no Promise: los builders de supabase-js son thenables, se
  // pueden await pero no son instancias de Promise.
  insertar: (lote: T[]) => PromiseLike<{ error: { message: string } | null }>,
) {
  let hechas = 0

  for (let i = 0; i < filas.length; i += tamanoLote) {
    const lote = filas.slice(i, i + tamanoLote)
    const { error } = await insertar(lote)

    if (error) {
      console.error(`\n  Error en el lote que empieza en ${i}: ${error.message}`)
      process.exit(1)
    }

    hechas += lote.length
    process.stdout.write(`\r  ${etiqueta}: ${hechas}/${filas.length}`)
  }

  process.stdout.write(`\r  ${etiqueta}: ${hechas}/${filas.length}\n`)
}
