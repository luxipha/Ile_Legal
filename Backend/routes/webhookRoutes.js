const express = require("express");
const router = express.Router();
const { processWebhook } = require("../services/paystack");
const verifyPaystackWebhook = require("../middlewares/verifyWebhook");
const TokenSupply = require("../models/TokenSupply");
const User = require("../models/User"); // Add User model import

router.post("/", verifyPaystackWebhook, async (req, res) => {
    try {
        console.log("✅ Webhook received:", JSON.stringify(req.body, null, 2));

        // Process the webhook data
        const result = await processWebhook(req.body);
        
        // If processWebhook returns false, it means it was not a charge.success event
        if (result === false) {
            return res.status(200).json({ 
                success: true,
                message: "Webhook received but not processed (not a charge.success event)"
            });
        }

        // ✅ Debug: Check if TokenSupply is working
        const supply = await TokenSupply.findOne();
        if (!supply) {
            console.error("❌ TokenSupply not found in database!");
            return res.status(500).json({ error: "Token supply not found" });
        }

        console.log("✅ TokenSupply:", supply);

        res.status(200).json({
            success: true,
            totalSupply: supply.totalSupply,
            remainingSupply: supply.remainingSupply,
        });

    } catch (error) {
        console.error("❌ Webhook Error:", error);
        // Always return 200 to Paystack even on error, to prevent retries
        res.status(200).json({ 
            success: false, 
            error: "Webhook processing failed",
            message: error.message
        });
    }
});

module.exports = router;