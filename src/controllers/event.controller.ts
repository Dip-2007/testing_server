// src/controllers/event.controller.ts
import { Request, Response } from 'express';
import Event from '../models/Event';
import logger from '../config/logger';

/**
 * @desc    Get all active events
 * @route   GET /events
 * @access  Public (requires secret key)
 */
export const getAllEvents = async (req: Request, res: Response) => {
    try {
        const { category, isActive } = req.query;

        logger.info(`📋 Fetching all events`);

        // Build query
        const query: any = {};

        // Filter by active status (default to true)
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        } else {
            query.isActive = true; // Default: only active events
        }

        // Filter by category if provided
        if (category) {
            query.category = category;
        }

        const events = await Event.find(query)
            .select('-domains.problemStatements.description') // Exclude detailed PS descriptions
            .sort({ createdAt: -1 })
            .lean();

        // Group events by category
        const eventsByCategory: any = {};
        events.forEach((event: any) => {
            if (!eventsByCategory[event.category]) {
                eventsByCategory[event.category] = [];
            }
            eventsByCategory[event.category].push({
                _id: event._id,
                name: event.name,
                description: event.description,
                fees: event.fees,
                category: event.category,
                venue: event.venue,
                logo: event.logo,
                teamSize: event.teamSize,
                isHackathon: event.isHackathon,
                isActive: event.isActive,
                createdAt: event.createdAt,
            });
        });

        // Get categories
        const categories = await Event.distinct('category', { isActive: true });

        res.json({
            success: true,
            count: events.length,
            categories: categories,
            eventsByCategory: eventsByCategory,
            events: events.map((event: any) => ({
                _id: event._id,
                name: event.name,
                description: event.description,
                fees: event.fees,
                category: event.category,
                imgUrl: event.imgUrl,
                venue: event.venue,
                logo: event.logo,
                teamSize: event.teamSize,
                isHackathon: event.isHackathon,
                isActive: event.isActive,
                contact: event.contact,
                createdAt: event.createdAt,
            })),
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
 * @desc    Get single event details
 * @route   GET /events/:id
 * @access  Public (requires secret key)
 */
export const getEventById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info(`📋 Fetching event: ${id}`);

        const event: any = await Event.findById(id).lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
            });
        }

        res.json({
            success: true,
            event: {
                _id: event._id,
                name: event.name,
                description: event.description,
                introduction: event.introduction,
                prizes: event.prizes,
                schedule: event.schedule,
                rules: event.rules,
                fees: event.fees,
                teamSize: event.teamSize,
                logo: event.logo,
                contact: event.contact,
                platform: event.platform,
                category: event.category,
                venue: event.venue,
                isActive: event.isActive,
                isHackathon: event.isHackathon,
                imgUrl: event.imgUrl,
                // Include domain names only, not full PS details
                domains: event.isHackathon
                    ? event.domains?.map((domain: any) => ({
                        domainId: domain.domainId,
                        name: domain.name,
                        description: domain.description,
                        problemStatementsCount: domain.problemStatements?.length || 0,
                    }))
                    : [],
                createdAt: event.createdAt,
                updatedAt: event.updatedAt,
            },
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching event: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch event details',
        });
    }
};

/**
 * @desc    Get events by category
 * @route   GET /events/category/:category
 * @access  Public (requires secret key)
 */
export const getEventsByCategory = async (req: Request, res: Response) => {
    try {
        const { category } = req.params;

        logger.info(`📋 Fetching events in category: ${category}`);

        const events = await Event.find({
            category: category,
            isActive: true,
        })
            .select('name description fees venue logo teamSize isHackathon contact')
            .sort({ createdAt: -1 })
            .lean();

        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No active events found in category: ${category}`,
            });
        }

        res.json({
            success: true,
            category: category,
            count: events.length,
            events: events,
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching events by category: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch events',
        });
    }
};

/**
 * @desc    Get hackathon domains and problem statements
 * @route   GET /events/:id/domains
 * @access  Public (requires secret key)
 */
export const getEventDomains = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        logger.info(`📋 Fetching domains for event: ${id}`);

        const event: any = await Event.findById(id).select('name isHackathon domains').lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found',
            });
        }

        if (!event.isHackathon) {
            return res.status(400).json({
                success: false,
                error: 'This event is not a hackathon',
            });
        }

        if (!event.domains || event.domains.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No domains found for this hackathon',
            });
        }

        res.json({
            success: true,
            eventName: event.name,
            domainsCount: event.domains.length,
            domains: event.domains.map((domain: any) => ({
                domainId: domain.domainId,
                name: domain.name,
                description: domain.description,
                problemStatements: domain.problemStatements.map((ps: any) => ({
                    psId: ps.psId,
                    title: ps.title,
                    description: ps.description,
                    difficulty: ps.difficulty,
                })),
            })),
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching event domains: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch domains',
        });
    }
};

/**
 * @desc    Get all available categories
 * @route   GET /events/categories/list
 * @access  Public (requires secret key)
 */
export const getCategories = async (req: Request, res: Response) => {
    try {
        logger.info(`📋 Fetching all event categories`);

        const categories = await Event.distinct('category', { isActive: true });

        // Get count for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const count = await Event.countDocuments({
                    category: category,
                    isActive: true,
                });
                return {
                    category: category,
                    count: count,
                };
            })
        );

        res.json({
            success: true,
            count: categories.length,
            categories: categoriesWithCount,
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching categories: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
        });
    }
};

/**
 * @desc    Search events by name
 * @route   GET /events/search?q=query
 * @access  Public (requires secret key)
 */
export const searchEvents = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Search query is required',
            });
        }

        logger.info(`🔍 Searching events: ${q}`);

        const events = await Event.find({
            isActive: true,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } },
            ],
        })
            .select('name description fees category venue logo teamSize isHackathon')
            .limit(20)
            .lean();

        res.json({
            success: true,
            query: q,
            count: events.length,
            events: events,
        });
    } catch (error: any) {
        logger.error(`❌ Error searching events: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to search events',
        });
    }
};
