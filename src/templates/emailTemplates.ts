// src/templates/emailTemplates.ts
import { IUser } from '../models/User';

interface OrderCreatedData {
    user: IUser;
    orderId: string;
    events: Array<{
        name: string;
        fees: number;
    }>;
    totalAmount: number;
    transactionId: string;
}

interface EventLink {
    name: string;
    link: string;
}

interface OrderVerifiedData {
    user: IUser;
    orderId: string;
    events: Array<{
        name: string;
        venue?: string;
        eventDate?: Date;
        links?: EventLink[];
    }>;
}

interface OrderRejectedData {
    user: IUser;
    orderId: string;
    transactionId: string;
    rejectionReason?: string;
}

// Common styles for all email templates
const commonStyles = `
    body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        line-height: 1.6; 
        color: #374151; 
        margin: 0;
        padding: 0;
        background-color: #f3f4f6;
    }
    .container { 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 40px 20px;
    }
    .email-wrapper {
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }
    .header { 
        background: #1f2937;
        color: #ffffff; 
        padding: 32px 24px; 
        text-align: center;
    }
    .header h1 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
    }
    .header p {
        margin: 0;
        opacity: 0.9;
        font-size: 14px;
    }
    .content { 
        padding: 32px 24px;
    }
    .content p {
        margin: 0 0 16px 0;
    }
    .info-box { 
        background: #f9fafb;
        padding: 20px;
        border-radius: 6px;
        margin: 24px 0;
        border: 1px solid #e5e7eb;
    }
    .info-row {
        display: flex;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
        border-bottom: none;
    }
    .info-label {
        font-weight: 600;
        color: #6b7280;
        min-width: 120px;
    }
    .info-value {
        color: #111827;
    }
    .status-pending {
        display: inline-block;
        padding: 4px 12px;
        background: #fef3c7;
        color: #92400e;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
    }
    .status-verified {
        display: inline-block;
        padding: 4px 12px;
        background: #d1fae5;
        color: #065f46;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
    }
    .status-rejected {
        display: inline-block;
        padding: 4px 12px;
        background: #fee2e2;
        color: #991b1b;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
    }
    .event-list {
        margin: 16px 0;
    }
    .event-item {
        padding: 12px 0;
        border-bottom: 1px solid #e5e7eb;
    }
    .event-item:last-child {
        border-bottom: none;
    }
    .event-name {
        font-weight: 600;
        color: #111827;
    }
    .event-fee {
        color: #6b7280;
        font-size: 14px;
    }
    .total-row {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 2px solid #e5e7eb;
        font-size: 18px;
        font-weight: 600;
    }
    .cta-button {
        display: inline-block;
        padding: 12px 24px;
        background: #1f2937;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
        margin: 16px 0;
    }
    .links-section {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 6px;
        padding: 16px;
        margin: 16px 0;
    }
    .links-section h4 {
        margin: 0 0 12px 0;
        color: #166534;
        font-size: 14px;
    }
    .link-item {
        margin: 8px 0;
    }
    .link-item a {
        color: #1d4ed8;
        text-decoration: none;
        font-weight: 500;
    }
    .link-item a:hover {
        text-decoration: underline;
    }
    .help-box {
        background: #fefce8;
        border: 1px solid #fde047;
        border-radius: 6px;
        padding: 16px;
        margin: 24px 0;
    }
    .help-box h4 {
        margin: 0 0 8px 0;
        color: #854d0e;
        font-size: 14px;
    }
    .help-box p {
        margin: 0;
        color: #713f12;
        font-size: 14px;
    }
    .footer { 
        text-align: center; 
        padding: 24px;
        color: #9ca3af;
        font-size: 13px;
        border-top: 1px solid #e5e7eb;
    }
    ul {
        margin: 16px 0;
        padding-left: 20px;
    }
    li {
        margin: 8px 0;
        color: #4b5563;
    }
`;

