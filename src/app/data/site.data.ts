import { SITE_CONFIG } from '../core/config/site.config';
import {
  Activity,
  Destination,
  GalleryCategory,
  GalleryItem,
  LanguageOption,
  MediaAsset,
  NavItem,
  SiteContent,
} from '../models';

export const LANGUAGES: LanguageOption[] = [
  { code: 'tg', label: 'TJ', nativeName: 'Тоҷикӣ', htmlLang: 'tg', ogLocale: 'tg_TJ' },
  { code: 'ru', label: 'RU', nativeName: 'Русский', htmlLang: 'ru', ogLocale: 'ru_RU' },
  { code: 'en', label: 'EN', nativeName: 'English', htmlLang: 'en', ogLocale: 'en_US' },
];

export const NAV_ITEMS: NavItem[] = [
  { key: 'nav.home', path: '/' },
  { key: 'nav.about', path: '/about' },
  { key: 'nav.activities', path: '/activities' },
  { key: 'nav.destinations', path: '/destinations' },
  { key: 'nav.gallery', path: '/gallery' },
  { key: 'nav.conservation', path: '/conservation' },
  { key: 'nav.contact', path: '/contact' },
];

export const ACTIVITIES: Activity[] = [
  { id: 'hunting', media: 'activity-hunting' },
  { id: 'expeditions', media: 'activity-expeditions' },
  { id: 'ecotourism', media: 'activity-ecotourism' },
  { id: 'photography', media: 'activity-photography' },
  { id: 'conservation', media: 'activity-conservation' },
];

export const DESTINATIONS: Destination[] = [
  { id: 'zighar', media: 'dest-zighar' },
  { id: 'darvoz', media: 'dest-darvoz' },
  { id: 'landscapes', media: 'dest-landscapes' },
  { id: 'habitats', media: 'dest-habitats' },
];

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  'wildlife',
  'mountains',
  'expeditions',
  'nature',
  'activities',
];

export const GALLERY: GalleryItem[] = [
  { id: 'g01', media: 'gallery-01', category: 'wildlife', orientation: 'portrait' },
  { id: 'g02', media: 'gallery-02', category: 'mountains', orientation: 'landscape' },
  { id: 'g03', media: 'gallery-03', category: 'nature', orientation: 'landscape' },
  { id: 'g04', media: 'gallery-04', category: 'expeditions', orientation: 'portrait' },
  { id: 'g05', media: 'gallery-05', category: 'wildlife', orientation: 'landscape' },
  { id: 'g06', media: 'gallery-06', category: 'mountains', orientation: 'portrait' },
  { id: 'g07', media: 'gallery-07', category: 'activities', orientation: 'square' },
  { id: 'g08', media: 'gallery-08', category: 'nature', orientation: 'portrait' },
  { id: 'g09', media: 'gallery-09', category: 'wildlife', orientation: 'square' },
  { id: 'g10', media: 'gallery-10', category: 'expeditions', orientation: 'landscape' },
  { id: 'g11', media: 'gallery-11', category: 'mountains', orientation: 'landscape' },
  { id: 'g12', media: 'gallery-12', category: 'nature', orientation: 'square' },
  { id: 'g13', media: 'gallery-13', category: 'activities', orientation: 'portrait' },
  { id: 'g14', media: 'gallery-14', category: 'wildlife', orientation: 'portrait' },
  { id: 'g15', media: 'gallery-15', category: 'expeditions', orientation: 'portrait' },
  { id: 'g16', media: 'gallery-16', category: 'mountains', orientation: 'square' },
];

/**
 * Photo slots. Drop a photograph named `<key>.jpg` into /images-src and run
 * `npm run images` — it will be optimised (AVIF/WebP/JPEG, responsive sizes)
 * and replace the placeholder automatically. Alt text lives in i18n `media.<key>`.
 */
export const MEDIA: Record<string, MediaAsset> = {
  'hero-markhor': { scene: { tone: 'dawn', seed: 11 }, focal: '50% 40%' },
  'about-main': { scene: { tone: 'mist', seed: 23 } },
  'about-detail': { scene: { tone: 'dusk', seed: 31 } },
  'activity-hunting': { scene: { tone: 'dusk', seed: 41 } },
  'activity-expeditions': { scene: { tone: 'snow', seed: 53 } },
  'activity-ecotourism': { scene: { tone: 'forest', seed: 67 } },
  'activity-photography': { scene: { tone: 'dawn', seed: 71 } },
  'activity-conservation': { scene: { tone: 'mist', seed: 83 } },
  'dest-zighar': { scene: { tone: 'forest', seed: 97 } },
  'dest-darvoz': { scene: { tone: 'snow', seed: 101 } },
  'dest-landscapes': { scene: { tone: 'dawn', seed: 113 } },
  'dest-habitats': { scene: { tone: 'dusk', seed: 127 } },
  'conservation-markhor': { scene: { tone: 'night', seed: 131 } },
  'conservation-detail': { scene: { tone: 'mist', seed: 139 } },
  'contact-landscape': { scene: { tone: 'dusk', seed: 149 } },
  'gallery-01': { scene: { tone: 'dawn', seed: 151 } },
  'gallery-02': { scene: { tone: 'snow', seed: 157 } },
  'gallery-03': { scene: { tone: 'forest', seed: 163 } },
  'gallery-04': { scene: { tone: 'mist', seed: 167 } },
  'gallery-05': { scene: { tone: 'dusk', seed: 173 } },
  'gallery-06': { scene: { tone: 'mist', seed: 179 } },
  'gallery-07': { scene: { tone: 'forest', seed: 181 } },
  'gallery-08': { scene: { tone: 'dawn', seed: 191 } },
  'gallery-09': { scene: { tone: 'night', seed: 193 } },
  'gallery-10': { scene: { tone: 'dusk', seed: 197 } },
  'gallery-11': { scene: { tone: 'dawn', seed: 199 } },
  'gallery-12': { scene: { tone: 'snow', seed: 211 } },
  'gallery-13': { scene: { tone: 'forest', seed: 223 } },
  'gallery-14': { scene: { tone: 'night', seed: 227 } },
  'gallery-15': { scene: { tone: 'snow', seed: 229 } },
  'gallery-16': { scene: { tone: 'mist', seed: 233 } },
};

/**
 * Built-in defaults, used when the content API is not available
 * (e.g. the site is hosted as static files only).
 */
export const DEFAULT_SITE: SiteContent = {
  settings: {
    established: SITE_CONFIG.established,
    siteUrl: SITE_CONFIG.siteUrl,
    contact: { ...SITE_CONFIG.contact },
    location: { ...SITE_CONFIG.location },
    regionMap: { ...SITE_CONFIG.regionMap },
    social: SITE_CONFIG.social.map((s) => ({ ...s })),
    heroVideo: { ...SITE_CONFIG.heroVideo },
  },
  activities: ACTIVITIES,
  destinations: DESTINATIONS,
  galleryCategories: GALLERY_CATEGORIES,
  gallery: GALLERY,
};
