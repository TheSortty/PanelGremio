import { Router } from 'express';
import { GoogleGenAI } from "@google/genai";
import { Build } from '../types';

const router = Router();

// Validar que la API Key está disponible
if (!process.env.API_KEY) {
    console.error("FATAL ERROR: API_KEY is not defined in environment variables.");
    // No salimos del proceso para permitir que otras partes de la API funcionen,
    // pero este endpoint fallará.
}

const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

router.post('/generate-build-guide', async (req, res) => {
    if (!ai) {
        return res.status(500).json({ message: 'AI service is not configured. Missing API_KEY.' });
    }

    const { build } = req.body as { build: Build };

    if (!build) {
        return res.status(400).json({ message: 'Build data is required.' });
    }

    // Construir un prompt detallado para la IA
    const prompt = `
        Eres un jugador experto del MMORPG Albion Online. Tu tarea es generar una guía concisa y útil para la siguiente build de personaje. La guía debe estar en español y formateada en markdown.

        **Detalles de la Build:**
        - **Título**: ${build.title}
        - **Categoría**: ${build.category}
        - **Descripción**: ${build.description}

        **Equipamiento:**
        - **Mano Principal**: ${build.equipment.weapon?.name || 'N/A'}
        - **Mano Secundaria**: ${build.equipment.offhand?.name || 'N/A'}
        - **Cabeza**: ${build.equipment.helmet?.name || 'N/A'}
        - **Pecho**: ${build.equipment.chest?.name || 'N/A'}
        - **Botas**: ${build.equipment.boots?.name || 'N/A'}
        - **Capa**: ${build.equipment.cape?.name || 'N/A'}

        **Consumibles:**
        - **Poción**: ${build.consumables.potion?.name || 'N/A'}
        - **Comida**: ${build.consumables.food?.name || 'N/A'}

        **La guía debe cubrir:**
        1.  **Estrategia General**: Cómo jugar esta build de manera efectiva en su categoría (${build.category}).
        2.  **Fortalezas**: ¿Cuáles son las principales ventajas de esta build? (ej. movilidad, daño explosivo, control de masas, etc.).
        3.  **Debilidades**: ¿Cuáles son sus principales desventajas y qué enfrentamientos o situaciones se deben evitar?
        4.  **Rotación/Combos**: Una breve explicación de los combos de habilidades si aplica.

        Mantén la guía clara, amigable para principiantes y enfocada en consejos prácticos. Usa negritas para los títulos.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const guide = response.text;
        res.json({ guide });

    } catch (error) {
        console.error("Error generating guide with Gemini API:", error);
        res.status(500).json({ message: 'Failed to generate AI guide.' });
    }
});

export default router;
