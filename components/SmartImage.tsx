import React, { useState } from 'react';

interface SmartImageProps {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  srcSet?: string;
  sizes?: string;
  style?: React.CSSProperties;
}

const makePlaceholder = (w = 600, h = 600, text = 'Imagen') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
      <rect width='100%' height='100%' fill='#e5e7eb'/>
      <g fill='#9ca3af' font-family='Arial, Helvetica, sans-serif' font-size='24'>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'>${text}</text>
      </g>
    </svg>
  `)}`;

// Given a source like '/images/foo.jpg' or 'https://cdn/.../foo.jpg',
// build a srcSet using the convention: base-<w>.webp (e.g. foo-300.webp, foo-600.webp)
const buildSrcSetFromSrc = (src: string | undefined | null) => {
  if (!src || src.includes('supabase.co')) return undefined;
  const widths = [300, 600, 1200];
  // strip query string for base construction but keep it to append later
  const [withoutQuery, query] = src.split('?');
  const idx = withoutQuery.lastIndexOf('.');
  if (idx === -1) return undefined;
  const base = withoutQuery.slice(0, idx);
  // produce entries like `${base}-${w}.webp${query ? `?${query}` : ''} ${w}w`
  return widths.map((w) => `${base}-${w}.webp${query ? `?${query}` : ''} ${w}w`).join(', ');
};

const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt = '',
  width,
  height,
  className = '',
  srcSet,
  sizes,
  style,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [triedAlt, setTriedAlt] = useState(false);
  const [triedStrip, setTriedStrip] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const placeholder = makePlaceholder(width ?? 600, height ?? 600);
  const computedSrcSet = srcSet ?? buildSrcSetFromSrc(src);
  // Debug: surface the src/srcSet in console to help locate broken URLs
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[SmartImage] src:', src, 'computedSrcSet:', computedSrcSet, 'sizes:', sizes);
  }
  const finalSrc = !src || errored ? placeholder : src;
  const finalSizes = sizes ?? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <div style={{ position: 'relative' }}>
      <img
        key={reloadKey}
        src={finalSrc}
        alt={alt}
        loading="lazy"
  decoding="async"
        width={width}
        height={height}
        srcSet={computedSrcSet}
        sizes={finalSizes}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ display: 'block', width: '100%', height: '100%', maxWidth: '100%', objectFit: 'cover', ...style }}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          const cur = img.src || '';
          // Try rewriting Supabase storage URL to include '/public/' when missing
          try {
            if (!triedAlt && cur.includes('/storage/v1/object/') && !cur.includes('/storage/v1/object/public/')) {
              const alt = cur.replace('/storage/v1/object/', '/storage/v1/object/public/');
              if (process.env.NODE_ENV !== 'production') console.warn('[SmartImage] attempting alt Supabase public URL:', alt);
              setTriedAlt(true);
              img.src = alt;
              return; // wait for alt to load or error
            }
            // Try stripping querystring as a secondary fallback (e.g. external services that reject queries)
            if (!triedStrip && cur.includes('?')) {
              const stripped = cur.split('?')[0];
              if (process.env.NODE_ENV !== 'production') console.warn('[SmartImage] attempting strip-query alt:', stripped);
              setTriedStrip(true);
              img.src = stripped;
              return; // wait for stripped url to load or error
            }
          } catch (rewriteErr) {
            if (process.env.NODE_ENV !== 'production') console.error('[SmartImage] alt URL rewrite failed', rewriteErr);
          }

          if (!errored) {
            setErrored(true);
            // Log the failure with the attempted src so developer can inspect network/404/CORS
            console.error('[SmartImage] image failed to load:', cur, 'event:', e);
            img.src = placeholder;
            setLoaded(true);
          }
        }}
      />

      {errored && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.85)', padding: 8, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>Imagen no disponible</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => {
                  // reset flags and force re-render to retry loading the original src
                  setErrored(false);
                  setLoaded(false);
                  setTriedAlt(false);
                  setTriedStrip(false);
                  setReloadKey((k) => k + 1);
                }}
                style={{ padding: '6px 10px', fontSize: 12, background: '#111827', color: '#fff', borderRadius: 4, border: 'none' }}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartImage;
