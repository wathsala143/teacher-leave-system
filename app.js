require('dotenv').config();
const mongoose = require('mongoose');

// If password has special chars, encode it:
const password = encodeURIComponent(process.env.DB_PASSWORD); // Store password separately in .env
const MONGODB_URI = `mongodb+srv://${process.env.DB_USERNAME}:${password}@cluster0.xxxxx.mongodb.net/leaveDB?retryWrites=true&w=majority`;

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas!"))
  .catch(err => console.error("❌ MongoDB connection error:", err));