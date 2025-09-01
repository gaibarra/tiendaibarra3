
import React, { useState } from 'react';
import { useShop } from '../contexts/ShopContext';
import { Link } from 'react-router-dom';
import OrderPreviewModal from './OrderPreviewModal';
import { TrashIcon } from './Icons';

const CartView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { cart, updateCartQuantity, removeFromCart, cartTotal } = useShop();
  const [isPreviewing, setIsPreviewing] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">Tu Carrito</h1>
      
      {cart.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-gray-500 mb-4">Tu carrito está vacío.</p>
          <Link to="/" className="text-base font-medium text-white bg-[var(--color-primary)] hover:opacity-90 px-6 py-3 rounded-md shadow-sm">
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flow-root">
            <ul className="-my-6 divide-y divide-gray-200">
              {cart.map((item) => (
                <li key={`${item.productId}-${item.variantId}`} className="flex py-6">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover object-center" />
                  </div>

                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>{item.name}</h3>
                        <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{item.variantName}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center">
                        <label htmlFor={`quantity-${item.productId}-${item.variantId}`} className="sr-only">Cantidad</label>
                        <input
                          id={`quantity-${item.productId}-${item.variantId}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartQuantity(item.productId, item.variantId, parseInt(e.target.value))}
                          className="w-20 rounded-md border-gray-300 py-1.5 text-center text-base focus:border-[var(--color-primary)] focus:outline-none focus:ring-[var(--color-primary)] sm:text-sm"
                        />
                      </div>

                      <div className="flex">
                        <button type="button" onClick={() => removeFromCart(item.productId, item.variantId)} className="font-medium text-[var(--color-accent)] hover:opacity-80">
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6">
            <div className="flex justify-between text-lg font-medium text-gray-900">
              <p>Subtotal</p>
              <p>${cartTotal.toFixed(2)}</p>
            </div>
            <p className="mt-1 text-sm text-gray-500">El pago se realiza al momento de la entrega.</p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/"
                onClick={() => {
                  setIsPreviewing(false);
                  if (onClose) onClose();
                }}
                className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Seguir comprando
              </Link>
              <button
                onClick={() => setIsPreviewing(true)}
                className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-[var(--color-primary)] px-6 py-3 text-base font-medium text-white shadow-sm hover:opacity-90"
              >
                Generar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewing && (
        <OrderPreviewModal onClose={() => setIsPreviewing(false)} />
      )}
    </div>
  );
};

export default CartView;