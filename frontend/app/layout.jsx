import './globals.css';
import { CartProvider } from './CartContext';
import { CustomerProvider } from './CustomerContext';
import CartDrawer from './components/CartDrawer';
import { Toaster } from 'react-hot-toast';

export const metadata = { title: 'The Designer Boutique', description: 'Premium Ethnic Wear' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CustomerProvider>
          <CartProvider>
            <Toaster position="top-center" toastOptions={{ style: { background: '#1c1917', color: '#fff', borderRadius: '0px', fontSize: '14px', letterSpacing: '0.05em' } }} />
            {children}
            <CartDrawer />
          </CartProvider>
        </CustomerProvider>
      </body>
    </html>
  );
}