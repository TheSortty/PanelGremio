import { Router } from 'express';
import * as db from '../data/db';
import { User, GuildMember } from '../types';

const router = Router();

// Middleware to check for admin privileges
const isAdmin = (req: any, res: any, next: any) => {
    const user = (req as any).user;
    if (user && ['Maestro del Gremio', 'Mano Derecha'].includes(user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
};

// Middleware to inject user from session
const injectUser = (req: any, res: any, next: any) => {
    const user = db.findUserFromRequest(req);
    if (user) {
        (req as any).user = user;
    }
    next();
};

// Get all users
router.get('/', injectUser, isAdmin, (req, res) => {
    res.json(db.getAllUsers());
});

// Update a user's role or status
router.patch('/:id', injectUser, isAdmin, (req, res) => {
    const { id } = req.params;
    const updates: { status?: User['status'], role?: GuildMember['role'] } = req.body;
    const actor = (req as any).user;
    
    const user = db.findUserById(id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const originalUser = { ...user };
    const updatedUser = db.updateUser(id, updates);

    if (updates.status && originalUser.status !== updatedUser?.status) {
         db.createAuditLog(actor.id, actor.name, 'user_status_changed', id, 'user', { from: originalUser.status, to: updatedUser?.status });
    }
    if (updates.role && originalUser.role !== updatedUser?.role) {
         db.createAuditLog(actor.id, actor.name, 'user_role_changed', id, 'user', { from: originalUser.role, to: updatedUser?.role });
    }

    res.json(updatedUser);
});

// Delete a user
router.delete('/:id', injectUser, isAdmin, (req, res) => {
    const { id } = req.params;
    const actor = (req as any).user;

    const userToDelete = db.findUserById(id);
     if (!userToDelete) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    if (userToDelete.id === actor.id) {
        return res.status(400).json({ message: "You cannot delete your own account."});
    }

    db.deleteUser(id);
    db.createAuditLog(actor.id, actor.name, 'user_deleted', id, 'user', { deletedUserName: userToDelete.name });
    res.status(200).json({ message: 'User deleted successfully.' });
});

export default router;
