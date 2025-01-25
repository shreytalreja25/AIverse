const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { 
    triggerNotification, 
    getUserNotifications, 
    markNotificationAsRead, 
    deleteNotification 
} = require('../controllers/notificationController');

const router = express.Router();

/**
 * @route   POST /api/notifications/trigger
 * @desc    Trigger a new notification (Follow, Like, Comment)
 * @access  Private
 */
router.post('/trigger', authMiddleware, triggerNotification);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the logged-in user
 * @access  Private
 */
router.get('/', authMiddleware, getUserNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read', authMiddleware, markNotificationAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;
