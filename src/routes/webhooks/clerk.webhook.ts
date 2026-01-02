import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import User from '../../models/User';
import logger from '../../config/logger';

const router: Router = Router();

// Webhook event types from Clerk
interface ClerkWebhookEvent {
    type: 'user.created' | 'user.updated' | 'user.deleted';
    data: {
        id: string;
        email_addresses: Array<{
            email_address: string;
            verification: { status: string };
        }>;
        first_name: string;
        last_name: string;
        unsafe_metadata?: {
            college?: string;
            year?: string;
            branch?: string;
            phoneNumber?: string;
        };
    };
}

/**
 * POST /webhooks/clerk
 * Handles Clerk webhook events (user.created, user.updated, user.deleted)
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            logger.error('❌ CLERK_WEBHOOK_SECRET is not defined');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        // Get the headers and body
        const headers = req.headers;
        const payload = req.body;

        // Get Svix headers for verification
        const svix_id = headers['svix-id'] as string;
        const svix_timestamp = headers['svix-timestamp'] as string;
        const svix_signature = headers['svix-signature'] as string;

        // If there are no headers, error out
        if (!svix_id || !svix_timestamp || !svix_signature) {
            logger.error('❌ Missing Svix headers');
            return res.status(400).json({ error: 'Missing svix headers' });
        }

        // Create a new Svix instance with your webhook secret
        const wh = new Webhook(WEBHOOK_SECRET);

        let evt: ClerkWebhookEvent;

        // Verify the webhook signature
        try {
            evt = wh.verify(payload, {
                'svix-id': svix_id,
                'svix-timestamp': svix_timestamp,
                'svix-signature': svix_signature,
            }) as ClerkWebhookEvent;
        } catch (err: any) {
            logger.error(`❌ Webhook signature verification failed: ${err.message}`);
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Handle the webhook event
        const { type, data } = evt;

        logger.info(`📨 Received webhook event: ${type}`);

        // Handle user.created event
        if (type === 'user.created') {
            const primaryEmail = data.email_addresses.find(
                (email) => email.verification.status === 'verified'
            );

            if (!primaryEmail) {
                logger.error('❌ No verified email found for user');
                return res.status(400).json({ error: 'No verified email' });
            }

            // Create user in MongoDB
            const newUser = await User.create({
                clerkId: data.id,
                email: primaryEmail.email_address,
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                college: data.unsafe_metadata?.college || '',
                year: data.unsafe_metadata?.year || '',
                branch: data.unsafe_metadata?.branch || '',
                phoneNumber: data.unsafe_metadata?.phoneNumber || '',
                isAdmin: false,
            });

            logger.info(`✅ User created in MongoDB: ${newUser.email} (Clerk ID: ${data.id})`);
        }

        // Handle user.updated event
        if (type === 'user.updated') {
            const primaryEmail = data.email_addresses.find(
                (email) => email.verification.status === 'verified'
            );

            await User.findOneAndUpdate(
                { clerkId: data.id },
                {
                    email: primaryEmail?.email_address,
                    firstName: data.first_name || '',
                    lastName: data.last_name || '',
                    college: data.unsafe_metadata?.college || '',
                    year: data.unsafe_metadata?.year || '',
                    branch: data.unsafe_metadata?.branch || '',
                    phoneNumber: data.unsafe_metadata?.phoneNumber || '',
                },
                { new: true }
            );

            logger.info(`✅ User updated in MongoDB: ${data.id}`);
        }

        // Handle user.deleted event
        if (type === 'user.deleted') {
            await User.findOneAndDelete({ clerkId: data.id });
            logger.info(`✅ User deleted from MongoDB: ${data.id}`);
        }

        return res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error: any) {
        logger.error(`❌ Webhook handler error: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
