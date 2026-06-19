"use client";
import { useState, useEffect } from 'react';
import { useCustomer } from '../CustomerContext';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Ruler, Heart, ShoppingBag, MapPin, Phone } from 'lucide-react';

const generateInvoice = (order, customer) => { /* Omitted for brevity in script, keeping same as before */
  const doc = new jsPDF(); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(28, 25, 23); doc.text('THE BOUTIQUE', 14, 22); doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 113, 108); doc.text('Premium Custom Ethnic Wear', 14, 28); doc.setTextColor(28, 25, 23); doc.text(`Invoice #${order._id.slice(-8).toUpperCase()}`, 130, 22); doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 130, 28); doc.text(`Status: ${order.paymentStatus}`, 130, 34); doc.setFont('helvetica', 'bold'); doc.text('Billed To:', 14, 45); doc.setFont('helvetica', 'normal'); doc.text(customer.name, 14, 52); doc.text(customer.email, 14, 58); autoTable(doc, { startY: 70, head: [['Design', 'Details', 'Amount']], body: order.items.map(item => [ item.name, item.requiresTailoring ? 'Bespoke' : `Size: ${item.size}`, `Rs. ${item.price}` ]), theme: 'grid' }); doc.save(`Invoice_${order._id.slice(-8)}.pdf`);
};

