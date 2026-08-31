'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { FichaItem } from '@/components/builds/FichaItem'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { cn } from '@/lib/utils/cn'
import {
  NOMBRES_SLOT,
  SLOTS_EQUIPO,
  claveHabilidad,
  type Build,
  type RefHechizo,
  type SlotEquipo,
  type SpellSlot,
} from '@/lib/domain/builds'

/** Lo que la página calcula por build antes de mandarlo al cliente. */
export type BuildEnLista = {
  build: Build
  poderPromedio: number | null
}

type Vista = 'fila' | 'cuadricula'

const CLAVE_VISTA = 'panelgremio:vista-builds'
const ORDEN_SLOTS: SpellSlot[] = ['Q', 'W', 'E', 'Passive']

function habilidadesDe(build: Build, slot: SlotEquipo): RefHechizo[] {
  return ORDEN_SLOTS.map((s) => build.abilities[claveHabilidad(slot, s)]).filter(
    (h): h is RefHechizo => Boolean(h),
  )
}

/**
 * Insignia de poder de ítem.
 *
 * Es el número que define si una build sirve para el contenido al que se va,
 * así que va primero y grande. En el juego se muestra con una flecha hacia
 * arriba; se conserva ese signo porque es lo que un jugador busca con la vista.
 */
function Poder({ valor }: { valor: number | null }) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-lg border border-exito/35 bg-exito-fondo/30 px-2.5 py-1.5">
      <span className="text-sm leading-none text-exito">↑</span>
      <span className="font-titulo text-xl font-bold leading-none tabular-nums text-exito">
        {valor ?? '—'}
      </span>
    </div>
  )
}

/**
 * Vista de fila: una build por renglón.
 *
 * Sirve para recorrer muchas builds buscando una. El arma va más grande que el
 * resto porque es lo que da nombre a la build —nadie dice "la build de botas de
 * cuero"—, y el resto del equipo va detrás, en el orden en que se equipa.
 */
function FilaBuild({ entrada }: { entrada: BuildEnLista }) {
  const { build, poderPromedio } = entrada
  const arma = build.equipment.weapon
  const resto = SLOTS_EQUIPO.filter((s) => s !== 'weapon')

  return (
    <Link
      href={`/builds/${build.id}`}
      className="losa flex items-center gap-4 px-4 py-3 transition-colors hover:border-acento"
    >
      <Poder valor={poderPromedio} />

      <FichaItem item={arma} tamano="md" vacia="Sin arma" className="shrink-0" />

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold leading-snug">
          {build.title}
        </h2>
        <p className="mt-0.5 truncate text-xs text-texto-tenue">
          por {build.author?.name ?? 'desconocido'}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {resto.map((slot) => {
            const item = build.equipment[slot]
            return (
              <FichaItem
                key={slot}
                item={item}
                tamano="sm"
                vacia={NOMBRES_SLOT[slot]}
              />
            )
          })}
        </div>
      </div>

      <Etiqueta tono="acento" className="shrink-0 self-start">
        {build.category}
      </Etiqueta>
    </Link>
  )
}

/**
 * Vista de cuadrícula: el equipamiento completo de cada build.
 *
 * Es para comparar composiciones, no para buscar por nombre: se ve todo el
 * conjunto con sus habilidades, como la pantalla de equipo del juego.
 */
function TarjetaBuild({ entrada }: { entrada: BuildEnLista }) {
  const { build, poderPromedio } = entrada

  return (
    <Link
      href={`/builds/${build.id}`}
      className="losa block p-5 transition-colors hover:border-acento"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold leading-snug">
            {build.title}
          </h2>
          <p className="mt-0.5 truncate text-xs text-texto-tenue">
            por {build.author?.name ?? 'desconocido'}
          </p>
        </div>
        <Etiqueta tono="acento" className="shrink-0">
          {build.category}
        </Etiqueta>
      </div>

      <div className="mt-4 grid grid-cols-3 justify-items-center gap-3">
        {SLOTS_EQUIPO.map((slot) => {
          const item = build.equipment[slot]
          return (
            <FichaItem
              key={slot}
              item={item}
              habilidades={habilidadesDe(build, slot)}
              tamano="md"
              vacia={NOMBRES_SLOT[slot]}
            />
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-borde-suave pt-3">
        <span className="grabado">Poder de ítem</span>
        <Poder valor={poderPromedio} />
      </div>
    </Link>
  )
}

export function ListaBuilds({ entradas }: { entradas: BuildEnLista[] }) {
  /*
    Arranca siempre en 'fila' y recién después de montar se lee la preferencia
    guardada. Si se leyera durante el render, el HTML del servidor y el del
    cliente no coincidirían y React descartaría el árbol entero.
  */
  const [vista, setVista] = useState<Vista>('fila')

  useEffect(() => {
    try {
      const guardada = localStorage.getItem(CLAVE_VISTA)
      if (guardada === 'fila' || guardada === 'cuadricula') setVista(guardada)
    } catch {
      // Navegador con el almacenamiento bloqueado: se queda con la vista por
      // defecto, que es exactamente lo que corresponde.
    }
  }, [])

  function cambiar(nueva: Vista) {
    setVista(nueva)
    try {
      localStorage.setItem(CLAVE_VISTA, nueva)
    } catch {
      // Que no se pueda recordar la preferencia no impide cambiarla ahora.
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-1 self-start rounded-lg border border-borde bg-superficie-alta p-1"
        role="radiogroup"
        aria-label="Cómo mostrar las builds"
        style={{ width: 'fit-content' }}
      >
        {(
          [
            { valor: 'fila', etiqueta: 'Lista', icono: IconoFilas },
            { valor: 'cuadricula', etiqueta: 'Equipamiento', icono: IconoCuadros },
          ] as const
        ).map(({ valor, etiqueta, icono: Icono }) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={vista === valor}
            onClick={() => cambiar(valor)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              vista === valor
                ? 'bg-acento text-sobre-acento'
                : 'text-texto-tenue hover:text-texto',
            )}
          >
            <Icono />
            {etiqueta}
          </button>
        ))}
      </div>

      {vista === 'fila' ? (
        <div className="space-y-2.5">
          {entradas.map((e) => (
            <FilaBuild key={e.build.id} entrada={e} />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {entradas.map((e) => (
            <TarjetaBuild key={e.build.id} entrada={e} />
          ))}
        </div>
      )}
    </div>
  )
}

function IconoFilas() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function IconoCuadros() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}
