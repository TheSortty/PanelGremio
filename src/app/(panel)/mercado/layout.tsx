import { PestanasMercado } from '@/components/mercado/PestanasMercado'
import { Aviso } from '@/components/ui/Aviso'
import { exigirMiembroActivo } from '@/lib/auth/sesion'

export default async function MercadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await exigirMiembroActivo()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Mercado</h1>
        <p className="mt-0.5 text-sm text-texto-tenue">
          Qué deja plata hoy: reventa al Black Market, crafteo y pesca.
        </p>
      </div>

      <PestanasMercado />

      {/*
        El aviso va en el marco y no en cada pantalla porque vale para las tres,
        y porque es lo único que separa una calculadora útil de una que hace
        perder plata: los precios no son del juego, son de jugadores que
        pasearon por el mercado con un cliente que los sube.
      */}
      <Aviso tono="info">
        Los precios los aporta la comunidad (Albion Online Data Project), así que
        pueden estar incompletos o viejos. Cada fila muestra la antigüedad del
        peor de sus datos. Nada de esto conoce cuántas unidades acepta una orden.
      </Aviso>

      {children}
    </div>
  )
}
