import { MysqlConfig } from '../types';
import {
  loadMysqlConfig,
  saveMysqlConfig,
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
  loadStoredStudents,
  loadStoredStudentQuizResults,
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
  saveWelcomeBannerConfig,
  saveStudents,
  saveStudentQuizResults
} from './storage';


export interface MysqlDiagnosticResult {
  success: boolean;
  code?: string;
  latencyMs?: number;
  queryResult?: any;
  title: string;
  summary?: string;
  explanation?: string;
  solution?: string;
  rawError?: string;
  isLocalhost?: boolean;
}

/**
 * Universal helper for calling MySQL API endpoints safely.
 * Handles non-JSON HTML error responses (404/500/maintenance) without throwing "Unexpected end of JSON input".
 * Automatically falls back to 'api.php' for static web hosts / Plesk / cPanel where Node.js Express routes are unavailable.
 */
async function callMysqlApi(
  nodeEndpoint: string,
  phpAction: string,
  payload: any
): Promise<{ success: boolean; data?: any; message?: string }> {
  // 0. Priority: Custom API / Bridge URL & API Key configured in MySQL settings
  const customApiUrl = payload?.config?.apiUrl?.trim();
  const customApiKey = payload?.config?.apiKey?.trim();

  if (customApiUrl) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customApiKey) {
        headers['X-API-Key'] = customApiKey;
        headers['Authorization'] = `Bearer ${customApiKey}`;
      }
      const fetchUrl = customApiUrl.includes('?')
        ? `${customApiUrl}&action=${phpAction}`
        : `${customApiUrl}?action=${phpAction}`;

      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...payload, apiKey: customApiKey, action: phpAction })
      });

      const text = await res.text();
      let json: any = null;
      if (text && text.trim().length > 0) {
        try {
          json = JSON.parse(text);
        } catch (e) {
          // Response is non-JSON
        }
      }

      if (json && typeof json === 'object') {
        return {
          success: json.success ?? false,
          data: json,
          message: json.message || json.summary
        };
      }
    } catch (err) {
      // Continue to default endpoints
    }
  }

  // 1. Try Node.js Express backend endpoint first (/api/mysql/...)
  try {
    const res = await fetch(nodeEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, action: phpAction })
    });

    const text = await res.text();
    let json: any = null;
    if (text && text.trim().length > 0) {
      try {
        json = JSON.parse(text);
      } catch (e) {
        // Response is non-JSON text / HTML error page
      }
    }

    if (json && typeof json === 'object') {
      return {
        success: json.success ?? false,
        data: json,
        message: json.message || json.summary
      };
    }
  } catch (err) {
    // Node endpoint network error or unreachable
  }

  // 2. Fallback to PHP Bridge (api.php) for Plesk / cPanel hosting
  const phpUrls = ['/api.php', 'api.php', './api.php'];
  for (const phpUrl of phpUrls) {
    try {
      const res = await fetch(`${phpUrl}?action=${phpAction}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, action: phpAction })
      });

      const text = await res.text();
      let json: any = null;
      if (text && text.trim().length > 0) {
        try {
          json = JSON.parse(text);
        } catch (e) {
          // Response is non-JSON
        }
      }

      if (json && typeof json === 'object') {
        return {
          success: json.success ?? false,
          data: json,
          message: json.message || json.summary
        };
      }
    } catch (e) {
      // Continue to next path
    }
  }

  // 3. Fallback message if neither returned valid JSON
  return {
    success: false,
    message: 'Respon dari server hosting bukan format JSON yang valid. Jika Anda menggunakan hosting Plesk/cPanel, pastikan file "api.php" dan "hosting-dist.zip" sudah diunggah ke folder httpdocs / public_html.'
  };
}

export async function testMysqlConnection(config: MysqlConfig): Promise<{ success: boolean; message: string }> {
  try {
    const res = await callMysqlApi('/api/mysql/test', 'test', { config });
    if (!res.data) {
      return {
        success: false,
        message: res.message || 'Gagal terhubung ke database MySQL/Plesk Hosting.'
      };
    }
    return {
      success: res.data.success || false,
      message: res.data.message || (res.data.success ? 'Koneksi ke MySQL/Plesk Hosting Berhasil!' : 'Gagal terhubung ke database MySQL.')
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error koneksi: ${err.message || 'Tidak dapat terhubung ke server backend'}`
    };
  }
}

