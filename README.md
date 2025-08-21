# Panel del Gremio - Documentación del Proyecto

Este documento proporciona una descripción completa del proyecto Panel del Gremio, incluyendo su frontend, el backend que lo soporta y las instrucciones para ponerlo en marcha.

## 1. Descripción General

El Panel del Gremio es una aplicación web de página única (SPA) diseñada para gestionar gremios en juegos MMORPG. Ofrece herramientas para visualizar la actividad de los miembros, crear y compartir builds de personajes, planificar estrategias en un mapa interactivo y administrar el acceso de los usuarios.

-   **Frontend**: Construido con **React**, **TypeScript** y **Tailwind CSS**. Es una interfaz moderna, responsiva y completamente desacoplada de la lógica de negocio.
-   **Backend**: Construido con **Node.js**, **Express** y **TypeScript**. Proporciona una API RESTful para todas las funcionalidades del frontend y utiliza una base de datos simulada en memoria para facilitar el desarrollo y la demostración.

---

## 2. Puesta en Marcha y Ejecución Local

Para ejecutar el proyecto completo, necesitas correr el backend y el frontend simultáneamente.

### Requisitos

-   Node.js (v18 o superior)
-   npm (o un gestor de paquetes similar)
-   Una clave de API de Google Gemini

### Paso 1: Configurar y Ejecutar el Backend

1.  **Navega a la carpeta del backend**:
    ```bash
    cd backend
    ```

2.  **Instala las dependencias**:
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno**:
    Crea un archivo llamado `.env` en la raíz de la carpeta `backend`. Puedes copiarlo desde el ejemplo:
    ```bash
    cp .env.example .env
    ```
    Abre el archivo `.env` y añade tu clave de API de Gemini:
    ```
    API_KEY=TU_API_KEY_DE_GEMINI_AQUI
    ```

4.  **Inicia el servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    El servidor se ejecutará en `http://localhost:3001`.

### Paso 2: Ejecutar el Frontend

1.  **Abre una nueva terminal** en la raíz del proyecto.

2.  **Sirve los archivos estáticos**:
    El frontend no requiere un proceso de compilación. Solo necesitas un servidor web simple para servir los archivos.
    -   Si tienes Python instalado: `python -m http.server 8000`
    -   Usando `npx`: `npx serve .`
    -   O usa la extensión **Live Server** en VSCode.

3.  **Accede a la aplicación**:
    Abre tu navegador y ve a `http://localhost:8000` (o el puerto que estés usando). El frontend se conectará automáticamente al backend que corre en el puerto 3001.

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

## 5. Modelos de Datos (Types)

Consulta el archivo `types.ts` para ver las definiciones detalladas de las interfaces (`User`, `Build`, `Item`, `GuildMember`, etc.) que se utilizan tanto en el frontend como en los contratos de la API.
