import fs from 'node:fs/promises';
import path from 'node:path';

export const LANGS = ['tg', 'ru', 'en'];
const MAX_BACKUPS = 30;

/**
 * JSON file storage with an in-memory cache, atomic writes and automatic
 * backups (data/backups) before every change — so nothing is ever lost.
 */
export class Store {
  constructor(dataDir, rootDir) {
    this.dir = dataDir;
    this.root = rootDir;
    this.cache = new Map();
  }

  file(name) {
    return path.join(this.dir, `${name}.json`);
  }

  async init() {
    await fs.mkdir(path.join(this.dir, 'backups'), { recursive: true });
    await fs.mkdir(path.join(this.dir, 'uploads'), { recursive: true });

    // Seed from the current website content on first start.
    for (const lang of LANGS) {
      await this.seed(`i18n-${lang}`, path.join(this.root, 'public', 'i18n', `${lang}.json`));
    }
    await this.seed('site', path.join(this.root, 'server', 'seed', 'site.json'));
    await this.seed('media', path.join(this.root, 'public', 'images', 'manifest.json'), { images: {} });
    if (!(await this.exists('messages'))) await this.write('messages', []);
  }

  async exists(name) {
    try {
      await fs.access(this.file(name));
      return true;
    } catch {
      return false;
    }
  }

  async seed(name, source, fallback) {
    if (await this.exists(name)) return;
    let data = fallback;
    try {
      data = JSON.parse(await fs.readFile(source, 'utf8'));
    } catch {
      if (fallback === undefined) throw new Error(`Seed file missing: ${source}`);
    }
    await this.write(name, data, { backup: false });
    console.log(`  seeded ${name}`);
  }

  async read(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    const data = JSON.parse(await fs.readFile(this.file(name), 'utf8'));
    this.cache.set(name, data);
    return data;
  }

  async readOptional(name) {
    return (await this.exists(name)) ? this.read(name) : null;
  }

  async write(name, data, { backup = true } = {}) {
    const target = this.file(name);
    if (backup && (await this.exists(name)) && name !== 'auth') {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fs.copyFile(target, path.join(this.dir, 'backups', `${name}-${stamp}.json`));
      await this.prune(name);
    }
    const tmp = `${target}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n');
    await fs.rename(tmp, target);
    this.cache.set(name, data);
  }

  async prune(name) {
    const dir = path.join(this.dir, 'backups');
    const files = (await fs.readdir(dir)).filter((f) => f.startsWith(`${name}-`)).sort();
    for (const f of files.slice(0, Math.max(0, files.length - MAX_BACKUPS))) {
      await fs.rm(path.join(dir, f), { force: true });
    }
  }

  async content() {
    const i18n = {};
    for (const lang of LANGS) i18n[lang] = await this.read(`i18n-${lang}`);
    return { site: await this.read('site'), i18n, media: await this.read('media') };
  }
}