export async function diagnoseMysqlConnection(config: MysqlConfig): Promise<MysqlDiagnosticResult> {
  try {
    const res = await callMysqlApi('/api/mysql/diagnose', 'diagnose', { config });
    const data = res.data;

    if (!data) {
      return {
        success: false,
        code: 'INVALID_JSON',
        title: 'Gagal Diagnosa MySQL',
        summary: res.message || 'Respon dari server tidak berformat JSON yang valid.',
        solution: 'Pastikan file api.php telah diunggah ke folder httpdocs / public_html di Plesk/cPanel Hosting Anda.'
      };
    }

    return {
      success: data.success || false,
      code: data.code,
      latencyMs: data.latencyMs,
      queryResult: data.queryResult,
      title: data.title || (data.success ? 'Diagnosis Berhasil' : 'Diagnosis Gagal'),
      summary: data.summary || data.message,
      explanation: data.explanation,
      solution: data.solution,
      rawError: data.rawError,
      isLocalhost: data.isLocalhost
    };
  } catch (err: any) {
    return {
      success: false,
      code: 'NETWORK_ERROR',
      title: 'Gagal Menghubungi Backend Diagnosa',
      summary: err.message || 'Tidak dapat mengirim permintaan diagnosa ke server.',
      solution: 'Pastikan dev server atau file api.php di hosting Anda sudah aktif.'
    };
  }
}

