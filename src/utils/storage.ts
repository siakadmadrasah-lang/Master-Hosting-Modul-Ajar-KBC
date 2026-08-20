import { getPresetImageForMapel, sanitizeMapelKey, saveMapelOgConfigApi } from './mapelOgApi';
import { ModulAjarCinta, KopSuratSettings, TTDSettings, SupabaseConfig, MysqlConfig, MateriBankItem, TeacherItem, MadrasahItem, DEFAULT_TAHUN_AJARAN_OPTIONS, MAPEL_MI_OPTIONS, WelcomeBannerConfig, DEFAULT_WELCOME_BANNER_CONFIG, StudentAccount, StudentQuizResult, AdminAccountItem, ALL_ADMIN_PERMISSIONS, DocumentProtectionConfig, DEFAULT_DOCUMENT_PROTECTION_CONFIG } from '../types';
import { SAMPLE_MODULES, DEFAULT_KOP_SURAT, DEFAULT_TTD, INITIAL_MATERI_BANK, DEFAULT_TEACHERS } from '../data/sampleModules';
import { debouncedPushToCloud } from './firebaseSync';
import { debouncedPushToSupabase } from './supabaseSync';
import { debouncedPushToMysql } from './mysqlSync';

export const DEFAULT_MADRASAH_LIST: MadrasahItem[] = [
  {
    id: 'mi-maarif-nu-2-sanggreman',
    nama: "MI Ma'arif NU 2 Sanggreman",
    kodeMadrasah: "MIMNU2SANGGREMAN",
    jenjang: "MI",
    nsm: "111233020054",
    npsn: "60712345",
    nsmOrNpsn: "111233020054",
    statusSekolah: "Swasta",
    akreditasi: "A (Unggul)",
    noSkAkreditasi: "1347/BAN-SM/SK/2021",
    tglAkreditasi: "08 Desember 2021 - 2026",
    skIzinOperasional: "Kd.11.02/4/PP.00.4/0125/2010",
    tglSkIzinOperasional: "12 Juli 2010",
    tahunBerdiri: "1968",
    kepalaMadrasah: "JAENAL MASKUN, S.Pd.I.",
    nipKepalaMadrasah: "198205122009011003",
    namaYayasan: "Lembaga Pendidikan Ma'arif NU Banyumas",
    noSkYayasan: "AHU-0001234.AH.01.04.Tahun 2015",
    alamat: "Jl. Ma'arif No. 02",
    rtRw: "03 / 01",
    dusun: "Sanggreman Barat",
    alamatLengkap: "Jl. Ma'arif No. 02 RT 03/RW 01, Sanggreman, Kec. Rawalo, Kab. Banyumas, Jawa Tengah 53173",
    desaKelurahan: "Sanggreman",
    kecamatan: "Rawalo",
    kotaKabupaten: "Kab. Banyumas",
    provinsi: "Jawa Tengah",
    kodePos: "53173",
    titikKoordinat: "-7.518294, 109.184721",
    kontak: "081234567890",
    email: "mimaarifnu2sanggreman@gmail.com",
    website: "https://maarifnubanyumas.or.id",
    jumlahSiswaL: 112,
    jumlahSiswaP: 98,
    jumlahRombel: 6,
    jumlahGuruL: 4,
    jumlahGuruP: 8,
    jumlahTendik: 2,
    createdAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 'mi-maarif-nu-1-sanggreman',
    nama: "MI Ma'arif NU 1 Sanggreman",
    kodeMadrasah: "MIMNU1SANGGREMAN",
    jenjang: "MI",
    nsm: "111233020053",
    npsn: "60712344",
    nsmOrNpsn: "111233020053",
    statusSekolah: "Swasta",
    akreditasi: "B (Baik)",
    noSkAkreditasi: "0982/BAN-SM/SK/2022",
    tglAkreditasi: "15 Oktober 2022 - 2027",
    skIzinOperasional: "Kd.11.02/4/PP.00.4/0110/2010",
    tglSkIzinOperasional: "10 Mei 2010",
    tahunBerdiri: "1965",
    kepalaMadrasah: "AHMAD KHOLIL, S.Pd.I.",
    nipKepalaMadrasah: "198501012010011002",
    namaYayasan: "Lembaga Pendidikan Ma'arif NU Banyumas",
    noSkYayasan: "AHU-0001234.AH.01.04.Tahun 2015",
    alamat: "Jl. Pendidikan No. 01",
    rtRw: "01 / 02",
    dusun: "Sanggreman Timur",
    alamatLengkap: "Jl. Pendidikan No. 01 RT 01/RW 02, Sanggreman, Kec. Rawalo, Kab. Banyumas, Jawa Tengah 53173",
    desaKelurahan: "Sanggreman",
    kecamatan: "Rawalo",
    kotaKabupaten: "Kab. Banyumas",
    provinsi: "Jawa Tengah",
    kodePos: "53173",
    titikKoordinat: "-7.519100, 109.186200",
    kontak: "082134567891",
    email: "mimaarifnu1sanggreman@gmail.com",
    website: "https://maarifnubanyumas.or.id",
    jumlahSiswaL: 95,
    jumlahSiswaP: 88,
    jumlahRombel: 6,
    jumlahGuruL: 3,
    jumlahGuruP: 7,
    jumlahTendik: 2,
    createdAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 'mi-maarif-nu-karanglewas',
    nama: "MI Ma'arif NU Karanglewas",
    kodeMadrasah: "MIMNUKARANGLEWAS",
    jenjang: "MI",
    nsm: "111233020055",
    npsn: "60712346",
    nsmOrNpsn: "111233020055",
    statusSekolah: "Swasta",
    akreditasi: "A (Unggul)",
    noSkAkreditasi: "1450/BAN-SM/SK/2021",
    tglAkreditasi: "20 November 2021 - 2026",
    skIzinOperasional: "Kd.11.02/4/PP.00.4/0130/2010",
    tglSkIzinOperasional: "18 Agustus 2010",
    tahunBerdiri: "1972",
    kepalaMadrasah: "SITI NURJANAH, S.Pd.",
    nipKepalaMadrasah: "-",
    namaYayasan: "Lembaga Pendidikan Ma'arif NU Banyumas",
    noSkYayasan: "AHU-0001234.AH.01.04.Tahun 2015",
    alamat: "Jl. Karanglewas Raya No. 12",
    rtRw: "02 / 03",
    dusun: "Karanglewas Tengah",
    alamatLengkap: "Jl. Karanglewas Raya No. 12, Karanglewas, Kec. Jatilawang, Kab. Banyumas, Jawa Tengah 53174",
    desaKelurahan: "Karanglewas",
    kecamatan: "Jatilawang",
    kotaKabupaten: "Kab. Banyumas",
    provinsi: "Jawa Tengah",
    kodePos: "53174",
    titikKoordinat: "-7.525400, 109.124500",
    kontak: "085678901234",
    email: "mimaarifnukaranglewas@gmail.com",
    website: "https://maarifnubanyumas.or.id",
    jumlahSiswaL: 120,
    jumlahSiswaP: 110,
    jumlahRombel: 6,
    jumlahGuruL: 5,
    jumlahGuruP: 9,
    jumlahTendik: 3,
    createdAt: "2025-01-01T00:00:00.000Z"
  }
];

const MULTI_TENANT_KEYS = {
  MADRASAH_LIST: 'kbc_mi_madrasah_list_v1',
  ACTIVE_MADRASAH_ID: 'kbc_mi_active_madrasah_id_v1'
};

