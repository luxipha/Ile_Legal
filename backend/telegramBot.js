// At the top of telegramBot.js
require('module-alias/register');
require('./config/aliases');

// telegramBot.js (in project root)
require('dotenv').config();
const { Telegraf, session, Markup } = require('telegraf');
const mongoose = require('mongoose');
const path = require('path');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific handling code here
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for Telegram bot'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import models - using consistent casing
const Property = require('./models/property');
const User = require('./models/User');

// Import centralized Cloudinary config
const cloudinary = require('./config/cloudinaryConfig');

// Create bot instance
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Debug middleware - add this to see what's happening
bot.use((ctx, next) => {
  console.log('Bot received update:', ctx.updateType);
  if (ctx.updateType === 'message' && ctx.message.text) {
    console.log('Message received:', ctx.message.text);
  }
  return next();
});

// Global state management middleware
bot.use((ctx, next) => {
  // Only process text messages that are commands
  if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
    const command = ctx.message.text.split(' ')[0].substring(1); // Remove the leading slash
    
    // Reset any active state when switching between major commands
    if (['start', 'help', 'add_property', 'my_properties', 'pending_properties', 
         'all_properties', 'ban_user', 'unban_user'].includes(command)) {
      // This will be accessible to all command handlers
      ctx.state.resetActiveFlows = true;
      console.log(`Command switch detected: /${command}`);
    }
  }
  
  return next();
});

// Register session middleware
bot.use(session());

// Start command - improved with welcome message and keyboard
bot.command('start', async (ctx) => {
  try {
    console.log('Start command received');
    // Check if user exists in database
    let user = await User.findOne({ telegramChatId: ctx.from.id });
    
    // If user doesn't exist, create a new one
    if (!user) {
      const newUser = new User({
        telegramChatId: ctx.from.id,
        name: ctx.from.first_name || 'User',
        email: `telegram_${ctx.from.id}@placeholder.com`, // Placeholder email
        isAdmin: false,
        isBanned: false
      });
      
      user = await newUser.save();
      console.log(`New user registered with Telegram ID: ${ctx.from.id}`);
    }
    
    // Welcome message with instructions
    const welcomeMessage = `👋 Welcome to Ile Properties Bot, ${user.name || ctx.from.first_name || 'there'}!

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

// Direct handler for my_properties command
bot.command('my_properties', async (ctx) => {
  console.log('Direct my_properties command handler triggered');
  try {
    await ctx.reply('Checking your properties...');
    const userId = ctx.from.id.toString();
    console.log('User ID:', userId);
    
    // Check if user exists in the database
    const user = await User.findOne({ telegramChatId: userId });
    console.log('User found:', !!user);
    
    // If user doesn't exist, prompt them to register
    if (!user) {
      return ctx.reply('You need to be registered in our system. Please use /start to register.');
    }
    
    // Find properties submitted by this user
    const properties = await Property.find({ developer_id: userId }).sort({ submitted_at: -1 });
    console.log('Properties found:', properties ? properties.length : 0);
    
    if (!properties || properties.length === 0) {
      console.log('No properties found for user');
      await ctx.reply('You have not submitted any properties yet. Use /add_property to submit one.');
      return;
    }
    
    // Display properties
    let message = 'Your Properties:\n\n';
    properties.forEach((prop, index) => {
      message += `${index + 1}. ${prop.property_name} - ${prop.location}\n`;
      message += `   Status: ${prop.status || 'pending'}, Price: ₦${prop.price.toLocaleString()}\n`;
      message += `   Submitted: ${prop.submitted_at.toDateString()}\n\n`;
    });
    
    await ctx.reply(message);
    console.log('Properties list sent successfully');
    
    // Provide additional instructions
    ctx.reply('Use /property_details [number] to view more details about a specific property.');
  } catch (error) {
    console.error('Error in my_properties command:', error);
    ctx.reply('An error occurred. Please try again later.');
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

// Test command to verify command registration
bot.command('test_command', async (ctx) => {
  console.log('Test command triggered');
  await ctx.reply('Test command works!');
});

// Import command handlers
console.log('Importing command handlers...');
const addPropertyCommand = require('./services/telegramBot/commands/addProperty');
// const myPropertiesCommand = require('./services/telegramBot/commands/myProperties');
const adminActionsCommand = require('./services/telegramBot/commands/adminActions');
console.log('Command handlers imported successfully');

// Register command handlers
console.log('Registering command handlers...');
addPropertyCommand(bot);
console.log('addProperty handler registered');
// myPropertiesCommand(bot);
// console.log('myProperties handler registered');
adminActionsCommand(bot);
console.log('adminActions handler registered');

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