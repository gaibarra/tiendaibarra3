import React, { useState } from 'react';
import ProductAdmin from './ProductAdmin';
import BrandingAdmin from './BrandingAdmin';
import CompanyInfoAdmin from './CompanyInfoAdmin';
import OrdersAdmin from './OrdersAdmin';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';
import { getContrastColor } from '../utils/colors';

type AdminTab = 'products' | 'branding' | 'company' | 'orders';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { branding } = useBranding();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductAdmin />;
      case 'branding':
        return <BrandingAdmin />;
      case 'company':
        return <CompanyInfoAdmin />;
      case 'orders':
        return <OrdersAdmin />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ tabName: AdminTab; label: string }> = ({ tabName, label }) => {
    const isActive = activeTab === tabName;
    const primaryButtonTextColor = getContrastColor(branding.primary_color);

    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-[var(--color-primary)]'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
        style={isActive ? { color: primaryButtonTextColor } : {}}
      >
        {label}
      </button>
    )
  };

  return (
    <div className="bg-[var(--color-secondary)] rounded-lg shadow-lg p-6 md:p-8">
      {!user ? (
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold text-red-600 mb-4">Acceso denegado</h2>
          <p className="mb-4 text-gray-700">Debes iniciar sesión para acceder al Panel de Administración.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90"
            >
              Ir a Login
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Seguir Comprando
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">Panel de Administración</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user.email}</span>
              <button
                onClick={async () => { await signOut(); navigate('/login'); }}
                className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-2" aria-label="Tabs">
              <TabButton tabName="products" label="Productos" />
              <TabButton tabName="orders" label="Pedidos" />
              <TabButton tabName="branding" label="Marca" />
              <TabButton tabName="company" label="Empresa" />
            </nav>
          </div>
          <div>{renderTabContent()}</div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;