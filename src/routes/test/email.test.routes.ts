// src/routes/test/email.test.routes.ts
import { Router, Request, Response } from 'express';
import { sendOrderCreatedEmail, sendOrderRejectedEmail, sendOrderVerifiedEmail } from '../../services/emailService';
import logger from '../../config/logger';

const router: Router = Router();

// Test email address - change this to test with different email
const TEST_EMAIL = 'pcsbxenia26@gmail.com';

/**
 * Test Order Created Email (Pending Status)
 * GET /test/email/order-created
 * 
 * Tests the email sent when a user creates an order and payment is pending verification
 */
router.get('/order-created', async (req: Request, res: Response) => {
    try {
        const testUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: TEST_EMAIL,
            clerkId: 'test_clerk_123',
            phoneNumber: '9876543210',
            college: 'Test Engineering College',
            year: '3rd' as const,
            branch: 'Computer Science',
            isAdmin: false,
        } as any;

        const testEvents = [
            { name: 'Web Development Workshop', fees: 500 },
            { name: 'Hackathon 2026', fees: 300 },
            { name: 'UI/UX Design Contest', fees: 200 },
        ];

        const totalAmount = testEvents.reduce((sum, e) => sum + e.fees, 0);

        const emailResult = await sendOrderCreatedEmail(
            testUser,
            'ORD000001',
            testEvents,
            totalAmount,
            'TXN123456789ABC'
        );

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Order created email sent successfully!',
                messageId: emailResult.messageId,
                sentTo: testUser.email,
                testData: {
                    orderId: 'ORD000001',
                    transactionId: 'TXN123456789ABC',
                    totalAmount,
                    eventsCount: testEvents.length,
                },
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
 * Test Order Verified Email (With Event Links)
 * GET /test/email/order-verified
 * 
 * Tests the email sent when admin verifies an order - includes event links (WhatsApp, Google Forms, etc.)
 */
router.get('/order-verified', async (req: Request, res: Response) => {
    try {
        const testUser = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: TEST_EMAIL,
            clerkId: 'test_clerk_456',
            phoneNumber: '9876543210',
            college: 'Test Engineering College',
            year: '2nd' as const,
            branch: 'Electronics',
            isAdmin: false,
        } as any;

        // Events with links - these links are shown only to verified users
        const testEvents = [
            {
                name: 'Web Development Workshop',
                venue: 'Computer Lab A, Block C',
                eventDate: new Date('2026-02-15T10:00:00Z'),
                links: [
                    { name: 'Join WhatsApp Group', link: 'https://chat.whatsapp.com/xyz123' },
                    { name: 'Pre-Event Survey', link: 'https://forms.google.com/survey123' },
                ],
            },
            {
                name: 'Hackathon 2026',
                venue: 'Main Auditorium',
                eventDate: new Date('2026-02-20T09:00:00Z'),
                links: [
                    { name: 'Join WhatsApp Group', link: 'https://chat.whatsapp.com/hackathon2026' },
                    { name: 'Submit Problem Statement Choice', link: 'https://forms.google.com/ps-choice' },
                    { name: 'Discord Server', link: 'https://discord.gg/hackathon2026' },
                ],
            },
            {
                name: 'UI/UX Design Contest',
                venue: 'Design Studio, Floor 2',
                eventDate: new Date('2026-02-22T14:00:00Z'),
                links: [
                    { name: 'Join WhatsApp Group', link: 'https://chat.whatsapp.com/uiux2026' },
                ],
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
                testData: {
                    orderId: 'ORD000002',
                    eventsCount: testEvents.length,
                    totalLinks: testEvents.reduce((sum, e) => sum + (e.links?.length || 0), 0),
                },
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
 * Test Order Verified Email (Without Links)
 * GET /test/email/order-verified-no-links
 * 
 * Tests verified email for events that don't have any links configured
 */
router.get('/order-verified-no-links', async (req: Request, res: Response) => {
    try {
        const testUser = {
            firstName: 'Alex',
            lastName: 'Johnson',
            email: TEST_EMAIL,
            clerkId: 'test_clerk_789',
            phoneNumber: '9876543210',
            college: 'Test Engineering College',
            year: '1st' as const,
            branch: 'IT',
            isAdmin: false,
        } as any;

        // Events without links
        const testEvents = [
            {
                name: 'Solo Singing Competition',
                venue: 'Open Air Theatre',
                eventDate: new Date('2026-02-18T16:00:00Z'),
            },
            {
                name: 'Photography Contest',
                venue: 'Campus Grounds',
                eventDate: new Date('2026-02-19T08:00:00Z'),
            },
        ];

        const emailResult = await sendOrderVerifiedEmail(
            testUser,
            'ORD000005',
            testEvents
        );

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Order verified email (no links) sent successfully!',
                messageId: emailResult.messageId,
                sentTo: testUser.email,
                testData: {
                    orderId: 'ORD000005',
                    eventsCount: testEvents.length,
                    hasLinks: false,
                },
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
 * 
 * Tests the email sent when admin rejects an order due to payment issues
 */
router.get('/order-rejected', async (req: Request, res: Response) => {
    try {
        const testUser = {
            firstName: 'Bob',
            lastName: 'Wilson',
            email: TEST_EMAIL,
            clerkId: 'test_clerk_999',
            phoneNumber: '9876543210',
            college: 'Test Engineering College',
            year: '4th' as const,
            branch: 'Mechanical',
            isAdmin: false,
        } as any;

        const emailResult = await sendOrderRejectedEmail(
            testUser,
            'ORD000003',
            'TXN987654321XYZ',
            'Transaction ID could not be verified in our bank records. Please ensure you have entered the correct UTR/Transaction ID.'
        );

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Order rejected email sent successfully!',
                messageId: emailResult.messageId,
                sentTo: testUser.email,
                testData: {
                    orderId: 'ORD000003',
                    transactionId: 'TXN987654321XYZ',
                    hasReason: true,
                },
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
 * Test Order Rejected Email (Without Reason)
 * GET /test/email/order-rejected-no-reason
 * 
 * Tests rejection email when no specific reason is provided
 */
router.get('/order-rejected-no-reason', async (req: Request, res: Response) => {
    try {
        const testUser = {
            firstName: 'Charlie',
            lastName: 'Brown',
            email: TEST_EMAIL,
            clerkId: 'test_clerk_000',
            phoneNumber: '9876543210',
            college: 'Test Engineering College',
            year: '3rd' as const,
            branch: 'Civil',
            isAdmin: false,
        } as any;

        const emailResult = await sendOrderRejectedEmail(
            testUser,
            'ORD000004',
            'TXN555555555'
            // No rejection reason provided
        );

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Order rejected email (no reason) sent successfully!',
                messageId: emailResult.messageId,
                sentTo: testUser.email,
                testData: {
                    orderId: 'ORD000004',
                    transactionId: 'TXN555555555',
                    hasReason: false,
                },
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
 * Test All Emails
 * GET /test/email/all
 * 
 * Sends all email types in sequence for comprehensive testing
 */
router.get('/all', async (req: Request, res: Response) => {
    try {
        const results: any[] = [];
        const testUser = {
            firstName: 'Test',
            lastName: 'User',
            email: TEST_EMAIL,
            clerkId: 'test_clerk_all',
            phoneNumber: '9876543210',
            college: 'Test Engineering College',
            year: '2nd' as const,
            branch: 'CSE',
            isAdmin: false,
        } as any;

        // 1. Order Created
        const createdResult = await sendOrderCreatedEmail(
            testUser,
            'ORD-TEST-001',
            [{ name: 'Test Event', fees: 100 }],
            100,
            'TXN-TEST-001'
        );
        results.push({ type: 'order-created', success: createdResult.success });

        // 2. Order Verified (with links)
        const verifiedResult = await sendOrderVerifiedEmail(
            testUser,
            'ORD-TEST-002',
            [{
                name: 'Test Event',
                venue: 'Test Venue',
                links: [
                    { name: 'WhatsApp Group', link: 'https://chat.whatsapp.com/test' },
                    { name: 'Google Form', link: 'https://forms.google.com/test' },
                ],
            }]
        );
        results.push({ type: 'order-verified', success: verifiedResult.success });

        // 3. Order Rejected
        const rejectedResult = await sendOrderRejectedEmail(
            testUser,
            'ORD-TEST-003',
            'TXN-TEST-003',
            'Test rejection reason'
        );
        results.push({ type: 'order-rejected', success: rejectedResult.success });

        const allSuccess = results.every((r) => r.success);

        res.json({
            success: allSuccess,
            message: allSuccess ? 'All test emails sent!' : 'Some emails failed',
            sentTo: TEST_EMAIL,
            results,
        });
    } catch (error: any) {
        logger.error(`Test all emails failed: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
