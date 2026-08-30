import { cn } from '@/lib/utils/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn(
        'size-8 animate-spin rounded-full border-2 border-borde border-t-acento',
        className,
      )}
    />
  )
}

export function CargandoPagina({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Spinner className="size-10" />
      <p className="text-sm text-texto-tenue">{mensaje}</p>
    </div>
  )
}

/*
  Placeholder con la forma del contenido que viene.

  Se usa en los archivos loading.tsx para que Next muestre la estructura de la
  página mientras el Server Component consulta la base, en vez del spinner de
  pantalla completa que bloqueaba toda la app en la versión anterior.
*/
export function Esqueleto({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-superficie-alta', className)}
    />
  )
}
