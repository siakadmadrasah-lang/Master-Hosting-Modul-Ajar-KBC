import { loadMapelOgConfigs, saveMapelOgConfigs } from './storage';

export const DEFAULT_MAPEL_PRESET_IMAGES: Record<string, string> = {
  'Al-Qur\'an Hadis': 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80',
  'Akidah Akhlak': 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80',
  'Fiqih': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80',
  'Sejarah Kebudayaan Islam (SKI)': 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
  'Bahasa Arab': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
  'Pendidikan Agama Islam': 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80',
  'Ke-NU-an / Aswaja': '/data/og_mapel_ke_nu_an.jpg',
  'IPAS (IPA & IPS)': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
  'Matematika': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
  'Bahasa Indonesia': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
  'Pendidikan Pancasila': 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80',
  'PJOK': 'https://images.unsplash.com/photo-1517649763962-0c623266ecf0?auto=format&fit=crop&w=1200&q=80',
  'Bahasa Inggris': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80',
  'Bahasa Jawa': 'https://images.unsplash.com/photo-1528164344705-47542687990d?auto=format&fit=crop&w=1200&q=80',
  'Seni Budaya': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
  'P5 & PPRA': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'
};

export function getPresetImageForMapel(mapel: string): string {
  if (!mapel) return 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80';
  if (DEFAULT_MAPEL_PRESET_IMAGES[mapel]) return DEFAULT_MAPEL_PRESET_IMAGES[mapel];
  const m = mapel.toLowerCase();
  if (m.includes('nu') || m.includes('aswaja') || m.includes('nahdlatul')) return DEFAULT_MAPEL_PRESET_IMAGES['Ke-NU-an / Aswaja'];
  if (m.includes('akidah') || m.includes('akhlak')) return DEFAULT_MAPEL_PRESET_IMAGES['Akidah Akhlak'];
  if (m.includes('fiqih') || m.includes('fikih')) return DEFAULT_MAPEL_PRESET_IMAGES['Fiqih'];
  if (m.includes('qur') || m.includes('hadis') || m.includes('hadits')) return DEFAULT_MAPEL_PRESET_IMAGES['Al-Qur\'an Hadis'];
  if (m.includes('ski') || m.includes('sejarah')) return DEFAULT_MAPEL_PRESET_IMAGES['Sejarah Kebudayaan Islam (SKI)'];
  if (m.includes('arab')) return DEFAULT_MAPEL_PRESET_IMAGES['Bahasa Arab'];
  if (m.includes('ipas') || m.includes('ipa') || m.includes('ips')) return DEFAULT_MAPEL_PRESET_IMAGES['IPAS (IPA & IPS)'];
  if (m.includes('matematika') || m.includes('mtk')) return DEFAULT_MAPEL_PRESET_IMAGES['Matematika'];
  if (m.includes('pancasila') || m.includes('ppkn') || m.includes('pkn')) return DEFAULT_MAPEL_PRESET_IMAGES['Pendidikan Pancasila'];
  if (m.includes('inggris')) return DEFAULT_MAPEL_PRESET_IMAGES['Bahasa Inggris'];
  if (m.includes('indonesia')) return DEFAULT_MAPEL_PRESET_IMAGES['Bahasa Indonesia'];
  if (m.includes('jawa')) return DEFAULT_MAPEL_PRESET_IMAGES['Bahasa Jawa'];
  if (m.includes('pjok') || m.includes('olahraga') || m.includes('penjas') || m.includes('jasmani')) return DEFAULT_MAPEL_PRESET_IMAGES['PJOK'];
  if (m.includes('seni') || m.includes('prakarya') || m.includes('sbk') || m.includes('sbdp')) return DEFAULT_MAPEL_PRESET_IMAGES['Seni Budaya'];
  if (m.includes('p5') || m.includes('ppra')) return DEFAULT_MAPEL_PRESET_IMAGES['P5 & PPRA'];
  return 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80';
}

