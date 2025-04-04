const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  property_name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  tokens: { type: Number, required: true }, // price / 1500
  property_type: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }], // Cloudinary URLs
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  developer_id: { type: String, required: true }, // Telegram user_id
  submitted_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', PropertySchema);