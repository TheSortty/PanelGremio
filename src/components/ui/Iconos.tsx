/**
 * Iconografía del panel.
 *
 * La versión anterior tenía SVG sueltos pegados arriba de cada componente
 * —dos copias distintas del icono de Steam, cada uno con su propio tamaño y
 * grosor de trazo— y en la migración se perdieron casi todos.
 *
 * Acá están todos juntos, dibujados sobre la misma grilla de 24 y con el mismo
 * trazo, así el conjunto se lee como una familia y no como un collage. Todos
 * heredan el color con `currentColor` y el tamaño con `em`, de modo que un
 * icono al lado de un texto se escala solo con la tipografía.
 *
 * El vocabulario es el del juego, no el de un panel de control genérico: la
 * sección de miembros es un yelmo, la de builds una espada, el registro un
 * pergamino. Es lo que hace que la interfaz se sienta parte de Albion y no una
 * plantilla de administración con otros colores.
 */

type Props = React.SVGProps<SVGSVGElement>

/** Contorno: todo lo dibujado con trazo. */
function Trazo({ children, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

/** Relleno: para las marcas de terceros, que vienen definidas así. */
function Solido({ children, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

// -----------------------------------------------------------------------------
// Secciones
// -----------------------------------------------------------------------------

/** Panel. Escudo: el gremio como cuerpo que se defiende. */
export function IconoEscudo(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M12 2.75 4.5 5.5v6c0 4.6 3 7.9 7.5 9.75 4.5-1.85 7.5-5.15 7.5-9.75v-6Z" />
      <path d="M12 7.5v6.5" />
    </Trazo>
  )
}

/** Builds. Espada de una mano, vista de frente. */
export function IconoEspada(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M12 2.5 14 6v7h-4V6Z" />
      <path d="M7.5 13h9" />
      <path d="M12 13v4.5" />
      <circle cx="12" cy="19.5" r="2" />
    </Trazo>
  )
}

/** Rutas. Mapa plegado. */
export function IconoMapa(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M9 3.5 3.5 6v14.5L9 18l6 2.5 5.5-2.5V3.5L15 6Z" />
      <path d="M9 3.5V18" />
      <path d="M15 6v14.5" />
    </Trazo>
  )
}

/** Métricas. */
export function IconoGrafico(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M3.5 20.5h17" />
      <path d="M7 20.5v-6" />
      <path d="M12 20.5V7.5" />
      <path d="M17 20.5v-9" />
    </Trazo>
  )
}

/** Registro de auditoría. Pergamino. */
export function IconoPergamino(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M7 3.5h10a2 2 0 0 1 2 2v13a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5v-13a2 2 0 0 1 2-2Z" />
      <path d="M5 6.5h3" />
      <path d="M9.5 9.5h6" />
      <path d="M9.5 13h6" />
      <path d="M9.5 16.5h3.5" />
    </Trazo>
  )
}

/** Administración. Llave. */
export function IconoLlave(props: Props) {
  return (
    <Trazo {...props}>
      <circle cx="15.5" cy="8.5" r="4.5" />
      <path d="M12.3 11.7 3.5 20.5" />
      <path d="M3.5 20.5H6.5v-2.5H9v-2.5h2" />
    </Trazo>
  )
}

/** Mercado. Balanza de dos platos: se compara lo que entra con lo que sale. */
export function IconoBalanza(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M12 3.5v17" />
      <path d="M6.5 21h11" />
      <path d="M4 7.5h16" />
      <path d="M4 7.5 1.5 14a3.5 3.5 0 0 0 5 0Z" />
      <path d="M20 7.5 22.5 14a3.5 3.5 0 0 1-5 0Z" />
    </Trazo>
  )
}

// -----------------------------------------------------------------------------
// Panel
// -----------------------------------------------------------------------------

/** Miembros. Yelmo cerrado con visera. */
export function IconoYelmo(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M5 11.5a7 7 0 0 1 14 0v4.5a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5Z" />
      <path d="M5 12.5h14" />
      <path d="M12 12.5V21" />
    </Trazo>
  )
}

/** En línea. Llama de antorcha. */
export function IconoLlama(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M12 2.5c.4 3-2 4.2-2 6.6 0 .9.4 1.7 1 2.2-.2-2 1-3.4 1-3.4 0 2.6 3.5 3.2 3.5 6.4a5.5 5.5 0 0 1-11 0c0-4.2 4.6-6 7.5-11.8Z" />
    </Trazo>
  )
}

/** Convocatoria. Estandarte del gremio. */
export function IconoEstandarte(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M6 3.5h12v11l-6 3.5-6-3.5Z" />
      <path d="M12 18v3" />
      <path d="M9.5 21h5" />
    </Trazo>
  )
}

// -----------------------------------------------------------------------------
// Acciones
// -----------------------------------------------------------------------------

