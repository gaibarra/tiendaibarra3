import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from '../components/Login';
import HeaderBar from '../components/HeaderBar';
import ReactDOM from 'react-dom'; // aseguramos compat
const AdminPanelLazy = React.lazy(() => import('../components/AdminPanel'));
import CartDrawer from '../components/CartDrawer'; // tu componente
import WelcomeModal from '../components/WelcomeModal';
import QuickBuyPage from '@/pages/QuickBuyPage';
import TipsPage from '@/pages/TipsPage';

export default function App() {
  const nav = useNavigate();
  const { search } = useLocation();
  const params = React.useMemo(() => new URLSearchParams(search), [search]);
  const forceWelcome = params.get('welcome') === '1';
  React.useEffect(() => {
    console.debug('[App] mounted path:', window.location.hash, 'search:', search);
  }, [search]);

  // 👇 estado del Drawer
  const [cartOpen, setCartOpen] = React.useState(false);

  return (
    <>
      <HeaderBar onCartClick={() => setCartOpen(true)} />

      <WelcomeModal
        onStart={() => {
          console.debug('[WelcomeModal] onStart clicked');
          nav('/');
        }}
        showTips={true}
        onTips={() => nav('/tips')}
        forceOpen={forceWelcome}
      />

      {/* espacio para el header fijo */}
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<QuickBuyPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<React.Suspense fallback={<div className="p-6 text-center text-gray-600">Cargando panel...</div>}><AdminPanelLazy /></React.Suspense>} />
          <Route path="/tips" element={<TipsPage />} />
          {/* Fallback opcional para rutas desconocidas: vuelve al inicio */}
          <Route path="*" element={<QuickBuyPage />} />
        </Routes>
      </div>

      {/* Drawer del carrito */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
