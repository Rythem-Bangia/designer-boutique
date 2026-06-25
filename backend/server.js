const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const bcrypt = require('bcryptjs');

const Product = require('./models/Product');
const Category = require('./models/Category');
const Order = require('./models/Order');
const Customer = require('./models/Customer'); 
const Promo = require('./models/Promo');

const app = express();

// BUG FIX: Expanding generic payload limits to 1 Gigabyte
app.use(express.json({ limit: '1024mb' }));
app.use(express.urlencoded({ limit: '1024mb', extended: true }));
app.use(cors());

const razorpay = new Razorpay({ key_id: 'rzp_test_T2yNsUJMBL7AGw', key_secret: 'o8j6NRZy52bdOatMkhQVIjHW' });
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// BUG FIX: Safe filename encoding to prevent path traversal / whitespace crashes
const storage = multer.diskStorage({ 
  destination: (req, file, cb) => cb(null, uploadDir), 
  filename: (req, file, cb) => cb(null, Date.now() + '-' + encodeURIComponent(file.originalname.replace(/\s+/g, '-'))) 
});

// BUG FIX: 1 Gigabyte file size limit for Multer processing
const upload = multer({ 
  storage, 
  limits: { fileSize: 1024 * 1024 * 1024 } 
});

mongoose.connect('mongodb://127.0.0.1:27017/designer-boutique').then(() => console.log('Connected to MongoDB'));

app.post('/api/crm/login', (req, res) => { if (req.body.password === 'admin123') res.json({ success: true, token: 'boutique_admin_777' }); else res.status(401).json({ error: 'Invalid' }); });

// BUG FIX: Explicit Multer error handling so React receives clean JSON on failure
app.post('/api/crm/upload-multiple', (req, res) => {
  upload.array('mediaFiles', 10)(req, res, function (err) {
    if (err instanceof multer.MulterError) return res.status(400).json({ error: 'Upload Error: ' + err.message });
    else if (err) return res.status(500).json({ error: 'Server Error: ' + err.message });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files detected.' });
    
    const urls = req.files.map(file => `http://localhost:8080/uploads/${file.filename}`);
    res.json({ urls });
  });
});

app.get('/api/crm/categories', async (req, res) => { res.json(await Category.find()); });
app.post('/api/crm/categories', async (req, res) => { const cat = new Category(req.body); await cat.save(); res.json(cat); });
app.delete('/api/crm/categories/:id', async (req, res) => { await Category.findByIdAndDelete(req.params.id); res.json({success: true}); });
app.post('/api/crm/products', async (req, res) => { const p = new Product(req.body); await p.save(); res.status(201).json(p); });
app.get('/api/crm/products', async (req, res) => { res.json(await Product.find().sort({ createdAt: -1 })); });
app.put('/api/crm/products/:id', async (req, res) => { res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })); });
app.delete('/api/crm/products/:id', async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.json({success: true}); });

app.get('/api/storefront/products', async (req, res) => { res.json(await Product.find({ isPublished: true, stock: { $gt: 0 } })); });
app.get('/api/storefront/products/:id', async (req, res) => { res.json(await Product.findById(req.params.id)); });
app.get('/api/storefront/products/:id/related', async (req, res) => { try { const product = await Product.findById(req.params.id); const related = await Product.find({ category: product.category, _id: { $ne: product._id }, isPublished: true, stock: { $gt: 0 } }).limit(4); res.json(related); } catch(err) { res.status(500).json([]); } });
app.post('/api/storefront/products/:id/reviews', async (req, res) => { try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({error: 'Product not found'}); product.reviews.push({ customerName: req.body.customerName, rating: Number(req.body.rating), comment: req.body.comment }); const total = product.reviews.reduce((sum, rev) => sum + rev.rating, 0); product.averageRating = parseFloat((total / product.reviews.length).toFixed(1)); await product.save(); res.json({ success: true, product }); } catch(err) { res.status(400).json({error: err.message}); } });

app.get('/api/crm/promos', async (req, res) => { res.json(await Promo.find().sort({ createdAt: -1 })); });
app.post('/api/crm/promos', async (req, res) => { try { const p = new Promo(req.body); await p.save(); res.json(p); } catch(err) { res.status(400).json({error: 'Code exists'}); } });
app.delete('/api/crm/promos/:id', async (req, res) => { await Promo.findByIdAndDelete(req.params.id); res.json({success: true}); });
app.get('/api/storefront/promos/active', async (req, res) => { try { res.json(await Promo.find({ isActive: true })); } catch(err) { res.status(500).json([]); } });

