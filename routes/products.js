const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Product = require('../models/Product');
const adminAuth = require('../middleware/adminAuth');

// ─── Cloudinary storage for product images ────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lavish-leora/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpg, jpeg, png, webp images are allowed.'));
    }
  },
});

// ─── Parse product body from multipart/form-data ─────────────────────────────

function parseProductBody(body, files, fallbackImages = []) {
  // URLs typed by admin (paste-from-clipboard)
  let imageUrls = [];
  if (body.imageUrls) {
    const raw = Array.isArray(body.imageUrls) ? body.imageUrls : [body.imageUrls];
    imageUrls = raw.filter((u) => u && u.trim() !== '');
  }

  // Files uploaded via Cloudinary — each file has a .path property = secure_url
  const uploadedUrls = (files || []).map((f) => {
    console.log('[Cloudinary] uploaded:', f.path);
    return f.path;
  });

  const combined = [...imageUrls, ...uploadedUrls];
  console.log('[Products] final image list:', combined);

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

router.post('/', adminAuth, upload.array('imageFiles', 10), async (req, res) => {
  try {
    console.log('[Products] POST — files received:', req.files?.length || 0);
    const data = parseProductBody(req.body, req.files);
    const product = await Product.create(data);
    console.log('[Products] saved images:', product.images);
    res.status(201).json(product);
  } catch (error) {
    console.error('[Products] POST error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// ─── PUT /api/products/:id — update (admin) ───────────────────────────────────

router.put('/:id', adminAuth, upload.array('imageFiles', 10), async (req, res) => {
  try {
    console.log('[Products] PUT — files received:', req.files?.length || 0);
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const data = parseProductBody(req.body, req.files, existing.images);

    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    console.log('[Products] updated images:', product.images);
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
    res.json({ message: 'Product deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
