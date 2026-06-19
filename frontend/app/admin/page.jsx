"use client";
import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { LayoutDashboard, ShoppingBag, Database, LogOut, CheckCircle, Clock, Download, Plus, Trash2, Edit, X, Tag, ListTree } from 'lucide-react';

const isVideo = (url) => url && (url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.webm') || url.toLowerCase().includes('.mov') || url.toLowerCase().includes('.avi') || url.toLowerCase().includes('.mkv'));

const generateAdminInvoice = (order) => { 
  const doc = new jsPDF(); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(28, 25, 23); doc.text('THE BOUTIQUE', 14, 22); doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 113, 108); doc.text('Internal Order Record', 14, 28); doc.setTextColor(28, 25, 23); doc.text(`Order #${order._id.slice(-8).toUpperCase()}`, 130, 22); doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 130, 28); doc.text(`Gateway: ${order.paymentMethod} (${order.paymentStatus})`, 130, 34); doc.setFont('helvetica', 'bold'); doc.text('Customer Details:', 14, 45); doc.setFont('helvetica', 'normal'); doc.text(order.customerName, 14, 52); doc.text(order.email, 14, 58); doc.text(order.phone, 14, 64); 
  autoTable(doc, { startY: 80, head: [['Product', 'Specs', 'Price']], body: order.items.map(i => [i.name, i.requiresTailoring ? 'Bespoke' : `Size: ${i.size}`, `Rs. ${(i.price || 0).toLocaleString('en-IN')}`]), theme: 'grid' }); 
  doc.save(`Admin_Order_${order._id.slice(-8)}.pdf`); toast.success('Invoice Generated!');
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('pim'); 
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promos, setPromos] = useState([]);
  const [newPromo, setNewPromo] = useState({ code: '', discountPercentage: '', minOrderValue: 0, applicableCategories: '', customerEligibility: 'all' });
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({ name: '', category: '', price: '', compareAtPrice: '', stock: '', isPublished: false, isLuxury: false, requiresTailoring: false, tagsInput: '', attrInput: '', mediaGallery: [] });

  useEffect(() => { const token = localStorage.getItem('boutique_admin_token'); if (token) setIsAuthenticated(true); }, []);
  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);

  const handleLogin = async (e) => { e.preventDefault(); try { const res = await fetch('http://localhost:8080/api/crm/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }); const data = await res.json(); if (data.token) { localStorage.setItem('boutique_admin_token', data.token); toast.success('Welcome'); setIsAuthenticated(true); } else toast.error('Access Denied'); } catch (err) { toast.error('Server offline'); } };
  const handleLogout = () => { localStorage.removeItem('boutique_admin_token'); setIsAuthenticated(false); toast('Logged out'); };

  const fetchData = async () => { try { const [invRes, catRes, ordRes, promoRes] = await Promise.all([ fetch('http://localhost:8080/api/crm/products'), fetch('http://localhost:8080/api/crm/categories'), fetch('http://localhost:8080/api/crm/orders'), fetch('http://localhost:8080/api/crm/promos') ]); setInventory(await invRes.json()); const catData = await catRes.json(); setCategories(catData); setOrders(await ordRes.json()); setPromos(await promoRes.json()); if (catData.length > 0 && !formData.category && !editingId) setFormData(prev => ({ ...prev, category: catData[0].name })); } catch (error) { toast.error("Sync failed"); } };

  const handleAddPromo = async (e) => { e.preventDefault(); if (!newPromo.code || !newPromo.discountPercentage) return; const payload = { ...newPromo, applicableCategories: newPromo.applicableCategories ? newPromo.applicableCategories.split(',').map(c=>c.trim()) : [] }; try { const res = await fetch('http://localhost:8080/api/crm/promos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (res.ok) { toast.success('Promo Added'); setNewPromo({code:'', discountPercentage:'', minOrderValue: 0, applicableCategories: '', customerEligibility: 'all'}); fetchData(); } else toast.error('Code may exist'); } catch(err) { toast.error('Error'); } };
  const handleDeletePromo = async (id) => { if(!confirm('Delete?')) return; await fetch(`http://localhost:8080/api/crm/promos/${id}`, { method: 'DELETE' }); fetchData(); toast.error('Deleted'); };
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value }); };
  const handleAddCategory = async (e) => { e.preventDefault(); if(!newCategory) return; await fetch('http://localhost:8080/api/crm/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory }) }); setNewCategory(''); fetchData(); toast.success('Added'); };
  const handleDeleteCategory = async (id) => { if(!confirm('Delete?')) return; await fetch(`http://localhost:8080/api/crm/categories/${id}`, { method: 'DELETE' }); fetchData(); toast.error('Deleted'); };
  
  const handleEditClick = (product) => { 
    setEditingId(product._id); 
    const tagsInput = product.tags ? product.tags.join(', ') : ''; 
    const attrInput = product.attributes ? product.attributes.map(a => a.value ? `${a.key}:${a.value}` : a.key).join('\n') : ''; 
    setFormData({ ...product, compareAtPrice: product.compareAtPrice || '', tagsInput, attrInput, mediaGallery: product.mediaGallery || (product.imageUrl ? [product.imageUrl] : []) }); 
    if (fileInputRef.current) fileInputRef.current.value = ""; window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };
  
  const cancelEdit = () => { setEditingId(null); setFormData({ name: '', category: categories.length > 0 ? categories[0].name : '', price: '', compareAtPrice: '', stock: '', isPublished: false, isLuxury: false, requiresTailoring: false, tagsInput:'', attrInput:'', mediaGallery: [] }); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const handleDeleteProduct = async (id) => { if(!confirm('DeletePermanently?')) return; await fetch(`http://localhost:8080/api/crm/products/${id}`, { method: 'DELETE' }); if (editingId === id) cancelEdit(); fetchData(); toast.error('Removed'); };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const loadingToast = toast.loading('Uploading assets to Digital PIM...');
    const uploadData = new FormData();
    files.forEach(file => uploadData.append('mediaFiles', file));
    try {
      const res = await fetch('http://localhost:8080/api/crm/upload-multiple', { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.urls) { setFormData(prev => ({ ...prev, mediaGallery: [...(prev.mediaGallery || []), ...data.urls] })); toast.success('Assets added', { id: loadingToast }); }
    } catch(err) { toast.error('Upload error', { id: loadingToast }); }
  };

  const removeGalleryItem = (index) => { setFormData(prev => ({ ...prev, mediaGallery: (prev.mediaGallery || []).filter((_, i) => i !== index) })); };

  const handleSubmit = async (e) => { 
    e.preventDefault(); const loadingToast = toast.loading('Syncing...'); 
    const parsedTags = formData.tagsInput ? formData.tagsInput.split(',').map(t=>t.trim()).filter(Boolean) : [];
    const parsedAttrs = formData.attrInput ? formData.attrInput.split(/\r?\n/).map(line => { 
      const idx = line.indexOf(':'); 
      if(idx === -1) return line.trim() ? { key: line.trim(), value: '' } : null;
      return { key: line.substring(0, idx).trim(), value: line.substring(idx + 1).trim() }; 
    }).filter(Boolean) : [];

    try { 
      const endpoint = editingId ? `http://localhost:8080/api/crm/products/${editingId}` : 'http://localhost:8080/api/crm/products'; 
      const method = editingId ? 'PUT' : 'POST'; 
      const payload = { ...formData, price: Number(formData.price), compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : null, stock: Number(formData.stock), tags: parsedTags, attributes: parsedAttrs, imageUrl: (formData.mediaGallery || [])[0] || '' };
      const res = await fetch(endpoint, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); 
      if (res.ok) { toast.success('PIM Synced!', { id: loadingToast }); cancelEdit(); fetchData(); } else throw new Error(); 
    } catch (error) { toast.error('Sync failed.', { id: loadingToast }); } 
  };

  const updateOrderStatus = async (orderId, newStatus) => { try { await fetch(`http://localhost:8080/api/crm/orders/${orderId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }); fetchData(); toast.success(`Moved to ${newStatus}`); } catch (err) { toast.error('Failed to update status'); } };

  const totalRealizedRevenue = orders.filter(o => o.paymentStatus === 'Paid' || o.paymentMethod === 'Cash on Delivery').reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const revenueMap = {}; orders.filter(o => o.paymentStatus === 'Paid' || o.paymentMethod === 'Cash on Delivery').forEach(order => { const date = new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }); revenueMap[date] = (revenueMap[date] || 0) + (order.totalAmount || 0); });
  const revenueData = Object.keys(revenueMap).map(date => ({ date, revenue: revenueMap[date] }));
  const productSalesMap = {}; orders.filter(o => o.paymentStatus === 'Paid' || o.paymentMethod === 'Cash on Delivery').forEach(order => { order.items.forEach(item => { productSalesMap[item.name] = (productSalesMap[item.name] || 0) + 1; }); });
  const topSellersData = Object.keys(productSalesMap).map(name => ({ name, sales: productSalesMap[name] })).sort((a, b) => b.sales - a.sales).slice(0, 5);

  if (!isAuthenticated) return ( <div className="min-h-screen flex items-center justify-center bg-stone-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800 to-stone-950"><div className="glass-panel p-10 rounded-2xl shadow-2xl w-full max-w-md text-center border-t-4 border-amber-600"><h1 className="text-3xl font-serif tracking-widest uppercase mb-2 text-stone-100">Boutique OS</h1><form onSubmit={handleLogin} className="space-y-6 mt-8"><input type="password" placeholder="Access Code" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 rounded bg-stone-900/50 border border-stone-700 text-stone-100 text-center tracking-widest outline-none focus:border-amber-600 transition" /><button type="submit" className="w-full bg-amber-700 text-white p-4 uppercase tracking-widest text-sm font-bold shadow-lg">Authenticate</button></form></div></div> );

  return (
    <div className="flex h-screen bg-stone-100 font-sans overflow-hidden">
      <aside className="w-64 bg-stone-950 text-stone-300 flex flex-col z-20 border-r border-stone-800">
        <div className="p-8 border-b border-stone-800"><h1 className="text-xl font-serif text-white tracking-widest uppercase flex items-center gap-2">Boutique OS</h1></div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition text-sm font-medium tracking-wide ${activeTab === 'dashboard' ? 'bg-amber-700/10 text-amber-500 border border-amber-700/30' : 'hover:bg-stone-900 hover:text-white'}`}><LayoutDashboard size={18}/> Overview</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex justify-between items-center px-4 py-4 rounded-xl transition text-sm font-medium tracking-wide ${activeTab === 'orders' ? 'bg-amber-700/10 text-amber-500 border border-amber-700/30' : 'hover:bg-stone-900 hover:text-white'}`}><div className="flex items-center gap-3"><ShoppingBag size={18}/> Order Board</div></button>
          <button onClick={() => setActiveTab('pim')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition text-sm font-medium tracking-wide ${activeTab === 'pim' ? 'bg-amber-700/10 text-amber-500 border border-amber-700/30' : 'hover:bg-stone-900 hover:text-white'}`}><Database size={18}/> PIM Core</button>
          <button onClick={() => setActiveTab('taxonomy')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition text-sm font-medium tracking-wide ${activeTab === 'taxonomy' ? 'bg-amber-700/10 text-amber-500 border border-amber-700/30' : 'hover:bg-stone-900 hover:text-white'}`}><ListTree size={18}/> Taxonomy</button>
          <button onClick={() => setActiveTab('marketing')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition text-sm font-medium tracking-wide ${activeTab === 'marketing' ? 'bg-amber-700/10 text-amber-500 border border-amber-700/30' : 'hover:bg-stone-900 hover:text-white'}`}><Tag size={18}/> Marketing</button>
        </nav>
        <div className="p-6 border-t border-stone-800"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-sm text-stone-500 hover:text-red-400 bg-stone-900 py-3 rounded-xl border border-stone-800"><LogOut size={16}/> Secure Logout</button></div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 bg-[#fafaf9]">
        {activeTab === 'dashboard' && ( <div className="max-w-7xl mx-auto animate-fade-in"><h2 className="text-3xl font-serif mb-8 text-stone-900">Financial Command Center</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10"><div className="glass-panel p-6 rounded-2xl border-l-4 border-l-amber-600"><p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mb-2">Total Revenue</p><p className="text-4xl font-light text-stone-900">₹{totalRealizedRevenue.toLocaleString('en-IN')}</p></div><div className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-600"><p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mb-2">Active Orders</p><p className="text-4xl font-light text-stone-900">{orders.length}</p></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="glass-panel p-6 rounded-2xl"><h3 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-6">Revenue Trend</h3><div className="h-72 w-full">{revenueData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><LineChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" /><XAxis dataKey="date" stroke="#78716c" fontSize={11} tickLine={false} axisLine={false}/><YAxis stroke="#78716c" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} /><Line type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={4} dot={{ r: 4, fill: '#d97706', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} /></LineChart></ResponsiveContainer>) : "No data"}</div></div><div className="glass-panel p-6 rounded-2xl"><h3 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-6">Top Sellers</h3><div className="h-72 w-full">{topSellersData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={topSellersData} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" horizontal={true} vertical={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" stroke="#78716c" fontSize={10} width={100} tickLine={false} axisLine={false} /><Tooltip cursor={{fill: '#f5f5f4'}} contentStyle={{ borderRadius: '12px', border: 'none' }} /><Bar dataKey="sales" fill="#1c1917" radius={[0,8,8,0]} barSize={20} /></BarChart></ResponsiveContainer>) : "No data"}</div></div></div></div> )}
        {activeTab === 'orders' && ( <div className="h-full flex flex-col animate-fade-in"><h2 className="text-3xl font-serif mb-8 text-stone-900">Order Fulfillment</h2><div className="flex-1 overflow-x-auto"><div className="flex gap-6 min-w-max pb-8">{['New', 'In Tailoring', 'Ready to Ship', 'Completed'].map(status => (<div key={status} className="w-[340px] bg-stone-200/40 rounded-2xl p-4 border h-fit max-h-[75vh] flex flex-col"><div className="flex justify-between items-center mb-6 px-2"><h4 className="font-bold text-stone-800 uppercase tracking-widest text-xs flex items-center gap-2">{status === 'Completed' ? <CheckCircle size={14} className="text-green-600"/> : <Clock size={14} className="text-amber-600"/>} {status}</h4><span className="bg-white text-stone-600 text-[10px] px-2.5 py-1 rounded-full shadow-sm font-bold">{orders.filter(o => o.status === status).length}</span></div><div className="space-y-4 overflow-y-auto pr-2">{orders.filter(o => o.status === status).map(order => (<div key={order._id} className="glass-panel p-5 rounded-xl hover:shadow-lg transition cursor-pointer group"><div className="flex justify-between items-start mb-3 border-b border-stone-100 pb-3"><div><p className="font-bold text-stone-900 text-sm">{order.customerName}</p><p className="text-[11px] font-bold text-amber-700 mt-0.5">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</p><p className="text-[9px] uppercase tracking-widest font-bold mt-1 text-stone-500">{order.paymentMethod}</p></div><button onClick={() => generateAdminInvoice(order)} className="text-stone-400 hover:text-amber-700 bg-stone-50 hover:bg-amber-50 p-2 rounded-lg transition border hover:border-amber-200"><Download size={14} /></button></div><div className="bg-stone-50/50 rounded-lg p-3 mb-4 border"><p className="text-[9px] uppercase font-bold text-stone-400 mb-2 tracking-widest">Cart Items</p>{(order.items||[]).map((item, idx) => (<div key={idx} className="text-xs text-stone-700 mb-2 last:mb-0"><span className="font-medium flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-stone-400"></div>{item.name}</span>{item.requiresTailoring ? (<p className="ml-2.5 mt-1 text-[9px] text-amber-800 font-bold bg-amber-100/50 px-1.5 py-0.5 rounded w-fit">C:{item.measurements.chest} W:{item.measurements.waist} L:{item.measurements.length}</p>) : ( <span className="text-[9px] text-stone-500 ml-2.5 font-bold uppercase">Size: {item.size}</span> )}</div>))}</div><select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)} className="w-full text-xs font-bold uppercase tracking-widest p-2.5 border rounded-lg outline-none bg-white text-stone-600 cursor-pointer focus:border-amber-700">{['New', 'In Tailoring', 'Ready to Ship', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>))}</div></div>))}</div></div></div> )}
        {activeTab === 'pim' && ( 
          <div className="max-w-7xl mx-auto animate-fade-in"><h2 className="text-3xl font-serif mb-8 text-stone-900">PIM Core</h2><div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="space-y-6 xl:col-span-1">
              <div className="glass-panel p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b pb-2"><h3 className="text-sm font-bold uppercase tracking-widest">{editingId ? 'Edit Product' : 'Add Product'}</h3>{editingId && <button type="button" onClick={cancelEdit} className="text-xs text-stone-500 underline">Cancel</button>}</div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Name</label><input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-xl outline-none" /></div>
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Category</label><select name="category" required value={formData.category} onChange={handleChange} className="w-full p-3 border rounded-xl bg-white"><option value="" disabled>Select</option>{categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Sale Price</label><input type="number" name="price" required value={formData.price} onChange={handleChange} className="w-full p-3 border rounded-xl bg-amber-50/50" /></div><div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Orig. Price</label><input type="number" name="compareAtPrice" value={formData.compareAtPrice} onChange={handleChange} className="w-full p-3 border rounded-xl" /></div><div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Stock</label><input type="number" name="stock" required value={formData.stock} onChange={handleChange} className="w-full p-3 border rounded-xl" /></div></div>
                  
                  <div className="border border-stone-200 p-4 rounded-xl space-y-4 bg-stone-50/30">
                    <label className="flex items-center cursor-pointer"><input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} className="h-4 w-4" /><span className="ml-3 text-sm font-bold text-stone-700">Publish Product</span></label>
                    <label className="flex items-center cursor-pointer"><input type="checkbox" name="isLuxury" checked={formData.isLuxury} onChange={handleChange} className="h-4 w-4" /><span className="ml-3 text-sm text-stone-600">Feature as Luxury Hero</span></label>
                    <label className="flex items-center cursor-pointer"><input type="checkbox" name="requiresTailoring" checked={formData.requiresTailoring} onChange={handleChange} className="h-4 w-4" /><span className="ml-3 text-sm text-stone-600">Requires Custom Tailoring</span></label>
                  </div>

                  <div className="space-y-4">
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Search Tags</label><textarea name="tagsInput" value={formData.tagsInput} onChange={handleChange} placeholder="Summer, Bridal" className="w-full p-3 border rounded-xl h-16 resize-none" /></div>
                    <div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Attributes (Key:Value per line)</label><textarea name="attrInput" value={formData.attrInput} onChange={handleChange} placeholder="Material: Pure Silk" className="w-full p-3 border rounded-xl h-24 font-mono resize-none" /></div>
                  </div>

                  <div className="p-4 bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">Asset Gallery (Images & Videos)</label>
                    <input type="file" multiple accept="image/*,video/*" ref={fileInputRef} onChange={handleMediaUpload} className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-stone-200 file:text-stone-700 cursor-pointer" />
                    {formData.mediaGallery && formData.mediaGallery.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {formData.mediaGallery.map((url, index) => (
                          <div key={index} className="relative h-16 bg-white border border-stone-200 rounded-lg overflow-hidden group">
                            {isVideo(url) ? <video src={url} className="w-full h-full object-cover" muted /> : <img src={url} className="w-full h-full object-cover" />}
                            <button type="button" onClick={() => removeGalleryItem(index)} className="absolute inset-0 bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 flex items-center justify-center transition">Delete</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="submit" className="w-full text-white p-4 rounded-xl bg-stone-900 hover:bg-stone-800 transition font-bold uppercase tracking-widest text-xs mt-6">Save PIM Record</button>
                </form>
              </div>
            </div>

            <div className="glass-panel p-0 rounded-2xl xl:col-span-2 h-fit overflow-hidden"><div className="p-6 border-b bg-white"><h3 className="text-sm font-bold text-stone-800 uppercase tracking-widest">Master Product Table</h3></div><div className="overflow-x-auto"><table className="w-full text-left divide-y divide-stone-200"><thead><tr className="bg-stone-50/50 text-[10px] uppercase text-stone-400 font-bold tracking-widest"><th className="p-4">Product</th><th className="p-4">Price</th><th className="p-4">Status & Tags</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-stone-100 bg-white">
              {inventory.map((item) => {
                const gallery = item.mediaGallery || [];
                const displayMedia = gallery[0] || item.imageUrl || '';
                return (
                <tr key={item._id} className="hover:bg-stone-50 transition">
                  <td className="p-4 flex gap-4 items-center">
                    <div className="h-14 w-14 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-stone-100">
                      {isVideo(displayMedia) ? <video src={displayMedia} className="h-full w-full object-cover" muted /> : <img src={displayMedia} className="h-full w-full object-cover" />}
                    </div>
                    <div><p className="font-bold text-stone-900 text-sm">{item.name}</p><p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">{item.stock} left</p></div>
                  </td>
                  <td className="p-4 text-sm font-bold text-stone-700">₹{(item.price||0).toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    {/* FIXED: Defensive rendering for tags array */}
                    <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-stone-200 text-stone-500'}`}>{item.isPublished ? 'Live' : 'Draft'}</span>
                    <div className="flex flex-wrap gap-1 max-w-[150px] mt-1.5">{(item.tags || []).slice(0,2).map(t=><span key={t} className="text-[8px] bg-stone-100 border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">{t}</span>)}</div>
                  </td>
                  <td className="p-4 text-right space-x-2"><button onClick={() => handleEditClick(item)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit size={16}/></button><button onClick={() => handleDeleteProduct(item._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16}/></button></td>
                </tr>
              )})}
            </tbody></table></div></div>
          </div></div> 
        )}
        {activeTab === 'taxonomy' && ( <div className="max-w-4xl mx-auto animate-fade-in"><h2 className="text-3xl font-serif mb-8 text-stone-900">Taxonomy & Collections</h2><div className="glass-panel p-8 rounded-2xl"><h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b pb-4 flex items-center gap-2"><ListTree size={16}/> Manage Categories</h3><form onSubmit={handleAddCategory} className="flex gap-4 mb-8"><input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 p-4 border rounded-xl text-sm outline-none focus:border-amber-600 bg-stone-50/50" placeholder="e.g. Summer Bridal Collection" /><button type="submit" className="bg-stone-900 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition">Create Collection</button></form><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{categories.map(c => (<div key={c._id} className="bg-white border border-stone-200 p-4 rounded-xl flex justify-between items-center shadow-sm"><span className="font-bold text-stone-800">{c.name}</span><button onClick={() => handleDeleteCategory(c._id)} className="text-stone-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16}/></button></div>))}</div></div></div> )}
        {activeTab === 'marketing' && ( <div className="max-w-7xl mx-auto animate-fade-in"><h2 className="text-3xl font-serif mb-8 text-stone-900">Marketing & Conversions</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="glass-panel p-8 rounded-2xl h-fit sticky top-10"><h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b pb-4 flex items-center gap-2"><Tag size={16}/> Advanced Algorithm Rules</h3><form onSubmit={handleAddPromo} className="space-y-6"><div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Campaign Code</label><input type="text" required value={newPromo.code} onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})} placeholder="e.g. EXCLUSIVE20" className="w-full p-4 border rounded-xl outline-none focus:border-amber-600 text-sm uppercase font-mono tracking-widest font-bold bg-stone-50/50" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Discount (%)</label><input type="number" min="1" max="100" required value={newPromo.discountPercentage} onChange={(e) => setNewPromo({...newPromo, discountPercentage: e.target.value})} placeholder="20" className="w-full p-4 border rounded-xl outline-none focus:border-amber-600 text-sm bg-stone-50/50" /></div><div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Min. Order (₹)</label><input type="number" required value={newPromo.minOrderValue} onChange={(e) => setNewPromo({...newPromo, minOrderValue: e.target.value})} placeholder="5000" className="w-full p-4 border rounded-xl outline-none focus:border-amber-600 text-sm bg-stone-50/50" /></div></div><div className="border-t border-stone-200 pt-6 space-y-4"><div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Eligible Categories (Comma separated, empty = all)</label><input type="text" value={newPromo.applicableCategories} onChange={(e) => setNewPromo({...newPromo, applicableCategories: e.target.value})} placeholder="Bridal, Summer" className="w-full p-3 border rounded-xl outline-none focus:border-amber-600 text-sm bg-stone-50/50" /></div><div><label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Customer Restrictions</label><select value={newPromo.customerEligibility} onChange={(e) => setNewPromo({...newPromo, customerEligibility: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-amber-600 text-sm bg-white"><option value="all">Everyone</option><option value="registered">Registered Members Only</option></select></div></div><button type="submit" className="w-full text-white p-4 rounded-xl bg-stone-900 hover:bg-stone-800 transition font-bold uppercase tracking-widest text-xs shadow-lg shadow-stone-900/20 mt-4">Activate Campaign</button></form></div><div className="glass-panel p-8 rounded-2xl"><h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b pb-4">Active Campaigns</h3><div className="space-y-4">{promos.length === 0 ? (<p className="text-stone-400 text-sm italic">No active promotions.</p>) : (promos.map(promo => (<div key={promo._id} className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center group"><div><p className="font-mono font-bold tracking-widest text-lg text-amber-700">{promo.code}</p><div className="flex flex-wrap items-center gap-2 mt-2"><span className="text-[10px] text-white bg-green-600 px-2 py-0.5 rounded uppercase tracking-widest font-bold">{promo.discountPercentage}% OFF</span>{promo.minOrderValue > 0 && <span className="text-[9px] text-stone-500 border border-stone-200 px-2 py-0.5 rounded uppercase tracking-widest font-bold">Min ₹{promo.minOrderValue.toLocaleString('en-IN')}</span>}{promo.customerEligibility === 'registered' && <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest font-bold">Members Only</span>}</div></div><button onClick={() => handleDeletePromo(promo._id)} className="text-stone-300 hover:text-white hover:bg-red-500 p-2 rounded-lg transition border border-transparent hover:border-red-600"><Trash2 size={16}/></button></div>)))}</div></div></div></div> )}
      </main>
    </div>
  );
}