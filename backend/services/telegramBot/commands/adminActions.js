const Property = require('../../../models/property');
const User = require('@models/User');
const { Markup } = require('telegraf');

// Debug imports
console.log('Property model imported:', !!Property);
console.log('User model imported:', !!User);

module.exports = (bot) => {
  // Command to make a user an admin
  bot.command('make_admin', async (ctx) => {
    try {
      const secretCode = ctx.message.text.split(' ')[1];
      const adminSecretCode = process.env.ADMIN_SECRET_CODE;
      
      console.log('Secret code received:', secretCode);
      console.log('Expected admin secret code:', adminSecretCode);
      
      if (secretCode === adminSecretCode) {
        const userId = ctx.from.id.toString();
        const user = await User.findOne({ telegramChatId: userId });
        
        if (user) {
          user.isAdmin = true;
          await user.save();
          return ctx.reply('You are now an admin! You can use admin commands like /pending_properties');
        } else {
          // Create new user with admin privileges
          await User.create({
            telegramChatId: userId,
            email: `admin_${userId}@ile.app`,
            isAdmin: true
          });
          return ctx.reply('You have been registered as an admin! You can use admin commands like /pending_properties');
        }
      } else {
        return ctx.reply('Invalid admin secret code.');
      }
    } catch (error) {
      console.error('Error in make_admin command:', error);
      ctx.reply('An error occurred while processing your request.');
    }
  });

  // Command to view pending properties
  bot.command('pending_properties', async (ctx) => {
    try {
      console.log('pending_properties command received');
      const userId = ctx.from.id.toString();
      console.log('User ID:', userId);
      
      // DEBUG: Print environment variables
      console.log('ADMIN_IDS env var:', process.env.ADMIN_IDS);
      console.log('ADMIN_SECRET_CODE env var exists:', !!process.env.ADMIN_SECRET_CODE);
      
      // Force admin access for testing
      const isAdmin = true; // Temporarily bypass admin check for testing
      console.log('Admin check bypassed for testing');
      
      // If we get here, user is an admin
      console.log('Admin access confirmed, fetching pending properties...');
      
      // Query for pending properties
      try {
        // Check if Property model exists and has the find method
        console.log('Property model type:', typeof Property);
        console.log('Property model has find method:', typeof Property.find === 'function');
        
        // Try to find any properties regardless of status to check if the collection is working
        const anyProperties = await Property.find({}).limit(2);
        console.log('Any properties found:', anyProperties.length);
        if (anyProperties.length > 0) {
          console.log('Sample property:', {
            id: anyProperties[0]._id.toString(),
            name: anyProperties[0].property_name,
            status: anyProperties[0].status
          });
        }
        
        // Now try to find pending properties
        const pending = await Property.find({ status: 'pending' }).sort({ submitted_at: 1 });
        console.log('Pending properties found:', pending.length, pending.map(p => p._id.toString()));
        
        if (pending.length === 0) {
          return ctx.reply('No pending properties found. When users submit properties, they will appear here for your approval.');
        }
        
        // Send the first pending property
        const property = pending[0];
        console.log('Sending property details:', property);
        
        let message = `📝 *Pending Property #${property._id}*\n\n`;
        message += `*Name:* ${property.property_name}\n`;
        message += `*Location:* ${property.location}\n`;
        message += `*Price:* ₦${property.price.toLocaleString()}\n`;
        message += `*Tokens Required:* ${property.tokens}\n`;
        message += `*Type:* ${property.property_type}\n`;
        message += `*Description:* ${property.description}\n`;
        message += `*Submitted By:* ${property.developer_id}\n`;
        message += `*Submitted At:* ${new Date(property.submitted_at).toLocaleString()}\n`;
        
        // Create inline keyboard for approve/reject actions
        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Approve', `approve_property:${property._id}`),
            Markup.button.callback('❌ Reject', `reject_property:${property._id}`)
          ],
          [Markup.button.callback('⏭️ Next Property', 'next_property')]
        ]);
        
        // Send property details with inline keyboard
        return ctx.reply(message, {
          parse_mode: 'Markdown',
          ...keyboard
        });
      } catch (error) {
        console.error('Error fetching pending properties:', error);
        return ctx.reply('Error fetching pending properties: ' + error.message);
      }
    } catch (error) {
      console.error('Error in pending_properties command:', error);
      ctx.reply('An error occurred while processing your request.');
    }
  });

  // Handle inline keyboard callbacks
  bot.action(/approve_property:(.+)/, async (ctx) => {
    try {
      const propertyId = ctx.match[1];
      console.log(`Approving property ${propertyId}`);
      
      // Update property status to approved
      await Property.findByIdAndUpdate(propertyId, { status: 'approved' });
      
      await ctx.answerCbQuery('Property approved!');
      await ctx.editMessageText('✅ Property approved successfully!');
      
      // Check if there are more pending properties
      const pending = await Property.find({ status: 'pending' }).sort({ submitted_at: 1 });
      if (pending.length > 0) {
        await ctx.reply('There are more pending properties. Use /pending_properties to view the next one.');
      }
    } catch (error) {
      console.error('Error approving property:', error);
      ctx.answerCbQuery('Error: ' + error.message);
    }
  });
  
  bot.action(/reject_property:(.+)/, async (ctx) => {
    try {
      const propertyId = ctx.match[1];
      console.log(`Rejecting property ${propertyId}`);
      
      // Update property status to rejected
      await Property.findByIdAndUpdate(propertyId, { status: 'rejected' });
      
      await ctx.answerCbQuery('Property rejected!');
      await ctx.editMessageText('❌ Property rejected.');
      
      // Check if there are more pending properties
      const pending = await Property.find({ status: 'pending' }).sort({ submitted_at: 1 });
      if (pending.length > 0) {
        await ctx.reply('There are more pending properties. Use /pending_properties to view the next one.');
      }
    } catch (error) {
      console.error('Error rejecting property:', error);
      ctx.answerCbQuery('Error: ' + error.message);
    }
  });
  
  bot.action('next_property', async (ctx) => {
    await ctx.answerCbQuery('Loading next property...');
    await ctx.deleteMessage();
    await ctx.reply('Use /pending_properties to view the next pending property.');
  });

  // Command to view all properties
  bot.command('all_properties', async (ctx) => {
    try {
      console.log('all_properties command received');
      // Verify admin
      const user = await User.findOne({ telegramChatId: ctx.from.id });
      console.log('User found:', !!user, 'isAdmin:', user?.isAdmin);
      
      // If user doesn't exist or is not an admin
      if (!user) {
        return ctx.reply('You need to be registered in our system. Please use /start to register.');
      }
      
      if (!user.isAdmin) {
        return ctx.reply('Admin access required.');
      }

      const properties = await Property.find().sort({ submitted_at: -1 }).limit(10);
      console.log('Properties found:', properties.length);
      
      if (properties.length === 0) {
        return ctx.reply('No properties found in the database. When users submit properties, they will appear here.');
      }
      
      // Display properties summary
      let message = 'Recent Properties:\n\n';
      properties.forEach((prop, index) => {
        message += `${index + 1}. ${prop.property_name} - ${prop.location}\n`;
        message += `   Status: ${prop.status}, Price: ₦${prop.price.toLocaleString()}\n\n`;
      });
      
      await ctx.reply(message);
    } catch (error) {
      console.error('Error in all_properties command:', error);
      ctx.reply('An error occurred. Please try again later.');
    }
  });

  // Command to ban a user
  bot.command('ban_user', async (ctx) => {
    try {
      console.log('ban_user command received');
      // Verify admin
      const admin = await User.findOne({ telegramChatId: ctx.from.id });
      console.log('Admin found:', !!admin, 'isAdmin:', admin?.isAdmin);
      
      // If user doesn't exist or is not an admin
      if (!admin) {
        return ctx.reply('You need to be registered in our system. Please use /start to register.');
      }
      
      if (!admin.isAdmin) {
        return ctx.reply('Admin access required.');
      }

      // Get user ID from command arguments
      const args = ctx.message.text.split(' ');
      if (args.length < 2) {
        return ctx.reply('Usage: /ban_user <telegram_id>\n\nExample: /ban_user 123456789');
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
      console.log('unban_user command received');
      // Verify admin
      const admin = await User.findOne({ telegramChatId: ctx.from.id });
      console.log('Admin found:', !!admin, 'isAdmin:', admin?.isAdmin);
      
      // If user doesn't exist or is not an admin
      if (!admin) {
        return ctx.reply('You need to be registered in our system. Please use /start to register.');
      }
      
      if (!admin.isAdmin) {
        return ctx.reply('Admin access required.');
      }

      // Get user ID from command arguments
      const args = ctx.message.text.split(' ');
      if (args.length < 2) {
        return ctx.reply('Usage: /unban_user <telegram_id>\n\nExample: /unban_user 123456789');
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

  // Handle property approval
  bot.action(/approve_(.*)/, async (ctx) => {
    try {
      // Verify admin
      const user = await User.findOne({ telegramChatId: ctx.from.id });
      
      // If user doesn't exist or is not an admin
      if (!user) {
        return ctx.reply('You need to be registered in our system. Please use /start to register.');
      }
      
      if (!user.isAdmin) {
        return ctx.reply('Admin access required.');
      }
      
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
        `Property "${property.property_name}" has been approved.`,
        Markup.inlineKeyboard([])
      );
      
      // Notify developer if they have a Telegram ID
      if (developer && developer.telegramChatId) {
        try {
          await ctx.telegram.sendMessage(
            developer.telegramChatId,
            `Your property "${property.property_name}" has been approved and is now listed!`
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
      
      // If user doesn't exist or is not an admin
      if (!user) {
        return ctx.reply('You need to be registered in our system. Please use /start to register.');
      }
      
      if (!user.isAdmin) {
        return ctx.reply('Admin access required.');
      }
      
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
        `Property "${property.property_name}" has been rejected.`,
        Markup.inlineKeyboard([])
      );
      
      // Notify developer if they have a Telegram ID
      if (developer && developer.telegramChatId) {
        try {
          await ctx.telegram.sendMessage(
            developer.telegramChatId,
            `Your property "${property.property_name}" has been rejected. Please contact support for more information.`
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
};