// At the top of telegramBot.js
require('module-alias/register');
require('./config/aliases');

// telegramBot.js (in project root)
require('dotenv').config();
const { Telegraf, session, Markup } = require('telegraf');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/User');
const Property = require('./models/Property');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific handling code here
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for Telegram bot'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import centralized Cloudinary config
const cloudinary = require('./config/cloudinaryConfig');

// Create a new bot instance
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Admin middleware
const isAdmin = async (ctx, next) => {
  try {
    console.log('🔍 Admin middleware checking user:', ctx.from.id);
    const userId = ctx.from.id.toString();
    console.log('🔍 Looking up user with telegramChatId:', userId);
    
    const user = await User.findOne({ telegramChatId: userId });
    console.log('🔍 User lookup result:', user ? 'Found' : 'Not found');
    
    if (!user) {
      console.log('❌ User not found in database');
      await ctx.reply('⛔ You need to be registered. Use /start to register first.');
      return;
    }
    
    console.log('🔍 User isAdmin status:', user.isAdmin);
    if (!user.isAdmin) {
      console.log('❌ User found but not an admin:', userId);
      await ctx.reply('⛔ You do not have admin privileges to use this command.');
      return;
    }
    
    // User is admin, continue to the command handler
    console.log('✅ Admin access confirmed for user:', userId);
    ctx.state.user = user; // Store user in context for command handlers
    console.log('🔍 Calling next middleware/handler');
    return await next();
  } catch (error) {
    console.error('❌ Admin middleware error:', error);
    await ctx.reply('⚠️ An error occurred while checking permissions.');
  }
};

// Register session middleware
bot.use(session());

