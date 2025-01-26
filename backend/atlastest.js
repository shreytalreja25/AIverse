const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://shreytalreja25:shrey9999@cluster0.1r2di.mongodb.net/AIverse?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });
  

async function connectDB() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
connectDB().catch(console.dir);
