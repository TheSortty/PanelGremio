import { notFound } from 'next/navigation'

import { iaDisponible } from '@/actions/guia'
import { VisorBuild } from '@/components/builds/VisorBuild'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { obtenerBuild } from '@/lib/data/builds'
import { obtenerDatosDeItems } from '@/lib/data/items'
import { SLOTS_EQUIPO, SLOTS_CONSUMIBLE } from '@/lib/domain/builds'
import { resumirBuild } from '@/lib/domain/calculo'

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
  await exigirMiembroActivo()
  const { id } = await params

  const [build, ia] = await Promise.all([obtenerBuild(id), iaDisponible()])

  // Una build inexistente y una que RLS no deja ver llegan igual como null.
  // Se responde 404 en los dos casos: distinguirlos revelaría qué ids existen.
  if (!build) notFound()

  // Las stats se leen en vivo de `items`, no del JSONB de la build: así un
  // rebalanceo del juego se refleja en las builds ya guardadas.
  const ids = [
    ...SLOTS_EQUIPO.map((s) => build.equipment[s]?.id),
    ...SLOTS_CONSUMIBLE.map((s) => build.consumables[s]?.id),
  ].filter((x): x is string => Boolean(x))

  const datosItems = await obtenerDatosDeItems(ids)
  const resumen = resumirBuild(build, datosItems)

  return (
    <VisorBuild
      build={build}
      datosItems={datosItems}
      resumen={resumen}
      puedeGenerarGuia={ia}
    />
  )
}
