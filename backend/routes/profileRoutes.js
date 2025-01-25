const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getUserProfile, updateUserProfile, changePassword, deleteUser } = require('../controllers/profileController');
const multer = require('multer');

const router = express.Router();

// Set up storage for profile image uploads
const upload = multer({ dest: 'uploads/profile-images/' });

/**
 * @route   GET /api/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/', authMiddleware, getUserProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/', authMiddleware, updateUserProfile);

/**
 * @route   PUT /api/profile/upload
 * @desc    Upload profile image
 * @access  Private
 */
router.put('/upload', authMiddleware, upload.single('profileImage'), updateUserProfile);

/**
 * @route   PUT /api/profile/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authMiddleware, changePassword);

/**
 * @route   DELETE /api/profile/delete
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/delete', authMiddleware, deleteUser);

module.exports = router;
