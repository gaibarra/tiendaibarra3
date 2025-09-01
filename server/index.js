import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { validateThumbs, generateThumbsForFiles } from './thumbs.js';

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/api/validate-thumbs', async (req, res) => {
  const { urls } = req.body;
  if (!Array.isArray(urls)) return res.status(400).json({ error: 'urls array required' });
  try {
    const results = await validateThumbs(urls);
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/generate-thumbs', async (req, res) => {
  const { files } = req.body; // files: [{ bucket, path }]
  if (!Array.isArray(files)) return res.status(400).json({ error: 'files array required' });
  try {
    const results = await generateThumbsForFiles(files);
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Thumb server listening on ${port}`));
