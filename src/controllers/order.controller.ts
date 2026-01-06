// src/controllers/order.controller.ts
import { Request, Response } from 'express';
import Order from '../models/Order';
import Event from '../models/Event';
import User from '../models/User';
import logger from '../config/logger';
import mongoose from 'mongoose';

/**
 * @desc    Create new order (register for events)
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { registrations, transactionId } = req.body;

        logger.info(`📝 User ${req.user.email} creating order`);

        // ========== VALIDATION ==========
        if (!registrations || !Array.isArray(registrations) || registrations.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one event registration is required',
            });
        }

        if (!transactionId || transactionId.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Transaction ID is required',
            });
        }

        // Check if transaction ID already exists
        const existingOrder = await Order.findOne({ transactionId: transactionId.trim() });
        if (existingOrder) {
            return res.status(400).json({
                success: false,
                error: 'Transaction ID already used. Please use a unique transaction ID.',
            });
        }

        let totalAmount = 0;
        const validatedRegistrations = [];

        // ========== VALIDATE EACH REGISTRATION ==========
        for (const reg of registrations) {
            const { eventId, teamMembers, selectedDomain, selectedPS } = reg;

            // Check if eventId is valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(eventId)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid event ID: ${eventId}`,
                });
            }

            // Validate event exists and is active
            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    error: `Event not found: ${eventId}`,
                });
            }

            if (!event.isActive) {
                return res.status(400).json({
                    success: false,
                    error: `Event "${event.name}" is not currently active`,
                });
            }

            // Validate team members array
            if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: `Team members are required for "${event.name}"`,
                });
            }

            // Check team size constraints
            if (teamMembers.length < event.teamSize.min || teamMembers.length > event.teamSize.max) {
                return res.status(400).json({
                    success: false,
                    error: `Team size for "${event.name}" must be between ${event.teamSize.min} and ${event.teamSize.max} members`,
                });
            }

            // Validate team leader is included in team members
            const teamMemberIds = teamMembers.map((id: string) => id.toString());
            if (!teamMemberIds.includes(req.user._id.toString())) {
                return res.status(400).json({
                    success: false,
                    error: 'You (team leader) must be included in the team members list',
                });
            }

            // Check for duplicate team members
            if (teamMemberIds.length !== new Set(teamMemberIds).size) {
                return res.status(400).json({
                    success: false,
                    error: `Duplicate team members found in "${event.name}"`,
                });
            }

            // Validate all team member IDs
            for (const memberId of teamMembers) {
                if (!mongoose.Types.ObjectId.isValid(memberId)) {
                    return res.status(400).json({
                        success: false,
                        error: `Invalid team member ID: ${memberId}`,
                    });
                }
            }

            // Verify all team members exist in database
            const users = await User.find({ _id: { $in: teamMembers } });
            if (users.length !== teamMembers.length) {
                return res.status(404).json({
                    success: false,
                    error: `One or more team members not found in database`,
                });
            }

            // Check if any team member is already registered for this event
            const existingRegistrations = await Order.find({
                'registrations.eventId': eventId,
                'registrations.teamMembers': { $in: teamMembers },
                status: { $in: ['PENDING', 'VERIFIED'] },
            });

            if (existingRegistrations.length > 0) {
                const registeredUsers = existingRegistrations.flatMap((order) =>
                    order.registrations
                        .filter((r: any) => r.eventId.toString() === eventId.toString())
                        .flatMap((r: any) => r.teamMembers)
                );

                const duplicateMembers = users.filter((user) =>
                    registeredUsers.some((regUser: any) => regUser.toString() === user._id.toString())
                );

                if (duplicateMembers.length > 0) {
                    const names = duplicateMembers
                        .map((u) => `${u.firstName} ${u.lastName}`)
                        .join(', ');
                    return res.status(400).json({
                        success: false,
                        error: `Following members are already registered for "${event.name}": ${names}`,
                    });
                }
            }

            // ========== HACKATHON VALIDATION ==========
            if (event.isHackathon) {
                if (!selectedDomain || !selectedPS) {
                    return res.status(400).json({
                        success: false,
                        error: `Domain and Problem Statement selection required for hackathon "${event.name}"`,
                    });
                }

                // Validate domain exists
                const domain = event.domains?.find((d) => d.domainId === selectedDomain);
                if (!domain) {
                    return res.status(400).json({
                        success: false,
                        error: `Invalid domain "${selectedDomain}" for hackathon "${event.name}"`,
                    });
                }

                // Validate problem statement exists
                const ps = domain.problemStatements.find((p) => p.psId === selectedPS);
                if (!ps) {
                    return res.status(400).json({
                        success: false,
                        error: `Invalid problem statement "${selectedPS}" in domain "${domain.name}"`,
                    });
                }
            }

            totalAmount += event.fees;

            validatedRegistrations.push({
                eventId: event._id,
                teamMembers: teamMembers.map((id: string) => new mongoose.Types.ObjectId(id)),
                selectedDomain: selectedDomain || undefined,
                selectedPS: selectedPS || undefined,
            });
        }

        // ========== CREATE ORDER ==========
        const order = new Order({
            userId: req.user._id,
            registrations: validatedRegistrations,
            transactionId: transactionId.trim(),
            totalAmount,
            status: 'PENDING',
        });

        await order.save();

        logger.info(`✅ Order created: ${order.orderId} by ${req.user.email}, Amount: ₹${totalAmount}`);

        // TODO: Send email notification to user
        // TODO: Send notification to admin

        res.status(201).json({
            success: true,
            message: 'Order created successfully. Please wait for admin verification.',
            order: {
                orderId: order.orderId,
                totalAmount: order.totalAmount,
                status: order.status,
                transactionId: order.transactionId,
                createdAt: order.createdAt,
                registrationsCount: order.registrations.length,
            },
        });
    } catch (error: any) {
        logger.error(`❌ Error creating order: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to create order. Please try again.',
        });
    }
};

/**
 * @desc    Get all orders for current user
 * @route   GET /api/orders
 * @access  Private
 */