export function strictUrlEncode(str: string): string {
  if (!str) return '';
  return encodeURIComponent(str).replace(/['()*~!]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

export function sanitizeMapelKey(mapel: string): string {
  if (!mapel) return '';
  let str = String(mapel).trim();
  if (['default', 'app', 'main', 'all', 'none', 'general'].includes(str.toLowerCase())) return '';

  // 1. Unescape HTML entities
  str = str
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

  // 2. Safely decode URI components
  try { str = decodeURIComponent(str); } catch {}
  try { str = decodeURIComponent(str.replace(/\+/g, ' ')); } catch {}

  // 3. Lowercase and replace non-alphanumeric with underscore
  let key = str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  if (!key || ['default', 'app', 'main', 'all', 'none', 'general'].includes(key)) return '';

  // 4. Canonicalize subject key aliases with exact alias mapping
  const aliases: Record<string, string> = {
    quran_hadis: 'al_qur_an_hadis',
    quran: 'al_qur_an_hadis',
    hadis: 'al_qur_an_hadis',
    hadits: 'al_qur_an_hadis',
    al_quran_hadis: 'al_qur_an_hadis',
    al_qur_an_hadis: 'al_qur_an_hadis',

    akidah: 'akidah_akhlak',
    akhlak: 'akidah_akhlak',
    aqidah: 'akidah_akhlak',
    aqidah_akhlak: 'akidah_akhlak',
    akidah_akhlak: 'akidah_akhlak',

    fikih: 'fiqih',
    fiqih: 'fiqih',

    ski: 'sejarah_kebudayaan_islam_ski',
    sejarah_kebudayaan_islam: 'sejarah_kebudayaan_islam_ski',
    sejarah_kebudayaan_islam_ski: 'sejarah_kebudayaan_islam_ski',

    arab: 'bahasa_arab',
    bahasa_arab: 'bahasa_arab',

    pancasila: 'pendidikan_pancasila',
    ppkn: 'pendidikan_pancasila',
    pkn: 'pendidikan_pancasila',
    pendidikan_pancasila: 'pendidikan_pancasila',

    indonesia: 'bahasa_indonesia',
    bahasa_indonesia: 'bahasa_indonesia',

    mtk: 'matematika',
    math: 'matematika',
    matematika: 'matematika',

    ipa: 'ipas',
    ips: 'ipas',
    ipas: 'ipas',
    ipas_ipa_ips: 'ipas',
    sains: 'ipas',

    inggris: 'bahasa_inggris',
    english: 'bahasa_inggris',
    bahasa_inggris: 'bahasa_inggris',
    b_inggris: 'bahasa_inggris',
    b_inggris_: 'bahasa_inggris',

    jawa: 'bahasa_jawa',
    bahasa_jawa: 'bahasa_jawa',

    penjas: 'pjok',
    penjaskes: 'pjok',
    olahraga: 'pjok',
    jasmani: 'pjok',
    pendidikan_jasmani: 'pjok',
    penjasorkes: 'pjok',
    pjok: 'pjok',

    seni: 'seni_budaya',
    prakarya: 'seni_budaya',
    sbk: 'seni_budaya',
    sbdp: 'seni_budaya',
    seni_budaya: 'seni_budaya',
    seni_rupa: 'seni_budaya',
    seni_musik: 'seni_budaya',
    seni_tari: 'seni_budaya',
    seni_teater: 'seni_budaya',

    p5: 'p5_ppra',
    ppra: 'p5_ppra',
    proyek: 'p5_ppra',
    p5_ppra: 'p5_ppra',

    ke_nu_an: 'ke_nu_an',
    aswaja: 'aswaja',

    pai: 'pendidikan_agama_islam',
    pendidikan_agama_islam: 'pendidikan_agama_islam'
  };

  if (aliases[key]) {
    return aliases[key];
  }

  return key;
}

export interface MapelOgConfig {
  title: string;
  desc: string;
  imageUrl: string;
  updatedAt?: string;
}

/**
 * Fetch Mapel OG configurations from server with automatic fallback between Node / Express API and PHP api.php
 */
export async function fetchMapelOgConfigsApi(): Promise<Record<string, MapelOgConfig>> {
  let configs: Record<string, MapelOgConfig> = {};

  try {
    let res = await fetch('/api/mapel-og-configs');
    let text = await res.text();
    let data: any = null;

    try {
      data = JSON.parse(text);
    } catch {
      // Fallback for PHP hosting or static server routing
      res = await fetch('/api.php?action=get_mapel_og');
      text = await res.text();
      data = JSON.parse(text);
    }

    if (data && data.success && data.configs) {
      configs = data.configs;
    }
  } catch (err) {
    console.warn('Network error or server unavailable when fetching mapel OG configs:', err);
  }

  // Merge server configs with local storage
  const localConfigs = loadMapelOgConfigs();
  const merged: Record<string, MapelOgConfig> = { ...localConfigs };

  if (configs && Object.keys(configs).length > 0) {
    for (const [key, cfg] of Object.entries(configs)) {
      if (!cfg) continue;
      const sanitizedKey = sanitizeMapelKey(key);
      const existing = merged[sanitizedKey] || merged[key];

      const serverTime = cfg.updatedAt ? new Date(cfg.updatedAt).getTime() : 0;
      const existingTime = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;

      // If existing config has a newer timestamp than this server config, do NOT overwrite it
      if (existing && existingTime > serverTime) {
        continue;
      }

      let chosenImageUrl = cfg.imageUrl || existing?.imageUrl || '';
      if (existing?.imageUrl && (existing.imageUrl.startsWith('data:') || existing.imageUrl.startsWith('http'))) {
        if (existingTime > serverTime || !cfg.imageUrl) {
          chosenImageUrl = existing.imageUrl;
        }
      }

      const updatedCfg: MapelOgConfig = {
        title: cfg.title || existing?.title || `Kuis & Media Interaktif ${key}`,
        desc: cfg.desc || existing?.desc || `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${key}`,
        imageUrl: chosenImageUrl,
        updatedAt: cfg.updatedAt || existing?.updatedAt || new Date().toISOString()
      };

      // Store under sanitized key
      merged[sanitizedKey] = updatedCfg;
      // Also store under raw key for direct lookup
      if (key !== sanitizedKey) {
        merged[key] = updatedCfg;
      }
    }
  }

  // Save merged state to local storage
  saveMapelOgConfigs(merged, false);
  return merged;
}

/**
 * Save Mapel OG configuration permanently to server with automatic fallback between Node / Express API and PHP api.php
 */
export async function saveMapelOgConfigApi(
  mapel: string,
  title: string,
  desc: string,
  imageUrl: string
): Promise<{ success: boolean; config?: MapelOgConfig; message?: string }> {
  const sanitizedKey = sanitizeMapelKey(mapel);
  const nowIso = new Date().toISOString();

  const payload = {
    mapel,
    mapelKey: sanitizedKey,
    title: title.trim() || `Kuis & Media Interaktif ${mapel}`,
    desc: desc.trim() || `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${mapel}`,
    imageUrl: imageUrl.trim() || getPresetImageForMapel(mapel)
  };

  // 1. Immediately update LocalStorage so UI is instant and persistent locally
  const localConfigs = loadMapelOgConfigs();
  const newConfig: MapelOgConfig = {
    title: payload.title,
    desc: payload.desc,
    imageUrl: payload.imageUrl,
    updatedAt: nowIso
  };

  const updatedLocal = {
    ...localConfigs,
    [sanitizedKey]: newConfig,
    [mapel]: newConfig
  };

  // Sync alias variants for popular mapel keys (e.g. Bahasa Inggris, Aswaja, etc.)
  if (sanitizedKey === 'bahasa_inggris') {
    updatedLocal['inggris'] = newConfig;
    updatedLocal['english'] = newConfig;
    updatedLocal['Bahasa Inggris'] = newConfig;
    updatedLocal['English'] = newConfig;
    updatedLocal['b_inggris'] = newConfig;
  } else if (sanitizedKey === 'ke_nu_an') {
    updatedLocal['ke_nu_an'] = newConfig;
    updatedLocal['Ke-NU-an'] = newConfig;
  } else if (sanitizedKey === 'aswaja') {
    updatedLocal['aswaja'] = newConfig;
    updatedLocal['Aswaja'] = newConfig;
  } else if (sanitizedKey === 'seni_budaya') {
    updatedLocal['seni'] = newConfig;
    updatedLocal['seni_budaya'] = newConfig;
    updatedLocal['prakarya'] = newConfig;
    updatedLocal['sbk'] = newConfig;
    updatedLocal['sbdp'] = newConfig;
    updatedLocal['Seni Budaya'] = newConfig;
    updatedLocal['Seni Budaya & Prakarya'] = newConfig;
    updatedLocal['Seni Budaya dan Prakarya'] = newConfig;
  } else if (sanitizedKey === 'pjok') {
    updatedLocal['pjok'] = newConfig;
    updatedLocal['penjas'] = newConfig;
    updatedLocal['penjaskes'] = newConfig;
    updatedLocal['olahraga'] = newConfig;
    updatedLocal['jasmani'] = newConfig;
    updatedLocal['pendidikan_jasmani'] = newConfig;
    updatedLocal['PJOK'] = newConfig;
    updatedLocal['Pendidikan Jasmani'] = newConfig;
    updatedLocal['Pendidikan Jasmani, Olahraga, dan Kesehatan'] = newConfig;
    updatedLocal['Penjasorkes'] = newConfig;
  }

  saveMapelOgConfigs(updatedLocal, true);

  // 2. Post to backend server (Node or PHP)
  let serverData: any = null;

  try {
    const res = await fetch('/api/mapel-og-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const text = await res.text();
      try {
        serverData = JSON.parse(text);
      } catch {}
    }
  } catch (err) {
    console.warn('Node API save failed, attempting PHP api.php fallback...', err);
  }

  // If Express endpoint didn't return success: true, try PHP api.php directly
  if (!serverData || !serverData.success) {
    try {
      const res = await fetch('/api.php?action=save_mapel_og', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const text = await res.text();
        try {
          serverData = JSON.parse(text);
        } catch {}
      }
    } catch (err) {
      console.warn('PHP API save failed:', err);
    }
  }

  if (serverData && serverData.success && serverData.config) {
    const serverConfig: MapelOgConfig = {
      title: serverData.config.title || newConfig.title,
      desc: serverData.config.desc || newConfig.desc,
      imageUrl: serverData.config.imageUrl || newConfig.imageUrl,
      updatedAt: serverData.config.updatedAt || nowIso
    };

    // Store server's saved imageUrl (e.g. /data/og_mapel_fiqih.jpg?v=...) into LocalStorage
    const finalLocal = {
      ...updatedLocal,
      [sanitizedKey]: serverConfig,
      [mapel]: serverConfig
    };
    saveMapelOgConfigs(finalLocal, false);

    return { success: true, config: serverConfig, message: serverData.message };
  }

  return { success: true, config: newConfig };
}

/**
 * Look up Mapel OG config for any subject (new or old) with fallback to fuzzy substring matching
 */
export function getMapelOgConfigForSubject(
  mapel: string,
  configs?: Record<string, MapelOgConfig>
): MapelOgConfig | null {
  if (!mapel) return null;
  const store = configs || loadMapelOgConfigs();
  if (!store || Object.keys(store).length === 0) return null;

  const sanitizedKey = sanitizeMapelKey(mapel);
  const candidates = [sanitizedKey, mapel, mapel.toLowerCase().trim()].filter(Boolean);

  // 1. Direct exact match
  for (const cand of candidates) {
    if (store[cand] && store[cand].imageUrl) return store[cand];
  }

  // 2. Canonicalized key match
  for (const [k, v] of Object.entries(store)) {
    if (!v || !v.imageUrl) continue;
    const ck = sanitizeMapelKey(k);
    if (ck && ck === sanitizedKey) return v;
  }

  return null;
}
