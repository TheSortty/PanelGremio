import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { EditorRuta } from '@/components/rutas/EditorRuta'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { obtenerRuta } from '@/lib/data/rutas'
import { puedeEditarBuild } from '@/lib/domain/roles'

export const metadata = { title: 'Editar ruta' }

export default async function EditarRuta({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const perfil = await exigirMiembroActivo()
  const { id } = await params

  const ruta = await obtenerRuta(id)
  if (!ruta) notFound()

  // El chequeo también lo hace la política RLS al guardar; acá es para no
  // mostrar un formulario que después va a rebotar.
  if (!puedeEditarBuild(perfil.role, ruta.author?.id, perfil.id)) {
    redirect(`/rutas/${id}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/rutas/${id}`}
          className="text-sm text-texto-suave transition-colors hover:text-texto"
        >
          ← Volver a la ruta
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar ruta</h1>
      </div>

      <EditorRuta ruta={ruta} />
    </div>
  )
}
