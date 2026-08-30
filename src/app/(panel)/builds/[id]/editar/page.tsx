import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { CreadorBuild } from '@/components/builds/CreadorBuild'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { obtenerBuild } from '@/lib/data/builds'
import { puedeEditarBuild } from '@/lib/domain/roles'

export const metadata = { title: 'Editar build' }

export default async function EditarBuild({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const perfil = await exigirMiembroActivo()
  const { id } = await params

  const build = await obtenerBuild(id)
  if (!build) notFound()

  // La autoridad real es la política RLS de UPDATE; este chequeo evita
  // mostrar un formulario que después no va a poder guardarse.
  if (!puedeEditarBuild(perfil.role, build.author?.id, perfil.id)) {
    redirect(`/builds/${id}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/builds/${id}`}
          className="text-sm text-texto-suave transition-colors hover:text-texto"
        >
          ← Volver a la build
        </Link>
        <h1 className="mt-1 text-xl font-bold">Editar build</h1>
      </div>

      <CreadorBuild
        inicial={{
          id: build.id,
          title: build.title,
          category: build.category,
          description: build.description ?? '',
          equipment: build.equipment,
          consumables: build.consumables,
          abilities: build.abilities,
        }}
      />
    </div>
  )
}
