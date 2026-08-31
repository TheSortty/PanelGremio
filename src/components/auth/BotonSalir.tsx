import { Boton } from '@/components/ui/Boton'
import { IconoSalir } from '@/components/ui/Iconos'

/**
 * Formulario en vez de onClick: el cierre de sesión es un POST a un Route
 * Handler, así que funciona aunque el JavaScript no haya cargado.
 */
export function BotonSalir({
  variante = 'fantasma',
  className,
}: {
  variante?: 'fantasma' | 'secundario'
  className?: string
}) {
  return (
    <form action="/auth/salir" method="post" className={className}>
      <Boton type="submit" variante={variante} tamano="sm">
        <IconoSalir className="text-sm" />
        Cerrar sesión
      </Boton>
    </form>
  )
}
