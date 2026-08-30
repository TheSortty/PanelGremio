/**
 * Build para Cloudflare Workers. Es lo que corre `npm run build`.
 *
 * POR QUÉ `npm run build` Y NO UN SCRIPT APARTE
 *
 * Con la mayoría de los frameworks alcanza con `npm run build` porque su salida
 * ya es servible. Next.js sobre Workers no: `next build` produce un servidor de
 * Node, y Workers no ejecuta Node. Hace falta transformarlo a un bundle de
 * Worker, que es lo que hace OpenNext.
 *
 * Poniendo ese proceso completo detrás de `npm run build`, el ajuste por
 * defecto del panel de Cloudflare ya hace lo correcto y no hay que recordar un
 * comando especial. Para un `next build` pelado existe `npm run build:next`.
 *
 * OJO CON LA RECURSIÓN
 *
 * @opennextjs/aws, cuando construye la app por su cuenta, ejecuta
 * `npm run build` (ver buildNextApp.js). Como acá `npm run build` ES este
 * script, eso sería un bucle infinito. No pasa porque:
 *
 *   - el paso 1 llama a `npx next build` directamente, no a `npm run build`;
 *   - el paso 3 pasa --skipNextBuild, así que el adaptador nunca construye.
 *
 * Si alguna vez se saca --skipNextBuild, hay que sacar también este script de
 * `npm run build`.
 *
 * EL PROBLEMA QUE RESUELVE
 *
 * `opennextjs-cloudflare build` falla con:
 *
 *     Error: This error should only happen for static 404 and 500 page from
 *     page router. Report this if that's not the case.
 *             File server/middleware.js does not exist
 *
 * Es un bug del adaptador con Next.js 16, no de esta aplicación.
 *
 * En @opennextjs/aws, copyTracedFiles hace:
 *
 *     if (existsSync(.next/server/middleware.js.nft.json)) {
 *       copiar ese .nft.json al directorio standalone
 *       computeCopyFilesForPage("middleware")   // exige standalone/.next/server/middleware.js
 *     }
 *
 * Next 16 sí emite `.next/server/middleware.js` y su `.nft.json`, pero ya NO
 * incluye `server/middleware.js` dentro de la salida standalone. Entonces la
 * condición entra y la comprobación de adentro revienta.
 *
 * Lo llamativo es que el adaptador YA arregla este mismo problema para
 * `instrumentation.js`, unas líneas más arriba y con un comentario que dice
 * textualmente que "la salida standalone de Next 16 ya no incluye
 * server/instrumentation.js". Simplemente no aplicaron el arreglo a middleware.
 *
 * LA SOLUCIÓN
 *
 * Hacer para middleware lo mismo que el adaptador hace para instrumentation:
 * copiar el archivo desde el directorio de build al standalone antes de que
 * corra el empaquetado. Por eso el build se parte en dos pasos con
 * --skipNextBuild en el medio.
 *
 * CUÁNDO SACAR ESTO
 *
 * Cuando @opennextjs/aws incluya el arreglo. Para probarlo: comentar la copia,
 * correr `npm run cf:build` y ver si pasa. Si pasa, este archivo sobra y el
 * script puede volver a ser `opennextjs-cloudflare build` a secas.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const raiz = process.cwd()
const esWindows = process.platform === 'win32'

function correr(comando, args, entorno = {}) {
  execFileSync(comando, args, {
    stdio: 'inherit',
    cwd: raiz,
    env: { ...process.env, ...entorno },
    // En Windows los binarios de node_modules/.bin son .cmd, que execFile no
    // ejecuta sin shell.
    shell: esWindows,
  })
}

console.log('\n[1/3] next build (modo standalone)\n')

/*
  Estas dos variables son las que el propio adaptador setea antes de correr
  `next build` (ver @opennextjs/aws/dist/build/buildNextApp.js,
  setStandaloneBuildMode). Como acá el build de Next lo lanzamos nosotros para
  poder meter el parche del paso 2, hay que replicarlas: sin ellas no se genera
  el directorio .next/standalone y el empaquetado falla más adelante buscando
  pages-manifest.json.
*/
correr('npx', ['next', 'build'], {
  NEXT_PRIVATE_STANDALONE: 'true',
  NEXT_PRIVATE_OUTPUT_TRACE_ROOT: raiz,
})

console.log('\n[2/3] parche: middleware.js -> salida standalone\n')

const origen = path.join(raiz, '.next', 'server', 'middleware.js')
const destinoDir = path.join(raiz, '.next', 'standalone', '.next', 'server')
const destino = path.join(destinoDir, 'middleware.js')

if (!fs.existsSync(origen)) {
  // Sin proxy.ts no se emite el archivo, y el adaptador tampoco entra a esa
  // rama. No hay nada que parchear.
  console.log('  .next/server/middleware.js no existe; nada que copiar.')
} else if (fs.existsSync(destino)) {
  // El adaptador arregló el bug: este script ya no hace falta.
  console.log('  el archivo ya está en standalone; el parche quedó obsoleto.')
} else {
  fs.mkdirSync(destinoDir, { recursive: true })
  fs.copyFileSync(origen, destino)

  // El mapa de código no es necesario para ejecutar, pero si está lo llevamos
  // para que las trazas de error sean legibles.
  const mapaOrigen = `${origen}.map`
  if (fs.existsSync(mapaOrigen)) {
    fs.copyFileSync(mapaOrigen, `${destino}.map`)
  }

  const kb = (fs.statSync(destino).size / 1024).toFixed(1)
  console.log(`  copiado (${kb} KB)`)
}

console.log('\n[3/3] opennextjs-cloudflare build\n')
correr('npx', ['opennextjs-cloudflare', 'build', '--skipNextBuild'])

console.log('\nListo. El worker quedó en .open-next/\n')
