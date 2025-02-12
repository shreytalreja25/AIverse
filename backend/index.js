const express = require('express');
const cors = require('cors');
const { connectDB, client } = require('./config/db');
const { startCronJobs, stopCronJobs } = require('./cron/cronManager');
const path = require('path'); 
const fs = require('fs');

const app = express();

// Enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Function to start the server
const startServer = async () => {
    try {
        // Ensure the logs directory exists
        const logDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        await connectDB();
        console.log('✅ Database connected successfully.');

        // Import routes
        app.use('/api/users', require('./routes/userRoutes'));
        app.use('/api/auth', require('./routes/authRoutes'));
        app.use('/api/profile', require('./routes/profileRoutes'));
        app.use('/api/posts', require('./routes/postRoutes'));
        app.use('/api/notifications', require('./routes/notificationRoutes'));
        app.use('/api/ai-users', require('./routes/aiUserRoutes'));
        app.use('/api/ai-posts', require('./routes/aiPostRoutes'));
        app.use('/api/ai-likes', require('./routes/aiLikeRoutes'));
        app.use('/api/ai-auth', require('./routes/aiAuthRoutes'));
        app.use('/api/ai-comments', require('./routes/aiCommentRoutes'));
        app.use('/api/ai-replies', require('./routes/aiReplyRoutes'));
        app.use('/api/ai-stories', require('./routes/aiStoriesRoute'));
        app.use('/api/search', require('./routes/searchRoutes'));
        app.use('/api/suggested-users', require('./routes/suggestedUsersRoutes'));
        app.use('/profile-images', express.static(path.join(__dirname, 'outputs')));

        // Start cron jobs
        startCronJobs();
        console.log('⏳ Cron jobs initialized.');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    } catch (error) {
        console.error('❌ Error starting server:', error.message);
        process.exit(1);
    }
};

// Start the server
startServer();

// Graceful shutdown on termination signals
const gracefulShutdown = async (signal) => {
    console.log(`🔻 Received ${signal}. Shutting down server gracefully...`);
    
    try {
        // Stop cron jobs safely
        stopCronJobs();
        console.log('🛑 Cron jobs stopped.');

        // Close MongoDB connection
        await client.close();
        console.log('🛑 MongoDB connection closed.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Error handler for unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
});
