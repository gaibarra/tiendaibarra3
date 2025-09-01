import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { supabase, supabaseInitializationError } from '../services/supabaseClient';
import { Branding as BrandingType } from '../types';

// Marca por defecto en caso de que la llamada a la base de datos falle
const defaultBranding: BrandingType = {
  id: 1,
  logo_url: 'https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600',
  primary_color: '#4f46e5',   // Indigo 600
  secondary_color: '#f9fafb', // Gray 50
  accent_color: '#ec4899',    // Pink 500
  text_color: '#111827',      // Gray 900
};

interface BrandingContextType {
  branding: BrandingType;
  updateBranding: (branding: Omit<BrandingType, 'id'>) => Promise<{ error: any }>;
  refreshBranding: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingType>(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // encapsulate fetch so we can reuse it elsewhere
    const fetchBranding = async () => {
      setLoading(true);
      setError(null);

      if (supabaseInitializationError) {
        setError(supabaseInitializationError);
        setLoading(false);
        return;
      }

      // Asume una única fila con ID 1 para la configuración de la marca
      const { data, error: fetchError } = await supabase
        .from('branding')
        .select('*')
        .eq('id', 1)
        .single();

      if (fetchError) {
        console.error('Error fetching branding:', fetchError.message);
        setError(`No se pudo cargar la configuración de la marca. (Detalle: ${fetchError.message})`);
      } else if (data) {
        setBranding(data);
      }
      setLoading(false);
    };

    fetchBranding();

    // Subscribe to realtime changes on the branding row so UI updates when server-side admin changes it
    // @ts-ignore - supabase.channel types vary by version
    const channel = supabase.channel('public:branding')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branding', filter: 'id=eq.1' }, (payload: any) => {
        try {
          if (payload && payload.new) {
            setBranding(payload.new as BrandingType);
          }
        } catch (e) {
          console.debug('branding realtime payload', payload, e);
        }
      })
      .subscribe();

    return () => {
      try {
        // @ts-ignore
        channel.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // allow manual refresh from components
  const refreshBranding = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('branding')
        .select('*')
        .eq('id', 1)
        .single();
      if (fetchError) {
        setError(`No se pudo recargar la marca. (Detalle: ${fetchError.message})`);
      } else if (data) {
        setBranding(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = useCallback(async (newBranding: Omit<BrandingType, 'id'>) => {
    if (supabaseInitializationError) {
        const err = { message: supabaseInitializationError };
        setError(supabaseInitializationError);
        return { error: err };
    }
    const { data, error: updateError } = await supabase
      .from('branding')
      .update(newBranding)
      .eq('id', 1)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating branding:', updateError.message);
      setError(`Falló la actualización de la configuración de la marca. (Detalle: ${updateError.message})`);
    } else if (data) {
      setBranding(data);
    }
    return { error: updateError };
  }, []);

  const value = { branding, updateBranding, refreshBranding, loading, error };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
