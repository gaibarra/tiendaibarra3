# Despliegue: comercializadoraibarra.online (VPS Ubuntu + nginx + certbot)

Propósito: instrucciones paso a paso para desplegar la app (frontend Vite + backend admin Node) en un VPS Ubuntu con nginx y TLS gestionado por certbot.

Resumen rápido
- El frontend se construye con `npm run build` (Vite) y se sirve como sitio estático por nginx desde `/var/www/comercializadoraibarra.online/dist`.
- El backend mínimo (`server/admin.js`) se ejecuta como servicio systemd en `http://127.0.0.1:4001` y nginx lo proxya en `/admin-api/`.
- Certbot obtiene el certificado y configura nginx automáticamente.

Checklist de tareas
- [ ] DNS: apuntar `comercializadoraibarra.online` (y `www`) al IP público del VPS (A record).
- [ ] Tener acceso SSH al VPS (usuario con sudo).
- [ ] En VPS: instalar nginx, certbot, Node (>=18), y configurar firewall si aplica.
- [ ] Construir la app (o hacerlo en la VPS) y copiar `dist/` a `/var/www/comercializadoraibarra.online/dist`.
- [ ] Configurar systemd para `server/admin.js` y variables de entorno (service role key NO debe exponerse a frontend).
- [ ] Configurar nginx y obtener TLS con certbot.

Comandos (ejecútalos en el VPS como usuario con sudo o tu usuario y usa sudo cuando corresponda)

1) Preparar VPS (Ubuntu 22.04+)

```bash
# actualizar
sudo apt update && sudo apt upgrade -y

# instalar herramientas
sudo apt install -y nginx git curl build-essential

# node (NodeSource) - ejemplo para Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# certbot (con plugin nginx)
sudo apt install -y certbot python3-certbot-nginx

# opcional: ufw (firewall)
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # permite 80 y 443
sudo ufw enable
```

2) Clonar el repo y preparar build (puedes construir localmente y subir `dist/`, o construir en el VPS)

```bash
# en VPS (ejemplo: /var/www)
sudo mkdir -p /var/www/comercializadoraibarra.online
sudo chown $USER:$USER /var/www/comercializadoraibarra.online
cd /var/www/comercializadoraibarra.online

# clonar tu repo (o copiar los archivos desde local con rsync)
git clone https://github.com/tuusuario/tu-repo.git .

# instalar deps y build
npm ci
npm run build
# salida por defecto: dist/
```

Si prefieres: construir localmente y subir `dist/` con rsync:

```bash
# desde tu máquina local
npm run build
rsync -avz --delete dist/ usuario@VPS_IP:/var/www/comercializadoraibarra.online/dist/
```

3) Nginx - configuración del sitio

Crea `/etc/nginx/sites-available/comercializadoraibarra.online` con este contenido (ejemplo):

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name comercializadoraibarra.online www.comercializadoraibarra.online;

  root /var/www/comercializadoraibarra.online/dist;
  index index.html;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy para la API de administración
  location /admin-api/ {
    proxy_pass http://127.0.0.1:4001/; # backend admin server
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Optionally serve well-known for certbot
  location ~ /.well-known/acme-challenge/ {
    allow all;
  }
}
```

Habilita y recarga nginx:

```bash
sudo ln -s /etc/nginx/sites-available/comercializadoraibarra.online /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4) Obtener certificado TLS con certbot (plugin nginx)

```bash
sudo certbot --nginx -d comercializadoraibarra.online -d www.comercializadoraibarra.online
```

Certbot actualizará la configuración de nginx y habilitará renovación automática (cron/systemd timer).

5) Backend admin: crear service systemd (para `server/admin.js`)

- Crea un archivo de entorno seguro, por ejemplo `/etc/comercializadoraibarra.env` y protégelo:

```bash
sudo tee /etc/comercializadoraibarra.env > /dev/null <<EOF
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=REEMPLAZA_AQUI_CON_TU_SERVICE_ROLE_KEY
ADMIN_API_KEY=tuApiKeySecreta
BUCKET_NAME=logo-image
PORT=4001
EOF
sudo chmod 600 /etc/comercializadoraibarra.env
```

- Crea el unit file `/etc/systemd/system/comercializadoraibarra-admin.service` con:

```ini
[Unit]
Description=Comercializadora Ibarra - Admin Helper
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/comercializadoraibarra.online
EnvironmentFile=/etc/comercializadoraibarra.env
ExecStart=/usr/bin/node server/admin.js
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Ajusta `User` y `WorkingDirectory` según dónde hayas ubicado el repo en el VPS.

Habilita y arranca el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now comercializadoraibarra-admin.service
sudo journalctl -u comercializadoraibarra-admin.service -f
```

6) Seguridad y notas finales
- No pongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend. Debe quedar sólo en `/etc/comercializadoraibarra.env` del VPS.
- Asegúrate de que el bucket `logo-image` tenga la política que quieres (público si quieres `getPublicUrl` directo).
- Revisa permisos del directorio `/var/www/comercializadoraibarra.online` para que nginx pueda leerlo (ejemplo: owner `www-data` o `chown -R www-data:www-data /var/www/comercializadoraibarra.online`).

7) Despliegues posteriores (actualizaciones)
- Para actualizar sólo el frontend (si construyes localmente): subir `dist/` por rsync y `sudo systemctl reload nginx`.
- Si hay cambios en `server/admin.js`: `git pull` en VPS, `npm ci`, `sudo systemctl restart comercializadoraibarra-admin.service`.

8) Validación rápida
- Abrir https://comercializadoraibarra.online en un navegador.
- `curl -I https://comercializadoraibarra.online` debe devolver 200 y header `Server: nginx`.
- `curl -I https://comercializadoraibarra.online/admin-api/` debería retornar respuesta del backend (o 401 si requiere `x-admin-key`).

---

Si quieres, puedo:
- Generar el archivo de configuración de nginx y el unit file aquí en el repo para que los copies exactamente en el VPS.
- Añadir un pequeño script `deploy.sh` que haga build + rsync al VPS (necesitarás claves SSH configuradas).

Dime cuál de las dos opciones prefieres y lo agrego al repo. 