const STORAGE_KEYS = {
  MODULES: 'kbc_mi_modules_v1',
  KOP_SURAT: 'kbc_mi_kop_surat_v1',
  TTD: 'kbc_mi_ttd_v1',
  API_KEY: 'kbc_mi_api_key_v1',
  MATERI_BANK: 'kbc_mi_materi_bank_v1',
  TEACHERS: 'kbc_mi_teachers_v1',
  STUDENTS: 'kbc_mi_students_v1',
  STUDENT_QUIZ_RESULTS: 'kbc_mi_student_quiz_results_v1',
  STUDENT_SESSION: 'kbc_mi_student_session_v1',
  CUSTOM_MAPEL: 'kbc_mi_custom_mapel_v1',
  CUSTOM_TAHUN_AJARAN: 'kbc_mi_custom_tahun_ajaran_v1',
  ACTIVE_TAHUN_AJARAN: 'kbc_mi_active_tahun_ajaran_v1',
  TEACHER_PIN: 'kbc_mi_teacher_pin_v1',
  CUSTOM_OG_IMAGE: 'kbc_mi_custom_og_image_v1',
  MAPEL_OG_CONFIGS: 'kbc_mapel_og_configs_v1',
  SUPABASE_CONFIG: 'kbc_mi_supabase_config_v1',
  MYSQL_CONFIG: 'kbc_mi_mysql_config_v1',
  ADMIN_ACCOUNTS: 'kbc_mi_admin_accounts_v1',
  DELETED_MAPEL: 'kbc_mi_deleted_mapel_v1',
  WELCOME_BANNER: 'kbc_welcome_banner_config_v1',
  DOCUMENT_PROTECTION: 'kbc_mi_doc_protection_v1',
  LAST_UPDATED: 'kbc_mi_last_updated_v1'
};

export function loadWelcomeBannerConfig(): WelcomeBannerConfig {
  try {
    const raw = localStorage.getItem(getScopedKey(STORAGE_KEYS.WELCOME_BANNER));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_WELCOME_BANNER_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load welcome banner config:', err);
  }
  return DEFAULT_WELCOME_BANNER_CONFIG;
}

export function saveWelcomeBannerConfig(config: WelcomeBannerConfig, shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.WELCOME_BANNER, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kbc_welcome_banner_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Failed to save welcome banner config:', err);
  }
}

export function loadLastUpdated(): string {
  try {
    return localStorage.getItem(getScopedKey(STORAGE_KEYS.LAST_UPDATED)) || '';
  } catch (err) {
    return '';
  }
}

export function touchLastUpdated(): string {
  const now = new Date().toISOString();
  try {
    setScopedItem(STORAGE_KEYS.LAST_UPDATED, now);
  } catch (err) {
    console.error('Error setting last updated:', err);
  }
  return now;
}

export function setLastUpdatedTimestamp(isoStr: string): void {
  try {
    if (isoStr) setScopedItem(STORAGE_KEYS.LAST_UPDATED, isoStr);
  } catch (err) {
    console.error('Error setting last updated timestamp:', err);
  }
}

export function loadMadrasahList(): MadrasahItem[] {
  try {
    const raw = localStorage.getItem(MULTI_TENANT_KEYS.MADRASAH_LIST);
    if (!raw) {
      localStorage.setItem(MULTI_TENANT_KEYS.MADRASAH_LIST, JSON.stringify(DEFAULT_MADRASAH_LIST));
      return DEFAULT_MADRASAH_LIST;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MADRASAH_LIST;
  } catch (err) {
    return DEFAULT_MADRASAH_LIST;
  }
}

export function saveMadrasahList(list: MadrasahItem[], shouldPush: boolean = true): void {
  try {
    localStorage.setItem(MULTI_TENANT_KEYS.MADRASAH_LIST, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kbc_active_madrasah_changed'));
      window.dispatchEvent(new Event('kbc_welcome_banner_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving madrasah list:', err);
  }
}

export function loadActiveMadrasahId(): string {
  try {
    const val = localStorage.getItem(MULTI_TENANT_KEYS.ACTIVE_MADRASAH_ID);
    if (val && val.trim()) return val.trim();
    return 'mi-maarif-nu-2-sanggreman';
  } catch (err) {
    return 'mi-maarif-nu-2-sanggreman';
  }
}

export function saveActiveMadrasahId(id: string): void {
  try {
    localStorage.setItem(MULTI_TENANT_KEYS.ACTIVE_MADRASAH_ID, id.trim());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kbc_active_madrasah_changed'));
      window.dispatchEvent(new Event('kbc_welcome_banner_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.error('Error saving active madrasah id:', err);
  }
}

export function getActiveMadrasah(): MadrasahItem {
  const activeId = loadActiveMadrasahId();
  const list = loadMadrasahList();
  const found = list.find(m => m.id === activeId);
  if (found) return found;
  return list[0] || DEFAULT_MADRASAH_LIST[0];
}

function getScopedKey(baseKey: string, madrasahId?: string): string {
  const id = madrasahId || loadActiveMadrasahId();
  if (id === 'mi-maarif-nu-2-sanggreman') {
    const scoped = `${baseKey}__${id}`;
    if (localStorage.getItem(scoped)) return scoped;
    return baseKey; // Fallback to root key for existing data
  }
  return `${baseKey}__${id}`;
}

function setScopedItem(baseKey: string, value: string, madrasahId?: string): void {
  const id = madrasahId || loadActiveMadrasahId();
  const targetKey = getScopedKey(baseKey, id);
  try {
    localStorage.setItem(targetKey, value);
    // Remove redundant duplicate key if present to free up quota space
    if (id === 'mi-maarif-nu-2-sanggreman') {
      const redundantKey = targetKey === baseKey ? `${baseKey}__${id}` : baseKey;
      localStorage.removeItem(redundantKey);
    }
  } catch (err) {
    console.warn(`LocalStorage quota reached when writing ${targetKey}`);
    try {
      if (id === 'mi-maarif-nu-2-sanggreman') {
        localStorage.removeItem(`${baseKey}__${id}`);
      }
      localStorage.setItem(targetKey, value);
    } catch (retryErr) {
      console.warn(`Could not save ${baseKey} to LocalStorage due to quota limits.`);
    }
  }
}

function removeScopedItem(baseKey: string, madrasahId?: string): void {
  const id = madrasahId || loadActiveMadrasahId();
  const targetKey = getScopedKey(baseKey, id);
  try {
    localStorage.removeItem(targetKey);
    if (id === 'mi-maarif-nu-2-sanggreman') {
      localStorage.removeItem(baseKey);
      localStorage.removeItem(`${baseKey}__${id}`);
    }
  } catch (err) {
    // ignore
  }
}

export function loadCustomOgImage(): string {
  try {
    return localStorage.getItem(getScopedKey(STORAGE_KEYS.CUSTOM_OG_IMAGE)) || '';
  } catch (err) {
    return '';
  }
}

export function saveCustomOgImage(urlOrBase64: string, shouldPush: boolean = true): void {
  try {
    if (urlOrBase64) {
      setScopedItem(STORAGE_KEYS.CUSTOM_OG_IMAGE, urlOrBase64);
    } else {
      removeScopedItem(STORAGE_KEYS.CUSTOM_OG_IMAGE);
    }
  } catch (err) {
    console.error('Error saving custom OG image to scoped storage:', err);
    try {
      if (urlOrBase64) {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_OG_IMAGE, urlOrBase64);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_OG_IMAGE);
      }
    } catch (e) {
      console.warn('LocalStorage quota limit reached when saving custom OG image.');
    }
  }

  if (shouldPush) {
    try {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    } catch (pushErr) {
      // Ignore cloud push errors when MySQL/Cloud is offline
    }
  }
}

export function loadMapelOgConfigs(): Record<string, { title: string; desc: string; imageUrl: string; updatedAt?: string }> {
  try {
    const scopedKey = getScopedKey(STORAGE_KEYS.MAPEL_OG_CONFIGS);
    const raw = localStorage.getItem(scopedKey) || localStorage.getItem(STORAGE_KEYS.MAPEL_OG_CONFIGS);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

export function saveMapelOgConfigs(
  configs: Record<string, { title: string; desc: string; imageUrl: string; updatedAt?: string }>,
  shouldPush: boolean = true
): void {
  try {
    const jsonStr = JSON.stringify(configs);
    setScopedItem(STORAGE_KEYS.MAPEL_OG_CONFIGS, jsonStr);
    if (shouldPush) {
      try {
        touchLastUpdated();
        debouncedPushToCloud();
        debouncedPushToSupabase();
        debouncedPushToMysql();
      } catch (e) {
        // ignore push error
      }
    }
  } catch (err) {
    console.warn('Error saving mapel OG configs to LocalStorage:', err);
  }
}

export function loadStoredModules(): ModulAjarCinta[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.MODULES);
    const raw = localStorage.getItem(key);
    if (raw === null) {
      setScopedItem(STORAGE_KEYS.MODULES, JSON.stringify(SAMPLE_MODULES));
      return SAMPLE_MODULES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SAMPLE_MODULES;
  } catch (err) {
    console.error('Error loading stored modules:', err);
    return SAMPLE_MODULES;
  }
}

export function saveModules(modules: ModulAjarCinta[], shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving modules:', err);
  }
}

export function loadKopSurat(): KopSuratSettings {
  try {
    const activeMadrasah = getActiveMadrasah();
    const key = getScopedKey(STORAGE_KEYS.KOP_SURAT);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        ...DEFAULT_KOP_SURAT,
        namaMadrasah: activeMadrasah.nama,
        alamatMadrasah: activeMadrasah.alamat || DEFAULT_KOP_SURAT.alamatMadrasah
      };
    }
    const parsed = { ...DEFAULT_KOP_SURAT, ...JSON.parse(raw) };
    if (!parsed.namaKantor || parsed.namaKantor === 'KANTOR KEMENTERIAN AGAMA KABUPATEN BANYUMAS') {
      parsed.namaKantor = "LEMBAGA PENDIDIKAN MA'ARIF NU BANYUMAS";
    }
    return parsed;
  } catch (err) {
    return DEFAULT_KOP_SURAT;
  }
}

export function saveKopSurat(kop: KopSuratSettings, shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.KOP_SURAT, JSON.stringify(kop));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kbc_kop_surat_updated'));
      window.dispatchEvent(new Event('kbc_welcome_banner_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving Kop Surat:', err);
  }
}

