const express = require('express');
const { likeRandomPostByAI } = require('../controllers/aiLikeController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/ai-likes/like
 * @desc    AI user likes a random post
 * @access  Private (Admin only)
 */
router.post('/like', authMiddleware, likeRandomPostByAI);

module.exports = router;
