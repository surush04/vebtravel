import { Injectable, inject, signal } from '@angular/core';
import { AdminApi } from '../admin/admin-api.service';
import { AdminStore, CollectionName, LANG_CODES } from '../admin/admin-store.service';
import { TranslationService } from './translation.service';

const FLAG = 'msayyod.edit';

export type EditAction =
  | { type: 'list'; path: string; index: number }
  | { type: 'collection'; name: CollectionName; id: string }
  | { type: 'gallery'; id: string };

export type AddAction =
  | { type: 'list'; path: string; shape: string[] | null }
  | { type: 'collection'; name: CollectionName }
  | { type: 'gallery'; category?: string };

const COLLECTIONS: Record<CollectionName, { base: string; prefix: string; empty: Record<string, unknown> }> = {
  activities: {
    base: 'activities.items',
    prefix: 'activity',
    empty: { title: '', summary: '', description: '', points: [], note: '' },
  },
  destinations: { base: 'destinations.items', prefix: 'dest', empty: { name: '', tag: '', text: '' } },
};

/**
 * Visual editor state: the real website becomes the admin panel.
 * Click a text to edit it, use 📷 on photos, ↑ ↓ ✕ / + on lists.
 */
@Injectable({ providedIn: 'root' })
export class EditService {
  private readonly i18n = inject(TranslationService);
  private readonly store = inject(AdminStore);
  private readonly api = inject(AdminApi);

  readonly active = signal(false);
  /** Preview: temporarily behave like the normal site (links work, no outlines). */
  readonly preview = signal(false);
  /** Keys of the text currently being edited. */
  readonly editingKeys = signal<string[] | null>(null);
  /** Photo slot currently being edited. */
  readonly editingPhoto = signal<string | null>(null);
  readonly error = signal('');

  constructor() {
    if (readFlag()) void this.start();
  }

  /** Enter edit mode (called from /admin). */
  async start(): Promise<void> {
    try {
      const required = await this.api.loadMode();
      if (required && !this.api.token()) {
        this.stop(false);
        return;
      }
      writeFlag(true);
      this.store.livePreview = true;
      await this.store.load();
      this.store.applyPreview();
      this.i18n.editMode.set(true);
      this.active.set(true);
    } catch {
      this.error.set('Сервер дастрас нест.');
    }
  }

  /** Leave edit mode (reloads the page to clear all editor annotations). */
  stop(reload = true): void {
    writeFlag(false);
    this.store.livePreview = false;
    this.i18n.editMode.set(false);
    this.active.set(false);
    if (reload) location.reload();
  }

  get clickToEdit(): boolean {
    return this.active() && !this.preview();
  }

  // ---- Lists -----------------------------------------------------------------
  move(action: EditAction, step: -1 | 1): void {
    const s = this.store;
    if (action.type === 'list') s.listMove(action.path, action.index, step);
    else if (action.type === 'collection') {
      const list = s.site[action.name];
      s.moveItem(list, list.findIndex((i) => i.id === action.id), step);
    } else {
      const list = s.site.gallery;
      s.moveItem(list, list.findIndex((g) => g.id === action.id), step);
    }
  }

  remove(action: EditAction): void {
    if (!confirm('Ин ҷузъ нест карда шавад?')) return;
    const s = this.store;
    if (action.type === 'list') s.listRemove(action.path, action.index);
    else if (action.type === 'collection') s.removeItem(action.name, COLLECTIONS[action.name].base, action.id);
    else {
      const item = s.site.gallery.find((g) => g.id === action.id);
      if (item) s.removeGalleryItem(item);
    }
  }

  add(action: AddAction): void {
    const s = this.store;
    if (action.type === 'list') {
      const existing = LANG_CODES.map((l) => s.text(l, action.path)).find((v) => Array.isArray(v) && v.length);
      const sample = existing?.[0];
      const template =
        typeof sample === 'string' || (!sample && !action.shape)
          ? ''
          : Object.fromEntries((sample ? Object.keys(sample) : action.shape!).map((k) => [k, '']));
      s.listAdd(action.path, template);
    } else if (action.type === 'collection') {
      const c = COLLECTIONS[action.name];
      s.addItem(action.name, c.base, c.prefix, structuredClone(c.empty));
    } else {
      const category = action.category ?? s.site.galleryCategories[0] ?? 'nature';
      const item = s.addGalleryItem(category);
      this.editingPhoto.set(item.media);
    }
  }
}

function readFlag(): boolean {
  try {
    return sessionStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
}

function writeFlag(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(FLAG, '1');
    else sessionStorage.removeItem(FLAG);
  } catch {
    /* ignore */
  }
}
