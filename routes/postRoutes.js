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

module.exports = router;
