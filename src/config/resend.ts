// src/config/resend.ts
import { Resend } from 'resend';
import logger from './logger';
// import dotenv from 'dotenv';
// dotenv.config();

if (!process.env.RESEND_API_KEY) {
    logger.error('RESEND_API_KEY is not defined');
    // throw new Error('RESEND_API_KEY is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

logger.info('✅ Email Service initialized');

export default resend;
