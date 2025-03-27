const axios = require('axios');
const User = require('../models/User');
const TokenSupply = require('../models/TokenSupply');
const sendTelegramMessage = require('../services/telegram');

const processWebhook = async (data) => {
    if (data.event !== 'charge.success') {
        console.log(`Skipping webhook event: ${data.event} (not charge.success)`);
        return false; // Return false to indicate this wasn't processed
    }

    const { email, amount, metadata, reference } = data.data;
    const tokenAmount = metadata?.tokenAmount || amount / 100;

    console.log(`Processing payment for ${email}, token amount: ${tokenAmount}, reference: ${reference}`);

    // Use findOneAndUpdate for atomic operation to prevent race conditions
    const supplyResult = await TokenSupply.findOneAndUpdate(
        { remainingSupply: { $gte: tokenAmount } }, // Only update if enough tokens available
        { $inc: { remainingSupply: -tokenAmount } }, // Atomic decrement
        { new: true } // Return updated document
    );

    if (!supplyResult) {
        console.error('Token depletion error: Not enough tokens available.');
        throw new Error('Not enough tokens available in supply');
    }

    console.log(`Tokens deducted. Remaining supply: ${supplyResult.remainingSupply}`);

    // Update user balance
    const user = await User.findOneAndUpdate(
        { email },
        { 
            $inc: { balance: tokenAmount },
            $push: { purchaseHistory: { tokenAmount, paymentReference: reference, currency: data.data.currency } }
        },
        { upsert: true, new: true }
    );

    console.log(`User ${email} balance updated to ${user.balance}`);

    try {
        if (user.telegramChatId) {
            await sendTelegramMessage(user.telegramChatId, `Token Purchase Confirmed: ${tokenAmount} tokens added.`);
        } else {
            console.log(`No Telegram chat ID for user ${email}, skipping notification`);
        }
    } catch (error) {
        console.error('Error sending Telegram notification:', error.message);
        // Continue processing even if Telegram notification fails
    }
    
    return { success: true, user, supply: supplyResult }; // Return success result
};

module.exports = { processWebhook };
