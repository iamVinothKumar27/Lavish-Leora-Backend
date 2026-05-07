const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const adminAuth = require('../middleware/adminAuth');

const DEFAULT_CATEGORIES = [
  {
    name: 'Women',
    subcategories: ['Kurtis', 'Co-ords', 'Korean Dresses', 'Tops', 'Western Dresses', 'Sarees', 'Gowns', 'Lehengas', 'Skirts'],
  },
  {
    name: 'Men',
    subcategories: ['Shirts', 'T-Shirts', 'Jeans', 'Pants', 'Ethnic Wear', 'Co-ords'],
  },
];

// GET all categories — auto-seeds defaults if collection is empty
router.get('/', async (req, res) => {
  try {
    let categories = await Category.find().sort({ name: 1 });

    if (categories.length === 0) {
      categories = await Category.insertMany(DEFAULT_CATEGORIES);
    }

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create category (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, subcategories = [] } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: `Category "${name.trim()}" already exists` });
    }

    const category = await Category.create({ name: name.trim(), subcategories });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update category name and/or subcategories (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (subcategories !== undefined) {
      update.subcategories = subcategories.filter((s) => s && s.trim() !== '');
    }

    const category = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE category (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: `Category "${category.name}" deleted` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
