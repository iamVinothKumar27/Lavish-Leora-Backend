const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const adminAuth = require('../middleware/adminAuth');
const { getGridFSBucket } = require('../config/gridfs');

// ─── GridFS multer storage ────────────────────────────────────────────────────
// Passes db: mongoose.connection — GridFsStorage waits for 'open' if not yet connected
const storage = new GridFsStorage({
  db: mongoose.connection,
  file: (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    return {
      bucketName: 'productImages',
      filename: `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`,
      contentType: file.mimetype,
    };
  },
});

storage.on('connection', () => console.log('[GridFsStorage] connected'));
storage.on('connectionFailed', (err) => console.error('[GridFsStorage] connection failed:', err));

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, jpeg, png, webp images are allowed.'));
  },
});

// Multer errors (file-too-large, bad type) return JSON instead of crashing
function runUpload(req, res, next) {
  upload.array('imageFiles', 10)(req, res, (err) => {
    if (!err) return next();
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large — max 5 MB per image.'
      : err.message || 'File upload failed.';
    console.error('[Products] multer error:', err.message);
    res.status(400).json({ message: msg });
  });
}

// ─── Delete GridFS images by their stored path strings ────────────────────────
async function deleteGridFSImages(imagePaths) {
  const toDelete = (imagePaths || []).filter(
    (img) => typeof img === 'string' && img.startsWith('/api/uploads/')
  );
  if (!toDelete.length) return;

  let bucket;
  try { bucket = getGridFSBucket(); } catch { return; }

  for (const imgPath of toDelete) {
    const filename = imgPath.slice('/api/uploads/'.length);
    try {
      const files = await bucket.find({ filename }).toArray();
      for (const f of files) {
        await bucket.delete(f._id);
        console.log('[GridFS] deleted:', filename);
      }
    } catch (e) {
      console.error('[GridFS] delete error for', filename, ':', e.message);
    }
  }
}

// ─── Parse multipart body into a product data object ─────────────────────────
function parseProductBody(body, files, fallbackImages = []) {
  // Typed/pasted URLs from admin
  let imageUrls = [];
  if (body.imageUrls) {
    const raw = Array.isArray(body.imageUrls) ? body.imageUrls : [body.imageUrls];
    imageUrls = raw.filter((u) => u && u.trim() !== '');
  }

  // Uploaded files stored in GridFS — each file carries { filename, id, ... }
  const uploadedPaths = (files || []).map((f) => {
    const p = `/api/uploads/${f.filename}`;
    console.log('[GridFS] saved:', p, '| id:', f.id);
    return p;
  });

  const combined = [...imageUrls, ...uploadedPaths];
  console.log('[Products] final images:', combined);

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

// ─── POST /api/products — create (admin) ──────────────────────────────────────

router.post('/', adminAuth, runUpload, async (req, res) => {
  try {
    console.log('[Products] POST — body keys:', Object.keys(req.body));
    console.log('[Products] POST — files:', req.files?.length || 0);
    const data = parseProductBody(req.body, req.files);
    const product = await Product.create(data);
    console.log('[Products] created:', product._id, '| images:', product.images);
    res.status(201).json(product);
  } catch (error) {
    console.error('[Products] POST error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// ─── PUT /api/products/:id — update (admin) ───────────────────────────────────

router.put('/:id', adminAuth, runUpload, async (req, res) => {
  try {
    console.log('[Products] PUT — files:', req.files?.length || 0);
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const data = parseProductBody(req.body, req.files, existing.images);

    // Delete any GridFS images that were in the old product but are no longer in the new list
    const removedImages = (existing.images || []).filter(
      (img) => !data.images.includes(img)
    );
    if (removedImages.length) {
      console.log('[Products] removing images:', removedImages);
      deleteGridFSImages(removedImages); // fire-and-forget, don't block response
    }

    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    console.log('[Products] updated:', product._id, '| images:', product.images);
    res.json(product);
  } catch (error) {
    console.error('[Products] PUT error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// ─── DELETE /api/products/:id — delete (admin) ────────────────────────────────

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Clean up GridFS images for this product
    deleteGridFSImages(product.images); // fire-and-forget

    res.json({ message: 'Product deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
