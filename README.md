# Panel del Gremio - Documentación del Proyecto

Este documento proporciona una descripción completa del proyecto Panel del Gremio, incluyendo su frontend, el backend que lo soporta y las instrucciones para ponerlo en marcha.

## 1. Descripción General

El Panel del Gremio es una aplicación web de página única (SPA) diseñada para gestionar gremios en juegos MMORPG. Ofrece herramientas para visualizar la actividad de los miembros, crear y compartir builds de personajes, planificar estrategias en un mapa interactivo y administrar el acceso de los usuarios.

-   **Frontend**: Construido con **React**, **TypeScript** y **Tailwind CSS**. Es una interfaz moderna, responsiva y completamente desacoplada de la lógica de negocio.
-   **Backend**: Construido con **Node.js**, **Express** y **TypeScript**. Proporciona una API RESTful para todas las funcionalidades del frontend y utiliza una base de datos simulada en memoria para facilitar el desarrollo y la demostración.

---

## 2. Puesta en Marcha y Ejecución Local (con Visual Studio Code)

Para ejecutar el proyecto completo, necesitas correr el **backend** (servidor) y el **frontend** (interfaz de usuario) al mismo tiempo. La forma más sencilla es usando **dos terminales integradas** en Visual Studio Code.

### Requisitos

-   Node.js (v18 o superior)
-   npm (incluido con Node.js)
-   La extensión **Live Server** para Visual Studio Code (búscala e instálala desde el panel de Extensiones).

### Paso 0: Instalar Dependencias del Editor (Solo la primera vez)

Para que Visual Studio Code reconozca correctamente los tipos de React y TypeScript y te ofrezca una buena experiencia de desarrollo sin errores falsos, necesitas instalar unas dependencias de desarrollo.

1.  **Abre una terminal en la carpeta RAÍZ del proyecto** (la que contiene `index.html` y `backend`).
2.  **Ejecuta el siguiente comando una sola vez**:
    ```bash
    npm install
    ```
    Esto leerá el archivo `package.json` y preparará tu entorno de desarrollo.

### Paso 1: Configurar y Ejecutar el Backend (Servidor)

1.  **Abre el proyecto en VS Code**.
2.  **Abre una nueva terminal integrada**: Puedes hacerlo desde el menú `Terminal > Nueva terminal`.
3.  **Navega a la carpeta del backend** en esa terminal:
    ```bash
    cd backend
    ```
4.  **Clave de API**: Se ha añadido un archivo `.env` con tu clave de API en la carpeta `backend`. Si necesitas cambiarla en el futuro, puedes editar ese archivo.
5.  **Instala las dependencias del backend**:
    ```bash
    npm install
    ```
    Esto leerá el archivo `package.json` y descargará todo lo necesario para que el servidor funcione.
6.  **Inicia el servidor de desarrollo del backend**:
    ```bash
    npm run dev
    ```
    Verás un mensaje como `Backend server is listening on http://localhost:3001`. **¡Importante! Deja esta terminal abierta y corriendo.**

### Paso 2: Ejecutar el Frontend (Interfaz de Usuario)

1.  **Abre una SEGUNDA terminal integrada**: Haz clic en el icono `+` en el panel de la terminal de VS Code para abrir otra terminal al lado de la del backend.
2.  **Asegúrate de estar en la raíz del proyecto**, no en la carpeta `backend`. Si estás en `backend`, usa `cd ..` para volver a la carpeta principal.
3.  **Inicia el frontend usando Live Server**:
    -   En el explorador de archivos de VS Code, busca el archivo `index.html` que está en la raíz del proyecto.
    -   Haz clic derecho sobre `index.html`.
    -   Selecciona la opción **"Open with Live Server"**.
4.  **¡Listo!** Tu navegador web se abrirá automáticamente en una dirección como `http://127.0.0.1:5500` y verás la aplicación funcionando. El frontend se conectará automáticamente al backend que dejaste corriendo en la primera terminal.

---

## 3. Características

(Consulta la documentación específica en los `README.md` de las carpetas `frontend` y `backend` para más detalles).

-   **Dashboard Principal**: Estadísticas y actividad del gremio.
-   **Gestión de Builds**: Crea, visualiza y obtén guías generadas por IA.
-   **Mapa Estratégico**: Planificación de rutas y objetivos.
-   **Métricas y Administración**: Herramientas para oficiales y maestros del gremio (disponibles al iniciar sesión con el usuario `Admin`).

---

## 4. Especificación de la API del Backend (Contrato)

El frontend espera que el backend implemente los siguientes endpoints. Todas las rutas están prefijadas con `/api`. El backend incluido en este proyecto implementa esta especificación al completo.

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

---

## 5. Solución de Problemas (Troubleshooting)

**Error: "Loading module from ... was blocked because of a disallowed MIME type ('text/html')."**

Este error es común cuando se trabaja con React y TypeScript directamente en el navegador sin un empaquetador como Vite o Webpack.

-   **Causa**: El navegador no sabe cómo resolver importaciones como `import App from './App'`. No asume automáticamente que debe buscar un archivo llamado `App.tsx`. Cuando no encuentra el archivo, el "Live Server" a menudo devuelve la página `index.html` como respuesta, lo cual tiene el tipo MIME incorrecto (`text/html` en lugar de `application/javascript`), y el navegador bloquea la carga.
-   **Solución**: La solución es ser explícito en todas las rutas de importación de archivos locales, **incluyendo siempre la extensión del archivo**. Por ejemplo:
    -   **Incorrecto**: `import App from './App'`
    -   **Correcto**: `import App from './App.tsx'`

Este proyecto ya ha sido corregido para seguir esta convención.

---

## 6. Modelos de Datos (Types)

Consulta el archivo `types.ts` para ver las definiciones detalladas de las interfaces (`User`, `Build`, `Item`, `GuildMember`, etc.) que se utilizan tanto en el frontend como en los contratos de la API.