'use client'

import { cn } from '@/lib/utils/cn'
import {
  ETIQUETAS_SPELL_SLOT,
  type RefHechizo,
  type SlotEquipo,
  type SpellSlot,
} from '@/lib/domain/builds'

/**
 * Elige una habilidad dentro de un slot.
 *
 * En las armas los slots activos son tres (Q, W, E). En las piezas de armadura
 * hay uno solo, así que rotularlo "Q" confundiría: ahí se muestra "Activa".
 */
function etiquetaDeSlot(slot: SlotEquipo, spellSlot: SpellSlot): string {
  if (spellSlot === 'Passive') return 'Pasiva'
  if (slot === 'weapon') return ETIQUETAS_SPELL_SLOT[spellSlot]
  return 'Activa'
}

export function SelectorHechizo({
  slot,
  spellSlot,
  hechizos,
  seleccionado,
  onSeleccionar,
}: {
  slot: SlotEquipo
  spellSlot: SpellSlot
  hechizos: RefHechizo[]
  seleccionado: RefHechizo | null
  onSeleccionar: (hechizo: RefHechizo | null) => void
}) {
  if (hechizos.length === 0) return null

  return (
    <div className="mt-2">
      <p className="mb-1 text-xs font-medium text-texto-tenue">
        {etiquetaDeSlot(slot, spellSlot)}
      </p>
      <div className="flex flex-wrap gap-1.5" role="group">
        {hechizos.map((hechizo) => {
          const activo = seleccionado?.id === hechizo.id

          return (
            <button
              key={hechizo.id}
              type="button"
              // Volver a tocar la habilidad elegida la deselecciona.
              onClick={() => onSeleccionar(activo ? null : hechizo)}
              title={hechizo.name}
              aria-label={hechizo.name}
              aria-pressed={activo}
              className={cn(
                'size-10 overflow-hidden rounded-lg border-2 transition-all',
                activo
                  ? 'border-acento ring-2 ring-acento/30'
                  : 'border-borde opacity-70 hover:border-acento hover:opacity-100',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hechizo.icon_url}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
