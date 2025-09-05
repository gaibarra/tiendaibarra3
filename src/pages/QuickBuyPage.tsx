import React from 'react';
import QuickSearch, { SearchProduct } from '../../components/search/QuickSearch';
import { supabase } from '../../services/supabaseClient';
import { useShop } from '../../contexts/ShopContext';

type VariantRow = { id: string; name?: string | null; price: number; product_id: string };

export default function QuickBuyPage() {
  const { products, addToCart, loading } = useShop() as any;

  const searchable: SearchProduct[] = React.useMemo(
    () =>
      (products ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        image_url: p.image_url ?? null,
      })),
    [products]
  );

  const [variantMap, setVariantMap] = React.useState<Record<string, VariantRow[]>>({});

  React.useEffect(() => {
    const load = async () => {
      if (!products?.length) return;
      const ids = (products as any[]).map(p => p.id);
      const { data, error } = await supabase
        .from('product_variants')
        .select('id,name,price,product_id')
        .in('product_id', ids)
        .order('price', { ascending: true });
      if (error) { console.error('prefetch variants error', error); return; }
      
      const map: Record<string, VariantRow[]> = {};
      for (const row of (data ?? []) as VariantRow[]) {
        if (!map[row.product_id]) {
          map[row.product_id] = [];
        }
        map[row.product_id].push(row);
      }
      setVariantMap(map);
    };
    load();
  }, [products]);

  const onQuickAdd = async (
    product: {
      productId: string;
      name: string;
      description?: string;
      imageUrl?: string;
      variantId: string;
    },
    qty: number
  ) => {
    const variants = variantMap[product.productId] || [];
    const v = variants.find(variant => variant.id === product.variantId);

    if (!v) { alert('Este producto aún no tiene variantes configuradas.'); return; }
    addToCart(
      {
        productId: product.productId,
        variantId: v.id,
        name: product.name,
        variantName: v.name ?? 'Std',
        price: Number(v.price) || 0,
        imageUrl: product.imageUrl,
        description: product.description || '',
      },
      qty
    );
  };

  if (loading && (!products || !products.length)) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
        <div className="h-10 w-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" aria-label="Cargando" />
        <p className="text-sm text-gray-500">Cargando catálogo...</p>
      </div>
    );
  }

  if (!loading && (!products || products.length === 0)) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        No hay productos disponibles por el momento.
      </div>
    );
  }

  return (
    <React.Fragment key={`qs-${products?.length || 0}`}>
      <QuickSearch products={searchable} onQuickAdd={onQuickAdd} variants={variantMap} />
    </React.Fragment>
  );
}
