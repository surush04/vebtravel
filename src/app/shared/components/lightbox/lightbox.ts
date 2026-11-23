import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { GalleryItem } from '../../../models';
import { ScrollService } from '../../../services/scroll.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../icon/icon';
import { MediaComponent } from '../media/media';

const RATIOS = { portrait: '4 / 5', landscape: '3 / 2', square: '1 / 1' } as const;

/**
 * Full-screen image viewer: keyboard (← → Esc), swipe, Fullscreen API,
 * focus trap/restore and scroll lock. Open it by setting `[(index)]`.
 */
@Component({
  selector: 'app-lightbox',
  imports: [MediaComponent, TranslatePipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKey($event)',
    '(document:fullscreenchange)': 'onFullscreenChange()',
  },
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.scss',
})
export class LightboxComponent {
  readonly items = input.required<GalleryItem[]>();
  readonly index = model<number | null>(null);

  private readonly scroll = inject(ScrollService);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');
  private returnFocus: HTMLElement | null = null;
  private touchX: number | null = null;
  private wasOpen = false;

  protected readonly fullscreenSupported = !!document.fullscreenEnabled;
  protected readonly isFullscreen = signal(false);
  protected readonly isOpen = computed(() => this.index() !== null && this.items().length > 0);
  protected readonly item = computed(() => {
    const i = this.index();
    return i === null ? null : (this.items()[i] ?? null);
  });
  protected readonly ratio = computed(() => RATIOS[this.item()?.orientation ?? 'landscape']);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      untracked(() => this.onOpenChange(open));
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.wasOpen) this.scroll.lock(false);
    });
  }

  close(): void {
    this.index.set(null);
  }

  next(): void {
    this.go(1);
  }

  prev(): void {
    this.go(-1);
  }

  async toggleFullscreen(): Promise<void> {
    const el = this.dialog()?.nativeElement;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      /* unsupported — ignore */
    }
  }

  protected onFullscreenChange(): void {
    this.isFullscreen.set(!!document.fullscreenElement);
  }

  protected onKey(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    switch (event.key) {
      case 'Escape':
        if (!document.fullscreenElement) this.close();
        break;
      case 'ArrowRight':
        this.next();
        break;
      case 'ArrowLeft':
        this.prev();
        break;
      case 'Tab':
        this.trapFocus(event);
        break;
    }
  }

  protected onTouchStart(event: TouchEvent): void {
    this.touchX = event.touches[0]?.clientX ?? null;
  }

  protected onTouchEnd(event: TouchEvent): void {
    if (this.touchX === null) return;
    const dx = (event.changedTouches[0]?.clientX ?? this.touchX) - this.touchX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) this.next();
      else this.prev();
    }
    this.touchX = null;
  }

  private go(step: 1 | -1): void {
    const i = this.index();
    const total = this.items().length;
    if (i === null || !total) return;
    this.index.set((i + step + total) % total);
  }

  private onOpenChange(open: boolean): void {
    if (open && !this.wasOpen) {
      this.returnFocus = document.activeElement as HTMLElement | null;
      this.scroll.lock(true);
      setTimeout(() => this.closeBtn()?.nativeElement.focus());
    } else if (!open && this.wasOpen) {
      this.scroll.lock(false);
      if (document.fullscreenElement) void document.exitFullscreen();
      this.returnFocus?.focus();
    }
    this.wasOpen = open;
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = this.dialog()?.nativeElement;
    if (!root) return;
    const focusable = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
