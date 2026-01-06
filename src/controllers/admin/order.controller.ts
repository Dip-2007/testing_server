// src/controllers/admin/order.controller.ts
import { Request, Response } from 'express';
import Order from '../../models/Order';
import logger from '../../config/logger';
import { sendOrderVerifiedEmail, sendOrderRejectedEmail } from '../../services/emailService';


/**
 * @desc    Get all orders
 * @route   GET /api/admin/orders
 * @access  Admin
 */

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { status, eventId } = req.query;

        logger.info(`👑 Admin ${req.user.email} fetching all orders`);

        const query: any = {};

        if (status) {
            query.status = status;
        }

        if (eventId) {
            query['registrations.eventId'] = eventId;
        }

        const orders: any[] = await Order.find(query)
            .populate('userId', 'firstName lastName email phoneNumber college')
            .populate('registrations.eventId', 'name category fees')
            .populate('registrations.teamMembers', 'firstName lastName email phoneNumber')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: orders.length,
            summary: {
                total: orders.length,
                pending: orders.filter((o) => o.status === 'PENDING').length,
                verified: orders.filter((o) => o.status === 'VERIFIED').length,
                rejected: orders.filter((o) => o.status === 'REJECTED').length,
            },
            orders: orders,
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching orders: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
        });
    }
};

/**
 * @desc    Get single order by ID
 * @route   GET /api/admin/orders/:id
 * @access  Admin
 */
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info(`👑 Admin ${req.user.email} fetching order: ${id}`);

        const order: any = await Order.findOne({ orderId: id })
            .populate('userId', 'firstName lastName email phoneNumber college year branch')
            .populate('registrations.eventId', 'name category fees venue logo')
            .populate('registrations.teamMembers', 'firstName lastName email phoneNumber college year branch')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        res.json({
            success: true,
            order: order,
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching order: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order',
        });
    }
};

/**
 * @desc    Verify order (approve payment)
 * @route   PUT /api/admin/orders/:id/verify
 * @access  Admin
 */
export const verifyOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info(`👑 Admin ${req.user.email} verifying order: ${id}`);

        const order: any = await Order.findOne({ orderId: id })
            .populate('userId', 'firstName lastName email')
            .populate('registrations.eventId', 'name venue');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        if (order.status === 'VERIFIED') {
            return res.status(400).json({
                success: false,
                error: 'Order is already verified',
            });
        }

        order.status = 'VERIFIED';
        order.verifiedAt = new Date();
        order.rejectionReason = undefined;
        await order.save();

        logger.info(`✅ Order verified: ${order.orderId} by admin ${req.user.email}`);

        // ✅ Send email notification
        try {
            const events = order.registrations.map((reg: any) => ({
                name: reg.eventId.name,
                venue: reg.eventId.venue,
            }));

            await sendOrderVerifiedEmail(order.userId, order.orderId, events);
        } catch (emailError: any) {
            logger.error(`❌ Failed to send verification email: ${emailError.message}`);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Order verified successfully. Confirmation email sent to user.',
            order: {
                orderId: order.orderId,
                status: order.status,
                verifiedAt: order.verifiedAt,
            },
        });
    } catch (error: any) {
        logger.error(`❌ Error verifying order: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to verify order',
        });
    }
};

/**
 * @desc    Reject order (payment issue)
 * @route   PUT /api/admin/orders/:id/reject
 * @access  Admin
 */
export const rejectOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Rejection reason is required',
            });
        }

        logger.info(`👑 Admin ${req.user.email} rejecting order: ${id}`);

        const order: any = await Order.findOne({ orderId: id })
            .populate('userId', 'firstName lastName email');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        if (order.status === 'VERIFIED') {
            return res.status(400).json({
                success: false,
                error: 'Cannot reject a verified order',
            });
        }

        order.status = 'REJECTED';
        order.rejectionReason = reason.trim();
        order.verifiedAt = undefined;
        await order.save();

        logger.info(`❌ Order rejected: ${order.orderId} by admin ${req.user.email}. Reason: ${reason}`);

        // ✅ Send email notification
        try {
            await sendOrderRejectedEmail(
                order.userId,
                order.orderId,
                order.transactionId,
                reason.trim()
            );
        } catch (emailError: any) {
            logger.error(`❌ Failed to send rejection email: ${emailError.message}`);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Order rejected successfully. Notification email sent to user.',
            order: {
                orderId: order.orderId,
                status: order.status,
                rejectionReason: order.rejectionReason,
            },
        });
    } catch (error: any) {
        logger.error(`❌ Error rejecting order: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to reject order',
        });
    }
};
