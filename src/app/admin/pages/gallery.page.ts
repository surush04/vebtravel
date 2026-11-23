import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GalleryItem, Orientation } from '../../models';
import { L } from '../admin.labels';
import { AdminStore } from '../admin-store.service';
import { ImageFieldComponent } from '../components/image-field';
import { LangFieldComponent } from '../components/lang-field';

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: 'landscape', label: 'Уфуқӣ (3:2)' },
  { value: 'portrait', label: 'Амудӣ (4:5)' },
  { value: 'square', label: 'Мураббаъ (1:1)' },
];
const RATIOS: Record<Orientation, string> = { landscape: '3 / 2', portrait: '4 / 5', square: '1 / 1' };

@Component({
  selector: 'adm-gallery',
  imports: [ImageFieldComponent, LangFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _rev = store.rev();
    <div class="adm-pagehead" [attr.data-rev]="_rev">
      <h1 class="adm-h1">{{ L.nav.gallery }}</h1>
      <button type="button" class="adm-btn adm-btn--primary" (click)="addItem()">+ Акси нав</button>
    </div>

    <!-- Categories -->
    <details class="adm-card adm-collapsible" [open]="categoriesOpen()">
      <summary (click)="toggleCategories($event)">Категорияҳо ({{ categories().length }})</summary>
      @for (c of categories(); track c; let i = $index; let first = $first; let last = $last) {
        <div class="adm-row">
          <adm-lang-field class="adm-row__main" [path]="'gallery.categories.' + c" [label]="c" [hint]="usage(c) + ' акс'" />
          <div class="adm-row__tools">
            <button type="button" class="adm-icon-btn" [disabled]="first" (click)="store.moveItem(store.site.galleryCategories, i, -1)" [attr.aria-label]="L.up">↑</button>
            <button type="button" class="adm-icon-btn" [disabled]="last" (click)="store.moveItem(store.site.galleryCategories, i, 1)" [attr.aria-label]="L.down">↓</button>
            <button type="button" class="adm-icon-btn adm-icon-btn--danger" (click)="removeCategory(c)" [attr.aria-label]="L.delete">✕</button>
          </div>
        </div>
      }
      <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" (click)="store.addCategory()">+ Категорияи нав</button>
      @if (categoryError()) { <p class="adm-error">{{ categoryError() }}</p> }
    </details>

    <!-- Filter -->
    <div class="adm-chips">
      <button type="button" class="adm-chip" [class.is-active]="filter() === 'all'" (click)="filter.set('all')">Ҳама ({{ store.site.gallery.length }})</button>
      @for (c of categories(); track c) {
        <button type="button" class="adm-chip" [class.is-active]="filter() === c" (click)="filter.set(c)">{{ categoryLabel(c) }} ({{ usage(c) }})</button>
      }
    </div>

    <div class="adm-gallery">
      @for (item of items(); track item.id) {
        <article class="adm-card adm-gallery__item">
          <adm-image-field [key]="item.media" [ratio]="ratio(item)" />
          <div class="adm-grid-2 adm-grid-2--tight">
            <label class="adm-input">
              <span class="adm-label">Категория</span>
              <select [value]="item.category" (change)="setField(item, 'category', $event)">
                @for (c of categories(); track c) {
                  <option [value]="c" [selected]="c === item.category">{{ categoryLabel(c) }}</option>
                }
              </select>
            </label>
            <label class="adm-input">
              <span class="adm-label">Шакл</span>
              <select (change)="setField(item, 'orientation', $event)">
                @for (o of orientations; track o.value) {
                  <option [value]="o.value" [selected]="o.value === item.orientation">{{ o.label }}</option>
                }
              </select>
            </label>
          </div>
          <adm-lang-field [path]="'media.' + item.media" label="Имзо / тавсифи акс" [multiline]="false" />
          <div class="adm-card__foot">
            <div class="adm-row__tools">
              <button type="button" class="adm-icon-btn" (click)="move(item, -1)" [attr.aria-label]="L.up">←</button>
              <button type="button" class="adm-icon-btn" (click)="move(item, 1)" [attr.aria-label]="L.down">→</button>
            </div>
            <button type="button" class="adm-btn adm-btn--ghost adm-btn--danger adm-btn--sm" (click)="remove(item)">{{ L.delete }}</button>
          </div>
        </article>
      } @empty {
        <p class="adm-muted">{{ L.empty }}</p>
      }
    </div>
  `,
})
export class GalleryAdminPage {
  protected readonly store = inject(AdminStore);
  protected readonly L = L;
  protected readonly orientations = ORIENTATIONS;
  protected readonly filter = signal<string>('all');
  protected readonly categoriesOpen = signal(false);
  protected readonly categoryError = signal('');

  protected readonly categories = computed(() => {
    this.store.rev();
    return [...this.store.site.galleryCategories];
  });

  protected readonly items = computed(() => {
    this.store.rev();
    const f = this.filter();
    return this.store.site.gallery.filter((g) => f === 'all' || g.category === f);
  });

  protected ratio(item: GalleryItem): string {
    return RATIOS[item.orientation];
  }

  protected usage(category: string): number {
    return this.store.site.gallery.filter((g) => g.category === category).length;
  }

  protected categoryLabel(id: string): string {
    return this.store.text('tg', `gallery.categories.${id}`) || this.store.text('en', `gallery.categories.${id}`) || id;
  }

  protected toggleCategories(event: Event): void {
    event.preventDefault();
    this.categoriesOpen.update((v) => !v);
  }

  protected addItem(): void {
    const category = this.filter() !== 'all' ? this.filter() : (this.categories()[0] ?? 'nature');
    this.store.addGalleryItem(category);
  }

  protected setField(item: GalleryItem, field: 'category' | 'orientation', event: Event): void {
    (item as unknown as Record<string, string>)[field] = (event.target as HTMLSelectElement).value;
    this.store.touch();
  }

  protected move(item: GalleryItem, step: -1 | 1): void {
    const list = this.store.site.gallery;
    this.store.moveItem(list, list.indexOf(item), step);
  }

  protected remove(item: GalleryItem): void {
    if (confirm(L.deleteConfirm)) this.store.removeGalleryItem(item);
  }

  protected removeCategory(id: string): void {
    const used = this.usage(id);
    if (used) {
      this.categoryError.set(`Ин категория ${used} акс дорад. Аввал аксҳоро ба категорияи дигар гузаронед.`);
      return;
    }
    this.categoryError.set('');
    if (confirm(L.deleteConfirm)) this.store.removeCategory(id);
  }
}
