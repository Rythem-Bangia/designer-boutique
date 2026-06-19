const mongoose = require('mongoose');
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  measurements: { chest: String, waist: String, length: String },
  wishlist: [{ type: String }] // Array of Product IDs
}, { timestamps: true });
module.exports = mongoose.model('Customer', customerSchema);