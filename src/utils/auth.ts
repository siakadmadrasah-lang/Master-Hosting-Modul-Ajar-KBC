import { saveMadrasahList, loadMadrasahList, saveActiveMadrasahId, saveSupabaseConfig, DEFAULT_SUPABASE_CONFIG, saveApiKey, restoreSuperAdminCredentials, saveSuperAdminCredentialsBackup, clearActiveCredentialsForRegularUser, loadStoredTeachers, loadAdminAccounts } from './storage';
import { MadrasahItem, TeacherItem, AdminAccountItem } from '../types';

export interface UserSession {
  username: string;
  email?: string;
  namaLengkap: string;
  role: 'admin' | 'guru' | 'operator' | 'superadmin';
  isSuperAdmin?: boolean;
  loginAt: number; // timestamp
  trialStartDate: number; // timestamp
  isRegisteredOfficial: boolean; // whether officially registered or still in trial
  registeredMadrasahName?: string;
  teacherId?: string; // id of TeacherItem if role is guru
  nip?: string;
  mapelAmpu?: string[];
  kelasAmpu?: string[];
  jabatanAtauKelas?: string;
  permissions?: string[];
  adminId?: string;
}

export const SUPER_ADMIN_EMAIL = 'jaenalmaskun@gmail.com';
const SUPERADMIN_TRUSTED_DEVICE_KEY = 'kbc_mi_trusted_superadmin_device_v1';

export function isDeviceTrustedForSuperAdmin(): boolean {
  try {
    const val = localStorage.getItem(SUPERADMIN_TRUSTED_DEVICE_KEY);
    return Boolean(val && val.length > 0);
  } catch (e) {
    return false;
  }
}

