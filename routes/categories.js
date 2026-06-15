const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const adminAuth = require('../middleware/adminAuth');

const DEFAULT_CATEGORIES = [
  {
    gender: 'Women',
    name: 'Korean',
    children: [
      { name: 'Coords', children: [] },
      { name: 'Pants', children: [] },
      { name: 'Bamboo', children: [] },
    ],
  },
  {
    gender: 'Women',
    name: 'Ethnic',
    children: [
      {
        name: 'Kurti',
        children: [
          { name: 'Single Piece Kurti' },
          { name: '2 PC Kurti' },
          { name: '3 PC Kurti' },
        ],
      },
    ],
  },
  {
    gender: 'Men',
    name: 'Inner Wears',
    children: [],
  },
];

// GET all categories — auto-seeds defaults if empty or if old flat schema detected
router.get('/', async (req, res) => {
  try {
    let categories = await Category.find().sort({ gender: 1, name: 1 });

    // Migrate: old schema had `subcategories` (no `gender` field) → drop and re-seed
    const needsMigration = categories.length > 0 && !categories[0].gender;
    if (categories.length === 0 || needsMigration) {
      await Category.deleteMany({});
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
    const { gender, name, children = [] } = req.body;
    if (!gender?.trim() || !name?.trim()) {
      return res.status(400).json({ message: 'Gender and name are required' });
    }
    const existing = await Category.findOne({ gender: gender.trim(), name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: `Category "${gender}/${name}" already exists` });
    }
    const category = await Category.create({ gender: gender.trim(), name: name.trim(), children });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update category (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { gender, name, children } = req.body;
    const update = {};
    if (gender !== undefined) update.gender = gender.trim();
    if (name !== undefined) update.name = name.trim();
    if (children !== undefined) update.children = children;

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
