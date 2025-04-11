const Property = require('@models/Property');
const User = require('@models/User');
const cloudinary = require('@config/cloudinaryConfig');
const { Markup } = require('telegraf');

// Property submission state
const userStates = {};

// Property types for selection
const propertyTypes = ['Apartment', 'House', 'Land', 'Commercial'];

// List of commands that should reset the property submission state
const commandsToResetState = [
  'start', 'help', 'my_properties', 'pending_properties', 
  'all_properties', 'ban_user', 'unban_user'
];

module.exports = (bot) => {
  // Add middleware to check for commands that should reset state
  bot.use((ctx, next) => {
    // Only process text messages that are commands
    if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
      const command = ctx.message.text.split(' ')[0].substring(1); // Remove the leading slash
      
      // If this is a command that should reset state and user has an active state
      if (commandsToResetState.includes(command) && userStates[ctx.from.id]) {
        console.log(`Resetting property submission state for user ${ctx.from.id} due to /${command} command`);
        delete userStates[ctx.from.id];
      }
    }
    
    return next();
  });

  // Handle /add_property command
  bot.command('add_property', async (ctx) => {
    try {
      // Check if user is banned
      const user = await User.findOne({ telegramChatId: ctx.from.id });
      
      // If user doesn't exist yet, create them
      if (!user) {
        const newUser = new User({
          telegramChatId: ctx.from.id,
          email: `telegram_${ctx.from.id}@placeholder.com`, // Placeholder email
          isAdmin: false,
          isBanned: false
        });
        
        await newUser.save();
        console.log(`New user registered with Telegram ID: ${ctx.from.id}`);
      } else if (user.isBanned) {
        return ctx.reply('You are banned from submitting properties.');
      }

      // Rate limiting check
      if (user?.last_submission && (Date.now() - user.last_submission) < 600000) {
        return ctx.reply('Please wait 10 minutes between submissions.');
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

  // Cancel command
  bot.command('cancel', (ctx) => {
    if (userStates[ctx.from.id]) {
      delete userStates[ctx.from.id];
      ctx.reply('Property submission cancelled.');
    } else {
      ctx.reply('No active submission to cancel.');
    }
  });

  // Function to handle property submission completion
  const handleDoneCommand = async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates[userId];

    // If no active submission, ignore
    if (!state) return;

    // If not in image upload step, ignore
    if (state.step !== 'images') {
      return ctx.reply('Please complete the current step first.');
    }

    try {
      // Check if at least one image was uploaded
      if (state.property.images.length === 0) {
        return ctx.reply('Please upload at least one image of the property.');
      }

      // Set submission timestamp
      state.property.submitted_at = new Date();
      
      // Create new property in database
      const newProperty = new Property(state.property);
      await newProperty.save();
      
      // Update user's last submission time
      await User.findOneAndUpdate(
        { telegramChatId: userId },
        { last_submission: new Date() }
      );
      
      // Clear user state
      delete userStates[userId];
      
      ctx.reply('Your property has been submitted successfully! It will be reviewed by our team.');
    } catch (error) {
      console.error('Error saving property:', error);
      ctx.reply('An error occurred while saving your property. Please try again later or contact support.');
    }
  };

  // Handle /done command to finish image upload
  bot.command('done', handleDoneCommand);
  
  // Also handle "done" as text for users who type it without the slash
  bot.hears(/^done$/i, (ctx) => {
    const userId = ctx.from.id;
    const state = userStates[userId];
    
    if (state && state.step === 'images') {
      handleDoneCommand(ctx);
    }
  });

  // Handle text messages for property submission
  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates[userId];

    // If no active submission, ignore
    if (!state) return;

    const text = ctx.message.text;
    
    // Check if the text is "done" for the images step
    if (state.step === 'images' && text.toLowerCase() === 'done') {
      return handleDoneCommand(ctx);
    }

    try {
      switch (state.step) {
        case 'property_name':
          state.property.property_name = text;
          state.step = 'location';
          ctx.reply('Great! Now enter the property location:');
          break;

        case 'location':
          state.property.location = text;
          state.step = 'price';
          ctx.reply('Please enter the property price (in Naira):');
          break;

        case 'price':
          const price = parseFloat(text);
          if (isNaN(price) || price <= 0) {
            return ctx.reply('Please enter a valid price (numbers only).');
          }
          state.property.price = price;
          state.property.tokens = Math.floor(price / 1500); // Calculate tokens
          state.step = 'property_type';
          
          // Send property type options
          ctx.reply('Select the property type:', 
            Markup.keyboard(propertyTypes.map(type => [type]))
              .oneTime()
              .resize()
          );
          break;

        case 'property_type':
          if (!propertyTypes.includes(text)) {
            return ctx.reply('Please select a valid property type from the options.');
          }
          state.property.property_type = text;
          state.step = 'description';
          ctx.reply('Please provide a detailed description of the property:');
          break;

        case 'description':
          state.property.description = text;
          state.step = 'images';
          ctx.reply('Please send up to 5 images of the property. Send /done when finished.');
          break;

        default:
          // Ignore text in image upload step
          if (state.step === 'images') {
            ctx.reply('Please send images or type /done to finish.');
          }
      }
    } catch (error) {
      console.error('Error processing property submission:', error);
      ctx.reply('An error occurred. Please try again or type /cancel to start over.');
    }
  });

  // Handle image uploads
  bot.on('photo', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates[userId];

    // If no active submission or not in image upload step, ignore
    if (!state || state.step !== 'images') return;

    try {
      // Get the largest photo
      const photo = ctx.message.photo.pop();
      const fileId = photo.file_id;
      
      // Get file link from Telegram
      const fileLink = await ctx.telegram.getFileLink(fileId);
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(fileLink.href, {
        folder: 'ile_properties'
      });

      // Add image URL to property
      state.property.images.push(result.secure_url);
      
      ctx.reply(`Image ${state.property.images.length} uploaded successfully. Send more or type /done when finished.`);
      
      // Limit to 5 images
      if (state.property.images.length >= 5) {
        ctx.reply('Maximum number of images reached. Type /done to submit your property.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      ctx.reply('Failed to upload image. Please try again or type /done to continue without this image.');
    }
  });
};