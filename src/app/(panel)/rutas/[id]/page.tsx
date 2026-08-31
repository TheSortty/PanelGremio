import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AccionesRuta } from '@/components/rutas/AccionesRuta'
import { CadenaRuta } from '@/components/rutas/CadenaRuta'
import { Card, CardTitulo } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { obtenerRuta } from '@/lib/data/rutas'
import { puedeEditarBuild } from '@/lib/domain/roles'
import { resumirRuta } from '@/lib/domain/rutas'
import { fechaCorta } from '@/lib/utils/formato'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ruta = await obtenerRuta(id)
  return { title: ruta?.name ?? 'Ruta' }
}

export default async function DetalleRuta({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const perfil = await exigirMiembroActivo()
  const { id } = await params

  const ruta = await obtenerRuta(id)

  // Una ruta inexistente y una que RLS no deja ver llegan igual como null. Se
  // responde 404 en los dos casos: distinguirlos revelaría qué ids existen.
  if (!ruta) notFound()

  const resumen = resumirRuta(ruta.steps)
  // Mismo criterio que las builds: el autor la suya, un oficial cualquiera.
  const puedeEditar = puedeEditarBuild(perfil.role, ruta.author?.id, perfil.id)

  return (
    <div className="space-y-5">
      <Link
        href="/rutas"
        className="inline-block text-sm text-texto-suave transition-colors hover:text-texto"
      >
        ← Volver a rutas
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{ruta.name}</h1>
            <p className="mt-1 text-sm text-texto-tenue">
              por {ruta.author?.name ?? 'autor desconocido'} ·{' '}
              {fechaCorta(ruta.created_at)}
            </p>
          </div>
          {puedeEditar && <AccionesRuta rutaId={ruta.id} nombre={ruta.name} />}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-borde-suave pt-4">
          <Etiqueta tono="acento">
            {resumen.portales} portal{resumen.portales === 1 ? '' : 'es'}
          </Etiqueta>
          <Etiqueta>
            {resumen.mapas} mapa{resumen.mapas === 1 ? '' : 's'} de camino
          </Etiqueta>
          <Etiqueta>
            {resumen.pasos} paso{resumen.pasos === 1 ? '' : 's'} en total
          </Etiqueta>
        </div>

        {ruta.notes && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-texto-suave">
            {ruta.notes}
          </p>
        )}
      </Card>

      <Card>
        <CardTitulo>El recorrido</CardTitulo>
        {ruta.steps.length === 0 ? (
          <p className="text-sm text-texto-tenue">
            Esta ruta todavía no tiene los pasos cargados.
          </p>
        ) : (
          <CadenaRuta
            origen={ruta.origin}
            destino={ruta.destination}
            pasos={ruta.steps}
          />
        )}
      </Card>
    </div>
  )
}
