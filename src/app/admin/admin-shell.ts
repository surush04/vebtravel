import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { L } from './admin.labels';
import { AdminApi } from './admin-api.service';
import { AdminStore } from './admin-store.service';

@Component({
  selector: 'adm-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'adm',
    '(window:keydown)': 'onKey($event)',
    '(window:beforeunload)': 'onUnload($event)',
  },
  template: `
    <aside class="adm-side" [class.is-open]="menuOpen()">
      <a class="adm-side__brand" routerLink="/admin">
        <span class="adm-side__logo">M-SAYYOD</span>
        <span class="adm-side__sub">{{ L.brand }}</span>
      </a>
      <nav class="adm-side__nav">
        @for (item of nav; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: item.path === '/admin' }" (click)="menuOpen.set(false)">
            <span class="adm-side__icon" aria-hidden="true">{{ item.icon }}</span>{{ item.label }}
          </a>
        }
      </nav>
      <div class="adm-side__foot">
        <a href="/" target="_blank" rel="noopener">↗ {{ L.viewSite }}</a>
        <button type="button" (click)="logout()">⎋ {{ L.logout }}</button>
      </div>
    </aside>

    <div class="adm-main">
      <header class="adm-top">
        <button type="button" class="adm-top__menu" (click)="menuOpen.update((v) => !v)" aria-label="Menu">☰</button>
        <p class="adm-top__status" [class.is-dirty]="store.dirty()" role="status">
          <span class="adm-dot"></span>{{ status() }}
        </p>
        @if (error()) { <p class="adm-error">{{ error() }}</p> }
        <div class="adm-top__actions">
          @if (store.dirty()) {
            <button type="button" class="adm-btn adm-btn--ghost" (click)="discard()" [disabled]="store.saving()">{{ L.discard }}</button>
          }
          <button type="button" class="adm-btn adm-btn--primary" (click)="save()" [disabled]="!store.dirty() || store.saving()">
            {{ store.saving() ? L.saving : L.save }}
          </button>
        </div>
      </header>
      <main class="adm-content">
        @if (store.loaded()) {
          <router-outlet />
        } @else {
          <p class="adm-muted">…</p>
        }
      </main>
    </div>
  `,
  styleUrl: './admin.scss',
})
export class AdminShellComponent {
  protected readonly store = inject(AdminStore);
  private readonly api = inject(AdminApi);
  protected readonly L = L;
  protected readonly menuOpen = signal(false);
  protected readonly error = signal('');

  protected readonly nav = [
    { path: '/admin', label: L.nav.dashboard, icon: '◈' },
    { path: '/admin/texts', label: L.nav.texts, icon: '¶' },
    { path: '/admin/activities', label: L.nav.activities, icon: '◆' },
    { path: '/admin/destinations', label: L.nav.destinations, icon: '▲' },
    { path: '/admin/gallery', label: L.nav.gallery, icon: '▦' },
    { path: '/admin/images', label: L.nav.images, icon: '◐' },
    { path: '/admin/messages', label: L.nav.messages, icon: '✉' },
    { path: '/admin/settings', label: L.nav.settings, icon: '⚙' },
  ];

  protected readonly status = computed(() =>
    this.store.saving() ? L.saving : this.store.dirty() ? L.unsaved : L.saved,
  );

  constructor() {
    void this.store.load().catch(() => this.error.set(L.login.offline));
  }

  async save(): Promise<void> {
    this.error.set('');
    try {
      await this.store.save();
    } catch {
      this.error.set(L.saveError);
    }
  }

  async discard(): Promise<void> {
    if (confirm(L.discardConfirm)) await this.store.discard();
  }

  logout(): void {
    if (this.store.dirty() && !confirm(L.leaveConfirm)) return;
    this.store.loaded.set(false);
    this.api.logout();
  }

  protected onKey(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (this.store.dirty()) void this.save();
    }
  }

  protected onUnload(event: BeforeUnloadEvent): void {
    if (this.store.dirty()) event.preventDefault();
  }
}
