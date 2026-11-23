import { Injectable, inject, signal } from '@angular/core';
import { DEFAULT_SITE } from '../data/site.data';
import {
  Dictionary,
  GalleryItem,
  LangDictionaries,
  LanguageCode,
  MediaManifestEntry,
  SiteContent,
} from '../models';
import { ContentService } from '../services/content.service';
import { MediaService } from '../services/media.service';
import { AdminApi } from './admin-api.service';

export const LANG_CODES: LanguageCode[] = ['tg', 'ru', 'en'];
type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type CollectionName = 'activities' | 'destinations';

/** Read / write a dotted path ("a.b.0.c") inside a JSON object. */
export function getIn(obj: Json, path: string): Json {
  let node = obj;
  for (const part of path.split('.')) {
    if (node === null || node === undefined) return undefined;
    node = node[part];
  }
  return node;
}

export function setIn(obj: Json, path: string, value: Json): void {
  const parts = path.split('.');
  let node = obj;
  parts.slice(0, -1).forEach((part, i) => {
    if (node[part] === null || typeof node[part] !== 'object') {
      node[part] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }
    node = node[part];
  });
  node[parts.at(-1)!] = value;
}

export function deleteIn(obj: Json, path: string): void {
  const parts = path.split('.');
  const parent = getIn(obj, parts.slice(0, -1).join('.')) ?? (parts.length === 1 ? obj : undefined);
  if (!parent) return;
  const last = parts.at(-1)!;
  if (Array.isArray(parent)) parent.splice(Number(last), 1);
  else delete parent[last];
}

const uid = () => Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 5);

/**
 * Draft copy of all editable content. Edits are kept locally until "Save";
 * photo uploads are applied immediately (they are stored by slot name).
 */
@Injectable({ providedIn: 'root' })
export class AdminStore {
  private readonly api = inject(AdminApi);
  private readonly content = inject(ContentService);
  private readonly media = inject(MediaService);

  readonly loaded = signal(false);
  readonly dirty = signal(false);
  readonly saving = signal(false);
  /** Bumped on every change, so templates reading the drafts re-render. */
  readonly rev = signal(0);

  site: SiteContent = structuredClone(DEFAULT_SITE);
  dicts = {} as LangDictionaries;
  images: Record<string, MediaManifestEntry> = {};
  private pendingImageDeletes = new Set<string>();

  async load(force = false): Promise<void> {
    if (this.loaded() && !force) return;
    const payload = await this.api.content();
    this.site = structuredClone({ ...DEFAULT_SITE, ...payload.site, settings: { ...DEFAULT_SITE.settings, ...payload.site.settings } });
    this.dicts = structuredClone(payload.i18n);
    this.images = { ...(payload.media?.images ?? {}) };
    this.pendingImageDeletes.clear();
    this.dirty.set(false);
    this.loaded.set(true);
    this.rev.update((v) => v + 1);
  }

  touch(): void {
    this.dirty.set(true);
    this.rev.update((v) => v + 1);
    if (this.livePreview) this.schedulePreview();
  }

  /** Visual editor: mirror every draft change onto the live page. */
  livePreview = false;
  private previewTimer: ReturnType<typeof setTimeout> | null = null;

