// src/components/WelcomeModal.tsx
import React, { useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useBranding } from '../contexts/BrandingContext';
import { getContrastColor } from '../utils/colors';

const SECTORS = ['Restaurantes','Hospitales','Talleres Mecánicos','Hoteles','Oficinas','Escuelas'];
const CITIES = ['Mexicali', 'San Luis Río Colorado'];
const WELCOME_VERSION = 'v3'; // 👈 cambia la versión para re-mostrar

type Props = {
  onStart: () => void;
  showTips?: boolean;
  onTips?: () => void;
  forceOpen?: boolean;
};

export default function WelcomeModal({ onStart, showTips = false, onTips, forceOpen }: Props) {
  const [seen, setSeen] = useLocalStorage<boolean>(`seenWelcome_${WELCOME_VERSION}`, false, {
    ttl: 1000 * 60 * 60 * 24 * 30,
    namespace: 'tiendaibarra3',
  });
  const [city, setCity] = useLocalStorage<string>('customerCity', CITIES[0], { namespace: 'tiendaibarra3' });
  const [sector, setSector] = useLocalStorage<string>('customerSector', SECTORS[0], { namespace: 'tiendaibarra3' });
  const { branding } = useBranding();

  const primaryText = getContrastColor(branding.primary_color);

  const [closing, setClosing] = useState(false);
  // Estado interno que controla si el modal se muestra (independiente de "seen")
  const [show, setShow] = useState<boolean>(() => forceOpen || !seen);
  if (!show && !forceOpen) return null;

  const go = (type: 'start' | 'tips') => {
    if (closing) return;
    // Marcar visto y navegar primero para que la pantalla de destino cargue mientras animamos salida
    setSeen(true);
    if (type === 'start') {
      onStart();
      // fallback for some hash routing edge where React Router doesn’t trigger immediately
      if (!window.location.hash || window.location.hash === '#/' ) {
        setTimeout(() => {
          if (document.getElementById('root')?.children.length === 0) {
            window.location.hash = '#/';
          }
        }, 60);
      }
      // Watchdog: si después de 900ms sigue vacío, recarga UNA sola vez
      setTimeout(() => {
        const root = document.getElementById('root');
        const alreadyTried = (window as any).__IBARRA_BOOT_RETRIED__;
        if (root && root.children.length === 0 && !alreadyTried) {
          (window as any).__IBARRA_BOOT_RETRIED__ = true;
          console.warn('[WelcomeModal] Forzando recarga por pantalla en blanco inicial');
          window.location.reload();
        }
      }, 900);
    } else {
      onTips?.();
    }
    // Iniciar animación de salida
    setClosing(true);
    setTimeout(() => {
      setShow(false);
      setClosing(false);
    }, 300);
  };

  // Animación de entrada
  const [visible, setVisible] = useState(false); // visible => animación de entrada
  useEffect(() => {
    const r = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(r);
  }, []);

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 md:bg-black/40 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
  className={`w-full h-full md:h-auto md:max-w-xl bg-[var(--color-secondary)] md:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 md:my-8 overflow-y-auto transform transition-all duration-300 ease-out will-change-transform will-change-opacity
  ${visible && !closing ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        style={{
          backgroundColor: branding.secondary_color,
        }}
      >
        <header className="mb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] mb-1">Bienvenido</h1>
          <p className="text-sm text-gray-600">Personaliza tu experiencia antes de comenzar.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Ciudad</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/30 transition"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/30 transition"
              >
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => go('start')}
            disabled={closing}
            className="w-full py-3 rounded-md font-semibold shadow-md hover:shadow-lg transition bg-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: primaryText }}
          >
            {closing ? 'Entrando...' : 'Comenzar a comprar'}
          </button>
          {showTips && (
            <button
              onClick={() => go('tips')}
              disabled={closing}
              className="w-full py-3 rounded-md font-semibold border border-[var(--color-primary)]/60 text-[var(--color-primary)] bg-white hover:bg-[var(--color-primary)]/5 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: branding.primary_color }}
            >
              {closing ? 'Cerrando...' : 'Tips de limpieza'}
            </button>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-gray-500 mt-6">
          Guardamos estas preferencias localmente para ofrecer resultados y recomendaciones más relevantes. Puedes cambiarlas cuando quieras.
        </p>
      </div>
    </div>
  );
}
