const nodemailer = require('nodemailer');
require('dotenv').config();

// Validate SMTP configuration
const validateSmtpConfig = () => {
    const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredVars.filter(variable => !process.env[variable]);
    
    if (missingVars.length > 0) {
        console.warn(`⚠️ Missing SMTP configuration: ${missingVars.join(', ')}. Will use fallback method.`);
        return false;
    }
    return true;
};

const createTransporter = async () => {
    // Try to use configured SMTP first
    if (validateSmtpConfig()) {
        console.log('✅ Using configured SMTP server');
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    
    // Fallback to Ethereal Email for testing
    console.log('⚠️ Using Ethereal Email as fallback');
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
};

const sendEmail = async (to, subject, text, html, maxRetries = 2) => {
    let retries = 0;
    
    while (retries <= maxRetries) {
        try {
            // Create a new transporter for each attempt
            const transporter = await createTransporter();
            
            // Send the email
            const info = await transporter.sendMail({
                from: `"Ile Properties" <${process.env.SMTP_USER || 'noreply@ile.africa'}>`,
                to,
                subject,
                text,
                html
            });
            
            // Check if using Ethereal and provide preview URL
            if (info.messageId.includes('ethereal')) {
                console.log(`✅ Test email sent. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            } else {
                console.log(`✅ Email sent successfully to ${to} with message ID: ${info.messageId}`);
            }
            
            return true;
        } catch (error) {
            retries++;
            console.error(`❌ Email sending attempt ${retries} failed: ${error.message}`);
            
            if (retries > maxRetries) {
                console.error('❌ Max email send retries reached');
                return false;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

module.exports = sendEmail;
