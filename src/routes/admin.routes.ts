// src/routes/admin.routes.ts
import { Router, Request, Response } from 'express';
import logger from '../config/logger';

const router: Router = Router();

// ✅ NO MIDDLEWARE NEEDED HERE
// Auth is already applied in app.ts:
// app.use('/api/admin', checkSecretKey, checkAuth, checkAdmin, adminRoutes);

// ========== ADMIN ROUTES ==========


export default router;
