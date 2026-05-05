const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Product = require('../models/Product');
const adminAuth = require('../middleware/adminAuth');

// ─── Multer setup ─────────────────────────────────────────────────────────────
// Vercel serverless has a read-only filesystem — disk storage crashes at startup.
// On Vercel, use memoryStorage (files are received but not persisted to disk).
// On Vercel, only image URLs typed by the admin are saved; uploaded files are ignored.
// Locally, disk storage works as before.

const IS_VERCEL = !!process.env.VERCEL;

let upload;
if (IS_VERCEL) {
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });
} else {
  const uploadDir = path.join(__dirname, '../uploads/products');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `product-${Date.now()}-${Math.round(Math.random() * 9999)}${ext}`);
    },
  });

  upload = multer({
    storage: diskStorage,
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed.'));
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  });
}

// ─── Parse product body from multipart/form-data ─────────────────────────────

function parseProductBody(body, files, fallbackImages = []) {
  // Collect URL strings typed by admin
  let imageUrls = [];
  if (body.imageUrls) {
    const raw = Array.isArray(body.imageUrls) ? body.imageUrls : [body.imageUrls];
    imageUrls = raw.filter((u) => u && u.trim() !== '');
  }

  // File uploads are not supported on Vercel (no persistent disk storage).
  // On Vercel, admins must use image URL inputs instead of file uploads.
  const uploadedUrls = IS_VERCEL
    ? []
    : (files || []).map((f) => {
        const BASE = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${BASE}/uploads/products/${f.filename}`;
      });

  const combined = [...imageUrls, ...uploadedUrls];

  // Sizes: may come as array (multiple values) or string (one value)
  let sizes = [];
  if (body.sizes) {
    sizes = Array.isArray(body.sizes) ? body.sizes : [body.sizes];
  }

  return {
    name: body.name,
    description: body.description,
    price: Number(body.price) || 0,
    category: body.category,
    subcategory: body.subcategory || '',
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

// ─── POST /api/products — create (admin) ─────────────────────────────────────
// Accepts multipart/form-data (supports file upload + URL input together)

router.post('/', adminAuth, upload.array('imageFiles', 10), async (req, res) => {
  try {
    const data = parseProductBody(req.body, req.files);
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── PUT /api/products/:id — update (admin) ───────────────────────────────────

router.put('/:id', adminAuth, upload.array('imageFiles', 10), async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    // Keep existing images as fallback if admin sends no new images
    const data = parseProductBody(req.body, req.files, existing.images);

    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── DELETE /api/products/:id — delete (admin) ────────────────────────────────

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
