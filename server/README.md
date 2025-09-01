Admin helper server

This small Express server uses the Supabase service role key to upload a file to a bucket and update the `branding` row (id=1).

Requirements
- Node 18+
- Environment variables:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - ADMIN_API_KEY (choose a secret string)
  - BUCKET_NAME (optional, default: logo-image)

Install dependencies:

npm install express multer @supabase/supabase-js

Run locally:

SUPABASE_URL=https://<your>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<service-role-key> ADMIN_API_KEY=secret BUCKET_NAME=logo-image node server/admin.js

Example curl (upload file):

curl -X POST "http://localhost:4001/admin/branding" \
  -H "x-admin-key: secret" \
  -F "logo=@./path/to/logo.png" \
  -F "primary_color=#123456" \
  -F "secondary_color=#ffffff"

Example curl (only update colors):

curl -X POST "http://localhost:4001/admin/branding" \
  -H "x-admin-key: secret" \
  -F "primary_color=#123456"

Security note: keep your service role key secret; do not expose this server publicly without additional auth. This is intended for local admin use or internal network.
