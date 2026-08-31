import { IconoHechizo, IconoItem } from '@/components/builds/Icono'
import type { Encantamiento } from '@/lib/domain/albion'
import type { RefHechizo, RefItem } from '@/lib/domain/builds'
import { cn } from '@/lib/utils/cn'

/**
 * Ficha de una pieza de equipo, con el lenguaje visual del juego.
 *
 * QUÉ NO DIBUJA, Y POR QUÉ
 *
 * La primera versión de este componente pintaba encima del icono el tier en
 * números romanos y los rombos del encantamiento. Al mirar el PNG que devuelve
 * el servicio de render resultó que ya vienen dibujados en el arte:
 *
 *     /v1/item/T8_MAIN_SWORD.png     -> marco con "VIII" arriba a la izquierda
 *     /v1/item/T8_MAIN_SWORD@3.png   -> además tres rombos violetas abajo y el
 *                                       borde con el brillo del encantamiento
 *
 * O sea que las insignias no agregaban información: la duplicaban, y encima
 * caían justo arriba de la del juego. Se sacaron las dos. Pedir la imagen con
 * el encantamiento en el identificador ya trae todo.
 *
 * Queda entonces el arte tal cual, con las habilidades colgando abajo. El
 * tamaño se pasa desde afuera y es la misma ficha escalada, así las dos vistas
 * del listado y el detalle de la build no se van separando con el tiempo.
 */
export function FichaItem({
  item,
  habilidades = [],
  tamano = 'md',
  vacia,
  className,
}: {
  item: RefItem | null
  habilidades?: RefHechizo[]
  tamano?: 'sm' | 'md' | 'lg'
  /** Qué decir cuando el slot está vacío. */
  vacia?: string
  className?: string
}) {
  /*
    `tira` reserva el alto de las habilidades aunque sean menos.

    Sin eso, una pieza con cuatro habilidades queda más alta que una con dos y
    las baldosas de la fila de abajo salen escalonadas, que es lo contrario de
    lo que hace legible una grilla de equipamiento. Se reservan dos renglones
    porque cuatro es el máximo (Q, W, E y la pasiva) y de a cuatro por línea no
    entran bajo una baldosa de 80 px.
  */
  const medidas = {
    sm: { caja: 'size-14', hechizo: 'size-5', tira: '' },
    md: { caja: 'size-20', hechizo: 'size-7', tira: 'min-h-[3.875rem]' },
    lg: { caja: 'size-28', hechizo: 'size-9', tira: '' },
  }[tamano]

  if (!item) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl border border-dashed border-borde bg-fondo/60 px-1 text-center text-[10px] uppercase leading-tight tracking-wide text-texto-tenue',
          medidas.caja,
          className,
        )}
      >
        {vacia ?? 'Vacío'}
      </div>
    )
  }

  /*
    El envoltorio centra la baldosa sobre la tira de habilidades.

    Con cuatro habilidades —Q, W, E y la pasiva— la tira mide más que los 80 px
    de la baldosa, así que el envoltorio crece con ella. Siendo un bloque, la
    baldosa quedaba pegada al borde izquierdo y parecía corrida respecto de sus
    vecinas: es lo que se ve en el arma primaria, que es la única pieza con las
    cuatro. Centrando la columna, la baldosa queda sobre el eje de la tira sin
    importar cuántas habilidades haya.
  */
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <IconoItem
        id={item.id}
        nombre={item.name}
        encantamiento={(item.ench ?? 0) as Encantamiento}
        tamano={tamano === 'sm' ? 'mini' : 'chico'}
        className={cn(
          'rounded-xl border border-borde bg-superficie-alta object-contain',
          medidas.caja,
        )}
      />

      {habilidades.length > 0 && (
        <div
          className={cn(
            'mt-1.5 flex flex-wrap content-start justify-center gap-1',
            medidas.tira,
          )}
        >
          {habilidades.map((h) => (
            <IconoHechizo
              key={h.id}
              id={h.id}
              nombre={h.name}
              className={cn(
                'rounded-full border border-borde bg-superficie object-cover',
                medidas.hechizo,
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
