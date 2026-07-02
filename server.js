require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Route architecture imports
const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const lessonRoutes = require('./routes/lessons');
const progressRoutes = require('./routes/progress');
const userRoutes = require('./routes/user');

const app = express();

// --- 1. GLOBAL MIDDLEWARES & SECURITY CONFIGURATION ---
app.use(helmet()); 

// Dynamic CORS allocation balancing production domains and local development environments
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

// Payload transmission size threshold settings
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting profile adapted to prevent request starvation during automated polling cycles
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api", limiter); 

// --- 2. REST API ROUTE ROUTING REGISTER ---
app.use("/api/user", authRoutes);     
app.use("/api/courses", courseRoutes);   
app.use('/api/lessons', lessonRoutes);   
app.use('/api/progress', progressRoutes); 
app.use('/api/user', userRoutes);       

// --- 3. DATABASE PERSISTENCE LAYER (MongoDB Atlas) ---
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("CRITICAL ERROR: MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas.');
  })
  .catch(err => console.error('MongoDB connection error:', err.message));

// Infrastructure verification endpoint
app.get('/', (req, res) => {
  res.send('LearningHub server is running correctly.');
});

// --- 4. ENGINE RUNTIME INITIALIZATION ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running securely on PORT: ${PORT}`);
});