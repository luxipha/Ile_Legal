// services/emailTemplates/paystackPurchaseTemplate.js

const emailTemplates = (tokenAmount, reference, balance) => {
    return {
        subject: 'Token Purchase Confirmation',
        text: `
Dear User,

Your token purchase has been successfully processed.

Details:
- Tokens Purchased: ${tokenAmount}
- Payment Reference: ${reference}
- Current Balance: ${balance}

Thank you for your purchase!

Best regards,
Ile Properties Team
        `,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
        <h1 style="color: #333; text-align: center;">Token Purchase Confirmation</h1>
        <p>Dear User,</p>
        <p>Your token purchase has been successfully processed.</p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #2c3e50;">Purchase Details:</h2>
            <ul style="list-style-type: none; padding: 0;">
                <li><strong>Tokens Purchased:</strong> ${tokenAmount}</li>
                <li><strong>Payment Reference:</strong> ${reference}</li>
                <li><strong>Current Balance:</strong> ${balance}</li>
            </ul>
        </div>
        
        <p>Thank you for your purchase!</p>
        
        <p style="color: #777; margin-top: 20px;">Best regards,<br>Ile Properties Team</p>
    </div>
</body>
</html>
        `
    };
};

module.exports = { emailTemplates };