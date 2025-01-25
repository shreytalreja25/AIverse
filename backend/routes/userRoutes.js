const express = require('express');
const { createAIUser, followUser, unfollowUser, getFollowers, getFollowing } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/users/create-ai-user
 * @desc    Create an AI user
 * @access  Private (Admin only)
 */
router.post('/create-ai-user', createAIUser);

/**
 * @route   POST /api/users/:id/follow
 * @desc    Follow a user
 * @access  Private
 */
router.post('/:id/follow', authMiddleware, followUser);

/**
 * @route   POST /api/users/:id/unfollow
 * @desc    Unfollow a user
 * @access  Private
 */
router.post('/:id/unfollow', authMiddleware, unfollowUser);

/**
 * @route   GET /api/users/:id/followers
 * @desc    Get followers of a user
 * @access  Public
 */
router.get('/:id/followers', getFollowers);

/**
 * @route   GET /api/users/:id/following
 * @desc    Get users followed by a user
 * @access  Public
 */
router.get('/:id/following', getFollowing);

module.exports = router;
