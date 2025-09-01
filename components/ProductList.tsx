import React from 'react';
import { useShop } from '../contexts/ShopContext';
import ProductCard from './ProductCard';

// Small helper to debounce
function debounce(fn: (...args: any[]) => void, wait = 200) {
  let t: any;
  return (...args: any[]) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

const ProductList: React.FC = () => {
  const { products, loading } = useShop();
  const { searchQuery } = useShop();

  const { setSearchQuery } = useShop();
  const [localQ, setLocalQ] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // compute header height and set CSS var so sticky top works
  React.useEffect(() => {
    const compute = () => {
      const header = document.querySelector('header');
      const h = header ? header.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty('--header-height', `${Math.ceil(h)}px`);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const updateSuggestions = React.useCallback(debounce((q: string) => {
    if (!q) { setSuggestions([]); setShowSuggestions(false); return; }
    const ql = q.trim().toLowerCase();
    const matched = products
      .map(p => p.name || '')
      .filter(n => n.toLowerCase().includes(ql))
      .slice(0, 8);
    setSuggestions(matched);
    setShowSuggestions(matched.length > 0);
  }, 120), [products]);

  if (loading) {
    return (
        <div className="text-center py-16">
            <p className="text-lg text-gray-500">Cargando productos...</p>
        </div>
    );
  }

  return (
    <div>
      {/* Title moved to header for a more compact layout; keep an accessible H1 for screen readers */}
      <h1 className="sr-only">Comercializadora Ibarra - Productos</h1>
      <div className="mb-4" ref={containerRef} style={{ position: 'sticky', top: 'var(--header-height, 56px)', zIndex: 70 }}>
        <div className="relative">
          <input
            type="search"
            aria-label="Buscar productos"
            value={localQ}
            onChange={(e) => {
              const v = e.target.value;
              setLocalQ(v);
              updateSuggestions(v);
              if ((window as any).__productSearchDebounce) clearTimeout((window as any).__productSearchDebounce);
              (window as any).__productSearchDebounce = setTimeout(() => setSearchQuery(v), 250);
            }}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Buscar productos..."
            className="header-search w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 bg-white border border-gray-200 mt-1 rounded-md shadow z-50 max-h-52 overflow-auto">
              {suggestions.map((s, idx) => (
                <li key={s + idx} className="px-3 py-2 hover:bg-gray-50 cursor-pointer" onMouseDown={() => { setLocalQ(s); setSearchQuery(s); setShowSuggestions(false); }}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
            {products.length === 0 ? (
              <p className="text-gray-500">No hay productos disponibles. Agrega algunos en el panel de administración.</p>
            ) : (
              <div className="grid grid-cols-1 gap-y-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6">
          {products
            .filter(p => {
              if (!searchQuery) return true;
              const q = searchQuery.trim().toLowerCase();
              return (p.name && p.name.toLowerCase().includes(q)) || (p.description && p.description.toLowerCase().includes(q));
            })
            .map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
