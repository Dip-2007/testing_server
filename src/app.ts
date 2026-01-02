import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import morganMiddleware from './middleware/morganMiddleware';

import connectDB from './config/db';
import logger from './config/logger';

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morganMiddleware);

connectDB();

app.get('/ping', (req: Request, res: Response): void => {
    logger.info('Health check endpoint called');
    res.json({ message: 'Xenia API is running!' });
});

app.use(authenticate);

app.use(errorHandler);

export default app;
