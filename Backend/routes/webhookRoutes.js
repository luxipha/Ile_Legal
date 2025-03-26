const express = require('express');
const router = express.Router();
const { processWebhook } = require('../services/paystack');
const verifyPaystackWebhook = require('../middlewares/verifyWebhook');

router.post('/', verifyPaystackWebhook, async (req, res) => {
    try {
        await processWebhook(req.body);

        // Get updated supply after purchase
        const supply = await TokenSupply.findOne();

        res.json({
            success: true,
            totalSupply: supply.totalSupply,
            remainingSupply: supply.totalSupply
        });

    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;
