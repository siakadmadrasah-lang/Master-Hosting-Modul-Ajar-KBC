import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';
import {
  loadSupabaseConfig,
  saveSupabaseConfig,
  loadActiveMadrasahId,
  loadLastUpdated,
  setLastUpdatedTimestamp,
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
  loadWelcomeBannerConfig,
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
  saveWelcomeBannerConfig
} from './storage';

let supabaseClientInstance: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export function getSupabaseClient(config?: SupabaseConfig): SupabaseClient | null {
  const cfg = config || loadSupabaseConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    supabaseClientInstance = null;
    currentClientUrl = '';
    currentClientKey = '';
    return null;
  }

  const cleanUrl = cfg.supabaseUrl.trim();
  const cleanKey = cfg.supabaseAnonKey.trim();

  if (supabaseClientInstance && currentClientUrl === cleanUrl && currentClientKey === cleanKey) {
    return supabaseClientInstance;
  }

  try {
    supabaseClientInstance = createClient(cleanUrl, cleanKey);
    currentClientUrl = cleanUrl;
    currentClientKey = cleanKey;
    return supabaseClientInstance;
  } catch (err) {
    console.error('Failed to instantiate Supabase client:', err);
    return null;
  }
}

/**
 * Tests connection to user's Supabase project.
 */
