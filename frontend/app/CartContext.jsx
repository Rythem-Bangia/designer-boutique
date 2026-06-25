"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCustomer } from './CustomerContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { customer } = useCustomer();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [availablePromos, setAvailablePromos] = useState([]); 
  const [discountAmount, setDiscountAmount] = useState(0); 
  const [promoCode, setPromoCode] = useState(''); 
  const [shippingFee, setShippingFee] = useState(0);

  const currentCartKey = customer ? `boutique_cart_${customer._id}` : 'boutique_cart_guest';

  useEffect(() => {
    // BUG FIX: Safe localStorage access
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem(currentCartKey);
      if (savedCart) {
        try { setCart(JSON.parse(savedCart)); } catch(e) { setCart([]); }
      } else {
        setCart([]); 
      }
    }
    setDiscountAmount(0);
    setPromoCode('');
    setIsLoaded(true);

    fetch('http://localhost:8080/api/storefront/promos/active')
      .then(res => res.json())
      .then(data => setAvailablePromos(data))
      .catch(() => {});
  }, [customer, currentCartKey]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(currentCartKey, JSON.stringify(cart));
      if (promoCode && cart.length > 0) applyPromoCode(promoCode, true);
      else if (cart.length === 0) { setDiscountAmount(0); setPromoCode(''); }
    }
  }, [cart, isLoaded, currentCartKey]);

  const addToCart = (item) => setCart((prev) => [...prev, item]);
  const removeFromCart = (index) => { setCart((prev) => prev.filter((_, i) => i !== index)); toast.success('Item removed'); };
  const clearCart = () => { 
    setCart([]); setDiscountAmount(0); setPromoCode(''); setShippingFee(0); 
    if (typeof window !== 'undefined') localStorage.removeItem(currentCartKey); 
  };

  const cartSubtotal = cart.reduce((total, item) => total + (item.price || 0), 0);

  const applyPromoCode = async (codeStr, isSilent = false) => {
    if (!codeStr) { setDiscountAmount(0); setPromoCode(''); return; }
    try {
      const payload = { code: codeStr, cart: cart, customerEmail: customer?.email };
      const res = await fetch('http://localhost:8080/api/storefront/promos/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setDiscountAmount(data.discountAmount); setPromoCode(data.promoCode);
        if(!isSilent) toast.success(`₹${data.discountAmount.toLocaleString('en-IN')} Saved!`);
      } else {
        if(!isSilent) toast.error(data.error);
        setDiscountAmount(0); setPromoCode('');
      }
    } catch (err) { if(!isSilent) toast.error('Validation failure'); }
  };

  // BUG FIX: Prevent negative cart totals 
  const cartTotal = Math.max(0, (Number(cartSubtotal) || 0) - (Number(discountAmount) || 0)) + (Number(shippingFee) || 0);

  return (
    <CartContext.Provider value={{ cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, clearCart, cartSubtotal, discountAmount, promoCode, cartTotal, shippingFee, setShippingFee, availablePromos, applyPromoCode }}>
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);