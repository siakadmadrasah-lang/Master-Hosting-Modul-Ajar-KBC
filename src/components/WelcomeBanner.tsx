import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSession } from '../utils/auth';
import { WelcomeBannerConfig, DEFAULT_WELCOME_BANNER_CONFIG } from '../types';
import { loadWelcomeBannerConfig, saveWelcomeBannerConfig, loadKopSurat, loadCustomOgImage, getActiveMadrasah } from '../utils/storage';
import defaultOgBadgeImage from '../assets/images/og_badge_jaenal_inside_1784949367744.jpg';
import { compressAndResizeImage } from '../utils/imageHelper';
import {
  Sparkles,
  Heart,
  Crown,
  BookOpen,
  GraduationCap,
  X,
  School,
  Calendar,
  Wand2,
  Zap,
  Compass,
  Edit3,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  Palette,
  Clock,
  Layout,
  ExternalLink,
  Settings,
  Flame,
  Award,
  Upload,
  Trash2,
  Camera,
  Loader2,
  Building,
  Check,
  Link as LinkIcon,
  FileImage,
  RefreshCw,
  UploadCloud,
  LogIn,
  LogOut,
  ArrowRight
} from 'lucide-react';

interface WelcomeBannerProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession | null;
  activeMadrasahName?: string;
  activeTahunAjaran?: string;
  onOpenAiModal?: () => void;
  onNavigateTab?: (tab: 'my-modules' | 'materi' | 'quiz' | 'master-kurikulum' | 'settings') => void;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  isStudentMode?: boolean;
  studentTargetMapel?: string;
  onOpenPinModal?: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  isOpen,
  onClose,
  userSession,
  activeMadrasahName = "MI Ma'arif NU 2 Sanggreman",
  activeTahunAjaran = "2024/2025",
  onOpenAiModal,
  onNavigateTab,
  onOpenLoginModal,
  onLogout,
  isStudentMode = false,
  studentTargetMapel = '',
  onOpenPinModal
}) => {
  const [config, setConfig] = useState<WelcomeBannerConfig>(() => loadWelcomeBannerConfig());
  const [imgError, setImgError] = useState(false);

  // Sync state when config changes or when banner opens or when cloud updates
  useEffect(() => {
    setImgError(false);
    const handleSync = () => {
      const loaded = loadWelcomeBannerConfig();
      setConfig(loaded);
    };

    if (isOpen) {
      handleSync();
      window.addEventListener('storage', handleSync);
      window.addEventListener('kbc_welcome_banner_updated', handleSync);
      window.addEventListener('kbc_kop_surat_updated', handleSync);
      window.addEventListener('kbc_active_madrasah_changed', handleSync);
      return () => {
        window.removeEventListener('storage', handleSync);
        window.removeEventListener('kbc_welcome_banner_updated', handleSync);
        window.removeEventListener('kbc_kop_surat_updated', handleSync);
        window.removeEventListener('kbc_active_madrasah_changed', handleSync);
      };
    }
  }, [isOpen, config.gambarUrl]);

  if (!isOpen || !config.isBannerActive) return null;

  const isSuperAdmin = userSession ? (userSession.username === 'admin' || userSession.role === 'super_admin') : false;
  const displayName = userSession ? userSession.namaLengkap : 'Pengunjung / Tamu Madrasah';

  // Process file upload dynamically
  // Handle action triggers - Directs non-logged-in user to login modal, logged-in user into app
  const handleCloseToAdmin = () => {
    onClose();
    if (!userSession && onOpenLoginModal) {
      onOpenLoginModal();
    }
    if (userSession && onNavigateTab) {
      onNavigateTab('settings');
    }
  };

  const handleActionClick = (action: WelcomeBannerConfig['tombolUtamaAction']) => {
    onClose();
    if (!userSession && onOpenLoginModal) {
      onOpenLoginModal();
    }
    if (userSession && onNavigateTab) {
      onNavigateTab('settings');
    }
    if (action === 'ai-modal' && onOpenAiModal) {
      onOpenAiModal();
    }
  };

  // Helper function to get theme classes
  const getThemeClasses = (themeStyle: WelcomeBannerConfig['themeStyle']) => {
    switch (themeStyle) {
      case 'indigo':
        return {
          border: 'border-indigo-500/50',
          glowLeft: 'bg-indigo-500/25',
          glowRight: 'bg-purple-500/25',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          btnPrimary: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/30',
          accentText: 'text-indigo-400'
        };
      case 'amber':
        return {
          border: 'border-amber-500/50',
          glowLeft: 'bg-amber-500/25',
          glowRight: 'bg-orange-500/25',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          btnPrimary: 'bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black shadow-amber-500/30',
          accentText: 'text-amber-400'
        };
      case 'rose':
        return {
          border: 'border-rose-500/50',
          glowLeft: 'bg-rose-500/25',
          glowRight: 'bg-pink-500/25',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          btnPrimary: 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-rose-500/30',
          accentText: 'text-rose-400'
        };
      case 'dark_luxury':
        return {
          border: 'border-slate-500/50',
          glowLeft: 'bg-amber-500/15',
          glowRight: 'bg-slate-400/20',
          badgeBg: 'bg-slate-700/50 text-amber-300 border-slate-600',
          btnPrimary: 'bg-gradient-to-r from-slate-100 to-amber-200 hover:from-white hover:to-amber-100 text-slate-950 font-black shadow-slate-900/50',
          accentText: 'text-amber-300'
        };
      case 'emerald':
      default:
        return {
          border: 'border-emerald-500/50',
          glowLeft: 'bg-emerald-500/25',
          glowRight: 'bg-teal-500/25',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          btnPrimary: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-emerald-500/30',
          accentText: 'text-emerald-400'
        };
    }
  };

  const theme = getThemeClasses(config.themeStyle);

  // Render Student Mode Banner if in student mode
  if (isStudentMode) {
    if (!isOpen || config.studentBannerActive === false) return null;
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl border border-emerald-500/50 text-white rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden shadow-emerald-950/60 my-auto space-y-4"
          >
            {/* Ambient Glows */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header Badge & Close */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1.5 shadow-xs">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>{config.studentBadgeText || '🎓 KUIS & LATIHAN SISWA INTERAKTIF'}</span>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700 active:scale-95"
                title="Tutup Banner Siswa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-2 text-center sm:text-left relative z-10">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {config.studentJudulBanner || 'SELAMAT DATANG DI KUIS SISWA 🚀'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                {config.studentSubJudulBanner || 'Selamat mengerjakan kuis dan latihan interaktif secara mandiri. Silakan tekan tombol di bawah untuk mulai mengerjakan kuis!'}
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                <span className="inline-flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-xl font-bold text-slate-300">
                  <School className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{activeMadrasahName}</span>
                </span>
                {studentTargetMapel && (
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-950/80 border border-emerald-600/50 px-3 py-1 rounded-xl font-extrabold text-emerald-300">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mapel: {studentTargetMapel}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 relative z-10">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer active:scale-95 border border-emerald-300/40"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{config.studentTombolUtamaText || '🎯 MULAI KERJAKAN KUIS'}</span>
              </button>

              {onOpenPinModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPinModal();
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mode Guru</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  const activeMadrasah = getActiveMadrasah();
  const kopSurat = loadKopSurat();
  const customOg = loadCustomOgImage();
  const bannerLogoSrc = config.gambarUrl || activeMadrasah?.logoUrl || kopSurat?.logoUrl || customOg || defaultOgBadgeImage;

  return (
    <AnimatePresence>
      {/* CENTERED MODAL OVERLAY */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`relative w-full max-w-2xl bg-slate-900/95 backdrop-blur-2xl border ${theme.border} text-white rounded-3xl sm:rounded-[28px] shadow-2xl overflow-hidden shadow-black/80 my-auto`}
        >
          {/* Animated Background Glows */}
          <div className={`absolute -top-32 -left-32 w-64 h-64 ${theme.glowLeft} rounded-full blur-3xl pointer-events-none`} />
          <div className={`absolute -bottom-32 -right-32 w-64 h-64 ${theme.glowRight} rounded-full blur-3xl pointer-events-none`} />

          {/* Banner Body */}
          <div className="p-3.5 sm:p-6 relative z-10 space-y-2.5 sm:space-y-3.5">
            {/* Top Control Bar */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 sm:pb-3">
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-y-1">
                <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 sm:px-3 sm:py-1 rounded-full ${theme.badgeBg} border flex items-center space-x-1 sm:space-x-1.5 shadow-xs`}>
                  <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-300 animate-spin-slow" />
                  <span>{config.kategoriBadge}</span>
                </span>

                <span className="text-[9px] sm:text-[11px] font-bold text-slate-300 bg-slate-800/90 border border-slate-700/80 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full flex items-center space-x-1">
                  <School className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[130px] sm:max-w-none">{activeMadrasahName}</span>
                </span>

                <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 bg-slate-800/90 border border-slate-700/80 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full flex items-center space-x-1">
                  <Calendar className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-teal-400" />
                  <span>TA: {activeTahunAjaran}</span>
                </span>
              </div>

              {/* Dismiss Control */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseToAdmin}
                  className="p-1 sm:p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer active:scale-95"
                  title="Tutup banner"
                >
                  <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Main Header & Dynamic Image / Logo Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-4 items-center">
              {/* Dynamic Circular Uploadable Logo */}
              <div className="md:col-span-4 flex justify-center">
                <div className="relative overflow-hidden rounded-full w-24 h-24 sm:w-32 sm:h-32 border-2 sm:border-3 border-emerald-400 bg-slate-900 shadow-2xl ring-2 sm:ring-4 ring-emerald-500/30 flex items-center justify-center p-1 sm:p-1.5 shrink-0 mx-auto">
                  <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center overflow-hidden p-0.5 shadow-inner">
                    <img
                      src={imgError ? defaultOgBadgeImage : bannerLogoSrc}
                      alt="Logo Banner Welcome"
                      className="w-full h-full object-cover rounded-full drop-shadow-md"
                      onError={() => {
                        setImgError(true);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="md:col-span-8 space-y-1 sm:space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-1.5 sm:space-x-2">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-400">
                    Halo, <strong className="text-white">{displayName}</strong>
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    !userSession ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                    isSuperAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {!userSession ? '👋 Tamu Madrasah' : isSuperAdmin ? '👑 Super Admin' : '🎓 Guru Madrasah'}
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
                  {config.judulBanner}
                </h2>

                <p className="text-[11px] sm:text-sm text-slate-300 font-medium leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {config.subJudulBanner}
                </p>
              </div>
            </div>

            {/* Motto Quote Card */}
            {config.mottoBanner && (
              <div className="bg-slate-800/90 border border-slate-700/80 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center space-x-2.5 sm:space-x-3 text-xs text-slate-200 shadow-inner">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/30 shrink-0 text-emerald-400">
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="italic font-semibold text-emerald-200/90 text-[11px] sm:text-sm leading-snug">
                  "{config.mottoBanner}"
                </p>
              </div>
            )}

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1 sm:pt-2">
              {config.tombolUtamaText && (
                <button
                  type="button"
                  onClick={() => handleActionClick(config.tombolUtamaAction)}
                  className={`${theme.btnPrimary} font-black py-2.5 px-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg`}
                >
                  <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{config.tombolUtamaText}</span>
                </button>
              )}

              {config.tombolSekunderText && (
                <button
                  type="button"
                  onClick={() => handleActionClick(config.tombolSekunderAction)}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 font-bold py-2.5 px-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                  <span>{config.tombolSekunderText}</span>
                </button>
              )}

              {config.tombolTersierText && (
                <button
                  type="button"
                  onClick={() => handleActionClick(config.tombolTersierAction)}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 font-bold py-2.5 px-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                  <span>{config.tombolTersierText}</span>
                </button>
              )}
            </div>

            {/* Bottom Action Bar: Tutup Banner */}
            <div className="pt-2 sm:pt-3 border-t border-slate-800/90 flex items-center justify-end">
              <button
                type="button"
                onClick={handleCloseToAdmin}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer border border-slate-700 active:scale-95 flex items-center justify-center space-x-1.5 shadow-md"
              >
                <span>Tutup Banner</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

    </AnimatePresence>
  );
};

