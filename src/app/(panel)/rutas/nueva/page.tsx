import Link from 'next/link'
import { redirect } from 'next/navigation'

import { EditorRuta } from '@/components/rutas/EditorRuta'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { puedeUsarMapa } from '@/lib/domain/roles'

export const metadata = { title: 'Nueva ruta' }

export default async function NuevaRuta() {
  const perfil = await exigirMiembroActivo()

  // Un Iniciado o un Invitado leen las rutas pero no las cargan.
  if (!puedeUsarMapa(perfil.role)) redirect('/rutas')

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/rutas"
          className="text-sm text-texto-suave transition-colors hover:text-texto"
        >
          ← Volver a rutas
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Nueva ruta</h1>
      </div>

      <EditorRuta />
    </div>
  )
}
