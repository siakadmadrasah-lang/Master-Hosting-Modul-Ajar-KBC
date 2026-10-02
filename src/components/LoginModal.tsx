import React, { useState, useMemo } from 'react';
import { authenticateUser, UserSession, normalizeTeacherName, isDeviceTrustedForSuperAdmin } from '../utils/auth';
import { loadStoredTeachers } from '../utils/storage';
import { TeacherItem } from '../types';
import { 
  Lock, 
  User, 
  KeyRound, 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  X, 
  GraduationCap, 
  Shield, 
  CheckCircle2,
  Sparkles,
  Info,
  Search,
  Check,
  CreditCard,
  Hash,
  Eye,
  EyeOff,
  Laptop
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (session: UserSession) => void;
  onOpenOfficialRegister?: () => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onOpenOfficialRegister,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'guru' | 'admin'>('guru');

  // Admin form state (empty by default for security)
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Check if this device has been previously authenticated as Super Admin
  const isTrustedSuperAdminDevice = isDeviceTrustedForSuperAdmin();

  // Guru form state (empty by default for security)
  const teachers = loadStoredTeachers();
  const [guruIdentifier, setGuruIdentifier] = useState('');
  const [guruPin, setGuruPin] = useState('');
  const [showGuruPin, setShowGuruPin] = useState(false);
  const [isDropdownMode, setIsDropdownMode] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers.length > 0 ? teachers[0].id : ''
  );

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Live auto-match teacher based on entered identifier
  const detectedTeacher = useMemo(() => {
    if (!guruIdentifier.trim()) return null;
    const clean = guruIdentifier.trim().toLowerCase();
    const cleanDigits = clean.replace(/[^0-9]/g, '');
    const cleanAlpha = clean.replace(/[^a-zA-Z0-9]/g, '');
    const normName = normalizeTeacherName(clean);

    return teachers.find(t => {
      const tNama = (t.nama || '').trim().toLowerCase();
      const tNorm = normalizeTeacherName(t.nama || '');
      const tNik = (t.nik || '').replace(/[^0-9]/g, '');
      const tNip = (t.nip || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const tNuptk = (t.nuptk || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const tPegId = (t.pegIdSimpatika || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const tNpk = (t.npk || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const tUser = (t.username || '').trim().toLowerCase();

      return (
        tNama === clean ||
        (tNorm && normName && (tNorm === normName || (normName.length >= 4 && tNorm.includes(normName)))) ||
        (tNik && cleanDigits && tNik === cleanDigits) ||
        (tNip && cleanAlpha && tNip === cleanAlpha) ||
        (tNuptk && cleanAlpha && tNuptk === cleanAlpha) ||
        (tPegId && cleanAlpha && tPegId === cleanAlpha) ||
        (tNpk && cleanAlpha && tNpk === cleanAlpha) ||
        (tUser && tUser === clean) ||
        t.id === clean
      );
    });
  }, [guruIdentifier, teachers]);

  const currentTeacher = isDropdownMode ? teachers.find(t => t.id === selectedTeacherId) : detectedTeacher;

  if (!isOpen) return null;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const res = authenticateUser(adminUsername, adminPassword);
      setIsLoading(false);

      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMsg(res.message || 'Username atau kata sandi admin salah!');
      }
    }, 250);
  };

  const handleGuruSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const userInput = isDropdownMode
      ? (currentTeacher?.username || currentTeacher?.nip || currentTeacher?.nama || selectedTeacherId)
      : guruIdentifier.trim();

    if (!userInput) {
      setErrorMsg('Silakan masukkan Nama, NIK, NIP, NUPTK, atau PegID Guru!');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const res = authenticateUser(userInput, guruPin);
      setIsLoading(false);

      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMsg(res.message || 'Nama, NIK, NIP, NUPTK, PegID atau PIN Guru tidak sesuai!');
      }
    }, 250);
  };

  const handleQuickLogin = (u: string, p: string) => {
    setErrorMsg('');
    const res = authenticateUser(u, p);
    if (res.success && res.session) {
      onLoginSuccess(res.session);
    }
  };

  const handleSelectTeacherFromList = (teacher: TeacherItem) => {
    setSelectedTeacherId(teacher.id);
    setGuruIdentifier(teacher.nip || teacher.nama);
    setIsDropdownMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-[460px] w-full overflow-hidden">
        {/* Header Visual Compact */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white px-5 py-4 relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 border border-white/20 rounded-2xl text-emerald-300 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight leading-tight">
                Masuk Sistem KBC-MI
              </h2>
              <p className="text-[11px] text-emerald-200/90 font-medium leading-none mt-0.5">
                Modul Ajar Berbasis Cinta (Kemenag MI)
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-all cursor-pointer shrink-0"
              title="Tutup / Batal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mode Selector Tabs (Guru vs Admin) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-black">
          <button
            type="button"
            onClick={() => {
              setActiveTab('guru');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'guru'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <span>Login Guru Pengajar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-slate-700" />
            <span>Login Admin / Operator</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-tight">{errorMsg}</span>
            </div>
          )}

          {/* GURU LOGIN FORM */}
          {activeTab === 'guru' && (
            <form onSubmit={handleGuruSubmit} className="space-y-3.5">
              {/* Badge info credential types */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-emerald-50/80 border border-emerald-200/70 rounded-xl text-[10px] text-emerald-900 font-bold">
                <span className="text-emerald-700 font-black">Login dengan:</span>
                <span className="bg-white border border-emerald-300 px-1.5 py-0.5 rounded-md text-emerald-800">Nama</span>
                <span className="bg-white border border-emerald-300 px-1.5 py-0.5 rounded-md text-emerald-800">NIK</span>
                <span className="bg-white border border-emerald-300 px-1.5 py-0.5 rounded-md text-emerald-800">NIP</span>
                <span className="bg-white border border-emerald-300 px-1.5 py-0.5 rounded-md text-emerald-800">NUPTK</span>
                <span className="bg-white border border-emerald-300 px-1.5 py-0.5 rounded-md text-emerald-800">PegID</span>
              </div>

              {!isDropdownMode ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-extrabold text-slate-700">
                      Nama / NIK / NIP / NUPTK / PegID Guru
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDropdownMode(true)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                    >
                      Pilih dari Daftar &rarr;
                    </button>
                  </div>

                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={guruIdentifier}
                      onChange={(e) => setGuruIdentifier(e.target.value)}
                      placeholder="Ketik Nama, NIK, NIP, NUPTK, atau PegID"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>

                  {/* Auto-detected Teacher Match Feedback */}
                  {detectedTeacher && (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 space-y-1 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-extrabold text-emerald-900">{detectedTeacher.nama}</span>
                        </div>
                        <span className="text-[9.5px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-black">
                          {detectedTeacher.jabatanGuru || 'Guru Terdaftar'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-2 text-[10px] text-emerald-800">
                        {detectedTeacher.nip && <span>NIP: {detectedTeacher.nip}</span>}
                        {detectedTeacher.nik && <span>NIK: {detectedTeacher.nik}</span>}
                        {detectedTeacher.pegIdSimpatika && <span>PegID: {detectedTeacher.pegIdSimpatika}</span>}
                        {detectedTeacher.nuptk && <span>NUPTK: {detectedTeacher.nuptk}</span>}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-extrabold text-slate-700">
                      Pilih dari Daftar Guru Terdaftar
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDropdownMode(false)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                    >
                      &larr; Ketik Langsung
                    </button>
                  </div>

                  <select
                    value={selectedTeacherId}
                    onChange={(e) => {
                      setSelectedTeacherId(e.target.value);
                      const t = teachers.find(item => item.id === e.target.value);
                      if (t) setGuruIdentifier(t.nip || t.nama);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nama} {t.nip ? `(NIP: ${t.nip})` : ''} - {t.jabatanMapel || t.jabatanAtauKelas || 'Guru'}
                      </option>
                    ))}
                  </select>

                  {/* Selected Teacher Details Preview */}
                  {currentTeacher && (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{currentTeacher.nama}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold">
                          {currentTeacher.nip ? `NIP: ${currentTeacher.nip}` : 'Guru Terdaftar'}
                        </span>
                      </div>
                      <div className="text-emerald-800 text-[10px] truncate">
                        Mapel: {(currentTeacher.mapelAmpu || []).join(', ') || currentTeacher.jabatanMapel || currentTeacher.jabatanAtauKelas}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    PIN Login Guru
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">PIN Keamanan Akun</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showGuruPin ? 'text' : 'password'}
                    required
                    value={guruPin}
                    onChange={(e) => setGuruPin(e.target.value)}
                    placeholder="Masukkan PIN Anda"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 focus:bg-white focus:border-emerald-600 outline-none tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGuruPin(!showGuruPin)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showGuruPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Memverifikasi Identitas Guru...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk Sebagai Guru Pengajar</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ADMIN LOGIN FORM */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Username / Email / No. WhatsApp Admin
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Username atau Email Admin"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kata Sandi / PIN Admin
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan kata sandi admin"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Memverifikasi Administrator...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-emerald-400" />
                    <span>Masuk Sebagai Administrator</span>
                  </>
                )}
              </button>

              {/* Super Admin Device Protection Badge & Presets */}
              {isTrustedSuperAdminDevice ? (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center space-x-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[10.5px] text-emerald-900 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Perangkat ini terverifikasi untuk akses Super Admin.</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminUsername('admin');
                        setAdminPassword('admin');
                      }}
                      className="w-full py-1.5 px-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:text-emerald-800 transition-all text-center cursor-pointer"
                    >
                      Isi Kredensial Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminUsername('jaenalmaskun@gmail.com');
                        setAdminPassword('admin');
                      }}
                      className="w-full py-1.5 px-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:text-amber-900 transition-all text-center cursor-pointer"
                    >
                      Isi Super Admin
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100">
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[10.5px] text-slate-600 flex items-start space-x-2">
                    <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">Proteksi Perangkat Baru:</span> Masukkan kredensial login admin secara manual untuk memverifikasi hak akses perangkat ini.
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Quick Informational Box */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 text-slate-600 text-[11px] space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Panduan Login:</span>
            </div>
            <p className="text-[10.5px] leading-relaxed text-slate-500">
              • <strong>Login Guru:</strong> Masukkan Nama, NIK, NIP, NUPTK, atau PegID Simpatika beserta PIN akun Anda.<br />
              • <strong>Login Admin:</strong> Menggunakan akun Administrator / Operator madrasah yang terdaftar untuk kelola sistem & modul ajar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

