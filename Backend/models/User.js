const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    balance: { type: Number, default: 0, min: 0 },
    purchaseHistory: [{
        tokenAmount: Number,
        purchaseDate: { type: Date, default: Date.now },
        paymentReference: String,
        currency: String
    }],
    telegramChatId: String
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);


