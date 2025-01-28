const express = require('express');
const { createAIUserDeepseek, generateProfilePictureController } = require('../controllers/aiUserController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/ai-users/create
 * @desc    Create an AI user using DeepSeek
 * @access  Private (Admin only)
 */
router.post('/create', authMiddleware, createAIUserDeepseek);

/**
 * @route   POST /api/ai-users/generate-profile-image
 * @desc    Generate a profile picture for an AI user using ComfyUI
 * @access  Private
 */
router.post('/generate-profile-image', generateProfilePictureController);


module.exports = router;
