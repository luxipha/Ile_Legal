/**
 * Email templates for various notifications
 */

/**
 * Generate HTML for payment confirmation email
 * 
 * @param {Object} params - Parameters for the email template
 * @param {string} params.name - User's name or email if name not available
 * @param {number} params.tokenAmount - Number of tokens purchased
 * @param {number} params.balance - New token balance
 * @param {string} params.reference - Payment reference
 * @param {string} params.currency - Currency used for payment
 * @param {number} params.amount - Amount paid in the currency
 * @returns {string} HTML content for the email
 */
const paymentConfirmationEmail = (params) => {
  const { name, tokenAmount, balance, reference, currency, amount } = params;
  const displayName = name || 'Valued Customer';
  const formattedAmount = new Intl.NumberFormat('en-NG', { 
    style: 'currency', 
    currency: currency || 'NGN' 
  }).format(amount / 100); // Convert kobo to naira

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #1a56db;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 0 0 5px 5px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #6b7280;
        }
        .button {
          display: inline-block;
          background-color: #1a56db;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin-top: 15px;
        }
        .details {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .details-row:last-child {
          border-bottom: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Confirmation</h1>
        </div>
        <div class="content">
          <p>Hello ${displayName},</p>
          <p>Thank you for your purchase! Your payment has been successfully processed.</p>
          
          <div class="details">
            <div class="details-row">
              <strong>Payment Reference:</strong>
              <span>${reference}</span>
            </div>
            <div class="details-row">
              <strong>Amount Paid:</strong>
              <span>${formattedAmount}</span>
            </div>
            <div class="details-row">
              <strong>Tokens Purchased:</strong>
              <span>${tokenAmount}</span>
            </div>
            <div class="details-row">
              <strong>New Balance:</strong>
              <span>${balance} tokens</span>
            </div>
            <div class="details-row">
              <strong>Date:</strong>
              <span>${new Date().toLocaleString()}</span>
            </div>
          </div>
          
          <p>You can now use these tokens to invest in properties on our platform.</p>
          
          <p>If you have any questions about your purchase, please contact our support team.</p>
          
          <div style="text-align: center;">
            <a href="https://ile.africa/dashboard" class="button">View Your Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Ile Properties. All rights reserved.</p>
          <p>123 Lagos Business District, Lagos, Nigeria</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate plain text version of payment confirmation email
 * 
 * @param {Object} params - Parameters for the email template
 * @param {string} params.name - User's name or email if name not available
 * @param {number} params.tokenAmount - Number of tokens purchased
 * @param {number} params.balance - New token balance
 * @param {string} params.reference - Payment reference
 * @param {string} params.currency - Currency used for payment
 * @param {number} params.amount - Amount paid in the currency
 * @returns {string} Plain text content for the email
 */
const paymentConfirmationText = (params) => {
  const { name, tokenAmount, balance, reference, currency, amount } = params;
  const displayName = name || 'Valued Customer';
  const formattedAmount = new Intl.NumberFormat('en-NG', { 
    style: 'currency', 
    currency: currency || 'NGN' 
  }).format(amount / 100); // Convert kobo to naira

  return `
Hello ${displayName},

Thank you for your purchase! Your payment has been successfully processed.

PAYMENT DETAILS:
- Payment Reference: ${reference}
- Amount Paid: ${formattedAmount}
- Tokens Purchased: ${tokenAmount}
- New Balance: ${balance} tokens
- Date: ${new Date().toLocaleString()}

You can now use these tokens to invest in properties on our platform.

If you have any questions about your purchase, please contact our support team.

Visit your dashboard at: https://ile.africa/dashboard

© ${new Date().getFullYear()} Ile Properties. All rights reserved.
123 Lagos Business District, Lagos, Nigeria
  `;
};

module.exports = {
  paymentConfirmationEmail,
  paymentConfirmationText
};
