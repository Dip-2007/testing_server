import resend from '../config/resend';
import logger from '../config/logger';
import {
    orderCreatedTemplate,
    orderVerifiedTemplate,
    orderRejectedTemplate,
} from '../templates/emailTemplates';
import { IUser } from '../models/User';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Xenia <onboarding@resend.dev>';

interface SendEmailResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

interface EventLink {
    name: string;
    link: string;
}

/**
 * Send order created email
 */
export const sendOrderCreatedEmail = async (
    user: IUser,
    orderId: string,
    events: Array<{ name: string; fees: number }>,
    totalAmount: number,
    transactionId: string
): Promise<SendEmailResponse> => {
    try {
        const html = orderCreatedTemplate({
            user,
            orderId,
            events,
            totalAmount,
            transactionId,
        });

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: `Order Received - ${orderId} | Xenia`,
            html,
        });

        if (error) {
            logger.error(`❌ Failed to send order created email: ${error.message}`);
            return { success: false, error: error.message };
        }

        logger.info(`✅ Order created email sent to ${user.email} - ID: ${data?.id}`);
        return { success: true, messageId: data?.id };
    } catch (error: any) {
        logger.error(`❌ Email service error: ${error.message}`);
        return { success: false, error: error.message };
    }
};

/**
 * Send order verified email with event links (WhatsApp, Google Forms, etc.)
 */
export const sendOrderVerifiedEmail = async (
    user: IUser,
    orderId: string,
    events: Array<{ name: string; venue?: string; eventDate?: Date; links?: EventLink[] }>
): Promise<SendEmailResponse> => {
    try {
        const html = orderVerifiedTemplate({
            user,
            orderId,
            events,
        });

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: `Payment Verified - You're Registered! | Xenia`,
            html,
        });

        if (error) {
            logger.error(`❌ Failed to send order verified email: ${error.message}`);
            return { success: false, error: error.message };
        }

        logger.info(`✅ Order verified email sent to ${user.email} - ID: ${data?.id}`);
        return { success: true, messageId: data?.id };
    } catch (error: any) {
        logger.error(`❌ Email service error: ${error.message}`);
        return { success: false, error: error.message };
    }
};

/**
 * Send order rejected email
 */
export const sendOrderRejectedEmail = async (
    user: IUser,
    orderId: string,
    transactionId: string,
    rejectionReason?: string
): Promise<SendEmailResponse> => {
    try {
        const html = orderRejectedTemplate({
            user,
            orderId,
            transactionId,
            rejectionReason,
        });

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: `Payment Verification Failed - ${orderId} | Xenia`,
            html,
        });

        if (error) {
            logger.error(`❌ Failed to send order rejected email: ${error.message}`);
            return { success: false, error: error.message };
        }

        return { success: true, messageId: data?.id };
    } catch (error: any) {
        logger.error(`❌ Email service error: ${error.message}`);
        return { success: false, error: error.message };
    }
};

/**
 * Send order export email with Excel attachment
 */
export const sendOrderExportEmail = async (
    email: string,
    excelBuffer: Buffer
): Promise<SendEmailResponse> => {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Admin Order Export | Xenia`,
            html: `<p>Hello Admin,</p><p>Please find attached the requested order export.</p><p>Regards,<br>Xenia Team</p>`,
            attachments: [
                {
                    filename: `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`,
                    content: excelBuffer,
                },
            ],
        });

        if (error) {
            logger.error(`❌ Failed to send order export email: ${error.message}`);
            return { success: false, error: error.message };
        }

        logger.info(`✅ Order export email sent to ${email} - ID: ${data?.id}`);
        return { success: true, messageId: data?.id };
    } catch (error: any) {
        logger.error(`❌ Email service error: ${error.message}`);
        return { success: false, error: error.message };
    }
};
