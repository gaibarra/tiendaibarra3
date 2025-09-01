import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Product, CartItem, CompanyInfo, Order, ProductVariant } from '../types';
import { supabase, supabaseInitializationError } from '../services/supabaseClient';

interface ShopContextType {
  products: Product[];
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateCartQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  companyInfo: CompanyInfo | null;
  updateCompanyInfo: (info: Omit<CompanyInfo, 'id'>) => Promise<{ error: any }>;
  orders: Order[];
  addOrder: (orderData: { items: CartItem[], total: number }) => Promise<void>;
  confirmOrder: (orderId: string) => Promise<void>;
  saveProduct: (product: Product, imageFile: File | null) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  // simple client-side search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (supabaseInitializationError) {
      setError(supabaseInitializationError);
      setLoading(false);
      return;
    }
    
    try {
      const [productsRes, companyInfoRes, ordersRes] = await Promise.all([
        supabase.from('products').select(`*, variants:product_variants(*)`).order('created_at', { ascending: false }),
        supabase.from('company_info').select('*').eq('id', 1).single(),
        supabase.from('orders').select(`*, order_items(*)`).order('created_at', { ascending: false }),
      ]);

      if (productsRes.error) throw productsRes.error;
      // Validate product image URLs: if a public URL is unreachable, try to replace it in-memory with a signed URL
      const rawProducts = (productsRes.data as Product[]) || [];
      const productsWithImages = await Promise.all(rawProducts.map(async (p) => {
        if (!p.image_url) return p;
        try {
          // Quick HEAD check to see if the URL is reachable
          const head = await fetch(p.image_url, { method: 'HEAD' });
          if (head.ok) return p; // URL works
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') console.debug('[ShopContext] image head fetch failed for', p.image_url, e);
        }

        // If URL unreachable and looks like Supabase storage path, try to build a signed URL (non-destructive)
        try {
          const url = p.image_url;
          const marker = '/storage/v1/object/';
          const idx = url.indexOf(marker);
          if (idx !== -1) {
            let path = url.slice(idx + marker.length); // e.g. 'public/product-images/filename' or 'product-images/filename'
            // remove leading 'public/' if present
            if (path.startsWith('public/')) path = path.slice('public/'.length);
            // Now split to extract bucket and object path
            const parts = path.split('/').filter(Boolean);
            let bucket = 'product-images';
            let objectPath = path;
            if (parts.length >= 2) {
              // e.g. ['product-images', 'file.jpg', ...]
              bucket = parts[0];
              objectPath = parts.slice(1).join('/');
            } else if (parts.length === 1) {
              // only filename present, use default bucket
              objectPath = parts[0];
            }

            if (objectPath) {
              const signed = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60);
              if ((signed as any)?.data?.signedUrl) {
                if (process.env.NODE_ENV !== 'production') console.debug('[ShopContext] replacing unreachable image_url with signedUrl for product', p.id, (signed as any).data.signedUrl);
                return { ...p, image_url: (signed as any).data.signedUrl } as Product;
              } else {
                if (process.env.NODE_ENV !== 'production') console.error('[ShopContext] createSignedUrl returned no signedUrl for', bucket, objectPath, signed);
              }
            }
          }
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') console.error('[ShopContext] failed to create signed url for', p.image_url, e);
        }

        return p;
      }));

      setProducts(productsWithImages);

  if (companyInfoRes.error) throw companyInfoRes.error;
  setCompanyInfo(companyInfoRes.data);

      if (ordersRes.error) throw ordersRes.error;
      setOrders((ordersRes.data as Order[]) || []);

    } catch (err: any) {
      console.error('Error fetching initial data:', err.message);
      setError(`Falló la carga de datos de la tienda. (Detalle: ${err.message})`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(
        cartItem => cartItem.productId === item.productId && cartItem.variantId === item.variantId
      );
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.productId === item.productId && cartItem.variantId === item.variantId
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity }];
    });
  }, [setCart]);

  const updateCartQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      ).filter(item => item.quantity > 0)
    );
  }, [setCart]);

  const removeFromCart = useCallback((productId: string, variantId: string) => {
    setCart(prevCart => prevCart.filter(item => !(item.productId === productId && item.variantId === variantId)));
  }, [setCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);
  
  const updateCompanyInfo = useCallback(async (info: Omit<CompanyInfo, 'id'>) => {
    if (supabaseInitializationError) {
        const err = { message: supabaseInitializationError };
        setError(supabaseInitializationError);
        return { error: err };
    }
    const { data, error: updateError } = await supabase.from('company_info').update(info).eq('id', 1).select().single();
    if (updateError) {
        console.error('Error updating company info:', updateError.message);
        setError(`Error al actualizar la información de la empresa: ${updateError.message}`);
    }
    if (data) setCompanyInfo(data);
    return { error: updateError };
  }, []);

  const saveProduct = async (product: Product, imageFile: File | null) => {
    if (supabaseInitializationError) {
        setError(supabaseInitializationError);
        throw new Error(supabaseInitializationError);
    }
    try {
        let imageUrl = product.image_url;

        if (imageFile) {
            const fileName = `${Date.now()}_${imageFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, imageFile);
            
            if (uploadError) {
                throw new Error(`Error al subir la imagen: ${uploadError.message}`);
            }

            // Try to obtain the public URL for the uploaded file and log the raw response for diagnosis
            const getRes = await supabase.storage.from('product-images').getPublicUrl(fileName as string);
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[ShopContext] getPublicUrl response:', getRes);
            }

            const publicUrl = (getRes as any)?.data?.publicUrl ?? (getRes as any)?.publicUrl ?? null;

            if (!publicUrl) {
                // Surface the failure with helpful context
                const msg = `No se pudo obtener la URL pública de la imagen para ${fileName}. Respuesta: ${JSON.stringify(getRes)}`;
                console.error('[ShopContext] ', msg);
                throw new Error(msg);
            }

            if (process.env.NODE_ENV !== 'production') {
              console.debug('[ShopContext] uploaded image publicUrl:', publicUrl, 'fileName:', fileName);
            }

            // Try a quick HEAD fetch to verify the public URL is actually reachable from the browser.
            let finalUrl = publicUrl as string;
            try {
              const headRes = await fetch(finalUrl, { method: 'HEAD' });
              if (!headRes.ok) {
                // If HEAD failed (403/404), attempt to create a signed URL as fallback
                if (process.env.NODE_ENV !== 'production') {
                  console.warn('[ShopContext] publicUrl returned non-ok status, attempting signed URL. status:', headRes.status, 'url:', finalUrl);
                }
                const signed = await supabase.storage.from('product-images').createSignedUrl(fileName as string, 60 * 60 * 24);
                if ((signed as any)?.error || !((signed as any)?.data?.signedUrl)) {
                  if (process.env.NODE_ENV !== 'production') console.error('[ShopContext] createSignedUrl failed:', signed);
                } else {
                  finalUrl = (signed as any).data.signedUrl;
                  if (process.env.NODE_ENV !== 'production') console.debug('[ShopContext] using signedUrl for image:', finalUrl);
                }
              }
            } catch (fetchErr: any) {
              // Network/fetch error — attempt signed URL as well
              if (process.env.NODE_ENV !== 'production') console.warn('[ShopContext] HEAD fetch for publicUrl failed:', fetchErr);
              const signed = await supabase.storage.from('product-images').createSignedUrl(fileName as string, 60 * 60 * 24);
              if (!((signed as any)?.data?.signedUrl)) {
                if (process.env.NODE_ENV !== 'production') console.error('[ShopContext] createSignedUrl failed after fetch error:', signed);
              } else {
                finalUrl = (signed as any).data.signedUrl;
                if (process.env.NODE_ENV !== 'production') console.debug('[ShopContext] using signedUrl for image after fetch error:', finalUrl);
              }
            }

            imageUrl = finalUrl;
        }
        
        const { variants, created_at, id, ...productData } = product;
        const isNew = id.startsWith('new_');
        
        const productToSave = { 
            ...productData, 
            image_url: imageUrl, 
            ...(isNew ? {} : { id }) 
        };
        
        const { data: savedProduct, error: productError } = await supabase.from('products').upsert(productToSave).select().single();
        if (productError) throw productError;
        if (!savedProduct) throw new Error("Failed to save product.");

        const variantsToSave = variants.map(v => {
          const { id: variantId, product_id, ...restOfVariant } = v as any;
          const isNewVariant = typeof variantId === 'string' && variantId.startsWith('var_');
          const hasValidId = typeof variantId === 'string' && variantId !== '' && !isNewVariant;
          
          let newVariantId;
          if (isNewVariant) {
            newVariantId = crypto.randomUUID();
          }
          
          return {
            ...restOfVariant,
            product_id: savedProduct.id,
            ...(hasValidId ? { id: variantId } : (newVariantId ? { id: newVariantId } : {}))
          };
        }).filter(v => v.name && typeof v.price === 'number');
        const { error: variantsError } = await supabase.from('product_variants').upsert(variantsToSave);
        if (variantsError) throw variantsError;

        await fetchData();
    } catch(error: any) {
        console.error('Error saving product:', error.message);
        setError(`Error al guardar el producto: ${error.message}`);
        throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    if (supabaseInitializationError) {
        setError(supabaseInitializationError);
        throw new Error(supabaseInitializationError);
    }
    try {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw error;
        await fetchData();
    } catch (error: any) {
        console.error('Error deleting product:', error.message);
        setError(`Error al eliminar el producto: ${error.message}`);
        throw error;
    }
  };
  
  const addOrder = async (orderData: { items: CartItem[], total: number }) => {
    if (supabaseInitializationError) {
        setError(supabaseInitializationError);
        throw new Error(supabaseInitializationError);
    }
    try {
        const { data: order, error: orderError } = await supabase.from('orders').insert({ total: orderData.total, status: 'pending' }).select().single();
        if (orderError) throw orderError;
        if (!order) throw new Error("Failed to create order.");
        
        const orderItems = orderData.items.map(item => ({
            order_id: order.id,
            product_id: item.productId,
            variant_id: item.variantId,
            product_name: item.name,
            variant_name: item.variantName,
            quantity: item.quantity,
            price: item.price
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if(itemsError) throw itemsError;

        await fetchData();
    } catch(error: any) {
        console.error('Error adding order:', error.message);
        setError(`Error al añadir el pedido: ${error.message}`);
        throw error;
    }
  };

  const confirmOrder = async (orderId: string) => {
    if (supabaseInitializationError) {
        setError(supabaseInitializationError);
        throw new Error(supabaseInitializationError);
    }
    try {
        const orderToConfirm = orders.find(o => o.id === orderId);
        if (!orderToConfirm) throw new Error("Order not found");

        for (const item of orderToConfirm.order_items) {
          const { error: rpcError } = await supabase.rpc('decrease_stock', {
            p_variant_id: item.variant_id,
            p_quantity: item.quantity
          });
          if (rpcError) throw rpcError;
        }

        const { error: updateError } = await supabase.from('orders').update({ status: 'confirmed' }).eq('id', orderId);
        if (updateError) throw updateError;

        await fetchData();
    } catch (error: any) {
        console.error('Error confirming order:', error.message);
        setError(`Error al confirmar el pedido: ${error.message}`);
        throw error;
    }
  };


  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <ShopContext.Provider
      value={{
        products,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        companyInfo,
        updateCompanyInfo,
        orders,
        addOrder,
        confirmOrder,
        saveProduct,
        deleteProduct,
        loading,
        error,
  searchQuery,
  setSearchQuery,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};