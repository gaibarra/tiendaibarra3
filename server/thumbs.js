import sharp from 'sharp';
import fetch from 'node-fetch';
import FormData from 'form-data';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Uploads will fail.');
}

export async function validateThumbs(urls) {
  const results = [];
  for (const url of urls) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      results.push({ url, ok: r.ok, status: r.status });
    } catch (e) {
      results.push({ url, ok: false, error: String(e) });
    }
  }
  return results;
}

// files: [{ bucket, path }] path is object path inside bucket
export async function generateThumbsForFiles(files) {
  const results = [];
  for (const f of files) {
    try {
      const srcUrl = `${SUPABASE_URL}/storage/v1/object/public/${f.bucket}/${encodeURIComponent(f.path)}`;
      const resp = await fetch(srcUrl);
      if (!resp.ok) {
        results.push({ file: f, ok: false, reason: `source fetch failed ${resp.status}` });
        continue;
      }
      const buffer = await resp.arrayBuffer();
      const img = sharp(Buffer.from(buffer));
      const thumb = await img.resize(300, 300, { fit: 'inside' }).toBuffer();

      // upload to supabase using service role
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${f.bucket}/${encodeURIComponent(f.path.replace(/(\.[^.]+)$/, '-300$1'))}`;
      const form = new FormData();
      form.append('file', thumb, { filename: f.path.replace(/(\.[^.]+)$/, '-300$1') });

      const uploadResp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: thumb
      });

      if (!uploadResp.ok) {
        results.push({ file: f, ok: false, reason: `upload failed ${uploadResp.status}` });
      } else {
        results.push({ file: f, ok: true });
      }
    } catch (e) {
      results.push({ file: f, ok: false, error: String(e) });
    }
  }
  return results;
}
