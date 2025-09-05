/*
 Admin helper + endpoint público de tips.
 Requiere variables de entorno:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  ADMIN_API_KEY (para las rutas /admin/*)
  BUCKET_NAME (opcional, default: logo-image)
  PORT (opcional, default 4001)
*/

import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import crypto from 'crypto';
import OpenAI from 'openai';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 4001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // nueva variable
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'change-me';
const BUCKET = process.env.BUCKET_NAME || 'logo-image';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

app.use(express.json());

// Middleware de auth sólo para /admin/*
app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    const key = req.header('x-admin-key');
    if (!key || key !== ADMIN_API_KEY) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }
  next();
});

/* ========== ENDPOINT PÚBLICO TIPS (con OpenAI opcional) ========== */
app.post('/api/tips', async (req, res) => {
  try {
    const { query, city, sector } = req.body || {};
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ ok: false, error: 'query required' });
    }

    // Si hay API Key intentamos generar con OpenAI
    if (OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        const systemPrompt = `Eres un asistente experto en limpieza y mantenimiento profesional para distintos sectores (restaurantes, hospitales, hoteles, talleres, oficinas, escuelas).
Responde SIEMPRE en español neutro. Estructura la respuesta en secciones claras:

RESUMEN BREVE (1-2 líneas)
MATERIALES (lista con viñetas, nombres genéricos, evita marcas)
PASOS DETALLADOS (numerados, concretos, máximos 8, indicando tiempos de contacto o diluciones típicas si relevantes)
SEGURIDAD (EPP, ventilación, incompatibilidades químicas)
PREVENCIÓN (cómo reducir recurrencia)
ADVERTENCIAS (solo si aplica: corrosión, mezclas peligrosas, superficies sensibles)

Condiciona según sector: prioriza higiene alimentaria en restaurantes, control de infecciones en hospitales, cuidado de textiles en hoteles, control de grasas/aceites en talleres, bajo olor y presentación en oficinas, seguridad infantil en escuelas.
Si la consulta es ambigua, pide una aclaración breve en la sección RESUMEN y aun así da pautas generales seguras.
No inventes datos peligrosos. No mezcles cloro con ácidos o amoníaco.`;

        const userPrompt = `Consulta del usuario: "${query.trim()}"
Ciudad: ${city || 'N/D'} (usa clima/localidad solo si realmente influye: dureza de agua, temperatura, humedad)
Sector: ${sector || 'N/D'}

Genera respuesta siguiendo la plantilla. Limita longitud total a aprox. 350-500 palabras.`;

        const completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          temperature: 0.4,
          max_tokens: 900,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        });
        const content = completion.choices?.[0]?.message?.content?.trim();
        if (content) {
          return res.json({ ok: true, tips: content, model: OPENAI_MODEL, source: 'openai' });
        }
        // Si no hay contenido, cae a fallback
      } catch (err) {
        console.error('OpenAI error, usando fallback:', err);
        // continúa a fallback
      }
    }

    // ===== Fallback basado en reglas simples =====
    const n = query.toLowerCase();
    const out = [];
    out.push(`RESUMEN BREVE: Respuesta básica para "${query}" (motor extendible).`);
    out.push('MATERIALES:');
    out.push('- Guantes de protección');
    out.push('- Microfibra limpia');
    if (/(grasa|aceite)/.test(n)) out.push('- Desengrasante alcalino diluible');
    if (/(moho|hongo)/.test(n)) out.push('- Solución de hipoclorito 1:10 / Peróxido');
    out.push('\nPASOS DETALLADOS:');
    if (/(grasa|aceite)/.test(n)) {
      out.push('1. Retira excedente superficial de grasa con espátula plástica.');
      out.push('2. Aplica desengrasante diluido (ver etiqueta, típicamente 1:10) sobre la zona.');
      out.push('3. Deja actuar 3-5 minutos evitando que seque.');
      out.push('4. Frota con microfibra siguiendo la veta (si es acero inoxidable).');
      out.push('5. Enjuaga con agua tibia y seca para evitar película.');
    } else if (/(moho|hongo)/.test(n)) {
      out.push('1. Ventila el área y coloca EPP adecuado.');
      out.push('2. Aplica la solución (hipoclorito 1:10 o peróxido) sobre el moho visible.');
      out.push('3. Tiempo de contacto 5-10 min sin dejar secar.');
      out.push('4. Retira residuos con microfibra y enjuaga.');
      out.push('5. Seca y mejora ventilación para prevenir recurrencia.');
    } else {
      out.push('1. Quita suciedad suelta (barrido/aspirado).');
      out.push('2. Aplica producto adecuado según pH y tipo de superficie.');
      out.push('3. Respeta el tiempo de contacto indicado por el fabricante.');
      out.push('4. Enjuaga si es necesario y seca para evitar corrosión o manchas.');
    }
    out.push('\nSEGURIDAD: No mezclar cloro con ácidos o amoníaco. Usar guantes y ventilación.');
    out.push('PREVENCIÓN: Limpieza frecuente, secado completo, control de humedad (si aplica).');
    out.push(`SECTOR (${sector || 'N/D'}): Ajusta frecuencias y registros según normativas internas.`);
    out.push('ADVERTENCIAS: Probar siempre en zona poco visible antes de aplicar ampliamente.');
    out.push('\n(Fuente: motor interno de reglas — sin modelo IA o fallback)');
    res.json({ ok: true, tips: out.join('\n'), source: 'fallback' });
  } catch (e) {
    console.error('tips error', e);
    res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

/* ========== ENDPOINT /admin/branding (upload + update) ========== */
app.post('/admin/branding', upload.single('logo'), async (req, res) => {
  try {
    const file = req.file;
    const { logo_url, primary_color, secondary_color, accent_color, text_color } = req.body;

    let finalUrl = logo_url || null;

    if (file) {
      const ext = path.extname(file.originalname) || '';
      const fileName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });
      if (uploadError) {
        return res.status(500).json({ success: false, error: uploadError.message || uploadError });
      }
      const { data: publicData, error: publicErr } = await supabase
        .storage
        .from(BUCKET)
        .getPublicUrl(fileName);
      if (publicErr) {
        return res.status(500).json({ success: false, error: publicErr.message || publicErr });
      }
      finalUrl = publicData?.publicUrl || publicData?.data?.publicUrl || null;
    }

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
      return res.status(500).json({ success: false, error: updateError.message || updateError });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

/* ========== INICIO SERVIDOR ========== */
app.listen(PORT, () => {
  console.log(`Admin server listening on http://localhost:${PORT}`);
});