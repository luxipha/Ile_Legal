// Setup module aliases for path resolution
require('module-alias/register');
require('./config/aliases');

const sendEmail = require('@services/email');
const { paymentConfirmationEmail, paymentConfirmationText } = require('@services/emailTemplates');

// Test email parameters
const testParams = {
  name: 'Test User',
  tokenAmount: 10,
  balance: 100,
  reference: 'TEST-REF-123',
  currency: 'NGN',
  amount: 15000 // 150 NGN in kobo
};

// Test sending an email
async function testEmailService() {
  try {
    console.log('Testing email service...');
    const result = await sendEmail(
      'test@example.com',
      'Test Email - Ile Properties',
      paymentConfirmationText(testParams),
      paymentConfirmationEmail(testParams)
    );
    
    console.log('Email test result:', result);
  } catch (error) {
    console.error('Error testing email service:', error);
  }
}

testEmailService();
