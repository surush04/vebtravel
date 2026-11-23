#!/usr/bin/env node
// Reset the admin password:  npm run admin:password -- "new-password"
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Auth } from '../server/auth.mjs';
import { Store } from '../server/store.mjs';

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: npm run admin:password -- "new-password"   (at least 8 characters)');
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = new Store(process.env.DATA_DIR || path.join(root, 'server', 'data'), root);
await store.init();
const auth = new Auth(store);
await auth.init();
await auth.setPassword(password);
console.log('Admin password updated. All existing sessions were signed out.');
