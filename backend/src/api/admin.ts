import { Router } from 'express';
import * as db from '../data/db';

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

// Get audit logs
router.get('/logs', injectUser, isAdmin, (req, res) => {
    res.json(db.getAuditLogs());
});

export default router;
