import React, { useState } from 'react';
import { useShop } from '../contexts/ShopContext';
import { Link } from 'react-router-dom';
import OrderPreviewModal from './OrderPreviewModal';
import { TrashIcon } from './Icons';
import { useBranding } from '../contexts/BrandingContext';
import { getContrastColor } from '../utils/colors';

const CartView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { cart, updateCartQuantity, removeFromCart, cartTotal } = useShop();
  const { branding } = useBranding();
  const [isPreviewing, setIsPreviewing] = useState(false);

  const primaryButtonTextColor = getContrastColor(branding.primary_color);

  return (
    <div 
      className="rounded-lg shadow-lg p-6 md:p-8"
      style={{ backgroundColor: branding.secondary_color || 'white' }}
    >
      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">Tu Carrito</h1>
      
      {cart.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-gray-500 mb-4">Tu carrito está vacío.</p>
          <Link 
            to="/" 
            className="text-base font-medium bg-[var(--color-primary)] hover:opacity-90 px-6 py-3 rounded-md shadow-sm"
            style={{ color: primaryButtonTextColor }}
          >
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
                      <div className="flex justify-between text-base font-medium text-[var(--color-text)]">
                        <h3>{item.name}</h3>
                        <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{item.variantName}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center select-none" aria-label="Modificar cantidad">
                        <button
                          type="button"
                          aria-label="Disminuir"
                          onClick={() => updateCartQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))}
                          className="h-8 w-8 flex items-center justify-center rounded-l-md border border-gray-300 bg-white text-lg leading-none hover:bg-gray-50 active:scale-95"
                        >
                          −
                        </button>
                        <label htmlFor={`quantity-${item.productId}-${item.variantId}`} className="sr-only">Cantidad</label>
                        <input
                          id={`quantity-${item.productId}-${item.variantId}`}
                          inputMode="numeric"
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value);
                            if (!isNaN(quantity) && quantity >= 1) {
                              updateCartQuantity(item.productId, item.variantId, quantity);
                            }
                          }}
                          className="h-8 w-16 border-t border-b border-gray-300 text-center text-base focus:border-[var(--color-primary)] focus:outline-none focus:ring-[var(--color-primary)] sm:text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          aria-label="Aumentar"
                          onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center rounded-r-md border border-gray-300 bg-white text-lg leading-none hover:bg-gray-50 active:scale-95"
                        >
                          +
                        </button>
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
            <div className="flex justify-between text-lg font-medium text-[var(--color-text)]">
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
                className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-[var(--color-primary)] px-6 py-3 text-base font-medium shadow-sm hover:opacity-90"
                style={{ color: primaryButtonTextColor }}
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
