const mongoose = require('mongoose');

// Bucket is lazily created on first use after DB connects.
// We do NOT rely on the 'connected' event because in serverless the connection
// is often cached and the event never fires on warm invocations.
let bucket = null;

function getGridFSBucket() {
  if (bucket) return bucket;

  if (mongoose.connection.readyState !== 1) {
    throw new Error('GridFS not ready — database not connected');
  }

  bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'productImages',
  });

  console.log('✅ GridFS productImages bucket ready');
  return bucket;
}

module.exports = { getGridFSBucket };
