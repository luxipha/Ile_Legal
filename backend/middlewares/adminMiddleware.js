// Create a new file: backend/middlewares/adminMiddleware.js
const User = require('@models/User');

/**
 * Middleware to check if a user has admin privileges
 */
const isAdmin = async (ctx, next) => {
  try {
    console.log('Admin middleware checking user:', ctx.from.id);
    const userId = ctx.from.id.toString();
    const user = await User.findOne({ telegramChatId: userId });
    
    if (!user) {
      console.log('User not found in database');
      await ctx.reply('⛔ You need to be registered. Use /start to register first.');
      return;
    }
    
    if (!user.isAdmin) {
      console.log('User found but not an admin:', userId);
      await ctx.reply('⛔ You do not have admin privileges to use this command.');
      return;
    }
    
    // User is admin, continue to the command handler
    console.log('Admin access confirmed for user:', userId);
    ctx.state.user = user; // Store user in context for command handlers
    return await next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    await ctx.reply('⚠️ An error occurred while checking permissions.');
  }
};

module.exports = { isAdmin };