export function loadTTD(): TTDSettings {
  try {
    const key = getScopedKey(STORAGE_KEYS.TTD);
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_TTD;
    const parsed = { ...DEFAULT_TTD, ...JSON.parse(raw) };
    if (parsed.guruKelasNama?.includes('Jaenal Maskun') && parsed.guruKelasNIP !== '197808152009011009') {
      parsed.guruKelasNIP = '197808152009011009';
      localStorage.setItem(key, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    return DEFAULT_TTD;
  }
}

export function saveTTD(ttd: TTDSettings, shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.TTD, JSON.stringify(ttd));
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving TTD:', err);
  }
}

const SUPERADMIN_STORAGE_KEYS = {
  SUPABASE_CONFIG: 'kbc_mi_superadmin_supabase_config_v1',
  API_KEY: 'kbc_mi_superadmin_api_key_v1'
};

export function saveSuperAdminCredentialsBackup(config?: SupabaseConfig, apiKey?: string): void {
  try {
    const cfg = config || loadSupabaseConfig();
    if (cfg && (cfg.supabaseUrl || cfg.supabaseAnonKey)) {
      localStorage.setItem(SUPERADMIN_STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(cfg));
    }
    const key = apiKey !== undefined ? apiKey : loadApiKey();
    if (key && key.trim()) {
      localStorage.setItem(SUPERADMIN_STORAGE_KEYS.API_KEY, key.trim());
    }
  } catch (err) {
    console.error('Error backing up superadmin credentials:', err);
  }
}

export function restoreSuperAdminCredentials(): void {
  try {
    let rawSupabase = localStorage.getItem(SUPERADMIN_STORAGE_KEYS.SUPABASE_CONFIG);
    let rawApiKey = localStorage.getItem(SUPERADMIN_STORAGE_KEYS.API_KEY);

    // Backup current active credentials if superadmin backup is empty
    if (!rawSupabase) {
      const activeCfg = loadSupabaseConfig();
      if (activeCfg && (activeCfg.supabaseUrl || activeCfg.supabaseAnonKey)) {
        localStorage.setItem(SUPERADMIN_STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(activeCfg));
        rawSupabase = JSON.stringify(activeCfg);
      }
    }

    if (!rawApiKey) {
      const activeKey = loadApiKey();
      if (activeKey && activeKey.trim()) {
        localStorage.setItem(SUPERADMIN_STORAGE_KEYS.API_KEY, activeKey.trim());
        rawApiKey = activeKey.trim();
      }
    }

    // Restore to active storage
    if (rawSupabase) {
      const parsed = JSON.parse(rawSupabase);
      if (parsed) {
        const fullConfig = { ...DEFAULT_SUPABASE_CONFIG, ...parsed };
        localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(fullConfig));
      }
    }

    if (rawApiKey) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, rawApiKey);
    }

    // Pull from Firestore cloud to restore credentials across devices (e.g. HP -> PC)
    import('./firebaseSync').then(m => m.pullSuperAdminCredentialsFromCloud()).catch(() => {});
  } catch (err) {
    console.error('Error restoring superadmin credentials:', err);
  }
}

export function clearActiveCredentialsForRegularUser(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(DEFAULT_SUPABASE_CONFIG));
    localStorage.setItem(STORAGE_KEYS.API_KEY, '');
  } catch (err) {
    console.error('Error clearing active credentials:', err);
  }
}

export function loadApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  } catch (err) {
    return '';
  }
}

export function saveApiKey(key: string): void {
  try {
    const clean = key.trim();
    localStorage.setItem(STORAGE_KEYS.API_KEY, clean);
    const userSessionRaw = localStorage.getItem('kbc_mi_user_session_v1');
    if (userSessionRaw) {
      const session = JSON.parse(userSessionRaw);
      if (session && (session.isSuperAdmin || session.role === 'superadmin' || session.username?.toLowerCase() === 'jaenalmaskun@gmail.com' || session.username?.toLowerCase() === 'jaenalmaskun')) {
        if (clean) {
          localStorage.setItem(SUPERADMIN_STORAGE_KEYS.API_KEY, clean);
          import('./firebaseSync').then(m => m.pushSuperAdminCredentialsToCloud(undefined, clean)).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('Error saving API Key:', err);
  }
}

export function loadStoredMateriBank(): MateriBankItem[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.MATERI_BANK);
    const raw = localStorage.getItem(key);
    if (raw === null) {
      setScopedItem(STORAGE_KEYS.MATERI_BANK, JSON.stringify(INITIAL_MATERI_BANK));
      return INITIAL_MATERI_BANK;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_MATERI_BANK;
  } catch (err) {
    console.error('Error loading materi bank:', err);
    return INITIAL_MATERI_BANK;
  }
}

export function saveMateriBank(items: MateriBankItem[], shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.MATERI_BANK, JSON.stringify(items));
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving materi bank:', err);
  }
}

