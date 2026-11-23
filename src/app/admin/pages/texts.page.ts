import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FIELD_LABELS, L, SECTION_LABELS } from '../admin.labels';
import { AdminStore } from '../admin-store.service';
import { LangFieldComponent } from '../components/lang-field';
import { StringListComponent } from '../components/string-list';

/** Paths edited on dedicated pages (activities, destinations, gallery, photos). */
const EXCLUDED = new Set(['media', 'activities.items', 'destinations.items', 'gallery.categories']);
/** Lists of objects and the shape of a new entry (used when a list becomes empty). */
const OBJECT_LISTS: Record<string, string[]> = {
  'about.timeline': ['year', 'title', 'text'],
  'about.values': ['title', 'text'],
  'conservation.pillars': ['title', 'text'],
  'conservation.principles': ['title', 'text'],
  'why.items': ['title', 'text'],
};
const SECTION_ORDER = ['meta', 'nav', 'hero', 'about', 'activities', 'destinations', 'conservation', 'gallery', 'why', 'contact', 'footer', 'pages', 'seo', 'common', 'a11y'];

type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any

@Component({
  selector: 'adm-texts',
  imports: [NgTemplateOutlet, LangFieldComponent, StringListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _rev = store.rev();
    <h1 class="adm-h1">{{ L.nav.texts }}</h1>
    <p class="adm-muted adm-intro">
      Ҳар матн бо се забон таҳрир мешавад. Барои сатри нав дар сарлавҳаҳо Enter-ро истифода баред.
      Фаъолиятҳо, маконҳо ва галерея дар бахшҳои алоҳида идора мешаванд.
    </p>

    <div class="adm-split" [attr.data-rev]="_rev">
      <nav class="adm-tabs" aria-label="Бахшҳо">
        @for (s of sections(); track s) {
          <button type="button" class="adm-tab" [class.is-active]="s === active()" (click)="active.set(s)">{{ sectionLabel(s) }}</button>
        }
      </nav>

      <section class="adm-panel">
        <h2 class="adm-h2">{{ sectionLabel(active()) }}</h2>
        <ng-container *ngTemplateOutlet="node; context: { path: active(), value: reference(active()) }" />
      </section>
    </div>

    <ng-template #node let-path="path" let-value="value">
      @if (isString(value)) {
        <adm-lang-field [path]="path" [label]="fieldLabel(path)" [hint]="path" [multiline]="isMultiline(path)" />
      } @else if (isObjectArray(value, path)) {
        <div class="adm-group">
          <div class="adm-group__head">
            <span class="adm-label">{{ fieldLabel(path) }}</span>
            <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" (click)="addObject(path, value)">+ {{ L.add }}</button>
          </div>
          @for (item of value; track $index; let i = $index; let last = $last) {
            <div class="adm-card adm-card--nested">
              <div class="adm-card__head">
                <span class="adm-badge">#{{ i + 1 }}</span>
                <div class="adm-row__tools">
                  <button type="button" class="adm-icon-btn" [disabled]="i === 0" (click)="store.listMove(path, i, -1)" [attr.aria-label]="L.up">↑</button>
                  <button type="button" class="adm-icon-btn" [disabled]="last" (click)="store.listMove(path, i, 1)" [attr.aria-label]="L.down">↓</button>
                  <button type="button" class="adm-icon-btn adm-icon-btn--danger" (click)="removeObject(path, i)" [attr.aria-label]="L.delete">✕</button>
                </div>
              </div>
              @for (k of keys(item); track k) {
                <ng-container *ngTemplateOutlet="node; context: { path: path + '.' + i + '.' + k, value: item[k] }" />
              }
            </div>
          }
        </div>
      } @else if (isStringArray(value)) {
        <adm-string-list [path]="path" [label]="fieldLabel(path)" />
      } @else if (isObject(value)) {
        <div class="adm-fieldset" [class.adm-fieldset--root]="!path.includes('.')">
          @if (path.includes('.')) { <p class="adm-fieldset__title">{{ fieldLabel(path) }}</p> }
          @for (k of keys(value); track k) {
            @if (!isExcluded(path + '.' + k)) {
              <ng-container *ngTemplateOutlet="node; context: { path: path + '.' + k, value: value[k] }" />
            }
          }
        </div>
      }
    </ng-template>
  `,
})
export class TextsPage {
  protected readonly store = inject(AdminStore);
  protected readonly L = L;
  protected readonly active = signal('hero');

  protected readonly sections = computed(() => {
    this.store.rev();
    const keys = Object.keys(this.store.dicts.en ?? {}).filter((k) => !EXCLUDED.has(k));
    return keys.sort((a, b) => order(a) - order(b));
  });

  /** English dictionary defines the structure; all three languages are edited. */
  protected reference(path: string): Json {
    for (const lang of ['en', 'ru', 'tg'] as const) {
      const v = this.store.text(lang, path);
      if (v !== undefined) return v;
    }
    return undefined;
  }

  protected sectionLabel(key: string): string {
    return SECTION_LABELS[key] ?? key;
  }

  protected fieldLabel(path: string): string {
    const key = path.split('.').filter((p) => !/^\d+$/.test(p)).at(-1) ?? path;
    return FIELD_LABELS[key] ?? key;
  }

  protected keys(obj: Json): string[] {
    return obj && typeof obj === 'object' ? Object.keys(obj) : [];
  }

  protected isExcluded(path: string): boolean {
    return EXCLUDED.has(path);
  }

  protected isString(v: Json): boolean {
    return typeof v === 'string';
  }

  protected isStringArray(v: Json): boolean {
    return Array.isArray(v) && v.every((x) => typeof x === 'string');
  }

  protected isObjectArray(v: Json, path: string): boolean {
    if (!Array.isArray(v)) return false;
    return v.length ? v.every((x) => x && typeof x === 'object') : path in OBJECT_LISTS;
  }

  protected isObject(v: Json): boolean {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }

  protected isMultiline(path: string): boolean | null {
    return /(\.title|ctaTitle)$/.test(path) && !path.startsWith('seo.') ? true : null;
  }

  protected addObject(path: string, list: Json[]): void {
    const shape = list[0] ? Object.keys(list[0]) : (OBJECT_LISTS[path] ?? ['title', 'text']);
    const template = Object.fromEntries(shape.map((k) => [k, '']));
    this.store.listAdd(path, template);
  }

  protected removeObject(path: string, index: number): void {
    if (confirm(L.deleteConfirm)) this.store.listRemove(path, index);
  }
}

function order(key: string): number {
  const i = SECTION_ORDER.indexOf(key);
  return i === -1 ? 99 : i;
}
