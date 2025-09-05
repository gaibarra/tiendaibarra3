import React from 'react';
import { useShop } from '../../contexts/ShopContext';
import Fuse from 'fuse.js';
import useLocalStorage from '../../hooks/useLocalStorage';

export type SearchProduct = {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
};

type Variant = { id: string; name?: string | null; price: number; product_id: string };

type Props = {
  products: SearchProduct[];
  variants: Record<string, Variant[]>;
  onQuickAdd: (
    product: {
      productId: string;
      name: string;
      description?: string;
      imageUrl?: string;
      variantId: string;
    },
    qty: number
  ) => void | Promise<void>;
};

const SECTOR_SUGGESTIONS: Record<string, string[]> = {
  'Restaurantes': ['detergente', 'platos', 'desengrasante', 'multiusos', 'cloro'],
  'Hospitales': ['sanitizante', 'jabón', 'cloro', 'multiusos', 'papel'],
  'Talleres Mecánicos': ['desengrasante',  'multiusos', 'cloro'],
  'Hoteles': ['suavizante', 'detergente', 'papel', 'multiusos', 'cloro'],
  'Oficinas': ['microfibra','manos', 'sanitizante', 'multiusos', 'cloro'],
  'Escuelas': ['cloro', 'manos', 'sanitizante', 'multiusos', 'papel'],
};

