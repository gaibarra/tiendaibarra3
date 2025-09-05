import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';
import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';
import { UserCircleIcon, HomeIcon } from './Icons';
import AdminAccessMenu from './AdminAccessMenu';
// Note: we use a native <img> here for the header to keep a simple, reliable fallback

const Header: React.FC<{ onOpenCart?: () => void }> = ({ onOpenCart }) => {
  const { branding, refreshBranding } = useBranding();
  const { cart, companyInfo, setSearchQuery } = useShop();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const activeLinkStyle = {
    color: 'var(--color-primary)',
    textDecoration: 'underline',
  };

  const [logoValid, setLogoValid] = useState<boolean>(false);
  const [checkingLogo, setCheckingLogo] = useState<boolean>(false);
  const [logoLoaded, setLogoLoaded] = useState<boolean>(false);

  const checkLogo = useCallback((url?: string) => {
    if (!url) {
      setLogoValid(false);
      return;
    }
    setCheckingLogo(true);
    const img = new Image();
    img.onload = () => {
      setLogoValid(true);
      setCheckingLogo(false);
    };
    img.onerror = () => {
      setLogoValid(false);
      setCheckingLogo(false);
    };
    // start load
    img.src = url;
  }, []);

  useEffect(() => {
    checkLogo(branding?.logo_url);
  }, [branding?.logo_url, checkLogo]);

  return (
  <header className="shadow-sm bg-[var(--color-secondary)] sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-5 lg:px-8">
    <div className="flex items-center justify-between h-30">
          {/* Left: logo + name */}
          <div className="flex items-center gap-4">
            <NavLink to="/" className="flex items-center gap-3">
              <div className="flex-shrink-0 flex items-center">
                {/* Use background-image technique to avoid broken-image icon; test URL before applying */}
                {branding?.logo_url && logoValid ? (
                  <div className="flex items-center" style={{ maxWidth: 180 }}>
                    {/* Inline placeholder SVG shown until the image finishes loading to avoid layout shift */}
                    {!logoLoaded && (
                      <div className="h-12 sm:h-14 md:h-16 w-auto flex items-center justify-center" aria-hidden="true">
                        <svg className="h-full w-auto" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img">
                          <rect x="0" y="0" width="100" height="100" rx="12" fill="#f3f4f6" />
                          <text x="50" y="58" fontSize="40" textAnchor="middle" fill="var(--color-primary)" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700">IB</text>
                        </svg>
                      </div>
                    )}
                    <img
                      src={branding.logo_url}
                      alt={companyInfo?.name || 'Logo'}
                      loading="lazy"
                      onLoad={() => { setLogoValid(true); setLogoLoaded(true); }}
                      onError={() => { setLogoValid(false); setLogoLoaded(false); }}
                      className={`h-12 sm:h-14 md:h-16 w-auto object-contain transition-opacity duration-200 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                      style={{ maxWidth: 180 }}
                    />
                  </div>
                ) : (
                  <div className="h-20 w-80 flex items-center justify-center bg-transparent">
                    <div className="h-14 w-14 flex items-center justify-center rounded bg-transparent ring-1 ring-[rgba(0,0,0,0.06)]">
                      <span className="text-sm font-bold text-[var(--color-primary)]">
                        {((companyInfo?.name || 'IB').split(' ').map(s => s[0]).join('').slice(0,2)).toUpperCase()}
                      </span>
                    </div>
                    {/* small refresh link when no valid logo to allow admin to refresh */}
                    <button
                      onClick={async () => { await refreshBranding(); checkLogo(branding?.logo_url); }}
                      className="ml-3 text-xs text-[var(--color-primary)] underline hidden sm:block"
                      style={{ alignSelf: 'center' }}
                      aria-label="Actualizar logo"
                    >
                      {checkingLogo ? 'Comprobando...' : 'Actualizar logo'}
                    </button>
                  </div>
                )}
              </div>
              {companyInfo && (
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="font-semibold text-lg text-[var(--color-text)]">{companyInfo.name}</span>
                  <span className="text-xs text-gray-500 hidden md:block">{companyInfo.address}</span>
                </div>
              )}
              {/* Site title visible on all sizes; on mobile it will be centered in the header */}
              <div className="ml-3">
                <span className="hidden md:inline-block text-lg font-medium text-[var(--color-text)]">Comercializadora Ibarra - Productos</span>
                <span className="md:hidden text-sm font-medium text-[var(--color-text)] block text-center">Comercializadora Ibarra - Productos</span>
              </div>
            </NavLink>
          </div>
          

          {/* Center: nav links (desktop) */}
          <nav className="hidden md:flex md:space-x-8 md:items-center">
            <NavLink to="/" className="text-base font-medium text-gray-600 hover:text-[var(--color-primary)]" style={({ isActive }) => isActive ? activeLinkStyle : {}}>
              Tienda
            </NavLink>
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSearchQuery(''); if (onOpenCart) onOpenCart(); }}
              className="relative p-2 text-gray-600 hover:text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded"
              aria-label="Abrir carrito"
            >
              {/* Supermarket cart icon (inline SVG) */}
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 3h2l.4 2M7 13h10l3-7H6.4" />
                <circle cx="10" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M7 13l-1-5" opacity="0" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-medium text-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-gray-700">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1 text-sm font-medium text-[var(--color-primary)] hover:bg-blue-50 rounded-md"
                >
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav - bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-secondary)] border-t border-gray-200 flex justify-around p-2">
        <NavLink to="/" className="flex flex-col items-center text-gray-600" style={({ isActive }) => isActive ? { color: 'var(--color-primary)' } : {}}>
          <HomeIcon className="h-6 w-6" />
          <span className="text-xs">Tienda</span>
        </NavLink>
  <button onClick={() => { setSearchQuery(''); if (onOpenCart) onOpenCart(); }} className="relative flex flex-col items-center text-gray-600" aria-label="Abrir carrito">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 3h2l.4 2M7 13h10l3-7H6.4" />
            <circle cx="10" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
          </svg>
          <span className="text-xs">Carrito</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 right-6 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-medium text-white">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;