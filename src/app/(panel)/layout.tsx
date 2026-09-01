import Link from 'next/link'

import { CacheDeIconos } from '@/components/panel/CacheDeIconos'
import { Heartbeat } from '@/components/panel/Heartbeat'
import { MenuUsuario } from '@/components/panel/MenuUsuario'
import { Navegacion, type Enlace } from '@/components/panel/Navegacion'
import { Blason } from '@/components/ui/Iconos'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { contarPendientes } from '@/lib/data/usuarios'
import { puedeGestionarUsuarios } from '@/lib/domain/roles'

const ENLACES_BASE: Enlace[] = [
  { href: '/panel', etiqueta: 'Panel' },
  { href: '/builds', etiqueta: 'Builds' },
  { href: '/rutas', etiqueta: 'Rutas' },
  { href: '/mercado', etiqueta: 'Mercado' },
]

/**
 * Layout de las secciones privadas.
 *
 * exigirMiembroActivo() corre en el servidor antes de renderizar nada, así que
 * un usuario sin aprobar no llega a recibir el HTML del panel. En la versión
 * anterior la app se dibujaba entera y recién después las llamadas a la API
 * devolvían 401 o 403, dejando la pantalla a medio llenar de errores.
 */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const perfil = await exigirMiembroActivo()

  const enlaces = [...ENLACES_BASE]

  /*
    Administración es lo único que se suma según el rol.

    Antes se sumaban además Métricas y Registro. Métricas se sacó entera; el
    registro de auditoría pasó a ser una pestaña dentro de Administración, que
    es donde se lo necesita: se entra a ver quién cambió un rol justo después
    de cambiarlo.

    La insignia con las solicitudes pendientes es la única forma de enterarse
    de que alguien está esperando: nadie entra a Administración "por las
    dudas".
  */
  let pendientes = 0
  if (puedeGestionarUsuarios(perfil.role)) {
    enlaces.push({ href: '/admin', etiqueta: 'Administración' })
    pendientes = await contarPendientes()
  }

  return (
    <div className="min-h-screen">
      <Heartbeat />
      <CacheDeIconos />

      {/* La cabecera es la puerta del keep: borde de oro abajo, piedra
          translúcida y el blasón del gremio a la izquierda. */}
      <header className="sticky top-0 z-40 border-b border-borde-suave bg-fondo/85 shadow-[0_1px_0_oklch(0.78_0.135_80/0.12)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:gap-5 sm:px-8">
          <Link
            href="/panel"
            className="flex shrink-0 items-center gap-2"
            aria-label="Panel del Gremio"
          >
            <Blason className="text-2xl text-acento" />
            <span className="hidden font-titulo text-sm font-semibold uppercase tracking-[0.18em] lg:block">
              Panel del Gremio
            </span>
          </Link>
          <Navegacion enlaces={enlaces} pendientes={pendientes} />
          <div className="ml-auto">
            <MenuUsuario
              nombre={perfil.name}
              rol={perfil.role}
              avatarUrl={perfil.avatar_url}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">{children}</main>
    </div>
  )
}
