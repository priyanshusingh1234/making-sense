const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Post = require("../models/postModel");
const User = require("../models/userModel");
const HttpError = require('../models/errorModel');

// MongoDB connection URI
const mongoURI = process.env.MONGODB_URI; // Your MongoDB connection string

// Create MongoDB connection
const conn = mongoose.createConnection(mongoURI);

// Initialize GridFS
let gfs;
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads'); // Set the default bucket name
});

// Create storage engine for multer
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      filename: file.originalname,
      bucketName: 'uploads' // Collection name where the files will be stored
    };
  }
});

const upload = multer({ storage });

// Create a new post
const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;

    if (!title || !category || !description || !req.file) {
      return next(new HttpError("Fill in all the fields and choose a thumbnail.", 422));
    }

    const newPost = await Post.create({ title, category, description, thumbnail: req.file.filename, creator: req.user.id });
    if (!newPost) {
      return next(new HttpError("Post could not be created.", 422));
    }

    const currentUser = await User.findById(req.user.id);
    const userPostCount = currentUser.posts + 1;
    await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

    res.status(201).json(newPost);
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};

// Edit a post
const editPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { title, category, description } = req.body;

    // Validate input fields
    if (!title || !category || description.length < 12) {
      return next(new HttpError("Please fill in all fields with valid data.", 422));
    }

    // Find the existing post
    const oldPost = await Post.findById(postId);

    // Check if the user editing the post is the creator
    if (req.user.id !== oldPost.creator.toString()) {
      return next(new HttpError("You are not authorized to edit this post.", 403));
    }

    let updatedPost;

    if (!req.file) {
      // Update without thumbnail
      updatedPost = await Post.findByIdAndUpdate(postId, { title, category, description }, { new: true });
    } else {
      // If there's a new thumbnail, delete the old one from GridFS
      if (oldPost.thumbnail) {
        await gfs.remove({ filename: oldPost.thumbnail, root: 'uploads' });
      }

      // Update post with new thumbnail
      updatedPost = await Post.findByIdAndUpdate(postId, { 
        title, 
        category, 
        description, 
        thumbnail: req.file.filename // Save the filename in the database
      }, { new: true });
    }

    if (!updatedPost) {
      return next(new HttpError("Could not update post.", 400));
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};

// Delete a post
const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found.", 404));
    }

    // Check if the user deleting the post is the creator
    if (req.user.id !== post.creator.toString()) {
      return next(new HttpError("You are not authorized to delete this post.", 403));
    }

    // Remove the thumbnail from GridFS
    if (post.thumbnail) {
      await gfs.remove({ filename: post.thumbnail, root: 'uploads' });
    }

    // Delete the post from the database
    await Post.findByIdAndDelete(postId);

    // Update the user's post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { posts: -1 } });

    res.status(200).json({ message: `Post ${postId} deleted successfully.` });
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};

module.exports = {
  createPost,
  editPost,
  deletePost,
};
