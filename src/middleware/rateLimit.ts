// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import getRedisClient from '../config/redis';
import logger from '../config/logger';

const redis = getRedisClient();

//  API limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000,
    store: new RedisStore({
        // @ts-expect-error - Redis client type compatibility
        sendCommand: (...args: string[]) => redis.call(...args),
    }),
    message: {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Max 100 requests per 15 minutes.',
    },
    standardHeaders: true,
    handler: (req, res) => {
        logger.warn(`⚠️ Rate limit exceeded - IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter: 900
        });
    }
});

// Strict limiter for sensitive operations
export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    store: new RedisStore({
        // @ts-expect-error - Redis client type compatibility
        sendCommand: (...args: string[]) => redis.call(...args),
    }),
    message: 'Too many requests. Please wait before trying again.'
});

// Public endpoint limiter (more generous)
export const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 4000,
    store: new RedisStore({
        // @ts-expect-error - Redis client type compatibility
        sendCommand: (...args: string[]) => redis.call(...args),
    }),
});
