import { Heartbeat } from '@/components/panel/Heartbeat'
import { MenuUsuario } from '@/components/panel/MenuUsuario'
import { Navegacion, type Enlace } from '@/components/panel/Navegacion'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { esOficial, puedeGestionarUsuarios } from '@/lib/domain/roles'

const ENLACES_BASE: Enlace[] = [
  { href: '/panel', etiqueta: 'Panel' },
  { href: '/builds', etiqueta: 'Builds' },
  { href: '/rutas', etiqueta: 'Rutas' },
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
  if (esOficial(perfil.role)) {
    enlaces.push(
      { href: '/metricas', etiqueta: 'Métricas' },
      { href: '/registro', etiqueta: 'Registro' },
    )
  }
  if (puedeGestionarUsuarios(perfil.role)) {
    enlaces.push({ href: '/admin', etiqueta: 'Administración' })
  }

  return (
    <div className="min-h-screen">
      <Heartbeat />

      <header className="sticky top-0 z-40 border-b border-borde-suave bg-superficie/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5 sm:px-6">
          <span className="hidden shrink-0 text-sm font-bold tracking-tight sm:block">
            PANEL DEL GREMIO
          </span>
          <Navegacion enlaces={enlaces} />
          <div className="ml-auto">
            <MenuUsuario
              nombre={perfil.name}
              rol={perfil.role}
              avatarUrl={perfil.avatar_url}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
