'use client'

import { useState, useTransition } from 'react'

import { buscarGremioEnAlbion, guardarAjustes } from '@/actions/ajustes'
import { Aviso } from '@/components/ui/Aviso'
import { Boton } from '@/components/ui/Boton'
import { Card, CardTitulo } from '@/components/ui/Card'
import { IconoLupa } from '@/components/ui/Iconos'
import {
  REGIONES,
  type GremioEncontrado,
  type Region,
} from '@/lib/albion/regiones'
import { cn } from '@/lib/utils/cn'

/**
 * Elegir el gremio de Albion.
 *
 * Se busca y se elige de una lista, no se escribe el nombre a mano. Dos
 * motivos: lo que hace falta guardar es el id —un gremio puede renombrarse y el
 * id no cambia—, y hay gremios con nombres parecidos, así que elegir por el
 * usuario el que más se parece es la forma de terminar mostrando el killboard
 * de otra gente.
 */
export function FormularioAjustes({
  guildId,
  guildName,
  region: regionInicial,
}: {
  guildId: string | null
  guildName: string | null
  region: Region
}) {
  const [region, setRegion] = useState<Region>(regionInicial)
  const [termino, setTermino] = useState(guildName ?? '')
  const [resultados, setResultados] = useState<GremioEncontrado[] | null>(null)
  const [elegido, setElegido] = useState<{ id: string; nombre: string } | null>(
    guildId && guildName ? { id: guildId, nombre: guildName } : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [trabajando, iniciar] = useTransition()

  function buscar() {
    setError(null)
    setAviso(null)
    iniciar(async () => {
      const r = await buscarGremioEnAlbion(termino, region)
      setResultados(r)
      if (r.length === 0) {
        setError(
          `No aparece ningún gremio con ese nombre en ${REGIONES[region].etiqueta}. Revisá el nombre exacto y la región: son tres mundos separados.`,
        )
      }
    })
  }

  function guardar() {
    if (!elegido) return
    setError(null)
    setAviso(null)

    iniciar(async () => {
      const r = await guardarAjustes({
        albion_guild_id: elegido.id,
        albion_guild_name: elegido.nombre,
        region,
      })
      if (r.ok) setAviso('Guardado. El killboard ya apunta a este gremio.')
      else setError(r.error)
    })
  }

  return (
    <Card>
      <CardTitulo>Gremio en Albion</CardTitulo>
      <p className="mb-4 text-sm text-texto-tenue">
        El killboard sale de la API oficial del juego. Hay que decirle a qué
        gremio mirar, y en qué región: cada una es un mundo aparte y el mismo
        nombre puede existir en las tres.
      </p>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-sm text-texto-suave">Región</span>
          <select
            className="campo"
            value={region}
            onChange={(e) => {
              setRegion(e.target.value as Region)
              setResultados(null)
            }}
          >
            {Object.entries(REGIONES).map(([valor, { etiqueta }]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-texto-suave">
            Nombre del gremio
          </span>
          <input
            className="campo"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                buscar()
              }
            }}
            placeholder="Como figura en el juego"
          />
        </label>

        <Boton
          variante="secundario"
          onClick={buscar}
          disabled={trabajando || termino.trim().length < 2}
        >
          <IconoLupa className="text-sm" />
          Buscar
        </Boton>
      </div>

      {resultados && resultados.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {resultados.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => setElegido({ id: g.id, nombre: g.nombre })}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                  elegido?.id === g.id
                    ? 'border-acento bg-acento-suave/25'
                    : 'border-borde bg-fondo hover:border-acento/50',
                )}
              >
                <span className="font-medium">{g.nombre}</span>
                <span className="text-xs text-texto-tenue">
                  {g.alianza ? `alianza ${g.alianza}` : 'sin alianza'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {elegido && (
        <p className="mt-4 text-sm text-texto-suave">
          Elegido: <span className="font-medium text-texto">{elegido.nombre}</span>{' '}
          en {REGIONES[region].etiqueta}
        </p>
      )}

      {error && (
        <Aviso tono="error" className="mt-4">
          {error}
        </Aviso>
      )}
      {aviso && (
        <Aviso tono="exito" className="mt-4">
          {aviso}
        </Aviso>
      )}

      <div className="mt-5">
        <Boton onClick={guardar} disabled={trabajando || !elegido}>
          {trabajando ? 'Guardando…' : 'Guardar'}
        </Boton>
      </div>
    </Card>
  )
}
