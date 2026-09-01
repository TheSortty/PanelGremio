import { Suspense } from 'react'

import { IconoItem } from '@/components/builds/Icono'
import { Controles, Interruptor, Selector } from '@/components/mercado/Controles'
import { Frescura } from '@/components/mercado/Frescura'
import { Card } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { IconoLupa } from '@/components/ui/Iconos'
import { Vacio } from '@/components/ui/Vacio'
import { exigirMiembroActivo } from '@/lib/auth/sesion'
import { CALIDADES, CIUDADES, SERVIDORES, type Calidad, type Servidor } from '@/lib/mercado/aodp'
import { plata, porcentaje } from '@/lib/mercado/economia'
import { buscarOportunidades } from '@/lib/mercado/flipper'
import type { Encantamiento } from '@/lib/domain/albion'

export const metadata = { title: 'Black Market' }

type Params = {
  servidor?: string
  calidad?: string
  premium?: string
  tier?: string
  ciudad?: string
}

function leerFiltros(p: Params) {
  const servidor = (
    p.servidor && p.servidor in SERVIDORES ? p.servidor : 'europe'
  ) as Servidor

  const calidadNum = Number(p.calidad)
  const calidad = (calidadNum >= 1 && calidadNum <= 5 ? calidadNum : 1) as Calidad

  const tierNum = Number(p.tier)
  const tier = tierNum >= 4 && tierNum <= 8 ? tierNum : 8

  const ciudad =
    p.ciudad && CIUDADES.some((c) => c.nombre === p.ciudad) ? p.ciudad : null

  return { servidor, calidad, premium: p.premium !== '0', tier, ciudad }
}

async function Tabla({ params }: { params: Params }) {
  const f = leerFiltros(params)

  const { oportunidades, consultadas, conDatos, lotes, fallidos } =
    await buscarOportunidades({ ...f, limite: 25 })

  if (oportunidades.length === 0) {
    return (
      <Vacio
        icono={IconoLupa}
        titulo="Ninguna operación deja ganancia"
        descripcion={`Se miraron ${consultadas} variantes de T${f.tier}; ${conDatos} tenían los dos precios. Probá otro tier, otra calidad u otro servidor.`}
      />
    )
  }

  return (
    <>
      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[52rem] text-sm">
          <thead>
            <tr className="border-b border-borde text-left">
              <th className="grabado pb-2 pr-4 text-left">Ítem</th>
              <th className="grabado pb-2 pr-4 text-left">Comprar en</th>
              <th className="grabado pb-2 pr-4 text-right">Costo</th>
              <th className="grabado pb-2 pr-4 text-right">Black Market</th>
              <th className="grabado pb-2 pr-4 text-right">Ganancia</th>
              <th className="grabado pb-2 pr-4 text-right">Margen</th>
              <th className="grabado pb-2 text-left">Dato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde-suave">
            {oportunidades.map((o) => (
              <tr key={o.itemId} className="transition-colors hover:bg-superficie-alta/40">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2.5">
                    <IconoItem
                      id={o.itemId.split('@')[0]!}
                      nombre={o.nombre}
                      encantamiento={o.encantamiento as Encantamiento}
                      tamano="mini"
                      className="size-10 shrink-0 rounded-lg border border-borde bg-superficie-alta"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{o.nombre}</p>
                      <p className="text-xs text-texto-tenue">
                        T{o.tier}
                        {o.encantamiento > 0 && ` · encantamiento ${o.encantamiento}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-2 pr-4 text-texto-suave">{o.ciudad}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-texto-suave">
                  {plata(o.precioCiudad)}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-texto-suave">
                  {plata(o.precioBlackMarket)}
                </td>
                <td className="py-2 pr-4 text-right font-semibold tabular-nums text-exito">
                  +{plata(o.operacion.ganancia)}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-exito">
                  {porcentaje(o.operacion.margen)}
                </td>
                <td className="py-2">
                  <Frescura tono={o.frescura} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-texto-tenue">
        {consultadas} variantes de T{f.tier} consultadas en {lotes} pedidos
        {fallidos > 0 && ` (${fallidos} fallaron)`}; {conDatos} tenían precio en
        ciudad y en el Black Market. Las ganancias ya descuentan el{' '}
        {f.premium ? '4' : '8'} % de impuesto por vender.
      </p>
    </>
  )
}

export default async function BlackMarket({
  searchParams,
}: {
  searchParams: Promise<Params>
}) {
  await exigirMiembroActivo()
  const params = await searchParams
  const f = leerFiltros(params)

  return (
    <div className="space-y-5">
      <Card>
        <Suspense fallback={null}>
          <Controles>
            <Selector
              nombre="servidor"
              etiqueta="Servidor"
              valor={f.servidor}
              opciones={Object.entries(SERVIDORES).map(([valor, etiqueta]) => ({
                valor,
                etiqueta,
              }))}
              ayuda="Cada servidor tiene su propio mercado."
            />
            <Selector
              nombre="tier"
              etiqueta="Tier"
              valor={String(f.tier)}
              opciones={[8, 7, 6, 5, 4].map((t) => ({
                valor: String(t),
                etiqueta: `T${t}`,
              }))}
              ayuda="Un tier por vez: son 1.348 variantes cada uno."
            />
            <Selector
              nombre="ciudad"
              etiqueta="Comprar en"
              valor={f.ciudad ?? ''}
              opciones={[
                { valor: '', etiqueta: 'La más barata' },
                ...CIUDADES.map((c) => ({ valor: c.nombre, etiqueta: c.nombre })),
              ]}
            />
            <Selector
              nombre="calidad"
              etiqueta="Calidad"
              valor={String(f.calidad)}
              opciones={Object.entries(CALIDADES).map(([valor, etiqueta]) => ({
                valor,
                etiqueta,
              }))}
            />
          </Controles>

          <div className="mt-4 max-w-56">
            <Interruptor
              nombre="premium"
              etiqueta="Cuenta con premium"
              activo={f.premium}
              ayuda={`Impuesto de venta: ${f.premium ? '4' : '8'} %.`}
            />
          </div>
        </Suspense>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Comprar en ciudad, vender en el Black Market
          </h2>
          <Etiqueta tono="acento">{CALIDADES[f.calidad]}</Etiqueta>
        </div>

        <Suspense
          key={JSON.stringify(f)}
          fallback={
            <p className="py-12 text-center text-sm text-texto-tenue">
              Consultando precios…
            </p>
          }
        >
          <Tabla params={params} />
        </Suspense>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">Antes de salir a comprar</h2>
        <ul className="space-y-1.5 text-sm text-texto-suave">
          <li>
            <strong className="text-texto">La orden puede ser por una pieza.</strong>{' '}
            El Black Market no publica cuántas unidades acepta a ese precio, y la
            API tampoco. Un margen enorme puede alcanzar para una sola.
          </li>
          <li>
            <strong className="text-texto">El Black Market está en Caerleon</strong>,
            que es zona roja: se puede perder la carga en el camino.
          </li>
          <li>
            <strong className="text-texto">El precio puede haber cambiado.</strong>{' '}
            Mirá la columna de antigüedad antes de invertir en una fila.
          </li>
        </ul>
      </Card>
    </div>
  )
}
