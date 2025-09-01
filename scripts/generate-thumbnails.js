#!/usr/bin/env node
// Simple thumbnail generator using sharp (ESM)
// Usage:
//   node scripts/generate-thumbnails.js --input=public/images --output=public/images --sizes=300,600,1200

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((a) => {
    const [k, v] = a.split('=');
    const key = k.replace(/^--/, '');
    args[key] = v ?? true;
  });
  return args;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function isImageFile(file) {
  const ext = path.extname(file).toLowerCase();
  // Only process source image types; ignore already-generated .webp files
  return ['.jpg', '.jpeg', '.png', '.tiff', '.gif'].includes(ext);
}

async function processFile(filePath, inputRoot, outputDir, sizes) {
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  // skip files that look like already-generated thumbnails (e.g. image-300)
  if (/-(?:\d+)$/.test(base)) return;
  // compute relative dir relative to the input root so we don't duplicate paths
  const relDir = path.dirname(path.relative(inputRoot, filePath));
  const targetDir = path.join(outputDir, relDir === '.' ? '' : relDir);
  await ensureDir(targetDir);

  for (const size of sizes) {
    const outName = `${base}-${size}.webp`;
    const outPath = path.join(targetDir, outName);
    try {
      await sharp(filePath).resize(Number(size)).webp({ quality: 80 }).toFile(outPath);
      console.log(`Wrote ${outPath}`);
    } catch (err) {
      console.error(`Failed ${outPath}:`, err.message || err);
    }
  }
}

async function walkAndProcess(dir, inputRoot, outputDir, sizes) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkAndProcess(full, inputRoot, outputDir, sizes);
    } else if (entry.isFile() && isImageFile(entry.name)) {
      await processFile(full, inputRoot, outputDir, sizes);
    }
  }
}

async function main() {
  const args = parseArgs();
  const input = args.input || 'public/images';
  const output = args.output || input;
  const sizesArg = args.sizes || '300,600,1200';
  const sizes = sizesArg.split(',').map((s) => s.trim()).filter(Boolean);

  const absInput = path.resolve(process.cwd(), input);
  const absOutput = path.resolve(process.cwd(), output);

  try {
    const stat = await fs.stat(absInput);
    if (!stat.isDirectory()) throw new Error('Input is not a directory');
  } catch (err) {
    console.error(`Input path not found: ${absInput}`);
    process.exit(1);
  }

  console.log(`Generating thumbnails from ${absInput} -> ${absOutput} sizes: ${sizes.join(',')}`);
  await walkAndProcess(absInput, absInput, absOutput, sizes);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
