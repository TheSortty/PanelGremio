import { statsVisibles, type Stats } from '@/lib/domain/albion'

/**
 * Stats declaradas de un ítem.
 *
 * Se muestran atribuidas a su pieza y nunca sumadas entre sí: el dump declara
 * armadura y resistencias en el pecho, pero deja en cero las de casco y botas,
 * porque el escalado real sale de fórmulas que no incluye. Un total sería un
 * número preciso y equivocado.
 *
 * Va en una sola columna. Con dos, y el cuerpo de texto más grande, cada celda
 * quedaba con unos ochenta píxeles útiles y las etiquetas se cortaban en
 * "Bono d…" y "Resistenci…" — que aparecen varias veces cada una, así que la
 * lista terminaba siendo seis filas indistinguibles. Una columna entra completa
 * y se puede leer.
 */
export function ListaStats({ stats }: { stats: Stats | null | undefined }) {
  const visibles = statsVisibles(stats)
  if (visibles.length === 0) return null

  return (
    <dl className="mt-3 space-y-1 border-t border-borde-suave pt-2.5 text-xs">
      {visibles.map(({ clave, etiqueta, valor }) => (
        <div key={clave} className="flex items-baseline justify-between gap-3">
          <dt className="text-texto-tenue">{etiqueta}</dt>
          {/* La línea de puntos ata el nombre con su número cuando quedan
              lejos, como en un índice. */}
          <span
            aria-hidden="true"
            className="min-w-4 flex-1 translate-y-[-0.2em] border-b border-dotted border-borde"
          />
          <dd className="shrink-0 font-medium tabular-nums text-texto-suave">
            {valor}
          </dd>
        </div>
      ))}
    </dl>
  )
}
