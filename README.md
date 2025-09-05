<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1040E1_wehpyecgx_1IKvFguCxAUPG1iC

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### Seguridad del Panel de Administración

Se añadió una lista blanca de correos para el acceso al panel:

1. Crea / actualiza tu archivo `.env` con:

```
VITE_ADMIN_EMAILS=admin1@tu-dominio.com,admin2@tu-dominio.com
VITE_FORCE_LOGOUT_ON_START=1 # opcional: fuerza cerrar sesión previa cada carga
```

2. Rebuild de la app para que Vite inyecte el valor.

Los correos no incluidos verán un mensaje de "Acceso restringido" aunque inicien sesión o adivinen la ruta `/admin`.
# tiendaibarra2
# tiendaibarra2
# tiendaibarra3
