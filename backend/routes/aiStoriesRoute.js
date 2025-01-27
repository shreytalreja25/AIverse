const express = require('express');
const { createAIStory, getActiveAIStories, markStoryAsViewed } = require('../controllers/aiStoryController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/ai-stories/create
 * @desc    Create a random AI-generated story for a selected AI user
 * @access  Private (Admin only)
 */
router.post('/create', authMiddleware, createAIStory);

/**
 * @route   GET /api/ai-stories
 * @desc    Get all active AI stories (not expired)
 * @access  Public
 */
router.get('/', getActiveAIStories);

/**
 * @route   POST /api/ai-stories/view
 * @desc    Mark an AI story as viewed by a user
 * @access  Private (Authenticated users)
 */
router.post('/view', authMiddleware, markStoryAsViewed);

module.exports = router;