export const orderCreatedTemplate = (data: OrderCreatedData): string => {
    const userName = `${data.user.firstName} ${data.user.lastName}`.trim();

    const eventsHtml = data.events
        .map(
            (event) => `
            <div class="event-item">
                <span class="event-name">${event.name}</span>
                <span class="event-fee"> - ₹${event.fees}</span>
            </div>
        `
        )
        .join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${commonStyles}</style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <h1>Order Received</h1>
                <p>Your registration is pending verification</p>
            </div>
            <div class="content">
                <p>Hi <strong>${userName}</strong>,</p>
                <p>Thank you for registering! Your order has been received and is awaiting payment verification.</p>
                
                <div class="info-box">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; width: 140px;">Order ID</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${data.orderId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Transaction ID</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${data.transactionId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Status</td>
                            <td style="padding: 8px 0;"><span class="status-pending">Pending Verification</span></td>
                        </tr>
                    </table>
                </div>

                <p style="font-weight: 600; margin-bottom: 8px;">Events Registered:</p>
                <div class="event-list">
                    ${eventsHtml}
                </div>
                
                <div class="total-row">
                    Total Amount: ₹${data.totalAmount}
                </div>

                <p style="margin-top: 24px;">We're currently verifying your payment. You'll receive a confirmation email once approved.</p>
                
                <p>Best regards,<br><strong>Team Xenia</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated email from Xenia. Please do not reply directly.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

export const orderVerifiedTemplate = (data: OrderVerifiedData): string => {
    const userName = `${data.user.firstName} ${data.user.lastName}`.trim();

    const eventsHtml = data.events
        .map((event) => {
            const venueText = event.venue ? `<br><span style="color: #6b7280; font-size: 13px;">Venue: ${event.venue}</span>` : '';

            // Generate links section if links exist
            let linksHtml = '';
            if (event.links && event.links.length > 0) {
                const linkItems = event.links
                    .map(
                        (link) => `
                        <div class="link-item">
                            <a href="${link.link}" target="_blank">${link.name}</a>
                        </div>
                    `
                    )
                    .join('');

                linksHtml = `
                    <div class="links-section">
                        <h4>Important Links for ${event.name}</h4>
                        ${linkItems}
                    </div>
                `;
            }

            return `
                <div class="event-item">
                    <span class="event-name">${event.name}</span>
                    ${venueText}
                </div>
                ${linksHtml}
            `;
        })
        .join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${commonStyles}</style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header" style="background: #065f46;">
                <h1>Payment Verified</h1>
                <p>Your registration is confirmed!</p>
            </div>
            <div class="content">
                <p>Hi <strong>${userName}</strong>,</p>
                <p>Great news! Your payment has been verified and your registration is now confirmed.</p>
                
                <div class="info-box">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; width: 140px;">Order ID</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${data.orderId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Status</td>
                            <td style="padding: 8px 0;"><span class="status-verified">Verified</span></td>
                        </tr>
                    </table>
                </div>

                <p style="font-weight: 600; margin-bottom: 8px;">You're Registered For:</p>
                <div class="event-list">
                    ${eventsHtml}
                </div>

                <p style="font-weight: 600; margin-top: 24px; margin-bottom: 8px;">What's Next?</p>
                <ul>
                    <li>Check your dashboard for event details</li>
                    <li>Mark your calendar for the event dates</li>
                    <li>Reach the venue 15 minutes before the event</li>
                    <li>Bring your college ID for verification</li>
                </ul>

                <center>
                    <a href="${process.env.FRONTEND_URL}/profile" class="cta-button">View My Registrations</a>
                </center>

                <p style="margin-top: 24px;">See you at the events!</p>
                
                <p>Best regards,<br><strong>Team Xenia</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated email from Xenia. Please do not reply directly.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

export const orderRejectedTemplate = (data: OrderRejectedData): string => {
    const userName = `${data.user.firstName} ${data.user.lastName}`.trim();

    const reasonHtml = data.rejectionReason
        ? `
            <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Reason</td>
                <td style="padding: 8px 0; color: #dc2626;">${data.rejectionReason}</td>
            </tr>
        `
        : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${commonStyles}</style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header" style="background: #991b1b;">
                <h1>Payment Verification Failed</h1>
                <p>Action required</p>
            </div>
            <div class="content">
                <p>Hi <strong>${userName}</strong>,</p>
                <p>We were unable to verify your payment for the following order:</p>
                
                <div class="info-box">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; width: 140px;">Order ID</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${data.orderId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Transaction ID</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${data.transactionId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Status</td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span class="status-rejected">Rejected</span></td>
                        </tr>
                        ${reasonHtml}
                    </table>
                </div>

                <div class="help-box">
                    <h4>Need Help?</h4>
                    <p>If you believe this is an error or need assistance, please contact our support team with your order ID and transaction details.</p>
                </div>

                <p style="font-weight: 600; margin-bottom: 8px;">Common Reasons for Rejection:</p>
                <ul>
                    <li>Transaction ID doesn't match our records</li>
                    <li>Incorrect payment amount</li>
                    <li>Payment sent to wrong account</li>
                    <li>Duplicate transaction ID</li>
                </ul>

                <p style="margin-top: 24px;">Best regards,<br><strong>Team Xenia</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated email from Xenia. Please do not reply directly.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};
