import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  SupabaseConfig,
  ModulAjarCinta,
  KopSuratSettings,
  TTDSettings,
  MateriBankItem,
  TeacherItem,
  WelcomeBannerConfig
} from '../types';
import {
  exportAllAppDataJson,
  importAppDataJson,
  loadStoredModules,
  loadStoredMateriBank,
  loadKopSurat,
  loadTTD,
  loadStoredTeachers,
  loadCustomMapel,
  loadDeletedMapel,
  loadCustomTahunAjaran,
  loadActiveTahunAjaran,
  loadTeacherPin,
  loadCustomOgImage,
  loadActiveMadrasahId,
  loadLastUpdated,
  touchLastUpdated,
  setLastUpdatedTimestamp,
  saveModules,
  saveMateriBank,
  saveKopSurat,
  saveTTD,
  saveTeachers,
  saveCustomMapel,
  saveDeletedMapel,
  saveCustomTahunAjaran,
  saveActiveTahunAjaran,
  saveTeacherPin,
  saveCustomOgImage,
  loadMapelOgConfigs,
  saveMapelOgConfigs,
  loadWelcomeBannerConfig,
  saveWelcomeBannerConfig,
  loadSupabaseConfig,
  saveSupabaseConfig,
  loadApiKey,
  saveApiKey,
  DEFAULT_SUPABASE_CONFIG
} from './storage';

export interface CloudAppData {
  modules: ModulAjarCinta[];
  materiBank: MateriBankItem[];
  kopSurat: KopSuratSettings;
  ttd: TTDSettings;
  teachers: TeacherItem[];
  customMapel: string[];
  deletedMapel?: string[];
  customTahunAjaran: string[];
  activeTahunAjaran: string;
  teacherPin: string;
  customOgImage: string;
  mapelOgConfigs?: Record<string, { title: string; desc: string; imageUrl: string; updatedAt?: string }>;
  welcomeBanner?: WelcomeBannerConfig;
  lastUpdated: string;
}

export function getMadrasahDocRef() {
  const activeId = loadActiveMadrasahId();
  return doc(db, 'app_settings', activeId);
}

let isUpdatingFromCloud = false;
let syncTimeout: any = null;
const QUOTA_STORAGE_KEY = 'kbc_mi_firestore_quota_exceeded_v1';
const QUOTA_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown when Firestore daily write quota limit is reached

export function clearQuotaCooldown(): void {
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch (e) {}
}

function setQuotaExceeded(): void {
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, Date.now().toString());
  } catch (e) {
    // ignore
  }
}

function checkQuotaCooldown(): boolean {
  try {
    const savedTime = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (savedTime) {
      const timeMs = parseInt(savedTime, 10);
      if (!isNaN(timeMs) && Date.now() - timeMs < QUOTA_COOLDOWN_MS) {
        return true; // Quota still cooling down
      } else {
        localStorage.removeItem(QUOTA_STORAGE_KEY); // Reset after 24h
      }
    }
  } catch (e) {
    // ignore
  }
  return false;
}

export function isCloudSyncInProgress(): boolean {
  return isUpdatingFromCloud;
}

/**
 * Pushes all local storage state to Cloud Firestore document `app_settings/{madrasahId}`.
 * Debounced to prevent excessive network requests during rapid typing.
 */
