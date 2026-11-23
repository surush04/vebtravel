import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { L } from '../admin.labels';
import { AdminApi } from '../admin-api.service';

@Component({
  selector: 'adm-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'adm adm--login' },
  template: `
    <form class="adm-login" (submit)="submit($event)">
      <p class="adm-login__brand">M-SAYYOD</p>
      <h1 class="adm-login__title">{{ L.login.title }}</h1>
      <p class="adm-muted">{{ L.login.subtitle }}</p>
      <label class="adm-input">
        <span class="adm-label">{{ L.login.password }}</span>
        <input #pw type="password" name="password" autocomplete="current-password" required autofocus />
      </label>
      @if (error()) { <p class="adm-error" role="alert">{{ error() }}</p> }
      <button class="adm-btn adm-btn--primary adm-btn--block" type="submit" [disabled]="busy()">{{ L.login.submit }}</button>
    </form>
  `,
  styleUrl: '../admin.scss',
})
export class LoginPage {
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  protected readonly L = L;
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    const input = (event.target as HTMLFormElement).elements.namedItem('password') as HTMLInputElement;
    if (!input.value) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.login(input.value);
      await this.router.navigateByUrl('/admin');
    } catch (e) {
      const status = e instanceof HttpErrorResponse ? e.status : 0;
      this.error.set(status === 401 ? L.login.wrong : status === 429 ? L.login.tooMany : L.login.offline);
    } finally {
      this.busy.set(false);
    }
  }
}
