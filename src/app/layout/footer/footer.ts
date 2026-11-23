import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { NAV_ITEMS } from '../../data/site.data';
import { ContentService } from '../../services/content.service';
import { ContactService } from '../../services/contact.service';
import { ScrollService } from '../../services/scroll.service';
import { ButtonComponent } from '../../shared/components/button/button';
import { IconComponent } from '../../shared/components/icon/icon';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher';
import { LogoComponent } from '../../shared/components/logo/logo';
import { MediaComponent } from '../../shared/components/media/media';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  imports: [
    RouterLink,
    TranslatePipe,
    LogoComponent,
    LanguageSwitcherComponent,
    ButtonComponent,
    IconComponent,
    MediaComponent,
    RevealDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  protected readonly scroll = inject(ScrollService);
  protected readonly contact = inject(ContactService);
  private readonly content = inject(ContentService);
  protected readonly settings = this.content.settings;
  protected readonly nav = NAV_ITEMS;
  protected readonly activities = this.content.activities;
  protected readonly socials = computed(() => this.settings().social.filter((s) => !!s.url));
  protected readonly year = new Date().getFullYear();
  protected readonly showCta = signal(true);

  protected tel(phone: string): string {
    return 'tel:' + phone.replace(/[^+\d]/g, '');
  }

  constructor() {
    const router = inject(Router);
    router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        let snap: ActivatedRouteSnapshot = router.routerState.snapshot.root;
        while (snap.firstChild) snap = snap.firstChild;
        this.showCta.set(!snap.data['hideFooterCta']);
      });
  }
}
