/**
 * M-SAYYOD — content API + admin backend + production web server.
 *
 *   npm run server        → http://localhost:3000  (API, admin, uploaded images, built site)
 *
 * Environment: PORT (3000), DATA_DIR (server/data), ADMIN_PASSWORD (optional).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Auth } from './auth.mjs';
import { processImage, removeImage } from './images.mjs';
import { LANGS, Store } from './store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 3000);
const DATA = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'server', 'data');
const UPLOADS = path.join(DATA, 'uploads');
const DIST = path.join(ROOT, 'dist', 'm-sayyod', 'browser');
const KEY = /^[a-z0-9][a-z0-9-]{0,63}$/;

const store = new Store(DATA, ROOT);
await store.init();
const auth = new Auth(store);
await auth.init();

const app = express();
app.disable('x-powered-by');
// Behind one reverse proxy (Render, Nginx) — needed for correct client IPs in rate limiting.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.use(express.json({ limit: '40mb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ---- tiny in-memory rate limiter -------------------------------------------
function limiter(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || entry.reset < now) hits.set(req.ip, { count: 1, reset: now + windowMs });
    else if (++entry.count > max) return res.status(429).json({ error: 'too many requests' });
    next();
  };
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---- Public ------------------------------------------------------------------
app.get('/healthz', (req, res) => res.json({ ok: true }));

app.get('/api/content', wrap(async (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(await store.content());
}));

app.post('/api/messages', limiter(8, 10 * 60 * 1000), wrap(async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  const msg = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    name: str(b.name, 120),
    email: str(b.email, 160),
    phone: str(b.phone, 40),
    country: str(b.country, 80),
    activity: str(b.activity, 64),
    message: str(b.message, 4000),
    language: LANGS.includes(b.language) ? b.language : 'en',
    read: false,
  };
  if (!msg.name || !/^\S+@\S+\.\S+$/.test(msg.email) || msg.message.length < 2) {
    return res.status(400).json({ error: 'invalid' });
  }
  const messages = await store.read('messages');
  await store.write('messages', [msg, ...messages].slice(0, 5000), { backup: false });
  res.status(201).json({ ok: true });
}));

app.post('/api/auth/login', limiter(10, 15 * 60 * 1000), (req, res) => {
  if (!auth.verify(req.body?.password)) return res.status(401).json({ error: 'invalid password' });
  res.json({ token: auth.issue() });
});

// ---- Admin (token required) ---------------------------------------------------
const admin = express.Router();
admin.use(auth.middleware());

admin.get('/session', (req, res) => res.json({ ok: true }));

admin.put('/site', wrap(async (req, res) => {
  const site = req.body;
  if (!isObject(site) || !isObject(site.settings) || !Array.isArray(site.activities) || !Array.isArray(site.destinations) || !Array.isArray(site.gallery)) {
    return res.status(400).json({ error: 'invalid site' });
  }
  await store.write('site', site);
  res.json({ ok: true });
}));

admin.put('/i18n/:lang', wrap(async (req, res) => {
  if (!LANGS.includes(req.params.lang) || !isObject(req.body)) return res.status(400).json({ error: 'invalid' });
  await store.write(`i18n-${req.params.lang}`, req.body);
  res.json({ ok: true });
}));

admin.post('/media/:key', wrap(async (req, res) => {
  const { key } = req.params;
  const data = req.body?.data;
  if (!KEY.test(key) || typeof data !== 'string') return res.status(400).json({ error: 'invalid' });
  const buffer = Buffer.from(data.replace(/^data:[^;]+;base64,/, ''), 'base64');
  let entry;
  try {
    entry = await processImage(buffer, key, UPLOADS);
  } catch (e) {
    return res.status(400).json({ error: 'not an image' });
  }
  const media = await store.read('media');
  media.images = { ...media.images, [key]: entry };
  await store.write('media', media, { backup: false });
  res.json(entry);
}));

admin.delete('/media/:key', wrap(async (req, res) => {
  const { key } = req.params;
  if (!KEY.test(key)) return res.status(400).json({ error: 'invalid' });
  await removeImage(key, UPLOADS);
  const media = await store.read('media');
  delete media.images[key];
  await store.write('media', media, { backup: false });
  res.json({ ok: true });
}));

admin.get('/messages', wrap(async (req, res) => res.json(await store.read('messages'))));

admin.patch('/messages/:id', wrap(async (req, res) => {
  const messages = await store.read('messages');
  const msg = messages.find((m) => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'not found' });
  msg.read = !!req.body?.read;
  await store.write('messages', messages, { backup: false });
  res.json(msg);
}));

admin.delete('/messages/:id', wrap(async (req, res) => {
  const messages = await store.read('messages');
  await store.write('messages', messages.filter((m) => m.id !== req.params.id));
  res.json({ ok: true });
}));

admin.put('/password', wrap(async (req, res) => {
  const { current, next } = req.body || {};
  if (!auth.verify(current)) return res.status(403).json({ error: 'wrong password' });
  if (typeof next !== 'string' || next.length < 8) return res.status(400).json({ error: 'too short' });
  await auth.setPassword(next);
  res.json({ token: auth.issue() });
}));

app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }));

// ---- Images & website ------------------------------------------------------------
app.use('/images', express.static(UPLOADS, { maxAge: '7d' }), express.static(path.join(ROOT, 'public', 'images')));

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: '1h' }));
  app.get(/.*/, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  console.warn('  ! dist/ not found — run "npm run build" before starting the server.');
  app.get(/.*/, (req, res) =>
    res.status(503).type('text').send('Site is not built yet. Build command: npm install --include=dev && npm run build'),
  );
}

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'file too large' });
  console.error(err);
  res.status(err.status || 500).json({ error: 'server error' });
});

app.listen(PORT, () => {
  console.log(`  M-SAYYOD server → http://localhost:${PORT}`);
  console.log(`  Admin panel     → http://localhost:${PORT}/admin`);
  console.log(`  Data directory  → ${DATA}`);
});
