const { Router } = require('express');
const router = Router();
const {
  createPost,
  editPost,
  deletePost,
  getCatPosts,
  getUserPosts,
  getPosts,
  getPost
} = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');

// MongoDB URI
const mongoURI = process.env.MONGODB_URI;

// Setup GridFS storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      filename: `${Date.now()}_${file.originalname}`,
      bucketName: 'uploads', // Files collection name
    };
  },
});

// Multer middleware
const upload = multer({ storage });

// Route to create a post with file upload
router.post('/', authMiddleware, upload.single('thumbnail'), createPost);

// Route to get all posts
router.get('/', getPosts);

// Route to get a specific post by ID
router.get('/:id', getPost);

// Route to edit a post with optional file upload
router.patch('/:id', authMiddleware, upload.single('thumbnail'), editPost);

// Route to get all posts by a specific user
router.get('/users/:id', getUserPosts);

// Route to get all posts in a specific category
router.get('/categories/:category', getCatPosts);

// Route to delete a post
router.delete('/:id', authMiddleware, deletePost);

// Route to retrieve uploaded images from GridFS
router.get('/uploads/:filename', async (req, res) => {
  const { filename } = req.params;
  const conn = mongoose.createConnection(mongoURI);
  const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads',
  });

  bucket.find({ filename }).toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No file found' });
    }

    bucket.openDownloadStreamByName(filename).pipe(res);
  });
});

module.exports = router;