export function loadStoredTeachers(): TeacherItem[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.TEACHERS);
    const raw = localStorage.getItem(key);
    if (raw === null) {
      setScopedItem(STORAGE_KEYS.TEACHERS, JSON.stringify(DEFAULT_TEACHERS));
      return DEFAULT_TEACHERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const removedNames = ['Ahmad Muzakki', 'Nur Laili', 'M. Sholahuddin'];
      const updated = parsed
        .filter((t: TeacherItem) => !removedNames.some(name => t.nama?.includes(name)))
        .map((t: TeacherItem, index: number) => {
          let item = { ...t };
          if (item.nama?.includes('Jaenal Maskun') && item.nip !== '197808152009011009') {
            item.nip = '197808152009011009';
          }
          // Default credentials and PTK fields if not present
          if (!item.pin) {
            item.pin = '123456';
          }
          if (!item.no) {
            item.no = index + 1;
          }
          if (!item.hakAkses) {
            item.hakAkses = item.nama?.toLowerCase().includes('kepala') ? 'kepala_madrasah' : 'guru';
          }
          if (!item.jabatanMapel) {
            item.jabatanMapel = item.jabatanAtauKelas || 'Guru Mapel';
          }
          if (!item.jabatanAtauKelas) {
            item.jabatanAtauKelas = item.jabatanMapel;
          }
          if (!item.statusKepegawaian) {
            item.statusKepegawaian = 'PNS';
          }
          if (!item.jenisKelamin) {
            item.jenisKelamin = item.nama?.toLowerCase().includes('siti') || item.nama?.toLowerCase().includes('nur') || item.nama?.toLowerCase().includes('laili') ? 'P' : 'L';
          }
          if (!item.noWhatsapp && item.kontak) {
            item.noWhatsapp = item.kontak;
          }
          if (!item.kontak && item.noWhatsapp) {
            item.kontak = item.noWhatsapp;
          }
          if (!item.bebanJtm) {
            item.bebanJtm = '24 Jam';
          }
          if (!item.username) {
            const cleanName = (item.nama || `guru${index + 1}`).toLowerCase().replace(/[^a-z0-9]/g, '');
            item.username = cleanName.slice(0, 15);
          }
          if (!item.mapelAmpu || item.mapelAmpu.length === 0) {
            if (item.nama?.includes('Jaenal Maskun')) {
              item.mapelAmpu = ['Akidah Akhlak', 'Al-Qur\'an Hadis', 'Fiqih', 'IPAS (IPA & IPS)', 'Bahasa Arab'];
            } else if (item.nama?.includes('Siti Rochimah')) {
              item.mapelAmpu = ['Pendidikan Agama Islam', 'Pendidikan Pancasila'];
            } else {
              item.mapelAmpu = ['Pendidikan Agama Islam'];
            }
          }
          if (!item.kelasAmpu || item.kelasAmpu.length === 0) {
            item.kelasAmpu = ['Kelas 1 (Fase A)', 'Kelas 2 (Fase A)', 'Kelas 3 (Fase B)'];
          }
          if (!item.status) {
            item.status = 'aktif';
          }
          return item;
        });
      setScopedItem(STORAGE_KEYS.TEACHERS, JSON.stringify(updated));
      return updated;
    }
    return DEFAULT_TEACHERS;
  } catch (err) {
    console.error('Error loading teachers:', err);
    return DEFAULT_TEACHERS;
  }
}

export function saveTeachers(teachers: TeacherItem[], shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving teachers:', err);
  }
}

export function normalizeMapelKey(name: string): string {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019’'`]/g, "'")
    .replace(/\s+/g, ' ');
}

export function loadCustomMapel(): string[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.CUSTOM_MAPEL);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function saveCustomMapel(list: string[], shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.CUSTOM_MAPEL, JSON.stringify(list));

    // Automatically record and detect mapel OG thumbnail configs for new mapel
    try {
      const ogConfigs = loadMapelOgConfigs();
      let changed = false;
      list.forEach(mapel => {
        const clean = mapel?.trim();
        if (!clean) return;
        const key = sanitizeMapelKey(clean) || clean.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
        const existing = ogConfigs[key] || ogConfigs[clean];
        if (!existing || !existing.imageUrl) {
          const newCfg = {
            title: existing?.title || `Kuis & Media Interaktif ${clean}`,
            desc: existing?.desc || `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${clean}`,
            imageUrl: existing?.imageUrl || getPresetImageForMapel(clean),
            updatedAt: new Date().toISOString()
          };
          if (key) ogConfigs[key] = newCfg;
          ogConfigs[clean] = newCfg;
          changed = true;

          // Also automatically sync new mapel thumbnail config to backend server (Node and PHP)
          saveMapelOgConfigApi(clean, newCfg.title, newCfg.desc, newCfg.imageUrl).catch(() => {});
        }
      });
      if (changed) {
        saveMapelOgConfigs(ogConfigs, true);
      }
    } catch (e) {
      // ignore
    }

    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving custom mapel:', err);
  }
}

export function loadDeletedMapel(): string[] {
  try {
    const raw = localStorage.getItem(getScopedKey(STORAGE_KEYS.DELETED_MAPEL));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (err) {
    return [];
  }
}

export function loadDeletedMapelSet(): Set<string> {
  const deletedList = loadDeletedMapel();
  const set = new Set<string>();
  deletedList.forEach(d => {
    if (!d) return;
    set.add(d.trim().toLowerCase());
    set.add(normalizeMapelKey(d));
  });
  return set;
}

export function isMapelDeleted(mapelName: string, deletedSet?: Set<string>): boolean {
  if (!mapelName || !mapelName.trim()) return false;
  const set = deletedSet || loadDeletedMapelSet();
  const raw = mapelName.trim().toLowerCase();
  const norm = normalizeMapelKey(mapelName);
  return set.has(raw) || set.has(norm);
}

export function saveDeletedMapel(list: string[], shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.DELETED_MAPEL, JSON.stringify(list));
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving deleted mapel:', err);
  }
}

export function loadMasterMapelList(): string[] {
  const custom = loadCustomMapel();
  const deletedSet = loadDeletedMapelSet();
  const mapelMap = new Map<string, string>();

  const addCandidate = (name: string | undefined | null) => {
    if (!name) return;
    const clean = String(name).trim();
    if (!clean) return;
    const norm = normalizeMapelKey(clean);
    if (!norm) return;
    if (!mapelMap.has(norm)) {
      mapelMap.set(norm, clean);
    }
  };

  MAPEL_MI_OPTIONS.forEach(addCandidate);
  custom.forEach(addCandidate);

  try {
    const modules = loadStoredModules();
    modules.forEach(m => {
      if (m.identitas?.mataPelajaran) addCandidate(m.identitas.mataPelajaran);
    });
    const bank = loadStoredMateriBank();
    bank.forEach(b => {
      if (b.mataPelajaran) addCandidate(b.mataPelajaran);
    });
  } catch (err) {
    console.error('Error scanning master mapel:', err);
  }

  return Array.from(mapelMap.values()).filter(m => Boolean(m) && !isMapelDeleted(m, deletedSet));
}