export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return { success: false, message: 'Harap isi URL Supabase dan Anon API Key terlebih dahulu.' };
  }

  try {
    const client = createClient(config.supabaseUrl.trim(), config.supabaseAnonKey.trim());
    const tableName = config.tableName?.trim() || 'kbc_mi_app_settings';

    // Query table or check connection
    const { error } = await client.from(tableName).select('id').limit(1);

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache') ||
        error.message?.includes('Could not find the table')
      ) {
        return {
          success: false,
          message: `Tabel "${tableName}" belum ada di Supabase. Silakan buka menu SQL Editor di Supabase lalu jalankan skrip SQL yang tersedia di bawah untuk membuat tabel secara gratis.`
        };
      }
      if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('policy')) {
        return {
          success: false,
          message: `Akses RLS ditolak pada tabel "${tableName}". Silakan jalankan skrip SQL di bawah di SQL Editor Supabase untuk mengaktifkan akses.`
        };
      }
      return {
        success: false,
        message: `Koneksi Supabase gagal (${error.code || 'Error'}): ${error.message}`
      };
    }

    return {
      success: true,
      message: `Berhasil terhubung ke Akun Supabase! (Tabel "${tableName}" aktif)`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal tersambung ke Supabase: ${err.message || String(err)}`
    };
  }
}

/**
 * Push all app data to Supabase table
 */
export async function pushDataToSupabase(customConfig?: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  const config = customConfig || loadSupabaseConfig();
  const client = getSupabaseClient(config);

  if (!client) {
    return { success: false, message: 'Konfigurasi Supabase belum lengkap atau belum diisi.' };
  }

  const tableName = config.tableName?.trim() || 'kbc_mi_app_settings';

  try {
    const payload = {
      modules: loadStoredModules(),
      materiBank: loadStoredMateriBank(),
      kopSurat: loadKopSurat(),
      ttd: loadTTD(),
      teachers: loadStoredTeachers(),
      customMapel: loadCustomMapel(),
      deletedMapel: loadDeletedMapel(),
      customTahunAjaran: loadCustomTahunAjaran(),
      activeTahunAjaran: loadActiveTahunAjaran(),
      teacherPin: loadTeacherPin(),
      customOgImage: loadCustomOgImage(),
      welcomeBanner: loadWelcomeBannerConfig(),
      updated_at: new Date().toISOString()
    };

    const activeMadrasahId = loadActiveMadrasahId();

    const { error } = await client
      .from(tableName)
      .upsert({
        id: activeMadrasahId,
        payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache') ||
        error.message?.includes('Could not find the table')
      ) {
        return {
          success: false,
          message: `Tabel "${tableName}" belum ada di Supabase. Silakan buka tab Supabase di Pengaturan lalu jalankan skrip SQL yang disediakan.`
        };
      }
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        return {
          success: false,
          message: `Akses RLS ditolak di Supabase. Silakan jalankan skrip SQL di tab Supabase di Pengaturan.`
        };
      }
      throw error;
    }

    // Update last synced at
    const updatedCfg = { ...config, lastSyncedAt: new Date().toISOString() };
    saveSupabaseConfig(updatedCfg);

    return {
      success: true,
      message: `Data berhasil diunggah & tersimpan di tabel "${tableName}" di Supabase!`
    };
  } catch (err: any) {
    console.error('Push to Supabase error:', err);
    return {
      success: false,
      message: `Gagal menyimpan ke Supabase: ${err.message || 'Periksa struktur tabel atau RLS policy di Supabase'}`
    };
  }
}

/**
 * Pull all app data from Supabase table
 */
export async function pullDataFromSupabase(customConfig?: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  const config = customConfig || loadSupabaseConfig();
  const client = getSupabaseClient(config);

  if (!client) {
    return { success: false, message: 'Konfigurasi Supabase belum lengkap.' };
  }

  const tableName = config.tableName?.trim() || 'kbc_mi_app_settings';

  try {
    const activeMadrasahId = loadActiveMadrasahId();

    const { data, error } = await client
      .from(tableName)
      .select('payload')
      .eq('id', activeMadrasahId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data || !data.payload) {
      return { success: false, message: `Belum ada data aplikasi di tabel "${tableName}" Supabase untuk madrasah "${activeMadrasahId}".` };
    }

    const payload = data.payload;
    const cloudLastUpdatedStr = payload.lastUpdated || payload.updated_at || '';

    if (Array.isArray(payload.modules)) {
      const currentLocalModules = loadStoredModules();
      const mergedModulesMap = new Map<string, any>();

      payload.modules.forEach((m: any) => {
        if (m && m.id) mergedModulesMap.set(m.id, m);
      });

      currentLocalModules.forEach((m: any) => {
        if (!m || !m.id) return;
        const cloudModule = mergedModulesMap.get(m.id);
        if (!cloudModule) {
          mergedModulesMap.set(m.id, m);
        } else {
          const localTime = m.updatedAt ? new Date(m.updatedAt).getTime() : 0;
          const cloudTime = cloudModule.updatedAt ? new Date(cloudModule.updatedAt).getTime() : 0;
          if (localTime > cloudTime) {
            mergedModulesMap.set(m.id, m);
          }
        }
      });

      saveModules(Array.from(mergedModulesMap.values()), false);
    }

    if (Array.isArray(payload.materiBank)) saveMateriBank(payload.materiBank, false);
    if (payload.kopSurat) saveKopSurat(payload.kopSurat, false);
    if (payload.ttd) saveTTD(payload.ttd, false);
    if (Array.isArray(payload.teachers)) saveTeachers(payload.teachers, false);
    if (Array.isArray(payload.deletedMapel)) {
      const localDeleted = loadDeletedMapel();
      const mergedDeleted = Array.from(new Set([...localDeleted, ...payload.deletedMapel]));
      saveDeletedMapel(mergedDeleted, false);
    }
    if (Array.isArray(payload.customMapel)) saveCustomMapel(payload.customMapel, false);
    if (Array.isArray(payload.customTahunAjaran)) saveCustomTahunAjaran(payload.customTahunAjaran, false);
    if (payload.activeTahunAjaran) saveActiveTahunAjaran(payload.activeTahunAjaran, false);
    if (payload.teacherPin) saveTeacherPin(payload.teacherPin, false);
    if (payload.customOgImage) saveCustomOgImage(payload.customOgImage, false);
    if (payload.welcomeBanner) saveWelcomeBannerConfig(payload.welcomeBanner, false);
    if (cloudLastUpdatedStr) setLastUpdatedTimestamp(cloudLastUpdatedStr);

    const updatedCfg = { ...config, lastSyncedAt: new Date().toISOString() };
    saveSupabaseConfig(updatedCfg);

    return {
      success: true,
      message: `Berhasil memuat data dari Supabase tabel "${tableName}"!`
    };
  } catch (err: any) {
    console.error('Pull from Supabase error:', err);
    return {
      success: false,
      message: `Gagal memuat data dari Supabase: ${err.message || String(err)}`
    };
  }
}

let supabaseDebounceTimeout: any = null;

export function debouncedPushToSupabase(delayMs: number = 1000) {
  const config = loadSupabaseConfig();
  if (!config.isEnabled || !config.supabaseUrl || !config.supabaseAnonKey) {
    return;
  }

  if (supabaseDebounceTimeout) clearTimeout(supabaseDebounceTimeout);
  supabaseDebounceTimeout = setTimeout(() => {
    pushDataToSupabase(config).catch(err => console.error('Auto Supabase Sync error:', err));
  }, delayMs);
}
