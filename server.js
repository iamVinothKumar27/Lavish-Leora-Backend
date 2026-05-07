const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config();

// Warn about missing required env vars at startup
const REQUIRED_ENV = ['MONGO_URI', 'GOOGLE_CLIENT_ID', 'JWT_SECRET'];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️  WARNING: ${key} is not set in backend .env — some features will fail`);
  }
});

connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Explicitly handle preflight for all routes (required for multipart + Authorization header)
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Serve uploaded product images as static files
// Access via: http://localhost:5000/uploads/products/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/images', require('./routes/images'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cart', require('./routes/cart'));

app.get('/', (req, res) => {
  res.json({ message: 'Lavish Leora API is running' });
});

// Health check — visit http://localhost:5000/api/health
app.get('/api/health', (req, res) => {
  const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const dbStatus = DB_STATES[mongoose.connection.readyState] || 'unknown';

  res.json({
    status: 'ok',
    db: dbStatus,
    dbName: mongoose.connection.name || null,
    env: {
      MONGO_URI:        process.env.MONGO_URI        ? '✅ set' : '❌ missing',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ set' : '❌ missing',
      JWT_SECRET:       process.env.JWT_SECRET       ? '✅ set' : '❌ missing',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || '❌ missing',
      CLIENT_URL:  process.env.CLIENT_URL  || 'http://localhost:5173 (default)',
      BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000 (default)',
      image_storage: 'MongoDB GridFS (productImages bucket)',
    },
  });
});

app.use((err, req, res, next) => {
  console.error('[Server] unhandled error:', err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
