import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, Check, X } from 'lucide-react';

interface AnimatedToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'info' | 'warning';
}

export const AnimatedToast: React.FC<AnimatedToastProps> = ({
  message,
  onClose,
  duration = 3500,
  type = 'success'
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto max-w-[92vw] sm:max-w-md w-auto"
        >
          <div className="relative overflow-hidden bg-slate-950/95 text-white border border-emerald-500/80 rounded-2xl shadow-[0_12px_36px_-6px_rgba(16,185,129,0.45)] backdrop-blur-xl px-4 py-3 flex items-center gap-3">
            {/* Animated Glow Pulse */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent pointer-events-none" />

            {/* Animated Check Circle */}
            <div className="relative flex items-center justify-center shrink-0">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.05 }}
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md ring-2 ring-emerald-400/40"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
              </motion.div>
              <span className="absolute -inset-1 rounded-xl bg-emerald-400/30 animate-ping pointer-events-none opacity-40" />
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  Status: Berhasil Tersimpan
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-100 leading-snug break-words">
                {message}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Animated Progress Timer Bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
