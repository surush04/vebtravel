import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { MediaComponent } from '../../shared/components/media/media';
import { L } from '../admin.labels';
import { AdminStore, CollectionName } from '../admin-store.service';
import { ImageFieldComponent } from '../components/image-field';
import { LangFieldComponent } from '../components/lang-field';
import { StringListComponent } from '../components/string-list';

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'list';
}

interface CollectionDef {
  title: string;
  base: string;
  prefix: string;
  titleField: string;
  addLabel: string;
  fields: FieldDef[];
}

const DEFS: Record<CollectionName, CollectionDef> = {
  activities: {
    title: L.nav.activities,
    base: 'activities.items',
    prefix: 'activity',
    titleField: 'title',
    addLabel: 'Фаъолияти нав',
    fields: [
      { key: 'title', label: 'Ном', type: 'text' },
      { key: 'summary', label: 'Тавсифи кӯтоҳ (дар корт)', type: 'textarea' },
      { key: 'description', label: 'Тавсифи пурра (саҳифаи фаъолиятҳо)', type: 'textarea' },
      { key: 'points', label: 'Чӣ интизори шумост — бандҳо', type: 'list' },
      { key: 'note', label: 'Эзоҳи муҳим (ихтиёрӣ)', type: 'textarea' },
    ],
  },
  destinations: {
    title: L.nav.destinations,
    base: 'destinations.items',
    prefix: 'dest',
    titleField: 'name',
    addLabel: 'Макони нав',
    fields: [
      { key: 'name', label: 'Ном', type: 'text' },
      { key: 'tag', label: 'Барчасп (масалан: Деҳа · Дарвоз)', type: 'text' },
      { key: 'text', label: 'Тавсиф', type: 'textarea' },
    ],
  },
};

@Component({
  selector: 'adm-collection',
  imports: [MediaComponent, ImageFieldComponent, LangFieldComponent, StringListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _rev = store.rev();
    @let d = def();
    <div class="adm-pagehead" [attr.data-rev]="_rev">
      <h1 class="adm-h1">{{ d.title }}</h1>
      <button type="button" class="adm-btn adm-btn--primary" (click)="add()">+ {{ d.addLabel }}</button>
    </div>

    <div class="adm-split adm-split--wide">
      <ol class="adm-list">
        @for (item of items(); track item.id; let i = $index; let first = $first; let last = $last) {
          <li class="adm-list__item" [class.is-active]="item.id === selectedId()">
            <button type="button" class="adm-list__main" (click)="selectedId.set(item.id)">
              <span class="adm-list__thumb"><app-media [key]="item.media" sizes="80px" [decorative]="true" /></span>
              <span class="adm-list__text">
                <strong>{{ titleOf(item.id) || '—' }}</strong>
                <small>{{ item.id }}</small>
              </span>
            </button>
            <div class="adm-row__tools">
              <button type="button" class="adm-icon-btn" [disabled]="first" (click)="store.moveItem(items(), i, -1)" [attr.aria-label]="L.up">↑</button>
              <button type="button" class="adm-icon-btn" [disabled]="last" (click)="store.moveItem(items(), i, 1)" [attr.aria-label]="L.down">↓</button>
            </div>
          </li>
        } @empty {
          <li class="adm-muted">{{ L.empty }}</li>
        }
      </ol>

      @if (selected(); as item) {
        <section class="adm-panel">
          <div class="adm-pagehead">
            <h2 class="adm-h2">{{ titleOf(item.id) || d.addLabel }}</h2>
            <button type="button" class="adm-btn adm-btn--ghost adm-btn--danger adm-btn--sm" (click)="remove(item.id)">{{ L.delete }}</button>
          </div>

          <div class="adm-grid-2">
            <div>
              <p class="adm-label">Акс</p>
              <adm-image-field [key]="item.media" ratio="4 / 5" />
            </div>
            <div>
              <adm-lang-field [path]="'media.' + item.media" [label]="L.image.alt" [multiline]="false" />
            </div>
          </div>

          @for (f of d.fields; track f.key) {
            @if (f.type === 'list') {
              <adm-string-list [path]="d.base + '.' + item.id + '.' + f.key" [label]="f.label" />
            } @else {
              <adm-lang-field [path]="d.base + '.' + item.id + '.' + f.key" [label]="f.label" [multiline]="f.type === 'textarea'" />
            }
          }
        </section>
      } @else {
        <p class="adm-muted">Ҷузъро аз рӯйхат интихоб кунед.</p>
      }
    </div>
  `,
})
export class CollectionPage {
  protected readonly store = inject(AdminStore);
  protected readonly L = L;

  private readonly name = toSignal(
    inject(ActivatedRoute).data.pipe(map((d) => d['collection'] as CollectionName)),
    { requireSync: true },
  );
  protected readonly def = computed(() => DEFS[this.name()]);
  protected readonly selectedId = signal<string | null>(null);

  protected readonly items = computed(() => {
    this.store.rev();
    return this.store.site[this.name()];
  });

  protected readonly selected = computed(() => {
    const list = this.items();
    return list.find((i) => i.id === this.selectedId()) ?? list[0] ?? null;
  });

  protected titleOf(id: string): string {
    const d = this.def();
    for (const lang of ['tg', 'ru', 'en'] as const) {
      const v = this.store.text(lang, `${d.base}.${id}.${d.titleField}`);
      if (typeof v === 'string' && v.trim()) return v;
    }
    return '';
  }

  protected add(): void {
    const d = this.def();
    const empty = Object.fromEntries(d.fields.map((f) => [f.key, f.type === 'list' ? [] : '']));
    const id = this.store.addItem(this.name(), d.base, d.prefix, empty);
    this.selectedId.set(id);
  }

  protected remove(id: string): void {
    if (!confirm(L.deleteConfirm)) return;
    this.store.removeItem(this.name(), this.def().base, id);
    this.selectedId.set(null);
  }
}
