const cloudinary = require('@config/cloudinaryConfig');

const uploadImage = async (imageBuffer) => {
  try {
    const result = await cloudinary.uploader.upload(imageBuffer);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

module.exports = { uploadImage };