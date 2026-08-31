import Link from 'next/link'

import { Boton } from '@/components/ui/Boton'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { IconoMapa, IconoMas } from '@/components/ui/Iconos'
import { Vacio } from '@/components/ui/Vacio'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { listarRutas } from '@/lib/data/rutas'
import { puedeUsarMapa } from '@/lib/domain/roles'
import { resumirRuta } from '@/lib/domain/rutas'

export const metadata = { title: 'Rutas' }

export default async function Rutas({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const perfil = await exigirMiembroActivo()
  const puedeCrear = puedeUsarMapa(perfil.role)

  const { q } = await searchParams
  const rutas = await listarRutas(q)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rutas avalonianas</h1>
          <p className="mt-0.5 text-sm text-texto-tenue">
            Por dónde entrar y cuántos portales tomar para llegar rápido.
          </p>
        </div>
        {puedeCrear && (
          <Link href="/rutas/nueva">
            <Boton>
              <IconoMas className="text-sm" />
              Nueva ruta
            </Boton>
          </Link>
        )}
      </div>

      {/* La búsqueda va por GET y sin JavaScript: es un formulario común, así
          que el enlace del resultado se puede compartir. */}
      <form action="/rutas" className="max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          className="campo"
          placeholder="Buscar por nombre o mapa de entrada…"
          aria-label="Buscar rutas"
        />
      </form>

      {rutas.length === 0 ? (
        <Vacio
          icono={IconoMapa}
          titulo={
            q ? `Ninguna ruta coincide con "${q}"` : 'Todavía no hay rutas'
          }
          descripcion={
            q
              ? 'Se busca por el nombre de la ruta y por el mapa de entrada.'
              : 'Cargá la primera y el gremio deja de perder tiempo buscando el camino.'
          }
          accion={
            puedeCrear && !q ? (
              <Link href="/rutas/nueva">
                <Boton>
                  <IconoMas className="text-sm" />
                  Nueva ruta
                </Boton>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rutas.map((ruta) => {
            const resumen = resumirRuta(ruta.steps)

            return (
              <Link
                key={ruta.id}
                href={`/rutas/${ruta.id}`}
                className="losa block p-5 transition-colors hover:border-acento"
              >
                <h2 className="truncate text-lg font-semibold leading-snug">
                  {ruta.name}
                </h2>

                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="text-texto-suave">{ruta.origin}</span>
                  <span className="text-texto-tenue">→</span>
                  <span
                    className={
                      ruta.destination ? 'text-texto-suave' : 'text-texto-tenue'
                    }
                  >
                    {ruta.destination ?? 'sin explorar'}
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-borde-suave pt-3">
                  <Etiqueta tono="acento">
                    {resumen.portales} portal{resumen.portales === 1 ? '' : 'es'}
                  </Etiqueta>
                  {resumen.mapas > 0 && (
                    <Etiqueta>
                      {resumen.mapas} mapa{resumen.mapas === 1 ? '' : 's'}
                    </Etiqueta>
                  )}
                  <span className="ml-auto truncate text-xs text-texto-tenue">
                    por {ruta.author?.name ?? 'desconocido'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
