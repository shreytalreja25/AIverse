const express = require('express');
const { createAIUserDeepseek } = require('../controllers/aiUserController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/ai-users/create
 * @desc    Create an AI user using DeepSeek
 * @access  Private (Admin only)
 */
router.post('/create', authMiddleware, createAIUserDeepseek);

module.exports = router;
