import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import {
  ContentPayload,
  Dictionary,
  LanguageCode,
  MediaManifestEntry,
  SiteContent,
} from '../models';

const TOKEN_KEY = 'msayyod.admin.token';

export interface AdminMessage {
  id: string;
  date: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  activity: string;
  message: string;
  language: LanguageCode;
  read: boolean;
}

/** HTTP client for the admin API. Stores the session token in localStorage. */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(readToken());

  async login(password: string): Promise<void> {
    const res = await firstValueFrom(this.http.post<{ token: string }>('api/auth/login', { password }));
    this.setToken(res.token);
  }

  logout(): void {
    this.setToken(null);
    void this.router.navigate(['/admin/login']);
  }

  session(): Promise<unknown> {
    return this.call(this.http.get('api/admin/session', this.opts()));
  }

  content(): Promise<ContentPayload> {
    return firstValueFrom(this.http.get<ContentPayload>('api/content', { headers: { 'Cache-Control': 'no-cache' } }));
  }

  saveSite(site: SiteContent): Promise<unknown> {
    return this.call(this.http.put('api/admin/site', site, this.opts()));
  }

  saveI18n(lang: LanguageCode, dict: Dictionary): Promise<unknown> {
    return this.call(this.http.put(`api/admin/i18n/${lang}`, dict, this.opts()));
  }

  upload(key: string, dataUrl: string): Promise<MediaManifestEntry> {
    return this.call(this.http.post<MediaManifestEntry>(`api/admin/media/${key}`, { data: dataUrl }, this.opts()));
  }

  deleteMedia(key: string): Promise<unknown> {
    return this.call(this.http.delete(`api/admin/media/${key}`, this.opts()));
  }

  messages(): Promise<AdminMessage[]> {
    return this.call(this.http.get<AdminMessage[]>('api/admin/messages', this.opts()));
  }

  markMessage(id: string, read: boolean): Promise<AdminMessage> {
    return this.call(this.http.patch<AdminMessage>(`api/admin/messages/${id}`, { read }, this.opts()));
  }

  deleteMessage(id: string): Promise<unknown> {
    return this.call(this.http.delete(`api/admin/messages/${id}`, this.opts()));
  }

  async changePassword(current: string, next: string): Promise<void> {
    const res = await this.call(
      this.http.put<{ token: string }>('api/admin/password', { current, next }, this.opts()),
    );
    this.setToken(res.token);
  }

  private opts() {
    return { headers: { Authorization: `Bearer ${this.token() ?? ''}` } };
  }

  private async call<T>(request: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(request);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) this.logout();
      throw error;
    }
  }

  private setToken(token: string | null): void {
    this.token.set(token);
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  }
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
