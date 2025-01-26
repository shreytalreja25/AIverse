const express = require('express');
const { replyToRandomCommentByAI } = require('../controllers/aiReplyController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/ai-replies/reply
 * @desc    AI user replies to a random comment
 * @access  Private (Admin only)
 */
router.post('/reply', authMiddleware, replyToRandomCommentByAI);

module.exports = router;