// Start command - improved with welcome message and keyboard
bot.command('start', async (ctx) => {
  try {
    console.log('Start command received');
    // Check if user exists in database
    let userDoc = await User.findOne({ telegramChatId: ctx.from.id });
    
    // If user doesn't exist, create a new one
    if (!userDoc) {
      const newUser = new User({
        telegramChatId: ctx.from.id,
        name: ctx.from.first_name || 'User',
        email: `telegram_${ctx.from.id}@placeholder.com`, // Placeholder email
        isAdmin: false,
        isBanned: false
      });
      
      userDoc = await newUser.save();
      console.log(`New user registered with Telegram ID: ${ctx.from.id}`);
    }
    
    // Welcome message with instructions
    const welcomeMessage = `👋 Welcome to Ile Properties Bot, ${userDoc.name || ctx.from.first_name || 'there'}!

This bot helps you submit your property for tokenization and manage tokenized property. Here's what you can do:

• Submit new properties for tokenization
• View your submitted properties
• Get updates on tokenization status

Type /help to see all available commands.`;

    // Set up web app menu button
    try {
      await ctx.telegram.setChatMenuButton({
        chat_id: ctx.chat.id,
        menu_button: {
          type: 'web_app',
          text: 'Ile Properties',
          web_app: {
            url: 'https://ile-properties.com' // Replace with your actual web app URL
          }
        }
      });
      console.log('Web app menu button set successfully');
    } catch (menuError) {
      console.error('Error setting web app menu button:', menuError);
    }

    // Send welcome message with keyboard
    await ctx.reply(welcomeMessage, Markup.keyboard([
      ['/add_property', '/my_properties'],
      ['/help']
    ]).resize());
    
  } catch (error) {
    console.error('Error in start command:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Help command - improved with detailed instructions
bot.command('help', async (ctx) => {
  console.log('Help command received');
  try {
    let message = `📚 *Ile Properties Bot Commands*\n\n`;
    message += `*Basic Commands:*\n`;
    message += `• /start - Start the bot and see welcome message\n`;
    message += `• /help - Show this help message\n\n`;
    
    message += `*Property Management:*\n`;
    message += `• /add_property - Submit a new property listing\n`;
    message += `• /my_properties - View your submitted properties\n`;
    message += `• /cancel - Cancel current property submission\n\n`;
    
    // Admin commands
    message += `*Admin Commands:*\n`;
    message += `• /pending_properties - View properties pending approval\n`;
    message += `• /all_properties - View all properties\n`;
    message += `• /ban_user [id] - Ban a user\n`;
    message += `• /unban_user [id] - Unban a user\n\n`;
    
    message += `To get started, try the /add_property command to submit your first property!`;
    
    // Try with HTML formatting instead of Markdown
    await ctx.reply(message.replace(/\*/g, '').replace(/•/g, '- '));
    console.log('Help message sent successfully');
  } catch (error) {
    console.error('Error sending help message:', error);
    ctx.reply('An error occurred while showing help. Please try again later.');
  }
});

// My properties command
bot.command('my_properties', async (ctx) => {
  try {
    console.log('my_properties command received');
    const userId = ctx.from.id.toString();
    console.log('User ID:', userId);
    
    // Check if user exists in the database
    const userDoc = await User.findOne({ telegramChatId: userId });
    console.log('User found:', !!userDoc);
    
    // If user doesn't exist, prompt them to register
    if (!userDoc) {
      return ctx.reply('You need to be registered in our system. Please use /start to register.');
    }
    
    // Find properties submitted by this user
    const properties = await Property.find({ developer_id: userId }).sort({ submitted_at: -1 });
    console.log('Properties found:', properties ? properties.length : 0);
    
    if (!properties || properties.length === 0) {
      return ctx.reply('You have not submitted any properties yet. Use /add_property to submit a new property.');
    }
    
    // Display properties
    let message = 'Your Properties:\n\n';
    properties.forEach((property, index) => {
      message += `${index + 1}. ${property.property_name} - ${property.location}\n`;
      message += `   Status: ${property.status}, Price: ₦${property.price.toLocaleString()}\n\n`;
    });
    
    await ctx.reply(message);
  } catch (error) {
    console.error('Error in my_properties command:', error);
    ctx.reply('An error occurred while fetching your properties. Please try again later.');
  }
});

// Command to make a user an admin (protected with a secret code)
bot.command('makeAdmin', async (ctx) => {
  console.log('makeAdmin command received');
  try {
    const args = ctx.message.text.split(' ');
    
    // Check for secret code
    if (args.length < 2 || args[1] !== process.env.ADMIN_SECRET_CODE) {
      return ctx.reply('Invalid or missing secret code.');
    }
    
    const userId = ctx.from.id;
    
    // Update user to be an admin
    const result = await User.findOneAndUpdate(
      { telegramChatId: userId },
      { isAdmin: true },
      { new: true }
    );
    
    if (result) {
      console.log(`User ${userId} granted admin privileges`);
      ctx.reply('You have been granted admin privileges. You can now use admin commands like /pending_properties, /all_properties, /ban_user, and /unban_user.');
    } else {
      ctx.reply('User not found. Please use /start to register first.');
    }
  } catch (error) {
    console.error('Error in makeAdmin command:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Command to make a user an admin
bot.command('makeadmin', async (ctx) => {
  try {
    console.log('makeadmin command received with full text:', ctx.message.text);
    const secretCode = ctx.message.text.split(' ')[1];
    const adminSecretCode = process.env.ADMIN_SECRET_CODE;
    
    console.log('Secret code received:', secretCode);
    console.log('Expected admin secret code:', adminSecretCode);
    console.log('Do they match?', secretCode === adminSecretCode);
    
    if (secretCode === adminSecretCode) {
      const userId = ctx.from.id.toString();
      console.log('Checking for user with telegramChatId:', userId);
      
      const userFound = await User.findOne({ telegramChatId: userId });
      console.log('User found:', !!userFound, userFound ? `isAdmin: ${userFound.isAdmin}` : '');
      
      if (userFound) {
        // Check if user is already an admin
        if (userFound.isAdmin) {
          console.log('User is already an admin');
          return ctx.reply('You are already an admin! You can use admin commands like /pending_properties');
        }
        
        console.log('Updating existing user to admin');
        userFound.isAdmin = true;
        await userFound.save();
        return ctx.reply('You are now an admin! You can use admin commands like /pending_properties');
      } else {
        // Create new user with admin privileges
        console.log('Creating new user with admin privileges');
        await User.create({
          telegramChatId: userId,
          email: `admin_${userId}@ile.app`,
          isAdmin: true
        });
        return ctx.reply('You have been registered as an admin! You can use admin commands like /pending_properties');
      }
    } else {
      console.log('Invalid admin secret code provided');
      return ctx.reply('Invalid admin secret code.');
    }
  } catch (error) {
    console.error('Error in makeadmin command:', error);
    ctx.reply('An error occurred while processing your request.');
  }
});

// Command to view pending properties
bot.command('pending_properties', isAdmin, async (ctx) => {
  try {
    console.log('🔍 pending_properties command received');
    console.log('✅ Admin access confirmed, fetching pending properties...');
    
    // Query for pending properties
    const pending = await Property.find({ status: 'pending' }).sort({ submitted_at: 1 });
    console.log('🔍 Pending properties found:', pending.length);
    
    if (pending.length === 0) {
      return ctx.reply('No pending properties found. When users submit properties, they will appear here for your approval.');
    }
    
    // Send the first pending property
    const prop = pending[0];
    console.log('🔍 Sending property details for ID:', prop._id.toString());
    
    let message = `📝 *Pending Property #${prop._id}*\n\n`;
    message += `*Name:* ${prop.property_name}\n`;
    message += `*Location:* ${prop.location}\n`;
    message += `*Price:* ₦${prop.price.toLocaleString()}\n`;
    message += `*Tokens Required:* ${prop.tokens}\n`;
    message += `*Type:* ${prop.property_type}\n`;
    message += `*Description:* ${prop.description}\n`;
    message += `*Submitted By:* ${prop.developer_id}\n`;
    message += `*Submitted At:* ${new Date(prop.submitted_at).toLocaleString()}\n`;
    
    // Create inline keyboard for approve/reject actions
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Approve', `approve_property:${prop._id}`),
        Markup.button.callback('❌ Reject', `reject_property:${prop._id}`)
      ],
      [Markup.button.callback('⏭️ Next Property', 'next_property')]
    ]);
    
    console.log('🔍 Sending message with property details and inline keyboard');
    
    // Send property details with inline keyboard
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (error) {
    console.error('❌ Error in pending_properties command:', error);
    ctx.reply('An error occurred while processing your request.');
  }
});

// Command to view all properties
bot.command('all_properties', isAdmin, async (ctx) => {
  try {
    console.log('🔍 all_properties command received');
    console.log('✅ Admin access confirmed, fetching all properties...');
    
    const properties = await Property.find().sort({ submitted_at: -1 }).limit(10);
    console.log('🔍 Properties found:', properties.length);
    
    if (properties.length === 0) {
      return ctx.reply('No properties found in the database. When users submit properties, they will appear here.');
    }
    
    // Display properties summary
    let message = 'Recent Properties:\n\n';
    properties.forEach((prop, index) => {
      message += `${index + 1}. ${prop.property_name} - ${prop.location}\n`;
      message += `   Status: ${prop.status}, Price: ₦${prop.price.toLocaleString()}\n\n`;
    });
    
    console.log('🔍 Sending properties summary');
    await ctx.reply(message);
  } catch (error) {
    console.error('❌ Error in all_properties command:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Action for approving a property
bot.action(/approve_property:(.+)/, isAdmin, async (ctx) => {
  try {
    console.log('🔍 approve_property action received');
    const propertyId = ctx.match[1];
    console.log('🔍 Property ID:', propertyId);
    
    // Update property status
    const property = await Property.findById(propertyId);
    if (!property) {
      console.log('❌ Property not found:', propertyId);
      await ctx.answerCbQuery('Property not found');
      return;
    }
    
    console.log('✅ Approving property:', property.property_name);
    property.status = 'approved';
    property.isLive = true;
    await property.save();
    
    await ctx.answerCbQuery('Property approved successfully');
    await ctx.editMessageText(`Property ${property.property_name} has been approved.`);
    
    // Show next pending property
    const pending = await Property.find({ status: 'pending' }).sort({ submitted_at: 1 });
    if (pending.length === 0) {
      return ctx.reply('No more pending properties.');
    }
    
    const prop = pending[0];
    let message = `📝 *Pending Property #${prop._id}*\n\n`;
    message += `*Name:* ${prop.property_name}\n`;
    message += `*Location:* ${prop.location}\n`;
    message += `*Price:* ₦${prop.price.toLocaleString()}\n`;
    message += `*Tokens Required:* ${prop.tokens}\n`;
    message += `*Type:* ${prop.property_type}\n`;
    message += `*Description:* ${prop.description}\n`;
    message += `*Submitted By:* ${prop.developer_id}\n`;
    message += `*Submitted At:* ${new Date(prop.submitted_at).toLocaleString()}\n`;
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Approve', `approve_property:${prop._id}`),
        Markup.button.callback('❌ Reject', `reject_property:${prop._id}`)
      ],
      [Markup.button.callback('⏭️ Next Property', 'next_property')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (error) {
    console.error('❌ Error in approve_property action:', error);
    ctx.answerCbQuery('An error occurred');
  }
});

// Action for rejecting a property
bot.action(/reject_property:(.+)/, isAdmin, async (ctx) => {
  try {
    console.log('🔍 reject_property action received');
    const propertyId = ctx.match[1];
    console.log('🔍 Property ID:', propertyId);
    
    // Update property status
    const property = await Property.findById(propertyId);
    if (!property) {
      console.log('❌ Property not found:', propertyId);
      await ctx.answerCbQuery('Property not found');
      return;
    }
    
    console.log('✅ Rejecting property:', property.property_name);
    property.status = 'rejected';
    property.isLive = false;
    await property.save();
    
    await ctx.answerCbQuery('Property rejected successfully');
    await ctx.editMessageText(`Property ${property.property_name} has been rejected.`);
    
    // Show next pending property
    const pending = await Property.find({ status: 'pending' }).sort({ submitted_at: 1 });
    if (pending.length === 0) {
      return ctx.reply('No more pending properties.');
    }
    
    const prop = pending[0];
    let message = `📝 *Pending Property #${prop._id}*\n\n`;
    message += `*Name:* ${prop.property_name}\n`;
    message += `*Location:* ${prop.location}\n`;
    message += `*Price:* ₦${prop.price.toLocaleString()}\n`;
    message += `*Tokens Required:* ${prop.tokens}\n`;
    message += `*Type:* ${prop.property_type}\n`;
    message += `*Description:* ${prop.description}\n`;
    message += `*Submitted By:* ${prop.developer_id}\n`;
    message += `*Submitted At:* ${new Date(prop.submitted_at).toLocaleString()}\n`;
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Approve', `approve_property:${prop._id}`),
        Markup.button.callback('❌ Reject', `reject_property:${prop._id}`)
      ],
      [Markup.button.callback('⏭️ Next Property', 'next_property')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (error) {
    console.error('❌ Error in reject_property action:', error);
    ctx.answerCbQuery('An error occurred');
  }
});

// Action for showing next pending property
bot.action('next_property', isAdmin, async (ctx) => {
  try {
    console.log('🔍 next_property action received');
    
    // Find next pending property
    const pending = await Property.find({ status: 'pending' }).sort({ submitted_at: 1 });
    console.log('🔍 Pending properties found:', pending.length);
    
    if (pending.length === 0) {
      await ctx.answerCbQuery('No more pending properties');
      await ctx.editMessageText('No pending properties found. When users submit properties, they will appear here for your approval.');
      return;
    }
    
    // Get the next property
    const prop = pending[0];
    
    let message = `📝 *Pending Property #${prop._id}*\n\n`;
    message += `*Name:* ${prop.property_name}\n`;
    message += `*Location:* ${prop.location}\n`;
    message += `*Price:* ₦${prop.price.toLocaleString()}\n`;
    message += `*Tokens Required:* ${prop.tokens}\n`;
    message += `*Type:* ${prop.property_type}\n`;
    message += `*Description:* ${prop.description}\n`;
    message += `*Submitted By:* ${prop.developer_id}\n`;
    message += `*Submitted At:* ${new Date(prop.submitted_at).toLocaleString()}\n`;
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Approve', `approve_property:${prop._id}`),
        Markup.button.callback('❌ Reject', `reject_property:${prop._id}`)
      ],
      [Markup.button.callback('⏭️ Next Property', 'next_property')]
    ]);
    
    await ctx.answerCbQuery('Loading next property');
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (error) {
    console.error('❌ Error in next_property action:', error);
    ctx.answerCbQuery('An error occurred');
  }
});

// Command to ban a user
bot.command('ban_user', isAdmin, async (ctx) => {
  try {
    console.log('ban_user command received');
    
    // Get user ID from command arguments
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
      return ctx.reply('Usage: /ban_user <telegram_id>\n\nExample: /ban_user 123456789');
    }
    
    const targetUserId = args[1];
    
    // Update user status
    const userFound = await User.findOneAndUpdate(
      { telegramChatId: targetUserId },
      { isBanned: true },
      { new: true }
    );
    
    if (!userFound) {
      return ctx.reply('User not found.');
    }
    
    ctx.reply(`User with ID ${targetUserId} has been banned.`);
  } catch (error) {
    console.error('Error banning user:', error);
    ctx.reply('An error occurred while banning the user.');
  }
});

// Command to unban a user
bot.command('unban_user', isAdmin, async (ctx) => {
  try {
    console.log('unban_user command received');
    
    // Get user ID from command arguments
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
      return ctx.reply('Usage: /unban_user <telegram_id>\n\nExample: /unban_user 123456789');
    }
    
    const targetUserId = args[1];
    
    // Update user status
    const userFound = await User.findOneAndUpdate(
      { telegramChatId: targetUserId },
      { isBanned: false },
      { new: true }
    );
    
    if (!userFound) {
      return ctx.reply('User not found.');
    }
    
    ctx.reply(`User with ID ${targetUserId} has been unbanned.`);
  } catch (error) {
    console.error('Error unbanning user:', error);
    ctx.reply('An error occurred while unbanning the user.');
  }
});

// Property submission state
const userStates = {};

// Property types for selection
const propertyTypes = ['Apartment', 'House', 'Land', 'Commercial'];

// Handle /add_property command
bot.command('add_property', async (ctx) => {
  try {
    console.log('add_property command received');
    // Check if user is banned
    const user = await User.findOne({ telegramChatId: ctx.from.id });
    
    // If user doesn't exist yet, create them
    if (!user) {
      const newUser = new User({
        telegramChatId: ctx.from.id,
        name: ctx.from.first_name || 'User',
        email: `telegram_${ctx.from.id}@placeholder.com`, // Placeholder email
        isAdmin: false,
        isBanned: false
      });
      
      await newUser.save();
      console.log(`New user registered with Telegram ID: ${ctx.from.id}`);
    } else if (user.isBanned) {
      return ctx.reply('You are banned from submitting properties.');
    }

    // Initialize user state for property submission
    userStates[ctx.from.id] = {
      step: 'property_name',
      property: {
        developer_id: ctx.from.id.toString(),
        images: []
      }
    };

    // Start property submission flow
    ctx.reply('Let\'s add a new property. Please enter the property name:');
  } catch (error) {
    console.error('Error in add_property command:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Handle photo uploads for property submission
bot.on('photo', async (ctx) => {
  // Skip if user doesn't have an active property submission or not in image step
  if (!userStates[ctx.from.id] || userStates[ctx.from.id].step !== 'images') {
    return;
  }
  
  try {
    console.log('Processing image upload for property submission');
    const state = userStates[ctx.from.id];
    
    // Get the largest photo (best quality)
    const photoSizes = ctx.message.photo;
    const photo = photoSizes[photoSizes.length - 1];
    
    // Get file path from Telegram
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    console.log('Image file link:', fileLink.href);
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileLink.href, {
      folder: 'properties',
      resource_type: 'image'
    });
    
    console.log('Image uploaded to Cloudinary:', result.secure_url);
    
    // Add image URL to property
    state.property.images.push(result.secure_url);
    
    // If this is the first image, move to next step
    if (state.property.images.length === 1) {
      ctx.reply('Image uploaded successfully! You can send more images or type /done to finish adding images.');
    } else {
      ctx.reply(`Image ${state.property.images.length} uploaded successfully! You can send more images or type /done to finish adding images.`);
    }
  } catch (error) {
    console.error('Error processing image upload:', error);
    ctx.reply('An error occurred while uploading the image. Please try again or use /cancel to start over.');
  }
});

// Done command for completing image uploads
bot.command('done', async (ctx) => {
  // Skip if user doesn't have an active property submission or not in image step
  if (!userStates[ctx.from.id] || userStates[ctx.from.id].step !== 'images') {
    return;
  }
  
  try {
    const state = userStates[ctx.from.id];
    
    // Check if at least one image was uploaded
    if (state.property.images.length === 0) {
      return ctx.reply('Please upload at least one image of the property before proceeding.');
    }
    
    // Save the property to the database
    const newProperty = new Property({
      property_name: state.property.property_name,
      location: state.property.location,
      price: state.property.price,
      tokens: Math.floor(state.property.price / 1500), // Calculate tokens based on price
      property_type: state.property.property_type,
      description: state.property.description,
      developer_id: state.property.developer_id,
      images: state.property.images,
      status: 'pending',
      isLive: false,
      submitted_at: new Date()
    });
    
    console.log('Saving new property to database:', newProperty);
    await newProperty.save();
    console.log('Property saved successfully with ID:', newProperty._id);
    
    // Update user's last submission time
    await User.findOneAndUpdate(
      { telegramChatId: ctx.from.id },
      { last_submission: Date.now() }
    );
    
    // Clear user state
    delete userStates[ctx.from.id];
    
    // Send confirmation with web app buttons
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('Add Another Property', 'add_another_property')],
      [Markup.button.callback('View My Properties', 'view_my_properties')]
    ]);
    
    ctx.reply('Thank you! Your property has been submitted for review. You will be notified once it is approved.', keyboard);
  } catch (error) {
    console.error('Error saving property:', error);
    ctx.reply('An error occurred while saving your property. Please try again or use /cancel to start over.');
  }
});

// Handle text messages for property submission steps
bot.on('text', async (ctx) => {
  // Skip if it's a command or user doesn't have an active property submission
  if (ctx.message.text.startsWith('/') || !userStates[ctx.from.id]) {
    return;
  }
  
  console.log('Processing property submission step for user:', ctx.from.id);
  const state = userStates[ctx.from.id];
  const text = ctx.message.text;
  
  try {
    switch (state.step) {
      case 'property_name':
        console.log('Processing property_name step:', text);
        state.property.property_name = text;
        state.step = 'location';
        ctx.reply('Great! Now enter the property location:');
        break;
        
      case 'location':
        console.log('Processing location step:', text);
        state.property.location = text;
        state.step = 'price';
        ctx.reply('What is the price of the property in Naira? (numbers only, e.g. 5000000)');
        break;
        
      case 'price':
        console.log('Processing price step:', text);
        const price = parseFloat(text.replace(/,/g, ''));
        if (isNaN(price) || price <= 0) {
          return ctx.reply('Please enter a valid price (numbers only).');
        }
        state.property.price = price;
        state.step = 'property_type';
        
        // Show property type options
        const keyboard = Markup.keyboard(propertyTypes.map(type => [type]))
          .oneTime()
          .resize();
        
        ctx.reply('Select the property type:', keyboard);
        break;
        
      case 'property_type':
        console.log('Processing property_type step:', text);
        if (!propertyTypes.includes(text)) {
          return ctx.reply('Please select a valid property type from the keyboard.');
        }
        state.property.property_type = text;
        state.step = 'description';
        
        // Remove keyboard
        ctx.reply('Please provide a description of the property:', Markup.removeKeyboard());
        break;
        
      case 'description':
        console.log('Processing description step:', text);
        state.property.description = text;
        state.step = 'images';
        
        ctx.reply('Please send images of the property (send them one by one). When you\'re done, type /done.');
        break;
    }
  } catch (error) {
    console.error('Error processing property submission step:', error);
    ctx.reply('An error occurred. Please try again or use /cancel to start over.');
  }
});

// Handle add_another_property action
bot.action('add_another_property', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    // Initialize user state for property submission
    userStates[ctx.from.id] = {
      step: 'property_name',
      property: {
        developer_id: ctx.from.id.toString(),
        images: []
      }
    };
    
    // Start property submission flow
    ctx.reply('Let\'s add a new property. Please enter the property name:');
  } catch (error) {
    console.error('Error in add_another_property action:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Handle view_my_properties action
bot.action('view_my_properties', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await handleMyProperties(ctx);
  } catch (error) {
    console.error('Error in view_my_properties action:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Handler for my_properties command
const handleMyProperties = async (ctx) => {
  try {
    console.log('my_properties command received');
    const userId = ctx.from.id.toString();
    
    // Find properties submitted by this user
    const properties = await Property.find({ developer_id: userId }).sort({ submitted_at: -1 });
    
    if (properties.length === 0) {
      return ctx.reply('You haven\'t submitted any properties yet. Use /add_property to add one.');
    }
    
    // Send a message for each property
    for (const property of properties) {
      let statusEmoji = '⏳';
      if (property.status === 'approved') statusEmoji = '✅';
      if (property.status === 'rejected') statusEmoji = '❌';
      
      // Calculate tokens sold and remaining
      const totalTokens = property.tokens || 0;
      const soldTokens = property.sold_tokens || 0;
      const remainingTokens = totalTokens - soldTokens;
      
      let message = `<b>${property.property_name}</b>\n`;
      message += `<b>Location:</b> ${property.location}\n`;
      message += `<b>Price:</b> ₦${property.price.toLocaleString()}\n`;
      message += `<b>Type:</b> ${property.property_type}\n`;
      message += `<b>Status:</b> ${statusEmoji} ${property.status.charAt(0).toUpperCase() + property.status.slice(1)}\n`;
      message += `<b>Tokens:</b> ${totalTokens}\n`;
      
      if (property.status === 'approved') {
        message += `<b>Tokens Sold:</b> ${soldTokens}\n`;
        message += `<b>Tokens Remaining:</b> ${remainingTokens}\n`;
      }
      
      message += `<b>Submitted:</b> ${new Date(property.submitted_at).toLocaleDateString()}`;
      
      // If the property has images, send the first one with the message
      if (property.images && property.images.length > 0) {
        await ctx.replyWithPhoto(property.images[0], {
          caption: message,
          parse_mode: 'HTML'
        });
      } else {
        await ctx.reply(message, { parse_mode: 'HTML' });
      }
    }
  } catch (error) {
    console.error('Error fetching user properties:', error);
    ctx.reply('An error occurred while fetching your properties.');
  }
};

// Command to view user's properties
bot.command('my_properties', handleMyProperties);

// Cancel command
bot.command('cancel', (ctx) => {
  if (userStates[ctx.from.id]) {
    delete userStates[ctx.from.id];
    ctx.reply('Property submission cancelled.', Markup.removeKeyboard());
  } else {
    ctx.reply('You don\'t have an active property submission to cancel.');
  }
});

// Add a fallback handler for text messages not handled by other commands
// This should be AFTER all other command handlers
bot.on('text', (ctx) => {
  // Check if the message is a command (starts with /)
  if (ctx.message.text.startsWith('/')) {
    const command = ctx.message.text.split(' ')[0].substring(1);
    const validCommands = ['start', 'help', 'add_property', 'my_properties', 'cancel', 
                          'pending_properties', 'all_properties', 'ban_user', 'unban_user', 'done'];
    
    if (!validCommands.includes(command)) {
      ctx.reply(`Unknown command: ${ctx.message.text}. Type /help to see available commands.`);
    }
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

// Launch bot with proper promise handling
console.log('Attempting to launch bot...');
bot.launch()
  .then(() => {
    console.log('Telegram bot launched successfully');
  })
  .catch(err => {
    console.error('Error launching Telegram bot:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('SIGINT received, stopping bot');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('SIGTERM received, stopping bot');
  bot.stop('SIGTERM');
});