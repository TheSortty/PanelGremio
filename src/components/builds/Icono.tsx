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
 * render.albiononline.com es inestable: el mismo identificador devuelve 502 y
 * al reintentar 200. No falta el arte, falla el servicio.
 *
 * El grueso del problema lo resuelve la ruta /icono, que reintenta del lado del
 * servidor antes de contestar. Acá queda un reintento más por si esa también se
 * queda sin intentos: se cambia la clave del <img> para forzar a que el
 * navegador vuelva a pedir la imagen en vez de reusar el fallo cacheado.
 *
 * Recién si el segundo intento también falla se muestra el reemplazo con las
 * iniciales. Sin esto el navegador dibuja el icono de imagen rota, que en una
 * grilla de equipamiento se lee como "esta build está mal cargada".
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
  const [intento, setIntento] = useState(0)
  const fallo = intento > 1

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
      // La clave cambia con el intento: React reemplaza el nodo y el navegador
      // vuelve a pedir la imagen en lugar de quedarse con el error anterior.
      key={intento}
      src={intento === 0 ? src : `${src}&r=${intento}`}
      alt={nombre}
      title={nombre}
      className={className}
      loading="lazy"
      onError={() => setIntento((n) => n + 1)}
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
