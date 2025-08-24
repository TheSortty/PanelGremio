import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db'; // Importamos Prisma

const router = Router();

// El sistema de sesiones sigue en memoria, lo cual está bien para empezar.
// En el futuro, esto podría moverse a una base de datos (ej. Redis) para mayor escalabilidad.
const sessions: Record<string, string> = {}; // sessionId -> userId

// --- Middleware de Autenticación ---
// Este es el "guardia de seguridad" que usaremos en otras rutas.
export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
    const { sessionId } = req.cookies;
    if (sessionId && sessions[sessionId]) {
        const user = await prisma.user.findUnique({
            where: { id: sessions[sessionId] },
        });
        if (user) {
            req.user = user; // ¡Aquí inyectamos el usuario en la petición!
            return next();
        }
    }
    // Si no hay sesión o el usuario no existe, denegamos el acceso.
    res.status(401).json({ message: 'Authentication required. Please log in.' });
};


// --- Rutas de Autenticación ---

// Login with test admin user
router.post('/login-admin-test', async (req, res) => {
    try {
        let adminUser = await prisma.user.findUnique({
            where: { name: 'Admin' },
        });

        // Si el usuario 'Admin' no existe, lo creamos por primera vez.
        if (!adminUser) {
            adminUser = await prisma.user.create({
                data: {
                    name: 'Admin',
                    role: 'Maestro del Gremio',
                    status: 'active',
                },
            });
        }

        const sessionId = uuidv4();
        sessions[sessionId] = adminUser.id;
        res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'strict' });
        res.status(200).json(adminUser);

    } catch (error) {
        res.status(500).json({ message: 'Error during admin login.' });
    }
});

// Regular user login
router.post('/login', async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { name: username },
        });

        if (!user || user.status !== 'active') {
            return res.status(401).json({ message: 'User not found or not active.' });
        }

        const sessionId = uuidv4();
        sessions[sessionId] = user.id;
        res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'strict' });
        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: 'Error during login.' });
    }
});

// Register a new user (status: pending)
router.post('/register', async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }

    try {
        // Verificamos si ya existe un usuario con ese nombre
        const existingUser = await prisma.user.findUnique({
            where: { name: username },
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        // Creamos el nuevo usuario
        const newUser = await prisma.user.create({
            data: {
                name: username,
                // Prisma se encargará de los valores por defecto ('Invitado', 'pending')
            },
        });

        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: 'Error during registration.' });
    }
});

// Check for an active session
router.get('/session', authMiddleware, (req: any, res) => {
    // Si el middleware 'authMiddleware' pasa, significa que ya tenemos un usuario válido.
    // Simplemente lo devolvemos.
    res.status(200).json(req.user);
});

// Logout
router.post('/logout', (req, res) => {
    const { sessionId } = req.cookies;
    if (sessionId) {
        delete sessions[sessionId];
    }
    res.clearCookie('sessionId');
    res.status(200).json({ message: 'Logout successful.' });
});

export default router;