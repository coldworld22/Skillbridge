// 📁 src/services/fileService.js
module.exports = {
  saveAvatar: async (file) => {
    // Handle S3 or Cloudinary
    return file.path;
  },
};