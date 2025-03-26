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

    const supply = await TokenSupply.findOne();

    if (!supply || supply.remainingSupply < tokenAmount) {
        console.error('Token depletion error: Not enough tokens available.');
        throw new Error('Not enough tokens available in supply');
    }

    // Deduct tokens from supply
    supply.remainingSupply -= tokenAmount;
    await supply.save();

    // Update user balance
    const user = await User.findOneAndUpdate(
        { email },
        { 
            $inc: { balance: tokenAmount },
            $push: { purchaseHistory: { tokenAmount, paymentReference: reference, currency: data.data.currency } }
        },
        { upsert: true, new: true }
    );

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
    
    return { success: true, user, supply }; // Return success result
};
