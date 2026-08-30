import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CreadorBuild } from '@/components/builds/CreadorBuild'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { puedeCrearBuilds } from '@/lib/domain/roles'

export const metadata = { title: 'Nueva build' }

export default async function NuevaBuild() {
  const perfil = await exigirMiembroActivo()

  // Un Invitado puede leer builds pero no crearlas. La política RLS de INSERT
  // aplica lo mismo; esto solo evita mostrarle un formulario inútil.
  if (!puedeCrearBuilds(perfil.role)) redirect('/builds')

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/builds"
          className="text-sm text-texto-suave transition-colors hover:text-texto"
        >
          ← Volver a builds
        </Link>
        <h1 className="mt-1 text-xl font-bold">Nueva build</h1>
      </div>

      <CreadorBuild />
    </div>
  )
}
