
# Panel del Gremio - Documentación del Frontend

Este documento proporciona una descripción completa del proyecto frontend del Panel del Gremio, sus características y la especificación detallada de la API del backend necesaria para su funcionamiento.

## 1. Descripción General

El Panel del Gremio es una aplicación web de página única (SPA) diseñada para gestionar gremios en juegos MMORPG. Ofrece herramientas para visualizar la actividad de los miembros, crear y compartir builds de personajes, planificar estrategias en un mapa interactivo y administrar el acceso de los usuarios.

Este frontend está construido con **React**, **TypeScript** y **Tailwind CSS**, y está diseñado para ser moderno, responsivo y completamente desacoplado de la lógica de negocio, la cual debe ser implementada en un backend.

## 2. Características Disponibles en el Frontend

La interfaz de usuario actual soporta las siguientes funcionalidades:

-   **Dashboard Principal**:
    -   Visualización de estadísticas clave (miembros totales, miembros en línea).
    -   Tabla de actividad reciente de los miembros del gremio.
    -   Tarjeta de anuncio para el próximo evento importante (ej. ZvZ).

-   **Gestión de Builds de Personajes**:
    -   **Crear Builds**: Un formulario completo para crear nuevas builds, incluyendo título, descripción, categoría y autor.
    -   **Selector de Ítems Dinámico**: Componente de búsqueda que consulta al backend en tiempo real para encontrar y seleccionar ítems (armas, armaduras, consumibles).
    -   **Listar y Ver Builds**: Galería de todas las builds guardadas, con visualización detallada del equipamiento y las habilidades.
    -   **Guía por IA**: Funcionalidad para generar una guía de juego detallada para cualquier build utilizando la IA de Gemini (la llamada a la API se realiza de forma segura a través del backend).

-   **Mapa Estratégico Interactivo**:
    -   Un mapa del mundo del juego donde los usuarios pueden colocar marcadores.
    -   Selector de tipo de marcador para planificar diferentes estrategias: rutas de **transporte**, puntos de **gank** o **objetivos** clave.
    -   Los marcadores se pueden añadir y eliminar con un clic.

-   **Métricas de Actividad (Sección de Administradores)**:
    -   Gráfico de barras que muestra la actividad de los miembros por día de la semana.
    -   Mapa de calor que visualiza las horas de mayor conexión de los miembros.
    -   Modales interactivos para ver la lista de miembros activos en un período específico.

-   **Administración de Usuarios (Sección de Administradores)**:
    -   Tabla para listar todos los usuarios registrados.
    -   Filtros para visualizar usuarios por estado (todos, pendientes, activos).
    -   Acciones para **aprobar** o **rechazar** nuevas solicitudes de registro.
    -   Capacidad para cambiar el **rol** de un usuario y **eliminarlo**.

-   **Registro de Auditoría (Sección de Administradores)**:
    -   Un historial detallado de todas las acciones administrativas importantes realizadas en el panel (ej. cambio de rol, eliminación de usuario).

-   **Sistema de Autenticación Completo**:
    -   Flujo de inicio de sesión con nombre de usuario.
    -   Flujo de registro que crea una cuenta con estado "pendiente" para aprobación.
    -   Integración preparada para un flujo de autenticación OAuth con **Steam**.
    -   Gestión de sesiones persistentes a través de cookies manejadas por el backend.

## 3. Puesta en Marcha y Ejecución Local

Este proyecto no requiere un proceso de compilación complejo gracias al uso de `importmap` y CDNs. Para ejecutarlo localmente:

1.  **Servir los archivos**: Necesitas un servidor web simple para servir los archivos estáticos (`index.html`, `index.tsx`, etc.).
    -   Si tienes Python instalado, puedes usar: `python -m http.server 8000`
    -   También puedes usar extensiones de VSCode como **Live Server**.

2.  **Configurar el Backend**:
    -   Debes tener tu servidor de backend corriendo.
    -   El backend debe implementar todos los endpoints especificados en la sección 4.
    -   **Importante**: Para evitar problemas de CORS, el frontend y el backend deben servirse desde el mismo dominio o el backend debe tener una política de CORS que permita peticiones desde el origen donde se ejecuta el frontend (ej. `http://localhost:8000`).

