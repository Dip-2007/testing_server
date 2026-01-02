import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
    console.log('✅ Development mode - .env loaded');
} else {
    console.log('✅ Production mode - using platform environment variables');
}

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import morganMiddleware from './middleware/morganMiddleware';
import { apiLimiter, publicLimiter } from './middleware/rateLimit';

import publicRoutes from './routes/public.routes';
import apiRoutes from './routes/api.routes';

import connectDB from './config/db';
import swaggerSpec from './config/swagger';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morganMiddleware);

connectDB();

app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Swagger UI
app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Xenia API Documentation',
    })
);

// ========== UNPROTECTED ROUTES (PUBLIC) ==========

app.use('/', publicLimiter, publicRoutes);

// ========== PROTECTED ROUTES (REQUIRE SECRET KEY) ==========

app.use('/api', apiLimiter, authenticate, apiRoutes);

app.use(errorHandler);

export default app;