export function IconoMas(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Trazo>
  )
}

/** Editar. Pluma de escriba. */
export function IconoPluma(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M4 20c0-8.5 6-15.5 16.5-17C19 13.5 13 20 4 20Z" />
      <path d="m4 20 5.5-5.5" />
    </Trazo>
  )
}

export function IconoPapelera(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M4 6.5h16" />
      <path d="M9.5 6.5V5A1.5 1.5 0 0 1 11 3.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
      <path d="m6.5 6.5 1 12.2a2 2 0 0 0 2 1.8h5a2 2 0 0 0 2-1.8l1-12.2" />
      <path d="M10.5 10.5v6" />
      <path d="M13.5 10.5v6" />
    </Trazo>
  )
}

export function IconoLupa(props: Props) {
  return (
    <Trazo {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </Trazo>
  )
}

export function IconoCruz(props: Props) {
  return (
    <Trazo {...props}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </Trazo>
  )
}

export function IconoChevron(props: Props) {
  return (
    <Trazo {...props}>
      <path d="m6 9 6 6 6-6" />
    </Trazo>
  )
}

export function IconoSalir(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M14 3.5h3.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H14" />
      <path d="m8.5 8-4 4 4 4" />
      <path d="M4.5 12H14" />
    </Trazo>
  )
}

export function IconoUsuario(props: Props) {
  return (
    <Trazo {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </Trazo>
  )
}

export function IconoCandado(props: Props) {
  return (
    <Trazo {...props}>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Trazo>
  )
}

/** Guía generada. Chispa de invocación. */
export function IconoChispa(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9Z" />
      <path d="M18.5 3.5v3" />
      <path d="M20 5h-3" />
    </Trazo>
  )
}

// -----------------------------------------------------------------------------
// Avisos
// -----------------------------------------------------------------------------

export function IconoExito(props: Props) {
  return (
    <Trazo {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.7 2.8L16 9.5" />
    </Trazo>
  )
}

export function IconoAlerta(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M12 3.5 21 19.5H3Z" />
      <path d="M12 9.5v4.5" />
      <path d="M12 17h.01" />
    </Trazo>
  )
}

export function IconoInfo(props: Props) {
  return (
    <Trazo {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.75h.01" />
    </Trazo>
  )
}

// -----------------------------------------------------------------------------
// Marcadores del mapa
// -----------------------------------------------------------------------------

/** Objetivo. */
export function IconoBandera(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M6 21V3.5" />
      <path d="M6 4.5h11l-2.5 4 2.5 4H6" />
    </Trazo>
  )
}

/** Transporte. Carro de carga. */
export function IconoCarro(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M3.5 6.5h11v9h-11Z" />
      <path d="M14.5 10h3.5l2.5 3v2.5h-6" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="16.5" cy="18" r="2" />
    </Trazo>
  )
}

/** Gank. Calavera. */
export function IconoCalavera(props: Props) {
  return (
    <Trazo {...props}>
      <path d="M12 3a8 8 0 0 0-8 8c0 2.7 1.3 4.6 3 5.7V19a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2.3c1.7-1.1 3-3 3-5.7a8 8 0 0 0-8-8Z" />
      <circle cx="9" cy="11" r="1.5" />
      <circle cx="15" cy="11" r="1.5" />
      <path d="M12 15v2.5" />
    </Trazo>
  )
}

// -----------------------------------------------------------------------------
// Marca del panel
// -----------------------------------------------------------------------------

/**
 * Blasón. Escudo con la llama del gremio.
 *
 * Es la única pieza que mezcla relleno y trazo: la llama va sólida para que
 * destaque como el punto de luz de la cabecera.
 */
export function Blason(props: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M12 2 4 5v6.5C4 16.7 7.3 20.5 12 22.5c4.7-2 8-5.8 8-11V5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M12 7c.3 2.2-1.5 3-1.5 4.8 0 .6.3 1.2.8 1.6-.2-1.5.7-2.5.7-2.5 0 1.9 2.5 2.3 2.5 4.6a2.5 2.5 0 0 1-5 0c0-3 2.5-4.4 2.5-8.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

// -----------------------------------------------------------------------------
// Proveedores de acceso
// -----------------------------------------------------------------------------

export function IconoDiscord(props: Props) {
  return (
    <Solido viewBox="0 0 24 24" {...props}>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </Solido>
  )
}

export function IconoSteam(props: Props) {
  return (
    <Solido viewBox="0 0 24 24" {...props}>
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527 0 2.495-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25.978.408 2.086-.056 2.494-1.036.198-.474.199-.997.002-1.472-.196-.474-.564-.844-1.036-1.042-.47-.197-.968-.19-1.407-.019l1.522.63c.719.3 1.058 1.129.758 1.847-.3.719-1.13 1.058-1.848.758l-.326-.306zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
    </Solido>
  )
}