export function restoreDeletedMapel(mapelName: string): void {
  const clean = mapelName.trim();
  if (!clean) return;
  const targetNorm = normalizeMapelKey(clean);
  const deletedList = loadDeletedMapel();
  const filtered = deletedList.filter(d => {
    if (!d) return false;
    return normalizeMapelKey(d) !== targetNorm && d.trim().toLowerCase() !== clean.toLowerCase();
  });
  saveDeletedMapel(filtered, true);
}

export function clearDeletedMapelList(): void {
  saveDeletedMapel([], true);
}

export function renameOrMergeMapel(oldMapelName: string, newMapelName: string): { modulesUpdated: number; bankUpdated: number } {
  const oldClean = oldMapelName.trim();
  const newClean = newMapelName.trim();
  if (!oldClean || !newClean || oldClean === newClean) {
    return { modulesUpdated: 0, bankUpdated: 0 };
  }

  const oldNorm = normalizeMapelKey(oldClean);

  // 1. Update Custom Mapel list
  const currentCustom = loadCustomMapel();
  const filteredCustom = currentCustom.filter(m => normalizeMapelKey(m) !== oldNorm);
  if (!MAPEL_MI_OPTIONS.some(opt => normalizeMapelKey(opt) === normalizeMapelKey(newClean)) && !filteredCustom.some(m => normalizeMapelKey(m) === normalizeMapelKey(newClean))) {
    filteredCustom.push(newClean);
  }
  saveCustomMapel(filteredCustom, false);

  // 2. Update saved modules
  let modulesUpdated = 0;
  const modules = loadStoredModules();
  const updatedModules = modules.map(mod => {
    if (mod.identitas?.mataPelajaran && normalizeMapelKey(mod.identitas.mataPelajaran) === oldNorm) {
      modulesUpdated++;
      return {
        ...mod,
        identitas: {
          ...mod.identitas,
          mataPelajaran: newClean
        }
      };
    }
    return mod;
  });
  if (modulesUpdated > 0) {
    saveModules(updatedModules, false);
  }

  // 3. Update materi bank items
  let bankUpdated = 0;
  const bankItems = loadStoredMateriBank();
  const updatedBank = bankItems.map(item => {
    if (item.mataPelajaran && normalizeMapelKey(item.mataPelajaran) === oldNorm) {
      bankUpdated++;
      return {
        ...item,
        mataPelajaran: newClean
      };
    }
    return item;
  });
  if (bankUpdated > 0) {
    saveMateriBank(updatedBank, false);
  }

  // 4. Update Mapel OG / Thumbnail Configs
  try {
    const ogConfigs = loadMapelOgConfigs();
    const oldKey = sanitizeMapelKey(oldClean);
    const newKey = sanitizeMapelKey(newClean);
    const oldCfg = ogConfigs[oldKey] || ogConfigs[oldClean];
    if (oldCfg) {
      const updatedCfg = {
        ...oldCfg,
        title: `Kuis & Media Interaktif ${newClean}`,
        desc: `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${newClean}`,
        updatedAt: new Date().toISOString()
      };
      if (newKey) ogConfigs[newKey] = updatedCfg;
      ogConfigs[newClean] = updatedCfg;
      saveMapelOgConfigs(ogConfigs, false);
    }
  } catch (e) {
    // ignore
  }

  touchLastUpdated();
  debouncedPushToCloud();
  debouncedPushToSupabase();

  return { modulesUpdated, bankUpdated };
}

export function addMasterMapel(mapelName: string): string {
  const clean = mapelName.trim();
  if (!clean) return '';

  const targetNorm = normalizeMapelKey(clean);

  // 1. Remove from deleted mapel list if present
  const deletedList = loadDeletedMapel();
  const updatedDeleted = deletedList.filter(d => {
    if (!d) return false;
    return normalizeMapelKey(d) !== targetNorm && d.trim().toLowerCase() !== clean.toLowerCase();
  });
  if (updatedDeleted.length !== deletedList.length) {
    saveDeletedMapel(updatedDeleted, false);
  }

  // 2. Add to custom mapel list if not already present
  const currentCustom = loadCustomMapel();
  if (!MAPEL_MI_OPTIONS.some(m => normalizeMapelKey(m) === targetNorm)) {
    if (!currentCustom.some(m => normalizeMapelKey(m) === targetNorm)) {
      currentCustom.push(clean);
    }
  }
  saveCustomMapel(currentCustom, true);

  return clean;
}

export function deleteMasterMapel(mapelName: string): void {
  const clean = mapelName.trim();
  if (!clean) return;

  const targetNorm = normalizeMapelKey(clean);

  // 1. Remove from custom mapel list
  const currentCustom = loadCustomMapel();
  const updatedCustom = currentCustom.filter(m => {
    if (!m) return false;
    return normalizeMapelKey(m) !== targetNorm && m.trim().toLowerCase() !== clean.toLowerCase();
  });
  saveCustomMapel(updatedCustom, false);

  // 2. Add to deleted mapel list
  const deletedList = loadDeletedMapel();
  const deletedSet = loadDeletedMapelSet();

  if (!isMapelDeleted(clean, deletedSet)) {
    deletedList.push(clean);
  }
  const straightVariant = clean.replace(/[\u2018\u2019’'`]/g, "'");
  if (straightVariant !== clean && !isMapelDeleted(straightVariant, deletedSet)) {
    deletedList.push(straightVariant);
  }

  saveDeletedMapel(deletedList, true);
}

export function syncModulesWithMasterMapel(): { modulesSynced: number; bankSynced: number } {
  const masterList = loadMasterMapelList();
  const mapelMap = new Map<string, string>();
  masterList.forEach(m => {
    mapelMap.set(m.trim().toLowerCase(), m.trim());
  });

  let modulesSynced = 0;
  const modules = loadStoredModules();
  const updatedModules = modules.map(mod => {
    const currentMp = mod.identitas?.mataPelajaran?.trim();
    if (currentMp) {
      const standardName = mapelMap.get(currentMp.toLowerCase());
      if (standardName && standardName !== currentMp) {
        modulesSynced++;
        return {
          ...mod,
          identitas: {
            ...mod.identitas,
            mataPelajaran: standardName
          }
        };
      }
    }
    return mod;
  });

  if (modulesSynced > 0) {
    saveModules(updatedModules, false);
  }

  let bankSynced = 0;
  const bankItems = loadStoredMateriBank();
  const updatedBank = bankItems.map(item => {
    const currentMp = item.mataPelajaran?.trim();
    if (currentMp) {
      const standardName = mapelMap.get(currentMp.toLowerCase());
      if (standardName && standardName !== currentMp) {
        bankSynced++;
        return {
          ...item,
          mataPelajaran: standardName
        };
      }
    }
    return item;
  });

  if (bankSynced > 0) {
    saveMateriBank(updatedBank, false);
  }

  touchLastUpdated();
  debouncedPushToCloud();
  debouncedPushToSupabase();
  debouncedPushToMysql();

  return { modulesSynced, bankSynced };
}

export function loadCustomTahunAjaran(): string[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.CUSTOM_TAHUN_AJARAN);
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_TAHUN_AJARAN_OPTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_TAHUN_AJARAN_OPTIONS;
  } catch (err) {
    return DEFAULT_TAHUN_AJARAN_OPTIONS;
  }
}

export function saveCustomTahunAjaran(list: string[], shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.CUSTOM_TAHUN_AJARAN, JSON.stringify(list));
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving custom tahun ajaran:', err);
  }
}

