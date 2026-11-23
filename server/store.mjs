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

    // Seed on first start. When DATA_DIR points elsewhere (e.g. a Render disk),
    // the content committed in the repository (server/data) is copied first.
    const repoData = path.join(this.root, 'server', 'data');
    const fromRepo = path.resolve(repoData) !== path.resolve(this.dir);
    const src = (name, fallback) => (fromRepo ? [path.join(repoData, `${name}.json`), fallback] : [fallback]);

    for (const lang of LANGS) {
      await this.seed(`i18n-${lang}`, src(`i18n-${lang}`, path.join(this.root, 'public', 'i18n', `${lang}.json`)));
    }
    await this.seed('site', src('site', path.join(this.root, 'server', 'seed', 'site.json')));
    await this.seed('media', src('media', path.join(this.root, 'public', 'images', 'manifest.json')), { images: {} });
    if (!(await this.exists('messages'))) await this.write('messages', []);
    if (fromRepo) await this.seedUploads(path.join(repoData, 'uploads'));
  }

  /** Copy committed photos into an empty uploads directory. */
  async seedUploads(source) {
    const target = path.join(this.dir, 'uploads');
    if ((await fs.readdir(target)).length) return;
    const files = await fs.readdir(source).catch(() => []);
    for (const f of files) await fs.copyFile(path.join(source, f), path.join(target, f));
    if (files.length) console.log(`  seeded ${files.length} photo files`);
  }

  async exists(name) {
    try {
      await fs.access(this.file(name));
      return true;
    } catch {
      return false;
    }
  }

  async seed(name, sources, fallback) {
    if (await this.exists(name)) return;
    let data = fallback;
    let found = false;
    for (const source of sources) {
      try {
        data = JSON.parse(await fs.readFile(source, 'utf8'));
        found = true;
        break;
      } catch {
        /* try next source */
      }
    }
    if (!found && fallback === undefined) throw new Error(`Seed file missing: ${sources.join(', ')}`);
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
