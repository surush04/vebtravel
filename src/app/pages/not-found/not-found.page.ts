import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { MediaComponent } from '../../shared/components/media/media';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, ButtonComponent, MediaComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf">
      <div class="nf__media" aria-hidden="true">
        <app-media key="gallery-06" [decorative]="true" [priority]="true" />
      </div>
      <div class="container nf__content">
        <p class="eyebrow">{{ 'pages.notFound.eyebrow' | t }}</p>
        <h1 class="display h1">{{ 'pages.notFound.title' | t }}</h1>
        <p class="lead">{{ 'pages.notFound.lead' | t }}</p>
        <a appButton routerLink="/">{{ 'pages.notFound.cta' | t }}</a>
      </div>
    </section>
  `,
  styles: `
    .nf {
      --fg-strong: #fff;
      --fg-muted: rgba(233, 227, 215, 0.8);
      position: relative;
      display: flex;
      align-items: center;
      min-height: 100svh;
      padding: calc(var(--header-h) + 3rem) 0 4rem;
      isolation: isolate;
      overflow: hidden;
    }
    .nf__media { position: absolute; inset: 0; z-index: -1; }
    .nf__media::after { content: ''; position: absolute; inset: 0; background: rgba(10, 13, 11, 0.62); }
    .nf__content { display: grid; gap: 1.75rem; justify-items: start; }
  `,
})
export class NotFoundPage {}
