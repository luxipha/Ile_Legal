const axios = require('axios');
const User = require('../models/User');
const TokenSupply = require('../models/TokenSupply');
const sendTelegramMessage = require('../services/telegram');

const initiatePayment = async (email, tokenAmount, currency) => {
    // Fetch current token supply
    const supply = await TokenSupply.findOne();

    if (!supply || supply.remainingSupply < tokenAmount) {
        throw new Error('Not enough tokens available.');
    }

    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
        email,
        amount: tokenAmount * 100,
        currency,
        metadata: { tokenAmount }
    }, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });

    return { success: true, checkoutUrl: response.data.data.authorization_url };
};

const processWebhook = async (data) => {
    if (data.event !== 'charge.success') return;

    const { email, amount, metadata, reference } = data.data;
    const tokenAmount = metadata?.tokenAmount || amount / 100;

    const supply = await TokenSupply.findOne();

    if (!supply || supply.remainingSupply < tokenAmount) {
        console.error('Token depletion error: Not enough tokens available.');
        return;
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

    await sendTelegramMessage(user.telegramChatId || email, `Token Purchase Confirmed: ${tokenAmount} tokens added.`);
};

module.exports = { initiatePayment, processWebhook };
