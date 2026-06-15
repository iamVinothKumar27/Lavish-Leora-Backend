const mongoose = require('mongoose');

const grandchildSchema = new mongoose.Schema(
  { name: { type: String, required: true, trim: true } },
  { _id: false }
);

const childSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    children: [grandchildSchema],
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    gender: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    children: [childSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
