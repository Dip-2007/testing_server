// src/routes/user.routes.ts
import express from 'express';
import { searchUserByEmail, searchUsersAutocomplete, getUserById } from '../../controllers/user.controller';


const router = express.Router();
/**
 * @route   POST /api/users/search
 * @desc    Search user by exact email
 * @access  Private
 */
router.post('/search', searchUserByEmail);

/**
 * @route   GET /api/users/search/autocomplete?query=naruto
 * @desc    Search users by name or email (autocomplete)
 * @access  Private
 */
router.get('/search/autocomplete', searchUsersAutocomplete);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:userId', getUserById);

export default router;
