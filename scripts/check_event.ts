
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../src/config/db';
import Event from '../src/models/Event';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkEvent = async () => {
    try {
        await connectDB();
        const event = await Event.findOne({ name: 'Code Rewind Jr' });
        console.log('Event:', JSON.stringify(event, null, 2));
        if (event) {
            console.log('MaxCap:', event.maxCap);
            console.log('RegisteredCount:', event.registeredCount);
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkEvent();
