const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({ customerName: { type: String, required: true }, rating: { type: Number, required: true, min: 1, max: 5 }, comment: { type: String, required: true }, date: { type: Date, default: Date.now } });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  compareAtPrice: { type: Number, default: null },
  stock: { type: Number, required: true },
  imageUrl: { type: String }, // Backward compatibility fallback
  mediaGallery: [{ type: String }], // NEW: Array of images and videos (any extension)
  isPublished: { type: Boolean, default: false },
  isLuxury: { type: Boolean, default: false },
  requiresTailoring: { type: Boolean, default: false },
  tags: [{ type: String }],
  attributes: [{ key: String, value: String }],
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Product', productSchema);