/**
 * Las tres regiones de Albion.
 *
 * Vive en su propio archivo, sin `server-only`, porque lo necesitan las dos
 * puntas: el cliente para dibujar el selector de región, y el servidor para
 * armar la URL de la API. Tenerlo junto con el código que hace fetch obligaba
 * al componente cliente a importar un módulo marcado como server-only, que
 * Next rechaza —y con razón: arrastraría lógica de servidor al bundle del
 * navegador.
 *
 * Cada región es un mundo aparte: el mismo nombre de gremio puede existir en
 * las tres y no ser el mismo gremio.
 */
export const REGIONES = {
  americas: { etiqueta: 'Américas', host: 'gameinfo' },
  europe: { etiqueta: 'Europa', host: 'gameinfo-ams' },
  asia: { etiqueta: 'Asia', host: 'gameinfo-sgp' },
} as const

export type Region = keyof typeof REGIONES

export type GremioEncontrado = {
  id: string
  nombre: string
  alianza: string | null
}
