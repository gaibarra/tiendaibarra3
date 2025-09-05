
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import CartDrawer from './components/CartDrawer';
import ProductList from './components/ProductList';
import CartView from './components/CartView';
import AdminPanel from './components/AdminPanel';
import ThemeInjector from './components/ThemeInjector';
import WelcomeSplash from './components/WelcomeSplash';
import { useShop } from './contexts/ShopContext';
import { useBranding } from './contexts/BrandingContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Logout from './components/Logout';

function GlobalError() {
    const { error: shopError } = useShop();
    const { error: brandingError } = useBranding();
    const error = shopError || brandingError;

    if (!error) return null;

    return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 container mx-auto my-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
        </div>
    );
}


function App() {
  const [cartOpen, setCartOpen] = React.useState(false);
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      if (cartOpen) document.body.classList.add('cart-open');
      else document.body.classList.remove('cart-open');
    }
    return () => {
      if (typeof document !== 'undefined') document.body.classList.remove('cart-open');
    };
  }, [cartOpen]);
  return (
    <>
      <ThemeInjector />
  <WelcomeSplash />
  <div className="min-h-screen font-sans pb-20">
        <Header onOpenCart={() => setCartOpen(true)} />
        <main className="container mx-auto p-4 md:p-8">
          <GlobalError />
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/cart" element={<CartView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            {/* Fallback: cualquier otra ruta vuelve a inicio */}
            <Route path="*" element={<ProductList />} />
          </Routes>
        </main>
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

export default App;