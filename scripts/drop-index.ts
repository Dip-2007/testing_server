
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const dropIndex = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const collection = mongoose.connection.collection('orders');
        
        // Check if index exists
        const indexes = await collection.indexes();
        const transactionIndex = indexes.find(idx => idx.name === 'transactionId_1');

        if (transactionIndex) {
            console.log('🔄 Found existing transactionId index:', transactionIndex);
            
            // Drop index
            await collection.dropIndex('transactionId_1');
            console.log('✅ Successfully dropped transactionId index');
            
            // Re-create is handled by app startup, or we can do it here
            // But usually app restart is enough
        } else {
            console.log('ℹ️ transactionId index not found');
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

dropIndex();
