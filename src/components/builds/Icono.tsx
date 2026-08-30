'use client'

import { useState } from 'react'

import {
  urlIconoHechizo,
  urlIconoItem,
  type Encantamiento,
  type TamanoIcono,
} from '@/lib/domain/albion'
import { cn } from '@/lib/utils/cn'

/**
 * Icono con reemplazo cuando la imagen no carga.
 *
 * render.albiononline.com es inestable: midiendo 96 iconos de ítems reales,
 * ~94 % responden y el resto devuelve 502. No es que falte el arte —un mismo
 * ítem puede dar 502 y al reintentar 200—, es el servicio que falla de forma
 * intermitente.
 *
 * Sin esto el navegador dibuja el icono de imagen rota, que en una grilla de
 * equipamiento se lee como "esta build está mal cargada". El reemplazo muestra
 * las iniciales del ítem, que al menos identifica la pieza.
 */
function IconoBase({
  src,
  nombre,
  className,
  tamanoTexto = 'text-[10px]',
}: {
  src: string
  nombre: string
  className?: string
  tamanoTexto?: string
}) {
  const [fallo, setFallo] = useState(false)

  if (fallo) {
    return (
      <span
        title={nombre}
        aria-label={nombre}
        className={cn(
          'flex items-center justify-center overflow-hidden bg-superficie-alta px-0.5 text-center font-medium uppercase leading-none text-texto-tenue',
          tamanoTexto,
          className,
        )}
      >
        {nombre.slice(0, 3)}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={nombre}
      title={nombre}
      className={className}
      loading="lazy"
      onError={() => setFallo(true)}
    />
  )
}

export function IconoItem({
  id,
  nombre,
  encantamiento = 0,
  tamano = 'chico',
  className,
}: {
  id: string
  nombre: string
  encantamiento?: Encantamiento
  tamano?: TamanoIcono
  className?: string
}) {
  return (
    <IconoBase
      src={urlIconoItem(id, { encantamiento, tamano })}
      nombre={nombre}
      className={className}
    />
  )
}

export function IconoHechizo({
  id,
  nombre,
  tamano = 'mini',
  className,
}: {
  id: string
  nombre: string
  tamano?: TamanoIcono
  className?: string
}) {
  return (
    <IconoBase
      src={urlIconoHechizo(id, { tamano })}
      nombre={nombre}
      className={className}
      tamanoTexto="text-[8px]"
    />
  )
}
