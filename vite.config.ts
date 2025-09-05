// vite.config.ts
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Carga .env.* y expón SOLO lo necesario
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // 👇 alias consistente con tsconfig: "@/x" → "src/x"
        "@": path.resolve(__dirname, "src"),
      },
    },

    /**
     * ⚠️ Evita usar process.env en el cliente.
     * Si (y solo si) necesitas valores públicos en el bundle,
     * usa variables que empiecen con VITE_ y léelas con import.meta.env.
     *
     * Por ejemplo, si agregas VITE_PUBLIC_SOMETHING=123 en tu .env,
     * en el código usarías import.meta.env.VITE_PUBLIC_SOMETHING
     */
    define: {
      // Ejemplo: si NECESITAS una constante pública, expón SOLO la VITE_ pública:
      // __APP_ENV__: JSON.stringify(env.VITE_PUBLIC_APP_ENV ?? 'dev'),
    },

    // Opcional: obliga prefijo VITE_ para lo que expones al cliente
    envPrefix: "VITE_",
    server: {
      proxy: {
        "/api": "http://localhost:4000", // redirige peticiones API al servidor Express durante desarrollo
      },
    },
    build: {
      outDir: "/home/gaibarra/tiendaibarra3/dist",
    },
  };
});
