const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  items: { type: Array, required: true },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, default: 'Pending' },
  paymentMethod: { type: String, default: 'Razorpay' }, // NEW: COD Support
  transactionId: { type: String },
  status: { type: String, default: 'New' }
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);