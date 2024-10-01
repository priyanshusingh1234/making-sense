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
} = require('../controllers/postController'); // Ensure this matches your controller file name
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import the multer middleware for handling file uploads

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
