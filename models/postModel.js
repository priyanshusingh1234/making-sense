const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  thumbnail: { type: String, required: true }, // Filename of the image
  thumbnailId: { type: String, required: true } // ID of the image in GridFS
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