export const getUserOrders = async (req: Request, res: Response) => {
    try {
        logger.info(`📋 User ${req.user.email} fetching orders`);

        // ✅ Add .lean() here too
        const ordersAsLeader: any[] = await Order.find({ userId: req.user._id })
            .populate('registrations.eventId', 'name category fees venue logo isActive')
            .populate('registrations.teamMembers', 'firstName lastName email phoneNumber')
            .sort({ createdAt: -1 })
            .lean();

        const ordersAsMember: any[] = await Order.find({
            'registrations.teamMembers': req.user._id,
            userId: { $ne: req.user._id },
        })
            .populate('registrations.eventId', 'name category fees venue logo isActive')
            .populate('registrations.teamMembers', 'firstName lastName email phoneNumber')
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean();

        const myOrders = ordersAsLeader.map((order) => ({
            orderId: order.orderId,
            role: 'Leader',
            totalAmount: order.totalAmount,
            status: order.status,
            transactionId: order.transactionId,
            createdAt: order.createdAt,
            verifiedAt: order.verifiedAt,
            rejectionReason: order.rejectionReason,
            registrations: order.registrations.map((reg: any) => ({
                event: {
                    _id: reg.eventId._id,
                    name: reg.eventId.name,
                    category: reg.eventId.category,
                    fees: reg.eventId.fees,
                    venue: reg.eventId.venue,
                    logo: reg.eventId.logo,
                    isActive: reg.eventId.isActive,
                },
                teamMembers: reg.teamMembers.map((member: any) => ({
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

        const memberOrders = ordersAsMember.map((order: any) => {
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
                registrations: userRegistrations.map((reg: any) => ({
                    event: {
                        _id: reg.eventId._id,
                        name: reg.eventId.name,
                        category: reg.eventId.category,
                        fees: reg.eventId.fees,
                        venue: reg.eventId.venue,
                        logo: reg.eventId.logo,
                        isActive: reg.eventId.isActive,
                    },
                    teamMembers: reg.teamMembers.map((member: any) => ({
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

        const allOrders = [...myOrders, ...memberOrders];

        res.json({
            success: true,
            count: allOrders.length,
            summary: {
                asLeader: myOrders.length,
                asMember: memberOrders.length,
                pending: allOrders.filter((o) => o.status === 'PENDING').length,
                verified: allOrders.filter((o) => o.status === 'VERIFIED').length,
                rejected: allOrders.filter((o) => o.status === 'REJECTED').length,
            },
            orders: allOrders,
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
 * @desc    Get specific order details
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info(`📋 User ${req.user.email} fetching order ${id}`);

        const order: any = await Order.findOne({ orderId: id })
            .populate('registrations.eventId', 'name category fees venue logo isActive')
            .populate('registrations.teamMembers', 'firstName lastName email phoneNumber college year branch')
            .populate('userId', 'firstName lastName email phoneNumber')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        // Check if user has access to this order
        const isLeader = order.userId._id.toString() === req.user._id.toString();
        const isMember = order.registrations.some((reg: any) =>
            reg.teamMembers.some((member: any) => member._id.toString() === req.user._id.toString())
        );

        if (!isLeader && !isMember) {
            return res.status(403).json({
                success: false,
                error: 'You do not have access to this order',
            });
        }

        res.json({
            success: true,
            order: {
                orderId: order.orderId,
                role: isLeader ? 'Leader' : 'Member',
                teamLeader: {
                    _id: order.userId._id,
                    firstName: order.userId.firstName,
                    lastName: order.userId.lastName,
                    email: order.userId.email,
                    phoneNumber: order.userId.phoneNumber,
                },
                totalAmount: order.totalAmount,
                status: order.status,
                transactionId: order.transactionId,
                createdAt: order.createdAt,
                verifiedAt: order.verifiedAt,
                rejectionReason: order.rejectionReason,
                registrations: order.registrations.map((reg: any) => ({
                    event: {
                        _id: reg.eventId._id,
                        name: reg.eventId.name,
                        category: reg.eventId.category,
                        fees: reg.eventId.fees,
                        venue: reg.eventId.venue,
                        logo: reg.eventId.logo,
                        isActive: reg.eventId.isActive,
                    },
                    teamMembers: reg.teamMembers.map((member: any) => ({
                        _id: member._id,
                        firstName: member.firstName,
                        lastName: member.lastName,
                        email: member.email,
                        phoneNumber: member.phoneNumber,
                        college: member.college,
                        year: member.year,
                        branch: member.branch,
                    })),
                    selectedDomain: reg.selectedDomain,
                    selectedPS: reg.selectedPS,
                })),
            },
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching order: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order details',
        });
    }
};