---

## 4. Especificación de la API del Backend (Contrato)

El frontend espera que el backend implemente los siguientes endpoints. Todas las rutas están prefijadas con `/api`.

### 4.1. Autenticación (`/api/auth`)

| Método | Ruta | Body (Request) | Respuesta Exitosa (200) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/session` | (ninguno) | `User` | Verifica si hay una sesión activa (cookie) y devuelve los datos del usuario. Devuelve `401 Unauthorized` si no hay sesión. |
| `POST` | `/login` | `{ "username": "string" }` | `User` | Autentica a un usuario por su nombre. Devuelve `401` o `404` si falla. Debe establecer una cookie de sesión `httpOnly`. |
| `POST` | `/register` | `{ "username": "string" }` | `User` | Crea un nuevo usuario con `status: 'pending'` para aprobación del admin. |
| `POST` | `/logout` | (ninguno) | `{ "message": "Logout successful" }` | Cierra la sesión del usuario (limpia la cookie de sesión). |
| `GET` | `/steam` | (ninguno) | (Redirección a Steam) | Inicia el flujo de autenticación de Steam (OpenID). |
| `GET` | `/steam/callback` | (Query params de Steam) | (Redirección a `/`) | Endpoint al que Steam redirige. El backend valida, crea/encuentra el usuario, establece la sesión y redirige al frontend. |
| `POST` | `/login-admin-test` | (ninguno) | `User` (con rol de admin) | Endpoint de prueba para facilitar el desarrollo, simula el login de un administrador. |

### 4.2. Usuarios (`/api/users`)

| Método | Ruta | Body (Request) | Respuesta Exitosa (200/204) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | (ninguno) | `User[]` | Obtiene la lista completa de todos los usuarios registrados. |
| `PATCH` | `/:id` | `Partial<Omit<User, 'id'>>` | `User` (actualizado) | Actualiza un usuario (ej. cambiar `role` o `status`). |
| `DELETE` | `/:id` | (ninguno) | `{ "message": "User deleted" }` | Elimina permanentemente a un usuario de la base de datos. |

### 4.3. Builds (`/api/builds`)

| Método | Ruta | Body (Request) | Respuesta Exitosa (200/201) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | (ninguno) | `Build[]` | Obtiene todas las builds guardadas. |
| `POST` | `/` | `Build` | `Build` (creada, con `id`) | Guarda una nueva build en la base de datos. |

### 4.4. Ítems (`/api/items`)

| Método | Ruta | Query Params | Respuesta Exitosa (200) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `type: string` <br/> `search: string` (opcional) | `Item[]` | Busca ítems por tipo (`weapon`, `helmet`, etc.) y opcionalmente por un término de búsqueda en el nombre. |

### 4.5. Gremio (`/api/guild`)

| Método | Ruta | Body (Request) | Respuesta Exitosa (200) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/members` | (ninguno) | `GuildMember[]` | Obtiene la lista de miembros del gremio (para el dashboard). |
| `GET` | `/activity` | (ninguno) | `MemberActivityLog[]` | Obtiene los registros de actividad (conexiones) para la página de métricas. |

### 4.6. Administración (`/api/admin`)

| Método | Ruta | Body (Request) | Respuesta Exitosa (200) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/logs` | (ninguno) | `AuditLog[]` | Obtiene los registros de auditoría para la página de administración. |

### 4.7. Inteligencia Artificial (`/api/ai`)

| Método | Ruta | Body (Request) | Respuesta Exitosa (200) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/generate-build-guide` | `{ "build": Build }` | `{ "guide": "string" }` | Recibe un objeto `Build`, llama a la API de Gemini desde el backend con una clave de API segura y devuelve la guía de texto generada. |

## 5. Modelos de Datos (Types)

Consulta el archivo `types.ts` para ver las definiciones detalladas de las interfaces (`User`, `Build`, `Item`, `GuildMember`, etc.) que se utilizan tanto en el frontend como en los contratos de la API.

---
