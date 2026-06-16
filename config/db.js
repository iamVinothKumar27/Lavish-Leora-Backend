const mongoose = require('mongoose');

// ─── Serverless connection cache ──────────────────────────────────────────────
// Reuse the connection across invocations within the same Lambda/function instance.
// Without this, every cold-start would open a new connection and exhaust the pool.
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

// ─── URI helpers ──────────────────────────────────────────────────────────────

function maskUri(uri) {
  return uri.replace(/:([^:@]+)@/, ':****@');
}

function sanitiseUri(raw) {
  if (!raw) {
    throw new Error(
      'MONGO_URI is not set in environment variables.\n' +
      '  Add MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/lavishleora?retryWrites=true&w=majority'
    );
  }

  let uri = raw.trim().replace(/^["']|["']$/g, '');

  // Strip accidental "MONGO_URI=..." prefix in value
  const schemePattern = /^[A-Z_]+=(.+)$/;
  let iterations = 0;
  while (schemePattern.test(uri) && iterations++ < 5) {
    const stripped = uri.match(schemePattern)[1].trim();
    if (stripped.startsWith('mongodb')) uri = stripped;
    else break;
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error(
      `Invalid MONGO_URI — must start with mongodb:// or mongodb+srv://\n` +
      `  Received: "${uri.slice(0, 60)}${uri.length > 60 ? '…' : ''}"`
    );
  }

  return uri;
}

// ─── connectDB ────────────────────────────────────────────────────────────────

const connectDB = async () => {
  // Return cached connection immediately (typical for warm serverless invocations)
  if (cached.conn) return cached.conn;

  const uri = sanitiseUri(process.env.MONGO_URI);

  if (!cached.promise) {
    console.log('\n🔌 Connecting to MongoDB Atlas…');
    console.log(`   URI : ${maskUri(uri)}`);

    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,  // fail fast instead of buffering when disconnected
      })
      .then((m) => {
        console.log(`✅ MongoDB connected — ${m.connection.host} / ${m.connection.name}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Clear the promise so the next request can retry
    cached.promise = null;

    console.error(`\n❌ MongoDB connection FAILED: ${err.message}\n`);

    if (/querySrv|ECONNREFUSED|ENOTFOUND|getaddrinfo|EAI_AGAIN/.test(err.message)) {
      console.error('   → Cluster paused? Resume at cloud.mongodb.com');
      console.error('   → IP not whitelisted? Atlas → Network Access → Add 0.0.0.0/0\n');
    }
    if (/Authentication failed|bad auth|SCRAM/.test(err.message)) {
      console.error('   → Wrong username or password in MONGO_URI\n');
    }

    throw err; // Let the request handler return a 503
  }

  return cached.conn;
};

module.exports = connectDB;
