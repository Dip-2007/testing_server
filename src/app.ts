// src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import compression from 'compression';
import helmet from 'helmet';

import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
    console.log('✅ Development mode - .env loaded');
} else {
    console.log('✅ Production mode - using platform environment variables');
}

import clerkWebhook from './routes/webhooks/clerk.webhook';

import { checkAuth, checkAdmin } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import morganMiddleware from './middleware/morganMiddleware';
import { apiLimiter, publicLimiter, strictLimiter } from './middleware/rateLimit';

import publicRoutes from './routes/public.routes';
import apiRoutes from './routes/api.routes';
import adminRoutes from './routes/admin.routes';

import connectDB from './config/db';
import swaggerSpec from './config/swagger';
import { cache } from './middleware/cache';

const app: Application = express();

// ========== SECURITY (Must be FIRST) ==========
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));

// ========== COMPRESSION ==========
app.use(compression());

// ========== CORS ==========
app.use(cors());

// ========== CLERK WEBHOOK (Must be BEFORE express.json()) ==========
app.use(
    '/webhooks/clerk',
    express.raw({ type: 'application/json' }),
    clerkWebhook
);

// ========== BODY PARSERS ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== LOGGING ==========
app.use(morganMiddleware);

// ========== DATABASE ==========
connectDB();

// ========== SWAGGER DOCUMENTATION ==========
app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Xenia API Documentation',
    })
);

// ========== FAVICON HANDLERS ==========
app.get('/favicon.ico', (req: Request, res: Response) => {
    res.status(204).end();
});

app.get('/favicon.png', (req: Request, res: Response) => {
    res.status(204).end();
});

// ========= PUBLIC WELCOME ROUTE (public rate limited) ==========

app.get('/', publicLimiter, cache({ EX: 30 }), (req: Request, res: Response): void => {
    const devJoke = [
        "Why do programmers prefer dark mode? Light attracts bugs! 🐛",
        "There are 10 types of people: those who understand binary and those who don't",
        "404: Humor not found... wait, there it is!"
    ];

    res.json({
        welcome: {
            message: 'Welcome to Xenia API',
            tagline: 'Powering PICT\'s biggest tech event',
            version: '1.0.0'
        },
        quick_start: {
            health: 'GET /ping',
        },
        dev_humor: devJoke[Math.floor(Math.random() * devJoke.length)],
        meta: {
            timestamp: Date.now(),
            cached: true,
            cache_ttl: 30,
            request_id: req.headers['x-request-id'] || 'N/A'
        },
    });
});

// ========== PUBLIC ROUTES ==========
app.use('/', publicLimiter, publicRoutes);

// ========== PROTECTED USER ROUTES (Clerk ID) ==========
app.use('/api', publicLimiter, checkAuth, apiRoutes);

// ========== PROTECTED ADMIN ROUTES ( Clerk ID + Admin) ==========
app.use('/api/admin', publicLimiter, checkAuth, checkAdmin, adminRoutes);

// ========== 404 HANDLER ==========
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
    });
});

// ========== ERROR HANDLER (Must be LAST) ==========
app.use(errorHandler);

export default app;
