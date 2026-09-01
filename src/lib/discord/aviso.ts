import 'server-only'

/**
 * Aviso a Discord cuando llega una solicitud.
 *
 * QUÉ RESUELVE
 *
 * El panel puede recibir solicitudes perfectas, pero si nadie las mira quedan
 * ahí. El staff vive en Discord, no en el panel: la única forma de que una
 * solicitud se atienda rápido es que aparezca donde ya están mirando.
 *
 * Es la pieza que hace que el panel REEMPLACE al canal en vez de competir con
 * él: el formulario se llena acá, con los campos completos y validados, y el
 * aviso llega allá.
 *
 * POR QUÉ UN WEBHOOK Y NO UN BOT
 *
 * Un bot es una aplicación que hay que registrar, hospedar y mantener con un
 * token que puede hacer cosas en el servidor. Un webhook es una URL que solo
 * sirve para publicar en UN canal: si se filtra, lo peor que pasa es que
 * alguien escriba mensajes ahí. Para avisar de una solicitud alcanza y sobra.
 *
 * SI NO ESTÁ CONFIGURADO, NO PASA NADA
 *
 * Sin la variable, esta función no hace nada y devuelve false. El panel
 * funciona igual; simplemente el staff se entera entrando a Administración,
 * donde la insignia ya muestra cuántas hay sin resolver.
 */

const WEBHOOK = 'DISCORD_WEBHOOK_SOLICITUDES'

export type AvisoSolicitud = {
  nombre: string
  edad: number
  horario: string
  dispositivo: string
  rolPrincipal: string
  rolSecundario: string | null
  contenido: string[]
  gremioAnterior: string | null
  quienLoTrajo: string | null
  discord: string | null
}

/** Los campos que Discord muestra en dos columnas. */
function campos(s: AvisoSolicitud) {
  const lista: { name: string; value: string; inline: boolean }[] = [
    { name: 'Edad', value: String(s.edad), inline: true },
    { name: 'Dispositivo', value: s.dispositivo, inline: true },
    { name: 'Horario', value: s.horario, inline: false },
    {
      name: 'Rol',
      value: s.rolSecundario
        ? `${s.rolPrincipal} · ${s.rolSecundario}`
        : s.rolPrincipal,
      inline: true,
    },
    { name: 'Contenido', value: s.contenido.join(', '), inline: true },
  ]

  // Los opcionales solo aparecen si vinieron: un campo vacío en Discord ocupa
  // el mismo lugar que uno lleno y no dice nada.
  if (s.gremioAnterior) {
    lista.push({ name: 'Gremio anterior', value: s.gremioAnterior, inline: true })
  }
  if (s.quienLoTrajo) {
    lista.push({ name: 'Lo trajo', value: s.quienLoTrajo, inline: true })
  }
  if (s.discord) {
    lista.push({ name: 'Discord', value: s.discord, inline: true })
  }

  return lista
}

export async function avisarSolicitud(s: AvisoSolicitud): Promise<boolean> {
  const url = process.env[WEBHOOK]?.trim()
  if (!url) return false

  const sitio = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // El nombre del postulante va en el título y no en el contenido para
        // que la notificación del teléfono ya diga de quién se trata.
        embeds: [
          {
            title: `Nueva solicitud: ${s.nombre}`,
            description: sitio
              ? `Revisala en ${sitio}/admin`
              : 'Revisala en la sección de Administración del panel.',
            // El oro de la antorcha, para que se reconozca de dónde viene.
            color: 0xe0b65c,
            fields: campos(s),
            footer: { text: 'Las capturas están en el panel' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    })

    return respuesta.ok
  } catch {
    // Discord caído o URL mal escrita. La solicitud ya está guardada, que es lo
    // que importa: no se propaga el error para no hacerle creer al postulante
    // que su envío falló.
    return false
  }
}