  schedulePreview(delay = 120): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.previewTimer = setTimeout(() => this.applyPreview(), delay);
  }

  applyPreview(): void {
    this.previewTimer = null;
    if (!this.loaded()) return;
    this.content.apply(structuredClone({ site: this.site, i18n: this.dicts, media: { images: this.images } }));
  }

  // ---- Texts ----------------------------------------------------------------
  text(lang: LanguageCode, path: string): Json {
    return getIn(this.dicts[lang], path);
  }

  setText(lang: LanguageCode, path: string, value: Json): void {
    setIn(this.dicts[lang], path, value);
    this.touch();
  }

  /** Add an entry to a list in every language. */
  listAdd(path: string, template: Json): void {
    for (const lang of LANG_CODES) {
      let list = getIn(this.dicts[lang], path);
      if (!Array.isArray(list)) {
        list = [];
        setIn(this.dicts[lang], path, list);
      }
      list.push(structuredClone(template));
    }
    this.touch();
  }

  listRemove(path: string, index: number): void {
    for (const lang of LANG_CODES) {
      const list = getIn(this.dicts[lang], path);
      if (Array.isArray(list)) list.splice(index, 1);
    }
    this.touch();
  }

  listMove(path: string, index: number, step: -1 | 1): void {
    for (const lang of LANG_CODES) {
      const list = getIn(this.dicts[lang], path);
      if (Array.isArray(list)) move(list, index, step);
    }
    this.touch();
  }

  // ---- Settings ---------------------------------------------------------------
  setting(path: string): Json {
    return getIn(this.site.settings, path);
  }

  setSetting(path: string, value: Json): void {
    setIn(this.site.settings, path, value);
    this.touch();
  }

  // ---- Activities / destinations ---------------------------------------------------
  addItem(collection: CollectionName, base: string, mediaPrefix: string, empty: Record<string, Json>): string {
    const id = `${mediaPrefix}-${uid()}`;
    this.site[collection].push({ id, media: id });
    for (const lang of LANG_CODES) setIn(this.dicts[lang], `${base}.${id}`, structuredClone(empty));
    this.touch();
    return id;
  }

  removeItem(collection: CollectionName, base: string, id: string): void {
    const item = this.site[collection].find((i) => i.id === id);
    this.site[collection] = this.site[collection].filter((i) => i.id !== id) as never;
    for (const lang of LANG_CODES) {
      deleteIn(this.dicts[lang], `${base}.${id}`);
      if (item) deleteIn(this.dicts[lang], `media.${item.media}`);
    }
    if (item) this.queueImageDelete(item.media);
    this.touch();
  }

  moveItem(list: unknown[], index: number, step: -1 | 1): void {
    move(list, index, step);
    this.touch();
  }

  // ---- Gallery --------------------------------------------------------------------------
  addGalleryItem(category: string): GalleryItem {
    const id = uid();
    const item: GalleryItem = { id: `g-${id}`, media: `gallery-${id}`, category, orientation: 'landscape' };
    this.site.gallery.unshift(item);
    for (const lang of LANG_CODES) setIn(this.dicts[lang], `media.${item.media}`, '');
    this.touch();
    return item;
  }

  removeGalleryItem(item: GalleryItem): void {
    this.site.gallery = this.site.gallery.filter((g) => g.id !== item.id);
    for (const lang of LANG_CODES) deleteIn(this.dicts[lang], `media.${item.media}`);
    this.queueImageDelete(item.media);
    this.touch();
  }

  addCategory(): string {
    const id = `cat-${uid()}`;
    this.site.galleryCategories.push(id);
    for (const lang of LANG_CODES) setIn(this.dicts[lang], `gallery.categories.${id}`, '');
    this.touch();
    return id;
  }

  removeCategory(id: string): void {
    this.site.galleryCategories = this.site.galleryCategories.filter((c) => c !== id);
    for (const lang of LANG_CODES) deleteIn(this.dicts[lang], `gallery.categories.${id}`);
    this.touch();
  }

  // ---- Photos (applied immediately) ----------------------------------------------------
  hasImage(key: string): boolean {
    return !!this.images[key];
  }

  async uploadImage(key: string, file: File): Promise<void> {
    const dataUrl = await readAsDataUrl(file);
    const entry = await this.api.upload(key, dataUrl);
    this.images[key] = entry;
    this.pendingImageDeletes.delete(key);
    this.media.setEntry(key, entry);
    this.rev.update((v) => v + 1);
  }

  async deleteImage(key: string): Promise<void> {
    await this.api.deleteMedia(key);
    delete this.images[key];
    this.media.setEntry(key, null);
    this.rev.update((v) => v + 1);
  }

  private queueImageDelete(key: string): void {
    if (this.images[key]) this.pendingImageDeletes.add(key);
  }

  // ---- Save ----------------------------------------------------------------------------------
  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      for (const lang of LANG_CODES) await this.api.saveI18n(lang, this.dicts[lang] as Dictionary);
      await this.api.saveSite(this.site);
      for (const key of this.pendingImageDeletes) {
        await this.api.deleteMedia(key).catch(() => undefined);
        delete this.images[key];
        this.media.setEntry(key, null);
      }
      this.pendingImageDeletes.clear();
      // Refresh the live site in this tab
      this.content.apply(structuredClone({ site: this.site, i18n: this.dicts, media: { images: this.images } }));
      this.dirty.set(false);
    } finally {
      this.saving.set(false);
    }
  }

  async discard(): Promise<void> {
    await this.load(true);
    if (this.livePreview) this.applyPreview();
  }
}

function move(list: unknown[], index: number, step: -1 | 1): void {
  const target = index + step;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
