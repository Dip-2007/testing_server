import { Router, Request, Response } from 'express';
import logger from '../config/logger';
import { cache } from '../middleware/cache';
import healthRoutes from './health/health.routes';
import testRoutes from './test/test.routes';

const router: Router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: API welcome message
 *     tags: [Public]
 *     security: []
 *     responses:
 *       200:
 *         description: Welcome message with API information
 */



router.use('/', healthRoutes);
router.use('/test', testRoutes)

export default router;
