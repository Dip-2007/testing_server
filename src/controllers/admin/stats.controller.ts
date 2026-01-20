// src/controllers/admin/stats.controller.ts
import { Request, Response } from 'express';
import User from '../../models/User';
import Event from '../../models/Event';
import Order from '../../models/Order';
import logger from '../../config/logger';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Admin
 */
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        logger.info(`👑 Admin ${req.user.email} fetching dashboard stats`);

        // User stats
        const totalUsers = await User.countDocuments();
        const adminUsers = await User.countDocuments({ isAdmin: true });

        // Event stats
        const totalEvents = await Event.countDocuments();
        const activeEvents = await Event.countDocuments({ isActive: true });

        // Order stats
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'PENDING' });
        const verifiedOrders = await Order.countDocuments({ status: 'VERIFIED' });
        const rejectedOrders = await Order.countDocuments({ status: 'REJECTED' });

        // Revenue stats
        const verifiedOrdersData: any[] = await Order.find({ status: 'VERIFIED' }).lean();
        const totalRevenue = verifiedOrdersData.reduce((sum, order) => sum + order.totalAmount, 0);
        const pendingOrdersData: any[] = await Order.find({ status: 'PENDING' }).lean();
        const pendingRevenue = pendingOrdersData.reduce((sum, order) => sum + order.totalAmount, 0);

        // Recent orders
        const recentOrders: any[] = await Order.find()
            .populate('userId', 'firstName lastName email')
            .populate('registrations.eventId', 'name')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Popular events
        const popularEvents = await Order.aggregate([
            { $match: { status: { $in: ['PENDING', 'VERIFIED'] } } },
            { $unwind: '$registrations' },
            {
                $group: {
                    _id: '$registrations.eventId',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);

        // Populate event names
        const popularEventsWithNames = await Promise.all(
            popularEvents.map(async (item) => {
                const event = await Event.findById(item._id).select('name category fees').lean();
                return {
                    event: event,
                    registrations: item.count,
                };
            })
        );

        // Orders by status over time (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentOrdersByDay = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        status: '$status',
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.date': 1 } },
        ]);

        res.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    admins: adminUsers,
                    regular: totalUsers - adminUsers,
                },
                events: {
                    total: totalEvents,
                    active: activeEvents,
                    inactive: totalEvents - activeEvents,
                },
                orders: {
                    total: totalOrders,
                    pending: pendingOrders,
                    verified: verifiedOrders,
                    rejected: rejectedOrders,
                },
                revenue: {
                    total: totalRevenue,
                    pending: pendingRevenue,
                    average: verifiedOrders > 0 ? Math.round(totalRevenue / verifiedOrders) : 0,
                },
            },
            recentOrders: recentOrders.slice(0, 10),
            popularEvents: popularEventsWithNames,
            ordersTrend: recentOrdersByDay,
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching dashboard stats: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics',
        });
    }
};
