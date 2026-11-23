import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';

/**
 * `data.seo` selects the i18n `seo.<key>` title/description.
 * Interior pages are lazy-loaded to keep the initial bundle small.
 */
export const routes: Routes = [
  { path: '', component: HomePage, data: { seo: 'home' } },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage),
    data: { seo: 'about' },
  },
  {
    path: 'activities',
    loadComponent: () => import('./pages/activities/activities.page').then((m) => m.ActivitiesPage),
    data: { seo: 'activities' },
  },
  {
    path: 'destinations',
    loadComponent: () =>
      import('./pages/destinations/destinations.page').then((m) => m.DestinationsPage),
    data: { seo: 'destinations' },
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery.page').then((m) => m.GalleryPage),
    data: { seo: 'gallery' },
  },
  {
    path: 'conservation',
    loadComponent: () =>
      import('./pages/conservation/conservation.page').then((m) => m.ConservationPage),
    data: { seo: 'conservation' },
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.page').then((m) => m.ContactPage),
    data: { seo: 'contact', hideFooterCta: true },
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    data: { seo: 'admin', hideFooterCta: true },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
    data: { seo: 'notFound', hideFooterCta: true },
  },
];
