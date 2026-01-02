// src/routes/user.routes.ts
import { Router, Request, Response } from 'express';
import logger from '../config/logger';

const router: Router = Router();

// ✅ NO MIDDLEWARE NEEDED HERE
// Auth is already applied in app.ts:
// app.use('/api', checkSecretKey, checkAuth, userRoutes);


export default router;
