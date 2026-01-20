import { Router, Request, Response } from 'express';
import logger from '../../config/logger';
import { sendOrderCreatedEmail } from '../../services/emailService';
import emailTestRoutes from './email.test.routes';

const router: Router = Router();

router.use("/email", emailTestRoutes)

export default router;