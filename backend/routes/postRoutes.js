const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment,
    editComment,
    deleteComment,
    savePost,
    unsavePost,
    getSavedPosts,
    generateAIPost,
    getAIPosts,
    getPostsByUser
} = require('../controllers/postController');

const router = express.Router();

/**
 * @route   POST /api/posts/create
 * @desc    Create a new post
 * @access  Private
 */
router.post('/create', authMiddleware, createPost);

/**
 * @route   GET /api/posts
 * @desc    Get all posts with pagination
 * @access  Public
 */
router.get('/', getAllPosts);

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by ID
 * @access  Public
 */
router.get('/:id', getPostById);

router.get('/user/:userId', authMiddleware, getPostsByUser);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post by ID
 * @access  Private
 */
router.put('/:id', authMiddleware, updatePost);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Soft delete a post by ID
 * @access  Private
 */
router.delete('/:id', authMiddleware, deletePost);

/**
 * @route   POST /api/posts/:id/like
 * @desc    Like a post
 * @access  Private
 */
router.post('/:id/like', authMiddleware, likePost);

/**
 * @route   POST /api/posts/:id/unlike
 * @desc    Unlike a post
 * @access  Private
 */
router.post('/:id/unlike', authMiddleware, unlikePost);

/**
 * @route   POST /api/posts/:id/comment
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post('/:id/comment', authMiddleware, addComment);

/**
 * @route   PUT /api/posts/:postId/comment/:commentId
 * @desc    Edit a comment
 * @access  Private
 */
router.put('/:postId/comment/:commentId', authMiddleware, editComment);

/**
 * @route   DELETE /api/posts/:postId/comment/:commentId
 * @desc    Delete a comment
 * @access  Private
 */
router.delete('/:postId/comment/:commentId', authMiddleware, deleteComment);

/**
 * @route   POST /api/posts/:id/save
 * @desc    Save a post
 * @access  Private
 */
router.post('/:id/save', authMiddleware, savePost);

/**
 * @route   DELETE /api/posts/:id/unsave
 * @desc    Unsave a post
 * @access  Private
 */
router.delete('/:id/unsave', authMiddleware, unsavePost);

/**
 * @route   GET /api/users/saved-posts
 * @desc    Get saved posts of the logged-in user
 * @access  Private
 */
router.get('/saved-posts', authMiddleware, getSavedPosts);

/**
 * @route   POST /api/posts/generate-ai
 * @desc    Generate an AI post using an AI user's profile
 * @access  Private (AI user only)
 */
router.post('/generate-ai', authMiddleware, generateAIPost);

/**
 * @route   GET /api/posts/ai
 * @desc    Get all AI-generated posts
 * @access  Public
 */
router.get('/ai', getAIPosts);

module.exports = router;
