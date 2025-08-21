import { Router } from 'express';
import * as db from '../data/db';
import { Build } from '../types';

const router = Router();

// Get all builds
router.get('/', (req, res) => {
    res.json(db.getBuilds());
});

// Create a new build
router.post('/', (req, res) => {
    const newBuild: Build = req.body;
    // Here you would normally validate the build object
    const createdBuild = db.createBuild(newBuild);
    res.status(201).json(createdBuild);
});

export default router;
