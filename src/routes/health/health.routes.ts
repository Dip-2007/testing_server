// src/routes/health.routes.ts
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import logger from '../../config/logger';
import getRedisClient from '../../config/redis';
// import getRedisClient from '';
// import logger from '../config/logger';

const router: Router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Comprehensive health check
 *     description: Returns the health status of API, database, and cache
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: All services healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: One or more services unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
    const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            database: {
                status: 'unknown',
                responseTime: 0,
            },
            redis: {
                status: 'unknown',
                responseTime: 0,
            },
        },
    };

    let isHealthy = true;

    // Check MongoDB connection
    try {
        const dbStart = Date.now();
        const dbState = mongoose.connection.readyState;

        if (dbState === 1) {
            // 1 = connected, perform a simple query
            await mongoose.connection.db?.admin().ping();
            healthCheck.services.database.status = 'connected';
            healthCheck.services.database.responseTime = Date.now() - dbStart;
        } else {
            healthCheck.services.database.status = 'disconnected';
            isHealthy = false;
        }
    } catch (error) {
        logger.error(`Database health check failed: ${error}`);
        healthCheck.services.database.status = 'error';
        isHealthy = false;
    }

    // Check Redis connection
    try {
        const redisStart = Date.now();
        const redis = getRedisClient();
        await redis.ping();
        healthCheck.services.redis.status = 'connected';
        healthCheck.services.redis.responseTime = Date.now() - redisStart;
    } catch (error) {
        logger.error(`Redis health check failed: ${error}`);
        healthCheck.services.redis.status = 'error';
        isHealthy = false;
    }

    if (!isHealthy) {
        healthCheck.status = 'unhealthy';
        res.status(503).json(healthCheck);
        return;
    }

    res.status(200).json(healthCheck);
});

/**
 * @swagger
 * /ping:
 *   get:
 *     summary: Simple ping endpoint
 *     description: Quick health check without checking dependencies
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is responding
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Xenia API is running!
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/ping', (req: Request, res: Response): void => {
    logger.info('Ping endpoint called');
    res.json({
        message: 'Xenia API is running!',
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});

export default router;
