import React from 'react';

export function compressAndResizeImage(
  file: File,
  maxDimension: number = 800,
  quality: number = 0.80
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill white background to prevent black background when converting PNG transparency to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // ALWAYS use image/jpeg so quality compression takes effect and payload remains lightweight (~30-80KB)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Utility helper for managing educational visual media & images in Modul Ajar KBC.
 * Provides reliable image URLs, SVG vector illustrations fallback (100% offline & load-safe),
 * curated image presets, and image error handling.
 */

export interface ImagePreset {
  id: string;
  category: string;
  title: string;
  description: string;
  url: string;
  prompt: string;
}

/**
 * Generates an SVG Vector Illustration as Data URI.
 * This ensures that visual media ALWAYS displays completely even if external image servers (Pollinations/Unsplash) are offline or blocked.
 */
export function getEducationalSvgIllustration(materi: string = 'Materi Pembelajaran', mapel: string = 'Akidah Akhlak'): string {
  const safeMateri = (materi || 'Materi Pembelajaran KBC').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeMapel = (mapel || 'Madrasah Ibtidaiyah').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Choose accent theme color based on mapel
  let primaryGradient = '#047857, #0f766e, #115e59'; // Emerald Teal default
  let accentColor = '#f59e0b'; // Amber
  let badgeBg = '#065f46';

  const mapelLower = safeMapel.toLowerCase();
  if (mapelLower.includes('akidah') || mapelLower.includes('al-qur\'an') || mapelLower.includes('quran')) {
    primaryGradient = '#065f46, #047857, #0d9488'; // Emerald
    accentColor = '#fbbf24';
  } else if (mapelLower.includes('fiqih') || mapelLower.includes('fikih')) {
    primaryGradient = '#1e3a8a, #1d4ed8, #0284c7'; // Deep Blue
    accentColor = '#38bdf8';
    badgeBg = '#1e40af';
  } else if (mapelLower.includes('ski') || mapelLower.includes('sejarah')) {
    primaryGradient = '#78350f, #b45309, #d97706'; // Warm Amber/Gold
    accentColor = '#fef08a';
    badgeBg = '#92400e';
  } else if (mapelLower.includes('arab') || mapelLower.includes('bahasa')) {
    primaryGradient = '#831843, #be185d, #9d174d'; // Rose Wine
    accentColor = '#fbcfe8';
    badgeBg = '#9f1239';
  } else if (mapelLower.includes('ipas') || mapelLower.includes('sains')) {
    primaryGradient = '#14532d, #15803d, #16a34a'; // Green Nature
    accentColor = '#86efac';
    badgeBg = '#166534';
  }

  const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryGradient.split(',')[0].trim()}" />
      <stop offset="50%" stop-color="${primaryGradient.split(',')[1]?.trim() || primaryGradient.split(',')[0].trim()}" />
      <stop offset="100%" stop-color="${primaryGradient.split(',')[2]?.trim() || primaryGradient.split(',')[0].trim()}" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
    </linearGradient>
    <pattern id="islamicPattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1.5" />
      <circle cx="20" cy="20" r="6" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="800" height="500" fill="url(#bgGrad)" rx="24" />
  <rect width="800" height="500" fill="url(#islamicPattern)" rx="24" />

  <!-- Decorative Islamic Arches in Top Corners -->
  <path d="M 0 0 C 200 0, 300 120, 400 120 C 500 120, 600 0, 800 0 Z" fill="#ffffff" fill-opacity="0.06" />

  <!-- Central Glassmorphism Banner -->
  <rect x="50" y="60" width="700" height="380" rx="20" fill="url(#cardGrad)" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2" />

  <!-- Top Badge -->
  <rect x="250" y="85" width="300" height="34" rx="17" fill="${badgeBg}" stroke="${accentColor}" stroke-opacity="0.5" stroke-width="1.5" />
  <text x="400" y="107" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">
    MEDIA VISUAL LITERASI KBC • ${safeMapel.toUpperCase()}
  </text>

  <!-- Center Heart & Crescent Illustration Icon -->
  <g transform="translate(400, 205)">
    <!-- Glow Circle -->
    <circle cx="0" cy="0" r="55" fill="#ffffff" fill-opacity="0.15" />
    <circle cx="0" cy="0" r="44" fill="${accentColor}" fill-opacity="0.9" />

    <!-- Open Book / Heart Icon -->
    <path d="M -22 -10 C -12 -22, 0 -12, 0 5 C 0 -12, 12 -22, 22 -10 C 28 2, 22 18, 0 32 C -22 18, -28 2, -22 -10 Z" fill="#ffffff" />
    <path d="M -18 -2 C -10 -12, 0 -5, 0 8 C 0 -5, 10 -12, 18 -2" fill="none" stroke="${badgeBg}" stroke-width="2.5" />
  </g>

  <!-- Title Text -->
  <text x="400" y="300" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">
    ${safeMateri.length > 45 ? safeMateri.substring(0, 42) + '...' : safeMateri}
  </text>

  <!-- Subtitle -->
  <text x="400" y="332" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="#e2e8f0" text-anchor="middle">
    Pembelajaran Karakter &amp; Nilai Kurikulum Berbasis Cinta (KBC)
  </text>

  <!-- Bottom Badges / Points -->
  <g transform="translate(150, 365)">
    <rect x="0" y="0" width="150" height="30" rx="8" fill="#ffffff" fill-opacity="0.15" />
    <text x="75" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">
      ♥ Kasih Sayang
    </text>
  </g>
  <g transform="translate(325, 365)">
    <rect x="0" y="0" width="150" height="30" rx="8" fill="#ffffff" fill-opacity="0.15" />
    <text x="75" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">
      📖 Literasi Visual
    </text>
  </g>
  <g transform="translate(500, 365)">
    <rect x="0" y="0" width="150" height="30" rx="8" fill="#ffffff" fill-opacity="0.15" />
    <text x="75" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">
      ✨ Akhlak Mulia
    </text>
  </g>

  <!-- Footer Credit -->
  <text x="400" y="475" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#ffffff" fill-opacity="0.8" text-anchor="middle">
    Madrasah Ibtidaiyah Ma'arif NU • Modul Ajar KBC
  </text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Curated Preset Images for Madrasah Subjects.
 */
export const EDUCATIONAL_IMAGE_PRESETS: ImagePreset[] = [
  {
    id: 'akidah-1',
    category: 'Akidah Akhlak',
    title: 'Saling Menyayangi & Asmaul Husna',
    description: 'Ilustrasi kehangatan siswa madrasah saling membantu dan menyayangi sesama teman.',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
    prompt: 'Indonesian elementary students smiling and helping each other in classroom, warm Islamic values, friendly vector style'
  },
  {
    id: 'fiqih-1',
    category: 'Fiqih',
    title: 'Tata Cara Bersuci & Shalat Berjamaah',
    description: 'Visual tata cara wudhu dan kerapian shalat berjamaah di musholla madrasah.',
    url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=800&q=80',
    prompt: 'Students practicing prayer together in peaceful clean Islamic school, warm lighting'
  },
  {
    id: 'quran-1',
    category: 'Al-Qur\'an Hadis',
    title: 'Membaca & Memahami Al-Qur\'an',
    description: 'Aktivitas belajar tajwid dan tadarus Al-Qur\'an dengan kelembutan guru KBC.',
    url: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80',
    prompt: 'Quran open on wooden stand with warm light in peaceful Islamic library'
  },
  {
    id: 'ski-1',
    category: 'SKI',
    title: 'Kisah Nabi & Peradaban Islam',
    description: 'Ilustrasi peta sejarah dan nilai kepemimpinan Nabi Muhammad SAW.',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80',
    prompt: 'Islamic architecture history book with beautiful Arabic calligraphy illumination'
  },
  {
    id: 'bahasa-1',
    category: 'Bahasa Arab',
    title: 'Mufradat & Percakapan Ramah',
    description: 'Kartu kosa kata Bahasa Arab dan simulasi hiwar ramah antar siswa.',
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    prompt: 'Educational study book with Arabic vocabulary flashcards, bright student desk'
  }
];

/**
 * Returns a guaranteed loadable image URL.
 * If provided imageUrl is missing or known broken, uses Pollinations or SVG fallback.
 */
export function getReliableImageUrl(
  imageUrl?: string,
  promptGambar?: string,
  materi: string = 'Pembelajaran MI',
  mapel: string = 'Akidah Akhlak'
): string {
  if (imageUrl && imageUrl.trim().length > 10 && !imageUrl.includes('placeholder-broken')) {
    return imageUrl.trim();
  }

  const promptText = promptGambar || `Vector illustration of Islamic primary school lesson ${materi}, Indonesian students smiling, child friendly`;
  
  // Return pollinations URL with fallback capability
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText + ', clean vector style, bright educational colors, child-friendly')}&width=800&height=600&nologo=true`;
}

/**
 * Event handler for <img> error fallback.
 * Supports trying a fallback image URL or swapping broken src with guaranteed offline SVG illustration data URI.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrlOrMateri: string = 'Pembelajaran KBC',
  mapel: string = 'Akidah Akhlak'
) {
  const target = e.currentTarget;

  // If a fallback URL was provided (http/https/data/relative path) and hasn't been tried yet, try it first
  if (!target.dataset.fallbackAttempted && fallbackUrlOrMateri) {
    const isUrl =
      fallbackUrlOrMateri.startsWith('http://') ||
      fallbackUrlOrMateri.startsWith('https://') ||
      fallbackUrlOrMateri.startsWith('data:') ||
      fallbackUrlOrMateri.startsWith('/');
    
    if (isUrl) {
      target.dataset.fallbackAttempted = 'true';
      target.src = fallbackUrlOrMateri;
      return;
    }
  }

  if (!target.dataset.svgFallbackDone) {
    target.dataset.svgFallbackDone = 'true';
    const fallbackMateri = fallbackUrlOrMateri && !fallbackUrlOrMateri.includes('http') && !fallbackUrlOrMateri.startsWith('/')
      ? fallbackUrlOrMateri
      : 'Pembelajaran KBC';
    target.src = getEducationalSvgIllustration(fallbackMateri, mapel);
  }
}

