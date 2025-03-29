const Property = require('../../../../models/property');
const User = require('../../../../models/User');

module.exports = (bot) => {
  // Command to view user's own properties
  bot.command('my_properties', async (ctx) => {
    try {
      const userId = ctx.from.id.toString();
      
      // Find properties submitted by this user
      const properties = await Property.find({ developer_id: userId }).sort({ submitted_at: -1 });
      
      if (properties.length === 0) {
        return ctx.reply('You have not submitted any properties yet. Use /add_property to submit one.');
      }
      
      // Display properties
      let message = '*Your Properties:*\n\n';
      properties.forEach((prop, index) => {
        message += `${index + 1}. *${prop.property_name}* - ${prop.location}\n`;
        message += `   Status: ${prop.status}, Price: ₦${prop.price.toLocaleString()}\n`;
        message += `   Submitted: ${prop.submitted_at.toDateString()}\n\n`;
      });
      
      ctx.replyWithMarkdown(message);
      
      // Provide additional instructions
      ctx.reply('Use /property_details [number] to view more details about a specific property.');
    } catch (error) {
      console.error('Error in my_properties command:', error);
      ctx.reply('An error occurred. Please try again later.');
    }
  });
  
  // Command to view details of a specific property
  bot.command('property_details', async (ctx) => {
    try {
      const userId = ctx.from.id.toString();
      
      // Parse property index from command
      const args = ctx.message.text.split(' ');
      if (args.length < 2 || isNaN(parseInt(args[1]))) {
        return ctx.reply('Usage: /property_details [number]');
      }
      
      const propertyIndex = parseInt(args[1]) - 1; // Convert to 0-based index
      
      // Find properties submitted by this user
      const properties = await Property.find({ developer_id: userId }).sort({ submitted_at: -1 });
      
      if (properties.length === 0) {
        return ctx.reply('You have not submitted any properties yet.');
      }
      
      if (propertyIndex < 0 || propertyIndex >= properties.length) {
        return ctx.reply(`Please enter a valid number between 1 and ${properties.length}.`);
      }
      
      // Get the selected property
      const property = properties[propertyIndex];
      
      // Display detailed information
      let message = `📍 *${property.property_name}*\n`;
      message += `📌 Location: ${property.location}\n`;
      message += `💰 Price: ₦${property.price.toLocaleString()}\n`;
      message += `🏷️ Type: ${property.property_type}\n`;
      message += `🪙 Tokens: ${property.tokens}\n`;
      message += `📝 Description: ${property.description}\n`;
      message += `📅 Submitted: ${property.submitted_at.toDateString()}\n`;
      message += `🔄 Status: ${property.status}\n`;
      
      await ctx.replyWithMarkdown(message);
      
      // Send property images
      for (const imageUrl of property.images) {
        await ctx.replyWithPhoto({ url: imageUrl });
      }
    } catch (error) {
      console.error('Error in property_details command:', error);
      ctx.reply('An error occurred. Please try again later.');
    }
  });
};