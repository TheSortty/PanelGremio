import 'server-only'

/**
 * Publicación en Discord.
 *
 * EL ORDEN IMPORTA: PRIMERO LA WEB, DESPUÉS DISCORD
 *
 * Todo lo que se anuncia se carga primero acá, donde queda con autor, fecha y
 * estado, y recién después se publica allá. Discord no guarda nada que el panel
 * no tenga: es la vidriera, no el archivo.
 *
 * Por eso todas las funciones de este archivo se llaman DESPUÉS de escribir en
 * la base, y ninguna propaga su error. Si Discord está caído, el evento igual
 * quedó creado y la multa igual quedó puesta. Al revés —anunciar primero—
 * podría publicar algo que después no se guardó.
 *
 * POR QUÉ WEBHOOKS Y NO UN BOT
 *
 * Un bot es una aplicación que hay que registrar, hospedar y mantener con un
 * token que puede actuar en el servidor. Un webhook es una URL que solo publica
 * en UN canal: si se filtra, lo peor que pasa es que alguien escriba ahí.
 *
 * Cada canal tiene su webhook, así que las solicitudes no caen en el mismo lado
 * que los eventos. El que no esté configurado, simplemente no publica.
 */

export const CANALES = {
  solicitudes: 'DISCORD_WEBHOOK_SOLICITUDES',
  eventos: 'DISCORD_WEBHOOK_EVENTOS',
  multas: 'DISCORD_WEBHOOK_MULTAS',
} as const

export type Canal = keyof typeof CANALES

/** El oro de la antorcha, para que se reconozca de dónde viene el mensaje. */
const ORO = 0xe0b65c

type Campo = { name: string; value: string; inline?: boolean }

type Mensaje = {
  titulo: string
  descripcion?: string
  campos?: Campo[]
  pie?: string
  color?: number
}

function urlDelPanel(ruta: string) {
  const sitio = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  return sitio ? `${sitio}${ruta}` : null
}

/**
 * Publica en un canal. Devuelve false si no está configurado o si falló.
 *
 * Nunca lanza: quien la llama ya guardó lo importante y no debería enterarse
 * de que Discord tuvo un mal día.
 */
export async function publicar(canal: Canal, mensaje: Mensaje): Promise<boolean> {
  const url = process.env[CANALES[canal]]?.trim()
  if (!url) return false

  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: mensaje.titulo,
            description: mensaje.descripcion,
            color: mensaje.color ?? ORO,
            // Los campos vacíos ocupan el mismo lugar que los llenos y no dicen
            // nada, así que se filtran antes de mandarlos.
            fields: (mensaje.campos ?? []).filter((c) => c.value),
            footer: mensaje.pie ? { text: mensaje.pie } : undefined,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    })

    return respuesta.ok
  } catch {
    return false
  }
}

// -----------------------------------------------------------------------------
// Mensajes concretos
// -----------------------------------------------------------------------------

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

export async function avisarSolicitud(s: AvisoSolicitud) {
  const panel = urlDelPanel('/admin')

  return publicar('solicitudes', {
    // El nombre va en el título para que la notificación del teléfono ya diga
    // de quién se trata.
    titulo: `Nueva solicitud: ${s.nombre}`,
    descripcion: panel ? `Revisala en ${panel}` : 'Revisala en Administración.',
    campos: [
      { name: 'Edad', value: String(s.edad), inline: true },
      { name: 'Dispositivo', value: s.dispositivo, inline: true },
      { name: 'Horario', value: s.horario },
      {
        name: 'Rol',
        value: s.rolSecundario
          ? `${s.rolPrincipal} · ${s.rolSecundario}`
          : s.rolPrincipal,
        inline: true,
      },
      { name: 'Contenido', value: s.contenido.join(', '), inline: true },
      { name: 'Gremio anterior', value: s.gremioAnterior ?? '', inline: true },
      { name: 'Lo trajo', value: s.quienLoTrajo ?? '', inline: true },
      { name: 'Discord', value: s.discord ?? '', inline: true },
    ],
    pie: 'Las capturas están en el panel',
  })
}

export type AvisoEvento = {
  id: string
  titulo: string
  tipo: string
  comienzaEn: Date
  lugar: string | null
  ipMinimo: number | null
  descripcion: string | null
}

export async function avisarEvento(e: AvisoEvento) {
  const panel = urlDelPanel(`/eventos/${e.id}`)

  /*
    La hora va como marca de tiempo de Discord (<t:epoch:F>), no como texto.

    Discord la traduce a la zona horaria de cada uno: el gremio juega desde
    varios husos y "18:00" a secas es la fuente más común de que alguien
    aparezca una hora tarde. El segundo formato, R, muestra "en 3 horas".
  */
  const epoch = Math.floor(e.comienzaEn.getTime() / 1000)

  return publicar('eventos', {
    titulo: `${e.tipo}: ${e.titulo}`,
    descripcion: [
      `<t:${epoch}:F> · <t:${epoch}:R>`,
      e.descripcion,
      panel ? `\nConfirmá asistencia en ${panel}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    campos: [
      { name: 'Punto de reunión', value: e.lugar ?? '', inline: true },
      {
        name: 'IP mínimo',
        value: e.ipMinimo ? String(e.ipMinimo) : '',
        inline: true,
      },
    ],
  })
}

export type AvisoMulta = {
  miembro: string
  monto: number
  motivo: string
  emitidaPor: string
}

export async function avisarMulta(m: AvisoMulta) {
  return publicar('multas', {
    titulo: `Multa a ${m.miembro}`,
    descripcion: m.motivo,
    // Rojo sangre: una multa no es una novedad más.
    color: 0xc4553d,
    campos: [
      {
        name: 'Monto',
        value:
          m.monto > 0
            ? `${new Intl.NumberFormat('es-AR').format(m.monto)} de plata`
            : 'Advertencia sin monto',
        inline: true,
      },
      { name: 'La puso', value: m.emitidaPor, inline: true },
    ],
    pie: 'El detalle está en el panel, en Administración',
  })
}
