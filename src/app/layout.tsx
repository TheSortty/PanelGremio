import type { Metadata, Viewport } from 'next'
import { Barlow, Grenze } from 'next/font/google'

import './globals.css'

/**
 * Dos tipografías con papeles distintos.
 *
 * Grenze es una romana de remates angulosos: da el aire grabado que pide un
 * panel de gremio sin recurrir a una gótica, que a 13 px sería ilegible. Se usa
 * solo en títulos y rótulos, nunca en texto corrido.
 *
 * Barlow lleva el cuerpo. Es una grotesca ligeramente estrecha, pensada para
 * señalética, que aguanta bien los tamaños chicos de una tabla y no compite con
 * la voz de Grenze.
 *
 * Las dos se descargan en el build y se sirven desde nuestro dominio: no hay
 * pedido a Google en tiempo de ejecución, ni salto de tipografía al cargar.
 */
const titulo = Grenze({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--fuente-titulo',
  display: 'swap',
})

const cuerpo = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fuente-cuerpo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Panel del Gremio',
    template: '%s · Panel del Gremio',
  },
  description:
    'Panel de gestión de gremio para Albion Online: actividad de miembros, builds y mapa estratégico.',
}

export const viewport: Viewport = {
  // La piedra profunda del fondo, para que la barra del navegador en móvil
  // acompañe en vez de cortar la página con una franja clara.
  themeColor: '#151009',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${titulo.variable} ${cuerpo.variable}`}>
      <body>{children}</body>
    </html>
  )
}
