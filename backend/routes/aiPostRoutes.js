const express = require('express');
const { createAIPost } = require('../controllers/aiPostController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/ai-posts/create
 * @desc    Create a random AI-generated post for a selected AI user
 * @access  Private (Admin only)
 */
router.post('/create', authMiddleware, createAIPost);

module.exports = router;
