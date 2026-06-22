const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary successfully configured.');
} else {
  console.log('Cloudinary keys missing in .env. Falling back to local disk storage for uploads.');
}

/**
 * Uploads a file buffer directly to Cloudinary using a stream.
 * @param {Buffer} fileBuffer - The multer file buffer
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<object>} - Resolves with the Cloudinary upload result
 */
const uploadFromBuffer = (fileBuffer, folder = 'study_dash') => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      return reject(new Error('Cloudinary is not configured.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Write file buffer to stream
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Deletes an asset from Cloudinary.
 * @param {string} publicId - Cloudinary public id of the asset
 * @returns {Promise<object>} - Resolves with the deletion result
 */
const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      return reject(new Error('Cloudinary is not configured.'));
    }

    // Try deleting as an image, and if not, try as raw/video
    cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, (err, result) => {
      if (err) return reject(err);
      
      // If result is not ok, try as 'raw' (like PDFs)
      if (result.result !== 'ok') {
        cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (err2, result2) => {
          if (err2) return reject(err2);
          resolve(result2);
        });
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  isCloudinaryConfigured,
  uploadFromBuffer,
  deleteFromCloudinary
};
