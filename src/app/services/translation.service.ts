import { HttpClient } from '@angular/common/http';
import { DOCUMENT, Injectable, computed, inject, isDevMode, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LANGUAGES } from '../data/site.data';
import { Dictionary, LanguageCode, LanguageOption } from '../models';

const STORAGE_KEY = 'msayyod.lang';
const DEFAULT_LANGUAGE: LanguageCode = 'en';

type Params = Record<string, string | number>;

// ---- Invisible key markers (visual editor) -----------------------------------
// In edit mode every translated string is prefixed with its key, encoded in
// zero-width characters, so the editor can find which text is which on the page.
const MARK_START = '⁢';
const MARK_END = '⁤';
const DIGITS = ['​', '‌', '‍', '⁠'];
export const MARKER_PATTERN = /⁢([​‌‍⁠]+)⁤/g;
/** Shown in edit mode where a text is empty, so it can still be clicked. */
export const EMPTY_PLACEHOLDER = '✎ …';

function encodeKey(key: string): string {
  let out = MARK_START;
  for (const ch of key) {
    const code = ch.charCodeAt(0) & 255;
    for (let shift = 6; shift >= 0; shift -= 2) out += DIGITS[(code >> shift) & 3];
  }
  return out + MARK_END;
}

export function decodeKey(encoded: string): string {
  let key = '';
  for (let i = 0; i + 3 < encoded.length; i += 4) {
    let code = 0;
    for (let j = 0; j < 4; j++) code = (code << 2) | DIGITS.indexOf(encoded[i + j]);
    key += String.fromCharCode(code);
  }
  return key;
}

export function stripMarkers(text: string): string {
  return text.replace(MARKER_PATTERN, '');
}

/**
 * Lightweight, signal-based i18n. Dictionaries live in /public/i18n/<code>.json
 * and are fetched on demand, then cached for instant switching.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly cache = new Map<LanguageCode, Dictionary>();
  private readonly dictionary = signal<Dictionary>({});

  readonly languages = LANGUAGES;
  /** Visual editor: annotate texts with their keys. */
  readonly editMode = signal(false);
  readonly language = signal<LanguageCode>(DEFAULT_LANGUAGE);
  readonly current = computed<LanguageOption>(
    () => LANGUAGES.find((l) => l.code === this.language()) ?? LANGUAGES[2],
  );

  init(): Promise<void> {
    return this.use(this.detect());
  }

  /** Provide dictionaries up front (from the content API or after an admin save). */
  preload(dictionaries: Partial<Record<LanguageCode, Dictionary>>): void {
    for (const [code, dict] of Object.entries(dictionaries) as [LanguageCode, Dictionary][]) {
      if (dict) this.cache.set(code, dict);
    }
    const active = this.cache.get(this.language());
    if (active && Object.keys(this.dictionary()).length) this.dictionary.set(active);
  }

  async use(code: LanguageCode): Promise<void> {
    try {
      if (!this.cache.has(code)) {
        const dict = await firstValueFrom(this.http.get<Dictionary>(`i18n/${code}.json`));
        this.cache.set(code, dict);
      }
    } catch (error) {
      console.error(`[i18n] Could not load "${code}"`, error);
      if (code !== DEFAULT_LANGUAGE) return this.use(DEFAULT_LANGUAGE);
      return;
    }

    this.dictionary.set(this.cache.get(code)!);
    this.language.set(code);

    const option = LANGUAGES.find((l) => l.code === code)!;
    this.document.documentElement.lang = option.htmlLang;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage unavailable (private mode) — ignore */
    }
  }

  /** Translate a dotted key, e.g. `t('hero.title')`. Supports {{param}} interpolation. */
  t(key: string, params?: Params): string {
    const value = this.resolve(key);
    if (this.editMode()) {
      const text = typeof value === 'string' ? (params ? this.interpolate(value, params) : value) : '';
      return encodeKey(key) + (text.trim() ? text : EMPTY_PLACEHOLDER);
    }
    if (typeof value !== 'string') {
      if (isDevMode() && Object.keys(this.dictionary()).length) {
        console.warn(`[i18n] Missing key "${key}" (${this.language()})`);
      }
      return isDevMode() ? key : '';
    }
    return params ? this.interpolate(value, params) : value;
  }

  /** Like `t()`, but returns '' (silently) when the key is absent — for optional fields. */
  optional(key: string): string {
    const value = this.resolve(key);
    const text = typeof value === 'string' ? value : '';
    if (this.editMode()) return encodeKey(key) + (text.trim() ? text : EMPTY_PLACEHOLDER);
    return text;
  }

  /** All loaded dictionaries (used by the admin panel). */
  dictionaries(): Partial<Record<LanguageCode, Dictionary>> {
    return Object.fromEntries(this.cache.entries());
  }

  /** Return a list of strings or objects stored under a key. */
  list<T = string>(key: string): T[] {
    const value = this.resolve(key);
    if (!Array.isArray(value)) return [];
    return this.editMode() ? (this.markDeep(value, key) as T[]) : (value as T[]);
  }

  /** Edit mode: mark every string inside a list with its full path. */
  private markDeep(node: unknown, path: string): unknown {
    if (typeof node === 'string') return encodeKey(path) + (node.trim() ? node : EMPTY_PLACEHOLDER);
    if (Array.isArray(node)) return node.map((item, i) => this.markDeep(item, `${path}.${i}`));
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, this.markDeep(v, `${path}.${k}`)]));
    }
    return node;
  }

  private resolve(key: string): unknown {
    let node: unknown = this.dictionary();
    for (const part of key.split('.')) {
      if (node === null || typeof node !== 'object') return undefined;
      node = (node as Record<string, unknown>)[part];
    }
    return node;
  }

  private interpolate(text: string, params: Params): string {
    return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) =>
      params[name] !== undefined ? String(params[name]) : '',
    );
  }

  private detect(): LanguageCode {
    const codes = LANGUAGES.map((l) => l.code);
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (stored && codes.includes(stored)) return stored;
    } catch {
      /* ignore */
    }
    const browser = (navigator.languages ?? [navigator.language]).map((l) => l.slice(0, 2));
    for (const lang of browser) {
      if (lang === 'tg') return 'tg';
      if (lang === 'ru') return 'ru';
      if (lang === 'en') return 'en';
    }
    return DEFAULT_LANGUAGE;
  }
}