export function markDeviceAsTrustedForSuperAdmin(): void {
  try {
    const token = `device_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SUPERADMIN_TRUSTED_DEVICE_KEY, token);
  } catch (e) {}
}

export function revokeDeviceTrustForSuperAdmin(): void {
  try {
    localStorage.removeItem(SUPERADMIN_TRUSTED_DEVICE_KEY);
  } catch (e) {}
}

export function isSuperAdminUser(session?: UserSession | null): boolean {
  const current = session || loadUserSession();
  if (!current) return false;
  const cleanUser = (current.username || '').trim().toLowerCase();
  const cleanEmail = (current.email || '').trim().toLowerCase();
  return cleanUser === SUPER_ADMIN_EMAIL || cleanEmail === SUPER_ADMIN_EMAIL || cleanUser === 'jaenalmaskun' || current.isSuperAdmin === true;
}

const AUTH_STORAGE_KEY = 'kbc_mi_user_session_v1';
const TRIAL_START_KEY = 'kbc_mi_trial_start_date_v1';
const REGISTERED_OFFICIAL_KEY = 'kbc_mi_registered_official_v1';

export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

export function getTrialStartDate(): number {
  try {
    const raw = localStorage.getItem(TRIAL_START_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (e) {}
  const now = Date.now();
  try {
    localStorage.setItem(TRIAL_START_KEY, now.toString());
  } catch (e) {}
  return now;
}

export function isOfficialRegistered(): boolean {
  try {
    return localStorage.getItem(REGISTERED_OFFICIAL_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setOfficialRegistered(registered: boolean = true): void {
  try {
    localStorage.setItem(REGISTERED_OFFICIAL_KEY, registered ? 'true' : 'false');
  } catch (e) {}
}

export interface TrialStatus {
  isExpired: boolean;
  isRegisteredOfficial: boolean;
  remainingMs: number;
  remainingDays: number;
  remainingHours: number;
  remainingMinutes: number;
  totalDays: number;
  percentRemaining: number;
}

export function getTrialStatus(): TrialStatus {
  const isOfficial = isOfficialRegistered();
  if (isOfficial) {
    return {
      isExpired: false,
      isRegisteredOfficial: true,
      remainingMs: THREE_DAYS_MS,
      remainingDays: 3,
      remainingHours: 72,
      remainingMinutes: 4320,
      totalDays: 3,
      percentRemaining: 100
    };
  }

  const startDate = getTrialStartDate();
  const now = Date.now();
  const elapsed = now - startDate;
  const remainingMs = Math.max(0, THREE_DAYS_MS - elapsed);
  const isExpired = remainingMs <= 0;

  const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const percentRemaining = Math.max(0, Math.min(100, Math.round((remainingMs / THREE_DAYS_MS) * 100)));

  return {
    isExpired,
    isRegisteredOfficial: false,
    remainingMs,
    remainingDays,
    remainingHours,
    remainingMinutes,
    totalDays: 3,
    percentRemaining
  };
}

// Load current logged in user session
export function loadUserSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      if (session && session.username) {
        return session;
      }
    }
  } catch (e) {}
  return null;
}

// Save user session
export function saveUserSession(session: UserSession | null): void {
  try {
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {}
}

const LAST_LOGGED_USER_KEY = 'kbc_mi_last_logged_username_v1';

export function getLastLoggedUsername(): string {
  try {
    return localStorage.getItem(LAST_LOGGED_USER_KEY) || '';
  } catch (err) {
    return '';
  }
}

export function setLastLoggedUsername(username: string): void {
  try {
    localStorage.setItem(LAST_LOGGED_USER_KEY, username.trim().toLowerCase());
  } catch (err) {
    console.error('Error saving last logged username:', err);
  }
}

// Helper to normalize teacher name for flexible matching (removes academic titles and symbols)
export function normalizeTeacherName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/,\s*(s\.pd\.i|s\.pd|m\.pd|s\.ag|m\.ag|s\.e|s\.si|m\.si|s\.kom|m\.kom|ph\.d|dr\.|drs\.|dra\.|lc\.|m\.a)\b/gi, '')
    .replace(/\b(h\.|hj\.|drs\.|dra\.|dr\.|prof\.|ustadz\.|ustadzah\.)\b/gi, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// System login verification
export function authenticateUser(usernameInput: string, passwordInput: string): { success: boolean; session?: UserSession; message?: string } {
  const cleanUser = usernameInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanUser || !cleanPass) {
    return { success: false, message: 'Username / NIK / NIP / NUPTK / PegID dan PIN / kata sandi wajib diisi!' };
  }

  // 1. Check if logging in as Super Admin email or username
  const isSuper = cleanUser === SUPER_ADMIN_EMAIL || cleanUser === 'jaenalmaskun';

  // 2. Check registered Admin & Operator accounts from storage
  const adminAccountsList = loadAdminAccounts();
  const matchedAdmin = adminAccountsList.find(a => {
    const aUser = (a.username || '').trim().toLowerCase();
    const aEmail = (a.email || '').trim().toLowerCase();
    const aWa = (a.noWhatsapp || '').replace(/[^0-9]/g, '');
    const cleanDigits = cleanUser.replace(/[^0-9]/g, '');

    return (
      (aUser && aUser === cleanUser) ||
      (aEmail && aEmail === cleanUser) ||
      (aWa && cleanDigits && aWa === cleanDigits) ||
      a.id === cleanUser
    );
  });

  // 3. Check registered teacher accounts from database/localStorage (Nama, NIK, NIP, NUPTK, PegID)
  const teachersList = loadStoredTeachers();
  const inputCleanAlpha = cleanUser.replace(/[^a-zA-Z0-9]/g, '');
  const inputCleanDigits = cleanUser.replace(/[^0-9]/g, '');
  const inputNormalizedName = normalizeTeacherName(cleanUser);

  const matchedTeacher = teachersList.find(t => {
    const tUser = (t.username || '').trim().toLowerCase();
    const tEmail = (t.email || '').trim().toLowerCase();
    const tNama = (t.nama || '').trim().toLowerCase();
    const tNormalizedName = normalizeTeacherName(t.nama || '');

    // NIP
    const tNipRaw = (t.nip || '').trim().toLowerCase();
    const tNipCleanAlpha = tNipRaw.replace(/[^a-zA-Z0-9]/g, '');
    const tNipDigits = tNipRaw.replace(/[^0-9]/g, '');

    // NIK (16 digit)
    const tNikRaw = (t.nik || '').trim().toLowerCase();
    const tNikCleanAlpha = tNikRaw.replace(/[^a-zA-Z0-9]/g, '');
    const tNikDigits = tNikRaw.replace(/[^0-9]/g, '');

    // NUPTK (16 digit)
    const tNuptkRaw = (t.nuptk || '').trim().toLowerCase();
    const tNuptkCleanAlpha = tNuptkRaw.replace(/[^a-zA-Z0-9]/g, '');
    const tNuptkDigits = tNuptkRaw.replace(/[^0-9]/g, '');

    // PegID / PegID Simpatika / SIAGA
    const tPegIdRaw = (t.pegIdSimpatika || '').trim().toLowerCase();
    const tPegIdCleanAlpha = tPegIdRaw.replace(/[^a-zA-Z0-9]/g, '');
    const tPegIdDigits = tPegIdRaw.replace(/[^0-9]/g, '');

    // NPK
    const tNpkRaw = (t.npk || '').trim().toLowerCase();
    const tNpkCleanAlpha = tNpkRaw.replace(/[^a-zA-Z0-9]/g, '');
    const tNpkDigits = tNpkRaw.replace(/[^0-9]/g, '');

    // No WhatsApp / Kontak
    const tWa = (t.noWhatsapp || t.kontak || '').replace(/[^0-9]/g, '');

    // Match by Identifiers (NIK, NIP, NUPTK, PegID, NPK, ID)
    const matchNik = (tNikRaw && tNikRaw === cleanUser) || (tNikCleanAlpha && inputCleanAlpha && tNikCleanAlpha === inputCleanAlpha) || (tNikDigits && inputCleanDigits && tNikDigits === inputCleanDigits);
    const matchNip = (tNipRaw && tNipRaw === cleanUser) || (tNipCleanAlpha && inputCleanAlpha && tNipCleanAlpha === inputCleanAlpha) || (tNipDigits && inputCleanDigits && tNipDigits === inputCleanDigits);
    const matchNuptk = (tNuptkRaw && tNuptkRaw === cleanUser) || (tNuptkCleanAlpha && inputCleanAlpha && tNuptkCleanAlpha === inputCleanAlpha) || (tNuptkDigits && inputCleanDigits && tNuptkDigits === inputCleanDigits);
    const matchPegId = (tPegIdRaw && tPegIdRaw === cleanUser) || (tPegIdCleanAlpha && inputCleanAlpha && tPegIdCleanAlpha === inputCleanAlpha) || (tPegIdDigits && inputCleanDigits && tPegIdDigits === inputCleanDigits);
    const matchNpk = (tNpkRaw && tNpkRaw === cleanUser) || (tNpkCleanAlpha && inputCleanAlpha && tNpkCleanAlpha === inputCleanAlpha) || (tNpkDigits && inputCleanDigits && tNpkDigits === inputCleanDigits);
    const matchUserOrId = (tUser && tUser === cleanUser) || (tEmail && tEmail === cleanUser) || t.id === cleanUser || (tWa && inputCleanDigits && tWa === inputCleanDigits);

    // Match by Teacher Name (Exact, Normalized, or Substring)
    const matchNameExact = tNama && tNama === cleanUser;
    const matchNameNorm = tNormalizedName && inputNormalizedName && (tNormalizedName === inputNormalizedName || (inputNormalizedName.length >= 4 && (tNormalizedName.includes(inputNormalizedName) || inputNormalizedName.includes(tNormalizedName))));

    return (
      matchNik ||
      matchNip ||
      matchNuptk ||
      matchPegId ||
      matchNpk ||
      matchUserOrId ||
      matchNameExact ||
      matchNameNorm
    );
  });

  // System fallback credentials list
  const DEFAULT_ACCOUNTS = [
    { user: 'jaenalmaskun@gmail.com', pass: 'admin', name: 'Jaenal Maskun, S.Pd.I. (Super Admin)', role: 'superadmin', isSuper: true, email: 'jaenalmaskun@gmail.com' },
    { user: 'jaenalmaskun', pass: 'admin', name: 'Jaenal Maskun, S.Pd.I. (Super Admin)', role: 'superadmin', isSuper: true, email: 'jaenalmaskun@gmail.com' },
    { user: 'admin', pass: 'admin', name: 'Administrator Madrasah', role: 'admin' },
    { user: 'operator', pass: 'operator123', name: 'Operator Madrasah', role: 'operator' },
    { user: 'kamad', pass: 'kamad123', name: 'Kepala Madrasah', role: 'admin' },
    { user: 'demo', pass: 'demo123', name: 'Pengguna Trial Demo', role: 'guru' }
  ];

  const matchedDefault = DEFAULT_ACCOUNTS.find(a => a.user === cleanUser && a.pass === cleanPass);

  let userSession: UserSession;
  if (matchedAdmin) {
    if (matchedAdmin.status === 'nonaktif') {
      return {
        success: false,
        message: `Akun "${matchedAdmin.namaLengkap}" sedang dinonaktifkan oleh administrator. Hubungi Super Admin untuk mengaktifkan kembali.`
      };
    }

    const adminPass = matchedAdmin.password || 'admin';
    const adminPin = matchedAdmin.pin || '123456';
    const isPassValid = cleanPass === adminPass || cleanPass === adminPin || (matchedAdmin.role === 'superadmin' && cleanPass === 'admin');

    if (!isPassValid) {
      return {
        success: false,
        message: `Kata sandi atau PIN untuk akun "${matchedAdmin.namaLengkap}" salah!`
      };
    }

    const isSuperAcc = matchedAdmin.role === 'superadmin' || isSuper;
    if (isSuperAcc) {
      setOfficialRegistered(true);
    }

    userSession = {
      username: matchedAdmin.username,
      email: matchedAdmin.email || undefined,
      namaLengkap: matchedAdmin.namaLengkap,
      role: matchedAdmin.role === 'superadmin' ? 'superadmin' : matchedAdmin.role === 'operator' ? 'operator' : 'admin',
      isSuperAdmin: isSuperAcc,
      loginAt: Date.now(),
      trialStartDate: getTrialStartDate(),
      isRegisteredOfficial: isSuperAcc ? true : isOfficialRegistered(),
      permissions: matchedAdmin.permissions,
      adminId: matchedAdmin.id
    };
  } else if (isSuper && cleanPass === 'admin') {
    setOfficialRegistered(true);
    userSession = {
      username: SUPER_ADMIN_EMAIL,
      email: SUPER_ADMIN_EMAIL,
      namaLengkap: 'Jaenal Maskun, S.Pd.I. (Super Admin)',
      role: 'superadmin',
      isSuperAdmin: true,
      loginAt: Date.now(),
      trialStartDate: getTrialStartDate(),
      isRegisteredOfficial: true
    };
  } else if (matchedDefault) {
    userSession = {
      username: matchedDefault.user,
      email: matchedDefault.email || matchedDefault.user,
      namaLengkap: matchedDefault.name,
      role: matchedDefault.role as any,
      isSuperAdmin: matchedDefault.isSuper || false,
      loginAt: Date.now(),
      trialStartDate: getTrialStartDate(),
      isRegisteredOfficial: matchedDefault.isSuper ? true : isOfficialRegistered()
    };
  } else if (matchedTeacher) {
    // Verify PIN / Kata Sandi (Supports PIN, Default PINs, Custom Password, and last digits of NIK/NIP/NUPTK/PegID)
    const teacherPin = matchedTeacher.pin || '1234';
    const teacherPass = (matchedTeacher as any).password || '';
    
    // Extract last 4 and 6 digits of credentials as PIN fallback
    const tNikDigits = (matchedTeacher.nik || '').replace(/[^0-9]/g, '');
    const tNipDigits = (matchedTeacher.nip || '').replace(/[^0-9]/g, '');
    const tNuptkDigits = (matchedTeacher.nuptk || '').replace(/[^0-9]/g, '');
    const tPegIdDigits = (matchedTeacher.pegIdSimpatika || '').replace(/[^0-9]/g, '');

    const last4Nik = tNikDigits.length >= 4 ? tNikDigits.slice(-4) : '';
    const last6Nik = tNikDigits.length >= 6 ? tNikDigits.slice(-6) : '';
    const last4Nip = tNipDigits.length >= 4 ? tNipDigits.slice(-4) : '';
    const last6Nip = tNipDigits.length >= 6 ? tNipDigits.slice(-6) : '';
    const last4Nuptk = tNuptkDigits.length >= 4 ? tNuptkDigits.slice(-4) : '';
    const last6Nuptk = tNuptkDigits.length >= 6 ? tNuptkDigits.slice(-6) : '';
    const last4PegId = tPegIdDigits.length >= 4 ? tPegIdDigits.slice(-4) : '';
    const last6PegId = tPegIdDigits.length >= 6 ? tPegIdDigits.slice(-6) : '';

    const isPinValid =
      cleanPass === teacherPin ||
      (teacherPass && cleanPass === teacherPass) ||
      cleanPass === '1234' ||
      cleanPass === '123456' ||
      cleanPass === 'guru123' ||
      cleanPass === 'admin' ||
      (last4Nik && cleanPass === last4Nik) ||
      (last6Nik && cleanPass === last6Nik) ||
      (last4Nip && cleanPass === last4Nip) ||
      (last6Nip && cleanPass === last6Nip) ||
      (last4Nuptk && cleanPass === last4Nuptk) ||
      (last6Nuptk && cleanPass === last6Nuptk) ||
      (last4PegId && cleanPass === last4PegId) ||
      (last6PegId && cleanPass === last6PegId);

    if (!isPinValid) {
      return {
        success: false,
        message: `PIN Login untuk Guru "${matchedTeacher.nama}" tidak sesuai! Gunakan PIN (${teacherPin}) atau hubungi Admin jika Anda lupa PIN.`
      };
    }

    userSession = {
      username: matchedTeacher.username || matchedTeacher.nip || matchedTeacher.nama.toLowerCase().replace(/[^a-z0-9]/g, ''),
      email: matchedTeacher.email || undefined,
      namaLengkap: matchedTeacher.nama,
      role: (matchedTeacher.hakAkses === 'admin' ? 'admin' : matchedTeacher.hakAkses === 'operator' ? 'operator' : 'guru') as any,
      isSuperAdmin: false,
      loginAt: Date.now(),
      trialStartDate: getTrialStartDate(),
      isRegisteredOfficial: isOfficialRegistered(),
      teacherId: matchedTeacher.id,
      nip: matchedTeacher.nip,
      mapelAmpu: matchedTeacher.mapelAmpu || [],
      kelasAmpu: matchedTeacher.kelasAmpu || [],
      jabatanAtauKelas: matchedTeacher.jabatanMapel || matchedTeacher.jabatanAtauKelas
    };
  } else if (cleanPass.length >= 3) {
    userSession = {
      username: cleanUser,
      email: cleanUser.includes('@') ? cleanUser : undefined,
      namaLengkap: cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1),
      role: 'guru',
      isSuperAdmin: false,
      loginAt: Date.now(),
      trialStartDate: getTrialStartDate(),
      isRegisteredOfficial: isOfficialRegistered()
    };
  } else {
    return { success: false, message: 'Username atau kata sandi/PIN tidak sesuai! Gunakan akun Admin: admin / admin atau Akun Guru: NIP & PIN Anda.' };
  }

  const newUsernameClean = userSession.username.trim().toLowerCase();

  // Save session first so system recognizes current user
  saveUserSession(userSession);
  setLastLoggedUsername(newUsernameClean);

  // If logging in as Super Admin, restore Super Admin's Supabase credentials and API Key
  if (isSuperAdminUser(userSession)) {
    markDeviceAsTrustedForSuperAdmin();
    restoreSuperAdminCredentials();
  } else {
    // Regular users: Reset active Supabase credentials and Gemini API Key to default empty
    clearActiveCredentialsForRegularUser();
  }

  return { success: true, session: userSession };
}

// Logout user
export function logoutUser(): void {
  const currentSession = loadUserSession();
  if (isSuperAdminUser(currentSession)) {
    saveSuperAdminCredentialsBackup();
  }
  clearActiveCredentialsForRegularUser();
  saveUserSession(null);
}

// Register Official Madrasah to unlock full features & convert from Trial to Official
export function registerOfficialMadrasah(data: {
  namaMadrasah: string;
  kotaKabupaten?: string;
  nsmOrNpsn?: string;
  alamat?: string;
  kontak?: string;
}): { success: boolean; newMadrasahId: string; message: string } {
  if (!data.namaMadrasah || !data.namaMadrasah.trim()) {
    return { success: false, newMadrasahId: '', message: 'Nama Madrasah wajib diisi!' };
  }

  const cleanNama = data.namaMadrasah.trim();
  const slug = cleanNama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = `m-${slug}-${Date.now().toString(36)}`;

  const newMadrasahItem: MadrasahItem = {
    id,
    nama: cleanNama,
    kodeMadrasah: (data.nsmOrNpsn && data.nsmOrNpsn.trim()) || slug.toUpperCase().slice(0, 15),
    nsmOrNpsn: data.nsmOrNpsn?.trim() || '',
    alamat: data.alamat?.trim() || (data.kotaKabupaten ? `Kab/Kota ${data.kotaKabupaten.trim()}` : ''),
    kontak: data.kontak?.trim() || '',
    createdAt: new Date().toISOString()
  };

  const list = loadMadrasahList();
  const existingIndex = list.findIndex(m => m.nama.toLowerCase() === cleanNama.toLowerCase());
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...newMadrasahItem, id: list[existingIndex].id };
    saveMadrasahList(list);
    saveActiveMadrasahId(list[existingIndex].id);
    setOfficialRegistered(true);

    const cur = loadUserSession();
    if (cur) {
      cur.isRegisteredOfficial = true;
      cur.registeredMadrasahName = cleanNama;
      saveUserSession(cur);
    }

    return {
      success: true,
      newMadrasahId: list[existingIndex].id,
      message: `Selamat! Madrasah "${cleanNama}" berhasil didaftarkan secara resmi.`
    };
  }

  const updatedList = [newMadrasahItem, ...list];
  saveMadrasahList(updatedList);
  saveActiveMadrasahId(id);
  setOfficialRegistered(true);

  const cur = loadUserSession();
  if (cur) {
    cur.isRegisteredOfficial = true;
    cur.registeredMadrasahName = cleanNama;
    saveUserSession(cur);
  }

  return {
    success: true,
    newMadrasahId: id,
    message: `Selamat! Madrasah "${cleanNama}" telah resmi terdaftar di Sistem Pengelola Madrasah.`
  };
}
