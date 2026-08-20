import { ModulAjarCinta } from '../types';
import { loadCustomOgImage, loadMapelOgConfigs } from './storage';
import { sanitizeMapelKey, getPresetImageForMapel } from './mapelOgApi';

export interface OpenGraphMetaOptions {
  title?: string;
  description?: string;
  imageUrl?: string;
  faviconUrl?: string;
  url?: string;
  version?: string | number;
}

/**
 * Ensures a unique cache-busting parameter (?v=...) is added or updated on a URL.
 */
export function addCacheBusterToUrl(url: string, version?: string | number): string {
  if (!url) return '';
  const v = version || Date.now();

  try {
    const hasQuery = url.includes('?');
    if (url.includes('v=')) {
      return url.replace(/([?&])v=[^&]*/, `$1v=${v}`);
    } else {
      return `${url}${hasQuery ? '&' : '?'}v=${v}`;
    }
  } catch {
    return `${url}?v=${v}`;
  }
}

/**
 * Force-refreshes Open Graph, Twitter, Favicon, and Canonical metadata in document head.
 * Adds a unique cache-busting query parameter (?v=...) to all metadata content URLs.
 */
export function updateOpenGraphMeta(options: OpenGraphMetaOptions): void {
  if (typeof document === 'undefined') return;

  const version = options.version || Date.now();
  const title = options.title;
  const description = options.description;
  const rawImageUrl = options.imageUrl || loadCustomOgImage() || '/og-image-round.jpg';
  const rawFaviconUrl = options.faviconUrl || loadCustomOgImage() || '/og-image-round.jpg';

  // Build absolute image URL
  let absoluteImageUrl = rawImageUrl;
  if (!rawImageUrl.startsWith('http://') && !rawImageUrl.startsWith('https://') && !rawImageUrl.startsWith('data:')) {
    const origin = window.location.origin;
    const cleanPath = rawImageUrl.startsWith('/') ? rawImageUrl : `/${rawImageUrl}`;
    absoluteImageUrl = `${origin}${cleanPath}`;
  }

  // Build absolute favicon URL (Always square emblem/icon)
  let absoluteFaviconUrl = rawFaviconUrl;
  if (!rawFaviconUrl.startsWith('http://') && !rawFaviconUrl.startsWith('https://') && !rawFaviconUrl.startsWith('data:')) {
    const origin = window.location.origin;
    const cleanPath = rawFaviconUrl.startsWith('/') ? rawFaviconUrl : `/${rawFaviconUrl}`;
    absoluteFaviconUrl = `${origin}${cleanPath}`;
  }

  // Append cache buster ?v=...
  const busterImageUrl = addCacheBusterToUrl(absoluteImageUrl, version);
  const busterFaviconUrl = addCacheBusterToUrl(absoluteFaviconUrl, version);

  // Build absolute page URL
  let absolutePageUrl = options.url || window.location.href;
  const busterPageUrl = addCacheBusterToUrl(absolutePageUrl, version);

  // 1. Helper to set or create meta element
  const setMetaTag = (attrName: 'property' | 'name', attrValue: string, contentValue: string) => {
    if (!contentValue) return;
    let element = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', contentValue);
  };

  // 2. Helper to set or create link element
  const setLinkTag = (relValue: string, hrefValue: string) => {
    if (!hrefValue) return;
    let element = document.querySelector<HTMLLinkElement>(`link[rel="${relValue}"]`);
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', relValue);
      document.head.appendChild(element);
    }
    element.setAttribute('href', hrefValue);
  };

  // 3. Update Page Title
  if (title) {
    document.title = title;
    setMetaTag('property', 'og:title', title);
    setMetaTag('name', 'twitter:title', title);
  }

  // 4. Update Description
  if (description) {
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:description', description);
    setMetaTag('name', 'twitter:description', description);
  }

  // 5. Update Open Graph Image Meta Tags with ?v=... cache-buster
  setMetaTag('property', 'og:image', busterImageUrl);
  setMetaTag('property', 'og:image:url', busterImageUrl);
  setMetaTag('property', 'og:image:secure_url', busterImageUrl);
  setMetaTag('name', 'twitter:image', busterImageUrl);
  setMetaTag('name', 'twitter:image:src', busterImageUrl);

  // 6. Update Canonical URL & Open Graph Page URL and signal crawlers to re-scrape
  injectCanonicalAndSignalRescrape(absolutePageUrl, version);

  // 7. Update Favicons (Uses dedicated busterFaviconUrl, NOT busterImageUrl)
  const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel='apple-touch-icon']");
  iconLinks.forEach((link) => {
    link.href = busterFaviconUrl;
  });
}

