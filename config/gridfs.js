const mongoose = require('mongoose');

let bucket = null;

function initBucket() {
  if (!bucket && mongoose.connection.readyState === 1) {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'productImages',
    });
  }
}

// Initialise as soon as the connection opens
mongoose.connection.on('connected', () => {
  initBucket();
  console.log('✅ GridFS productImages bucket ready');
});

function getGridFSBucket() {
  initBucket(); // no-op if already created or not yet connected
  if (!bucket) throw new Error('GridFS not ready — database not connected');
  return bucket;
}

module.exports = { getGridFSBucket };
