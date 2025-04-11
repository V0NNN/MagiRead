const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes'); // Import authentication routes
const readingStatusRoutes = require('./routes/readingStatus');
const customListRoutes = require('./routes/customList');
const mangaRoutes = require("./routes/manga");
const imageProxy = require('./routes/imageProxy');

// MongoDB Atlas Connection String
const uri = "mongodb+srv://VON:2485GXcGRA80EmHK@magiread.cfggchf.mongodb.net/?retryWrites=true&w=majority&appName=MagiRead";

const app = express();
const PORT = process.env.PORT || 5000;

app.use('/api/image-proxy', imageProxy);

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // For parsing application/json

// Connect to MongoDB
mongoose.connect(uri) // Removed deprecated options
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error: ", err));

// Authentication routes
app.use('/api/auth', authRoutes); // Mount auth routes to '/api/auth'

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reading-status', readingStatusRoutes);
app.use('/api/custom-lists', customListRoutes);

app.use("/api/manga", mangaRoutes);

// Start server LAST
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
