const express = require('express');
const router = express.Router();
const { getGridFSBucket } = require('../config/gridfs');

// GET /api/uploads/:filename  — stream an image from GridFS
router.get('/:filename', async (req, res) => {
  const { filename } = req.params;

  let bucket;
  try {
    bucket = getGridFSBucket();
  } catch {
    return res.status(503).json({ message: 'Storage not ready' });
  }

  try {
    const files = await bucket.find({ filename }).toArray();
    if (!files.length) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const file = files[0];
    res.set('Content-Type', file.contentType || 'image/jpeg');
    res.set('Content-Length', file.length);
    // Cache aggressively — filenames are unique timestamps so content never changes
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = bucket.openDownloadStreamByName(filename);
    stream.on('error', (err) => {
      console.error('[Uploads] stream error:', err.message);
      if (!res.headersSent) res.status(500).json({ message: 'Stream failed' });
    });
    stream.pipe(res);
  } catch (err) {
    console.error('[Uploads] error:', err.message);
    if (!res.headersSent) res.status(500).json({ message: 'Failed to fetch image' });
  }
});

module.exports = router;
