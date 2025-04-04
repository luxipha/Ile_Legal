const express = require("express");
const router = express.Router();
const { processWebhook } = require("../services/paystack");
const verifyPaystackWebhook = require("../middlewares/verifyWebhook");
const TokenSupply = require("../models/TokenSupply");
const User = require("../models/User"); // Add User model import

// Test endpoint to verify webhook is accessible
router.get("/test", (req, res) => {
    console.log("Webhook test endpoint accessed");
    res.status(200).json({ 
        success: true, 
        message: "Webhook endpoint is accessible",
        timestamp: new Date().toISOString()
    });
});

router.post("/", verifyPaystackWebhook, async (req, res) => {
    try {
        console.log("✅ Webhook received at:", new Date().toISOString());
        console.log("✅ Webhook body:", JSON.stringify(req.body, null, 2));

        // Process the webhook data
        const result = await processWebhook(req.body);
        
        // If processWebhook returns false, it means it was not a charge.success event
        if (result === false) {
            console.log("⚠️ Not a charge.success event, skipping processing");
            return res.status(200).json({ 
                success: true,
                message: "Webhook received but not processed (not a charge.success event)"
            });
        }

        // Debug: Check if TokenSupply is working
        const supply = await TokenSupply.findOne();
        if (!supply) {
            console.error("❌ TokenSupply not found in database!");
            return res.status(200).json({ error: "Token supply not found" });
        }

        console.log("✅ TokenSupply after processing:", supply);
        console.log("✅ User after processing:", result.user);

        res.status(200).json({
            success: true,
            totalSupply: supply.totalSupply,
            remainingSupply: supply.remainingSupply,
            userEmail: result.user.email,
            userBalance: result.user.balance
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