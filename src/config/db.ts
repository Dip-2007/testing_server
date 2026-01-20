import mongoose from 'mongoose';
import logger from './logger';

import '../models/User';
import '../models/Event';
import '../models/Order';

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
        logger.info(`✅ Database: ${conn.connection.name}`);

        await ensureIndexes(); ``

    } catch (error: any) {
        logger.error(`❌ MongoDB Error: ${error.message}`);
        process.exit(1);
    }
};


const ensureIndexes = async (): Promise<void> => {
    try {
        const models = mongoose.modelNames();

        for (const modelName of models) {
            const model = mongoose.model(modelName);
            await model.createIndexes();
            logger.info(`✅ Indexes created for ${modelName}`);
        }
    } catch (error: any) {
        logger.warn(`⚠️ Error creating indexes: ${error.message}`);
    }
};

mongoose.connection.on('error', (err) => {
    logger.error(`❌ MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ MongoDB disconnected');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed due to app termination');
    process.exit(0);
});

export default connectDB;
