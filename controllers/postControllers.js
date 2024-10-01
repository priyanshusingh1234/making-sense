const Post = require('../models/postModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const path = require('path');
const HttpError = require('../models/errorModel');

// Setup MongoDB connection and GridFS storage
const mongoURI = process.env.MONGODB_URI;  // Your MongoDB URI from environment variables
const conn = mongoose.createConnection(mongoURI);

// GridFS storage engine for multer
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      filename: `${Date.now()}_${file.originalname}`,
      bucketName: 'uploads', // Collection where files are stored
    };
  },
});

// Multer middleware
const upload = multer({ storage });

// Create a new post with thumbnail upload
const createPost = async (req, res, next) => {
  const { title, category, description } = req.body;
  
  if (!title || !category || !description || !req.file) {
    return next(new HttpError("Please fill in all fields and upload a thumbnail.", 422));
  }

  try {
    const newPost = await Post.create({
      title,
      category,
      description,
      thumbnail: req.file.filename, // Store the uploaded file's filename
      creator: req.user.id,
    });

    await User.findByIdAndUpdate(req.user.id, { $inc: { posts: 1 } });

    res.status(201).json(newPost);
  } catch (error) {
    next(new HttpError("Failed to create post", 500));
  }
};

// Edit an existing post with optional thumbnail replacement
const editPost = async (req, res, next) => {
  const postId = req.params.id;
  const { title, category, description } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found", 404));
    }

    if (req.user.id !== post.creator.toString()) {
      return next(new HttpError("You are not authorized to edit this post.", 403));
    }

    // Update post fields
    post.title = title;
    post.category = category;
    post.description = description;

    // If a new file is uploaded, update the thumbnail
    if (req.file) {
      post.thumbnail = req.file.filename;
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    next(new HttpError("Failed to update post", 500));
  }
};

// Other post-related functions...

module.exports = {
  createPost,
  editPost,
  deletePost,
  getCatPosts,
  getPosts,
  getUserPosts,
  getPost,
};
