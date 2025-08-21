import { Router } from 'express';
import * as db from '../data/db';

const router = Router();

// Get guild members
router.get('/members', (req, res) => {
    res.json(db.getGuildMembers());
});

// Get member activity logs
router.get('/activity', (req, res) => {
    res.json(db.getActivityLogs());
});

export default router;
