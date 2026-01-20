import { Router } from 'express';

import {
    createEvent,
    deleteEvent,
    getAllEvents,
    getEventById,
    toggleEventActive,
    updateEvent
} from '../../controllers/admin/event.controller';


const router: Router = Router();

/**
 * @route   GET /api/admin/events
 * @desc    Get all events
 * @access  Admin
 */
router.get('/', getAllEvents);

/**
 * @route   POST /api/admin/events
 * @desc    Create new event
 * @access  Admin
 */
router.post('/', createEvent);

/**
 * @route   GET /api/admin/events/:id
 * @desc    Get single event
 * @access  Admin
 */
router.get('/:id', getEventById);

/**
 * @route   PUT /api/admin/events/:id
 * @desc    Update event
 * @access  Admin
 */
router.put('/:id', updateEvent);

/**
 * @route   DELETE /api/admin/events/:id
 * @desc    Delete event
 * @access  Admin
 */
router.delete('/:id', deleteEvent);

/**
 * @route   PUT /api/admin/events/:id/toggle-active
 * @desc    Toggle event active status
 * @access  Admin
 */
router.put('/:id/toggle-active', toggleEventActive);

export default router;
