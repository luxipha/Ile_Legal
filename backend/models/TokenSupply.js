const mongoose = require('mongoose');

const tokenSupplySchema = new mongoose.Schema({
    totalSupply: { type: Number, required: true },
    remainingSupply: { type: Number, required: true },
    tokenPrice: { type: Number, required: true }  // ✅ Ensure this exists
});

module.exports = mongoose.model('TokenSupply', tokenSupplySchema);
