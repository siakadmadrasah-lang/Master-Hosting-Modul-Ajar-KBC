import React from 'react';
import { Heart, Settings, Cloud, Clock, ShieldCheck, LogOut, Sparkles, User, Crown, LogIn, Layout, Award } from 'lucide-react';
import { UserSession, TrialStatus, isSuperAdminUser } from '../utils/auth';

export type NavTabType = 'my-modules' | 'materi' | 'teachers' | 'create' | 'quiz' | 'settings';

interface HeaderBarProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
  activeMadrasahName?: string;
  userSession?: UserSession | null;
  trialStatus?: TrialStatus | null;
  onLogout?: () => void;
  onOpenOfficialRegister?: () => void;
  onOpenWelcomeBanner?: () => void;
  onOpenLoginModal?: () => void;
  onOpenQuizRecap?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  onTabChange,
  activeMadrasahName = "MI Ma'arif NU 2 Sanggreman",
  userSession,
  trialStatus,
  onLogout,
  onOpenOfficialRegister,
  onOpenWelcomeBanner,
  onOpenLoginModal,
  onOpenQuizRecap
}) => {
  return (
    <header className="sticky top-0 z-30 shrink-0 w-full bg-white/95 border-b border-slate-200/90 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between select-none shadow-xs flex-wrap gap-2">
      <div className="flex items-center space-x-3">
        <div className="relative group cursor-pointer" onClick={() => onTabChange('my-modules')}>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur-xs opacity-40 group-hover:opacity-80 transition-opacity"></div>
          <div className="relative w-9 h-9 rounded-2xl bg-emerald-600 border border-emerald-500 flex items-center justify-center shadow-xs">
            <Heart className="w-4 h-4 text-white fill-white animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
            <span className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 bg-clip-text text-transparent">
              MODUL AJAR BERBASIS CINTA
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full border border-emerald-300 font-extrabold tracking-wide">
              KBC MI
            </span>
          </h1>
          <p className="text-[10px] text-slate-500 leading-none mt-1 font-sans flex items-center space-x-1 flex-wrap">
            <span className="text-slate-700 font-extrabold">{activeMadrasahName}</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">Dev: Jaenal Maskun, S.Pd.I.</span>
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
        {/* Trial / Status Badge */}
        {trialStatus && (
          trialStatus.isRegisteredOfficial ? (
            <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl text-[11px] font-extrabold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Terdaftar Resmi</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5">
              <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                trialStatus.isExpired
                  ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}>
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  {trialStatus.isExpired
                    ? 'Trial 3 Hari Berakhir'
                    : `Trial: Sisa ${trialStatus.remainingDays} Hari`
                  }
                </span>
              </div>

              {onOpenOfficialRegister && (
                <button
                  type="button"
                  onClick={onOpenOfficialRegister}
                  className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-extrabold rounded-xl shadow-xs transition-all flex items-center space-x-1"
                  title="Daftarkan Madrasah Secara Resmi"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Daftar Resmi</span>
                </button>
              )}
            </div>
          )
        )}

        <div className="hidden lg:flex items-center space-x-1 bg-teal-50 text-teal-800 border border-teal-200/90 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-2xs">
          <Cloud className="w-3.5 h-3.5 text-teal-600" />
          <span>Cloud Multi-Madrasah</span>
        </div>

        {/* Logged in User session & Logout */}
        {userSession ? (
          <div
            onClick={onOpenWelcomeBanner}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-emerald-50 border border-slate-200/90 hover:border-emerald-300 px-2.5 py-1 rounded-xl text-[11px] cursor-pointer transition-all"
            title="Klik untuk membuka Info Profil & Banner"
          >
            {isSuperAdminUser(userSession) ? (
              <span className="flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-lg font-black text-[10px]">
                <Crown className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Super Admin</span>
              </span>
            ) : userSession.role === 'guru' ? (
              <span className="flex items-center space-x-1 bg-teal-100 text-teal-900 border border-teal-300 px-1.5 py-0.5 rounded-lg font-black text-[10px]">
                <User className="w-3 h-3 text-teal-700 shrink-0" />
                <span>Guru</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 rounded-lg font-black text-[10px]">
                <ShieldCheck className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>Admin</span>
              </span>
            )}
            <span className="font-extrabold text-slate-800 max-w-[130px] truncate" title={userSession.namaLengkap || userSession.username}>
              {userSession.namaLengkap || userSession.username}
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="p-1 hover:bg-rose-100 rounded-md text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1.5">
            {onOpenWelcomeBanner && (
              <button
                type="button"
                onClick={onOpenWelcomeBanner}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 text-[11px] font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                title="Buka Banner Selamat Datang"
              >
                <Layout className="w-3.5 h-3.5 text-emerald-600" />
                <span>Info Banner</span>
              </button>
            )}

            {onOpenLoginModal && (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black rounded-xl shadow-xs transition-all flex items-center space-x-1 cursor-pointer border border-emerald-400/30 active:scale-95"
                title="Masuk ke Akun Admin / Guru"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-300" />
                <span>Masuk Admin</span>
              </button>
            )}
          </div>
        )}

        {onOpenQuizRecap && (
          <button
            type="button"
            onClick={onOpenQuizRecap}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 hover:text-amber-950 text-[11px] font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-2xs"
            title="Buka Rekapitulasi Hasil Kuis & Nilai Siswa"
          >
            <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">Rekap Nilai Kuis</span>
            <span className="sm:hidden">Rekap</span>
          </button>
        )}

        {/* Modul Pengaturan hanya ada di admin super admin & operator */}
        {(!userSession || userSession.role === 'admin' || userSession.role === 'superadmin' || userSession.role === 'operator' || isSuperAdminUser(userSession)) && (
          <button
            onClick={() => onTabChange('settings')}
            className={`p-1.5 rounded-xl transition-all border cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
            title="Pengaturan Kop Surat & TTD (Khusus Admin & Super Admin)"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};




