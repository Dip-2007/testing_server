import { Router, Request, Response } from 'express';
import profileRoutes from './profile/profile.route';
import userRoutes from "./users/user.route"
import orderRoutes from './order/order.route';
const router: Router = Router();

// ✅ NO MIDDLEWARE NEEDED HERE
// Auth is already applied in app.ts:
// app.use('/api', checkAuth, userRoutes);

router.use('/profile', profileRoutes)
router.use('/orders', orderRoutes)
router.use('/users', userRoutes);

export default router;
