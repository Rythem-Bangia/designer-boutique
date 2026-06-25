"use client";
import { useState, useEffect } from 'react';
import { useCart } from '../CartContext';
import Link from 'next/link';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Load Razorpay Script Dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-8 text-center font-sans animate-fade-in">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-green-200">✓</div>
        <h1 className="text-4xl font-serif text-stone-900 mb-2">Payment Successful</h1>
        <p className="text-stone-500 mb-2 max-w-md">Your transaction <span className="font-mono text-xs bg-stone-200 px-2 py-1 rounded">{transactionId}</span> is complete.</p>
        <p className="text-stone-500 mb-8 max-w-md">Your order has been securely routed to our tailoring and fulfillment team.</p>
        <Link href="/"><button className="px-8 py-3 bg-stone-900 text-white rounded hover:bg-stone-800 transition tracking-widest uppercase text-sm">Return to Boutique</button></Link>
      </div>
    );
  }

  if (cart.length === 0) return <div className="min-h-screen flex items-center justify-center bg-stone-50 font-sans"><p>Your cart is empty. <Link href="/" className="underline text-amber-700">Go shopping.</Link></p></div>;

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Create order on backend
      const orderRes = await fetch('http://localhost:8080/api/storefront/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cartTotal })
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        alert('Failed to initialize payment.');
        setIsProcessing(false);
        return;
      }

      // 2. Open Official Razorpay Popup
      const options = {
        key: 'rzp_test_T2yNsUJMBL7AGw', 
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'The Designer Boutique',
        description: 'Premium Ethnic Wear Purchase',
        order_id: orderData.order.id,
        handler: async function (response) {
          // 3. Verify Payment with Backend
          const verifyRes = await fetch('http://localhost:8080/api/storefront/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: {
                customerName: form.name, email: form.email, phone: form.phone, address: form.address,
                items: cart, totalAmount: cartTotal
              }
            })
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setTransactionId(response.razorpay_payment_id);
            clearCart();
            setIsSuccess(true);
          } else {
            alert('Payment verification failed!');
          }
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#1c1917' } // stone-900 color to match your theme
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert("Payment Failed: " + response.error.description);
        setIsProcessing(false);
      });
      rzp.open();
      setIsProcessing(false);

    } catch (err) {
      console.error(err);
      alert('Error connecting to payment gateway.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans py-12 px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <h1 className="text-3xl font-serif text-stone-900 mb-8">Secure Checkout</h1>
          <form onSubmit={handlePayment} className="space-y-6 bg-white p-8 shadow-sm border border-stone-200">
            <h2 className="text-lg font-bold border-b pb-2 text-stone-800">1. Shipping Information</h2>
            <div><label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label><input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full p-3 border rounded outline-none focus:border-amber-700" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Email</label><input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full p-3 border rounded outline-none focus:border-amber-700" /></div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Phone</label><input type="tel" required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full p-3 border rounded outline-none focus:border-amber-700" /></div>
            </div>
            <div><label className="block text-sm font-medium text-stone-700 mb-1">Delivery Address</label><textarea required rows="3" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full p-3 border rounded outline-none focus:border-amber-700"></textarea></div>
            
            <div className="pt-6 border-t border-stone-200 mt-6">
              <button type="submit" disabled={isProcessing} className="w-full bg-stone-900 text-white py-4 hover:bg-stone-800 transition tracking-widest uppercase shadow-md font-medium disabled:opacity-50">
                {isProcessing ? 'Loading Gateway...' : `Pay ₹${cartTotal.toLocaleString('en-IN')}`}
              </button>
              <div className="mt-4 flex justify-center items-center gap-4 text-xs text-stone-400">
                <span>✓ UPI</span><span>✓ Cards</span><span>✓ NetBanking</span>
              </div>
            </div>
          </form>
        </div>

        <div className="bg-stone-100 p-8 rounded border border-stone-200 h-fit">
          <h2 className="text-lg font-bold border-b border-stone-300 pb-2 mb-6 text-stone-800">Order Summary ({cart.length} items)</h2>
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between border-b border-stone-200 pb-4">
                <div>
                  <p className="font-medium text-stone-900">{item.name}</p>
                  <p className="text-xs text-stone-500 mt-1">{item.requiresTailoring ? 'Custom Tailored' : `Size: ${item.size}`}</p>
                </div>
                <p className="font-semibold text-amber-800">₹{item.price.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-xl border-t border-stone-300 pt-4">
            <span className="font-serif">Total</span>
            <span className="font-bold text-stone-900">₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}