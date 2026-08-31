import { PestanasAdmin } from '@/components/admin/PestanasAdmin'
import { contarPendientes } from '@/lib/data/usuarios'
import { exigirAdmin } from '@/lib/auth/sesion'

/**
 * Marco de la sección de administración.
 *
 * El guard va acá y también en cada página. Es a propósito: Next renderiza el
 * layout y la página en paralelo, así que si la página no exigiera permisos por
 * su cuenta, su consulta podría arrancar antes de que el redirect del layout
 * resuelva.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await exigirAdmin()
  const pendientes = await contarPendientes()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Administración</h1>
        <p className="mt-0.5 text-sm text-texto-tenue">
          Quién entra al gremio, con qué rango, y qué se hizo hasta ahora.
        </p>
      </div>

      <PestanasAdmin pendientes={pendientes} />

      {children}
    </div>
  )
}
