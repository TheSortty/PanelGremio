import { Router } from 'express';
import prisma from '../db'; // Importamos Prisma

const router = Router();

// Get guild members
router.get('/members', async (req, res) => {
    try {
        // Un "miembro del gremio" es un usuario con status 'active'.
        // Seleccionamos solo los campos que el frontend necesita.
        const members = await prisma.user.findMany({
            where: {
                status: 'active'
            },
            select: {
                name: true,
                role: true,
                lastSeen: true,
                online: true,
            },
            orderBy: {
                online: 'desc', // Mostramos a los que están en línea primero
            }
        });
        res.json(members);
    } catch (error) {
        console.error("Failed to fetch guild members:", error);
        res.status(500).json({ message: "Error fetching guild members" });
    }
});

// Get member activity logs
router.get('/activity', async (req, res) => {
    try {
        const activity = await prisma.activityLog.findMany({
            orderBy: {
                timestamp: 'desc',
            },
            take: 200, // Limitamos a los 200 registros más recientes para no sobrecargar.
        });
        res.json(activity);
    } catch (error) {
        console.error("Failed to fetch activity logs:", error);
        res.status(500).json({ message: "Error fetching activity logs" });
    }
});

export default router;