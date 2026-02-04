import { Router } from 'express';
import {
    getAllOrders,
    getOrderById,
    verifyOrder,
    rejectOrder,
    exportOrdersViaEmail
} from '../../controllers/admin/order.controller';

const router: Router = Router();

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders (with optional filters)
 * @access  Admin
 */
router.get('/', getAllOrders);

/**
 * @route   POST /api/admin/orders/export-email
 * @desc    Export filtered orders via email
 * @access  Admin
 */
router.post('/export-email', exportOrdersViaEmail);

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Get single order
 * @access  Admin
 */
router.get('/:id', getOrderById);

/**
 * @route   PUT /api/admin/orders/:id/verify
 * @desc    Verify order (approve payment)
 * @access  Admin
 */
router.put('/:id/verify', verifyOrder);

/**
 * @route   PUT /api/admin/orders/:id/reject
 * @desc    Reject order (payment issue)
 * @access  Admin
 */
router.put('/:id/reject', rejectOrder);

export default router;