export default function AccountPage() {
  const { customer, loginCustomer, logoutCustomer } = useCustomer();
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  
  // Extended Profile State
  const [measurements, setMeasurements] = useState({ chest: '', waist: '', length: '' });
  const [profileData, setProfileData] = useState({ phone: '', address: '' });
  
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'wishlist'

  // NEW: HASH ROUTING LOGIC
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#wishlist') {
      setActiveTab('wishlist');
    }
  }, []);

  useEffect(() => {
    if (customer) {
      setMeasurements(customer.measurements || { chest: '', waist: '', length: '' });
      setProfileData({ phone: customer.phone || '', address: customer.address || '' });
      fetch(`http://localhost:8080/api/crm/orders?email=${customer.email}`).then(res => res.json()).then(data => setOrders(data));
      fetch(`http://localhost:8080/api/storefront/customers/${customer._id}/wishlist`).then(res => res.json()).then(data => setWishlistItems(data));
    }
  }, [customer]);

  const handleAuth = async (e) => {
    e.preventDefault(); const endpoint = isLoginView ? '/api/storefront/login' : '/api/storefront/register'; const loadingToast = toast.loading('Authenticating...');
    try { const res = await fetch(`http://localhost:8080${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authForm) }); const data = await res.json(); if (data.success) { loginCustomer(data.customer); toast.success('Welcome!', { id: loadingToast }); } else toast.error(data.error, { id: loadingToast }); } catch (err) { toast.error("Server offline.", { id: loadingToast }); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); const loadingToast = toast.loading('Updating profile...');
    try { const res = await fetch(`http://localhost:8080/api/storefront/customers/${customer._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ measurements, phone: profileData.phone, address: profileData.address }) }); const data = await res.json(); if(data.success) { loginCustomer(data.customer); toast.success('Profile updated', { id: loadingToast }); } } catch (err) { toast.error('Error', { id: loadingToast }); }
  };

  if (!customer) return ( <div className="flex min-h-screen bg-white font-sans"><div className="hidden lg:flex w-1/2 bg-stone-900 relative items-center justify-center overflow-hidden"><img src="https://images.unsplash.com/photo-1613061527119-56899f8c14d9?auto=format&fit=crop&q=80&w=2000" className="absolute inset-0 w-full h-full object-cover opacity-50" /><div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent"></div><div className="relative z-10 p-16 text-center max-w-lg"><h2 className="text-4xl font-serif text-white mb-6">Enter The Atelier</h2><p className="text-stone-300 text-sm leading-relaxed tracking-wide">Secure your private commissions and wishlist.</p></div></div><div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-24 bg-stone-50 relative"><Link href="/" className="absolute top-8 left-8 text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 flex items-center gap-2"><ArrowLeft size={14} /> Storefront</Link><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-auto"><h1 className="text-3xl font-serif mb-2 text-stone-900">{isLoginView ? 'Welcome Back' : 'Join The Boutique'}</h1><p className="text-xs text-stone-500 mb-10 tracking-widest uppercase">{isLoginView ? 'Sign in' : 'Register'}</p><form onSubmit={handleAuth} className="space-y-6">{!isLoginView && <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full pb-3 border-b border-stone-300 bg-transparent outline-none focus:border-stone-900" placeholder="Full Name" />}<input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full pb-3 border-b border-stone-300 bg-transparent outline-none focus:border-stone-900" placeholder="Email Address" /><input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full pb-3 border-b border-stone-300 bg-transparent outline-none focus:border-stone-900" placeholder="Password" /><button type="submit" className="w-full bg-stone-900 text-white py-5 mt-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-stone-800 transition shadow-xl shadow-stone-900/10">{isLoginView ? 'Authenticate' : 'Create Profile'}</button></form><div className="mt-10 border-t border-stone-200 pt-6 text-center"><p className="text-xs text-stone-500 uppercase tracking-widest">{isLoginView ? "New? " : "Registered? "}<button onClick={() => setIsLoginView(!isLoginView)} className="text-stone-900 font-bold underline hover:text-amber-700">{isLoginView ? 'Create Account' : 'Sign In'}</button></p></div></motion.div></div></div> );

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans">
      <nav className="w-full bg-white border-b border-stone-200 px-8 py-5 flex justify-between items-center sticky top-0 z-40">
        <Link href="/" className="text-2xl font-serif tracking-widest uppercase hover:text-amber-700 transition">The Boutique</Link>
        <button onClick={() => { logoutCustomer(); toast('Logged out'); }} className="text-xs uppercase font-bold tracking-widest text-stone-500 hover:text-red-500 transition">Sign Out</button>
      </nav>
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-16">
        
        {/* ENHANCED LEFT COL: Profile & Address Book */}
        <div className="md:col-span-1">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 sticky top-24">
            <div className="w-20 h-20 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center text-3xl font-serif mb-6 border border-stone-200">{customer.name.charAt(0)}</div>
            <h2 className="text-3xl font-serif mb-1 text-stone-900">{customer.name}</h2>
            <p className="text-xs text-stone-500 mb-10 tracking-widest">{customer.email}</p>
            
            <form onSubmit={handleUpdateProfile} className="space-y-8">
              {/* Measurements Block */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest border-b border-stone-100 pb-3 mb-6 flex items-center gap-2"><Ruler size={14}/> Tailoring Profile</h3>
                <div className="space-y-4">
                  {['chest', 'waist', 'length'].map(m => (
                    <div key={m} className="flex items-center justify-between border-b border-stone-100 pb-2"><label className="text-xs font-bold text-stone-600 uppercase tracking-widest">{m}</label><input type="number" value={measurements[m]} onChange={e => setMeasurements({...measurements, [m]: e.target.value})} className="w-20 p-2 text-right outline-none font-serif text-lg bg-transparent" placeholder='-"' /></div>
                  ))}
                </div>
              </div>

              {/* Contact & Delivery Block */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest border-b border-stone-100 pb-3 mb-6 flex items-center gap-2"><MapPin size={14}/> Address Book</h3>
                <div className="space-y-4">
                  <div className="relative group"><Phone size={14} className="absolute left-3 top-3.5 text-stone-400"/><input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full p-3 pl-9 border border-stone-200 rounded-xl outline-none focus:border-amber-700 text-sm bg-stone-50/50" placeholder="Phone Number" /></div>
                  <textarea rows="3" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} className="w-full p-3 border border-stone-200 rounded-xl outline-none focus:border-amber-700 text-sm bg-stone-50/50 resize-none" placeholder="Default Shipping Address"></textarea>
                </div>
              </div>

              <button type="submit" className="w-full border border-stone-300 text-stone-800 py-4 text-xs tracking-widest uppercase font-bold hover:bg-stone-900 hover:text-white transition rounded-xl">Save All Changes</button>
            </form>
          </div>
        </div>

        {/* Right Col: Tabs (Orders & Wishlist) */}
        <div className="md:col-span-2">
          <div className="flex gap-8 border-b border-stone-200 mb-10">
            <button onClick={() => { setActiveTab('orders'); window.location.hash = ''; }} className={`pb-4 text-sm font-bold uppercase tracking-widest transition ${activeTab === 'orders' ? 'border-b-2 border-stone-900 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>Order History</button>
            <button onClick={() => { setActiveTab('wishlist'); window.location.hash = 'wishlist'; }} className={`pb-4 text-sm font-bold uppercase tracking-widest transition ${activeTab === 'wishlist' ? 'border-b-2 border-stone-900 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>Wishlist ({customer.wishlist?.length || 0})</button>
          </div>

          {activeTab === 'orders' && (
            <AnimatePresence>
              {orders.length === 0 ? (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white p-16 rounded-2xl border border-stone-200 text-center flex flex-col items-center">
                  <ShoppingBag size={48} strokeWidth={1} className="text-stone-300 mb-6" />
                  <p className="text-stone-500 mb-6 font-serif text-lg">Your collection is empty.</p>
                  <Link href="/"><button className="bg-stone-900 text-white px-8 py-4 uppercase text-xs font-bold tracking-widest rounded-xl hover:bg-stone-800 transition">Explore Boutique</button></Link>
                </motion.div>
              ) : (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
                  {orders.map(order => (
                    <div key={order._id} className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 hover:shadow-md transition group">
                      <div className="flex justify-between items-start mb-6 border-b border-stone-100 pb-6">
                        <div><p className="text-[10px] text-stone-400 uppercase tracking-[0.2em] mb-1">Order #{order._id.slice(-8).toUpperCase()}</p><p className="font-serif text-2xl text-stone-900">₹{order.totalAmount.toLocaleString('en-IN')}</p></div>
                        <div className="flex flex-col items-end gap-3">
                          <span className="bg-stone-100 text-stone-800 text-[10px] px-3 py-1.5 rounded-md font-bold uppercase tracking-widest">{order.status}</span>
                          <button onClick={() => generateInvoice(order, customer)} className="text-[10px] uppercase font-bold tracking-widest text-amber-700 hover:text-amber-600 transition flex items-center gap-1.5 opacity-0 group-hover:opacity-100"><Download size={12}/> Invoice</button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm"><span className="font-medium text-stone-800">{item.name}</span><span className="text-xs text-stone-500 bg-stone-50 px-2 py-1 rounded border border-stone-100 uppercase tracking-widest font-bold">{item.requiresTailoring ? 'Bespoke' : `Size ${item.size}`}</span></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {activeTab === 'wishlist' && (
            <AnimatePresence>
              {wishlistItems.length === 0 ? (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white p-16 rounded-2xl border border-stone-200 text-center flex flex-col items-center">
                  <Heart size={48} strokeWidth={1} className="text-stone-300 mb-6" />
                  <p className="text-stone-500 mb-6 font-serif text-lg">Your wishlist is empty.</p>
                </motion.div>
              ) : (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {wishlistItems.map(item => (
                    <Link href={`/product/${item._id}`} key={item._id} className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg transition">
                      <div className="h-64 w-full bg-stone-200 overflow-hidden"><img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" /></div>
                      <div className="p-5"><h4 className="text-lg font-serif text-stone-900 mb-1">{item.name}</h4><p className="text-sm font-bold text-amber-700">₹{item.price.toLocaleString('en-IN')}</p></div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}

        </div>
      </div>
    </div>
  );
}