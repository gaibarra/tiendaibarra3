
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, supabaseInitializationError } from '../services/supabaseClient';
import { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabaseInitializationError) {
        setLoading(false);
        return;
    }
    
    const getSession = async () => {
        const { data, error } = await supabase!.auth.getSession();
        if (error) {
            console.error('Error getting session:', error.message);
        } else {
            setSession(data.session);
            setUser(data.session?.user ?? null);
        }
        setLoading(false);
    };
    
    getSession();

    const { data: authListener } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: supabaseInitializationError, name: "InitializationError" } as AuthError };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return { error: { message: supabaseInitializationError, name: "InitializationError" } as AuthError };
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};