import { Router } from 'express';
import prisma from '../db';
import { authMiddleware } from './auth';

const router = Router();

// Middleware para verificar privilegios de administrador.
// Se asume que authMiddleware ya se ejecutó y añadió 'req.user'.
const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && ['Maestro del Gremio', 'Mano Derecha'].includes(req.user.role)) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
};

// --- Rutas de Gestión de Usuarios (Protegidas) ---

// Aplicamos los middlewares a todas las rutas de este archivo.
router.use(authMiddleware, isAdmin);

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users.' });
    }
});

// Update a user's role or status
router.patch('/:id', async (req: any, res) => {
    const { id: userIdToUpdate } = req.params;
    const updates: { status?: string, role?: string } = req.body;
    const actor = req.user; // El admin que realiza la acción

    try {
        // 1. Buscamos el estado actual del usuario para el log de auditoría.
        const originalUser = await prisma.user.findUnique({ where: { id: userIdToUpdate } });
        if (!originalUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Actualizamos el usuario en la base de datos.
        const updatedUser = await prisma.user.update({
            where: { id: userIdToUpdate },
            data: updates,
        });

        // 3. Creamos las entradas en el log de auditoría si hubo cambios.
        if (updates.status && originalUser.status !== updatedUser.status) {
            await prisma.auditLog.create({
                data: {
                    actorId: actor.id,
                    actorName: actor.name,
                    action: 'user_status_changed',
                    targetId: userIdToUpdate,
                    targetType: 'user',
                    details: { from: originalUser.status, to: updatedUser.status },
                },
            });
        }
        if (updates.role && originalUser.role !== updatedUser.role) {
            await prisma.auditLog.create({
                data: {
                    actorId: actor.id,
                    actorName: actor.name,
                    action: 'user_role_changed',
                    targetId: userIdToUpdate,
                    targetType: 'user',
                    details: { from: originalUser.role, to: updatedUser.role },
                },
            });
        }

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user.' });
    }
});

// Delete a user
router.delete('/:id', async (req: any, res) => {
    const { id: userIdToDelete } = req.params;
    const actor = req.user;

    if (userIdToDelete === actor.id) {
        return res.status(400).json({ message: "You cannot delete your own account." });
    }

    try {
        // Obtenemos el nombre del usuario antes de borrarlo para el log.
        const userToDelete = await prisma.user.findUnique({ where: { id: userIdToDelete } });
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        await prisma.user.delete({ where: { id: userIdToDelete } });

        // Creamos el log de auditoría.
        await prisma.auditLog.create({
            data: {
                actorId: actor.id,
                actorName: actor.name,
                action: 'user_deleted',
                targetId: userIdToDelete,
                targetType: 'user',
                details: { deletedUserName: userToDelete.name },
            },
        });

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error(error); // Imprime el error real en la consola del servidor
        res.status(500).json({ message: 'Error deleting user. It might be linked to other records (builds, logs).' });
    }
});

export default router;