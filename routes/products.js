const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const Product = require('../models/Product');
const adminAuth = require('../middleware/adminAuth');
const { getGridFSBucket } = require('../config/gridfs');

// ─── Multer: memory storage (no disk, no external package) ───────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, jpeg, png, webp images are allowed.'));
  },
});

// Returns JSON error instead of crashing when multer rejects a file
function runUpload(req, res, next) {
  upload.array('images', 10)(req, res, (err) => {
    if (!err) return next();
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large — max 5 MB per image.'
      : err.message || 'File upload failed.';
    console.error('[Products] multer error:', err.message);
    return res.status(400).json({ message: msg });
  });
}

// ─── Upload file buffers to GridFS ───────────────────────────────────────────
async function uploadFilesToGridFS(files) {
  if (!files || !files.length) return [];
  let bucket;
  try { bucket = getGridFSBucket(); } catch (e) {
    console.error('[GridFS] bucket not ready:', e.message);
    return [];
  }

  const results = [];
  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    try {
      const imageObj = await new Promise((resolve, reject) => {
        const stream = bucket.openUploadStream(filename, { contentType: file.mimetype });
        stream.once('finish', () =>
          resolve({ fileId: stream.id.toString(), filename, contentType: file.mimetype })
        );
        stream.once('error', reject);
        stream.end(file.buffer);
      });
      results.push(imageObj);
      console.log('[GridFS] uploaded:', imageObj.filename, 'id:', imageObj.fileId);
    } catch (e) {
      console.error('[GridFS] upload failed for', filename, ':', e.message);
    }
  }
  return results;
}

// ─── Delete GridFS files by { fileId } objects ───────────────────────────────
async function deleteGridFSImages(images) {
  const toDelete = (images || []).filter(
    (img) => img && typeof img === 'object' && img.fileId
  );
  if (!toDelete.length) return;
  let bucket;
  try { bucket = getGridFSBucket(); } catch { return; }
  for (const img of toDelete) {
    try {
      await bucket.delete(new mongoose.Types.ObjectId(img.fileId));
      console.log('[GridFS] deleted:', img.filename);
    } catch (e) {
      console.error('[GridFS] delete error for', img.filename, ':', e.message);
    }
  }
}

// ─── Build product data from multipart body ───────────────────────────────────
function parseProductBody(body, uploadedImages, fallbackImages = []) {
  // Plain URL strings typed by admin
  let imageUrls = [];
  if (body.imageUrls) {
    const raw = Array.isArray(body.imageUrls) ? body.imageUrls : [body.imageUrls];
    imageUrls = raw.filter((u) => u && u.trim() !== '');
  }

  // Existing GridFS objects admin chose to keep (JSON string from edit form)
  let retainedImages = [];
  if (body.retainedImages) {
    try {
      const parsed = JSON.parse(body.retainedImages);
      if (Array.isArray(parsed)) retainedImages = parsed;
    } catch { /* ignore parse errors */ }
  }

  const combined = [...imageUrls, ...retainedImages, ...(uploadedImages || [])];
  console.log('[Products] images:', combined.length, 'total');

  let sizes = [];
  if (body.sizes) sizes = Array.isArray(body.sizes) ? body.sizes : [body.sizes];

  return {
    name: body.name,
    description: body.description,
    price: Number(body.price) || 0,
    category: body.category,
    subcategory: body.subcategory || '',
    colors: body.colors
      ? (Array.isArray(body.colors) ? body.colors : [body.colors]).filter(Boolean)
      : [],
    sizes,
    stock: Number(body.stock) || 0,
    images: combined.length > 0 ? combined : fallbackImages,
    featured: body.featured === 'true' || body.featured === true,
    newArrival: body.newArrival === 'true' || body.newArrival === true,
    koreanStyle: body.koreanStyle === 'true' || body.koreanStyle === true,
  };
}

// ─── GET /api/products ────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { category, subcategory, featured, newArrival, koreanStyle, search, limit, page } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (featured === 'true') filter.featured = true;
    if (newArrival === 'true') filter.newArrival = true;
    if (koreanStyle === 'true') filter.koreanStyle = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/products — create ─────────────────────────────────────────────

router.post('/', adminAuth, runUpload, async (req, res) => {
  try {
    console.log('[Products] POST — files:', req.files?.length || 0, 'body keys:', Object.keys(req.body));
    const uploadedImages = await uploadFilesToGridFS(req.files);
    const data = parseProductBody(req.body, uploadedImages);
    const product = await Product.create(data);
    console.log('[Products] created:', product._id);
    res.status(201).json(product);
  } catch (error) {
    console.error('[Products] POST error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// ─── PUT /api/products/:id — update ──────────────────────────────────────────

router.put('/:id', adminAuth, runUpload, async (req, res) => {
  try {
    console.log('[Products] PUT — files:', req.files?.length || 0);
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const uploadedImages = await uploadFilesToGridFS(req.files);
    const data = parseProductBody(req.body, uploadedImages, existing.images);

    // Delete GridFS objects that were in the old product but not retained
    const retainedIds = new Set(
      data.images
        .filter((img) => img && typeof img === 'object' && img.fileId)
        .map((img) => img.fileId)
    );
    const removedGridFS = (existing.images || []).filter(
      (img) => img && typeof img === 'object' && img.fileId && !retainedIds.has(img.fileId)
    );
    if (removedGridFS.length) {
      console.log('[Products] removing', removedGridFS.length, 'GridFS image(s)');
      deleteGridFSImages(removedGridFS); // fire-and-forget
    }

    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    console.log('[Products] updated:', product._id);
    res.json(product);
  } catch (error) {
    console.error('[Products] PUT error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// ─── DELETE /api/products/:id ────────────────────────────────────────────────

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    deleteGridFSImages(product.images); // fire-and-forget cleanup
    res.json({ message: 'Product deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
