const Property = require('@models/property');
const User = require('@models/User');

console.log('myProperties.js module loaded');

module.exports = (bot) => {
  console.log('myProperties handler function called with bot instance');
  
  // Simple test command to verify the handler is working
  bot.command('test_properties', async (ctx) => {
    console.log('test_properties command triggered');
    await ctx.reply('Test properties command works!');
  });
  
  // Command to view user's own properties
  bot.command('my_properties', async (ctx) => {
    console.log('my_properties command handler triggered');
    try {
      await ctx.reply('Checking your properties...');
      console.log('my_properties command received');
      const userId = ctx.from.id.toString();
      console.log('User ID:', userId);
      
      // Check if user exists in the database
      const user = await User.findOne({ telegramChatId: userId });
      console.log('User found:', !!user);
      
      // If user doesn't exist, prompt them to register
      if (!user) {
        return ctx.reply('You need to be registered in our system. Please use /start to register.');
      }
      
      await ctx.reply('You have not submitted any properties yet. Use /add_property to submit one.');
      
    } catch (error) {
      console.error('Error in my_properties command:', error);
      ctx.reply('An error occurred. Please try again later.');
    }
  });
  
  // Command to view details of a specific property (simplified)
  bot.command('property_details', async (ctx) => {
    console.log('property_details command handler triggered');
    ctx.reply('Property details command is under maintenance.');
  });
};