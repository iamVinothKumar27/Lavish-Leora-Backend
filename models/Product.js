const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: ['Men', 'Women'], required: true },
    subcategory: { type: String, default: '' },
    sizes: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    koreanStyle: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
