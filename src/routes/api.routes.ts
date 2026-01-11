import { Router, Request, Response } from 'express';
import logger from '../config/logger';
import profileRoutes from './profile/profile.route';
import orderRoutes from './order/order.route';
const router: Router = Router();

// ✅ NO MIDDLEWARE NEEDED HERE
// Auth is already applied in app.ts:
// app.use('/api', checkAuth, userRoutes);

router.use('/profile', profileRoutes)
router.use('/order', orderRoutes)

export default router;
