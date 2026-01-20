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

interface OrderVerifiedData {
  user: IUser;
  orderId: string;
  events: Array<{
    name: string;
    venue?: string;
    eventDate?: Date;
  }>;
}

interface OrderRejectedData {
  user: IUser;
  orderId: string;
  transactionId: string;
  rejectionReason?: string;
}

export const orderCreatedTemplate = (data: OrderCreatedData): string => {
  const eventsList = data.events
    .map((event) => `    • ${event.name} - ₹${event.fees}`)
    .join('\n');

  // Build full name from firstName and lastName
  const userName = `${data.user.firstName} ${data.user.lastName}`.trim();

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .order-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .event-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .total { font-size: 20px; font-weight: bold; color: #667eea; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .status-badge { display: inline-block; padding: 8px 16px; background: #fbbf24; color: #78350f; border-radius: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Received!</h1>
      <p>Your registration is being processed</p>
    </div>
    <div class="content">
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Thank you for registering! Your order has been received and is awaiting payment verification.</p>
      
      <div class="order-box">
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
        <p><strong>Status:</strong> <span class="status-badge">⏳ PENDING</span></p>
        
        <h3>Events Registered:</h3>
        <div>
${eventsList}
        </div>
        
        <p class="total">Total Amount: ₹${data.totalAmount}</p>
      </div>
      
      <p>We're currently verifying your payment. You'll receive a confirmation email once your payment is verified.</p>
      
      <p>If you have any questions, feel free to reach out to our support team.</p>
      
      <p>Best regards,<br><strong>Xenia Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const orderVerifiedTemplate = (data: OrderVerifiedData): string => {
  const eventsList = data.events
    .map((event) => {
      const dateStr = event.eventDate
        ? new Date(event.eventDate).toLocaleDateString('en-IN', {
          dateStyle: 'long',
        })
        : 'TBA';
      const venueStr = event.venue ? ` | Venue: ${event.venue}` : '';
      return `    • ${event.name}\n      📅 ${dateStr}${venueStr}`;
    })
    .join('\n\n');

  // Build full name from firstName and lastName
  const userName = `${data.user.firstName} ${data.user.lastName}`.trim();

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .event-item { padding: 15px; background: #f0fdf4; border-radius: 6px; margin: 10px 0; }
    .status-badge { display: inline-block; padding: 8px 16px; background: #10b981; color: white; border-radius: 20px; font-weight: bold; }
    .cta-button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Payment Verified!</h1>
      <p>You're all set for the events</p>
    </div>
    <div class="content">
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Great news! Your payment has been verified and your registration is confirmed. 🎉</p>
      
      <div class="success-box">
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Status:</strong> <span class="status-badge">✓ VERIFIED</span></p>
        
        <h3>You're Registered For:</h3>
        <div>
${eventsList}
        </div>
      </div>
      
      <p><strong>What's Next?</strong></p>
      <ul>
        <li>Check your dashboard for event details</li>
        <li>Mark your calendar for the event dates</li>
        <li>Reach the venue 15 minutes before the event</li>
        <li>Bring your college ID for verification</li>
      </ul>
      
      <center>
        <a href="${process.env.FRONTEND_URL}/profile" class="cta-button">View My Registrations</a>
      </center>
      
      <p>See you at the events! 🚀</p>
      
      <p>Best regards,<br><strong>Xenia Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const orderRejectedTemplate = (data: OrderRejectedData): string => {
  const reasonText = data.rejectionReason
    ? `<p><strong>Reason:</strong> ${data.rejectionReason}</p>`
    : '';

  // Build full name from firstName and lastName
  const userName = `${data.user.firstName} ${data.user.lastName}`.trim();

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .error-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
    .status-badge { display: inline-block; padding: 8px 16px; background: #ef4444; color: white; border-radius: 20px; font-weight: bold; }
    .contact-box { background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Payment Verification Failed</h1>
      <p>Action Required</p>
    </div>
    <div class="content">
      <p>Hi <strong>${userName}</strong>,</p>
      <p>We were unable to verify your payment for the following order:</p>
      
      <div class="error-box">
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
        <p><strong>Status:</strong> <span class="status-badge">✗ REJECTED</span></p>
        ${reasonText}
      </div>
      
      <div class="contact-box">
        <h3>📞 Need Help?</h3>
        <p>If you believe this is an error or need assistance, please contact our support team with your order ID and transaction details.</p>
        <p><strong>Support:</strong> support@xenia.com</p>
      </div>
      
      <p><strong>Common Reasons for Rejection:</strong></p>
      <ul>
        <li>Transaction ID doesn't match our records</li>
        <li>Incorrect payment amount</li>
        <li>Payment sent to wrong account</li>
        <li>Duplicate transaction ID</li>
      </ul>
      
      <p>Best regards,<br><strong>Xenia Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};
