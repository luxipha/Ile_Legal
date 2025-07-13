const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, trim: true },
    password: { type: String }, // Optional - some users may only use Telegram auth
    balance: { type: Number, default: 0, min: 0 },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    last_submission: { type: Date }, // For rate limiting
    purchaseHistory: [{
        tokenAmount: Number,
        purchaseDate: { type: Date, default: Date.now },
        paymentReference: String,
        currency: String
    }],
    telegramChatId: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
