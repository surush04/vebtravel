#!/usr/bin/env node
/**
 * M-SAYYOD image pipeline
 * -----------------------
 * 1. Put original photographs in /images-src, named after their photo slot:
 *      images-src/hero-markhor.jpg, images-src/gallery-01.jpg, …
 *    (slot names are listed in src/app/data/site.data.ts → MEDIA)
 * 2. Run:  npm run images
 *
 * For each photo this writes responsive AVIF, WebP and JPEG files to
 * /public/images (<slot>-<width>.<ext>) and updates public/images/manifest.json.
 * The site picks them up automatically — the placeholder art disappears.
 * `hero-markhor` also produces the Open Graph image (og-cover.jpg, 1200×630).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'images-src');
const OUT = path.join(root, 'public', 'images');
const WIDTHS = [480, 800, 1200, 1600, 2400];
const INPUT = /\.(jpe?g|png|webp|tiff?|avif)$/i;

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('This script needs "sharp":  npm install --save-dev sharp');
  process.exit(1);
}

await fs.mkdir(OUT, { recursive: true });
const manifestPath = path.join(OUT, 'manifest.json');
let manifest = { images: {} };
try {
  manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
} catch {
  /* first run */
}

const files = (await fs.readdir(SRC).catch(() => [])).filter((f) => INPUT.test(f));
if (!files.length) {
  console.log(`No photographs found in ${path.relative(root, SRC)}/ — nothing to do.`);
  process.exit(0);
}

for (const file of files) {
  const key = path.basename(file, path.extname(file)).toLowerCase();
  const input = path.join(SRC, file);
  const base = sharp(input, { failOn: 'none' }).rotate(); // respect EXIF orientation
  const { width = 0, height = 0 } = await base.metadata();
  const widths = WIDTHS.filter((w) => w <= width);
  if (!widths.length) widths.push(width);

  for (const w of widths) {
    const resized = base.clone().resize({ width: w, withoutEnlargement: true });
    await Promise.all([
      resized.clone().avif({ quality: 52, effort: 4 }).toFile(path.join(OUT, `${key}-${w}.avif`)),
      resized.clone().webp({ quality: 74 }).toFile(path.join(OUT, `${key}-${w}.webp`)),
      resized.clone().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(path.join(OUT, `${key}-${w}.jpg`)),
    ]);
  }

  // Final rendered size (after EXIF rotation) for width/height attributes
  const outMeta = await sharp(path.join(OUT, `${key}-${widths.at(-1)}.jpg`)).metadata();
  manifest.images[key] = {
    widths,
    formats: ['avif', 'webp', 'jpg'],
    width: outMeta.width ?? width,
    height: outMeta.height ?? height,
  };

  if (key === 'hero-markhor') {
    await base.clone().resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(OUT, 'og-cover.jpg'));
  }
  console.log(`✓ ${key}  (${widths.join(', ')}px)`);
}

await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nManifest updated: ${Object.keys(manifest.images).length} photo slot(s) ready.`);
