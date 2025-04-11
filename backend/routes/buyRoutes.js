const express = require("express");
const router = express.Router();
const axios = require("axios");
const tokenSupply = require("@models/TokenSupply");
const user = require("@models/User");
const sendEmail = require("@services/email");
const { paymentConfirmationEmail, paymentConfirmationText } = require("@services/emailTemplates");

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
        console.log(`Verifying payment with reference: ${reference}`);
        
        // Verify transaction with Paystack
        const verifyResponse = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
        });

        const transaction = verifyResponse.data.data;
        
        // Enhanced logging to debug transaction data
        console.log("Transaction data:", JSON.stringify(transaction, null, 2));
        
        if (transaction.status !== "success") {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        // Get token amount and email from transaction data
        const tokenAmount = transaction.metadata?.tokenAmount 
            ? parseInt(transaction.metadata.tokenAmount, 10) 
            : Math.floor(transaction.amount / 100 / 1500);
            
        const email = transaction.customer?.email;

        console.log(`Verifying payment for ${email}, token amount: ${tokenAmount}, reference: ${reference}`);

        if (!email) {
            console.error("Error: No email found in transaction data");
            return res.status(400).json({ success: false, message: "No email associated with transaction" });
        }

        // Check if user exists
        console.log(`Looking for user with email: ${email}`);
        let userDoc = await user.findOne({ email: { $eq: email } });
        console.log(`User found in verification: ${!!userDoc}`);
        
        if (!userDoc) {
            console.log(`User with email ${email} not found during verification. Creating new user...`);
            try {
                // Create new user with default values
                userDoc = await user.create({
                    email: email,
                    balance: tokenAmount, // Set initial balance to token amount
                    purchaseHistory: [{
                        tokenAmount: tokenAmount,
                        paymentReference: reference,
                        currency: transaction.currency,
                        purchaseDate: new Date()
                    }]
                });
                console.log(`New user created during verification with ID: ${userDoc._id}, email: ${userDoc.email}`);
            } catch (error) {
                console.error(`Error creating user during verification: ${error.message}`);
                if (error.code === 11000) {
                    // Try to find the user again in case of race condition
                    userDoc = await user.findOne({ email: { $eq: email } });
                    if (!userDoc) {
                        return res.status(500).json({
                            success: false,
                            message: `Failed to create or find user with email: ${email}`
                        });
                    }
                    console.log(`Found user on second attempt during verification: ${userDoc._id}`);
                } else {
                    return res.status(500).json({
                        success: false,
                        message: `Error creating user: ${error.message}`
                    });
                }
            }
        } else {
            // Update existing user's balance and purchase history
            userDoc.balance += tokenAmount;
            userDoc.purchaseHistory.push({
                tokenAmount: tokenAmount,
                paymentReference: reference,
                currency: transaction.currency,
                purchaseDate: new Date()
            });
            await userDoc.save();
            console.log(`Existing user ${email} balance updated to ${userDoc.balance}`);
        }

        // Deduct tokens from supply
        const supplyResult = await tokenSupply.findOneAndUpdate(
            { remainingSupply: { $gte: tokenAmount } }, // Only update if enough tokens available
            { $inc: { remainingSupply: -tokenAmount } }, // Atomic decrement
            { new: true } // Return updated document
        );

        if (!supplyResult) {
            console.error('Token depletion error: Not enough tokens available.');
            return res.status(400).json({ success: false, message: "Not enough tokens available" });
        }

        console.log(`Tokens deducted. Remaining supply: ${supplyResult.remainingSupply}`);

        // Prepare response first
        const responseData = {
            success: true,
            message: 'Payment verified successfully',
            tokenAmount: tokenAmount,
            newBalance: userDoc.balance,
            userCreated: !userDoc
        };

        // Send the response immediately
        res.json(responseData);

        // Attempt to send email notification AFTER sending the response (non-blocking)
        try {
            const emailParams = {
                name: userDoc.name || email.split('@')[0], // Use name if available, otherwise use email username
                tokenAmount: tokenAmount,
                balance: userDoc.balance,
                reference: reference,
                currency: transaction.currency,
                amount: transaction.amount
            };
            
            // Send email asynchronously without awaiting
            sendEmail(
                email,
                "Payment Confirmation - Ile Properties",
                paymentConfirmationText(emailParams),
                paymentConfirmationEmail(emailParams)
            ).then(success => {
                if (success) {
                    console.log(`Email notification sent to ${email} for payment verification`);
                } else {
                    console.error(`Failed to send email notification to ${email}`);
                }
            }).catch(error => {
                console.error(`Error sending email notification: ${error.message}`);
            });
        } catch (error) {
            console.error(`Error preparing email notification: ${error.message}`);
        }

        // Return here is not needed as we've already sent the response
        return;
    } catch (error) {
        console.error('Error verifying payment:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Error verifying payment'
        });
    }
});

module.exports = router;
