import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { useShop } from '../contexts/ShopContext';
import { CheckCircleIcon } from './Icons';
// Use a plain <img> for basic image rendering to simplify diagnostics

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product.variants[0]?.id || '');
  const [added, setAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const { addToCart } = useShop();

  const selectedVariant = useMemo(() => {
    return product.variants.find(v => v.id === selectedVariantId);
  }, [product.variants, selectedVariantId]);

  const handleAddToCart = (qty = 1) => {
    if (selectedVariant) {
      addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        variantName: selectedVariant.name,
        price: selectedVariant.price,
          imageUrl: product.image_url,
          description: product.description || '',
      }, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg w-full mx-auto max-w-4xl">
      <div className="flex flex-col md:flex-row">
  {/* Image column */}
  <div className="md:w-1/2 lg:w-1/3 p-4 md:p-6">
          {(() => {
            const w = 900; const h = 1200;
            const placeholder = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><rect width='100%' height='100%' fill='#f3f4f6'/><g fill='#9ca3af' font-family='Arial, Helvetica, sans-serif' font-size='20'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'>Imagen</text></g></svg>`)}`;
            const src = product.image_url || placeholder;

            return (
              <div className="product-image relative h-36 sm:h-44 md:h-64 w-full" role="group" aria-labelledby={`product-title-${product.id}`}>
                <img
                  src={src}
                  loading="lazy"
                  decoding="async"
                  alt={product.name}
                  className={`h-full w-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (img.src !== placeholder) img.src = placeholder; setImageLoaded(true); }}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 animate-pulse rounded bg-gray-200" />
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Details column */}
        <div className="md:w-1/2 lg:w-2/3 p-6 flex flex-col justify-between">
          <div>
            <h3 id={`product-title-${product.id}`} className="text-2xl font-bold text-gray-900">{product.name}</h3>
            <p className="mt-2 text-gray-600 max-w-xl">{product.description}</p>

            <div className="mt-4">
              <p className="price">${selectedVariant?.price.toFixed(2)} <span className="text-base font-medium text-gray-500">MXN</span></p>
            </div>

            {product.variants.length > 0 && (
              <div className="mt-5">
                <div className="text-sm font-medium text-gray-700 mb-2">Selecciona una presentación:</div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(variant => {
                    const isSel = variant.id === selectedVariantId;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariantId(variant.id)}
                        aria-pressed={isSel}
                        className={`variant-btn px-3 py-2 rounded-md border text-sm ${isSel ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-white text-gray-700 border-gray-200'}`}
                      >
                        {variant.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-4">
              <div className="flex items-center border rounded-full px-3 py-1">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="qty-btn px-3">−</button>
                <div className="px-4 font-medium" aria-live="polite">{quantity}</div>
                <button onClick={() => setQuantity(quantity + 1)} className="qty-btn px-3">+</button>
              </div>
            </div>
          </div>

          <div className="mt-6">
              <button
                onClick={() => handleAddToCart(quantity)}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className={`add-to-cart w-full inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-medium transition-colors duration-200 ${!selectedVariant || selectedVariant.stock === 0 ? 'bg-gray-400 cursor-not-allowed text-white' : added ? 'bg-green-500 text-white' : ''}`}
              >
                {added ? (<><CheckCircleIcon /><span className="ml-2">Agregado</span></>) : selectedVariant?.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;