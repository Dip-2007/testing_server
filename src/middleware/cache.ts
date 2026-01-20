// src/middleware/cache.ts
import { Request, Response, NextFunction } from 'express';
import getRedisClient from '../config/redis';
import logger from '../config/logger';

interface CacheOptions {
    EX?: number; // Expiry in seconds
    prefix?: string;
}

const DEFAULT_CACHE_TIME = 300; // 5 minutes
const CACHE_PREFIX = 'xenia';

/**
 * Generate cache key from request
 */
const generateCacheKey = (req: Request, prefix: string): string => {
    const { path, query } = req;
    const queryString = JSON.stringify(query);
    return `${prefix}:${path}:${queryString}`;
};

/**
 * Redis caching middleware
 */
export const cache = (options: CacheOptions = {}) => {
    const { EX = DEFAULT_CACHE_TIME, prefix = CACHE_PREFIX } = options;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            const redis = getRedisClient();
            const cacheKey = generateCacheKey(req, prefix);

            logger.debug(`🔍 Checking cache for key: ${cacheKey}`);

            // Try to get cached data
            const cachedData = await redis.get(cacheKey);

            if (cachedData) {
                logger.info(`✅ Cache HIT for: ${cacheKey}`);
                res.json({
                    ...JSON.parse(cachedData),
                    cached: true,
                    cacheKey,
                });
                return;
            }

            logger.info(`❌ Cache MISS for: ${cacheKey}`);

            // Store original res.json function
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = function (data: any) {
                // Cache the response
                redis
                    .set(cacheKey, JSON.stringify(data), 'EX', EX)
                    .then(() => {
                        logger.info(`💾 Cached data for: ${cacheKey} (expires in ${EX}s)`);
                    })
                    .catch((err) => {
                        logger.error(`❌ Failed to cache data: ${err.message}`);
                    });

                // Send response
                return originalJson(data);
            };

            next();
        } catch (error) {
            logger.error(`❌ Cache middleware error: ${error}`);
            // Continue without caching if Redis fails
            next();
        }
    };
};

/**
 * Clear cache by pattern
 */

export const clearCache = async (pattern: string): Promise<number> => {
    try {
        const redis = getRedisClient();
        const keys = await redis.keys(pattern);

        if (keys.length === 0) {
            logger.info(`No cache keys found for pattern: ${pattern}`);
            return 0;
        }

        const deleted = await redis.del(...keys);
        logger.info(`🗑️ Cleared ${deleted} cache keys for pattern: ${pattern}`);
        return deleted;
    } catch (error) {
        logger.error(`❌ Failed to clear cache: ${error}`);
        return 0;
    }
};
