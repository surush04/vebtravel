import { HttpClient } from '@angular/common/http';
import { DOCUMENT, Injectable, computed, inject, isDevMode, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LANGUAGES } from '../data/site.data';
import { Dictionary, LanguageCode, LanguageOption } from '../models';

const STORAGE_KEY = 'msayyod.lang';
const DEFAULT_LANGUAGE: LanguageCode = 'en';

type Params = Record<string, string | number>;

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
    return typeof value === 'string' ? value : '';
  }

  /** All loaded dictionaries (used by the admin panel). */
  dictionaries(): Partial<Record<LanguageCode, Dictionary>> {
    return Object.fromEntries(this.cache.entries());
  }

  /** Return a list of strings or objects stored under a key. */
  list<T = string>(key: string): T[] {
    const value = this.resolve(key);
    return Array.isArray(value) ? (value as T[]) : [];
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
