const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB Atlas Connection String
const uri = "mongodb+srv://VON:2485GXcGRA80EmHK@magiread.cfggchf.mongodb.net/?retryWrites=true&w=majority&appName=MagiRead";

// Replace <db_password> with your actual password
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectMongoDB() {
  try {
    // Connect MongoDB client
    await client.connect();
    console.log("MongoDB Atlas connected successfully!");

    // Connect Mongoose (no deprecated options)
    await mongoose.connect(uri);
    console.log("MongoDB Mongoose connected successfully!");
    
    // Optional: Ping MongoDB to ensure connection works
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Call the MongoDB connection function
connectMongoDB();

// Start Express server or any other logic
const express = require('express');
const app = express();
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
