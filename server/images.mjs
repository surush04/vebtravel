import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const WIDTHS = [480, 800, 1200, 1600, 2400];
const FORMATS = ['avif', 'webp', 'jpg'];

/** Convert an uploaded photo into responsive AVIF / WebP / JPEG files. */
export async function processImage(buffer, key, outDir) {
  const base = sharp(buffer, { failOn: 'none' }).rotate();
  const meta = await base.metadata(); // throws for non-images
  if (!meta.width || !meta.height) throw Object.assign(new Error('not an image'), { status: 400 });

  await removeImage(key, outDir);
  const widths = WIDTHS.filter((w) => w <= meta.width);
  if (!widths.length) widths.push(meta.width);

  for (const w of widths) {
    const resized = base.clone().resize({ width: w, withoutEnlargement: true });
    await Promise.all([
      resized.clone().avif({ quality: 52, effort: 4 }).toFile(path.join(outDir, `${key}-${w}.avif`)),
      resized.clone().webp({ quality: 74 }).toFile(path.join(outDir, `${key}-${w}.webp`)),
      resized.clone().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(path.join(outDir, `${key}-${w}.jpg`)),
    ]);
  }

  if (key === 'hero-markhor') {
    await base.clone().resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(outDir, 'og-cover.jpg'));
  }

  const out = await sharp(path.join(outDir, `${key}-${widths.at(-1)}.jpg`)).metadata();
  return { widths, formats: FORMATS, width: out.width, height: out.height, v: Date.now() };
}

export async function removeImage(key, outDir) {
  const files = await fs.readdir(outDir).catch(() => []);
  const pattern = new RegExp(`^${key}-\\d+\\.(avif|webp|jpg)$`);
  await Promise.all(files.filter((f) => pattern.test(f)).map((f) => fs.rm(path.join(outDir, f), { force: true })));
}
