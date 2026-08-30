import { statsVisibles, type Stats } from '@/lib/domain/albion'

/**
 * Stats declaradas de un ítem.
 *
 * Se muestran atribuidas a su pieza y nunca sumadas entre sí: el dump declara
 * armadura y resistencias en el pecho, pero deja en cero las de casco y botas,
 * porque el escalado real sale de fórmulas que no incluye. Un total sería un
 * número preciso y equivocado.
 */
export function ListaStats({ stats }: { stats: Stats | null | undefined }) {
  const visibles = statsVisibles(stats)
  if (visibles.length === 0) return null

  return (
    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
      {visibles.map(({ clave, etiqueta, valor }) => (
        <div key={clave} className="flex justify-between gap-2">
          <dt className="truncate text-texto-tenue">{etiqueta}</dt>
          <dd className="shrink-0 font-medium tabular-nums">{valor}</dd>
        </div>
      ))}
    </dl>
  )
}
