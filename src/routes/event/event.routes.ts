import { Router } from 'express';
import { getCategories, searchEvents, getEventDomains, getEventById, getEventsByCategory, getAllEvents } from '../../controllers/event.controller';

const router: Router = Router();
router.get('/categories/list', getCategories);

/**
 * @route   GET /events/search?q=query
 * @desc    Search events by name, description, or category
 * @access  Public (requires secret key)
 */
router.get('/search', searchEvents);

/**
 * @route   GET /events/category/:category
 * @desc    Get events by category
 * @access  Public (requires secret key)
 */
router.get('/category/:category', getEventsByCategory);

/**
 * @route   GET /events/:id/domains
 * @desc    Get hackathon domains and problem statements
 * @access  Public (requires secret key)
 */
router.get('/:id/domains', getEventDomains);

/**
 * @route   GET /events/:id
 * @desc    Get single event details
 * @access  Public (requires secret key)
 */
router.get('/:id', getEventById);

/**
 * @route   GET /events
 * @desc    Get all active events
 * @access  Public (requires secret key)
 */
router.get('/', getAllEvents);

export default router;
