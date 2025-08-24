import { Router } from 'express';
import prisma from '../db'; // Importamos Prisma

const router = Router();

// Get items with optional search and type filters
router.get('/', async (req, res) => {
    // Extraemos y validamos los parámetros de la URL
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;

    if (!type) {
        return res.status(400).json({ message: 'Item type query parameter is required.' });
    }

    try {
        const items = await prisma.item.findMany({
            where: {
                // Filtramos por el tipo de ítem
                type: type,
                // Si hay un término de búsqueda, filtramos por el nombre
                name: {
                    contains: search, // 'contains' es insensible a mayúsculas/minúsculas en MySQL
                },
            },
        });
        res.json(items);
    } catch (error) {
        console.error("Failed to fetch items:", error);
        res.status(500).json({ message: "Error fetching items" });
    }
});

export default router;