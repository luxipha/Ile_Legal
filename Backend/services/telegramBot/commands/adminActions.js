const Property = require('../../../models/property');
const User = require('../../../models/User');
const { Markup } = require('telegraf');

module.exports = (bot) => {
  // Command to view pending properties
  bot.command('pending_properties', async (ctx) => {
    try {
      // Verify admin
      const user = await User.findOne({ telegramChatId: ctx.from.id });
      if (!user?.isAdmin) return ctx.reply('Admin access required.');

      const pending = await Property.find({ status: 'pending' }).sort({ submitted_at: 1 });
      
      if (pending.length === 0) {
        return ctx.reply('No pending properties found.');
      }
      
      // Display properties with inline buttons for each
      for (const property of pending) {
        let message = `📍 *${property.property_name}*\n`;
        message += `📌 Location: ${property.location}\n`;
        message += `💰 Price: ₦${property.price.toLocaleString()}\n`;
        message += `🏷️ Type: ${property.property_type}\n`;
        message += `🪙 Tokens: ${property.tokens}\n`;
        message += `📝 Description: ${property.description}\n`;
        message += `📅 Submitted: ${property.submitted_at.toDateString()}\n`;
        
        // Send property details with approve/reject buttons
        await ctx.replyWithMarkdown(message, 
          Markup.inlineKeyboard([
            Markup.button.callback('✅ Approve', `approve_${property._id}`),
            Markup.button.callback('❌ Reject', `reject_${property._id}`)
          ])
        );
        
        // Send property images
        for (const imageUrl of property.images) {
          await ctx.replyWithPhoto({ url: imageUrl });
        }
      }
    } catch (error) {
      console.error('Error in pending_properties command:', error);
      ctx.reply('An error occurred. Please try again later.');
    }
  });

  // Handle property approval
  bot.action(/approve_(.*)/, async (ctx) => {
    try {
      // Verify admin
      const user = await User.findOne({ telegramChatId: ctx.from.id });
      if (!user?.isAdmin) return ctx.reply('Admin access required.');
      
      const propertyId = ctx.match[1];
      
      // Update property status
      const property = await Property.findByIdAndUpdate(
        propertyId,
        { status: 'approved' },
        { new: true }
      );
      
      if (!property) {
        return ctx.reply('Property not found or already processed.');
      }
      
      // Get developer information
      const developer = await User.findOne({ telegramChatId: property.developer_id });
      
      // Notify admin of successful approval
      await ctx.editMessageText(
        `✅ Property "${property.property_name}" has been approved.`,
        Markup.inlineKeyboard([])
      );
      
      // Notify developer if they have a Telegram ID
      if (developer && developer.telegramChatId) {
        try {
          await ctx.telegram.sendMessage(
            developer.telegramChatId,
            `✅ Your property "${property.property_name}" has been approved and is now listed!`
          );
        } catch (error) {
          console.error('Error notifying developer:', error);
        }
      }
    } catch (error) {
      console.error('Error approving property:', error);
      ctx.reply('An error occurred while approving the property.');
    }
  });

  // Handle property rejection
  bot.action(/reject_(.*)/, async (ctx) => {
    try {
      // Verify admin
      const user = await User.findOne({ telegramChatId: ctx.from.id });
      if (!user?.isAdmin) return ctx.reply('Admin access required.');
      
      const propertyId = ctx.match[1];
      
      // Update property status
      const property = await Property.findByIdAndUpdate(
        propertyId,
        { status: 'rejected' },
        { new: true }
      );
      
      if (!property) {
        return ctx.reply('Property not found or already processed.');
      }
      
      // Get developer information
      const developer = await User.findOne({ telegramChatId: property.developer_id });
      
      // Notify admin of successful rejection
      await ctx.editMessageText(
        `❌ Property "${property.property_name}" has been rejected.`,
        Markup.inlineKeyboard([])
      );
      
      // Notify developer if they have a Telegram ID
      if (developer && developer.telegramChatId) {
        try {
          await ctx.telegram.sendMessage(
            developer.telegramChatId,
            `❌ Your property "${property.property_name}" has been rejected. Please contact support for more information.`
          );
        } catch (error) {
          console.error('Error notifying developer:', error);
        }
      }
    } catch (error) {
      console.error('Error rejecting property:', error);
      ctx.reply('An error occurred while rejecting the property.');
    }
  });

  // Command to view all properties
  bot.command('all_properties', async (ctx) => {
    try {
      // Verify admin
      const user = await User.findOne({ telegramChatId: ctx.from.id });
      if (!user?.isAdmin) return ctx.reply('Admin access required.');

      const properties = await Property.find().sort({ submitted_at: -1 }).limit(10);
      
      if (properties.length === 0) {
        return ctx.reply('No properties found in the database.');
      }
      
      // Display properties summary
      let message = '*Recent Properties:*\n\n';
      properties.forEach((prop, index) => {
        message += `${index + 1}. *${prop.property_name}* - ${prop.location}\n`;
        message += `   Status: ${prop.status}, Price: ₦${prop.price.toLocaleString()}\n\n`;
      });
      
      ctx.replyWithMarkdown(message);
    } catch (error) {
      console.error('Error in all_properties command:', error);
      ctx.reply('An error occurred. Please try again later.');
    }
  });

  // Command to ban a user
  bot.command('ban_user', async (ctx) => {
    try {
      // Verify admin
      const admin = await User.findOne({ telegramChatId: ctx.from.id });
      if (!admin?.isAdmin) return ctx.reply('Admin access required.');

      // Get user ID from command arguments
      const args = ctx.message.text.split(' ');
      if (args.length < 2) {
        return ctx.reply('Usage: /ban_user <telegram_id>');
      }
      
      const targetUserId = args[1];
      
      // Update user status
      const user = await User.findOneAndUpdate(
        { telegramChatId: targetUserId },
        { isBanned: true },
        { new: true }
      );
      
      if (!user) {
        return ctx.reply('User not found.');
      }
      
      ctx.reply(`User with ID ${targetUserId} has been banned.`);
    } catch (error) {
      console.error('Error banning user:', error);
      ctx.reply('An error occurred while banning the user.');
    }
  });

  // Command to unban a user
  bot.command('unban_user', async (ctx) => {
    try {
      // Verify admin
      const admin = await User.findOne({ telegramChatId: ctx.from.id });
      if (!admin?.isAdmin) return ctx.reply('Admin access required.');

      // Get user ID from command arguments
      const args = ctx.message.text.split(' ');
      if (args.length < 2) {
        return ctx.reply('Usage: /unban_user <telegram_id>');
      }
      
      const targetUserId = args[1];
      
      // Update user status
      const user = await User.findOneAndUpdate(
        { telegramChatId: targetUserId },
        { isBanned: false },
        { new: true }
      );
      
      if (!user) {
        return ctx.reply('User not found.');
      }
      
      ctx.reply(`User with ID ${targetUserId} has been unbanned.`);
    } catch (error) {
      console.error('Error unbanning user:', error);
      ctx.reply('An error occurred while unbanning the user.');
    }
  });
};