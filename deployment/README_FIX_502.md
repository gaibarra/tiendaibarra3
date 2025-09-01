# Diagnóstico rápido para 502 Bad Gateway

Sigue estos pasos en el VPS donde corre nginx para identificar y arreglar el 502 que ves en la captura.

1) Verifica que nginx esté respondiendo (puedes hacerlo desde tu máquina):

   curl -I https://comercializadoraibarra.online

   - Si nginx responde pero la página muestra 502, el proxy está activo y el problema es el backend proxyeado.

2) Revisa qué puerto espera nginx para el backend (por defecto usamos 127.0.0.1:4001). Asegúrate que el servicio node esté escuchando en ese puerto.

3) En el VPS, comprueba el status del unit systemd (si lo instalaste):

   sudo systemctl status comercializadoraibarra-admin.service
   sudo journalctl -u comercializadoraibarra-admin.service -n 200 --no-pager

   - Busca errores de arranque, excepciones de Node o variables de entorno faltantes.

4) Si no usas systemd, busca el proceso Node y en qué puerto escucha:

   sudo ss -ltnp | grep node
   # o
   sudo lsof -iTCP -sTCP:LISTEN -P -n | grep node

5) Ver logs de nginx cerca del 502:

   sudo tail -n 200 /var/log/nginx/comercializadora.error.log
   sudo tail -n 200 /var/log/nginx/error.log

6) Comprobar que el backend arranca localmente:

   # en la carpeta del proyecto en VPS
   node server/admin.js

   Observa la salida: debería decir "Admin server listening on http://localhost:4001" (o el puerto que configures).

7) Variables de entorno faltantes

   Los servidores `server/admin.js` y `server/index.js` requieren variables (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY). Si faltan, el proceso puede salir.

8) Comprobar permisos y owner del directorio `dist/` para que nginx pueda leerlo:

   sudo ls -la /var/www/comercializadoraibarra.online/dist
   sudo chown -R www-data:www-data /var/www/comercializadoraibarra.online

9) Después de ajustar, reinicia servicios:

   sudo systemctl daemon-reload
   sudo systemctl restart comercializadoraibarra-admin.service
   sudo systemctl restart nginx

10) Comprueba conectividad entre nginx y backend desde el VPS:

   curl -I http://127.0.0.1:4001/admin/branding || curl -I http://127.0.0.1:4001/

Si necesitas, pega aquí la salida de `sudo systemctl status comercializadoraibarra-admin.service` y de `sudo journalctl -u comercializadoraibarra-admin.service -n 200 --no-pager` y te ayudo a interpretar los errores.
