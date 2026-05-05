const mongoose = require('mongoose');

// ─── URI helpers ───────────────────────────────────────────────────────────────

/** Mask password so the URI is safe to print in logs */
function maskUri(uri) {
  return uri.replace(/:([^:@]+)@/, ':****@');
}

/**
 * Validate and sanitise the raw MONGO_URI value.
 * Returns the clean URI string, or throws with a human-readable message.
 *
 * Common mistakes this catches:
 *   - MONGO_URI=MONGO_URI=mongodb+srv://...  (key duplicated in value)
 *   - Leading/trailing whitespace
 *   - Missing database name
 */
function sanitiseUri(raw) {
  if (!raw) {
    throw new Error(
      'MONGO_URI is not set in backend/.env\n' +
      '  Add this line to backend/.env:\n' +
      '  MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/lavishleora?retryWrites=true&w=majority'
    );
  }

  // Strip any surrounding whitespace or quotes
  let uri = raw.trim().replace(/^["']|["']$/g, '');

  // ── Detect the "MONGO_URI=MONGO_URI=..." double-prefix bug ──────────────
  // When someone pastes the full KEY=VALUE line as the value, dotenv stores
  // the raw string including the key name, e.g.:
  //   process.env.MONGO_URI === "MONGO_URI=mongodb+srv://..."
  // We strip any leading "ANYWORD=" prefix until we reach a valid scheme.
  const schemePattern = /^[A-Z_]+=(.+)$/;
  let iterations = 0;
  while (schemePattern.test(uri) && iterations < 5) {
    const stripped = uri.match(schemePattern)[1].trim();
    // Only strip if the result looks more like a URI
    if (stripped.startsWith('mongodb')) {
      uri = stripped;
    } else {
      break;
    }
    iterations++;
  }

  // ── Final scheme check ───────────────────────────────────────────────────
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error(
      `Invalid MONGO_URI value in backend/.env\n` +
      `  Received: "${uri.slice(0, 60)}${uri.length > 60 ? '…' : ''}"\n\n` +
      `  The value must start with mongodb:// or mongodb+srv://\n` +
      `  Make sure your .env line looks like:\n` +
      `  MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/lavishleora?retryWrites=true&w=majority\n\n` +
      `  Common mistake — do NOT write:\n` +
      `  MONGO_URI=MONGO_URI=mongodb+srv://...   ← duplicate key in value`
    );
  }

  return uri;
}

// ─── connectDB ────────────────────────────────────────────────────────────────

/**
 * Connect to MongoDB Atlas.
 *
 * Atlas checklist (run through this if connection fails):
 *  1. Cluster is ACTIVE (not paused) — cloud.mongodb.com → your cluster → Resume
 *  2. Network Access → Add IP → 0.0.0.0/0 (Allow from anywhere)
 *  3. Database Access → your user exists with "readWriteAnyDatabase" role
 *  4. Password is correct and special chars are URL-encoded (@ → %40, # → %23 …)
 *  5. Database name "lavishleora" is included in the URI before the "?"
 */
const connectDB = async () => {
  let uri;

  try {
    uri = sanitiseUri(process.env.MONGO_URI);
  } catch (validationErr) {
    console.error(`\n❌ ${validationErr.message}\n`);
    process.exit(1);
  }

  console.log('\n🔌 Connecting to MongoDB Atlas…');
  console.log(`   URI : ${maskUri(uri)}`);

  try {
    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB connected`);
    console.log(`   Host : ${conn.connection.host}`);
    console.log(`   DB   : ${conn.connection.name}\n`);
  } catch (err) {
    console.error(`\n❌ MongoDB connection FAILED`);
    console.error(`   ${err.message}\n`);

    // ── DNS / network ────────────────────────────────────────────────────
    if (/querySrv|ECONNREFUSED|ENOTFOUND|getaddrinfo|EAI_AGAIN/.test(err.message)) {
      console.error(
        '   DIAGNOSIS: DNS or network error\n' +
        '   → Atlas cluster is PAUSED?  Resume it at cloud.mongodb.com\n' +
        '   → IP not whitelisted?       Atlas → Network Access → Add 0.0.0.0/0\n' +
        '   → No internet?              Check your network connection\n' +
        '   → Wrong cluster URL?        Re-copy the SRV string from Atlas → Connect\n'
      );
    }

    // ── Authentication ────────────────────────────────────────────────────
    if (/Authentication failed|bad auth|SCRAM|Unauthorized/.test(err.message)) {
      console.error(
        '   DIAGNOSIS: Authentication error\n' +
        '   → Wrong username or password in MONGO_URI\n' +
        '   → User missing?  Atlas → Database Access → Add new user\n' +
        '   → Password has special chars?  URL-encode them (@ → %40, # → %23)\n'
      );
    }

    // ── Bad connection string ─────────────────────────────────────────────
    if (/Invalid scheme|Invalid connection string|URI/.test(err.message)) {
      console.error(
        '   DIAGNOSIS: Malformed connection string\n' +
        '   Correct format:\n' +
        '   mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/lavishleora?retryWrites=true&w=majority\n'
      );
    }

    process.exit(1);
  }
};

// ─── Connection lifecycle ──────────────────────────────────────────────────────

mongoose.connection.on('disconnected', () =>
  console.warn('⚠️  MongoDB disconnected — will retry automatically')
);
mongoose.connection.on('reconnected', () =>
  console.log('✅ MongoDB reconnected')
);
mongoose.connection.on('error', (err) =>
  console.error(`⚠️  MongoDB runtime error: ${err.message}`)
);

module.exports = connectDB;
