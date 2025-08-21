import { Router } from 'express';
import * as db from '../data/db';
import { Item } from '../types';

const router = Router();

// Get items with optional search and type filters
router.get('/', (req, res) => {
    const type = req.query.type as Item['type'] | undefined;
    const search = req.query.search as string | undefined;

    if (!type) {
        return res.status(400).json({ message: 'Item type is required.' });
    }

    const items = db.getItems(type, search);
    res.json(items);
});

export default router;
