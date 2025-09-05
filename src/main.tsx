// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
// Variables y utilidades de marca (restaura colores y estilos base)
import './styles/brand.css';
import { ShopProvider } from '../contexts/ShopContext';
import { BrandingProvider } from '../contexts/BrandingContext';
import { AuthProvider } from '../contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element to mount to');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HashRouter>
      <BrandingProvider>
        <AuthProvider>
          <ShopProvider>
            <App />
          </ShopProvider>
        </AuthProvider>
      </BrandingProvider>
    </HashRouter>
  </React.StrictMode>
);
