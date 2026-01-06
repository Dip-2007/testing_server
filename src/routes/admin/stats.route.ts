import { Router } from 'express';
import {
    getDashboardStats
} from '../../controllers/admin/stats.controller';

const router: Router = Router();

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get('/', getDashboardStats);

/**
 * @route   GET /api/admin/stats/revenue
 * @desc    Get revenue statistics (optional )
 * @access  Admin
 */
// router.get('/revenue', statsController.getRevenueStats);

/**
 * @route   GET /api/admin/stats/registrations
 * @desc    Get registration statistics (optional)
 * @access  Admin
 */
// router.get('/registrations', statsController.getRegistrationStats);

export default router;
