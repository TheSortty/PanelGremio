import { Build } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Genera una guía de build llamando a un endpoint del backend.
 * El backend es responsable de llamar de forma segura a la API de Gemini.
 * @param build - El objeto de la build para el cual generar la guía.
 * @returns Una cadena con la guía en formato markdown.
 */
export const generateBuildGuide = async (build: Build): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate-build-guide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ build }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en el servidor al generar la guía.');
    }

    const { guide } = await response.json();
    return guide;
  } catch (error) {
    console.error("Error al generar la guía de la build:", error);
    if (error instanceof Error) {
        return `Ocurrió un error al generar la guía de IA: ${error.message}`;
    }
    return "Ocurrió un error desconocido al generar la guía de IA.";
  }
};
