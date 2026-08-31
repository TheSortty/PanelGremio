/**
 * Mapa del continente real, dibujado por nosotros.
 *
 * POR QUÉ NO ES UNA IMAGEN
 *
 * La versión anterior usaba de fondo una captura del mapa oficial:
 *
 *     https://albiononline.com/assets/images/uploads/media/data/26/map_royal_continent.jpg
 *
 * Ese enlace devuelve 403. No es que se haya movido: el servidor bloquea el
 * hotlinking, así que la imagen nunca cargó desde otro dominio. El resultado
 * era un rectángulo gris vacío, y encima de un rectángulo vacío los marcadores
 * no significan nada: no se puede decir "gank en la ruta a Thetford" si no se
 * ve dónde está Thetford.
 *
 * Copiar el archivo a nuestro servidor resolvería el 403 pero no el permiso:
 * el arte es de Sandbox Interactive. Este mapa es esquemático y propio —las
 * seis ciudades reales en su posición relativa y las rutas que las unen—, que
 * es exactamente la información que hace falta para planificar, y no depende
 * de nadie.
 *
 * EL SISTEMA DE COORDENADAS
 *
 * El viewBox es 1000×562 (16:9) y el SVG se estira al contenedor con
 * preserveAspectRatio="none". Los marcadores se posicionan en porcentaje sobre
 * ese contenedor, así que sus coordenadas siguen siendo válidas: los que ya
 * estaban guardados no se mueven.
 */

/** Las seis ciudades, en su posición relativa dentro del continente. */
const CIUDADES = [
  { nombre: 'Fort Sterling', x: 318, y: 116 },
  { nombre: 'Martlock', x: 700, y: 132 },
  { nombre: 'Lymhurst', x: 812, y: 342 },
  { nombre: 'Bridgewatch', x: 566, y: 486 },
  { nombre: 'Thetford', x: 196, y: 372 },
] as const

const CAERLEON = { nombre: 'Caerleon', x: 500, y: 286 }

export function MapaRoyal({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 562"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Pergamino viejo a la luz de una vela: claro en el centro, quemado
            en los bordes. */}
        <radialGradient id="mapa-luz" cx="50%" cy="45%" r="72%">
          <stop offset="0%" stopColor="oklch(0.31 0.028 68)" />
          <stop offset="65%" stopColor="oklch(0.24 0.022 66)" />
          <stop offset="100%" stopColor="oklch(0.17 0.016 62)" />
        </radialGradient>

        <pattern id="mapa-cuadricula" width="50" height="50" patternUnits="userSpaceOnUse">
          <path
            d="M50 0H0v50"
            fill="none"
            stroke="oklch(0.78 0.135 80)"
            strokeOpacity="0.05"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect width="1000" height="562" fill="url(#mapa-luz)" />
      <rect width="1000" height="562" fill="url(#mapa-cuadricula)" />

      {/*
        La masa de tierra. Un contorno irregular a mano alzada: un óvalo
        prolijo parecería un diagrama, y esto tiene que leerse como territorio.
      */}
      <path
        d="M500 34c118-6 214 30 268 92 46 54 62 118 54 182-8 68-48 128-112 164-58 32-128 46-206 46-84 0-158-16-216-52-62-38-98-96-102-166-4-72 24-136 82-186C324 62 406 38 500 34Z"
        fill="oklch(0.27 0.025 70)"
        stroke="oklch(0.42 0.05 74)"
        strokeWidth="2"
      />

      {/* La costa: una segunda línea por dentro, como en las cartas viejas. */}
      <path
        d="M500 34c118-6 214 30 268 92 46 54 62 118 54 182-8 68-48 128-112 164-58 32-128 46-206 46-84 0-158-16-216-52-62-38-98-96-102-166-4-72 24-136 82-186C324 62 406 38 500 34Z"
        fill="none"
        stroke="oklch(0.78 0.135 80)"
        strokeOpacity="0.18"
        strokeWidth="1"
        transform="translate(500 281) scale(0.955) translate(-500 -281)"
      />

      {/* Rutas: cada ciudad con Caerleon, y el anillo entre vecinas. */}
      <g stroke="oklch(0.78 0.135 80)" strokeOpacity="0.28" strokeWidth="1.5" fill="none">
        {CIUDADES.map((c) => (
          <line key={c.nombre} x1={CAERLEON.x} y1={CAERLEON.y} x2={c.x} y2={c.y} />
        ))}
        <path
          d={`M${CIUDADES.map((c) => `${c.x} ${c.y}`).join('L')}Z`}
          strokeDasharray="6 7"
          strokeOpacity="0.16"
        />
      </g>

      {/* Caerleon: el centro, y el único punto sólido. */}
      <g>
        <circle cx={CAERLEON.x} cy={CAERLEON.y} r="13" fill="oklch(0.65 0.19 25)" />
        <circle
          cx={CAERLEON.x}
          cy={CAERLEON.y}
          r="20"
          fill="none"
          stroke="oklch(0.65 0.19 25)"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />
        <text
          x={CAERLEON.x}
          y={CAERLEON.y + 40}
          textAnchor="middle"
          fill="oklch(0.76 0.021 80)"
          fontSize="17"
          fontFamily="var(--font-titulo)"
          letterSpacing="2.5"
        >
          CAERLEON
        </text>
      </g>

      {CIUDADES.map((c) => (
        <g key={c.nombre}>
          <circle
            cx={c.x}
            cy={c.y}
            r="8.5"
            fill="oklch(0.24 0.022 66)"
            stroke="oklch(0.78 0.135 80)"
            strokeOpacity="0.75"
            strokeWidth="2"
          />
          <text
            x={c.x}
            y={c.y + 32}
            textAnchor="middle"
            fill="oklch(0.61 0.023 78)"
            fontSize="15"
            fontFamily="var(--font-titulo)"
            letterSpacing="1.8"
          >
            {c.nombre.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  )
}
