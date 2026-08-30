import Link from 'next/link'

import { TarjetaBuild } from '@/components/builds/TarjetaBuild'
import { Boton } from '@/components/ui/Boton'
import { Vacio } from '@/components/ui/Vacio'
import { CATEGORIAS_BUILD } from '@/lib/domain/builds'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { puedeCrearBuilds } from '@/lib/domain/roles'
import { listarBuilds } from '@/lib/data/builds'
import { cn } from '@/lib/utils/cn'

export const metadata = { title: 'Builds' }

export default async function Builds({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  // El layout ya exige sesión, pero Next renderiza layout y página en
  // paralelo: sin este guard la consulta puede arrancar antes de que el
  // redirect del layout resuelva, y estalla con un error de permisos.
  // obtenerPerfil() está memorizado por petición, así que no cuesta nada.
  const perfil = await exigirMiembroActivo()
  const puedeCrear = puedeCrearBuilds(perfil.role)

  const { categoria } = await searchParams

  // El filtro va en la URL, no en el estado: se puede compartir el enlace de
  // "todas las builds de ZvZ" y el botón atrás funciona.
  const filtro = CATEGORIAS_BUILD.includes(categoria as never)
    ? categoria
    : undefined

  const builds = await listarBuilds(filtro)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Builds</h1>
        {puedeCrear && (
          <Link href="/builds/nueva">
            <Boton>Crear build</Boton>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/builds"
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
            !filtro
              ? 'bg-acento text-white'
              : 'bg-superficie-alta text-texto-suave hover:text-texto',
          )}
        >
          Todas
        </Link>
        {CATEGORIAS_BUILD.map((c) => (
          <Link
            key={c}
            href={`/builds?categoria=${encodeURIComponent(c)}`}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
              filtro === c
                ? 'bg-acento text-white'
                : 'bg-superficie-alta text-texto-suave hover:text-texto',
            )}
          >
            {c}
          </Link>
        ))}
      </div>

      {builds.length === 0 ? (
        <Vacio
          titulo={filtro ? `Todavía no hay builds de ${filtro}` : 'Todavía no hay builds'}
          descripcion="Creá la primera y quedará disponible para todo el gremio."
          accion={
            puedeCrear ? (
              <Link href="/builds/nueva">
                <Boton>Crear build</Boton>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builds.map((build) => (
            <TarjetaBuild key={build.id} build={build} />
          ))}
        </div>
      )}
    </div>
  )
}
