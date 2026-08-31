'use client'

import { useEffect } from 'react'

/**
 * Registra el service worker que guarda los iconos (public/sw.js).
 *
 * Va en el layout del panel y no en el raíz: en /login no hay un solo icono de
 * Albion, así que registrarlo ahí sería pedir un permiso del navegador sin
 * ningún motivo.
 *
 * Todo lo que puede salir mal acá es opcional. Un navegador en modo privado, o
 * uno donde el service worker esté deshabilitado, simplemente no lo registra:
 * los iconos siguen funcionando con la caché HTTP normal, que ya los guarda un
 * año. Por eso no hay ni mensaje de error ni reintento.
 */
export function CacheDeIconos() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Después del load: durante el arranque compite por ancho de banda con la
    // página misma.
    const registrar = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Sin service worker el panel anda igual.
      })
    }

    if (document.readyState === 'complete') registrar()
    else {
      window.addEventListener('load', registrar)
      return () => window.removeEventListener('load', registrar)
    }
  }, [])

  return null
}
