import { Router } from 'express';
import eventRoutes from './admin/event.route';
import orderRoutes from './admin/order.route';
import userRoutes from './admin/user.route';
import statsRoutes from './admin/stats.route';

const router: Router = Router();

// ==================== MOUNT SUB-ROUTES ====================
/**
 * Statistics routes
 * Base: /api/admin/stats
 */
router.use('/stats', statsRoutes);

/**
 * Event management routes
 * Base: /api/admin/events
 */
router.use('/events', eventRoutes);

/**
 * Order management routes
 * Base: /api/admin/orders
 */
router.use('/orders', orderRoutes);

/**
 * User management routes
 * Base: /api/admin/users
 */
router.use('/users', userRoutes);

export default router;
