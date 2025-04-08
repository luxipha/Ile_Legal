const express = require("express");
const router = express.Router();
const axios = require("axios");
const tokenSupply = require("@models/TokenSupply");
const user = require("@models/User");

require("dotenv").config(); // Load environment variables

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Route to Initialize Payment (Already Correct)
router.post("/", async (req, res) => {
    const { email, tokenAmount, currency } = req.body;

    try {
        let supply = await tokenSupply.findOne();
        if (!supply || supply.remainingSupply < tokenAmount) {
            return res.status(400).json({ success: false, message: "Not enough tokens available" });
        }

        // Log the callback URL for debugging
        const callbackUrl = process.env.FRONTEND_URL + "/payment-verification";
        console.log("Payment callback URL:", callbackUrl);

        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount: tokenAmount * 1500 * 100, // Convert to kobo
                currency,
                metadata: { tokenAmount },
                callback_url: callbackUrl // Use the environment variable
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
        // Verify transaction with Paystack
        const verifyResponse = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
        });

        const transaction = verifyResponse.data.data;
        if (transaction.status !== "success") {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        const tokenAmount = parseInt(transaction.metadata.tokenAmount, 10);
        const email = transaction.customer.email;

        // Enhanced logging to debug email issues
        console.log("Transaction data:", {
            status: transaction.status,
            reference,
            tokenAmount,
            email,
            customer: transaction.customer,
            metadata: transaction.metadata
        });

        if (!email) {
            console.error("Error: No email found in transaction data");
            return res.status(400).json({ success: false, message: "No email associated with transaction" });
        }

        console.log(`Verifying payment for ${email}, token amount: ${tokenAmount}, reference: ${reference}`);

        // Deduct tokens from supply using atomic operation
        const supplyResult = await tokenSupply.findOneAndUpdate(
            { remainingSupply: { $gte: tokenAmount } }, // Only update if enough tokens available
            { $inc: { remainingSupply: -tokenAmount } }, // Atomic decrement
            { new: true } // Return updated document
        );

        if (!supplyResult) {
            return res.status(400).json({ success: false, message: "Not enough tokens available" });
        }

        // Update user balance - with improved query to ensure email matching works
        const userQuery = { email: { $eq: email } }; // Explicit equality check
        console.log("User query:", userQuery);
        
        const userResult = await user.findOneAndUpdate(
            userQuery,
            { 
                $set: { 
                    email, // Explicitly set email to ensure it's never null
                    updatedAt: new Date() // Update the timestamp
                },
                $inc: { balance: tokenAmount },
                $push: { purchaseHistory: { tokenAmount, paymentReference: reference, currency: transaction.currency } }
            },
            { 
                upsert: true, 
                new: true,
                // Add runValidators to ensure schema validation runs on update
                runValidators: true 
            }
        );

        console.log(`User updated/created:`, {
            id: userResult._id,
            email: userResult.email,
            newBalance: userResult.balance,
            purchaseHistoryCount: userResult.purchaseHistory.length
        });

        console.log(`Tokens deducted. Remaining supply: ${supplyResult.remainingSupply}`);

        res.json({
            success: true,
            message: `Successfully purchased ${tokenAmount} tokens!`,
            remainingSupply: supplyResult.remainingSupply,
            userBalance: userResult.balance
        });

    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
