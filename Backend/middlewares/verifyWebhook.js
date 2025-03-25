const crypto = require('crypto');

const verifyPaystackWebhook = (req, res, next) => {
    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
    
    if (hash === req.headers['x-paystack-signature']) {
        next();
    } else {
        res.status(403).json({ error: 'Invalid webhook signature' });
    }
};

module.exports = verifyPaystackWebhook;
