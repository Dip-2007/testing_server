
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../src/config/db';
import Event from '../src/models/Event';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const updateMaxCaps = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Update all events that have maxCap = 30 or no maxCap
        const result = await Event.updateMany(
            { 
                $or: [
                    { maxCap: 30 },
                    { maxCap: { $exists: false } }
                ]
            },
            { $set: { maxCap: 50 } }
        );

        console.log(`✨ Updated ${result.modifiedCount} events to MaxCap: 50`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating max caps:', error);
        process.exit(1);
    }
};

updateMaxCaps();
