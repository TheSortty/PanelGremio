import { Card, CardTitulo } from '@/components/ui/Card'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { IconoLlama, IconoYelmo } from '@/components/ui/Iconos'
import { Vacio } from '@/components/ui/Vacio'
import type { Database } from '@/lib/db/database.types'
import { tiempoRelativo } from '@/lib/utils/formato'

type Miembro = Database['public']['Views']['guild_members']['Row']

export function TablaMiembros({ miembros }: { miembros: Miembro[] }) {
  if (miembros.length === 0) {
    return (
      <Card>
        <CardTitulo>Miembros</CardTitulo>
        <Vacio
          icono={IconoYelmo}
          titulo="Todavía no hay miembros activos"
          descripcion="Las cuentas aparecen acá cuando un administrador las aprueba."
        />
      </Card>
    )
  }

  return (
    <Card>
      <CardTitulo>Actividad reciente</CardTitulo>

      {/* La tabla scrollea sola en pantallas chicas: el <body> nunca scrollea
          en horizontal. */}
      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="border-b border-borde text-left">
              <th className="grabado pb-2 pr-4 text-left">
                Nombre
              </th>
              <th className="grabado pb-2 pr-4 text-left">
                Rol
              </th>
              <th className="grabado pb-2 pr-4 text-left">
                Última vez
              </th>
              <th className="grabado pb-2 text-left">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde-suave">
            {miembros.map((miembro) => (
              <tr key={miembro.id} className="transition-colors hover:bg-superficie-alta/50">
                <td className="py-2.5 pr-4 font-medium">{miembro.name}</td>
                <td className="py-2.5 pr-4 text-texto-suave">{miembro.role}</td>
                {/* tiempoRelativo en lugar del ISO crudo que se mostraba antes */}
                <td className="py-2.5 pr-4 text-texto-tenue">
                  {tiempoRelativo(miembro.last_seen)}
                </td>
                <td className="py-2.5">
                  {miembro.online ? (
                    <Etiqueta tono="exito">
                      <IconoLlama className="mr-1 text-[11px]" />
                      En línea
                    </Etiqueta>
                  ) : (
                    <Etiqueta>Desconectado</Etiqueta>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
