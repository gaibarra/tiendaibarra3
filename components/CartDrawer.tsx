import React from 'react';
import CartView from './CartView';

const CartDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  return (
    <div aria-hidden={!open} className={`fixed inset-0 z-50 transition-opacity ${open ? 'visible' : 'pointer-events-none'} `}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <aside className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full overflow-auto p-6">
          <button onClick={onClose} className="mb-4 text-sm text-gray-600">Cerrar</button>
          <CartView onClose={onClose} />
        </div>
      </aside>
    </div>
  );
};

export default CartDrawer;
