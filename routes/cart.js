const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

// GET /api/cart
router.get('/', auth, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.json(cart.items);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/cart/add — add item or increment qty
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, size = '', quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const cart = await getOrCreateCart(req.user.id);
    const idx = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );

    if (idx > -1) {
      cart.items[idx].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: productId,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        category: product.category,
        subcategory: product.subcategory || '',
        size,
        quantity: Number(quantity),
      });
    }

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cart/update — set quantity (< 1 removes the item)
router.put('/update', auth, async (req, res) => {
  try {
    const { productId, size = '', quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const idx = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );
    if (idx === -1) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity < 1) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }

    await cart.save();
    res.json(cart.items);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/cart/remove/:productId?size=M
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const size = req.query.size || '';
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === productId && item.size === size)
    );
    await cart.save();
    res.json(cart.items);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) { cart.items = []; await cart.save(); }
    res.json([]);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
