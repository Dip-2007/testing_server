import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../src/config/db';
import Event from '../src/models/Event';

dotenv.config({ path: path.join(__dirname, '../.env') });

const updateFees = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // 1. Update Hackathons: fees = 75
        const hackathonResult = await Event.updateMany(
            { isHackathon: true },
            { $set: { fees: 75 } }
        );
        console.log(`✨ Updated ${hackathonResult.modifiedCount} Hackathon events to Fees: 75`);

        // 2. Update Non-Hackathons: fees = 0
        // We use $ne: true to catch false or undefined
        const otherEventsResult = await Event.updateMany(
            { isHackathon: { $ne: true } },
            { $set: { fees: 0 } }
        );
        console.log(`✨ Updated ${otherEventsResult.modifiedCount} regular events to Fees: 0`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating fees:', error);
        process.exit(1);
    }
};

updateFees();
