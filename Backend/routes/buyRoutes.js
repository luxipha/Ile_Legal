const express = require('express');
const router = express.Router();
const axios = require('axios'); 
const { initiatePayment } = require('../services/paystack');

// In buyRoutes.js, 
router.post('/', async (req, res) => {
    const { email, tokenAmount, currency, totalAmount } = req.body;

    if (!email || !tokenAmount || !currency || !totalAmount) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: totalAmount * 100, // using frontend calculation
                currency,
                metadata: { tokenAmount }
            },
            { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
        );

        res.json({
            success: true,
            checkoutUrl: response.data.data.authorization_url
        });
    } catch (error) {
        console.error("Paystack Error:", error.response?.data);
        res.status(500).json({ success: false, message: error.response?.data?.message || 'Payment failed' });
    }
});


module.exports = router;
