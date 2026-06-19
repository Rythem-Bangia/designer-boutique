const fs = require('fs');
const path = require('path');

// 1. Define the complete folder and file structure
const structure = {
  // Backend / CRM Files
  'backend/package.json': JSON.stringify({
    name: "boutique-crm-backend",
    version: "1.0.0",
    main: "server.js",
    scripts: { start: "node server.js" },
    dependencies: { cors: "^2.8.5", express: "^4.19.2", mongoose: "^8.0.0" }
  }, null, 2),
  
  'backend/models/Product.js': `const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Lehenga', 'Saree', 'Sherwani', 'Kurta'], required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  imageUrl: { type: String, required: true },
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);`,

  'backend/server.js': `const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Product = require('./models/Product');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/designer-boutique')
  .then(() => console.log('Connected to MongoDB Successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/api/crm/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/storefront/products', async (req, res) => {
  try {
    const products = await Product.find({ isPublished: true, stock: { $gt: 0 } });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(8080, () => console.log('Custom CRM Backend running on port 8080'));`,

  // Frontend / Storefront Files
  'frontend/package.json': JSON.stringify({
    name: "boutique-storefront",
    version: "1.0.0",
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start" },
    dependencies: { next: "^14.1.0", react: "^18.2.0", "react-dom": "^18.2.0" },
    devDependencies: { tailwindcss: "^3.4.1", postcss: "^8.4.35", autoprefixer: "^10.4.18" }
  }, null, 2),

  'frontend/app/layout.jsx': `import './globals.css';

export const metadata = {
  title: 'Custom Designer Wear Storefront',
  description: 'Premium Dynamic Ethnic Wear Collection',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,

  'frontend/app/page.jsx': `import Image from 'next/image';

async function getDynamicInventory() {
  try {
    const res = await fetch('http://localhost:8080/api/storefront/products', {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error("Storefront could not reach backend:", err.message);
    return [];
  }
}

export default async function Storefront() {
  const products = await getDynamicInventory();

  return (
    <main className="min-h-screen p-10 bg-stone-50 text-gray-900 font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-serif tracking-widest uppercase">Premium Ethnic Wear</h1>
        <p className="mt-2 text-gray-500">Live Custom Collection</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {products.map((product) => (
          <div key={product._id} className="bg-white p-4 shadow-sm border border-gray-100 rounded">
            <div className="relative h-96 w-full mb-4 bg-gray-200 flex items-center justify-center">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="h-full w-full object-cover rounded-sm"
              />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-medium">{product.name}</h2>
                <p className="text-sm text-gray-400 uppercase tracking-wider">{product.category}</p>
              </div>
              <p className="text-xl font-semibold text-amber-800">₹{product.price.toLocaleString('en-IN')}</p>
            </div>
            <button className="w-full mt-5 bg-stone-900 text-white py-3 rounded-sm hover:bg-stone-850 transition tracking-wide text-sm">
              ADD TO CART
            </button>
          </div>
        ))}
        
        {products.length === 0 && (
          <div className="col-span-3 text-center py-20 border border-dashed border-gray-200 rounded">
            <p className="text-gray-400">No items are published or in stock yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add items via your CRM API to see them here.</p>
          </div>
        )}
      </div>
    </main>
  );
}`,

  'frontend/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`
};

// 2. Execution logic
console.log('🏗️ Generating custom project files...');

Object.entries(structure).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✔️ Created: ${filePath}`);
});

console.log('\n🚀 Project files successfully generated!');