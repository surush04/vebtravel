import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { L } from '../admin.labels';
import { AdminStore } from '../admin-store.service';
import { LangFieldComponent } from './lang-field';

/** A list of texts (e.g. bullet points) edited in all three languages at once. */
@Component({
  selector: 'adm-string-list',
  imports: [LangFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-group">
      <div class="adm-group__head">
        <span class="adm-label">{{ label() }}</span>
        <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" (click)="add()">+ {{ L.add }}</button>
      </div>
      @for (i of indexes(); track i) {
        <div class="adm-row">
          <adm-lang-field class="adm-row__main" [path]="path() + '.' + i" [label]="'#' + (i + 1)" />
          <div class="adm-row__tools">
            <button type="button" class="adm-icon-btn" [disabled]="i === 0" (click)="store.listMove(path(), i, -1)" [attr.aria-label]="L.up">↑</button>
            <button type="button" class="adm-icon-btn" [disabled]="i === indexes().length - 1" (click)="store.listMove(path(), i, 1)" [attr.aria-label]="L.down">↓</button>
            <button type="button" class="adm-icon-btn adm-icon-btn--danger" (click)="remove(i)" [attr.aria-label]="L.delete">✕</button>
          </div>
        </div>
      } @empty {
        <p class="adm-muted">{{ L.empty }}</p>
      }
    </div>
  `,
})
export class StringListComponent {
  readonly path = input.required<string>();
  readonly label = input('');

  protected readonly store = inject(AdminStore);
  protected readonly L = L;

  protected readonly indexes = computed(() => {
    this.store.rev();
    const lengths = (['tg', 'ru', 'en'] as const).map((l) => {
      const v = this.store.text(l, this.path());
      return Array.isArray(v) ? v.length : 0;
    });
    return Array.from({ length: Math.max(...lengths) }, (_, i) => i);
  });

  protected add(): void {
    this.store.listAdd(this.path(), '');
  }

  protected remove(i: number): void {
    if (confirm(L.deleteConfirm)) this.store.listRemove(this.path(), i);
  }
}
