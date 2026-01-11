// src/controllers/admin/user.controller.ts
import { Request, Response } from 'express';
import User from '../../models/User';
import Order from '../../models/Order';
import logger from '../../config/logger';

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Admin
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { isAdmin, college } = req.query;

        logger.info(`👑 Admin ${req.user.email} fetching all users`);

        const query: any = {};

        if (isAdmin !== undefined) {
            query.isAdmin = isAdmin === 'true';
        }

        if (college) {
            query.college = { $regex: college, $options: 'i' };
        }

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Get order count for each user
        const usersWithStats = await Promise.all(
            users.map(async (user: any) => {
                const orderCount = await Order.countDocuments({ userId: user._id });
                return {
                    ...user,
                    orderCount: orderCount,
                };
            })
        );

        res.json({
            success: true,
            count: users.length,
            users: usersWithStats,
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching users: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
        });
    }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/admin/users/:id
 * @access  Admin
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info(`👑 Admin ${req.user.email} fetching user: ${id}`);

        const user = await User.findById(id).select('-clerkId').lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Get user's orders
        const orders = await Order.find({ userId: id })
            .populate('registrations.eventId', 'name category fees')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            user: user,
            orders: orders,
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching user: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user',
        });
    }
};

/**
 * @desc    Toggle user admin status
 * @route   PUT /api/admin/users/:id/toggle-admin
 * @access  Admin
 */
export const toggleAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info(`👑 Admin ${req.user.email} toggling admin status for user: ${id}`);

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Prevent removing own admin status
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Cannot modify your own admin status',
            });
        }

        user.isAdmin = !user.isAdmin;
        await user.save();

        logger.info(`✅ User ${user.email} is now ${user.isAdmin ? 'ADMIN' : 'USER'}`);

        res.json({
            success: true,
            message: `User ${user.isAdmin ? 'granted' : 'removed'} admin access`,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin: user.isAdmin,
            },
        });
    } catch (error: any) {
        logger.error(`❌ Error toggling admin status: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to toggle admin status',
        });
    }
};