export function loadActiveTahunAjaran(): string {
  try {
    const key = getScopedKey(STORAGE_KEYS.ACTIVE_TAHUN_AJARAN);
    const val = localStorage.getItem(key);
    if (val && val.trim()) return val.trim();
    return '2025/2026';
  } catch (err) {
    return '2025/2026';
  }
}

export function saveActiveTahunAjaran(tahun: string, shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.ACTIVE_TAHUN_AJARAN, tahun.trim());
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving active tahun ajaran:', err);
  }
}

export function loadTeacherPin(): string {
  try {
    const key = getScopedKey(STORAGE_KEYS.TEACHER_PIN);
    const val = localStorage.getItem(key);
    if (val && val.trim()) return val.trim();
    return '1234';
  } catch (err) {
    return '1234';
  }
}

export function saveTeacherPin(pin: string, shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.TEACHER_PIN, pin.trim() || '1234');
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving teacher pin:', err);
  }
}

export const DEFAULT_SUPER_ADMIN_PIN = '9999';

export function verifySuperAdminPin(inputPin: string): boolean {
  if (!inputPin) return false;
  const cleanPin = inputPin.trim();
  const teacherPin = loadTeacherPin();
  return cleanPin === DEFAULT_SUPER_ADMIN_PIN || cleanPin === '8888' || cleanPin === teacherPin;
}

const SUPER_ADMIN_SESSION_KEY = 'kbc_mi_super_admin_unlocked_v1';

export function loadSuperAdminMode(): boolean {
  try {
    return sessionStorage.getItem(SUPER_ADMIN_SESSION_KEY) === 'true';
  } catch (err) {
    return false;
  }
}

export function saveSuperAdminMode(unlocked: boolean): void {
  try {
    sessionStorage.setItem(SUPER_ADMIN_SESSION_KEY, unlocked ? 'true' : 'false');
  } catch (err) {
    console.error('Error saving super admin mode:', err);
  }
}

const DOC_PROTECTION_SESSION_KEY = 'kbc_mi_doc_protection_unlocked_session_v1';

export function loadDocumentProtectionConfig(): DocumentProtectionConfig {
  try {
    const raw = localStorage.getItem(getScopedKey(STORAGE_KEYS.DOCUMENT_PROTECTION));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_DOCUMENT_PROTECTION_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load document protection config:', err);
  }
  return DEFAULT_DOCUMENT_PROTECTION_CONFIG;
}

export function saveDocumentProtectionConfig(config: DocumentProtectionConfig, shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.DOCUMENT_PROTECTION, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kbc_doc_protection_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Failed to save document protection config:', err);
  }
}

export function verifyDocumentProtectionPassword(inputPassword: string): boolean {
  if (!inputPassword) return false;
  const config = loadDocumentProtectionConfig();
  if (!config.enabled) return true; // If not enabled, always accessible
  const trimmedInput = inputPassword.trim();
  const targetPassword = (config.password || '').trim();
  if (!targetPassword) return true; // If no password set, open
  return trimmedInput === targetPassword;
}

export function isDocumentUnlockedInSession(): boolean {
  try {
    return sessionStorage.getItem(DOC_PROTECTION_SESSION_KEY) === 'true';
  } catch (err) {
    return false;
  }
}

export function setDocumentUnlockedInSession(unlocked: boolean): void {
  try {
    sessionStorage.setItem(DOC_PROTECTION_SESSION_KEY, unlocked ? 'true' : 'false');
  } catch (err) {
    console.error('Error saving document protection session unlock:', err);
  }
}

export interface BackupDataEnvelope {
  app: string;
  version: string;
  exportedAt: string;
  modules: ModulAjarCinta[];
  materiBank: MateriBankItem[];
  kopSurat: KopSuratSettings;
  ttd: TTDSettings;
  teachers: TeacherItem[];
  students?: StudentAccount[];
  studentQuizResults?: StudentQuizResult[];
  customMapel: string[];
  deletedMapel?: string[];
  customTahunAjaran: string[];
  activeTahunAjaran?: string;
  adminAccounts?: AdminAccountItem[];
  documentProtection?: DocumentProtectionConfig;
}

export function exportAllAppDataJson(): string {
  const data: BackupDataEnvelope = {
    app: 'KBC-MI-Generator',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    modules: loadStoredModules(),
    materiBank: loadStoredMateriBank(),
    kopSurat: loadKopSurat(),
    ttd: loadTTD(),
    teachers: loadStoredTeachers(),
    students: loadStoredStudents(),
    studentQuizResults: loadStoredStudentQuizResults(),
    customMapel: loadCustomMapel(),
    deletedMapel: loadDeletedMapel(),
    customTahunAjaran: loadCustomTahunAjaran(),
    activeTahunAjaran: loadActiveTahunAjaran(),
    adminAccounts: loadAdminAccounts(),
    documentProtection: loadDocumentProtectionConfig()
  };
  return JSON.stringify(data, null, 2);
}