/**
 * Dynamically injects a canonical meta link with a versioned URL into the document head
 * and triggers a document.dispatchEvent to signal crawlers to re-scrape the page.
 */
export function injectCanonicalAndSignalRescrape(url?: string, version?: string | number): string {
  if (typeof document === 'undefined') return '';

  const v = version || Date.now();
  const baseUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const versionedUrl = addCacheBusterToUrl(baseUrl, v);

  // 1. Inject or update <link rel="canonical">
  let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', versionedUrl);

  // 2. Inject or update <meta property="og:url">
  let ogUrlMeta = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (!ogUrlMeta) {
    ogUrlMeta = document.createElement('meta');
    ogUrlMeta.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrlMeta);
  }
  ogUrlMeta.setAttribute('content', versionedUrl);

  // 3. Dispatch custom event signal for crawlers / listeners to re-scrape page
  try {
    const rescrapeEvent = new CustomEvent('rescrape', {
      detail: { url: versionedUrl, version: v, timestamp: Date.now() }
    });
    document.dispatchEvent(rescrapeEvent);

    const metaUpdatedEvent = new CustomEvent('meta:updated', {
      detail: { canonicalUrl: versionedUrl, version: v, timestamp: Date.now() }
    });
    document.dispatchEvent(metaUpdatedEvent);
  } catch {
    const simpleEvent = new Event('rescrape');
    document.dispatchEvent(simpleEvent);
  }

  return versionedUrl;
}

/**
 * Dynamic mechanism to update the og:image meta tag and head metadata when a module or mapel is selected.
 */
export function updateOgForModuleOrMapel(
  module?: ModulAjarCinta | null,
  mapelNameInput?: string,
  customVersion?: string | number
): void {
  const v = customVersion || Date.now();
  const rawMapelName = mapelNameInput || module?.identitas?.mataPelajaran || '';

  let title = 'Modul Ajar Berbasis Cinta - MI Ma\'arif NU 2 Sanggreman';
  let description = 'Aplikasi Penyusun Modul Ajar Kurikulum Berbasis Cinta (KBC) Terintegrasi AI Gemini, Bank Materi, Media Digital & Kuis Interaktif.';
  let imageUrl = loadCustomOgImage() || '/og-image-round.jpg';

  if (rawMapelName) {
    try {
      const configs = loadMapelOgConfigs();
      const key = sanitizeMapelKey(rawMapelName);
      const cfg = configs[key] || configs[rawMapelName];
      if (cfg && cfg.imageUrl && cfg.imageUrl.trim()) {
        imageUrl = cfg.imageUrl.trim();
      } else {
        imageUrl = getPresetImageForMapel(rawMapelName);
      }
    } catch (e) {
      console.error('Error reading mapel thumbnail for OG:', e);
      imageUrl = getPresetImageForMapel(rawMapelName);
    }
  }

  if (module) {
    const mapel = module.identitas?.mataPelajaran || rawMapelName || 'Modul Ajar';
    const topik = module.identitas?.materi || module.judul || 'KBC';
    const fase = module.identitas?.faseKelas ? `Kelas ${module.identitas.faseKelas}` : '';

    title = `${mapel} - ${topik} (${fase})`;
    description = `Modul Ajar KBC ${mapel} ${fase}. Materi: ${topik}. MI Ma'arif NU 2 Sanggreman.`;

    const modImg = module.assesmen?.mediaDigital?.gambarInteraktif?.imageUrl;
    if (modImg && !modImg.includes('1577896851231-70ef18881754') && !modImg.includes('placeholder-broken')) {
      imageUrl = modImg;
    }
  } else if (rawMapelName) {
    title = `Kuis & Media Interaktif ${rawMapelName}`;
    description = `Modul Ajar Kurikulum Berbasis Cinta (KBC) Mata Pelajaran ${rawMapelName}.`;
  }

  updateOpenGraphMeta({
    title,
    description,
    imageUrl,
    version: v
  });
}
