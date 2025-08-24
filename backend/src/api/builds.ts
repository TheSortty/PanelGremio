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
// Protegemos esta ruta con el middleware. Solo usuarios logueados pueden acceder.
router.post('/', authMiddleware, async (req: any, res) => {
    // Extraemos los datos de la build del cuerpo de la petición.
    const { title, category, description } = req.body;
    
    // El autor es el usuario que hemos verificado con el middleware.
    const authorId = req.user.id; 

    // Validación básica
    if (!title || !category || !authorId) {
        return res.status(400).json({ message: "Title, category, and author are required." });
    }

    try {
        const newBuild = await prisma.build.create({
            data: {
                title,
                category,
                description,
                author: {
                    connect: { id: authorId }, // Aquí conectamos la build con el usuario autor.
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