export function importAppDataJson(jsonString: string): { success: boolean; message: string; count?: number } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Format berkas JSON tidak valid!' };
    }

    let restoredItems = 0;

    if (Array.isArray(parsed.modules)) {
      saveModules(parsed.modules);
      restoredItems += parsed.modules.length;
    }
    if (Array.isArray(parsed.materiBank)) {
      saveMateriBank(parsed.materiBank);
    }
    if (parsed.kopSurat && typeof parsed.kopSurat === 'object') {
      saveKopSurat(parsed.kopSurat);
    }
    if (parsed.ttd && typeof parsed.ttd === 'object') {
      saveTTD(parsed.ttd);
    }
    if (Array.isArray(parsed.teachers)) {
      saveTeachers(parsed.teachers);
    }
    if (Array.isArray(parsed.students)) {
      saveStudents(parsed.students);
    }
    if (Array.isArray(parsed.studentQuizResults)) {
      saveStudentQuizResults(parsed.studentQuizResults);
    }
    if (Array.isArray(parsed.customMapel)) {
      saveCustomMapel(parsed.customMapel);
    }
    if (Array.isArray(parsed.deletedMapel)) {
      saveDeletedMapel(parsed.deletedMapel);
    }
    if (Array.isArray(parsed.customTahunAjaran)) {
      saveCustomTahunAjaran(parsed.customTahunAjaran);
    }
    if (typeof parsed.activeTahunAjaran === 'string' && parsed.activeTahunAjaran.trim()) {
      saveActiveTahunAjaran(parsed.activeTahunAjaran);
    }
    if (Array.isArray(parsed.adminAccounts)) {
      saveAdminAccounts(parsed.adminAccounts);
    }
    if (parsed.documentProtection && typeof parsed.documentProtection === 'object') {
      saveDocumentProtectionConfig(parsed.documentProtection);
    }

    return {
      success: true,
      message: `Berhasil memulihkan/mengimpor data! (${restoredItems} modul ajar & bank materi)`,
      count: restoredItems
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal membaca berkas cadangan: ${err.message || 'Format tidak dikenali'}`
    };
  }
}

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  tableName: 'kbc_mi_app_settings',
  isEnabled: false,
  lastSyncedAt: null
};

export function loadSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (!raw) return DEFAULT_SUPABASE_CONFIG;
    return { ...DEFAULT_SUPABASE_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_SUPABASE_CONFIG;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
    const userSessionRaw = localStorage.getItem('kbc_mi_user_session_v1');
    if (userSessionRaw) {
      const session = JSON.parse(userSessionRaw);
      if (session && (session.isSuperAdmin || session.role === 'superadmin' || session.username?.toLowerCase() === 'jaenalmaskun@gmail.com' || session.username?.toLowerCase() === 'jaenalmaskun')) {
        if (config.supabaseUrl || config.supabaseAnonKey) {
          localStorage.setItem(SUPERADMIN_STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
          import('./firebaseSync').then(m => m.pushSuperAdminCredentialsToCloud(config)).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('Error saving Supabase config:', err);
  }
}

export const DEFAULT_MYSQL_CONFIG: MysqlConfig = {
  host: 'localhost',
  port: 3306,
  user: 'jaenal_modulajar',
  password: 'masbagus15',
  database: 'jaenal_modulajar',
  tableName: 'kbc_mi_app_settings',
  apiUrl: '',
  apiKey: '',
  isEnabled: true,
  lastSyncedAt: null
};

export function loadMysqlConfig(): MysqlConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MYSQL_CONFIG);
    if (!raw) return DEFAULT_MYSQL_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_MYSQL_CONFIG,
      ...parsed,
      host: parsed.host || 'localhost',
      user: parsed.user || 'jaenal_modulajar',
      password: parsed.password !== undefined && parsed.password !== '' ? parsed.password : 'masbagus15',
      database: parsed.database || 'jaenal_modulajar',
      apiUrl: parsed.apiUrl || '',
      apiKey: parsed.apiKey || ''
    };
  } catch (err) {
    return DEFAULT_MYSQL_CONFIG;
  }
}

export function saveMysqlConfig(config: MysqlConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MYSQL_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving MySQL config:', err);
  }
}

export const DEFAULT_SAMPLE_STUDENTS: StudentAccount[] = [
  { id: 'std-masbagus', nisn: 'masbagus', nama: 'mas bagus', kelas: 'Kelas 1 (Fase A)', pin: 'masbagus', createdAt: '2025-01-01T00:00:00.000Z' }
];

export function loadStoredStudents(): StudentAccount[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.STUDENTS);
    const resetKey = 'kbc_mi_students_reset_v3';

    if (!localStorage.getItem(resetKey)) {
      saveStudents(DEFAULT_SAMPLE_STUDENTS, false);
      localStorage.setItem(resetKey, 'true');
      return DEFAULT_SAMPLE_STUDENTS;
    }

    const raw = localStorage.getItem(key);
    let students: StudentAccount[] = [];

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        students = parsed;
      }
    }

    if (students.length === 0) {
      students = [...DEFAULT_SAMPLE_STUDENTS];
    }

    // Master Kurikulum Sync (kbc_master_siswa_list & kbc_master_rombel_list)
    try {
      const rawMasterSiswa = localStorage.getItem('kbc_master_siswa_list');
      const rawMasterRombel = localStorage.getItem('kbc_master_rombel_list');

      if (rawMasterSiswa) {
        const masterSiswaList = JSON.parse(rawMasterSiswa);
        const masterRombelList = rawMasterRombel ? JSON.parse(rawMasterRombel) : [];

        if (Array.isArray(masterSiswaList) && masterSiswaList.length > 0) {
          // Map Rombel IDs to clean class labels
          const rombelMap = new Map<string, string>();
          if (Array.isArray(masterRombelList)) {
            masterRombelList.forEach((r: any) => {
              let label = r.namaRombel || 'Kelas 1';
              if (r.tingkatFase && !label.includes('Fase')) {
                if (r.tingkatFase.includes('Fase A')) label += ' (Fase A)';
                else if (r.tingkatFase.includes('Fase B')) label += ' (Fase B)';
                else if (r.tingkatFase.includes('Fase C')) label += ' (Fase C)';
              }
              rombelMap.set(r.id, label);
            });
          }

          masterSiswaList.forEach((ms: any, index: number) => {
            if (!ms.namaSiswa || !ms.namaSiswa.trim()) return;
            const kelasLabel = rombelMap.get(ms.rombelId) || 'Kelas 1 (Fase A)';
            const cleanNisn = ms.nisn?.trim() || ms.nis?.trim() || `202500${index + 1}`;

            // Match existing student account by ID, NISN, or full name
            const existingIndex = students.findIndex(s =>
              (ms.id && s.id === ms.id) ||
              (cleanNisn && s.nisn === cleanNisn) ||
              s.nama.trim().toLowerCase() === ms.namaSiswa.trim().toLowerCase()
            );

            if (existingIndex >= 0) {
              // Update name, nisn, and class while preserving existing PIN & ID
              students[existingIndex] = {
                ...students[existingIndex],
                nama: ms.namaSiswa.trim(),
                nisn: cleanNisn,
                kelas: kelasLabel,
                nik: ms.nik || students[existingIndex].nik,
                jenisKelamin: ms.jenisKelamin || students[existingIndex].jenisKelamin,
                tempatLahir: ms.tempatLahir || students[existingIndex].tempatLahir,
                tanggalLahir: ms.tanggalLahir || students[existingIndex].tanggalLahir,
                alamat: ms.alamat || students[existingIndex].alamat,
                noHp: ms.noHp || students[existingIndex].noHp,
                namaAyah: ms.namaAyah || students[existingIndex].namaAyah,
                namaIbu: ms.namaIbu || students[existingIndex].namaIbu,
                nomorKipPip: ms.nomorKipPip || students[existingIndex].nomorKipPip,
                rombelId: ms.rombelId || students[existingIndex].rombelId
              };
            } else {
              // Append new student from Master Kurikulum
              students.push({
                id: ms.id || `std-mk-${index + 1}`,
                nisn: cleanNisn,
                nama: ms.namaSiswa.trim(),
                kelas: kelasLabel,
                pin: '1234',
                nik: ms.nik || '',
                jenisKelamin: ms.jenisKelamin || 'L',
                tempatLahir: ms.tempatLahir || '',
                tanggalLahir: ms.tanggalLahir || '',
                alamat: ms.alamat || '',
                noHp: ms.noHp || '',
                namaAyah: ms.namaAyah || '',
                namaIbu: ms.namaIbu || '',
                nomorKipPip: ms.nomorKipPip || '',
                rombelId: ms.rombelId || '',
                createdAt: new Date().toISOString()
              });
            }
          });
        }
      }
    } catch (errMk) {
      console.warn('Error merging Master Kurikulum student list:', errMk);
    }

    return students;
  } catch (err) {
    console.error('Error loading students:', err);
    return DEFAULT_SAMPLE_STUDENTS;
  }
}

export function saveStudents(students: StudentAccount[], shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving students:', err);
  }
}

export function loadStudentSession(): StudentAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENT_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveStudentSession(student: StudentAccount | null): void {
  try {
    if (student) {
      localStorage.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify(student));
    } else {
      localStorage.removeItem(STORAGE_KEYS.STUDENT_SESSION);
    }
  } catch (err) {
    console.error('Error saving student session:', err);
  }
}

export function loadStoredStudentQuizResults(): StudentQuizResult[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.STUDENT_QUIZ_RESULTS);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading student quiz results:', err);
    return [];
  }
}

export function saveStudentQuizResults(results: StudentQuizResult[], shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.STUDENT_QUIZ_RESULTS, JSON.stringify(results));
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving student quiz results:', err);
  }
}

export function addStudentQuizResult(result: StudentQuizResult): void {
  const current = loadStoredStudentQuizResults();
  // If result with same id exists, update it; otherwise prepend
  const exists = current.some(r => r.id === result.id);
  const updated = exists
    ? current.map(r => (r.id === result.id ? result : r))
    : [result, ...current];
  saveStudentQuizResults(updated);
}

export function deleteStudentQuizResult(id: string): void {
  const current = loadStoredStudentQuizResults();
  const updated = current.filter(r => r.id !== id);
  saveStudentQuizResults(updated);
}

export function clearStudentQuizResults(): void {
  saveStudentQuizResults([]);
}

export const DEFAULT_ADMIN_ACCOUNTS: AdminAccountItem[] = [
  {
    id: 'adm-superadmin-jaenal',
    username: 'jaenalmaskun@gmail.com',
    password: 'admin',
    pin: '123456',
    namaLengkap: 'Jaenal Maskun, S.Pd.I. (Super Admin)',
    role: 'superadmin',
    email: 'jaenalmaskun@gmail.com',
    noWhatsapp: '081234567890',
    status: 'aktif',
    permissions: ALL_ADMIN_PERMISSIONS.map(p => p.id),
    isProtected: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    notes: 'Akun Super Admin Utama Sistem Modul Ajar KBC'
  },
  {
    id: 'adm-admin-madrasah',
    username: 'admin',
    password: 'admin',
    pin: '123456',
    namaLengkap: 'Administrator Madrasah',
    role: 'admin',
    email: 'admin@madrasah.id',
    noWhatsapp: '081234567891',
    status: 'aktif',
    permissions: ALL_ADMIN_PERMISSIONS.map(p => p.id),
    isProtected: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    notes: 'Akun Administrator Pengelola Seluruh Modul & Data'
  },
  {
    id: 'adm-operator-madrasah',
    username: 'operator',
    password: 'operator123',
    pin: '123456',
    namaLengkap: 'Operator Madrasah',
    role: 'operator',
    email: 'operator@madrasah.id',
    noWhatsapp: '081234567892',
    status: 'aktif',
    permissions: ['kelola_modul', 'kelola_bank_materi', 'kelola_guru', 'kelola_siswa'],
    isProtected: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    notes: 'Akun Operator Pembantu Input Modul & Kesiswaan'
  },
  {
    id: 'adm-kamad-madrasah',
    username: 'kamad',
    password: 'kamad123',
    pin: '123456',
    namaLengkap: 'Kepala Madrasah',
    role: 'kepala_madrasah',
    email: 'kamad@madrasah.id',
    noWhatsapp: '081234567893',
    status: 'aktif',
    permissions: ['kelola_modul', 'kelola_guru', 'kelola_pengaturan'],
    isProtected: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    notes: 'Akun Peninjau & Pengesah Kurikulum Madrasah'
  }
];

export function loadAdminAccounts(): AdminAccountItem[] {
  try {
    const key = getScopedKey(STORAGE_KEYS.ADMIN_ACCOUNTS);
    const raw = localStorage.getItem(key);
    if (!raw) {
      // First time initialization
      saveAdminAccounts(DEFAULT_ADMIN_ACCOUNTS, false);
      return DEFAULT_ADMIN_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Make sure protected super admin is always present
      const hasJaenal = parsed.some(
        a => (a.username || '').toLowerCase() === 'jaenalmaskun@gmail.com' || (a.email || '').toLowerCase() === 'jaenalmaskun@gmail.com' || a.role === 'superadmin'
      );
      if (!hasJaenal) {
        return [DEFAULT_ADMIN_ACCOUNTS[0], ...parsed];
      }
      return parsed;
    }
    return DEFAULT_ADMIN_ACCOUNTS;
  } catch (err) {
    console.error('Error loading admin accounts:', err);
    return DEFAULT_ADMIN_ACCOUNTS;
  }
}

export function saveAdminAccounts(accounts: AdminAccountItem[], shouldPush: boolean = true): void {
  try {
    setScopedItem(STORAGE_KEYS.ADMIN_ACCOUNTS, JSON.stringify(accounts));
    if (shouldPush) {
      touchLastUpdated();
      debouncedPushToCloud();
      debouncedPushToSupabase();
      debouncedPushToMysql();
    }
  } catch (err) {
    console.error('Error saving admin accounts:', err);
  }
}

export function addAdminAccount(account: Omit<AdminAccountItem, 'id' | 'createdAt'>): { success: boolean; id: string; message: string } {
  const accounts = loadAdminAccounts();
  const cleanUsername = (account.username || '').trim().toLowerCase();

  if (!cleanUsername) {
    return { success: false, id: '', message: 'Username akun admin wajib diisi!' };
  }

  // Check unique username
  const exists = accounts.some(a => (a.username || '').trim().toLowerCase() === cleanUsername);
  if (exists) {
    return { success: false, id: '', message: `Username "${cleanUsername}" sudah digunakan oleh akun lain!` };
  }

  const id = `adm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const newAccount: AdminAccountItem = {
    ...account,
    id,
    username: cleanUsername,
    password: account.password?.trim() || 'admin123',
    pin: account.pin?.trim() || '123456',
    status: account.status || 'aktif',
    permissions: account.permissions || ['kelola_modul', 'kelola_guru', 'kelola_siswa'],
    createdAt: new Date().toISOString()
  };

  const updated = [newAccount, ...accounts];
  saveAdminAccounts(updated);

  return { success: true, id, message: `Akun ${account.namaLengkap} (${account.role}) berhasil ditambahkan!` };
}

