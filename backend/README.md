# Backend del Panel del Gremio

Este es el servidor backend para la aplicación Panel del Gremio. Está construido con Node.js, Express y TypeScript, y proporciona todos los endpoints de la API necesarios para que el frontend funcione.

## Características

-   **API RESTful Completa**: Implementa todos los endpoints para la gestión de usuarios, builds, ítems, actividad del gremio y auditoría.
-   **Base de Datos en Memoria**: Utiliza datos simulados en memoria, lo que permite ejecutar el proyecto sin necesidad de configurar una base de datos externa.
-   **Integración con Gemini AI**: Incluye un endpoint seguro para generar guías de builds de personajes utilizando la API de Google Gemini.
-   **Autenticación Basada en Sesiones**: Simula un sistema de inicio de sesión y registro con sesiones manejadas por cookies.
-   **Listo para Contenedores**: Incluye un `Dockerfile` para facilitar el despliegue.

## Puesta en Marcha Local

### 1. Requisitos

-   Node.js (v18 o superior)
-   npm (o similar)
-   Una clave de API de Google Gemini

### 2. Instalación

Desde la carpeta `backend`, instala las dependencias:
```bash
npm install
```

### 3. Variables de Entorno

Antes de iniciar el servidor, necesitas una clave de API de Gemini.

1.  Copia el archivo de ejemplo `.env.example` a un nuevo archivo llamado `.env`:
    ```bash
    cp .env.example .env
    ```

2.  Abre el archivo `.env` y añade tu clave de API:
    ```
    # Clave de API para la integración con Google Gemini
    API_KEY=TU_API_KEY_DE_GEMINI_AQUI
    ```

### 4. Ejecución

Para iniciar el servidor en modo de desarrollo (con recarga automática):
```bash
npm run dev
```

El servidor se iniciará y escuchará en `http://localhost:3001`.

Para compilar y ejecutar la versión de producción:
```bash
npm run build
npm start
```

## Despliegue en Google Cloud Run

Puedes desplegar este backend fácilmente en Google Cloud Run.

1.  **Requisitos**:
    -   Tener `gcloud CLI` instalado y configurado.
    -   Tener Docker instalado.

2.  **Construir la imagen de Docker**:
    En la carpeta `backend`, ejecuta:
    ```bash
    gcloud builds submit --tag gcr.io/[PROJECT_ID]/guild-dashboard-backend
    ```
    Reemplaza `[PROJECT_ID]` con el ID de tu proyecto de Google Cloud.

3.  **Desplegar en Cloud Run**:
    ```bash
    gcloud run deploy guild-dashboard-backend \
      --image gcr.io/[PROJECT_ID]/guild-dashboard-backend \
      --platform managed \
      --region [REGION] \
      --allow-unauthenticated \
      --set-env-vars "API_KEY=TU_API_KEY_DE_GEMINI_AQUI"
    ```
    Reemplaza `[PROJECT_ID]`, `[REGION]` y `TU_API_KEY_DE_GEMINI_AQUI`.

    **Nota sobre CORS**: Si despliegas el frontend y el backend en dominios diferentes, necesitarás ajustar la configuración de CORS en `src/server.ts` para permitir el origen de tu frontend.
