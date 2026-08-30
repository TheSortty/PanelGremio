import { notFound } from 'next/navigation'

import { VisorBuild } from '@/components/builds/VisorBuild'
import { iaDisponible } from '@/actions/guia'
import { obtenerBuild } from '@/lib/data/builds'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const build = await obtenerBuild(id)
  return { title: build?.title ?? 'Build' }
}

export default async function DetalleBuild({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [build, ia] = await Promise.all([obtenerBuild(id), iaDisponible()])

  // Una build inexistente y una que RLS no deja ver llegan igual como null.
  // Se responde 404 en los dos casos: distinguirlos revelaría qué ids existen.
  if (!build) notFound()

  return <VisorBuild build={build} puedeGenerarGuia={ia} />
}
