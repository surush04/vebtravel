#!/usr/bin/env node
// Runs the API server (port 3000) and the Angular dev server (port 4300, proxied) together.
import { spawn } from 'node:child_process';

const opts = { stdio: 'inherit', shell: true };
const procs = [
  spawn('node server/index.mjs', opts),
  spawn(`npx ng serve --port ${process.env.NG_PORT || 4300}`, opts),
];
const stop = () => procs.forEach((p) => p.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', (code) => code && stop()));
