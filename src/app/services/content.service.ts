import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { DEFAULT_SITE } from '../data/site.data';
import { ContentPayload, SiteContent } from '../models';
import { MediaService } from './media.service';
import { TranslationService } from './translation.service';

/**
 * Single source of site content. Loads everything managed in the admin panel
 * (settings, lists, texts, photos) from `/api/content` in one request.
 * If the API is unavailable, the bundled defaults and static JSON are used.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(TranslationService);
  private readonly media = inject(MediaService);

  /** True when the content API (and therefore the admin backend) is reachable. */
  readonly api = signal(false);
  readonly site = signal<SiteContent>(DEFAULT_SITE);

  readonly settings = computed(() => this.site().settings);
  readonly activities = computed(() => this.site().activities);
  readonly destinations = computed(() => this.site().destinations);
  readonly gallery = computed(() => this.site().gallery);
  readonly galleryCategories = computed(() => this.site().galleryCategories);

  async init(): Promise<void> {
    try {
      const payload = await firstValueFrom(
        this.http.get<ContentPayload>('api/content').pipe(timeout(6000)),
      );
      if (!payload?.site || !payload.i18n) throw new Error('invalid payload');
      this.apply(payload);
      this.api.set(true);
    } catch {
      this.api.set(false);
      await this.media.init();
    }
    await this.i18n.init();
  }

  /** Apply fresh content (used at startup and after saving in the admin). */
  apply(payload: ContentPayload): void {
    this.site.set(mergeSite(payload.site));
    this.i18n.preload(payload.i18n);
    this.media.setManifest(payload.media?.images ?? {});
  }
}

function mergeSite(site: Partial<SiteContent>): SiteContent {
  return {
    ...DEFAULT_SITE,
    ...site,
    settings: { ...DEFAULT_SITE.settings, ...(site.settings ?? {}) },
  } as SiteContent;
}
