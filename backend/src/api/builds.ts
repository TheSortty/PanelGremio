import { Router } from 'express';
import prisma from '../db'; // Importamos Prisma
import { authMiddleware } from './auth'; // Importamos el middleware de autenticación

const router = Router();

// Get all builds
// Ruta asíncrona para consultar la base de datos.
router.get('/', async (req, res) => {
    try {
        const builds = await prisma.build.findMany({
            // Incluimos la información del autor en la respuesta.
            include: {
                author: {
                    select: {
                        name: true, // Solo seleccionamos el nombre del autor para no exponer otros datos.
                    },
                },
            },
        });
        res.json(builds);
    } catch (error) {
        console.error("Failed to fetch builds:", error);
        res.status(500).json({ message: "Error fetching builds" });
    }
});


// Create a new build
router.post('/', authMiddleware, async (req: any, res) => {
    // Ahora también extraemos equipment y consumables del cuerpo de la petición
    const { title, category, description, equipment, consumables, abilities } = req.body;
    const authorId = req.user.id;

    if (!title || !category || !authorId) {
        return res.status(400).json({ message: "Title, category, and author are required." });
    }

    try {
        const newBuild = await prisma.build.create({
            data: {
                title,
                category,
                description,
                equipment,
                consumables,
                abilities, // <-- Y lo guardamos en la base de datos
                author: {
                    connect: { id: authorId },
                },
            },
        });
        res.status(201).json(newBuild);
    } catch (error) {
        console.error("Failed to create build:", error);
        res.status(500).json({ message: "Error creating build" });
    }
});

export default router;