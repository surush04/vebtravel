import { SceneTone } from '../../../models';

/**
 * Generates atmospheric, layered mountain-ridge artwork used as a placeholder
 * until real photography is supplied. Deterministic per seed, ~3–5 KB each.
 */
interface Palette {
  skyTop: string;
  skyBottom: string;
  haze: string;
  near: string;
  sun: string;
}

const PALETTES: Record<SceneTone, Palette> = {
  dawn: { skyTop: '#161d19', skyBottom: '#ad8e62', haze: '#c8b18a', near: '#101512', sun: '#f0d8a6' },
  dusk: { skyTop: '#111613', skyBottom: '#6c5236', haze: '#957a55', near: '#0c100e', sun: '#e2b878' },
  mist: { skyTop: '#252e29', skyBottom: '#a3a79b', haze: '#bfc0b3', near: '#141a17', sun: '#efe8d8' },
  forest: { skyTop: '#0e1d17', skyBottom: '#4a6555', haze: '#6d8876', near: '#0a140f', sun: '#d8cfa8' },
  night: { skyTop: '#080b0a', skyBottom: '#232e28', haze: '#3b4941', near: '#060908', sun: '#c5a46d' },
  snow: { skyTop: '#33403a', skyBottom: '#d3cfc3', haze: '#e6e0d3', near: '#19201c', sun: '#ffffff' },
};

const cache = new Map<string, string>();

function random(seed: number): () => number {
  let s = Math.abs(Math.floor(seed * 9301 + 49297)) % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

function buildSvg(tone: SceneTone, seed: number): string {
  const w = 1600;
  const h = 1000;
  const p = PALETTES[tone];
  const r = random(seed);
  const layers = 5;

  const sunX = w * (0.2 + r() * 0.6);
  const sunY = h * (0.22 + r() * 0.14);

  let body =
    `<rect width="${w}" height="${h}" fill="url(#s)"/>` +
    `<circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="${h * 0.5}" fill="url(#g)"/>`;

  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const color = mix(p.haze, p.near, Math.pow(t, 0.8));
    const base = h * (0.4 + t * 0.36);
    const amp = h * (0.17 - t * 0.06);
    const freq = ((1.3 + r() * 1.5 + i * 0.55) * Math.PI) / w;
    const phase = r() * Math.PI * 2;
    const steps = 56 + i * 14;

    let d = `M0 ${h}`;
    for (let s = 0; s <= steps; s++) {
      const x = (s / steps) * w;
      const peak = 1 - Math.abs(Math.sin(x * freq + phase));
      const roll = Math.sin(x * freq * 0.37 + phase * 1.7) * 0.5 + 0.5;
      const jitter = (r() - 0.5) * 0.1;
      const y = base - amp * (Math.pow(peak, 1.6) * 0.78 + roll * 0.34 + jitter);
      d += `L${x.toFixed(0)} ${y.toFixed(0)}`;
    }
    body += `<path d="${d}L${w} ${h}Z" fill="${color}"/>`;

    if (i < layers - 1) {
      body += `<rect y="${(base - amp * 0.25).toFixed(0)}" width="${w}" height="${h * 0.2}" fill="url(#f)" opacity="${(0.55 - t * 0.3).toFixed(2)}"/>`;
    }
  }

  const defs =
    `<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.skyTop}"/><stop offset="1" stop-color="${p.skyBottom}"/></linearGradient>` +
    `<radialGradient id="g"><stop offset="0" stop-color="${p.sun}" stop-opacity=".5"/><stop offset="1" stop-color="${p.sun}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.haze}" stop-opacity="0"/><stop offset="1" stop-color="${p.haze}" stop-opacity=".6"/></linearGradient>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;
}

/** CSS `background-image` value for a scene. */
export function sceneBackground(tone: SceneTone, seed: number): string {
  const id = `${tone}:${seed}`;
  let value = cache.get(id);
  if (!value) {
    value = `url("data:image/svg+xml,${encodeURIComponent(buildSvg(tone, seed))}")`;
    cache.set(id, value);
  }
  return value;
}
