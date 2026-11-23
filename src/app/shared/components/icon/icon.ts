import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'arrow'
  | 'arrow-left'
  | 'arrow-up'
  | 'close'
  | 'expand'
  | 'fullscreen'
  | 'pin'
  | 'mail'
  | 'phone'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'telegram'
  | 'external';

/** Minimal line icons, drawn on a 24px grid with currentColor strokes. */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[style.width.px]': 'size()', '[style.height.px]': 'size()' },
  styles: `
    :host { display: inline-block; flex: none; line-height: 0; }
    svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.4;
          stroke-linecap: round; stroke-linejoin: round; }
  `,
  template: `
    <svg viewBox="0 0 24 24" focusable="false">
      @switch (name()) {
        @case ('arrow') { <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /> }
        @case ('arrow-left') { <path d="M20 12H5M10.5 6.5 5 12l5.5 5.5" /> }
        @case ('arrow-up') { <path d="M12 20V5M6.5 10.5 12 5l5.5 5.5" /> }
        @case ('close') { <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" /> }
        @case ('expand') { <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /> }
        @case ('fullscreen') { <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /> }
        @case ('pin') { <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /> }
        @case ('mail') { <rect x="3.5" y="5.5" width="17" height="13" /><path d="m4 6.5 8 6 8-6" /> }
        @case ('phone') { <path d="M6.6 3.8h2.6l1.4 4-1.9 1.3a11 11 0 0 0 6.2 6.2l1.3-1.9 4 1.4v2.6a1.8 1.8 0 0 1-1.9 1.8A15.8 15.8 0 0 1 4.8 5.7a1.8 1.8 0 0 1 1.8-1.9Z" /> }
        @case ('whatsapp') { <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6Z" /><path d="M9.3 8.6c.2-.4.5-.5.8-.5h.5l.9 2.1-.6.8c.5 1 1.3 1.8 2.3 2.3l.8-.6 2.1.9v.5c0 .3-.1.6-.5.8-.9.5-2.6.3-4.4-1.5s-2-3.5-1.5-4.4Z" /> }
        @case ('instagram') { <rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.9" cy="7.1" r=".6" /> }
        @case ('facebook') { <path d="M14.5 8.5h2V5h-2.6A3.4 3.4 0 0 0 10.5 8.4V11H8v3.4h2.5V21h3.4v-6.6h2.5l.6-3.4h-3.1V9.2c0-.4.3-.7.6-.7Z" /> }
        @case ('youtube') { <rect x="3" y="6" width="18" height="12" rx="3.5" /><path d="m10.5 9.5 4 2.5-4 2.5Z" /> }
        @case ('telegram') { <path d="M20.5 4.5 3.8 11.1l5.4 1.9m11.3-8.5-3 15-5.9-4.4m8.9-10.6-8.9 10.6M9.2 13l.9 5.5 1.7-3.1" /> }
        @case ('external') { <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /> }
      }
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
