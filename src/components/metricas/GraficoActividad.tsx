'use client'

import { useEffect, useMemo, useState } from 'react'

import { Aviso } from '@/components/ui/Aviso'
import { Card, CardTitulo } from '@/components/ui/Card'
import { CargandoPagina } from '@/components/ui/Cargando'
import { Modal } from '@/components/ui/Modal'
import { Vacio } from '@/components/ui/Vacio'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

type Celda = {
  dia: number
  hora: number
  conexiones: number
  miembros: string[]
}

type Barra = { etiqueta: string; valor: number; miembros: string[] }

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function GraficoActividad() {
  const [celdas, setCeldas] = useState<Celda[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<{ titulo: string; miembros: string[] } | null>(
    null,
  )

  // La zona horaria del navegador se resuelve en el cliente y se manda a la
  // base, que agrupa directamente en hora local. Antes la interfaz decía "UTC"
  // en un gráfico mientras el otro usaba getHours(), que es hora local: los dos
  // rótulos no podían ser ciertos a la vez.
  const zona = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    [],
  )

  useEffect(() => {
    let cancelado = false

    ;(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('metricas_actividad', { zona })

      if (cancelado) return
      if (error) setError(error.message)
      else
        setCeldas(
          (data ?? []).map((c) => ({
            dia: Number(c.dia),
            hora: Number(c.hora),
            conexiones: Number(c.conexiones),
            miembros: c.miembros ?? [],
          })),
        )
    })()

    return () => {
      cancelado = true
    }
  }, [zona])

  const { porDia, porHora, total } = useMemo(() => {
    const dia: Barra[] = DIAS_CORTOS.map((etiqueta) => ({
      etiqueta,
      valor: 0,
      miembros: [],
    }))
    const hora: Barra[] = Array.from({ length: 24 }, (_, i) => ({
      etiqueta: String(i).padStart(2, '0'),
      valor: 0,
      miembros: [],
    }))

    const nombresDia = DIAS_CORTOS.map(() => new Set<string>())
    const nombresHora = Array.from({ length: 24 }, () => new Set<string>())
    let suma = 0

    for (const celda of celdas ?? []) {
      const d = dia[celda.dia]
      const h = hora[celda.hora]
      if (!d || !h) continue

      d.valor += celda.conexiones
      h.valor += celda.conexiones
      suma += celda.conexiones

      for (const nombre of celda.miembros) {
        nombresDia[celda.dia]!.add(nombre)
        nombresHora[celda.hora]!.add(nombre)
      }
    }

    dia.forEach((b, i) => {
      b.miembros = [...nombresDia[i]!].sort()
    })
    hora.forEach((b, i) => {
      b.miembros = [...nombresHora[i]!].sort()
    })

    return { porDia: dia, porHora: hora, total: suma }
  }, [celdas])

  if (error) {
    return <Aviso tono="error">No pudimos cargar las métricas: {error}</Aviso>
  }

  if (celdas === null) {
    return <CargandoPagina mensaje="Calculando actividad…" />
  }

  if (total === 0) {
    return (
      <Vacio
        titulo="Todavía no hay datos de actividad"
        descripcion="Se registra una conexión por miembro y por hora. Los gráficos se llenan a medida que la gente entra al panel."
      />
    )
  }

  const maxDia = Math.max(...porDia.map((d) => d.valor), 1)
  const maxHora = Math.max(...porHora.map((h) => h.valor), 1)

  return (
    <>
      <div className="space-y-5">
        <Card>
          <CardTitulo>Actividad por día de la semana</CardTitulo>
          <div className="flex h-56 items-end gap-2">
            {porDia.map((barra, i) => (
              <button
                key={barra.etiqueta}
                type="button"
                onClick={() =>
                  setDetalle({
                    titulo: `Activos el ${DIAS[i]}`,
                    miembros: barra.miembros,
                  })
                }
                className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span className="text-xs font-semibold tabular-nums">
                  {barra.valor}
                </span>
                <div
                  className="w-full rounded-t bg-acento transition-colors group-hover:bg-acento-fuerte"
                  // min-height para que un día sin conexiones siga siendo
                  // clicable y no una barra invisible.
                  style={{
                    height: `${Math.max((barra.valor / maxDia) * 100, 2)}%`,
                  }}
                />
                <span className="text-xs text-texto-tenue">{barra.etiqueta}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitulo>Actividad por hora del día</CardTitulo>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {porHora.map((barra) => {
              // Intensidad en cinco pasos con clases completas. El original
              // las concatenaba (`bg-teal-500/${n}`), y Tailwind no puede
              // detectar clases armadas en tiempo de ejecución: esos colores
              // nunca llegaban al CSS.
              const intensidad =
                barra.valor === 0 ? 0 : Math.ceil((barra.valor / maxHora) * 4)

              return (
                <button
                  key={barra.etiqueta}
                  type="button"
                  onClick={() =>
                    setDetalle({
                      titulo: `Activos a las ${barra.etiqueta}:00`,
                      miembros: barra.miembros,
                    })
                  }
                  title={`${barra.etiqueta}:00 — ${barra.valor} conexiones`}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center rounded-md text-xs transition-transform hover:scale-105',
                    intensidad === 0 && 'bg-superficie-alta text-texto-tenue',
                    intensidad === 1 && 'bg-acento/25 text-texto-suave',
                    intensidad === 2 && 'bg-acento/45 text-texto',
                    intensidad === 3 && 'bg-acento/70 text-sobre-acento',
                    intensidad === 4 && 'bg-acento text-sobre-acento',
                  )}
                >
                  <span className="opacity-70">{barra.etiqueta}h</span>
                  <span className="font-semibold tabular-nums">{barra.valor}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-texto-tenue">
            Horas en tu zona horaria ({zona}).
          </p>
        </Card>
      </div>

      <Modal
        abierto={detalle !== null}
        onCerrar={() => setDetalle(null)}
        titulo={detalle?.titulo ?? ''}
      >
        {detalle && detalle.miembros.length > 0 ? (
          <ul className="space-y-1.5">
            {detalle.miembros.map((miembro) => (
              <li
                key={miembro}
                className="rounded-md bg-superficie-alta px-3 py-1.5 text-sm"
              >
                {miembro}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-texto-tenue">
            No hubo conexiones registradas en este período.
          </p>
        )}
      </Modal>
    </>
  )
}
