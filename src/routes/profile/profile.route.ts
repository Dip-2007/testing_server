
import { Router } from 'express';
import { getProfile, updateProfile } from '../../controllers/profile.controller';
const router = Router();

/**
 * @route   GET /api/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/', getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/', updateProfile);

export default router;
