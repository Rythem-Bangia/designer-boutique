"use client";
import { useCart } from '../CartContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Tag, ChevronDown, ShoppingBag } from 'lucide-react'; // FIXED: Imported ShoppingBag
import toast from 'react-hot-toast';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, cartSubtotal, cartTotal, discountAmount, promoCode, availablePromos, applyPromoCode } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full md:w-[450px] bg-white h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white">
              <h2 className="text-2xl font-serif text-stone-900">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-stone-900 transition p-2 hover:bg-stone-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4"><div className="w-16 h-16 rounded-full border border-stone-200 flex items-center justify-center"><ShoppingBag size={24} className="opacity-50"/></div><p className="text-sm font-serif">Your cart is beautifully empty.</p></div>
              ) : (
                <AnimatePresence>
                  {cart.map((item, index) => (
                    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={index} className="flex gap-4 border-b border-stone-100 pb-6 group">
                      <div className="flex-1">
                        <h4 className="font-serif text-lg text-stone-900 mb-1">{item.name}</h4>
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-sm text-stone-900 font-bold">₹{(item.price||0).toLocaleString('en-IN')}</p>
                          {item.compareAtPrice && <p className="text-xs text-stone-400 line-through">₹{item.compareAtPrice.toLocaleString('en-IN')}</p>}
                        </div>
                        {item.requiresTailoring ? ( <div className="text-[10px] text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200"><p className="font-bold text-stone-700 mb-1 uppercase tracking-widest">Bespoke Measurements:</p>C: {item.measurements.chest}" | W: {item.measurements.waist}" | L: {item.measurements.length}"</div> ) : ( <p className="text-xs text-stone-500 font-bold uppercase tracking-widest bg-stone-100 w-fit px-2 py-1 rounded">Size: {item.size}</p> )}
                      </div>
                      <button onClick={() => removeFromCart(index)} className="text-stone-300 hover:text-red-500 transition h-fit p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 border-t border-stone-100 bg-stone-50/50 space-y-4">
                
                {availablePromos && availablePromos.length > 0 && (
                  <div className="relative">
                    <select value={promoCode || ''} onChange={(e) => applyPromoCode(e.target.value)} className="w-full p-3 pl-10 border border-stone-300 rounded-xl outline-none focus:border-amber-700 text-xs uppercase tracking-widest font-bold bg-white appearance-none cursor-pointer">
                      <option value="">Apply Promotional Code...</option>
                      {availablePromos.map(p => <option key={p.code} value={p.code}>{p.code} • {p.discountPercentage}% OFF</option>)}
                    </select>
                    <Tag size={14} className="absolute left-4 top-3.5 text-stone-400"/>
                    <ChevronDown size={14} className="absolute right-4 top-3.5 text-stone-400 pointer-events-none"/>
                  </div>
                )}

                <div className="space-y-2 border-b border-stone-200 pb-4 pt-2">
                  <div className="flex justify-between items-center text-xs text-stone-500 font-bold uppercase tracking-widest"><span>Subtotal</span><span>₹{cartSubtotal.toLocaleString('en-IN')}</span></div>
                  {discountAmount > 0 && <div className="flex justify-between items-center text-xs text-green-600 font-bold uppercase tracking-widest"><span>Discount ({promoCode})</span><span>- ₹{discountAmount.toLocaleString('en-IN')}</span></div>}
                </div>

                <div className="flex justify-between items-center pt-2 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Estimated Total</span>
                  <span className="text-3xl font-serif text-stone-900">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <Link href="/checkout" onClick={() => setIsCartOpen(false)}>
                  <button className="w-full bg-stone-900 text-white py-5 rounded-xl hover:bg-stone-800 transition tracking-[0.2em] uppercase text-xs font-bold shadow-xl shadow-stone-900/20">Proceed to Checkout</button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}