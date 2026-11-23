import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { NAV_ITEMS } from '../../data/site.data';
import { ScrollService } from '../../services/scroll.service';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher';
import { LogoComponent } from '../../shared/components/logo/logo';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LogoComponent, LanguageSwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-scrolled]': 'scrolled()',
    '[class.is-hidden]': 'hidden()',
    '[class.is-open]': 'open()',
    '(window:scroll)': 'onScroll()',
    '(document:keydown.escape)': 'close()',
  },
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  private readonly scroll = inject(ScrollService);
  private readonly toggleBtn = viewChild<ElementRef<HTMLButtonElement>>('toggleBtn');
  private readonly firstLink = viewChild<ElementRef<HTMLAnchorElement>>('firstLink');

  protected readonly nav = NAV_ITEMS;
  protected readonly scrolled = signal(false);
  protected readonly hidden = signal(false);
  protected readonly open = signal(false);

  private lastY = 0;
  private ticking = false;

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.open.set(false);
        this.hidden.set(false);
      });

    let wasOpen = false;
    effect(() => {
      const isOpen = this.open();
      untracked(() => {
        this.scroll.lock(isOpen);
        if (isOpen) setTimeout(() => this.firstLink()?.nativeElement.focus(), 350);
        else if (wasOpen) this.toggleBtn()?.nativeElement.focus({ preventScroll: true });
        wasOpen = isOpen;
      });
    });
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    if (this.open()) this.open.set(false);
  }

  protected onScroll(): void {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      this.scrolled.set(y > 24);
      // Hide on scroll down, reveal on scroll up (never while the menu is open)
      if (!this.open()) this.hidden.set(y > 480 && y > this.lastY + 4);
      if (y < this.lastY - 4 || y < 480) this.hidden.set(false);
      this.lastY = y;
      this.ticking = false;
    });
  }
}
