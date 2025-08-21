import { Router } from 'express';
import authRouter from './auth';
import usersRouter from './users';
import buildsRouter from './builds';
import itemsRouter from './items';
import guildRouter from './guild';
import adminRouter from './admin';
import aiRouter from './ai';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/builds', buildsRouter);
router.use('/items', itemsRouter);
router.use('/guild', guildRouter);
router.use('/admin', adminRouter);
router.use('/ai', aiRouter);

export default router;
