const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables

// Use the appropriate connection string based on environment (fallback if undefined)
const uri = process.env.MONGO_URI_LOCAL || "mongodb://localhost:27017/AIverse";
// const uri = process.env.MONGO_URI_ATLAS || "";  // Uncomment for production

// MongoDB Client Options for improved stability and performance
const clientOptions = {
    serverSelectionTimeoutMS: 30000,  // 30 seconds timeout to select a server
    socketTimeoutMS: 45000,           // 45 seconds socket timeout
    maxPoolSize: 10,                   // Limit max concurrent connections
};

// Create a new MongoClient instance
const client = new MongoClient(uri, clientOptions);

const connectDB = async () => {
    try {
        await client.connect();
        console.log("✅ Successfully connected to MongoDB!");

        // Check connection stability
        await client.db("AIverse").command({ ping: 1 });
        console.log("✅ Pinged the database. Connection is stable.");
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);  // Exit process with failure
    }
};

// Gracefully close MongoDB connection on exit
process.on('SIGINT', async () => {
    await client.close();
    console.log('🔻 MongoDB connection closed.');
    process.exit(0);
});

module.exports = { client, connectDB };
