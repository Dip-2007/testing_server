import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    toggleAdmin
} from '../../controllers/admin/user.controller';

const router: Router = Router();

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user with orders
 * @access  Admin
 */
router.get('/:id', getUserById);

/**
 * @route   PUT /api/admin/users/:id/toggle-admin
 * @desc    Toggle user admin status
 * @access  Admin
 */
router.put('/:id/toggle-admin', toggleAdmin);

export default router;
