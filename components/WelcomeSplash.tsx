import React from 'react';
import { createPortal } from 'react-dom';
import { useBranding } from '../contexts/BrandingContext';
import { useShop } from '../contexts/ShopContext';

const STORAGE_KEY = 'ci_welcome_v1';

const WelcomeSplash: React.FC<{ forceShow?: boolean }> = ({ forceShow }) => {
  const { branding } = useBranding();
  const { companyInfo } = useShop();
  let urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  // If using HashRouter the query may live in the hash (e.g. #/?welcome=1)
  if (typeof window !== 'undefined' && !urlParams.has('welcome') && window.location.hash) {
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx !== -1) {
      urlParams = new URLSearchParams(hash.slice(qIdx + 1));
    }
  }
  const requested = forceShow || ['1', 'true'].includes((urlParams.get('welcome') || '').toLowerCase());
  const [visible, setVisible] = React.useState(() => {
    try {
      if (requested) return true;
      return !localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return true;
    }
  });

  // Animation trigger: mounted toggles the animated classes so we get fade+scale
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(id);
  }, [visible]);

  // Lock body scroll while splash visible to avoid underlying interactions on mobile
  React.useEffect(() => {
    if (!visible) return;
    const prev = typeof document !== 'undefined' ? document.body.style.overflow : undefined;
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    return () => { try { if (typeof document !== 'undefined') document.body.style.overflow = prev ?? ''; } catch (e) {} };
  }, [visible]);

  // Close splash when the user interacts with the page (first touch/click outside splash)
  React.useEffect(() => {
    if (!visible) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      // if click/touch occurred inside the splash panel, ignore
  if (target.closest && target.closest('.welcome-panel')) return;
      // If user interacts with main content, product card, add-to-cart buttons or links, consider that "comenzar a comprar"
      const shouldClose = !!(target.closest && (
        target.closest('main') ||
        target.closest('.product-card') ||
        target.closest('.add-to-cart') ||
        target.closest('button.add-to-cart') ||
        target.closest('a')
      ));
      if (shouldClose) {
        setVisible(false);
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch (err) {}
      }
    };
    document.addEventListener('pointerdown', handler, { capture: true });
    return () => document.removeEventListener('pointerdown', handler, { capture: true });
  }, [visible]);

  React.useEffect(() => {
    if (!visible) return;
    // If device is touch-capable, don't auto-close so users can dismiss manually on mobile
    const isTouch = typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator && (navigator as any).maxTouchPoints > 0));
    let timer: any = null;
    const AUTO_CLOSE_MS = 7000; // longer so it doesn't feel fugaz
    if (!isTouch) {
      timer = setTimeout(() => {
        setVisible(false);
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
      }, AUTO_CLOSE_MS);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [visible]);

  if (!visible) return null;

  const title = companyInfo?.name || 'Comercializadora Ibarra';
  const tagline = 'Productos genuinos. Precios que alegran.';
  const isTouch = typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator && (navigator as any).maxTouchPoints > 0));

  const node = (
    <div aria-live="polite" style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, touchAction: 'manipulation', pointerEvents: 'auto' }}>
      {/* Backdrop: clicking closes splash */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2147483647, pointerEvents: 'auto' }} onClick={() => { setVisible(false); try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {} }} />

      {/* Modal panel */}
  <div role="dialog" aria-modal="true" style={{ zIndex: 2147483648 }} className={`pointer-events-auto w-full ${isTouch ? 'max-w-lg' : 'max-w-md'} mx-auto bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden welcome-panel transform transition-all duration-500 ease-out ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="flex items-center gap-4 p-4">
          <div className="flex-shrink-0 h-14 w-14 rounded-lg bg-white flex items-center justify-center ring-1 ring-gray-100">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt={`${title} logo`} className={`h-12 w-auto object-contain ${mounted ? 'animate-pulse-slow' : ''}`} />
            ) : (
              <div className={`h-10 w-10 rounded bg-[var(--color-primary)] flex items-center justify-center text-white font-semibold ${mounted ? 'animate-pulse-slow' : ''}`}>
                {title.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-500">Hola 👋</p>
            <h2 className="text-lg font-semibold text-[var(--color-text)] leading-tight">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{tagline}</p>
          </div>

          <button aria-label="Cerrar bienvenida" onClick={() => { setVisible(false); try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {} }} className="ml-2 text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 pb-5">
          <div className="flex">
            <button onClick={() => {
                try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
                setVisible(false);
                // scroll to products section if present
                const el = document.querySelector('#products');
                if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }} className="w-full inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-base font-medium text-white shadow-sm hover:opacity-90">
              Comenzar a comprar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
};

export default WelcomeSplash;
