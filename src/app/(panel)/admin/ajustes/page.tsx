import { FormularioAjustes } from '@/components/admin/FormularioAjustes'
import { Card } from '@/components/ui/Card'
import { exigirAdmin } from '@/lib/auth/sesion'
import { obtenerAjustes } from '@/lib/data/ajustes'
import { CANALES } from '@/lib/discord/aviso'

export const metadata = { title: 'Ajustes' }

export default async function Ajustes() {
  await exigirAdmin()
  const ajustes = await obtenerAjustes()

  /*
    Se mira si el webhook está cargado, nunca su valor.

    Una URL de webhook es un secreto: cualquiera que la tenga puede publicar en
    el canal. Mostrarla en una pantalla la deja al alcance de cualquiera que
    mire por encima del hombro o saque una captura.
  */
  const canales = Object.entries(CANALES).map(([canal, variable]) => ({
    canal,
    variable,
    configurado: Boolean(process.env[variable]?.trim()),
  }))

  return (
    <div className="space-y-5">
      <FormularioAjustes
        guildId={ajustes.albion_guild_id}
        guildName={ajustes.albion_guild_name}
        region={ajustes.region}
      />

      <Card>
        <h2 className="mb-1 text-lg font-semibold">Publicación en Discord</h2>
        <p className="mb-4 text-sm text-texto-tenue">
          Todo se carga primero acá y después se anuncia allá. Cada canal tiene
          su propio webhook, así que las solicitudes no caen donde los eventos.
          El que no esté configurado simplemente no publica: el panel funciona
          igual.
        </p>

        <ul className="divide-y divide-borde-suave">
          {canales.map(({ canal, variable, configurado }) => (
            <li key={canal} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-medium capitalize">{canal}</p>
                <code className="text-xs text-texto-tenue">{variable}</code>
              </div>
              <span
                className={
                  configurado
                    ? 'shrink-0 text-sm text-exito'
                    : 'shrink-0 text-sm text-texto-tenue'
                }
              >
                {configurado ? 'Configurado' : 'Sin configurar'}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-texto-tenue">
          Se cargan como secretos del Worker y no desde acá, por el mismo motivo
          por el que no se muestran:
          <br />
          <code className="mt-1 inline-block">
            npx wrangler secret put NOMBRE_DE_LA_VARIABLE --name panelgremio
          </code>
        </p>
      </Card>
    </div>
  )
}
