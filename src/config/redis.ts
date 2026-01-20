import Redis from 'ioredis';
import logger from './logger';

let redis: Redis | null = null;

const getRedisClient = (): Redis => {
    if (redis) {
        return redis;
    }

    try {
        redis = new Redis(process.env.REDIS_URL as string, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError(err) {
                logger.error(`Redis reconnect error: ${err.message}`);
                return true;
            },
        });

        redis.on('connect', () => {
            logger.info('✅ Redis connected');
        });

        redis.on('error', (err) => {
            logger.error(`❌ Redis error: ${err.message}`);
        });

        return redis;
    } catch (error) {
        logger.error(`❌ Redis initialization failed: ${error}`);
        throw error;
    }
};

export default getRedisClient;
