const express = require('express');
const cors = require('cors');
const { connectDB, client } = require('./config/db');
const { startCronJobs, stopCronJobs } = require('./cron/cronManager');
const path = require('path'); 
const fs = require('fs');
const pkg = require('./package.json');
const env = require('./config/env');

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

        // Health check endpoint for Docker
        app.get('/api/health', async (req, res) => {
            let dbOk = false;
            try {
                await client.db().admin().ping();
                dbOk = true;
            } catch (err) {
                console.error('Database health check failed:', err.message);
            }
            
            res.status(dbOk ? 200 : 503).json({
                status: dbOk ? 'healthy' : 'unhealthy',
                database: dbOk ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Root status page
        app.get('/', async (req, res) => {
            let dbOk = false;
            try {
                await client.db('AIverse').command({ ping: 1 });
                dbOk = true;
            } catch (e) {
                dbOk = false;
            }

            const uptime = Math.floor(process.uptime());
            const now = new Date().toISOString();
            const mem = process.memoryUsage();

            const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AIverse Backend Status</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#0f172a; color:#e2e8f0; margin:0; }
    .wrap { max-width: 800px; margin: 0 auto; padding: 32px; }
    .card { background:#111827; border:1px solid #1f2937; border-radius:12px; padding:24px; }
    .ok { color:#34d399; }
    .bad { color:#f87171; }
    a { color:#60a5fa; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .item { background:#0b1220; border:1px solid #1f2937; border-radius:8px; padding:12px; }
    h1 { margin-top:0; font-size:22px; }
    .small { color:#94a3b8; font-size:12px; }
  </style>
  </head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>AIverse Backend</h1>
      <p>Status: <strong class="${dbOk ? 'ok' : 'bad'}">${dbOk ? 'UP' : 'DEGRADED (DB unreachable)'} </strong></p>
      <div class="grid">
        <div class="item">Version<br/><strong>${pkg.version || '1.0.0'}</strong></div>
        <div class="item">Node<br/><strong>${process.version}</strong></div>
        <div class="item">Environment<br/><strong>${process.env.NODE_ENV || 'development'}</strong></div>
        <div class="item">Uptime (s)<br/><strong>${uptime}</strong></div>
        <div class="item">RSS (MB)<br/><strong>${(mem.rss/1024/1024).toFixed(2)}</strong></div>
        <div class="item">Heap Used (MB)<br/><strong>${(mem.heapUsed/1024/1024).toFixed(2)}</strong></div>
      </div>
      <p class="small">Timestamp: ${now}</p>
      <p>Health JSON: <a href="/health">/health</a></p>
    </div>
  </div>
</body>
</html>`;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.status(200).send(html);
        });

        // JSON health endpoint
        app.get('/health', async (req, res) => {
            const started = Date.now();
            let db = { connected: false };
            try {
                await client.db('AIverse').command({ ping: 1 });
                db = { connected: true };
            } catch (e) {
                db = { connected: false, error: e.message };
            }
            const mem = process.memoryUsage();
            res.json({
                status: 'ok',
                version: pkg.version || '1.0.0',
                nodeVersion: process.version,
                env: process.env.NODE_ENV || 'development',
                uptimeSeconds: Math.floor(process.uptime()),
                timestamp: new Date().toISOString(),
                database: db,
                memory: {
                    rss: mem.rss,
                    heapTotal: mem.heapTotal,
                    heapUsed: mem.heapUsed,
                    external: mem.external
                },
                responseMs: Date.now() - started
            });
        });

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
