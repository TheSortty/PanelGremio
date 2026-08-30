import Link from 'next/link'

import { IconoItem } from '@/components/builds/Icono'
import { Etiqueta } from '@/components/ui/Etiqueta'
import type { Encantamiento } from '@/lib/domain/albion'
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
          <div key={item.id} className="relative">
            {/* Tamaño mini: son miniaturas de 36 px. */}
            <IconoItem
              id={item.id}
              nombre={item.name}
              encantamiento={(item.ench ?? 0) as Encantamiento}
              tamano="mini"
              className="size-9 rounded border border-borde bg-fondo"
            />
            {(item.ench ?? 0) > 0 && (
              <span className="absolute -right-1 -top-1 rounded bg-acento px-1 text-[9px] font-bold leading-tight text-white">
                {item.ench}
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-right text-xs text-texto-tenue">
        por {build.author?.name ?? 'desconocido'}
      </p>
    </Link>
  )
}
