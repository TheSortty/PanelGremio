import type { Metadata, Viewport } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Panel del Gremio',
    template: '%s · Panel del Gremio',
  },
  description:
    'Panel de gestión de gremio para Albion Online: actividad de miembros, builds y mapa estratégico.',
}

export const viewport: Viewport = {
  themeColor: '#1a1c25',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
