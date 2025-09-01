/*
Admin helper to upload branding logo and update branding row using Supabase service role key.
Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_API_KEY=... node server/admin.js
*/

import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import crypto from 'crypto';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 4001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'change-me';
const BUCKET = process.env.BUCKET_NAME || 'logo-image';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

app.use(express.json());

// Simple middleware to check admin key
app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    const key = req.header('x-admin-key');
    if (!key || key !== ADMIN_API_KEY) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }
  next();
});

app.post('/admin/branding', upload.single('logo'), async (req, res) => {
  try {
    const file = req.file; // multer buffer
    const { logo_url, primary_color, secondary_color, accent_color, text_color } = req.body;

    let finalUrl = logo_url || null;

    if (file) {
      // generate filename
      const ext = path.extname(file.originalname) || '';
      const fileName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
      // upload buffer
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
      if (uploadError) {
        console.error('Storage upload error', uploadError);
        return res.status(500).json({ success: false, error: uploadError.message || uploadError });
      }
      // get public url
      const { data: publicData, error: publicErr } = await supabase.storage.from(BUCKET).getPublicUrl(fileName);
      if (publicErr) {
        console.error('getPublicUrl error', publicErr);
        return res.status(500).json({ success: false, error: publicErr.message || publicErr });
      }
      finalUrl = publicData?.publicUrl || publicData?.data?.publicUrl || null;
    }

    // Build update payload only with provided values
    const updatePayload = {};
    if (finalUrl) updatePayload.logo_url = finalUrl;
    if (primary_color) updatePayload.primary_color = primary_color;
    if (secondary_color) updatePayload.secondary_color = secondary_color;
    if (accent_color) updatePayload.accent_color = accent_color;
    if (text_color) updatePayload.text_color = text_color;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const { data, error: updateError } = await supabase
      .from('branding')
      .update(updatePayload)
      .eq('id', 1)
      .select()
      .single();

    if (updateError) {
      console.error('branding update error', updateError);
      return res.status(500).json({ success: false, error: updateError.message || updateError });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Admin server listening on http://localhost:${PORT}`);
});