export async function pushDataToMysql(config?: MysqlConfig): Promise<{ success: boolean; message: string }> {
  const cfg = config || loadMysqlConfig();
  if (!cfg.host || !cfg.user || !cfg.database) {
    return {
      success: false,
      message: 'Konfigurasi MySQL belum lengkap. Harap isi Host, User, dan Database.'
    };
  }

  try {
    const madrasahId = loadActiveMadrasahId();
    const lastUpdated = loadLastUpdated() || new Date().toISOString();

    let masterRombelList: any[] = [];
    let masterSiswaList: any[] = [];
    let masterJadwalSlots: any[] = [];
    try {
      const r = localStorage.getItem('kbc_master_rombel_list');
      if (r) masterRombelList = JSON.parse(r);
      const s = localStorage.getItem('kbc_master_siswa_list');
      if (s) masterSiswaList = JSON.parse(s);
      const j = localStorage.getItem('kbc_master_jadwal_list');
      if (j) masterJadwalSlots = JSON.parse(j);
    } catch (e) {
      // ignore
    }

    const payload = {
      madrasahId,
      lastUpdated,
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
      masterRombelList,
      masterSiswaList,
      masterJadwalSlots,
      students: loadStoredStudents(),
      studentQuizResults: loadStoredStudentQuizResults()
    };

    const res = await callMysqlApi('/api/mysql/push', 'push', { config: cfg, data: payload });

    if (!res.data || !res.data.success) {
      return {
        success: false,
        message: res.data?.message || res.message || 'Gagal mengunggah data ke MySQL/Plesk Hosting.'
      };
    }

    const now = new Date().toISOString();
    const updatedCfg: MysqlConfig = { ...cfg, lastSyncedAt: now };
    saveMysqlConfig(updatedCfg);

    return {
      success: true,
      message: res.data.message || `Berhasil mengunggah data ke MySQL database (${cfg.database}.${cfg.tableName || 'kbc_mi_app_settings'})!`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal Sync MySQL: ${err.message || 'Terjadi kesalahan'}`
    };
  }
}

export async function pullDataFromMysql(config?: MysqlConfig): Promise<{ success: boolean; message: string }> {
  const cfg = config || loadMysqlConfig();
  if (!cfg.host || !cfg.user || !cfg.database) {
    return {
      success: false,
      message: 'Konfigurasi MySQL belum lengkap. Harap isi Host, User, dan Database.'
    };
  }

  try {
    const madrasahId = loadActiveMadrasahId();
    const res = await callMysqlApi('/api/mysql/pull', 'pull', { config: cfg, madrasahId });

    if (!res.data || !res.data.success) {
      return {
        success: false,
        message: res.data?.message || res.message || 'Gagal memuat data dari MySQL Hosting.'
      };
    }

    const data = res.data.data;
    if (!data) {
      return {
        success: false,
        message: 'Data tidak ditemukan di database MySQL untuk Madrasah ini.'
      };
    }

    if (Array.isArray(data.modules)) saveModules(data.modules, false);
    if (Array.isArray(data.materiBank)) saveMateriBank(data.materiBank, false);
    if (data.kopSurat) saveKopSurat(data.kopSurat, false);
    if (data.ttd) saveTTD(data.ttd, false);
    if (Array.isArray(data.teachers)) saveTeachers(data.teachers, false);
    if (Array.isArray(data.deletedMapel)) {
      const localDeleted = loadDeletedMapel();
      const mergedDeleted = Array.from(new Set([...localDeleted, ...data.deletedMapel]));
      saveDeletedMapel(mergedDeleted, false);
    }
    if (Array.isArray(data.customMapel)) saveCustomMapel(data.customMapel, false);
    if (Array.isArray(data.customTahunAjaran)) saveCustomTahunAjaran(data.customTahunAjaran, false);
    if (data.activeTahunAjaran) saveActiveTahunAjaran(data.activeTahunAjaran, false);
    if (data.teacherPin) saveTeacherPin(data.teacherPin, false);
    if (data.customOgImage) saveCustomOgImage(data.customOgImage, false);
    if (data.welcomeBanner) saveWelcomeBannerConfig(data.welcomeBanner, false);
    if (Array.isArray(data.students)) saveStudents(data.students, false);
    if (Array.isArray(data.studentQuizResults)) saveStudentQuizResults(data.studentQuizResults, false);

    try {
      if (Array.isArray(data.masterRombelList)) {
        localStorage.setItem('kbc_master_rombel_list', JSON.stringify(data.masterRombelList));
      }
      if (Array.isArray(data.masterSiswaList)) {
        localStorage.setItem('kbc_master_siswa_list', JSON.stringify(data.masterSiswaList));
      }
      if (Array.isArray(data.masterJadwalSlots)) {
        localStorage.setItem('kbc_master_jadwal_list', JSON.stringify(data.masterJadwalSlots));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('kbc_curriculum_updated'));
      }
    } catch (e) {
      // ignore
    }

    if (data.lastUpdated) setLastUpdatedTimestamp(data.lastUpdated);

    const now = new Date().toISOString();
    const updatedCfg: MysqlConfig = { ...cfg, lastSyncedAt: now };
    saveMysqlConfig(updatedCfg);

    return {
      success: true,
      message: res.data.message || 'Berhasil memuat data dari MySQL Hosting ke penyimpanan lokal!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal memuat dari MySQL: ${err.message || 'Terjadi kesalahan'}`
    };
  }
}

let mysqlPushTimeout: any = null;

export function debouncedPushToMysql(delayMs: number = 1200): void {
  if (mysqlPushTimeout) clearTimeout(mysqlPushTimeout);
  mysqlPushTimeout = setTimeout(() => {
    const cfg = loadMysqlConfig();
    if (cfg.isEnabled !== false && cfg.host && cfg.user && cfg.database) {
      pushDataToMysql(cfg).catch(err => console.warn('MySQL auto-push background notice:', err));
    }
  }, delayMs);
}
