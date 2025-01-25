const { client } = require('../config/db');
const { ObjectId } = require('mongodb');

/**
 * Trigger a new notification (Follow, Like, Comment)
 */
const triggerNotification = async (req, res) => {
    try {
        const { userId, type, relatedUserId, relatedPostId, message } = req.body;
        const db = client.db("AIverse");

        if (!userId || !type || !message) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newNotification = {
            userId: new ObjectId(userId),
            type,  // follow, like, comment
            relatedUserId: relatedUserId ? new ObjectId(relatedUserId) : null,
            relatedPostId: relatedPostId ? new ObjectId(relatedPostId) : null,
            message,
            isRead: false,
            createdAt: new Date()
        };

        const result = await db.collection("notifications").insertOne(newNotification);
        res.status(201).json({ message: "Notification triggered successfully", notificationId: result.insertedId });
    } catch (error) {
        console.error("Error triggering notification:", error);
        res.status(500).json({ error: "Failed to trigger notification" });
    }
};

/**
 * Get all notifications for the logged-in user
 */
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const db = client.db("AIverse");

        const notifications = await db.collection("notifications")
            .find({ userId: new ObjectId(userId) })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

/**
 * Mark a notification as read
 */
const markNotificationAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const db = client.db("AIverse");

        const result = await db.collection("notifications").updateOne(
            { _id: new ObjectId(notificationId) },
            { $set: { isRead: true } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Notification not found or already read" });
        }

        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const db = client.db("AIverse");

        const result = await db.collection("notifications").deleteOne({ _id: new ObjectId(notificationId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: "Failed to delete notification" });
    }
};

module.exports = {
    triggerNotification,
    getUserNotifications,
    markNotificationAsRead,
    deleteNotification
};
