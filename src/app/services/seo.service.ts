import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SITE_CONFIG } from '../core/config/site.config';
import { ContentService } from './content.service';
import { TranslationService, stripMarkers } from './translation.service';

/**
 * Keeps <title>, meta description, canonical and Open Graph / Twitter tags
 * in sync with the active route (route data `seo`) and the active language.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(TranslationService);
  private readonly content = inject(ContentService);

  private readonly page = signal<{ key: string; path: string }>({ key: 'home', path: '/' });

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      let snapshot: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;
      while (snapshot.firstChild) snapshot = snapshot.firstChild;
      const path = this.router.url.split(/[?#]/)[0];
      const key = path.startsWith('/admin') ? 'admin' : ((snapshot.data['seo'] as string | undefined) ?? 'home');
      this.page.set({ key, path });
    });

    effect(() => {
      const { key, path } = this.page();
      this.i18n.language(); // re-run on language change
      this.apply(key, path);
    });
  }

  private apply(key: string, path: string): void {
    if (key === 'admin') {
      this.title.setTitle('M-SAYYOD — Admin');
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
      return;
    }
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    const siteUrl = this.content.settings().siteUrl.replace(/\/$/, '');
    const title = stripMarkers(this.i18n.t(`seo.${key}.title`));
    const description = stripMarkers(this.i18n.t(`seo.${key}.description`));
    const url = `${siteUrl}${path === '/' ? '/' : path}`;
    const image = `${siteUrl}${SITE_CONFIG.ogImage}`;
    const locale = this.i18n.current().ogLocale;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_CONFIG.name });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:locale', content: locale });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    let canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = url;
  }
}
