const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getGridFSBucket } = require('../config/gridfs');

// GET /api/images/:id  — stream an image from GridFS by ObjectId
router.get('/:id', async (req, res) => {
  let objectId;
  try {
    objectId = new mongoose.Types.ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: 'Invalid image id' });
  }

  let bucket;
  try {
    bucket = getGridFSBucket();
  } catch {
    return res.status(503).json({ message: 'Storage not ready' });
  }

  try {
    const files = await bucket.find({ _id: objectId }).toArray();
    if (!files.length) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const file = files[0];
    res.set('Content-Type', file.contentType || 'image/jpeg');
    res.set('Content-Length', file.length);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = bucket.openDownloadStream(objectId);
    stream.on('error', (err) => {
      console.error('[Images] stream error:', err.message);
      if (!res.headersSent) res.status(500).json({ message: 'Stream failed' });
    });
    stream.pipe(res);
  } catch (err) {
    console.error('[Images] error:', err.message);
    if (!res.headersSent) res.status(500).json({ message: 'Failed to fetch image' });
  }
});

module.exports = router;
