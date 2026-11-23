import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MediaComponent } from '../../shared/components/media/media';
import { L } from '../admin.labels';
import { AdminStore } from '../admin-store.service';

const MAX_BYTES = 25 * 1024 * 1024;

/** Upload / replace / remove the photo of one photo slot. Applied immediately. */
@Component({
  selector: 'adm-image-field',
  imports: [MediaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-image" [class.is-busy]="busy()">
      <div class="adm-image__preview" [style.aspect-ratio]="ratio()">
        @for (v of [version()]; track v) {
          <app-media [key]="key()" sizes="400px" [decorative]="true" />
        }
        @if (!hasImage()) {
          <span class="adm-image__badge">{{ L.image.placeholder }}</span>
        }
        @if (busy()) {
          <span class="adm-image__busy">{{ L.image.uploading }}</span>
        }
      </div>
      <div class="adm-image__tools">
        <label class="adm-btn adm-btn--sm" [class.is-disabled]="busy()">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/tiff" (change)="pick($event)" [disabled]="busy()" hidden />
          {{ hasImage() ? L.image.replace : L.image.upload }}
        </label>
        @if (hasImage()) {
          <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm adm-btn--danger" (click)="remove()" [disabled]="busy()">{{ L.image.remove }}</button>
        }
      </div>
      @if (error()) { <p class="adm-error">{{ error() }}</p> }
      <p class="adm-hint">{{ key() }} · {{ L.image.note }}</p>
    </div>
  `,
})
export class ImageFieldComponent {
  readonly key = input.required<string>();
  readonly ratio = input('16 / 10');

  protected readonly store = inject(AdminStore);
  protected readonly L = L;
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly hasImage = computed(() => {
    this.store.rev();
    return this.store.hasImage(this.key());
  });
  protected readonly version = computed(() => {
    this.store.rev();
    return this.store.images[this.key()]?.v ?? 0;
  });

  async pick(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      this.error.set(L.image.tooBig);
      return;
    }
    this.error.set('');
    this.busy.set(true);
    try {
      await this.store.uploadImage(this.key(), file);
    } catch {
      this.error.set(L.image.error);
    } finally {
      this.busy.set(false);
    }
  }

  async remove(): Promise<void> {
    if (!confirm(L.image.removeConfirm)) return;
    this.busy.set(true);
    try {
      await this.store.deleteImage(this.key());
    } finally {
      this.busy.set(false);
    }
  }
}
