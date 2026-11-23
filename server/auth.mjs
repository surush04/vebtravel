import crypto from 'node:crypto';

const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return { salt: salt.toString('hex'), hash: hash.toString('hex') };
}

/** Password login + HMAC-signed bearer tokens. Credentials live in data/auth.json. */
export class Auth {
  constructor(store) {
    this.store = store;
  }

  async init() {
    let data = await this.store.readOptional('auth');
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!data) {
      const password = envPassword || crypto.randomBytes(9).toString('base64url');
      data = { secret: crypto.randomBytes(32).toString('hex'), ...hashPassword(password) };
      await this.store.write('auth', data);
      if (!envPassword) {
        console.log('\n  ┌──────────────────────────────────────────────┐');
        console.log('  │  Admin panel initial password:               │');
        console.log(`  │  ${password.padEnd(44)}│`);
        console.log('  │  Change it in Admin → Settings.              │');
        console.log('  └──────────────────────────────────────────────┘\n');
      }
    } else if (envPassword && !this.check(data, envPassword)) {
      Object.assign(data, hashPassword(envPassword));
      await this.store.write('auth', data);
    }
    this.data = data;
  }

  check(data, password) {
    if (typeof password !== 'string' || !password) return false;
    const expected = Buffer.from(data.hash, 'hex');
    const actual = crypto.scryptSync(password, Buffer.from(data.salt, 'hex'), 64);
    return crypto.timingSafeEqual(expected, actual);
  }

  verify(password) {
    return this.check(this.data, password);
  }

  async setPassword(password) {
    Object.assign(this.data, hashPassword(password));
    // Rotating the secret signs everyone else out.
    this.data.secret = crypto.randomBytes(32).toString('hex');
    await this.store.write('auth', this.data);
  }

  sign(payload) {
    return crypto.createHmac('sha256', this.data.secret).update(payload).digest('base64url');
  }

  issue() {
    const payload = b64url(JSON.stringify({ exp: Date.now() + TOKEN_TTL }));
    return `${payload}.${this.sign(payload)}`;
  }

  valid(token) {
    if (typeof token !== 'string') return false;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    const expected = this.sign(payload);
    if (expected.length !== sig.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
    try {
      return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
    } catch {
      return false;
    }
  }

  middleware() {
    return (req, res, next) => {
      const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!this.valid(token)) return res.status(401).json({ error: 'unauthorized' });
      next();
    };
  }
}
