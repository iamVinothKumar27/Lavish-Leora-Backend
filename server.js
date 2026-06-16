const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,   // e.g. https://lavishleora.vercel.app
  process.env.CLIENT_URL,     // backward-compat alias
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      console.error('[CORS] Blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.options('*', cors());

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Serverless DB middleware ─────────────────────────────────────────────────
// Ensures the MongoDB connection is established before every request.
// With the cached connection in db.js, this is near-zero cost on warm instances.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    res.status(503).json({ message: 'Database unavailable. Please try again.' });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/uploads',    require('./routes/uploads'));
app.use('/api/images',     require('./routes/images'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/contacts',   require('./routes/contacts'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/cart',       require('./routes/cart'));

app.get('/', (req, res) => {
  res.json({ message: 'Lavish Leora API is running ✅' });
});

app.get('/api/health', (req, res) => {
  const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    db: DB_STATES[mongoose.connection.readyState] || 'unknown',
    env: {
      MONGO_URI:        process.env.MONGO_URI        ? '✅ set' : '❌ missing',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ set' : '❌ missing',
      JWT_SECRET:       process.env.JWT_SECRET       ? '✅ set' : '❌ missing',
      ADMIN_EMAIL:      process.env.ADMIN_EMAIL      || '❌ missing',
      FRONTEND_URL:     process.env.FRONTEND_URL     || 'not set',
    },
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server] unhandled error:', err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong!' });
});

// ─── Local dev server ─────────────────────────────────────────────────────────
// This block is skipped when imported by Vercel (require.main !== module).
if (require.main === module) {
  const PORT = parseInt(process.env.PORT || '5000', 10);

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });

  const shutdown = (signal) => {
    console.log(`\n[Server] ${signal} — shutting down gracefully…`);
    server.close(() => { console.log('[Server] closed.'); process.exit(0); });
    setTimeout(() => process.exit(1), 5000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const next = PORT + 1;
      console.error(`\n❌ Port ${PORT} in use — trying ${next}…\n`);
      server.close();
      app.listen(next, () => {
        console.log(`🚀 Server running on http://localhost:${next}`);
        console.log(`   ⚠️  Update VITE_API_URL=http://localhost:${next} in frontend/.env\n`);
      });
    } else {
      console.error('[Server] Fatal:', err.message);
      process.exit(1);
    }
  });
}

// ─── Vercel serverless export ─────────────────────────────────────────────────
module.exports = app;
