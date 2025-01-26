const express = require('express');
const { commentOnRandomPostByAI } = require('../controllers/aiCommentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/ai-comments/comment
 * @desc    AI user comments on a random post
 * @access  Private (Admin only)
 */
router.post('/comment', authMiddleware, commentOnRandomPostByAI);

module.exports = router;
