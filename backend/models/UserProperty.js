const mongoose = require('mongoose');

const UserPropertySchema = new mongoose.Schema({
  // User who owns the property tokens
  user_id: { 
    type: String, 
    required: true,
    ref: 'User',
    index: true
  },
  
  // Reference to the property
  property_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  
  // Number of tokens owned by this user for this property
  tokens_owned: { 
    type: Number, 
    required: true,
    min: 1
  },
  
  // Price paid per token at purchase time
  purchase_price_per_token: { 
    type: Number, 
    required: true 
  },
  
  // Total purchase price for all tokens
  total_purchase_price: { 
    type: Number, 
    required: true 
  },
  
  // Date of purchase
  purchase_date: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index for faster lookups
UserPropertySchema.index({ user_id: 1, property_id: 1 }, { unique: true });

module.exports = mongoose.model('UserProperty', UserPropertySchema);
