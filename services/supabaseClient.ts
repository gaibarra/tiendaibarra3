import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

const supabaseUrl = 'https://lvpmfbpmnlskgoqdxdyg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cG1mYnBtbmxza2dvcWR4ZHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTM5NzIsImV4cCI6MjA3MTUyOTk3Mn0.UFCduIFZ6GWpy-vxtxT-zKiXJ4Y_ah0DDb6snMKx10M';

let supabase: SupabaseClient<Database> | null;
let supabaseInitializationError: string | null = null;

try {
    // Validamos que las credenciales no estén vacías antes de intentar crear el cliente.
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("La URL o la clave anónima de Supabase no pueden estar vacías.");
    }
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
} catch (e: any) {
    console.error("Error al inicializar el cliente de Supabase:", e);
    supabaseInitializationError = `No se pudo conectar con Supabase. Por favor, verifica tus credenciales en 'services/supabaseClient.ts'. Detalle: ${e.message}`;
    supabase = null;
}

export { supabase, supabaseInitializationError };