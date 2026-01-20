// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import User from '../models/User';
import logger from '../config/logger';

/**
 * @desc    Search user by email
 * @route   GET /api/users/search?email=user@example.com
 * @access  Private
 */

export const searchUserByEmail = async (req: Request, res: Response) => {

    try {
        const { email } = req.body;

        console.log('📧 Email from body:', email);

        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        const user = await User.findOne({
            email: email
        }).select('_id firstName lastName email college year branch phoneNumber');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. They need to register first.',
            });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to search user',
        });
    }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:userId
 * @access  Private
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        logger.info(`🔍 Fetching user by ID: ${userId}`);

        const user = await User.findById(userId).select('-__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                clerkId: user.clerkId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                college: user.college,
                year: user.year,
                branch: user.branch,
                phoneNumber: user.phoneNumber,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching user: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
        });
    }
};

/**
 * @desc    Search users by name or email (for autocomplete)
 * @route   GET /api/users/search/autocomplete?query=naruto
 * @access  Private
 */
export const searchUsersAutocomplete = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;

        if (!query || typeof query !== 'string' || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Query must be at least 2 characters',
            });
        }

        logger.info(`🔍 Autocomplete search for: ${query}`);

        // Search by firstName, lastName, or email
        const users = await User.find({
            $or: [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
            ],
        })
            .select('_id firstName lastName email')
            .limit(10);

        logger.info(`✅ Found ${users.length} users matching "${query}"`);

        res.json({
            success: true,
            users: users.map((user) => ({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                fullName: `${user.firstName} ${user.lastName}`,
            })),
        });
    } catch (error: any) {
        logger.error(`❌ Error in autocomplete search: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to search users',
        });
    }
};
