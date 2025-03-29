const Property = require('../../../models/property');
const User = require('../../../models/User');
const cloudinary = require('cloudinary').v2;
const { Scenes, session, Markup } = require('telegraf');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Property submission state
const userStates = {};

// Property types for selection
const propertyTypes = ['Apartment', 'House', 'Land', 'Commercial'];

module.exports = (bot) => {
  // Register session middleware
  bot.use(session());

  // Handle /add_property command
  bot.command('add_property', async (ctx) => {
    try {
      // Check if user is banned
      const user = await User.findOne({ telegramChatId: ctx.from.id });
      if (user?.isBanned) {
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

  // Handle text messages for property submission
  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates[userId];

    // If no active submission, ignore
    if (!state) return;

    const text = ctx.message.text;

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

  // Handle /done command to finish image upload
  bot.command('done', async (ctx) => {
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
  });
};