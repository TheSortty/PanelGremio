import Link from 'next/link'

import { Etiqueta } from '@/components/ui/Etiqueta'
import { SLOTS_EQUIPO, type Build } from '@/lib/domain/builds'

export function TarjetaBuild({ build }: { build: Build }) {
  const piezas = SLOTS_EQUIPO.map((s) => build.equipment[s]).filter(
    (i): i is NonNullable<typeof i> => Boolean(i),
  )

  return (
    <Link
      href={`/builds/${build.id}`}
      className="block rounded-panel border border-borde-suave bg-superficie p-4 transition-colors hover:border-acento"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="truncate font-semibold">{build.title}</h2>
        <Etiqueta tono="acento">{build.category}</Etiqueta>
      </div>

      <div className="mt-3 flex min-h-9 flex-wrap gap-1.5">
        {piezas.map((item) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.id}
            src={item.icon_url}
            alt={item.name}
            title={item.name}
            className="size-9 rounded border border-borde bg-fondo"
            loading="lazy"
          />
        ))}
      </div>

      <p className="mt-3 text-right text-xs text-texto-tenue">
        por {build.author?.name ?? 'desconocido'}
      </p>
    </Link>
  )
}
