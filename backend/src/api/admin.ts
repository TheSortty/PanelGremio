import { Router } from 'express';
import prisma from '../db'; // Importamos el cliente de Prisma
import { authMiddleware } from './auth'; // Importaremos un middleware de autenticación que crearemos en el siguiente paso

const router = Router();

// Middleware to check for admin privileges
// Este middleware ahora se apoya en el 'user' que el 'authMiddleware' añadirá a la petición (req).
const isAdmin = (req: any, res: any, next: any) => {
    const user = req.user;
    if (user && ['Maestro del Gremio', 'Mano Derecha'].includes(user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
};

// Get audit logs
// La ruta ahora es asíncrona para poder usar 'await' con Prisma.
router.get('/logs', authMiddleware, isAdmin, async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: {
                timestamp: 'desc', // Ordenamos los logs por fecha, el más nuevo primero
            },
        });
        res.json(logs);
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        res.status(500).json({ message: "Error fetching audit logs" });
    }
});

export default router;