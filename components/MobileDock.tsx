import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const items = [
  { key: 'catalogo', label: 'Catálogo', to: '/' },
  { key: 'carrito', label: 'Carrito', to: '/cart' },
  { key: 'pedidos', label: 'Pedidos', to: '/orders' },
];

export default function MobileDock() {
  const nav = useNavigate();
  const loc = useLocation();

  return (
  <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t shadow-lg grid grid-cols-3 z-40 md:hidden">
      {items.map(it => {
        const active = loc.pathname === it.to;
        return (
          <button
            key={it.key}
            onClick={() => nav(it.to)}
            className={`text-sm font-medium ${active ? 'text-black' : 'text-gray-500'}`}
          >
            <div className="pt-2">{it.label}</div>
          </button>
        );
      })}
    </nav>
  );
}
