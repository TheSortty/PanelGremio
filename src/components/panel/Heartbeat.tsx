'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'

/**
 * Marca al usuario como conectado.
 *
 * Llama a registrar_actividad(), que actualiza last_seen y —como mucho una vez
 * por hora— agrega una fila a activity_logs.
 *
 * Esto arregla dos cosas de la versión anterior a la vez:
 *   - `online` nunca se ponía en true, así que el panel siempre mostraba
 *     0 miembros en línea;
 *   - nadie escribía jamás en activity_logs, así que la página de Métricas
 *     analizaba una tabla vacía.
 */
export function Heartbeat() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    let cancelado = false
    // El primer latido ocurre después de que el servidor ya renderizó la
    // página, así que el panel se dibuja con el last_seen viejo y uno se ve a
    // sí mismo desconectado. Tras el primer latido se refresca una vez para
    // que el número quede bien; los siguientes no refrescan nada, porque
    // recargar cada dos minutos sería peor que el problema.
    let primero = true

    const latir = () => {
      if (cancelado) return

      void supabase.rpc('registrar_actividad').then(({ error }) => {
        if (cancelado || error) return
        if (primero) {
          primero = false
          router.refresh()
        }
      })
    }

    latir()
    // Cada 2 minutos: la vista guild_members considera "en línea" a quien
    // aparece dentro de los últimos 5, así que hay margen de sobra.
    const intervalo = setInterval(latir, 2 * 60 * 1000)

    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [router])

  return null
}
