
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Event from '../src/models/Event';
import Order from '../src/models/Order';

import connectDB from '../src/config/db';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const backfillCounts = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB');

        const events = await Event.find({});
        console.log(`📊 Found ${events.length} events. Starting backfill...`);

        for (const event of events) {
            // Count valid registrations (PENDING or VERIFIED)
            const count = await Order.countDocuments({
                'registrations.eventId': event._id,
                status: { $in: ['PENDING', 'VERIFIED'] }
            });

            // Update event
            const update: any = { registeredCount: count };
            
            // Set default maxCap if not present
            if (!event.maxCap) {
                update.maxCap = 30;
            }

            await Event.findByIdAndUpdate(event._id, update);
            console.log(`✅ Updated "${event.name}": Count = ${count}, MaxCap = ${update.maxCap || event.maxCap}`);
        }

        console.log('✨ Backfill complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during backfill:', error);
        process.exit(1);
    }
};

backfillCounts();
