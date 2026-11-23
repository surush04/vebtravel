import { isDevMode } from '@angular/core';
import { SiteConfig } from '../../models';

/**
 * ---------------------------------------------------------------------------
 *  M-SAYYOD — site configuration
 * ---------------------------------------------------------------------------
 *  Every value marked `null` is UNCONFIRMED and intentionally left empty.
 *  The UI hides or labels these items ("To be announced") until they are set.
 *  Never fill these in with guessed data — use verified company details only.
 * ---------------------------------------------------------------------------
 */
export const SITE_CONFIG: SiteConfig = {
  name: 'M-SAYYOD',
  established: 2005,

  // TODO: replace with the production domain (also update public/sitemap.xml and robots.txt).
  siteUrl: 'https://www.example.com',
  ogImage: '/images/og-cover.jpg',

  contact: {
    email: null, // e.g. 'info@…'
    phone: null, // e.g. '+992 …'
    whatsapp: null, // digits only, international format, e.g. '992…'
  },

  // Add once the office / meeting-point location is verified.
  location: {
    mapEmbedUrl: null,
    mapLink: null,
  },

  // Regional overview of the Darvoz district (not a route or a company location).
  regionMap: {
    embedUrl:
      'https://www.openstreetmap.org/export/embed.html?bbox=70.05%2C38.05%2C71.65%2C38.95&layer=mapnik',
    link: 'https://www.openstreetmap.org/#map=9/38.50/70.85',
  },

  social: [
    { id: 'instagram', url: null },
    { id: 'facebook', url: null },
    { id: 'youtube', url: null },
    { id: 'telegram', url: null },
  ],

  formEndpoint: null,

  // Optional cinematic hero video (place files in /public/video/).
  heroVideo: { mp4: null, webm: null },

  showImageSlotLabels: isDevMode(),
};
