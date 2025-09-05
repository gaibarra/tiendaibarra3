// src/components/HeaderBar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../contexts/ShopContext';
import { UserCircleIcon } from './Icons';

type Props = {
  /** Abre el drawer del carrito */
  onCartClick: () => void;
  /** Muestra el botón "Buscar" (default: true) */
  showSearch?: boolean;
  /** Activa atajos: B = buscar, C = carrito (default: true) */
  hotkeys?: boolean;
};

const BRAND_PRIMARY = 'var(--brand-primary, #0B3B6E)'; // azul marino
const BRAND_ACCENT  = 'var(--brand-accent,  #18B9C2)'; // turquesa

export default function HeaderBar({ onCartClick, showSearch = true, hotkeys = true }: Props) {
  const nav = useNavigate();
  const { cart, companyInfo } = useShop() as any;

  const count = React.useMemo(
    () => (cart ?? []).reduce((s: number, it: any) => s + Number(it?.quantity || 0), 0),
    [cart]
  );

  // Atajos de teclado: B=Buscar, C=Carrito
  React.useEffect(() => {
    if (!hotkeys) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  if (e.key.toLowerCase() === 'b' && showSearch) nav('/');
      if (e.key.toLowerCase() === 'c') onCartClick();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkeys, showSearch, nav, onCartClick]);

  return (
    <header
      role="banner"
      className="fixed top-0 inset-x-0 z-40 border-b shadow-sm"
      style={{ background: BRAND_PRIMARY, borderColor: 'rgba(255,255,255,0.15)' }}
    >
      <div className="h-16 max-w-6xl mx-auto px-4 flex items-center justify-between">
        {/* Marca */}
        <button
          onClick={() => nav('/')}
          className="group flex items-center gap-3 focus:outline-none"
          title="Inicio"
        >
          <img
            src="/logo-ibarra.png"
            alt="Ibarra Productos de Limpieza"
            className="h-10 w-10 object-contain rounded"
            loading="eager"
            draggable={false}
          />
          <div className="text-left leading-tight">
            <div className="text-white font-extrabold text-lg tracking-tight group-hover:opacity-95">
              {companyInfo?.name || 'IBARRA'}
            </div>
            <div className="text-white/85 text-[11px] tracking-wide uppercase">
              {/* Productos de Limpieza */}
            </div>
          </div>
        </button>

        {/* Acciones (solo iconos) */}
        <div className="flex items-center gap-3">
          {/* Tips (bombilla) */}
          <button
            onClick={() => nav('/tips')}
            className="relative flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-white/70"
            style={{ background: 'rgba(255,255,255,0.12)', color: BRAND_ACCENT }}
            aria-label="Tips de limpieza"
            title="Tips de limpieza"
          >
            <span className="text-xl leading-none">💡</span>
          </button>
          {/* Carrito */}
            <button
              onClick={onCartClick}
              className="relative flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-white/70"
              style={{ background: BRAND_ACCENT, color: '#fff' }}
              aria-label={`Abrir carrito, ${count} artículo${count === 1 ? '' : 's'} (C)`}
              title="Carrito (C)"
            >
              <span className="text-lg">🛒</span>
              <span
                aria-hidden
                className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center shadow"
                style={{ background: '#fff', color: 'var(--brand-primary, #0B3B6E)' }}
              >
                {count}
              </span>
            </button>
          {/* Admin */}
          <button
            onClick={() => nav('/admin')}
            className="flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-white/70 border border-white/20"
            style={{ background: 'rgba(255,255,255,0.08)', color: BRAND_ACCENT }}
            aria-label="Panel de administración"
            title="Panel de administración"
          >
            <UserCircleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
