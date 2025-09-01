Image URL fixer

This repository includes a small helper script to diagnose and fix product image URLs stored in the `products.image_url` field.

Usage (dry-run):

```bash
SUPABASE_URL=https://<your-project>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> node scripts/fix-image-urls.mjs --dry-run
```

To apply changes (will update the DB):

```bash
SUPABASE_URL=https://<your-project>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> node scripts/fix-image-urls.mjs --apply
```

Notes:
- The script attempts to HEAD each image URL. If unreachable, it tries `getPublicUrl` and `createSignedUrl` for the inferred bucket/object.
- Use your Supabase project's SERVICE ROLE KEY to allow `createSignedUrl` and DB updates.
- The script is safe to run in `--dry-run` mode to preview changes.
