// src/controllers/profile.controller.ts
import { Request, Response } from 'express';
import Order from '../models/Order';
import logger from '../config/logger';

/**
 * @desc    Get current user profile with teams and events
 * @route   GET /api/profile
 * @access  Private
 */
export const getProfile = async (req: Request, res: Response) => {
    try {
        logger.info(`📋 User ${req.user.email} fetching profile`);

        // Find all orders where user is team leader
        const ordersAsLeader = await Order.find({ userId: req.user._id })
            .populate('registrations.eventId', 'name category fees venue logo isActive')
            .populate('registrations.teamMembers', 'firstName lastName email phoneNumber')
            .sort({ createdAt: -1 });

        // Find all orders where user is a team member (but not leader)
        const ordersAsMember = await Order.find({
            'registrations.teamMembers': req.user._id,
            userId: { $ne: req.user._id }, // Exclude orders where user is leader
        })
            .populate('registrations.eventId', 'name category fees venue logo isActive')
            .populate('registrations.teamMembers', 'firstName lastName email phoneNumber')
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        // Format orders as leader
        const myOrders = ordersAsLeader.map((order) => ({
            orderId: order.orderId,
            role: 'Leader',
            totalAmount: order.totalAmount,
            status: order.status,
            transactionId: order.transactionId,
            createdAt: order.createdAt,
            verifiedAt: order.verifiedAt,
            rejectionReason: order.rejectionReason,
            events: order.registrations.map((reg: any) => ({
                event: {
                    _id: reg.eventId._id,
                    name: reg.eventId.name,
                    category: reg.eventId.category,
                    fees: reg.eventId.fees,
                    venue: reg.eventId.venue,
                    logo: reg.eventId.logo,
                    isActive: reg.eventId.isActive,
                },
                team: reg.teamMembers.map((member: any) => ({
                    _id: member._id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    email: member.email,
                    phoneNumber: member.phoneNumber,
                })),
                selectedDomain: reg.selectedDomain,
                selectedPS: reg.selectedPS,
            })),
        }));

        // Format orders as member
        const memberOf = ordersAsMember.map((order: any) => {
            // Find which registrations include this user
            const userRegistrations = order.registrations.filter((reg: any) =>
                reg.teamMembers.some((member: any) => member._id.toString() === req.user._id.toString())
            );

            return {
                orderId: order.orderId,
                role: 'Member',
                teamLeader: {
                    firstName: order.userId.firstName,
                    lastName: order.userId.lastName,
                    email: order.userId.email,
                },
                status: order.status,
                createdAt: order.createdAt,
                verifiedAt: order.verifiedAt,
                events: userRegistrations.map((reg: any) => ({
                    event: {
                        _id: reg.eventId._id,
                        name: reg.eventId.name,
                        category: reg.eventId.category,
                        fees: reg.eventId.fees,
                        venue: reg.eventId.venue,
                        logo: reg.eventId.logo,
                        isActive: reg.eventId.isActive,
                    },
                    team: reg.teamMembers.map((member: any) => ({
                        _id: member._id,
                        firstName: member.firstName,
                        lastName: member.lastName,
                        email: member.email,
                        phoneNumber: member.phoneNumber,
                    })),
                    selectedDomain: reg.selectedDomain,
                    selectedPS: reg.selectedPS,
                })),
            };
        });

        // Calculate statistics
        const totalOrders = myOrders.length + memberOf.length;
        const totalEventsRegistered = [
            ...myOrders.flatMap((o) => o.events),
            ...memberOf.flatMap((o) => o.events),
        ].length;

        const verifiedOrders = [...ordersAsLeader, ...ordersAsMember].filter(
            (o) => o.status === 'VERIFIED'
        ).length;

        const pendingOrders = [...ordersAsLeader, ...ordersAsMember].filter(
            (o) => o.status === 'PENDING'
        ).length;

        res.json({
            success: true,
            user: {
                _id: req.user._id,
                clerkId: req.user.clerkId,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                college: req.user.college,
                year: req.user.year,
                branch: req.user.branch,
                phoneNumber: req.user.phoneNumber,
                isAdmin: req.user.isAdmin,
                createdAt: req.user.createdAt,
                updatedAt: req.user.updatedAt,
            },
            statistics: {
                totalOrders,
                totalEventsRegistered,
                verifiedOrders,
                pendingOrders,
                asLeader: myOrders.length,
                asMember: memberOf.length,
            },
            registrations: {
                asLeader: myOrders,
                asMember: memberOf,
            },
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching profile: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
        });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/profile
 * @access  Private
 */
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, college, year, branch, phoneNumber } = req.body;

        logger.info(`✏️ User ${req.user.email} updating profile`);

        const updates: any = {};

        if (firstName !== undefined) {
            if (typeof firstName !== 'string' || firstName.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'First name is required',
                });
            }
            updates.firstName = firstName.trim();
        }

        if (lastName !== undefined) {
            if (typeof lastName !== 'string' || lastName.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Last name is required',
                });
            }
            updates.lastName = lastName.trim();
        }

        if (college !== undefined) {
            updates.college = college.trim();
        }

        if (year !== undefined) {
            const validYears = ['1st', '2nd', '3rd', '4th', 'Graduate', 'Other'];
            if (!validYears.includes(year)) {
                return res.status(400).json({
                    success: false,
                    error: `Year must be one of: ${validYears.join(', ')}`,
                });
            }
            updates.year = year;
        }

        if (branch !== undefined) {
            updates.branch = branch.trim();
        }

        if (phoneNumber !== undefined) {
            if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
                return res.status(400).json({
                    success: false,
                    error: 'Phone number must be exactly 10 digits',
                });
            }
            updates.phoneNumber = phoneNumber;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update',
            });
        }

        Object.assign(req.user, updates);
        await req.user.save();

        logger.info(`✅ Profile updated successfully for ${req.user.email}`);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: req.user._id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                college: req.user.college,
                year: req.user.year,
                branch: req.user.branch,
                phoneNumber: req.user.phoneNumber,
                isAdmin: req.user.isAdmin,
                updatedAt: req.user.updatedAt,
            },
        });
    } catch (error: any) {
        logger.error(`❌ Error updating profile: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
        });
    }
};
