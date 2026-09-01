'use client'

import { useState, useTransition } from 'react'

import { crearEvento } from '@/actions/eventos'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card, CardTitulo } from '@/components/ui/Card'
import { TIPOS_EVENTO, type TipoEvento } from '@/lib/domain/eventos'

/**
 * Alta de evento.
 *
 * LA HORA
 *
 * El campo es un `datetime-local`, que trabaja en la hora del navegador y no
 * lleva zona. Eso es lo correcto acá: quien convoca piensa "el sábado a las
 * nueve", en SU hora, no en UTC. La conversión la hace la Server Action al
 * guardar, y cada quien lo ve después en la suya.
 *
 * El valor inicial es dentro de dos horas, redondeado: casi ningún evento se
 * convoca para dentro de un minuto, y arrancar en blanco obliga a escribir la
 * fecha entera a mano.
 */
function dentroDeDosHoras() {
  const d = new Date(Date.now() + 2 * 3600_000)
  d.setMinutes(0, 0, 0)
  // El input quiere exactamente YYYY-MM-DDTHH:mm en hora local.
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function FormularioEvento() {
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoEvento>('ZvZ')
  const [comienzaEn, setComienzaEn] = useState(dentroDeDosHoras)
  const [lugar, setLugar] = useState('')
  const [ipMinimo, setIpMinimo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, iniciar] = useTransition()

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    iniciar(async () => {
      const r = await crearEvento({
        titulo,
        tipo,
        descripcion,
        comienza_en: comienzaEn,
        lugar,
        ip_minimo: ipMinimo === '' ? undefined : ipMinimo,
      })
      // Si sale bien redirige al detalle y esto no se ejecuta.
      if (r && !r.ok) setError(r.error)
    })
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <Card>
        <CardTitulo>El evento</CardTitulo>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-texto-suave">Título</span>
            <input
              className="campo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={140}
              placeholder="ZvZ contra la alianza del norte"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">Tipo</span>
            <select
              className="campo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoEvento)}
            >
              {TIPOS_EVENTO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">
              Cuándo empieza
            </span>
            <input
              type="datetime-local"
              className="campo"
              value={comienzaEn}
              onChange={(e) => setComienzaEn(e.target.value)}
              required
            />
            <span className="mt-1 block text-xs text-texto-tenue">
              En tu hora. Cada uno lo va a ver en la suya.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">
              Punto de reunión{' '}
              <span className="text-texto-tenue">(opcional)</span>
            </span>
            <input
              className="campo"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              maxLength={120}
              placeholder="Banco de Martlock"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">
              IP mínimo <span className="text-texto-tenue">(opcional)</span>
            </span>
            <input
              type="number"
              className="campo"
              value={ipMinimo}
              onChange={(e) => setIpMinimo(e.target.value)}
              min={0}
              max={2000}
              placeholder="1100"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-texto-suave">
              Detalles <span className="text-texto-tenue">(opcional)</span>
            </span>
            <textarea
              className="campo min-h-28 resize-y"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={4000}
              placeholder="Qué builds hacen falta, qué llevar, dónde es el punto de encuentro…"
            />
          </label>
        </div>
      </Card>

      {error && <Aviso tono="error">{error}</Aviso>}

      <div className="flex justify-end">
        <Boton type="submit" disabled={guardando || titulo.trim().length < 3}>
          {guardando ? 'Creando…' : 'Crear evento'}
        </Boton>
      </div>
    </form>
  )
}
