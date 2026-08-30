import { Boton } from '@/components/ui/Boton'

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
        Cerrar sesión
      </Boton>
    </form>
  )
}
