import React from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';

export default function TipsPage() {
  const [city] = useLocalStorage<string>('customerCity', 'Mexicali', { namespace: 'tiendaibarra3' });
  const [sector] = useLocalStorage<string>('customerSector', 'Restaurantes', { namespace: 'tiendaibarra3' });
  // Sin tip inicial por defecto: empieza vacío
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [text, setText] = React.useState('');

  const ask = async () => {
    setLoading(true);
    setText('');
    try {
  const base = (globalThis as any)?.__TIPS_API_BASE__ || '';
  const r = await fetch(base + '/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, city, sector }),
      });
      const ct = r.headers.get('content-type') || '';
      let data: any = null;
      if (ct.includes('application/json')) {
        try { data = await r.json(); } catch (e) { /* parsing failed */ }
      } else {
        const txt = await r.text();
        setText(`Respuesta inesperada del servidor (content-type: ${ct}):\n${txt.slice(0,400)}`);
        return;
      }
      if (!r.ok) {
        const msg = data?.error || r.statusText || 'Error desconocido';
        setText(`Error (${r.status}): ${msg}`);
      } else if (data?.ok) {
        setText(data.tips);
      } else {
        setText('No fue posible obtener tips ahora.');
      }
    } catch (e: any) {
      setText(`Error de red: ${e?.message || 'sin detalles'}`);
    } finally {
      setLoading(false);
    }
  };

  // Ya no llamamos ask() en el montaje para evitar mostrar un tip por defecto
  // React.useEffect(() => { ask(); }, []);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="p-4 pb-20 md:pb-0 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Tips de limpieza</h1>
      <p className="text-gray-600 mb-4">Optimizado para {city} — Sector: {sector}</p>

      <div className="flex gap-2 items-center mb-4">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 pr-10"
            placeholder="Escribe tu problema o pregunta"
          />
          {q && (
            <button
              type="button"
              onClick={() => { setQ(''); inputRef.current?.focus(); }}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={() => {
            if (!q.trim()) { setText('Escribe tu consulta para generar recomendaciones.'); return; }
            ask();
          }}
          className="px-4 py-3 rounded-xl bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Procesando…' : 'Buscar'}
        </button>
      </div>

      <article className="prose max-w-none whitespace-pre-wrap min-h-[120px] relative">
        {loading ? (
          <div className="flex flex-col items-start gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <span className="inline-block h-6 w-6 rounded-full border-2 border-[var(--brand-primary,#0B3B6E)] border-t-transparent animate-spin" aria-label="cargando"></span>
              <span className="font-medium tracking-wide">
                Generando recomendaciones inteligentes
                <span className="inline-flex w-8 overflow-hidden relative align-baseline">
                  <span className="animate-pulse [animation-delay:0ms]">.</span>
                  <span className="animate-pulse [animation-delay:150ms]">.</span>
                  <span className="animate-pulse [animation-delay:300ms]">.</span>
                </span>
              </span>
            </div>
            <div className="w-full max-w-md h-2 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-[pulse_1.8s_ease-in-out_infinite]"></div>
            <div className="grid gap-2 w-full max-w-xl">
              <div className="h-3 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 rounded bg-gray-200 animate-pulse w-5/6" />
              <div className="h-3 rounded bg-gray-200 animate-pulse w-2/3" />
            </div>
          </div>
        ) : (
          (text || 'Escribe una consulta arriba para generar tips personalizados.')
        )}
      </article>
    </div>
  );
}
