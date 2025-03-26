const express = require("express");
const router = express.Router();
const axios = require("axios");
const TokenSupply = require("../models/TokenSupply");

require("dotenv").config(); // Load environment variables

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Route to Initialize Payment (Already Correct)
router.post("/", async (req, res) => {
    const { email, tokenAmount, currency } = req.body;

    try {
        let supply = await TokenSupply.findOne();
        if (!supply || supply.remainingSupply < tokenAmount) {
            return res.status(400).json({ success: false, message: "Not enough tokens available" });
        }

        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount: tokenAmount * 1500 * 100, // Convert to kobo
                currency,
                metadata: { tokenAmount }
            },
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
        );

        res.json({
            success: true,
            checkoutUrl: response.data.data.authorization_url
        });

    } catch (error) {
        console.error("Paystack Error:", error.response?.data);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || "Payment failed"
        });
    }
});

// Route to Verify Payment & Deduct Tokens
router.post("/verify", async (req, res) => {
    const { reference } = req.body;

    try {
        // 🟢 Verify transaction with Paystack
        const verifyResponse = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
        });

        const transaction = verifyResponse.data.data;
        if (transaction.status !== "success") {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        const tokenAmount = parseInt(transaction.metadata.tokenAmount, 10);

        // 🔥 Deduct tokens from supply
        const supply = await TokenSupply.findOne();
        if (!supply || supply.remainingSupply < tokenAmount) {
            return res.status(400).json({ success: false, message: "Not enough tokens available" });
        }

        supply.remainingSupply -= tokenAmount;
        await supply.save();

        res.json({
            success: true,
            message: `Successfully purchased ${tokenAmount} tokens!`,
            remainingSupply: supply.remainingSupply
        });

    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
