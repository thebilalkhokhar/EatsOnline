const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = async (file, folder) => {
  try {
    if (!file) return null;
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
      folder: folder,
      resource_type: "auto"
        },
        (error, result) => {
          if (error) {
            console.error('Error uploading to Cloudinary:', error);
            reject(new Error('Error uploading image'));
          } else {
            resolve({
      public_id: result.public_id,
      url: result.secure_url
            });
          }
        }
      );

      uploadStream.end(file);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Error uploading image');
  }
};

const deleteFromCloudinary = async (public_id) => {
  try {
    if (!public_id) return null;
    
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Error deleting image');
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
}; 