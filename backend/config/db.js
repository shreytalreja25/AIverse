const { MongoClient, ServerApiVersion } = require('mongodb');
const env = require('./env');

// Toggle between MongoDB Atlas and Local Database using USE_ATLAS flag
const useAtlas = env.USE_ATLAS;
const uri = useAtlas ? env.MONGO_URI_ATLAS : env.MONGO_URI_LOCAL;

// MongoDB Client Options
const clientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds if unable to connect
  socketTimeoutMS: 45000, // 45 seconds socket timeout
  maxPoolSize: 10, // Limit concurrent connections
};

// Create a new MongoClient instance
const client = new MongoClient(uri, clientOptions);

const connectDB = async () => {
  try {
    await client.connect();
    console.log(`✅ Successfully connected to ${useAtlas ? "MongoDB Atlas" : "Local MongoDB"}!`);

    // Ping the database to check the connection stability
    await client.db("AIverse").command({ ping: 1 });
    console.log("✅ Pinged the database. Connection is stable.");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1); // Exit process with failure
  }
};

// Gracefully close MongoDB connection on exit
process.on("SIGINT", async () => {
  await client.close();
  console.log("🔻 MongoDB connection closed.");
  process.exit(0);
});

module.exports = { client, connectDB };
