const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
require('dotenv').config();

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Import command handlers
require('./commands/addProperty')(bot);
require('./commands/adminActions')(bot);

// Test command
bot.command('start', (ctx) => {
  ctx.reply('Welcome to Ile Properties Bot! Use /add_property to begin.');
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

// Launch bot
bot.launch();
console.log('Telegram bot is running...');

module.exports = bot;