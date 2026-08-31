'use client'

import type { Encantamiento } from '@/lib/domain/albion'
import { cn } from '@/lib/utils/cn'

const NIVELES: Encantamiento[] = [0, 1, 2, 3]

/**
 * Nivel de encantamiento de una pieza.
 *
 * En Albion el encantamiento sube el poder del ítem (T4: 700 -> 800 -> 900 ->
 * 1000) y cambia el icono, así que afecta tanto al cálculo como a la imagen.
 * La versión anterior no lo contemplaba en ningún lado: todas las builds
 * quedaban implícitamente sin encantar.
 *
 * Solo se muestran los niveles que el ítem realmente declara en el dump.
 */
export function SelectorEncantamiento({
  valor,
  disponibles,
  onCambiar,
}: {
  valor: Encantamiento
  disponibles: Record<string, number>
  onCambiar: (nivel: Encantamiento) => void
}) {
  const niveles = NIVELES.filter(
    (n) => n === 0 || disponibles[String(n)] !== undefined,
  )

  // Sin encantamientos declarados no hay nada que elegir.
  if (niveles.length <= 1) return null

  return (
    <div className="mt-1.5 flex items-center gap-1">
      <span className="mr-0.5 text-xs text-texto-tenue">Encant.</span>
      {niveles.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onCambiar(n)}
          aria-pressed={valor === n}
          title={
            n === 0
              ? 'Sin encantar'
              : `Encantamiento ${n} — poder ${disponibles[String(n)]}`
          }
          className={cn(
            'rounded px-1.5 py-0.5 text-xs font-medium transition-colors',
            valor === n
              ? 'bg-acento text-sobre-acento'
              : 'bg-superficie-alta text-texto-tenue hover:text-texto',
          )}
        >
          {n === 0 ? '—' : `.${n}`}
        </button>
      ))}
    </div>
  )
}
