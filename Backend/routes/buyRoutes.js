const express = require('express');
const router = express.Router();
const axios = require('axios'); 
const TokenSupply = require('../models/TokenSupply');
const { initiatePayment } = require('../services/paystack');

// In buyRoutes.js, 
router.post('/', async (req, res) => {
    const { email, tokenAmount, currency } = req.body;

    try {
        // Get current available tokens
        let supply = await TokenSupply.findOne();
        if (!supply || supply.totalSupply < tokenAmount) {
            return res.status(400).json({ success: false, message: "Not enough tokens available" });
        }

        // Proceed with payment since tokens are available
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: tokenAmount * 1500 * 100, // Convert to kobo
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
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Payment failed'
        });
    }
});


module.exports = router;
