import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { FooterComponent } from './layout/footer/footer';
import { HeaderComponent } from './layout/header/header';
import { EditUiComponent } from './admin/edit/edit-ui';
import { EditService } from './services/edit.service';
import { SeoService } from './services/seo.service';
import { WhatsappFabComponent } from './shared/components/whatsapp-fab/whatsapp-fab';
import { TranslatePipe } from './shared/pipes/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, WhatsappFabComponent, TranslatePipe, EditUiComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isAdmin()) {
      <router-outlet />
    } @else {
      <a class="skip-link" href="#main" (click)="skipToContent($event)">{{ 'a11y.skip' | t }}</a>
      <app-header />
      <main id="main" tabindex="-1">
        <router-outlet />
      </main>
      <app-footer />
      <app-whatsapp-fab />
      @if (edit.active()) {
        @defer {
          <app-edit-ui />
        }
      }
    }
  `,
})
export class App {
  private readonly router = inject(Router);
  /** Visual editor (the website itself becomes the admin panel). */
  protected readonly edit = inject(EditService);

  /** The admin panel has its own layout (no public header/footer). */
  protected readonly isAdmin = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.startsWith('/admin')),
    ),
    { initialValue: location.pathname.startsWith('/admin') },
  );

  constructor() {
    inject(SeoService); // starts title/meta synchronisation
    inject(ViewportScroller).setOffset([0, 80]); // anchor scrolling below the fixed header
  }

  protected skipToContent(event: Event): void {
    event.preventDefault();
    document.getElementById('main')?.focus();
  }
}