export function updateAdminAccount(id: string, updates: Partial<AdminAccountItem>): { success: boolean; message: string } {
  const accounts = loadAdminAccounts();
  const index = accounts.findIndex(a => a.id === id);

  if (index < 0) {
    return { success: false, message: 'Akun admin tidak ditemukan!' };
  }

  // Check username collision if username was changed
  if (updates.username) {
    const cleanUsername = updates.username.trim().toLowerCase();
    const collision = accounts.some(a => a.id !== id && (a.username || '').trim().toLowerCase() === cleanUsername);
    if (collision) {
      return { success: false, message: `Username "${cleanUsername}" sudah digunakan oleh akun lain!` };
    }
  }

  accounts[index] = {
    ...accounts[index],
    ...updates,
    id: accounts[index].id, // protect ID
    isProtected: accounts[index].isProtected // protect flag
  };

  saveAdminAccounts(accounts);
  return { success: true, message: `Akun "${accounts[index].namaLengkap}" berhasil diperbarui!` };
}

export function deleteAdminAccount(id: string): { success: boolean; message: string } {
  const accounts = loadAdminAccounts();
  const target = accounts.find(a => a.id === id);

  if (!target) {
    return { success: false, message: 'Akun admin tidak ditemukan!' };
  }

  if (target.isProtected || (target.username || '').toLowerCase() === 'jaenalmaskun@gmail.com') {
    return { success: false, message: 'Akun Super Admin Utama dilindungi dan tidak dapat dihapus!' };
  }

  const updated = accounts.filter(a => a.id !== id);
  saveAdminAccounts(updated);
  return { success: true, message: `Akun "${target.namaLengkap}" berhasil dihapus!` };
}

export function resetAdminPassword(id: string, newPassword: string, newPin?: string): { success: boolean; message: string } {
  const accounts = loadAdminAccounts();
  const index = accounts.findIndex(a => a.id === id);

  if (index < 0) {
    return { success: false, message: 'Akun tidak ditemukan!' };
  }

  accounts[index].password = newPassword.trim();
  if (newPin) {
    accounts[index].pin = newPin.trim();
  }

  saveAdminAccounts(accounts);
  return { success: true, message: `Kata sandi akun "${accounts[index].namaLengkap}" berhasil direset!` };
}


