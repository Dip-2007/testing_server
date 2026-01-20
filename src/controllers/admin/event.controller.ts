// src/controllers/admin/event.controller.ts
import { Request, Response } from 'express';
import Event from '../../models/Event';
import Order from '../../models/Order';
import logger from '../../config/logger';

/**
 * @desc    Get all events (including inactive)
 * @route   GET /api/admin/events
 * @access  Admin
 */
export const getAllEvents = async (req: Request, res: Response) => {
    try {
        const { isActive, category } = req.query;

        logger.info(`👑 Admin ${req.user.email} fetching all events`);

        const query: any = {};

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (category) {
            query.category = category;
        }

        const events = await Event.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Get registration counts for each event
        const eventsWithStats = await Promise.all(
            events.map(async (event: any) => {
                const orderCount = await Order.countDocuments({
                    'registrations.eventId': event._id,
                    status: { $in: ['PENDING', 'VERIFIED'] },
                });

                const verifiedCount = await Order.countDocuments({
                    'registrations.eventId': event._id,
                    status: 'VERIFIED',
                });

                return {
                    ...event,
                    stats: {
                        totalRegistrations: orderCount,
                        verifiedRegistrations: verifiedCount,
                        pendingRegistrations: orderCount - verifiedCount,
                    },
                };
            })
        );

        res.json({
            success: true,
            count: events.length,
            events: eventsWithStats,
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching events: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch events',
        });
    }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/admin/events/:id
 * @access  Admin
 */
export const getEventById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info(`👑 Admin ${req.user.email} fetching event: ${id}`);

        const event: any = await Event.findById(id).lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
            });
        }

        // Get registrations for this event
        const orders = await Order.find({
            'registrations.eventId': id,
        })
            .populate('userId', 'firstName lastName email')
            .populate('registrations.teamMembers', 'firstName lastName email')
            .lean();

        res.json({
            success: true,
            event: event,
            registrations: orders.length,
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching event: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch event',
        });
    }
};

/**
 * @desc    Create new event
 * @route   POST /api/admin/events
 * @access  Admin
 */
export const createEvent = async (req: Request, res: Response) => {
    try {
        const eventData = req.body;

        logger.info(`👑 Admin ${req.user.email} creating event: ${eventData.name}`);

        // Validation
        if (!eventData.name || !eventData.fees || !eventData.category) {
            return res.status(400).json({
                success: false,
                error: 'Name, fees, and category are required',
            });
        }

        if (!eventData.teamSize || !eventData.teamSize.min || !eventData.teamSize.max) {
            return res.status(400).json({
                success: false,
                error: 'Team size (min and max) is required',
            });
        }

        if (eventData.teamSize.min > eventData.teamSize.max) {
            return res.status(400).json({
                success: false,
                error: 'Min team size cannot be greater than max',
            });
        }

        // Check if event name already exists
        const existingEvent = await Event.findOne({ name: eventData.name });
        if (existingEvent) {
            return res.status(400).json({
                success: false,
                error: 'Event with this name already exists',
            });
        }

        // Validate hackathon fields
        if (eventData.isHackathon) {
            if (!eventData.domains || eventData.domains.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Domains are required for hackathon events',
                });
            }

            // Validate each domain has problem statements
            for (const domain of eventData.domains) {
                if (!domain.problemStatements || domain.problemStatements.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: `Domain "${domain.name}" must have at least one problem statement`,
                    });
                }
            }
        }

        const event = new Event(eventData);
        await event.save();

        logger.info(`✅ Event created: ${event.name} (${event._id})`);

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            event: event,
        });
    } catch (error: any) {
        logger.error(`❌ Error creating event: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to create event',
        });
    }
};

/**
 * @desc    Update event
 * @route   PUT /api/admin/events/:id
 * @access  Admin
 */
export const updateEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        logger.info(`👑 Admin ${req.user.email} updating event: ${id}`);

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
            });
        }

        // Check if changing name to existing event name
        if (updates.name && updates.name !== event.name) {
            const existingEvent = await Event.findOne({ name: updates.name });
            if (existingEvent) {
                return res.status(400).json({
                    success: false,
                    error: 'Event with this name already exists',
                });
            }
        }

        // Validate team size if provided
        if (updates.teamSize) {
            if (updates.teamSize.min > updates.teamSize.max) {
                return res.status(400).json({
                    success: false,
                    error: 'Min team size cannot be greater than max',
                });
            }
        }

        // Update fields
        Object.assign(event, updates);
        await event.save();

        logger.info(`✅ Event updated: ${event.name} (${event._id})`);

        res.json({
            success: true,
            message: 'Event updated successfully',
            event: event,
        });
    } catch (error: any) {
        logger.error(`❌ Error updating event: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to update event',
        });
    }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/admin/events/:id
 * @access  Admin
 */
export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info(`👑 Admin ${req.user.email} deleting event: ${id}`);

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
            });
        }

        // Check if there are any orders for this event
        const orderCount = await Order.countDocuments({
            'registrations.eventId': id,
            status: { $in: ['PENDING', 'VERIFIED'] },
        });

        if (orderCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete event with ${orderCount} active registrations. Set isActive to false instead.`,
            });
        }

        await Event.findByIdAndDelete(id);

        logger.info(`✅ Event deleted: ${event.name} (${id})`);

        res.json({
            success: true,
            message: 'Event deleted successfully',
        });
    } catch (error: any) {
        logger.error(`❌ Error deleting event: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to delete event',
        });
    }
};

/**
 * @desc    Toggle event active status
 * @route   PUT /api/admin/events/:id/toggle-active
 * @access  Admin
 */
export const toggleEventActive = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info(`👑 Admin ${req.user.email} toggling event status: ${id}`);

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
            });
        }

        event.isActive = !event.isActive;
        await event.save();

        logger.info(`✅ Event ${event.name} is now ${event.isActive ? 'ACTIVE' : 'INACTIVE'}`);

        res.json({
            success: true,
            message: `Event ${event.isActive ? 'activated' : 'deactivated'} successfully`,
            event: {
                _id: event._id,
                name: event.name,
                isActive: event.isActive,
            },
        });
    } catch (error: any) {
        logger.error(`❌ Error toggling event status: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to toggle event status',
        });
    }
};