export async function pushLocalDataToCloud(): Promise<boolean> {
  if (isUpdatingFromCloud) return false;
  if (checkQuotaCooldown()) {
    console.warn('Firebase Firestore quota harian terlampaui. Penyimpanan otomatis dialihkan ke LocalStorage & Supabase.');
    return false;
  }

  try {
    const docRef = getMadrasahDocRef();
    const modules = loadStoredModules();
    const materiBank = loadStoredMateriBank();
    const kopSurat = loadKopSurat();
    const ttd = loadTTD();
    const teachers = loadStoredTeachers();
    const customMapel = loadCustomMapel();
    const deletedMapel = loadDeletedMapel();
    const customTahunAjaran = loadCustomTahunAjaran();
    const activeTahunAjaran = loadActiveTahunAjaran();
    const teacherPin = loadTeacherPin();
    const customOgImage = loadCustomOgImage();
    const mapelOgConfigs = loadMapelOgConfigs();
    const welcomeBanner = loadWelcomeBannerConfig();

    // Sanitize large base64 strings if necessary to keep Firestore doc < 1MB
    const sanitizedOgImage = customOgImage && customOgImage.length > 500000 ? '' : customOgImage;
    const sanitizedKop = {
      ...kopSurat,
      logoUrl: (kopSurat.logoUrl && kopSurat.logoUrl.length > 500000) ? null : kopSurat.logoUrl
    };

    const sanitizedModules = modules.map(m => {
      if (!m) return m;
      let imgUrl = m.assesmen?.mediaDigital?.gambarInteraktif?.imageUrl;
      if (imgUrl && imgUrl.startsWith('data:') && imgUrl.length > 750000) {
        imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent((m.identitas?.materi || 'modul') + ', Islamic primary school vector educational illustration')}&width=800&height=600&nologo=true`;
      }
      return {
        ...m,
        assesmen: {
          ...m.assesmen,
          mediaDigital: {
            ...m.assesmen?.mediaDigital,
            gambarInteraktif: {
              ...m.assesmen?.mediaDigital?.gambarInteraktif,
              imageUrl: imgUrl
            }
          }
        }
      };
    });

    const activeId = loadActiveMadrasahId();

    const payload: CloudAppData = {
      modules: sanitizedModules,
      materiBank,
      kopSurat: sanitizedKop,
      ttd,
      teachers,
      customMapel,
      deletedMapel,
      customTahunAjaran,
      activeTahunAjaran,
      teacherPin,
      customOgImage: sanitizedOgImage,
      mapelOgConfigs,
      welcomeBanner,
      lastUpdated: new Date().toISOString()
    };

    await setDoc(docRef, payload, { merge: true });

    console.log(`✅ Data madrasah [${activeId}] tersimpan di Cloud Database!`);
    return true;
  } catch (error: any) {
    const errStr = String(error?.message || error || '');
    if (error?.code === 'resource-exhausted' || errStr.includes('Quota limit exceeded') || errStr.includes('resource-exhausted') || errStr.includes('quota')) {
      setQuotaExceeded();
      console.warn('⚠️ Firebase Firestore quota limit reached (Free Daily Write limit). App fallback to LocalStorage active.');
    } else if (errStr.includes('offline') || errStr.includes('Could not reach Cloud') || errStr.includes('unavailable') || errStr.includes('failed-precondition')) {
      console.warn('⚠️ Firebase Firestore offline mode active. App fallback to LocalStorage active.');
    } else {
      console.warn('Cloud sync push notice (fallback to LocalStorage active):', error);
    }
    return false;
  }
}

/**
 * Schedule a debounced push to Cloud Firestore.
 */
export function debouncedPushToCloud(delayMs: number = 1000) {
  if (checkQuotaCooldown()) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    pushLocalDataToCloud().catch(err => console.warn('Cloud sync push notice:', err));
  }, delayMs);
}

/**
 * Fetches the document from Cloud Firestore and updates local storage safely.
 */
export async function pullCloudDataToLocal(): Promise<boolean> {
  if (checkQuotaCooldown()) return false;
  try {
    const docRef = getMadrasahDocRef();
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as Partial<CloudAppData>;
      const hasLocalOnlyItems = applyCloudDataToLocal(data);

      // If local storage had items created offline that are not in cloud, push merged result to cloud
      if (hasLocalOnlyItems) {
        console.log('⚡ Merging local offline items into Cloud Database...');
        await pushLocalDataToCloud();
      }
      return true;
    } else {
      // Document doesn't exist yet, seed cloud with initial local data if quota allows
      if (!checkQuotaCooldown()) {
        await pushLocalDataToCloud();
      }
      return true;
    }
  } catch (error: any) {
    const errStr = String(error?.message || error || '');
    if (error?.code === 'resource-exhausted' || errStr.includes('Quota limit exceeded') || errStr.includes('resource-exhausted')) {
      setQuotaExceeded();
      console.warn('⚠️ Firebase Firestore quota limit reached on pull. Using LocalStorage state.');
    } else if (errStr.includes('offline') || errStr.includes('Could not reach Cloud') || errStr.includes('unavailable') || errStr.includes('failed-precondition')) {
      console.warn('⚠️ Firebase Firestore offline mode active. Using local storage state.');
    } else {
      console.warn('Cloud sync pull notice (using local data):', error);
    }
    return false;
  }
}

/**
 * Applies cloud data into localStorage without triggering infinite loop pushes.
 * Returns true if local storage contained unique offline items that were missing in Cloud.
 */
export function applyCloudDataToLocal(data: Partial<CloudAppData>): boolean {
  isUpdatingFromCloud = true;
  let hasLocalOnlyItems = false;
  try {
    if (Array.isArray(data.modules)) {
      const currentLocalModules = loadStoredModules();
      const mergedModulesMap = new Map<string, ModulAjarCinta>();

      // Populate cloud modules first
      data.modules.forEach(m => {
        if (m && m.id) mergedModulesMap.set(m.id, m);
      });

      // Preserve local modules if missing in cloud or if local version is newer
      currentLocalModules.forEach(m => {
        if (!m || !m.id) return;
        const cloudModule = mergedModulesMap.get(m.id);
        if (!cloudModule) {
          mergedModulesMap.set(m.id, m);
          hasLocalOnlyItems = true;
        } else {
          const localTime = m.updatedAt ? new Date(m.updatedAt).getTime() : 0;
          const cloudTime = cloudModule.updatedAt ? new Date(cloudModule.updatedAt).getTime() : 0;
          if (localTime > cloudTime) {
            mergedModulesMap.set(m.id, m);
            hasLocalOnlyItems = true;
          }
        }
      });

      const finalModules = Array.from(mergedModulesMap.values());
      saveModules(finalModules, false);
    }
    if (Array.isArray(data.materiBank)) {
      saveMateriBank(data.materiBank, false);
    }
    if (data.kopSurat && typeof data.kopSurat === 'object') {
      saveKopSurat(data.kopSurat, false);
    }
    if (data.ttd && typeof data.ttd === 'object') {
      saveTTD(data.ttd, false);
    }
    if (Array.isArray(data.teachers)) {
      saveTeachers(data.teachers, false);
    }
    if (Array.isArray(data.deletedMapel)) {
      const localDeleted = loadDeletedMapel();
      const mergedDeleted = Array.from(new Set([...localDeleted, ...data.deletedMapel]));
      saveDeletedMapel(mergedDeleted, false);
    }
    if (Array.isArray(data.customMapel)) {
      saveCustomMapel(data.customMapel, false);
    }
    if (Array.isArray(data.customTahunAjaran)) {
      saveCustomTahunAjaran(data.customTahunAjaran, false);
    }
    if (typeof data.activeTahunAjaran === 'string' && data.activeTahunAjaran.trim()) {
      saveActiveTahunAjaran(data.activeTahunAjaran, false);
    }
    if (typeof data.teacherPin === 'string' && data.teacherPin.trim()) {
      saveTeacherPin(data.teacherPin, false);
    }
    if (typeof data.customOgImage === 'string') {
      saveCustomOgImage(data.customOgImage, false);
    }
    if (data.mapelOgConfigs && typeof data.mapelOgConfigs === 'object') {
      const currentLocalOg = loadMapelOgConfigs();
      const mergedOg = { ...currentLocalOg };
      for (const [key, cfg] of Object.entries(data.mapelOgConfigs)) {
        if (!cfg) continue;
        const localCfg = mergedOg[key];
        const localTime = localCfg?.updatedAt ? new Date(localCfg.updatedAt).getTime() : 0;
        const cloudTime = cfg.updatedAt ? new Date(cfg.updatedAt).getTime() : 0;

        if (!localCfg || cloudTime >= localTime || (!localCfg.imageUrl && cfg.imageUrl)) {
          mergedOg[key] = {
            title: cfg.title || localCfg?.title || '',
            desc: cfg.desc || localCfg?.desc || '',
            imageUrl: cfg.imageUrl || localCfg?.imageUrl || '',
            updatedAt: cfg.updatedAt || localCfg?.updatedAt || new Date().toISOString()
          };
        }
      }
      saveMapelOgConfigs(mergedOg, false);
    }
    if (data.welcomeBanner && typeof data.welcomeBanner === 'object') {
      saveWelcomeBannerConfig(data.welcomeBanner, false);
    }
    if (data.lastUpdated) {
      setLastUpdatedTimestamp(data.lastUpdated);
    }
    return hasLocalOnlyItems;
  } finally {
    setTimeout(() => {
      isUpdatingFromCloud = false;
    }, 500);
  }
}

/**
 * Subscribes to real-time changes in Firestore Cloud Database.
 * Any edits from other devices/browsers will immediately update local state.
 */
export function subscribeToCloudDatabase(onCloudUpdate: () => void): Unsubscribe {
  if (checkQuotaCooldown()) {
    console.warn('⚠️ Realtime Cloud Firestore listener: Quota cooldown active. Using LocalStorage state.');
    return () => {};
  }
  return onSnapshot(
    getMadrasahDocRef(),
    (snapshot) => {
      if (snapshot.exists() && !isUpdatingFromCloud) {
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        const data = snapshot.data() as Partial<CloudAppData>;
        const hasLocalOnlyItems = applyCloudDataToLocal(data);
        onCloudUpdate();

        if (hasLocalOnlyItems) {
          pushLocalDataToCloud().catch(err => console.warn('Cloud sync push notice:', err));
        }
      }
    },
    (error) => {
      const errStr = String(error?.message || error || '');
      if (error?.code === 'resource-exhausted' || errStr.includes('Quota limit exceeded') || errStr.includes('resource-exhausted')) {
        setQuotaExceeded();
        console.warn('⚠️ Realtime Cloud Firestore listener: Quota harian terlampaui. Menggunakan data lokal (LocalStorage).');
      } else if (errStr.includes('offline') || errStr.includes('Could not reach Cloud') || errStr.includes('unavailable') || errStr.includes('failed-precondition')) {
        console.warn('⚠️ Realtime Cloud Firestore listener: Offline mode active. Menggunakan data lokal.');
      } else {
        console.warn('Realtime Cloud Firestore listener notice:', error);
      }
    }
  );
}

const SUPERADMIN_DOC_REF = () => doc(db, 'app_settings', 'global_superadmin_config');

export async function pushSuperAdminCredentialsToCloud(config?: SupabaseConfig, apiKey?: string): Promise<boolean> {
  if (checkQuotaCooldown()) return false;
  try {
    const docRef = SUPERADMIN_DOC_REF();
    const currentCfg = config || loadSupabaseConfig();
    const currentKey = apiKey !== undefined ? apiKey : loadApiKey();

    const payload: any = {
      updatedAt: new Date().toISOString()
    };

    if (currentCfg && (currentCfg.supabaseUrl || currentCfg.supabaseAnonKey)) {
      payload.supabaseConfig = currentCfg;
    }
    if (currentKey && currentKey.trim()) {
      payload.apiKey = currentKey.trim();
    }

    await setDoc(docRef, payload, { merge: true });
    console.log('✅ Super Admin credentials pushed to Cloud Firestore successfully!');
    return true;
  } catch (err: any) {
    const errStr = String(err?.message || err || '');
    if (err?.code === 'resource-exhausted' || errStr.includes('Quota limit exceeded') || errStr.includes('resource-exhausted') || errStr.includes('quota')) {
      setQuotaExceeded();
      console.warn('⚠️ Firebase Firestore quota limit reached for superadmin credentials.');
    } else {
      console.warn('Could not push superadmin credentials to cloud:', err);
    }
    return false;
  }
}

export async function pullSuperAdminCredentialsFromCloud(): Promise<{ supabaseConfig?: SupabaseConfig; apiKey?: string } | null> {
  if (checkQuotaCooldown()) return null;
  try {
    const docRef = SUPERADMIN_DOC_REF();
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const config = data?.supabaseConfig as SupabaseConfig | undefined;
      const key = data?.apiKey as string | undefined;

      if (config) {
        saveSupabaseConfig({ ...DEFAULT_SUPABASE_CONFIG, ...config });
      }
      if (key && key.trim()) {
        saveApiKey(key.trim());
      }
      return { supabaseConfig: config, apiKey: key };
    }
  } catch (err: any) {
    const errStr = String(err?.message || err || '');
    if (err?.code === 'resource-exhausted' || errStr.includes('Quota limit exceeded') || errStr.includes('resource-exhausted') || errStr.includes('quota')) {
      setQuotaExceeded();
      console.warn('⚠️ Firebase Firestore quota limit reached for pulling superadmin credentials.');
    } else {
      console.warn('Could not pull superadmin credentials from cloud:', err);
    }
  }
  return null;
}
