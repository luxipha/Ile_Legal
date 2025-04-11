const axios = require('axios');
const user = require('@models/User');
const tokenSupply = require('@models/TokenSupply');
const sendTelegramMessage = require('@services/telegram');

const processWebhook = async (data) => {
    if (data.event !== 'charge.success') {
        console.log(`Skipping webhook event: ${data.event} (not charge.success)`);
        return false; // Return false to indicate this wasn't processed
    }

    const { email, amount, metadata, reference } = data.data;
    const tokenAmount = metadata?.tokenAmount || amount / 100;

    console.log(`Processing payment for ${email}, token amount: ${tokenAmount}, reference: ${reference}`);

    // Use findOneAndUpdate for atomic operation to prevent race conditions
    const supplyResult = await tokenSupply.findOneAndUpdate(
        { remainingSupply: { $gte: tokenAmount } }, // Only update if enough tokens available
        { $inc: { remainingSupply: -tokenAmount } }, // Atomic decrement
        { new: true } // Return updated document
    );

    if (!supplyResult) {
        console.error('Token depletion error: Not enough tokens available.');
        throw new Error('Not enough tokens available in supply');
    }

    console.log(`Tokens deducted. Remaining supply: ${supplyResult.remainingSupply}`);

    // Check if user exists first
    console.log(`Looking for user with email: ${email}`);
    let userDoc = await user.findOne({ email: { $eq: email } });
    console.log(`User found: ${!!userDoc}`);
    
    if (!userDoc) {
        console.log(`User with email ${email} not found. Creating new user...`);
        try {
            // Validate email format
            if (!email || !email.includes('@')) {
                console.error(`Invalid email format: ${email}`);
                throw new Error(`Invalid email format: ${email}`);
            }
            
            // Create new user with default values
            userDoc = await user.create({
                email: email, // Ensure email is set correctly
                balance: 0, // Will be incremented below
                purchaseHistory: []
            });
            console.log(`New user created with ID: ${userDoc._id}, email: ${userDoc.email}`);
        } catch (error) {
            console.error(`Error creating new user: ${error.message}`);
            // If there's an error creating the user, check if it's a duplicate key error
            if (error.code === 11000) {
                console.log('Duplicate key error detected, trying to find user again');
                // Try to find the user again in case of race condition
                userDoc = await user.findOne({ email: { $eq: email } });
                if (!userDoc) {
                    console.error(`Failed to create or find user with email: ${email}`);
                    throw new Error(`Failed to create or find user with email: ${email}`);
                }
                console.log(`Found user on second attempt: ${userDoc._id}`);
            } else {
                console.error(`Non-duplicate error creating user: ${error.message}`);
                throw error; // Re-throw other errors
            }
        }
    }
    
    // Update user balance
    userDoc.balance += parseInt(tokenAmount, 10);
    userDoc.purchaseHistory.push({ 
        tokenAmount: parseInt(tokenAmount, 10), 
        paymentReference: reference, 
        currency: data.data.currency,
        purchaseDate: new Date()
    });
    userDoc.updatedAt = new Date();
    
    // Save the user
    await userDoc.save();

    console.log(`User ${email} balance updated to ${userDoc.balance}`);

    try {
        if (userDoc.telegramChatId) {
            await sendTelegramMessage(userDoc.telegramChatId, `Token Purchase Confirmed: ${tokenAmount} tokens added.`);
        } else {
            console.log(`No Telegram chat ID for user ${email}, skipping notification`);
        }
    } catch (error) {
        console.error('Error sending Telegram notification:', error.message);
        // Continue processing even if Telegram notification fails
    }
    
    return { success: true, user: userDoc, supply: supplyResult }; // Return success result
};

module.exports = { processWebhook };
