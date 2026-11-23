import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { NAV_ITEMS } from '../../data/site.data';
import { EditService } from '../../services/edit.service';
import { MARKER_PATTERN, decodeKey, stripMarkers } from '../../services/translation.service';
import { FIELD_LABELS, L } from '../admin.labels';
import { AdminApi } from '../admin-api.service';
import { AdminStore } from '../admin-store.service';
import { ImageFieldComponent } from '../components/image-field';
import { LangFieldComponent } from '../components/lang-field';
import { GalleryAdminPage } from '../pages/gallery.page';
import { MessagesPage } from '../pages/messages.page';
import { SettingsPage } from '../pages/settings.page';
import { TextsPage } from '../pages/texts.page';

type Tool = 'settings' | 'messages' | 'texts' | 'gallery';

/** Elements that receive the "click to edit" target for a text inside them. */
const TARGETS = 'h1,h2,h3,h4,h5,h6,p,blockquote,figcaption,label,button,a,li,dt,dd,option,summary,small';

@Component({
  selector: 'app-edit-ui',
  imports: [LangFieldComponent, ImageFieldComponent, SettingsPage, MessagesPage, TextsPage, GalleryAdminPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'edit-ui',
    '(window:keydown)': 'onKey($event)',
    '(window:beforeunload)': 'onUnload($event)',
  },
  templateUrl: './edit-ui.html',
  styleUrls: ['../admin.scss', './edit-ui.scss'],
})
export class EditUiComponent {
  protected readonly edit = inject(EditService);
  protected readonly store = inject(AdminStore);
  protected readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  protected readonly L = L;

  protected readonly tool = signal<Tool | null>(null);
  protected readonly saveError = signal('');
  protected readonly hintVisible = signal(true);
  protected readonly currentPath = signal(this.router.url.split(/[?#]/)[0]);

  protected readonly pages = computed(() => {
    this.store.rev();
    return NAV_ITEMS.map((n) => ({ path: n.path, label: this.store.text('tg', n.key) || n.path }));
  });

  protected readonly status = computed(() =>
    this.store.saving() ? L.saving : this.store.dirty() ? L.unsaved : L.saved,
  );

  /** Which text node belongs to which key (filled from invisible markers). */
  private readonly nodeKeys = new WeakMap<Text, string[]>();
  private readonly observer = new MutationObserver((mutations) => this.onMutations(mutations));
  private readonly clickHandler = (e: MouseEvent) => this.onClick(e);

  constructor() {
    document.body.classList.add('is-editing');
    this.scan(document.body);
    this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.addEventListener('click', this.clickHandler, true);

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.currentPath.set(this.router.url.split(/[?#]/)[0]));

    inject(DestroyRef).onDestroy(() => {
      this.observer.disconnect();
      document.removeEventListener('click', this.clickHandler, true);
      document.body.classList.remove('is-editing');
    });
    setTimeout(() => this.hintVisible.set(false), 9000);
  }

  // ---- Annotating texts on the page ------------------------------------------------
  private onMutations(mutations: MutationRecord[]): void {
    for (const m of mutations) {
      if (m.type === 'characterData') this.process(m.target as Text);
      else m.addedNodes.forEach((n) => this.scan(n));
    }
  }

  private scan(root: Node): void {
    if (root.nodeType === Node.TEXT_NODE) {
      this.process(root as Text);
      return;
    }
    if (!(root instanceof Element) || root.closest('.edit-ui')) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    nodes.forEach((n) => this.process(n));
  }

  private process(node: Text): void {
    const value = node.nodeValue ?? '';
    if (!value.includes('⁢')) return;
    const parent = node.parentElement;
    if (!parent || parent.closest('.edit-ui')) return;
    const keys = [...value.matchAll(MARKER_PATTERN)].map((m) => decodeKey(m[1]));
    this.nodeKeys.set(node, keys);
    node.nodeValue = stripMarkers(value);
    const target = parent.closest(TARGETS) ?? parent;
    target.setAttribute('data-edit-keys', '');
  }

  /** All keys of the texts inside an element. */
  private keysOf(el: Element): string[] {
    const keys = new Set<string>();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) this.nodeKeys.get(walker.currentNode as Text)?.forEach((k) => keys.add(k));
    return [...keys];
  }

  private onClick(event: MouseEvent): void {
    if (!this.edit.clickToEdit) return;
    const target = event.target as Element | null;
    if (!target || target.closest('.edit-ui, .edit-toolbar, .edit-add, .media__edit, .app-lang, app-language-switcher')) return;
    const el = target.closest('[data-edit-keys]');
    if (!el) return;
    const keys = this.keysOf(el);
    if (!keys.length) return;
    event.preventDefault();
    event.stopPropagation();
    this.tool.set(null);
    this.edit.editingPhoto.set(null);
    this.edit.editingKeys.set(keys);
  }

  // ---- UI actions -------------------------------------------------------------------
  protected labelFor(key: string): string {
    const parts = key.split('.').filter((p) => !/^\d+$/.test(p));
    return FIELD_LABELS[parts.at(-1) ?? ''] ?? parts.at(-1) ?? key;
  }

  protected closePanels(): void {
    this.edit.editingKeys.set(null);
    this.edit.editingPhoto.set(null);
    this.tool.set(null);
  }

  protected openTool(tool: Tool): void {
    this.edit.editingKeys.set(null);
    this.edit.editingPhoto.set(null);
    this.tool.set(this.tool() === tool ? null : tool);
  }

  protected go(path: string): void {
    this.closePanels();
    void this.router.navigateByUrl(path);
  }

  protected async save(): Promise<void> {
    this.saveError.set('');
    try {
      await this.store.save();
    } catch {
      this.saveError.set(L.saveError);
    }
  }

  protected async discard(): Promise<void> {
    if (confirm(L.discardConfirm)) await this.store.discard();
  }

  protected exit(): void {
    if (this.store.dirty() && !confirm(L.leaveConfirm)) return;
    this.edit.stop();
  }

  protected onKey(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (this.store.dirty()) void this.save();
    }
    if (event.key === 'Escape') this.closePanels();
  }

  protected onUnload(event: BeforeUnloadEvent): void {
    if (this.store.dirty()) event.preventDefault();
  }
}
