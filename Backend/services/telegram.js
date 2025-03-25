const axios = require('axios');

const sendTelegramMessage = async (chatId, message) => {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: message
    });
};

module.exports = { sendTelegramMessage };
