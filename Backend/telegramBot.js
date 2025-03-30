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
const Property = require('@models/property');
const User = require('@models/User');

// Import centralized Cloudinary config
const cloudinary = require('@config/cloudinaryConfig');

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
bot.command('help', (ctx) => {
  console.log('Help command received');
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
  
  ctx.replyWithMarkdown(message);
});

// Import command handlers
const addPropertyCommand = require('./services/telegramBot/commands/addProperty');
const myPropertiesCommand = require('./services/telegramBot/commands/myProperties');
const adminActionsCommand = require('./services/telegramBot/commands/adminActions');

// Register command handlers
addPropertyCommand(bot);
myPropertiesCommand(bot);
adminActionsCommand(bot);

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