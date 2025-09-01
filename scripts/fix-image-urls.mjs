#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import process from 'process';

// Node 18+ provides global fetch. Ensure it's available at runtime.
if (typeof fetch === 'undefined') {
  console.error('Global fetch is not available in this Node runtime. Use Node 18+ or install node-fetch and re-run.');
  process.exit(1);
}

// Usage:
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/fix-image-urls.mjs --dry-run
// Use --apply to write changes.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apply = args.includes('--apply');

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

function extractBucketAndPathFromStorageUrl(url) {
  // expect: https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<path...>
  // or: https://<proj>.supabase.co/storage/v1/object/<bucket>/<path...>
  const marker = '/storage/v1/object/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  let rest = url.slice(idx + marker.length); // public/<bucket>/path or bucket/path
  if (rest.startsWith('public/')) rest = rest.slice('public/'.length);
  const parts = rest.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  const bucket = parts[0];
  const objectPath = parts.slice(1).join('/');
  return { bucket, objectPath };
}

async function main() {
  console.log('Starting image URL fixer -- dryRun:', dryRun, ' apply:', apply);

  const { data: products, error } = await supabase.from('products').select('id, image_url');
  if (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }

  const changes = [];

  for (const p of products) {
    const id = p.id;
    const imageUrl = p.image_url || null;
    if (!imageUrl) continue;

    console.log('\nProduct', id);
    console.log(' current image_url:', imageUrl);

    // If imageUrl is already reachable, skip
    const reachable = await headOk(imageUrl);
    if (reachable) {
      console.log('  -> image is reachable (HEAD ok), skipping');
      continue;
    }

    // Try to getPublicUrl using the storage path
    const parsed = extractBucketAndPathFromStorageUrl(imageUrl);
    if (!parsed) {
      console.log('  -> URL does not look like Supabase storage URL. Skipping.');
      continue;
    }

    const { bucket, objectPath } = parsed;
    console.log('  -> inferred bucket:', bucket, 'objectPath:', objectPath || '(root)');

    // Try getPublicUrl
    try {
      const getRes = await supabase.storage.from(bucket).getPublicUrl(objectPath);
  const publicUrl = getRes && getRes.data ? getRes.data.publicUrl : null;
      console.log('  getPublicUrl returned:', publicUrl);
      if (publicUrl && await headOk(publicUrl)) {
        console.log('  -> publicUrl is reachable');
        changes.push({ id, from: imageUrl, to: publicUrl });
        if (apply) {
          const { error: updErr } = await supabase.from('products').update({ image_url: publicUrl }).eq('id', id);
          if (updErr) console.error('  ERROR updating product:', updErr);
          else console.log('  updated product with publicUrl');
        }
        continue;
      }
    } catch (e) {
      console.warn('  getPublicUrl failed', e);
    }

    // If public doesn't work, try createSignedUrl
    try {
      const signed = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60 * 24);
  const signedUrl = signed && signed.data ? signed.data.signedUrl : null;
      console.log('  createSignedUrl returned:', signedUrl ? '[signedUrl]' : signed);
      if (signedUrl && await headOk(signedUrl)) {
        console.log('  -> signedUrl is reachable');
        changes.push({ id, from: imageUrl, to: signedUrl });
        if (apply) {
          const { error: updErr } = await supabase.from('products').update({ image_url: signedUrl }).eq('id', id);
          if (updErr) console.error('  ERROR updating product:', updErr);
          else console.log('  updated product with signedUrl');
        }
        continue;
      }
    } catch (e) {
      console.warn('  createSignedUrl failed', e);
    }

    console.log('  -> could not fix image for this product (object may not exist or bucket misconfigured)');
  }

  console.log('\nSummary: planned changes count:', changes.length);
  if (dryRun && changes.length > 0) console.log('Run with --apply to perform updates.');
}

main().catch(err => { console.error(err); process.exit(1); });
