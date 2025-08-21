import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../data/db';

const router = Router();

const sessions: Record<string, string> = {}; // sessionId -> userId

// Login with test admin user
router.post('/login-admin-test', (req, res) => {
    const adminUser = db.findUserByName('Admin');
    if (!adminUser) {
        return res.status(404).json({ message: 'Admin test user not found.' });
    }
    const sessionId = uuidv4();
    sessions[sessionId] = adminUser.id;
    res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'strict' });
    res.status(200).json(adminUser);
});

// Regular user login
router.post('/login', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }
    const user = db.findUserByName(username);
    if (!user || user.status !== 'active') {
        return res.status(401).json({ message: 'User not found or not active.' });
    }
    const sessionId = uuidv4();
    sessions[sessionId] = user.id;
    res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'strict' });
    res.status(200).json(user);
});

// Register a new user (status: pending)
router.post('/register', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }
    if (db.findUserByName(username)) {
        return res.status(409).json({ message: 'Username already exists.' });
    }
    const newUser = db.createUser(username);
    res.status(201).json(newUser);
});

// Check for an active session
router.get('/session', (req, res) => {
    const { sessionId } = req.cookies;
    if (sessionId && sessions[sessionId]) {
        const user = db.findUserById(sessions[sessionId]);
        if (user) {
            return res.status(200).json(user);
        }
    }
    res.status(401).json({ message: 'No active session.' });
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
