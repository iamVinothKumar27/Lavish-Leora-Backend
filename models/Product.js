const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    subcategory: { type: String, default: '' },
    colors: [{ type: String }],
    sizes: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    // Each element is either a legacy URL string OR { fileId, filename, contentType }
    images: [{ type: mongoose.Schema.Types.Mixed }],
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    koreanStyle: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
