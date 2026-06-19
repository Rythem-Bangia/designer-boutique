const mongoose = require('mongoose');
const promoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercentage: { type: Number, required: true, min: 1, max: 100 },
  minOrderValue: { type: Number, default: 0 },
  applicableCategories: [{ type: String }], // ENGINE: Restrict to categories
  customerEligibility: { type: String, enum: ['all', 'registered'], default: 'all' }, // ENGINE: Restrict to users
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('Promo', promoSchema);