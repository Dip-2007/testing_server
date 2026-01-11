// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import logger from '../config/logger';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: any; // MongoDB user
        }
    }
}

/**
 * Middleware 2: Check Clerk ID + Attach User
 * Use on protected routes only
 */
export const checkAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get Clerk ID from header
        const clerkId = req.headers['x-clerk-id'] as string;

        if (!clerkId) {
            res.status(401).json({ error: 'Unauthorized - Missing clerk ID' });
            return;
        }

        // Find user in MongoDB
        const user = await User.findOne({ clerkId });

        if (!user) {
            res.status(404).json({
                error: 'User not found',
                message: 'Please sync your profile first'
            });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error: any) {
        logger.error(`Auth error: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Middleware 3: Check Admin
 * Use on admin routes only
 */
export const checkAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user?.isAdmin) {
        res.status(403).json({ error: 'Forbidden - Admin access required' });
        return;
    }
    next();
};
