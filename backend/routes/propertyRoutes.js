const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const UserProperty = require('../models/UserProperty');
const User = require('../models/User');

/**
 * @route GET /properties
 * @desc Get all properties owned by a user
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const { telegramChatId } = req.query;
    
    if (!telegramChatId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telegram Chat ID is required' 
      });
    }

    // Find all user property relationships
    const userProperties = await UserProperty.find({ user_id: telegramChatId })
      .populate('property_id');
    
    // Format the response with ownership details
    const properties = userProperties.map(up => {
      const property = up.property_id;
      
      // Calculate ownership percentage
      const ownershipPercentage = (up.tokens_owned / property.tokens * 100).toFixed(2);
      
      // Calculate growth percentage
      const currentValuePerToken = property.price / property.tokens;
      const currentValue = currentValuePerToken * up.tokens_owned;
      const growthPercentage = (
        (currentValuePerToken - up.purchase_price_per_token) / 
        up.purchase_price_per_token * 100
      ).toFixed(2);
      
      return {
        id: property._id,
        title: property.property_name,
        location: property.location,
        propertyType: property.property_type,
        zoning: property.property_type, // Using property_type as zoning for now
        titleStatus: 'C of O', // Hardcoded for now, can be added to Property model later
        tokensOwned: up.tokens_owned,
        totalTokens: property.tokens,
        ownershipPercentage: parseFloat(ownershipPercentage),
        purchasePrice: up.total_purchase_price,
        currentValue: currentValue,
        growthPercentage: parseFloat(growthPercentage),
        images: property.images || []
      };
    });
    
    res.json({ 
      success: true, 
      properties
    });
  } catch (error) {
    console.error('Error fetching user properties:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching properties',
      error: error.message
    });
  }
});

/**
 * @route GET /properties/available
 * @desc Get all approved properties available for purchase
 * @access Public
 */
router.get('/available', async (req, res) => {
  try {
    const { 
      location, 
      propertyType, 
      minPrice, 
      maxPrice, 
      sort = 'newest',
      page = 1,
      limit = 10
    } = req.query;
    
    // Build filter query
    const filter = { 
      status: 'approved',
      isLive: true
    };
    
    // Add optional filters if provided
    if (location) {
      filter.location = { $regex: location, $options: 'i' }; // Case-insensitive search
    }
    
    if (propertyType) {
      filter.property_type = propertyType;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    // Build sort options
    let sortOption = {};
    switch (sort) {
      case 'priceAsc':
        sortOption = { price: 1 };
        break;
      case 'priceDesc':
        sortOption = { price: -1 };
        break;
      case 'valueIncrease':
        sortOption = { valueIncrease: -1 };
        break;
      case 'newest':
      default:
        sortOption = { submitted_at: -1 };
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query with pagination
    const properties = await Property.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    
    // Get total count for pagination
    const total = await Property.countDocuments(filter);
    
    // Format the response
    const formattedProperties = properties.map(property => {
      // For debugging
      console.log(`Processing property: ${property.property_name}`);
      console.log(`Current market value: ${property.currentMarketValue}`);
      console.log(`Value increase: ${property.valueIncrease}`);
      
      return {
        id: property._id,
        title: property.property_name,
        location: property.location,
        propertyType: property.property_type,
        zoning: property.property_type, // Using property_type as zoning for now
        titleStatus: 'C of O', // Hardcoded for now
        totalTokens: property.tokens,
        pricePerToken: property.price / property.tokens,
        totalPrice: property.price,
        currentMarketValue: property.currentMarketValue || property.price,
        valueIncrease: property.valueIncrease || 0,
        images: property.images || [],
        description: property.description
      };
    });
    
    res.json({ 
      success: true, 
      data: {
        properties: formattedProperties,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching available properties:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching available properties',
      error: error.message
    });
  }
});

/**
 * @route GET /properties/:id
 * @desc Get details of a specific property
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { telegramChatId } = req.query;
    
    // Find the property
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found' 
      });
    }
    
    // Base property details
    const propertyDetails = {
      id: property._id,
      title: property.property_name,
      location: property.location,
      propertyType: property.property_type,
      zoning: property.property_type, // Using property_type as zoning for now
      titleStatus: 'C of O', // Hardcoded for now
      totalTokens: property.tokens,
      pricePerToken: property.price / property.tokens,
      totalPrice: property.price,
      images: property.images || [],
      description: property.description
    };
    
    // If telegramChatId is provided, include ownership details
    if (telegramChatId) {
      const userProperty = await UserProperty.findOne({
        user_id: telegramChatId,
        property_id: id
      });
      
      if (userProperty) {
        const ownershipPercentage = (userProperty.tokens_owned / property.tokens * 100).toFixed(2);
        const currentValuePerToken = property.price / property.tokens;
        const currentValue = currentValuePerToken * userProperty.tokens_owned;
        const growthPercentage = (
          (currentValuePerToken - userProperty.purchase_price_per_token) / 
          userProperty.purchase_price_per_token * 100
        ).toFixed(2);
        
        propertyDetails.ownership = {
          tokensOwned: userProperty.tokens_owned,
          ownershipPercentage: parseFloat(ownershipPercentage),
          purchasePrice: userProperty.total_purchase_price,
          currentValue: currentValue,
          growthPercentage: parseFloat(growthPercentage)
        };
      }
    }
    
    res.json({ 
      success: true, 
      data: {
        property: propertyDetails
      }
    });
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching property details',
      error: error.message
    });
  }
});

module.exports = router;
