const sendEmail = require('./email'); // Adjust path if needed

sendEmail(
    'aremu_abisoye@live.com', 
    'Test Email', 
    'This is a plain text test email.', 
    '<h1>This is a test email</h1>'
).then(success => {
    console.log(success ? 'Email sent successfully!' : 'Failed to send email.');
    process.exit();
}).catch(err => {
    console.error('Error sending email:', err);
    process.exit(1);
});
