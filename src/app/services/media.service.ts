import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MediaManifest, MediaManifestEntry } from '../models';

/**
 * Knows which photo slots have real, optimised photographs.
 * Filled from the content API (admin uploads) or, as a fallback,
 * from the static manifest written by `npm run images`.
 */
@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly manifest = signal<MediaManifest['images']>({});

  async init(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<MediaManifest>('images/manifest.json'));
      this.manifest.set(data?.images ?? {});
    } catch {
      this.manifest.set({});
    }
  }

  setManifest(images: MediaManifest['images']): void {
    this.manifest.set({ ...images });
  }

  setEntry(key: string, entry: MediaManifestEntry | null): void {
    this.manifest.update((m) => {
      const next = { ...m };
      if (entry) next[key] = entry;
      else delete next[key];
      return next;
    });
  }

  entry(key: string): MediaManifestEntry | undefined {
    return this.manifest()[key];
  }

  /** URL of one rendition, with cache-busting version. */
  url(key: string, width?: number, format: 'avif' | 'webp' | 'jpg' = 'webp'): string | null {
    const e = this.entry(key);
    if (!e) return null;
    const sorted = [...e.widths].sort((a, b) => a - b);
    const w = width ? (sorted.find((x) => x >= width) ?? sorted.at(-1)!) : sorted.at(-1)!;
    const fmt = e.formats.includes(format) ? format : 'jpg';
    return `images/${key}-${w}.${fmt}${e.v ? `?v=${e.v}` : ''}`;
  }
}
