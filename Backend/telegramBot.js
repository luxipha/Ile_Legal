// telegramBot.js (in project root)
require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for Telegram bot'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import models - using consistent casing
const Property = require('./models/property');
const User = require('./models/User');

// Configure Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Use session middleware
bot.use(session());

// Import command handlers
require('./services/telegramBot/commands/addProperty')(bot);
require('./services/telegramBot/commands/adminActions')(bot);
require('./services/telegramBot/commands/myProperties')(bot);

// Basic commands
bot.command('start', (ctx) => {
  ctx.reply('Welcome to Ile Properties Bot! Use /help to see available commands.');
});

bot.command('help', (ctx) => {
  let message = 'Available commands:\n\n';
  message += '/start - Start the bot\n';
  message += '/help - Show this help message\n';
  message += '/add_property - Submit a new property\n';
  message += '/my_properties - View your submitted properties\n';
  message += '/cancel - Cancel current property submission\n\n';
  
  // Admin commands
  message += 'Admin commands:\n';
  message += '/pending_properties - View properties pending approval\n';
  message += '/all_properties - View all properties\n';
  message += '/ban_user [id] - Ban a user\n';
  message += '/unban_user [id] - Unban a user\n';
  
  ctx.reply(message);
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

// Launch bot
bot.launch();
console.log('Telegram bot started with database connection');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));