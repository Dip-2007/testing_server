// src/routes/test.routes.ts
import { Router, Request, Response } from 'express';
import { sendOrderCreatedEmail, sendOrderRejectedEmail, sendOrderVerifiedEmail } from '../../services/emailService';
import logger from '../../config/logger';


const router: Router = Router();

/**
 * Test Order Created Email
 * GET /test/email/order-created
 */
router.get('/order-created', async (req: Request, res: Response) => {
    try {
        // Hardcoded test data
        const testUser = {
            name: 'John Doe',
            email: 'pcsbxenia26@gmail.com',
            clerkId: 'test_clerk_123',
            mobile: '9876543210',
            college: 'Test College',
            year: '3rd' as const,
            branch: 'Computer Science',
            isAdmin: false,
        } as any;

        const testEvents = [
            { name: 'Web Development Workshop', fees: 500 },
            { name: 'Hackathon Competition', fees: 300 },
        ];

        const emailResult = await sendOrderCreatedEmail(
            testUser,
            'ORD000001',
            testEvents,
            800,
            'TXN123456789'
        );

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Order created email sent successfully!',
                messageId: emailResult.messageId,
                sentTo: testUser.email,
            });
        } else {
            res.status(500).json({
                success: false,
                error: emailResult.error,
            });
        }
    } catch (error: any) {
        logger.error(`Test email failed: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Test Order Verified Email
 * GET /test/email/order-verified
 */
router.get('/order-verified', async (req: Request, res: Response) => {
    try {
        const testUser = {
            name: 'Jane Smith',
            email: 'pcsbxenia26@gmail.com',
            clerkId: 'test_clerk_456',
            mobile: '9876543210',
            college: 'Test College',
            year: '2nd' as const,
            branch: 'Electronics',
            isAdmin: false,
        } as any;

        const testEvents = [
            {
                name: 'Web Development Workshop',
                venue: 'Computer Lab A',
                eventDate: new Date('2026-02-15T10:00:00Z'),
            },
            {
                name: 'Hackathon Competition',
                venue: 'Auditorium',
                eventDate: new Date('2026-02-20T14:00:00Z'),
            },
        ];

        const emailResult = await sendOrderVerifiedEmail(
            testUser,
            'ORD000002',
            testEvents
        );

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Order verified email sent successfully!',
                messageId: emailResult.messageId,
                sentTo: testUser.email,
            });
        } else {
            res.status(500).json({
                success: false,
                error: emailResult.error,
            });
        }
    } catch (error: any) {
        logger.error(`Test email failed: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Test Order Rejected Email
 * GET /test/email/order-rejected
 */
router.get('/order-rejected', async (req: Request, res: Response) => {
    try {
        const testUser = {
            name: 'Bob Wilson',
            email: 'pcsbxenia26@gmail.com',
            clerkId: 'test_clerk_789',
            mobile: '9876543210',
            college: 'Test College',
            year: '4th' as const,
            branch: 'Mechanical',
            isAdmin: false,
        } as any;

        const emailResult = await sendOrderRejectedEmail(
            testUser,
            'ORD000003',
            'TXN987654321',
            'Transaction ID could not be verified in our bank records'
        );

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Order rejected email sent successfully!',
                messageId: emailResult.messageId,
                sentTo: testUser.email,
            });
        } else {
            res.status(500).json({
                success: false,
                error: emailResult.error,
            });
        }
    } catch (error: any) {
        logger.error(`Test email failed: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
