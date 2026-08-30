'use client'

import { useMemo, useState } from 'react'

import { Card, CardTitulo } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'

type Evento = { fecha: string; miembro: string }

type Barra = { etiqueta: string; valor: number; miembros: string[] }

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function GraficoActividad({ eventos }: { eventos: Evento[] }) {
  const [detalle, setDetalle] = useState<{ titulo: string; miembros: string[] } | null>(
    null,
  )

  const { porDia, porHora } = useMemo(() => {
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

    const miembrosPorDia = DIAS_CORTOS.map(() => new Set<string>())
    const miembrosPorHora = Array.from({ length: 24 }, () => new Set<string>())

    for (const evento of eventos) {
      const d = new Date(evento.fecha)
      if (Number.isNaN(d.getTime())) continue

      const indiceDia = d.getDay()
      const indiceHora = d.getHours()

      dia[indiceDia]!.valor++
      miembrosPorDia[indiceDia]!.add(evento.miembro)

      hora[indiceHora]!.valor++
      miembrosPorHora[indiceHora]!.add(evento.miembro)
    }

    dia.forEach((b, i) => {
      b.miembros = [...miembrosPorDia[i]!].sort()
    })
    hora.forEach((b, i) => {
      b.miembros = [...miembrosPorHora[i]!].sort()
    })

    return { porDia: dia, porHora: hora }
  }, [eventos])

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
                  // min-height para que un día con 0 conexiones siga siendo
                  // una zona clicable y no una barra invisible.
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
              // Intensidad en cinco pasos: el original armaba clases de Tailwind
              // concatenando strings (`bg-teal-500/${n}`), que el compilador no
              // puede detectar, así que esos colores nunca se generaban.
              const intensidad =
                barra.valor === 0
                  ? 0
                  : Math.ceil((barra.valor / maxHora) * 4)

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
                    intensidad === 3 && 'bg-acento/70 text-white',
                    intensidad === 4 && 'bg-acento text-white',
                  )}
                >
                  <span className="opacity-70">{barra.etiqueta}h</span>
                  <span className="font-semibold tabular-nums">{barra.valor}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-texto-tenue">
            Horas en tu zona horaria local.
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
