import { Router, Request, Response } from 'express';
import logger from '../config/logger';
import { cache } from '../middleware/cache';
import healthRoutes from './health/health.routes';

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
router.get('/', cache({ EX: 30 }), (req: Request, res: Response): void => {
    const devJoke = [
        "Why do programmers prefer dark mode? Light attracts bugs! 🐛",
        "There are 10 types of people: those who understand binary and those who don't",
        "404: Humor not found... wait, there it is!"
    ];

    res.json({
        welcome: {
            message: 'Welcome to Xenia API',
            tagline: 'Powering PICT\'s biggest tech event',
            version: '1.0.0'
        },
        quick_start: {
            health: 'GET /ping',
        },
        dev_humor: devJoke[Math.floor(Math.random() * devJoke.length)],
        meta: {
            timestamp: Date.now(),
            cached: true,
            cache_ttl: 30,
            request_id: req.headers['x-request-id'] || 'N/A'
        },
    });
});

router.use('/', healthRoutes);

export default router;