app.post('/api/storefront/promos/validate', async (req, res) => {
  try {
    const { code, cart, customerEmail } = req.body;
    if (!cart || !Array.isArray(cart)) return res.status(400).json({error: "Network error: Invalid cart data"});
    const promo = await Promo.findOne({ code: code.toUpperCase(), isActive: true });
    if (!promo) return res.status(400).json({error: 'Invalid or expired code'});
    if (promo.customerEligibility === 'registered' && !customerEmail) return res.status(400).json({error: 'Logged-in account required.'});
    let discountableAmount = 0; let cartTotal = 0;
    cart.forEach(item => { cartTotal += item.price; let isEligible = (!promo.applicableCategories || promo.applicableCategories.length === 0 || promo.applicableCategories.includes(item.category)); if (isEligible) discountableAmount += item.price; });
    if (cartTotal < promo.minOrderValue) return res.status(400).json({error: `Minimum cart value of ₹${promo.minOrderValue} required.`});
    if (discountableAmount === 0) return res.status(400).json({error: 'No eligible items in cart.'});
    res.json({ success: true, discountAmount: Math.round(discountableAmount * (promo.discountPercentage / 100)), promoCode: promo.code });
  } catch(err) { res.status(500).json({error: err.message}); }
});

app.post('/api/storefront/create-razorpay-order', async (req, res) => { try { const order = await razorpay.orders.create({ amount: Math.max(1, Number(req.body.amount) || 1) * 100, currency: "INR", receipt: "rcpt_" + Date.now() }); res.json({ success: true, order }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/storefront/verify-payment', async (req, res) => { const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body; const expectedSignature = crypto.createHmac('sha256', razorpay.key_secret).update(razorpay_order_id + "|" + razorpay_payment_id).digest('hex'); if (expectedSignature === razorpay_signature) { try { const newOrder = new Order({ ...orderData, paymentStatus: 'Paid', paymentMethod: 'Razorpay', transactionId: razorpay_payment_id }); await newOrder.save(); for (let item of (orderData.items || [])) { if (!item.requiresTailoring) await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -1 } }); } res.status(200).json({ success: true, orderId: newOrder._id }); } catch (err) { res.status(400).json({ error: err.message }); } } else res.status(400).json({ success: false }); });
app.post('/api/storefront/create-cod-order', async (req, res) => { try { const newOrder = new Order({ ...req.body.orderData, paymentStatus: 'Pending', paymentMethod: 'Cash on Delivery', transactionId: 'COD-' + Date.now().toString().slice(-6) }); await newOrder.save(); for (let item of (req.body.orderData.items || [])) { if (!item.requiresTailoring) await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -1 } }); } res.status(200).json({ success: true, orderId: newOrder._id }); } catch (err) { res.status(400).json({ error: err.message }); } });

app.get('/api/crm/orders', async (req, res) => { const filter = req.query.email ? { email: req.query.email } : {}; res.json(await Order.find(filter).sort({ createdAt: -1 })); });
app.put('/api/crm/orders/:id/status', async (req, res) => { res.json(await Order.findByIdAndUpdate(req.params.id, { status: req.body.status })); });

app.post('/api/storefront/register', async (req, res) => { try { const existing = await Customer.findOne({ email: req.body.email }); if(existing) return res.status(400).json({error: "Email already exists"}); const salt = await bcrypt.genSalt(10); const hashedPassword = await bcrypt.hash(req.body.password, salt); const cust = new Customer({ ...req.body, password: hashedPassword }); await cust.save(); cust.password = undefined; res.status(201).json({ success: true, customer: cust }); } catch(err) { res.status(400).json({error: err.message}); } });
app.post('/api/storefront/login', async (req, res) => { try { const cust = await Customer.findOne({ email: req.body.email }); if(!cust) return res.status(401).json({error: "Invalid credentials"}); let isMatch = false; if (cust.password.startsWith('$2a$') || cust.password.startsWith('$2b$')) { isMatch = await bcrypt.compare(req.body.password, cust.password); } else { isMatch = (req.body.password === cust.password); } if (!isMatch) return res.status(401).json({error: "Invalid credentials"}); cust.password = undefined; res.json({ success: true, customer: cust }); } catch(err) { res.status(500).json({error: err.message}); } });
app.put('/api/storefront/customers/:id', async (req, res) => { try { const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true }); updated.password = undefined; res.json({ success: true, customer: updated }); } catch(err) { res.status(400).json({error: err.message}); } });
app.post('/api/storefront/customers/:id/wishlist', async (req, res) => { try { const cust = await Customer.findById(req.params.id); const productId = req.body.productId; if (!cust.wishlist) cust.wishlist = []; const index = cust.wishlist.indexOf(productId); if (index > -1) cust.wishlist.splice(index, 1); else cust.wishlist.push(productId); await cust.save(); cust.password = undefined; res.json({ success: true, customer: cust }); } catch(err) { res.status(400).json({error: err.message}); } });
app.get('/api/storefront/customers/:id/wishlist', async (req, res) => { try { const cust = await Customer.findById(req.params.id); const products = await Product.find({ _id: { $in: cust.wishlist || [] } }); res.json(products); } catch(err) { res.status(400).json({error: err.message}); } });

app.listen(8080, () => console.log('Zero-Bug Backend running on port 8080'));