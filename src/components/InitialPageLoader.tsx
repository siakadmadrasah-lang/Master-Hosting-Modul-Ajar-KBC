import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { loadCustomOgImage, getActiveMadrasah } from '../utils/storage';
import defaultAppLogo from '../assets/images/og_badge_jaenal_inside_1784949367744.jpg';

interface InitialPageLoaderProps {
  isLoading: boolean;
  onFinish?: () => void;
  madrasahName?: string;
  customLogoUrl?: string;
}

export const InitialPageLoader: React.FC<InitialPageLoaderProps> = ({
  isLoading,
  onFinish,
  madrasahName,
  customLogoUrl
}) => {
  const [progress, setProgress] = useState<number>(15);
  const [statusText, setStatusText] = useState<string>('Memulai sistem aplikasi...');
  const [resolvedLogo, setResolvedLogo] = useState<string>('/og-image-round.jpg');
  const [logoFallbackIndex, setLogoFallbackIndex] = useState<number>(0);

  useEffect(() => {
    // Prioritize the official application logo: custom OG image if set, else /og-image-round.jpg, else defaultAppLogo
    const customImg = customLogoUrl || loadCustomOgImage();
    if (customImg) {
      setResolvedLogo(customImg);
    } else {
      setResolvedLogo('/og-image-round.jpg');
    }
    setLogoFallbackIndex(0);
  }, [customLogoUrl]);

  const handleImageError = () => {
    if (logoFallbackIndex === 0) {
      // Try bundled app logo
      setResolvedLogo(defaultAppLogo);
      setLogoFallbackIndex(1);
    } else if (logoFallbackIndex === 1) {
      // Try alternative public path
      setResolvedLogo('/apple-touch-icon.png');
      setLogoFallbackIndex(2);
    } else {
      // Show vector badge
      setLogoFallbackIndex(3);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      setStatusText('Aplikasi siap digunakan');
      const timer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 400);
      return () => clearTimeout(timer);
    }

    const steps = [
      { p: 35, text: 'Memuat modul pembelajaran & kurikulum...' },
      { p: 65, text: 'Menyelaraskan data madrasah & guru...' },
      { p: 85, text: 'Menyiapkan asisten AI & media interaktif...' },
      { p: 98, text: 'Memvalidasi modul ajar berbasis cinta...' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStatusText(steps[currentStep].text);
        currentStep++;
      }
    }, 320);

    return () => clearInterval(interval);
  }, [isLoading, onFinish]);

  const activeName = madrasahName || getActiveMadrasah()?.nama || "MI Ma'arif NU 2 Sanggreman";

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          id="initial-page-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 text-white overflow-hidden select-none p-4"
        >
          {/* Animated Background Atmosphere */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Ambient Radial Glows */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.25, 0.45, 0.25],
                rotate: [0, 90, 180]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18)_0%,transparent_60%)]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.15, 0.35, 0.15],
                rotate: [180, 90, 0]
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute -bottom-1/4 -right-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_60%)]"
            />
            
            {/* Subtle Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
          </div>

          {/* Centered Main Content Card */}
          <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full text-center px-4">
            
            {/* Logo Emblem Container with Multi-layer Glow & Rings */}
            <div className="relative flex items-center justify-center mb-7 sm:mb-8">
              
              {/* Outer Rotating Dashed Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-emerald-500/30 border-dashed"
              />

              {/* Pulsing Aura Rings */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-400/20 to-cyan-500/25 blur-md"
              />

              <motion.div
                animate={{
                  scale: [1.1, 1.25, 1.1],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{
                  duration: 3.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.4
                }}
                className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-emerald-400/20 blur-xl"
              />

              {/* Central Logo Box - Application Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-b from-emerald-400/40 via-teal-500/20 to-emerald-900/60 backdrop-blur-xl border-2 border-emerald-400/50 shadow-2xl shadow-emerald-950/90 flex items-center justify-center overflow-hidden group"
              >
                {logoFallbackIndex < 3 ? (
                  <img
                    src={resolvedLogo}
                    alt="Logo Aplikasi Modul Ajar KBC"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                    className="w-full h-full object-cover rounded-full shadow-inner transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 flex flex-col items-center justify-center text-white shadow-inner">
                    <Heart className="w-10 h-10 text-emerald-200 fill-emerald-200 animate-pulse drop-shadow-md" />
                  </div>
                )}

                {/* Shimmer Light Sweep across Logo */}
                <motion.div
                  animate={{
                    x: ['-120%', '220%']
                  }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    repeatDelay: 1.2,
                    ease: 'easeInOut'
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-12 pointer-events-none"
                />
              </motion.div>

              {/* Floating Mini Badge Indicator */}
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-1 -right-0.5 bg-emerald-400 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-slate-950 flex items-center justify-center"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              </motion.div>
            </div>

            {/* Typography Section */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-1.5 mb-6"
            >
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-1">
                <Heart className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                <span>Kurikulum Berbasis Cinta</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                <span>MODUL AJAR KBC</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  PRO
                </span>
              </h1>

              <p className="text-sm font-medium text-emerald-200/90 truncate max-w-xs sm:max-w-sm mx-auto">
                {activeName}
              </p>

              <p className="text-[11px] text-slate-400 tracking-wide font-mono">
                Disusun oleh: <span className="text-emerald-400 font-semibold">Jaenal Maskun, S.Pd.I.</span>
              </p>
            </motion.div>

            {/* Smooth Progress Bar & Status Text */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 px-1 font-medium">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-2.5 h-2.5 rounded-full border-2 border-emerald-400 border-t-transparent"
                  />
                  <span className="truncate max-w-[220px] sm:max-w-[260px] text-left">
                    {statusText}
                  </span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {progress}%
                </span>
              </div>

              {/* Progress Track */}
              <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50 backdrop-blur-xs">
                <motion.div
                  initial={{ width: '10%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-sm shadow-emerald-500/50 relative"
                >
                  {/* Glow pip at the head of progress bar */}
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
                </motion.div>
              </div>
            </div>

            {/* Footer Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.4 }}
              className="mt-7 flex items-center justify-center gap-4 text-[11px] text-slate-400"
            >
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Terverifikasi KBC</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>Sinkronisasi Otomatis</span>
              </span>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
