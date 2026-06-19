"use client";
import { useState, useEffect } from 'react';
import { useCart } from '../CartContext';
import { useCustomer } from '../CustomerContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle, Tag, Truck, ShieldCheck, MapPin, CreditCard, Banknote, Gift, Ticket, Sparkles } from 'lucide-react';

export default function Checkout() {
  const { cart, cartSubtotal, cartTotal, discountAmount, promoCode, clearCart, shippingFee, setShippingFee, availablePromos, applyPromoCode } = useCart();
  const { customer } = useCustomer();
  const [form, setForm] = useState({ name: customer?.name || '', email: customer?.email || '', phone: customer?.phone || '', address: customer?.address || '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  useEffect(() => { setShippingFee(0); }, []);
  const getDeliveryDate = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }); };
  useEffect(() => { const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true; document.body.appendChild(script); }, []);

  if (isSuccess) return ( <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] p-8 text-center font-sans animate-fade-in"><CheckCircle size={64} className="text-green-600 mb-6" strokeWidth={1} /><h1 className="text-4xl font-serif text-stone-900 mb-2">Order Confirmed</h1><p className="text-stone-500 mb-2 max-w-md text-sm">Receipt ID: <span className="font-mono text-xs bg-stone-200 px-2 py-1 rounded">{transactionId}</span></p><p className="text-stone-500 mb-10 max-w-md text-sm">Your bespoke creation is processing.</p><Link href="/"><button className="px-10 py-4 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition uppercase text-xs font-bold tracking-widest shadow-xl shadow-stone-900/20">Return</button></Link></div> );
  if (cart.length === 0) return <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] font-sans"><p className="text-stone-500 font-serif text-xl">Your cart is empty. <Link href="/" className="underline text-amber-700">Return to boutique.</Link></p></div>;

  const handlePayment = async (e) => {
    e.preventDefault(); setIsProcessing(true); const loadingToast = toast.loading('Initializing checkout secure state...');
    if (paymentMethod === 'cod') {
      try {
        const orderRes = await fetch('http://localhost:8080/api/storefront/create-cod-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderData: { customerName: form.name, email: form.email, phone: form.phone, address: form.address, items: cart, totalAmount: cartTotal } }) });
        const orderData = await orderRes.json();
        if (orderData.success) { toast.success('Order Placed!', { id: loadingToast }); setTransactionId('COD-' + orderData.orderId.slice(-6).toUpperCase()); clearCart(); setIsSuccess(true); } else { toast.error('Failed to place order.', { id: loadingToast }); }
      } catch (err) { toast.error('Server error', { id: loadingToast }); }
      setIsProcessing(false); return;
    }
    try {
      const orderRes = await fetch('http://localhost:8080/api/storefront/create-razorpay-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: cartTotal }) });
      const orderData = await orderRes.json();
      if (!orderData.success) { toast.error('Gateway Error.', { id: loadingToast }); setIsProcessing(false); return; }
      toast.dismiss(loadingToast);
      const options = {
        key: 'rzp_test_T2yNsUJMBL7AGw', amount: orderData.order.amount, currency: 'INR', name: 'The Designer Boutique', description: 'Premium Ethnic Wear', order_id: orderData.order.id,
        handler: async function (response) {
          const verifyingToast = toast.loading('Verifying transaction...');
          const verifyRes = await fetch('http://localhost:8080/api/storefront/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, orderData: { customerName: form.name, email: form.email, phone: form.phone, address: form.address, items: cart, totalAmount: cartTotal } }) });
          const verifyData = await verifyRes.json();
          if (verifyData.success) { toast.success('Payment verified!', { id: verifyingToast }); setTransactionId(response.razorpay_payment_id); clearCart(); setIsSuccess(true); } else { toast.error('Cryptographic signature failed!', { id: verifyingToast }); }
        }, prefill: { name: form.name, email: form.email, contact: form.phone }, theme: { color: '#1c1917' } 
      };
      const rzp = new window.Razorpay(options); rzp.on('payment.failed', function (response) { toast.error("Transaction Failed"); setIsProcessing(false); }); rzp.open(); setIsProcessing(false);
    } catch (err) { toast.error('Error connecting to bank.', { id: loadingToast }); setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans py-16 px-8">
      <Link href="/" className="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition mb-10 block max-w-6xl mx-auto">← Return to Archives</Link>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16">
        <div className="lg:col-span-3">
          <h1 className="text-4xl font-serif text-stone-900 mb-10">Checkout</h1>
          <form onSubmit={handlePayment} className="space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-stone-200">
            <div><h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-stone-100 pb-3 text-stone-400 mb-6 flex items-center gap-2"><MapPin size={14}/> Destination</h2><div className="space-y-4"><div><label className="block text-[10px] font-bold text-stone-500 mb-2 uppercase tracking-widest">Full Name</label><input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full p-4 border border-stone-200 rounded-xl outline-none focus:border-amber-700 bg-stone-50/50 transition" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] font-bold text-stone-500 mb-2 uppercase tracking-widest">Email</label><input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full p-4 border border-stone-200 rounded-xl outline-none focus:border-amber-700 bg-stone-50/50 transition" /></div><div><label className="block text-[10px] font-bold text-stone-500 mb-2 uppercase tracking-widest">Phone</label><input type="tel" required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full p-4 border border-stone-200 rounded-xl outline-none focus:border-amber-700 bg-stone-50/50 transition" /></div></div><div><label className="block text-[10px] font-bold text-stone-500 mb-2 uppercase tracking-widest">Full Address</label><textarea required rows="3" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full p-4 border border-stone-200 rounded-xl outline-none focus:border-amber-700 bg-stone-50/50 transition"></textarea></div></div></div>
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-stone-100 pb-3 text-stone-400 mb-6 flex items-center gap-2"><CreditCard size={14}/> Payment Method</h2>
              <div className="space-y-3">
                <label className={`block border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-amber-700 bg-amber-50/30 ring-1 ring-amber-700' : 'border-stone-200 hover:border-stone-300'}`}><div className="flex justify-between items-center"><div className="flex items-center gap-3"><input type="radio" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="accent-amber-700 w-4 h-4" /><div><p className="text-sm font-bold text-stone-900">Credit Card / UPI / Netbanking</p><p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">Secured by Razorpay</p></div></div><CreditCard size={20} className="text-stone-400"/></div></label>
                <label className={`block border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-amber-700 bg-amber-50/30 ring-1 ring-amber-700' : 'border-stone-200 hover:border-stone-300'}`}><div className="flex justify-between items-center"><div className="flex items-center gap-3"><input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-amber-700 w-4 h-4" /><div><p className="text-sm font-bold text-stone-900">Cash on Delivery (COD)</p><p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">Pay when your order arrives</p></div></div><Banknote size={20} className="text-stone-400"/></div></label>
              </div>
            </div>
            <div className="pt-8 border-t border-stone-100"><button type="submit" disabled={isProcessing} className="w-full bg-stone-900 text-white py-5 rounded-xl hover:bg-stone-800 transition tracking-[0.2em] uppercase text-xs font-bold shadow-xl shadow-stone-900/20 disabled:opacity-50">{isProcessing ? 'Processing...' : paymentMethod === 'cod' ? 'Confirm Order' : `Pay ₹${cartTotal.toLocaleString('en-IN')}`}</button></div>
          </form>
        </div>
        
        {/* RIGHT COL: OVERHAULED PREMIUM PROMO CARD VIEW */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-stone-200 sticky top-10 max-h-[85vh] overflow-y-auto shadow-sm space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-stone-100 pb-3 text-stone-400">Order Summary</h2>
            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-start border-b border-stone-100 pb-4 text-sm">
                  <div><p className="font-medium text-stone-900">{item.name}</p></div>
                  <p className="font-serif font-bold text-stone-900">₹{(item.price || 0).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>

            {/* HIGH-END APPLIED PROMOTIONS PANEL UI */}
            {availablePromos && availablePromos.length > 0 && (
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4">
                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.2em] flex items-center gap-1.5"><Ticket size={12} className="text-amber-700"/> Luxury Atelier Promotions</p>
                
                <div className="grid grid-cols-1 gap-2">
                  {availablePromos.map(promo => {
                    const isSelected = promoCode === promo.code;
                    return (
                      <button type="button" key={promo._id} onClick={() => applyPromoCode(isSelected ? '' : promo.code)} className={`w-full text-left p-4 border rounded-xl flex items-center justify-between transition relative overflow-hidden bg-white ${isSelected ? 'border-amber-700 bg-amber-50/10 ring-1 ring-amber-700' : 'border-dashed border-stone-300 hover:border-stone-400'}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-stone-900 tracking-wider text-sm uppercase">{promo.code}</span>
                            {isSelected && <span className="bg-amber-700 text-white text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5"><Sparkles size={8}/> Applied</span>}
                          </div>
                          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1">{promo.discountPercentage}% OFF Eligible Items</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className={`text-xs font-bold uppercase tracking-widest ${isSelected ? 'text-amber-700' : 'text-stone-400'}`}>{isSelected ? 'Remove' : 'Apply'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4 border-t border-stone-200 pt-6">
              <div className="flex justify-between items-center text-xs text-stone-500 font-bold uppercase tracking-widest"><span>Subtotal</span><span>₹{cartSubtotal.toLocaleString('en-IN')}</span></div>
              {discountAmount > 0 && <div className="flex justify-between items-center text-xs text-green-600 font-bold uppercase tracking-widest"><span className="flex items-center gap-1"><Tag size={12}/> Promotion Applied</span><span>- ₹{discountAmount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between items-center text-xs text-stone-500 font-bold uppercase tracking-widest"><span>Shipping</span><span>Free</span></div>
            </div>

            <div className="flex justify-between items-end text-xl border-t border-stone-200 pt-6"><span className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Total</span><span className="font-serif text-3xl text-stone-900">₹{cartTotal.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}