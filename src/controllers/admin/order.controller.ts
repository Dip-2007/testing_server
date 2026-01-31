// src/controllers/admin/order.controller.ts
import { Request, Response } from 'express';
import Order from '../../models/Order';
import Event from '../../models/Event';
import logger from '../../config/logger';
import { sendOrderVerifiedEmail, sendOrderRejectedEmail } from '../../services/emailService';
import mongoose from 'mongoose';

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

        // ✅ Calculate total revenue
        const totalRevenue = orders
            .filter((o) => o.status === 'VERIFIED')
            .reduce((sum, o) => sum + o.totalAmount, 0);

        res.json({
            success: true,
            count: orders.length,
            summary: {
                total: orders.length,
                pending: orders.filter((o) => o.status === 'PENDING').length,
                verified: orders.filter((o) => o.status === 'VERIFIED').length,
                rejected: orders.filter((o) => o.status === 'REJECTED').length,
                totalRevenue,
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

        // ✅ FIXED - Try both _id and orderId
        let order: any;

        if (mongoose.Types.ObjectId.isValid(id)) {
            // Try searching by MongoDB _id
            order = await Order.findById(id)
                .populate('userId', 'firstName lastName email phoneNumber college year branch')
                .populate('registrations.eventId', 'name category fees venue logo')
                .populate('registrations.teamMembers', 'firstName lastName email phoneNumber college year branch')
                .lean();
        }

        // If not found, try searching by orderId (ORD000001 format)
        if (!order) {
            order = await Order.findOne({ orderId: id })
                .populate('userId', 'firstName lastName email phoneNumber college year branch')
                .populate('registrations.eventId', 'name category fees venue logo')
                .populate('registrations.teamMembers', 'firstName lastName email phoneNumber college year branch')
                .lean();
        }

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

        // ✅ First, find the order to check its current status
        let existingOrder: any;

        if (mongoose.Types.ObjectId.isValid(id)) {
            existingOrder = await Order.findById(id).lean();
        }

        if (!existingOrder) {
            existingOrder = await Order.findOne({ orderId: id }).lean();
        }

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        // ✅ Check if already verified BEFORE updating
        if (existingOrder.status === 'VERIFIED') {
            return res.status(400).json({
                success: false,
                error: 'Order is already verified',
            });
        }

        // ✅ Now update the order
        const order: any = await Order.findByIdAndUpdate(
            existingOrder._id,
            {
                status: 'VERIFIED',
                verifiedAt: new Date(),
                $unset: { rejectionReason: 1 }
            },
            { new: true, runValidators: false }
        )
            .populate('userId', 'firstName lastName email')
            .populate('registrations.eventId', '_id name venue');

        logger.info(`✅ Order verified: ${order.orderId} by admin ${req.user.email}`);

        // ✅ Send email notification with event links
        try {
            // Fetch full event details including links
            const eventIds = order.registrations.map((reg: any) => reg.eventId._id);
            const eventsWithLinks = await Event.find({ _id: { $in: eventIds } })
                .select('name venue links')
                .lean();

            // Create a map for quick lookup
            const eventMap = new Map(eventsWithLinks.map((e: any) => [e._id.toString(), e]));

            const events = order.registrations.map((reg: any) => {
                const eventId = reg.eventId._id.toString();
                const fullEvent: any = eventMap.get(eventId);

                return {
                    name: reg.eventId.name,
                    venue: reg.eventId.venue,
                    links: fullEvent?.links || [],
                };
            });

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

        // ✅ First, find the order to check its current status
        let existingOrder: any;

        if (mongoose.Types.ObjectId.isValid(id)) {
            existingOrder = await Order.findById(id).lean();
        }

        if (!existingOrder) {
            existingOrder = await Order.findOne({ orderId: id }).lean();
        }

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        // ✅ Check if already verified BEFORE updating
        if (existingOrder.status === 'VERIFIED') {
            return res.status(400).json({
                success: false,
                error: 'Cannot reject a verified order',
            });
        }

        // ✅ Now update the order
        const order: any = await Order.findByIdAndUpdate(
            existingOrder._id,
            {
                status: 'REJECTED',
                rejectionReason: reason.trim(),
                $unset: { verifiedAt: 1 }
            },
            { new: true, runValidators: false }
        )
            .populate('userId', 'firstName lastName email');

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