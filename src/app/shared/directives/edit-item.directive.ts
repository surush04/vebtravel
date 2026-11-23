import { DestroyRef, Directive, ElementRef, effect, inject, input } from '@angular/core';
import { EditAction, EditService } from '../../services/edit.service';

/**
 * Visual editor: adds a ↑ ↓ ✕ toolbar to a list item while edit mode is on.
 * Usage: `<li [appEditItem]="{ type: 'list', path: 'why.items', index: i }">`.
 */
@Directive({ selector: '[appEditItem]' })
export class EditItemDirective {
  readonly appEditItem = input<EditAction | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly edit = inject(EditService);
  private toolbar: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const action = this.appEditItem();
      const show = this.edit.active() && !this.edit.preview() && !!action;
      if (show && !this.toolbar) this.mount();
      if (!show && this.toolbar) this.unmount();
    });
    inject(DestroyRef).onDestroy(() => this.unmount());
  }

  private mount(): void {
    if (getComputedStyle(this.host).position === 'static') this.host.style.position = 'relative';
    const bar = document.createElement('div');
    bar.className = 'edit-toolbar';
    bar.append(
      this.button('↑', 'Ба боло / пеш', () => this.edit.move(this.appEditItem()!, -1)),
      this.button('↓', 'Ба поён / ақиб', () => this.edit.move(this.appEditItem()!, 1)),
      this.button('✕', 'Нест кардан', () => this.edit.remove(this.appEditItem()!), true),
    );
    this.host.appendChild(bar);
    this.host.classList.add('edit-item');
    this.toolbar = bar;
  }

  private unmount(): void {
    this.toolbar?.remove();
    this.toolbar = null;
    this.host.classList.remove('edit-item');
  }

  private button(label: string, title: string, onClick: () => void, danger = false): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.title = title;
    b.setAttribute('aria-label', title);
    if (danger) b.className = 'is-danger';
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return b;
  }
}
