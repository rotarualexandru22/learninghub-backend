require('dotenv').config(); // Încărcare variabile mediu (.env)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import Rute (Folosim exact constantele declarate de tine)
const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const lessonRoutes = require('./routes/lessons');
const progressRoutes = require('./routes/progress');
const userRoutes = require('./routes/user');

const app = express();

// --- 1. MIDDLEWARES GLOBALE & SECURITATE (Configurate primele!) ---
app.use(helmet()); // Scut headers securitate
app.use(cors());   // Permite acces frontend

// Parsere pentru datele primite în Body (Trebuie să fie ÎNAINTE de rute!)
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configurare Rate Limiter contra atacurilor de tip DDOS / Brute Force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 100, // Maxim 100 request-uri per IP
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api", limiter); // Protejează absolut toate rutele care încep cu /api

// --- 2. MANAGEMENTUL RUTELOR API ---
app.use("/api/user", authRoutes);       // Login / Register (Ruta finală: /api/user/register sau /api/user/login)
app.use("/api/courses", courseRoutes);   // Management Cursuri (Ruta finală: /api/courses/all)
app.use('/api/lessons', lessonRoutes);   // Management Lecții (Ruta finală: /api/lessons/:courseId)
app.use('/api/progress', progressRoutes); // Monitorizare timp video și anti-skip
app.use('/api/user', userRoutes);       // Profil utilizator (Ruta finală: /api/user/profile etc.)

// --- 3. CONECTARE BAZĂ DE DATE (MongoDB Atlas) ---
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("CRITICAL ERROR: MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => {
    console.log('-----------------------------------------');
    console.log('Successfully connected to MongoDB Atlas!');
    console.log('-----------------------------------------');
  })
  .catch(err => console.error('MongoDB connection error:', err.message));

// Server Health Check endpoint
app.get('/', (req, res) => {
  res.send('LearningHub server is running correctly!');
});

// --- 4. PORNIRE MOTOR TERMIC SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running securely on PORT: ${PORT}`);
});