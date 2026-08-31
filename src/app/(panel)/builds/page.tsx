import Link from 'next/link'
import { Suspense } from 'react'


import { BuscadorBuilds } from '@/components/builds/BuscadorBuilds'
import { ListaBuilds, type BuildEnLista } from '@/components/builds/ListaBuilds'
import { Boton } from '@/components/ui/Boton'
import { IconoEspada, IconoMas } from '@/components/ui/Iconos'
import { Vacio } from '@/components/ui/Vacio'
import { CATEGORIAS_BUILD, SLOTS_EQUIPO } from '@/lib/domain/builds'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { puedeCrearBuilds } from '@/lib/domain/roles'
import { listarBuilds } from '@/lib/data/builds'
import { obtenerDatosDeItems } from '@/lib/data/items'
import { resumirBuild } from '@/lib/domain/calculo'
import { cn } from '@/lib/utils/cn'

export const metadata = { title: 'Builds' }

export default async function Builds({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>
}) {
  // El layout ya exige sesión, pero Next renderiza layout y página en
  // paralelo: sin este guard la consulta puede arrancar antes de que el
  // redirect del layout resuelva, y estalla con un error de permisos.
  // obtenerPerfil() está memorizado por petición, así que no cuesta nada.
  const perfil = await exigirMiembroActivo()
  const puedeCrear = puedeCrearBuilds(perfil.role)

  const { categoria, q } = await searchParams

  // El filtro va en la URL, no en el estado: se puede compartir el enlace de
  // "todas las builds de ZvZ" y el botón atrás funciona.
  const filtro = CATEGORIAS_BUILD.includes(categoria as never)
    ? categoria
    : undefined

  const builds = await listarBuilds(filtro, q)

  /*
    El poder de ítem sale de la tabla `items`, no del JSON de la build: así un
    rebalanceo del juego se refleja en las builds ya guardadas.

    Se pide de una sola vez para todo el listado y no una consulta por build:
    son seis piezas cada una, y con veinte builds ya serían ciento veinte
    viajes. obtenerDatosDeItems agrupa en tandas de 200, así que en la práctica
    son dos o tres consultas.
  */
  const idsItems = builds.flatMap((b) =>
    SLOTS_EQUIPO.map((s) => b.equipment[s]?.id).filter(
      (x): x is string => Boolean(x),
    ),
  )
  const datosItems = await obtenerDatosDeItems(idsItems)

  const entradas: BuildEnLista[] = builds.map((build) => ({
    build,
    poderPromedio: resumirBuild(build, datosItems).poderPromedio,
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Builds</h1>
        <Suspense fallback={<div className="max-w-sm flex-1" />}>
          <BuscadorBuilds />
        </Suspense>
        {puedeCrear && (
          <Link href="/builds/nueva">
            <Boton>
              <IconoMas className="text-sm" />
              Crear build
            </Boton>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link
          href={q ? `/builds?q=${encodeURIComponent(q)}` : '/builds'}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            !filtro
              ? 'bg-acento text-sobre-acento'
              : 'bg-superficie-alta text-texto-suave hover:text-texto',
          )}
        >
          Todas
        </Link>
        {CATEGORIAS_BUILD.map((c) => (
          <Link
            key={c}
            href={`/builds?categoria=${encodeURIComponent(c)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filtro === c
                ? 'bg-acento text-sobre-acento'
                : 'bg-superficie-alta text-texto-suave hover:text-texto',
            )}
          >
            {c}
          </Link>
        ))}
      </div>

      {entradas.length === 0 ? (
        <Vacio
          icono={IconoEspada}
          titulo={
            q
              ? `Ninguna build coincide con "${q}"`
              : filtro
                ? `Todavía no hay builds de ${filtro}`
                : 'Todavía no hay builds'
          }
          descripcion={
            q
              ? 'Se busca por el título de la build y por el nombre del arma.'
              : 'Creá la primera y quedará disponible para todo el gremio.'
          }
          accion={
            puedeCrear && !q ? (
              <Link href="/builds/nueva">
                <Boton>
                  <IconoMas className="text-sm" />
                  Crear build
                </Boton>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ListaBuilds entradas={entradas} />
      )}
    </div>
  )
}
