"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';
import { useCustomer } from './CustomerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Search, Heart, ChevronLeft, ChevronRight, ArrowRight, Scissors, Flame, Star, Play, Sparkles } from 'lucide-react';

const isVideo = (url) => { if (typeof url !== 'string') return false; return url.match(/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i) !== null; };

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activePromos, setActivePromos] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [topCategoryPrefs, setTopCategoryPrefs] = useState(null);

  const { cart, setIsCartOpen } = useCart();
  const { customer } = useCustomer();
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const timerRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => { if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchFocused(false); };
    if (typeof window !== 'undefined') document.addEventListener("mousedown", handleClickOutside);
    return () => { if (typeof window !== 'undefined') document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8080/api/storefront/products').then(res => res.json()),
      fetch('http://localhost:8080/api/crm/categories').then(res => res.json()),
      fetch('http://localhost:8080/api/storefront/promos/active').then(res => res.json().catch(() => []))
    ]).then(([prodData, catData, promoData]) => { 
      setProducts(prodData); 
      setCategories(catData); 
      setActivePromos(promoData || []); 
      setIsLoading(false); 
      if (typeof window !== 'undefined') {
        const prefs = JSON.parse(localStorage.getItem('boutique_category_prefs') || '{}');
        if (Object.keys(prefs).length > 0) {
          const topCat = Object.keys(prefs).sort((a,b) => prefs[b] - prefs[a])[0];
          if (topCat !== 'All') setTopCategoryPrefs(topCat);
        }
      }
    }).catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    if (typeof window !== 'undefined') window.addEventListener('scroll', handleScroll);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('scroll', handleScroll); };
  }, []);

  const luxuryItems = products.filter(p => p.isLuxury);
  
  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (luxuryItems.length > 1) { timerRef.current = setInterval(() => { setCurrentHeroIndex((prev) => (prev + 1) % luxuryItems.length); }, 6000); }
  };

  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current); }, [luxuryItems.length, currentHeroIndex]);

  const heroItem = luxuryItems[currentHeroIndex];
  const nextHero = () => { setCurrentHeroIndex((prev) => (prev + 1) % luxuryItems.length); resetTimer(); };
  const prevHero = () => { setCurrentHeroIndex((prev) => (prev - 1 + luxuryItems.length) % luxuryItems.length); resetTimer(); };

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    if (typeof window !== 'undefined') {
      const prefs = JSON.parse(localStorage.getItem('boutique_category_prefs') || '{}');
      prefs[cat] = (prefs[cat] || 0) + 1;
      localStorage.setItem('boutique_category_prefs', JSON.stringify(prefs));
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (product.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const newArrivals = [...products].slice(0, 4);
  const curatedProducts = topCategoryPrefs ? products.filter(p => p.category === topCategoryPrefs).slice(0, 4) : [];
  const searchSuggestions = searchQuery.length > 1 ? products.filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3) : [];
  const lookbookFeatures = [...products].sort((a,b) => (b.price||0) - (a.price||0)).slice(0, 2);

  if (isLoading) return ( <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-stone-200 border-t-amber-700 rounded-full" /></div> );

  return (
    <main className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans flex flex-col overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className={`w-full px-8 py-5 flex justify-between items-center fixed top-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white/85 backdrop-blur-xl shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="flex items-center gap-10">
          <Link href="/" className={`text-2xl font-serif tracking-widest uppercase transition duration-500 ${isScrolled ? 'text-stone-900 hover:text-amber-700' : 'text-white hover:text-amber-300 drop-shadow-md'}`}>The Boutique</Link>
          <div className={`hidden md:flex space-x-8 text-[10px] font-bold tracking-widest uppercase ${isScrolled ? 'text-stone-500' : 'text-stone-200'}`}>
            <Link href="#collection" className="hover:text-amber-600 transition duration-300">Collection</Link>
            <Link href="#lookbook" className="hover:text-amber-600 transition duration-300">Campaigns</Link>
          </div>
        </div>
        <div className={`flex items-center gap-6 ${isScrolled ? 'text-stone-900' : 'text-white'}`}>
          <Link href="/account#wishlist" className="hover:text-amber-600 transition relative"><Heart size={20} strokeWidth={1.5} />{customer?.wishlist?.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">{customer.wishlist.length}</span>}</Link>
          <Link href="/account" className="hover:text-amber-600 transition"><User size={20} strokeWidth={1.5} /></Link>
          <button onClick={() => setIsCartOpen(true)} className="hover:text-amber-600 transition relative"><ShoppingBag size={20} strokeWidth={1.5} />{cart.length > 0 && <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cart.length}</span>}</button>
        </div>
      </nav>

      {/* HERO CAROUSEL */}
      {luxuryItems.length > 0 && heroItem && (
        <section className="relative w-full h-[95vh] bg-stone-950 flex items-center justify-center text-center overflow-hidden group">
          <AnimatePresence mode="wait">
            <motion.div key={heroItem._id} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0 opacity-80">
              {isVideo(heroItem.imageUrl) ? <video src={heroItem.imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={heroItem.imageUrl} className="w-full h-full object-cover" />}
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-transparent to-stone-950/90"></div>
          {luxuryItems.length > 1 && ( <>
            <button onClick={prevHero} className="absolute left-8 z-20 text-white/40 hover:text-white transition opacity-0 group-hover:opacity-100"><ChevronLeft size={40} strokeWidth={1}/></button>
            <button onClick={nextHero} className="absolute right-8 z-20 text-white/40 hover:text-white transition opacity-0 group-hover:opacity-100"><ChevronRight size={40} strokeWidth={1}/></button>
            <div className="absolute bottom-12 z-20 flex gap-4">{luxuryItems.map((_, idx) => ( <div key={idx} onClick={() => { setCurrentHeroIndex(idx); resetTimer(); }} className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-500 ${idx === currentHeroIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/80'}`}></div> ))}</div>
          </> )}
          <AnimatePresence mode="wait">
            <motion.div key={heroItem._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.8 }} className="relative z-10 p-8 max-w-4xl mt-20">
              <p className="text-amber-400 text-[10px] tracking-[0.5em] uppercase mb-6 font-bold flex items-center justify-center gap-4"><span className="w-8 h-[1px] bg-amber-400"></span> Exclusive <span className="w-8 h-[1px] bg-amber-400"></span></p>
              <h2 className="text-6xl md:text-8xl font-serif text-white mb-10 drop-shadow-2xl leading-tight">{heroItem.name}</h2>
              <Link href={`/product/${heroItem._id}`}><button className="bg-white text-stone-900 px-10 py-4 uppercase text-[10px] tracking-[0.3em] font-bold hover:bg-amber-600 hover:text-white transition duration-500 flex items-center gap-3 mx-auto">Discover <ArrowRight size={14}/></button></Link>
            </motion.div>
          </AnimatePresence>
        </section>
      )}

      {/* NEW ARRIVALS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-16">
            <div><p className="text-[10px] uppercase tracking-widest text-amber-700 font-bold mb-3">Just In</p><h3 className="text-4xl font-serif text-stone-900">The Latest Additions</h3></div>
            <Link href="#collection" className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition flex items-center gap-2 border-b border-transparent hover:border-stone-900 pb-1">View All <ArrowRight size={14}/></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.map((product) => {
              const displayImg = (product.mediaGallery || [])[0] || product.imageUrl;
              return (
              <Link href={`/product/${product._id}`} key={product._id} className="group block">
                <div className="relative h-[400px] w-full mb-6 bg-stone-100 overflow-hidden rounded-xl bg-stone-900">
                  {isVideo(displayImg) ? <video src={displayImg} className="h-full w-full object-cover" muted autoPlay playsInline loop /> : <img src={displayImg} className="h-full w-full object-cover transition duration-1000 group-hover:scale-110" />}
                  <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition duration-500"></div>
                  {product.stock <= 3 && <span className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm text-white text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded shadow-md flex items-center gap-1"><Flame size={10}/> Low Stock</span>}
                  {product.averageRating >= 4.5 && <span className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md text-stone-900 text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded shadow-md flex items-center gap-1"><Star size={10} className="fill-amber-500 text-amber-500"/> Top Rated</span>}
                  {product.requiresTailoring && <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-stone-900 text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow-sm">Bespoke</span>}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-serif text-stone-900 mb-1 group-hover:text-amber-700 transition">{product.name}</h4>
                    <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">{product.category}</p>
                  </div>
                  <p className="text-sm font-bold text-stone-900">₹{(product.price||0).toLocaleString('en-IN')}</p>
                </div>
              </Link>
            )})}
          </div>
        </div>
      </section>

      {/* ZERO-PARTY PERSONALIZATION SECTION */}
      {curatedProducts.length > 0 && (
        <section className="py-16 bg-stone-50 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center gap-4 mb-10 border-b border-stone-200 pb-4">
              <Star size={20} className="text-amber-600" />
              <h3 className="text-2xl font-serif text-stone-900">Curated For You: {topCategoryPrefs}</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {curatedProducts.map(product => {
                const displayImg = (product.mediaGallery || [])[0] || product.imageUrl;
                return (
                <Link href={`/product/${product._id}`} key={product._id} className="group block">
                  <div className="relative h-72 md:h-96 w-full mb-4 bg-stone-200 overflow-hidden rounded-xl shadow-sm bg-stone-900">
                    {isVideo(displayImg) ? <video src={displayImg} className="h-full w-full object-cover" muted loop autoPlay playsInline /> : <img src={displayImg} className="h-full w-full object-cover transition duration-1000 group-hover:scale-105" />}
                    {product.stock <= 3 && <span className="absolute top-3 left-3 bg-red-600/90 text-white text-[8px] uppercase font-bold tracking-widest px-2 py-1 rounded flex items-center gap-1"><Flame size={8}/> Fast Selling</span>}
                  </div>
                  <h4 className="text-sm font-serif text-stone-900 mb-1 group-hover:text-amber-800 transition">{product.name}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-stone-900">₹{(product.price || 0).toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              )})}
            </div>
          </div>
        </section>
      )}

      {/* DYNAMIC SHOPPABLE VIDEO CAMPAIGNS - FED BY PIM VIDEOS */}
      <div id="lookbook">
        {activePromos && activePromos.length > 0 ? (
          (() => {
            // Isolate the highest discount campaign
            const promo = [...activePromos].sort((a, b) => b.discountPercentage - a.discountPercentage)[0];
            const eligibleProducts = promo.applicableCategories && promo.applicableCategories.length > 0
              ? products.filter(p => promo.applicableCategories.includes(p.category))
              : products;
            
            const campaignProducts = [...eligibleProducts].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 2);
            
            // --- NEW: DYNAMIC PIM VIDEO LOGIC ---
            // 1. Find all eligible products that actually have a video in their gallery
            const productsWithVideo = [...eligibleProducts].filter(p => (p.mediaGallery || []).some(url => isVideo(url)) || isVideo(p.imageUrl));
            
            // 2. Sort them to find the highest-rated product that has a video
            productsWithVideo.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            
            // 3. Fallback video just in case NO products in the PIM have videos uploaded yet
            let vidSrc = "https://cdn.coverr.co/videos/coverr-fashion-woman-walking-in-the-city-2741/1080p.mp4"; 
            
            if (productsWithVideo.length > 0) {
              const bestVideoProduct = productsWithVideo[0];
              const gallery = bestVideoProduct.mediaGallery || [];
              // Extract the exact .mp4 URL from the PIM database
              vidSrc = gallery.find(url => isVideo(url)) || bestVideoProduct.imageUrl;
            }

            return (
              <section className="w-full relative bg-stone-950 flex flex-col md:flex-row items-stretch border-t border-stone-900 overflow-hidden">
                <div className="w-full md:w-1/2 h-[60vh] md:h-auto min-h-[60vh] relative group cursor-pointer overflow-hidden bg-stone-950">
                  {/* The dynamic video tag, fully equipped with strict auto-play attributes */}
                  <video src={vidSrc} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-white/30 backdrop-blur flex items-center justify-center text-white"><Play size={24} className="ml-1"/></div>
                  </div>
                  <div className="absolute bottom-10 left-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-amber-600 text-white text-[9px] uppercase font-bold tracking-widest px-2.5 py-1.5 rounded-md shadow-lg flex items-center gap-1.5"><Sparkles size={10}/> Featured Campaign</span>
                      <span className="text-amber-400 text-[10px] uppercase font-bold tracking-widest font-mono border border-amber-500/50 px-2.5 py-1.5 rounded-md bg-amber-500/10 backdrop-blur-sm">{promo.code}</span>
                    </div>
                    <h3 className="text-5xl md:text-6xl font-serif text-white mb-2 drop-shadow-lg">{promo.discountPercentage}% OFF</h3>
                    {promo.applicableCategories?.length > 0 && <p className="text-stone-300 text-xs tracking-widest uppercase font-bold">{promo.applicableCategories.join(' • ')}</p>}
                  </div>
                </div>
                
                <div className="w-full md:w-1/2 p-10 lg:p-16 bg-stone-900 flex flex-col justify-center min-h-[60vh] border-l border-stone-800">
                  <div className="mb-10">
                    <h4 className="text-white text-xs uppercase tracking-widest font-bold flex items-center gap-2 mb-2"><Star size={16} className="text-amber-500 fill-amber-500"/> Highest Rated Eligibility</h4>
                    <p className="text-stone-400 text-sm">Shop the top-tier selections valid for the {promo.code} exclusive offer.</p>
                  </div>
                  
                  <div className="space-y-6">
                    {campaignProducts.length > 0 ? campaignProducts.map((item, pIdx) => {
                      const displayImg = (item.mediaGallery || [])[0] || item.imageUrl;
                      return (
                      <Link href={`/product/${item._id}`} key={pIdx} className="flex items-center gap-6 group bg-stone-800/30 p-4 rounded-xl border border-stone-800 hover:border-stone-700 hover:bg-stone-800/60 transition">
                        <div className="w-20 h-24 bg-stone-950 rounded-lg overflow-hidden flex-shrink-0 shadow-inner">
                          {isVideo(displayImg) ? <video src={displayImg} className="w-full h-full object-cover" muted /> : <img src={displayImg} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />}
                        </div>
                        <div>
                          <p className="text-white font-serif text-lg group-hover:text-amber-400 transition">{item.name}</p>
                          <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold mt-1 mb-2">{item.category}</p>
                          <p className="text-amber-500 font-bold text-sm">₹{(item.price||0).toLocaleString('en-IN')}</p>
                        </div>
                      </Link>
                    )}) : <p className="text-stone-500 text-sm italic">Add matching products in the CRM to feature them here.</p>}
                  </div>
                </div>
              </section>
            );
          })()
        ) : (
          /* STATIC FALLBACK IF NO CAMPAIGNS EXIST */
          (() => {
            // Find highest rated product overall with a video
            const productsWithVideo = [...products].filter(p => (p.mediaGallery || []).some(url => isVideo(url)) || isVideo(p.imageUrl));
            productsWithVideo.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            
            let vidSrc = "https://cdn.coverr.co/videos/coverr-fashion-woman-walking-in-the-city-2741/1080p.mp4"; 
            if (productsWithVideo.length > 0) {
              const bestVideoProduct = productsWithVideo[0];
              const gallery = bestVideoProduct.mediaGallery || [];
              vidSrc = gallery.find(url => isVideo(url)) || bestVideoProduct.imageUrl;
            }

            return (
              <section className="w-full relative bg-stone-950 flex flex-col md:flex-row items-center border-t border-stone-900 overflow-hidden">
                <div className="w-full md:w-1/2 h-[60vh] relative group cursor-pointer bg-stone-950">
                  <video src={vidSrc} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-40 transition duration-700" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-white/30 backdrop-blur flex items-center justify-center text-white"><Play size={24} className="ml-1"/></div>
                  </div>
                  <div className="absolute bottom-8 left-8">
                    <p className="text-amber-500 text-[10px] uppercase font-bold tracking-widest mb-2">Campaign 01</p>
                    <h3 className="text-3xl font-serif text-white">The Summer Gala</h3>
                  </div>
                </div>
                <div className="w-full md:w-1/2 p-12 bg-stone-900 flex flex-col justify-center h-[60vh] border-l border-stone-800">
                  <h4 className="text-white text-xs uppercase tracking-widest font-bold mb-8 flex items-center gap-2"><ShoppingBag size={14}/> Shop the Look</h4>
                  <div className="space-y-6">
                    {lookbookFeatures.map((item, idx) => {
                      const displayImg = (item.mediaGallery || [])[0] || item.imageUrl;
                      return (
                      <Link href={`/product/${item._id}`} key={idx} className="flex items-center gap-6 group bg-stone-800/30 p-4 rounded-xl border border-stone-800 transition">
                        <div className="w-20 h-24 bg-stone-800 rounded-lg overflow-hidden flex-shrink-0">
                          {isVideo(displayImg) ? <video src={displayImg} className="w-full h-full object-cover" muted /> : <img src={displayImg} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />}
                        </div>
                        <div>
                          <p className="text-white font-serif text-lg group-hover:text-amber-500 transition">{item.name}</p>
                          <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold mt-1 mb-2">{item.category}</p>
                          <p className="text-amber-600 font-bold text-sm">₹{(item.price||0).toLocaleString('en-IN')}</p>
                        </div>
                      </Link>
                    )})}
                  </div>
                </div>
              </section>
            );
          })()
        )}
      </div>

      {/* MAIN CATALOG & PREDICTIVE SEARCH */}
      <section id="collection" className="max-w-7xl mx-auto px-8 py-24 w-full">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-stone-200 pb-8">
          <div>
            <h3 className="text-4xl font-serif mb-8 text-stone-800">The Archives</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => handleCategoryClick('All')} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition ${activeCategory === 'All' ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20' : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-400'}`}>All Designs</button>
              {categories.map(cat => <button key={cat._id} onClick={() => handleCategoryClick(cat.name)} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition ${activeCategory === cat.name ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20' : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-400'}`}>{cat.name}</button>)}
            </div>
          </div>
          
          <div className="w-full md:w-80 relative" ref={searchRef}>
            <input type="text" placeholder="Search fabrics, names..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} className="w-full p-4 pl-12 border border-stone-200 rounded-xl outline-none focus:border-amber-600 transition bg-white text-sm placeholder-stone-400 shadow-sm relative z-20" />
            <Search className="absolute left-4 top-4 text-stone-400 transition z-20" size={18} />
            
            <AnimatePresence>
              {isSearchFocused && searchQuery.length > 1 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-stone-200 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 text-[9px] font-bold uppercase tracking-widest text-stone-400 border-b border-stone-100">Spotlight Results</div>
                  {searchSuggestions.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {searchSuggestions.map(item => {
                        const displayImg = (item.mediaGallery || [])[0] || item.imageUrl;
                        return (
                        <Link href={`/product/${item._id}`} key={item._id} onClick={() => setIsSearchFocused(false)} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg transition group">
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-stone-900">
                             {isVideo(displayImg) ? <video src={displayImg} className="w-full h-full object-cover" muted /> : <img src={displayImg} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900 group-hover:text-amber-700">{item.name}</p>
                            <p className="text-[10px] text-stone-500">₹{(item.price||0).toLocaleString('en-IN')}</p>
                          </div>
                        </Link>
                      )})}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-stone-500">No matches found for "{searchQuery}"</div>
                  )}
                  <div className="bg-stone-50 p-3 text-[9px] uppercase tracking-widest font-bold text-center border-t border-stone-100 hover:text-amber-700 cursor-pointer transition">View All Results <ArrowRight size={10} className="inline ml-1"/></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          <AnimatePresence>
            {filteredProducts.map((product) => {
              const displayImg = (product.mediaGallery || [])[0] || product.imageUrl;
              return (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} key={product._id}>
                <Link href={`/product/${product._id}`} className="group block h-full">
                  <div className="relative h-[480px] w-full mb-5 bg-stone-100 overflow-hidden rounded-xl bg-stone-900">
                    {isVideo(displayImg) ? <video src={displayImg} className="h-full w-full object-cover" muted loop autoPlay playsInline /> : <img src={displayImg} className="h-full w-full object-cover transition duration-1000 group-hover:scale-110" />}
                    
                    <div className="absolute inset-0 bg-stone-900/20 opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                      <div className="w-full bg-white/95 backdrop-blur-md rounded-lg p-3 text-center translate-y-4 group-hover:translate-y-0 transition duration-300">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-900 flex items-center justify-center gap-2">View Full Details <ArrowRight size={12}/></p>
                      </div>
                    </div>

                    {product.stock <= 3 && <span className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm text-white text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded shadow-md flex items-center gap-1"><Flame size={10}/> Low Stock</span>}
                    {product.requiresTailoring && <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-stone-900 text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow-md">Bespoke</span>}
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-serif text-stone-900 mb-1 group-hover:text-amber-700 transition">{product.name}</h4>
                      <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-900">₹{(product.price||0).toLocaleString('en-IN')}</p>
                      {product.compareAtPrice && <p className="text-[10px] text-stone-400 line-through">₹{product.compareAtPrice.toLocaleString('en-IN')}</p>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )})}
          </AnimatePresence>
        </div>
      </section>

      {/* LUXURY FOOTER */}
      <footer className="w-full bg-stone-950 text-stone-400 pt-20 pb-10 border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-serif text-white tracking-widest uppercase mb-6">The Boutique</h2>
            <p className="text-sm leading-relaxed max-w-sm mb-8">Redefining ethnic luxury. Every piece is a dialogue between traditional craftsmanship and modern elegance, curated specifically for you.</p>
          </div>
          <div>
            <h4 className="text-white text-[10px] font-bold uppercase tracking-widest mb-6">Client Services</h4>
            <ul className="space-y-4 text-xs tracking-wide">
              <li><Link href="#" className="hover:text-amber-500 transition">Shipping & Returns</Link></li>
              <li><Link href="#lookbook" className="hover:text-amber-500 transition">Campaigns</Link></li>
              <li><Link href="/account" className="hover:text-amber-500 transition">My Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-[10px] font-bold uppercase tracking-widest mb-6">The Inner Circle</h4>
            <p className="text-xs mb-4 leading-relaxed">Subscribe to receive early access to new collections and exclusive promotional codes.</p>
            <form className="flex border-b border-stone-700 pb-2 focus-within:border-amber-600 transition">
              <input type="email" placeholder="Email Address" className="bg-transparent w-full outline-none text-sm text-white placeholder-stone-600" />
              <button type="submit" className="text-amber-600 hover:text-amber-400 font-bold uppercase tracking-widest text-[10px]">Join</button>
            </form>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 pt-8 border-t border-stone-900 text-[10px] uppercase tracking-widest font-bold flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 The Boutique. All rights reserved.</p>
          <div className="flex gap-6"><span>Razorpay Secured</span><span>Worldwide Shipping</span></div>
        </div>
      </footer>
    </main>
  );
}