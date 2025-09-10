const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB, client } = require('./config/db');
const { startCronJobs, stopCronJobs } = require('./cron/cronManager');
const { simulateProgress, withProgress } = require('./utils/progressUtils');
const path = require('path'); 
const fs = require('fs');
const pkg = require('./package.json');
const env = require('./config/env');

const app = express();

// Enable CORS with flexible configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Vercel domains
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow your specific production domain
    if (origin === 'https://aiverse-opal.vercel.app') {
      return callback(null, true);
    }
    
    // Allow environment-specified CORS origin
    if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: process.env.CORS_CREDENTIALS === 'true' || true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Additional CORS headers for extra compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log CORS requests for debugging
  if (origin) {
    console.log(`[CORS] Request from origin: ${origin}`);
  }
  
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[CORS] Handling preflight request for ${origin}`);
    res.status(200).end();
    return;
  }
  
  next();
});

// Middleware to parse JSON with increased size limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Function to start the server
const startServer = async () => {
    try {
        // Ensure the logs directory exists
        const logDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        await withProgress('Connecting to database', async () => {
            await connectDB();
        });
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
        app.use('/api/webhooks', require('./routes/webhookRoutes'));
        app.use('/api/content', require('./routes/webhookRoutes'));
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

        // Start cron jobs with progress
        await withProgress('Starting cron jobs', async () => {
            startCronJobs();
        });
        console.log('⏳ Cron jobs initialized.');

        const PORT = process.env.PORT || 5000;
        
        // Create HTTP server
        const server = http.createServer(app);
        
        // Initialize Socket.IO
        const io = new Server(server, {
            cors: {
                origin: function (origin, callback) {
                    // Allow requests with no origin (like mobile apps or curl requests)
                    if (!origin) return callback(null, true);
                    
                    // Allow localhost for development
                    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                        return callback(null, true);
                    }
                    
                    // Allow Vercel domains
                    if (origin.includes('vercel.app')) {
                        return callback(null, true);
                    }
                    
                    // Allow your specific production domain
                    if (origin === 'https://aiverse-opal.vercel.app') {
                        return callback(null, true);
                    }
                    
                    // Allow environment-specified CORS origin
                    if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
                        return callback(null, true);
                    }
                    
                    // For development, allow all origins
                    if (process.env.NODE_ENV === 'development') {
                        return callback(null, true);
                    }
                    
                    // Reject other origins
                    callback(new Error('Not allowed by CORS'));
                },
                credentials: true
            }
        });

        // Make io globally available for webhook routes
        global.io = io;

        // Socket.IO connection handling
        io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            
            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
            });
        });

        await withProgress(`Starting server on port ${PORT}`, async () => {
            return new Promise((resolve) => {
                server.listen(PORT, () => {
                    console.log(`\n🚀 Server running on port ${PORT}`);
                    console.log(`🔌 WebSocket server ready at ws://localhost:${PORT}`);
                    resolve();
                });
            });
        });

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
