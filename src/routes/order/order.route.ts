// src/routes/order/order.route.ts
import { Router } from 'express';
import * as orderController from '../../controllers/order.controller';

const router = Router();

/**
 * @route   POST /api/orders
 * @desc    Create new order (register for events)
 * @access  Private
 */
router.post('/', orderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for current user
 * @access  Private
 */
router.get('/', orderController.getUserOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get specific order details
 * @access  Private
 */
router.get('/:id', orderController.getOrderById);

export default router;
