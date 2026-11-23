import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router, Routes } from '@angular/router';
import { L } from './admin.labels';
import { AdminApi } from './admin-api.service';
import { AdminShellComponent } from './admin-shell';
import { AdminStore } from './admin-store.service';
import { EditService } from '../services/edit.service';

const authGuard: CanActivateFn = async () => {
  const api = inject(AdminApi);
  const router = inject(Router);
  if (!(await api.loadMode())) return true; // login temporarily disabled on the server
  if (!api.token()) return router.parseUrl('/admin/login');
  try {
    await api.session();
    return true;
  } catch {
    return router.parseUrl('/admin/login');
  }
};

/** /admin → the website itself in edit mode. */
const enterEditMode: CanActivateFn = async () => {
  const edit = inject(EditService);
  const router = inject(Router);
  await edit.start();
  return router.parseUrl('/');
};

const unsavedGuard: CanDeactivateFn<unknown> = () => {
  const store = inject(AdminStore);
  return !store.dirty() || confirm(L.leaveConfirm);
};

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [
      async () => {
        const api = inject(AdminApi);
        const router = inject(Router);
        return (await api.loadMode()) ? true : router.parseUrl('/admin');
      },
    ],
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  { path: '', pathMatch: 'full', canActivate: [authGuard, enterEditMode], children: [] },
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [authGuard],
    canDeactivate: [unsavedGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage) },
      { path: 'texts', loadComponent: () => import('./pages/texts.page').then((m) => m.TextsPage) },
      {
        path: 'activities',
        loadComponent: () => import('./pages/collection.page').then((m) => m.CollectionPage),
        data: { collection: 'activities' },
      },
      {
        path: 'destinations',
        loadComponent: () => import('./pages/collection.page').then((m) => m.CollectionPage),
        data: { collection: 'destinations' },
      },
      { path: 'gallery', loadComponent: () => import('./pages/gallery.page').then((m) => m.GalleryAdminPage) },
      { path: 'images', loadComponent: () => import('./pages/images.page').then((m) => m.ImagesPage) },
      { path: 'messages', loadComponent: () => import('./pages/messages.page').then((m) => m.MessagesPage) },
      { path: 'settings', loadComponent: () => import('./pages/settings.page').then((m) => m.SettingsPage) },
    ],
  },
];