export default function QuickSearch({ products, onQuickAdd, variants }: Props) {
  const { cart } = useShop() as any;
  const [city] = useLocalStorage<string>('customerCity', 'Mexicali', { namespace: 'tiendaibarra3' });
  const [sector] = useLocalStorage<string>('customerSector', 'Restaurantes', { namespace: 'tiendaibarra3' });
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [results, setResults] = React.useState<SearchProduct[]>([]);
  const [qtyById, setQtyById] = React.useState<Record<string, number>>({}); // cantidad por tarjeta
  const [selectedVariantId, setSelectedVariantId] = React.useState<Record<string, string>>({});
  const [expandedDesc, setExpandedDesc] = React.useState<Record<string, boolean>>({});
  const [initialSuggestions, setInitialSuggestions] = React.useState<SearchProduct[]>([]);

  const fuse = React.useMemo(
    () =>
      new Fuse(products || [], {
        includeScore: true,
        threshold: 0.38,
        keys: ['name', 'description'],
      }),
    [products]
  );

  // Sugerencias iniciales aleatorias (dos) para que no aparezca vacío
  React.useEffect(() => {
    if (!initialSuggestions.length && products && products.length) {
      const notInCart = products.filter(p => !cart?.some((c: any) => c.productId === p.id));
      const pool = notInCart.length ? notInCart : products; // fallback si todos están en carrito
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, Math.min(2, shuffled.length));
      setInitialSuggestions(picked);
      if (!q) setResults(picked);
    }
  }, [initialSuggestions.length, products, q, cart]);

  // Auto focus al montar (primer render) para interacción inmediata
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!q) {
      setResults(initialSuggestions);
      return;
    }
    const parsed = parseQtyQuery(q);
    const res = fuse.search(parsed.query)
      .map(r => r.item)
      .filter(item => !cart?.some((c: any) => c.productId === item.id))
      .slice(0, 12);
    setResults(res);
  }, [q, fuse, initialSuggestions, cart]);

  const suggestions = SECTOR_SUGGESTIONS[sector] || [];

  const setQty = (id: string, next: number) => {
    const v = Math.max(1, Math.min(99, Number.isFinite(next) ? next : 1));
    setQtyById((m) => ({ ...m, [id]: v }));
  };
  const inc = (id: string) => setQty(id, (qtyById[id] || 1) + 1);
  const dec = (id: string) => setQty(id, (qtyById[id] || 1) - 1);

  const add = (p: SearchProduct, explicitQty?: number) => {
    const parsed = parseQtyQuery(q);
    const qty = Math.max(1, explicitQty ?? qtyById[p.id] ?? parsed.qty ?? 1);
    const productVariants = variants[p.id] || [];
    const variantId = selectedVariantId[p.id] || productVariants[0]?.id;

    if (!variantId) {
      alert('Este producto no tiene presentaciones disponibles.');
      return;
    }

    onQuickAdd(
      {
        productId: p.id,
        name: p.name,
        description: p.description ?? undefined,
        imageUrl: p.image_url ?? undefined,
        variantId: variantId,
      },
      qty
    );
    // limpiar input y resetear cantidad de esa tarjeta
    setQ('');
    setQtyById((m) => ({ ...m, [p.id]: 1 }));
  };

  return (
    <div className="p-4 pb-20 md:pb-4">
      <h2 className="text-xl font-semibold mb-2">Buscar y añadir rápido</h2>

      {/* Buscador */}
      <div className="relative">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Ej. "cloro" `}
          className="w-full border rounded-xl px-4 py-3 pr-10 text-base"
          autoFocus
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

      {/* Chips por sector */}
      <div className="flex gap-2 mt-3 overflow-x-auto">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => setQ(s)}
            className="px-3 py-1 rounded-full text-sm whitespace-nowrap border"
            style={{ background: 'rgba(24,185,194,0.12)', borderColor: 'var(--brand-accent, #18B9C2)', color: 'var(--brand-ink, #0B3B6E)' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Resultados */}
      <div className="mt-4 grid grid-cols-1 gap-3">
        {results.map(item => {
          const qty = qtyById[item.id] ?? parseQtyQuery(q).qty ?? 1;
          const productVariants = variants[item.id] || [];
          return (
            <div key={item.id} className="border rounded-xl p-3 flex flex-col gap-3">
              <div className="flex items-start gap-3 flex-wrap">
                {/* Izquierda: miniatura + textos */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-12 w-12 rounded-md object-cover shadow"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">🧴</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="grid gap-1" style={{gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))'}}>
                      <div className="font-medium leading-snug break-words whitespace-normal col-span-full">
                        {item.name}
                      </div>
                      {item.description ? (() => {
                        const full = item.description;
                        const short = shortenDescription(full, 140);
                        const truncated = short.endsWith('…') && full.length > short.length;
                        const isExpanded = !!expandedDesc[item.id];
                        const display = isExpanded ? full : short;
                        return (
                          <div className="col-span-full">
                            <div className={`text-xs text-gray-500 mt-0.5 whitespace-normal qs-desc ${isExpanded ? 'expanded' : ''}`} style={isExpanded ? { maxHeight: 'none' } : undefined}>
                              {display}
                            </div>
                            {truncated && (
                              <button
                                type="button"
                                onClick={() => setExpandedDesc(m => ({ ...m, [item.id]: !isExpanded }))}
                                className="mt-0.5 text-[11px] font-medium text-[var(--brand-primary,#0B3B6E)] underline focus:outline-none"
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? 'ver menos' : 'ver más'}
                              </button>
                            )}
                          </div>
                        );
                      })() : null}
                    </div>
                  </div>
                </div>

                {/* Controles: en mobile saltan a segunda línea para dar más ancho al nombre */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto sm:ml-2 mt-2 sm:mt-0">
                  <div className="flex items-center border rounded-xl overflow-hidden">
                    <button
                      onClick={() => dec(item.id)}
                      className="px-2 py-1 text-base"
                      aria-label="disminuir"
                    >
                      –
                    </button>
                    <input
                      value={qty}
                      onChange={(e) => setQty(item.id, parseInt(e.target.value || '1', 10))}
                      className="w-9 text-center py-1 outline-none"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <button
                      onClick={() => inc(item.id)}
                      className="px-2 py-1 text-base"
                      aria-label="aumentar"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => add(item, qty)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'var(--brand-primary, #0B3B6E)', color: 'white' }}
                  >
                    Añadir
                  </button>
                </div>
              </div>
              {productVariants.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Presentación:</label>
                  <select 
                    value={selectedVariantId[item.id] || productVariants[0]?.id}
                    onChange={e => setSelectedVariantId(prev => ({...prev, [item.id]: e.target.value}))}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    {productVariants.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} (${v.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function parseQtyQuery(query: string): { query: string; qty?: number } {
  const m = query.match(/(.+?)\s*(?:x|\*)\s*(\d{1,3})$/i);
  if (m) return { query: m[1].trim(), qty: parseInt(m[2], 10) };
  return { query };
}

function shortenDescription(text: string, max: number): string {
  if (text.length <= max) return text;
  // corta en el último espacio antes del límite para no partir palabras
  const slice = text.slice(0, max - 1);
  const idx = slice.lastIndexOf(' ');
  return (idx > 40 ? slice.slice(0, idx) : slice).trimEnd() + '…';
}