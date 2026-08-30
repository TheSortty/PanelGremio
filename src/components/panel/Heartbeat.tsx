'use client'

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
  useEffect(() => {
    const supabase = createClient()

    let cancelado = false
    const latir = () => {
      if (!cancelado) void supabase.rpc('registrar_actividad')
    }

    latir()
    // Cada 2 minutos: la vista guild_members considera "en línea" a quien
    // aparece dentro de los últimos 5, así que hay margen de sobra.
    const intervalo = setInterval(latir, 2 * 60 * 1000)

    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [])

  return null
}
