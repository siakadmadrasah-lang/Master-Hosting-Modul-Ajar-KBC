import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Signal } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full h-[100dvh] w-full bg-slate-100 text-slate-800 flex flex-col items-center justify-start overflow-hidden print:bg-white print:text-black print:h-auto print:min-h-0 print:overflow-visible">
      {/* Top Bar Controls for Mode Switching (Shown on Tablet & Desktop) */}
      <header className="hidden sm:flex w-full shrink-0 bg-white/95 border-b border-slate-200/90 backdrop-blur-xl px-4 py-2 items-center justify-between text-xs print:hidden z-50 shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs"></div>
          <span className="font-semibold text-slate-800 font-sans tracking-wide uppercase text-[11px]">
            MODUL AJAR BERBASIS CINTA (KBC) • JENJANG MI
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setIsPhoneFrame(true)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all text-xs font-bold ${
              isPhoneFrame
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60'
            }`}
            title="Tampilan Bingkai Android"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Frame Android</span>
          </button>
          <button
            onClick={() => setIsPhoneFrame(false)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all text-xs font-bold ${
              !isPhoneFrame
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60'
            }`}
            title="Tampilan Layar Penuh Responsive"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Layar Penuh</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 min-h-0 flex items-center justify-center p-0 sm:p-3 overflow-hidden print:p-0 print:block print:w-full">
        {isPhoneFrame ? (
          /* Phone Shell Frame */
          <div className="relative w-full max-w-[420px] h-full max-h-[860px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-[8px] border-slate-800 ring-1 ring-slate-300 flex flex-col overflow-hidden my-auto print:static print:h-auto print:max-w-none print:overflow-visible print:p-0 print:m-0 print:border-none print:rounded-none print:shadow-none print:bg-white">
            {/* Camera / Earpiece Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center space-x-2 print:hidden border-b border-slate-800/60">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700"></div>
              <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
            </div>

            {/* Android Status Bar */}
            <div className="w-full h-8 bg-slate-900 text-slate-100 text-[11px] px-6 flex items-center justify-between font-mono pt-1 select-none z-40 rounded-t-[32px] print:hidden border-b border-slate-800">
              <span className="text-emerald-400 font-bold">{currentTime}</span>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Signal className="w-3 h-3 text-emerald-400" />
                <Wifi className="w-3 h-3 text-emerald-400" />
                <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              </div>
            </div>

            {/* Inner App Canvas */}
            <div className="w-full flex-1 min-h-0 bg-slate-50 text-slate-900 flex flex-col overflow-hidden relative rounded-b-[32px] print:static print:overflow-visible print:bg-white print:text-black">
              {children}
            </div>

            {/* Android Navigation Pill Bar */}
            <div className="w-full h-4 bg-slate-900 flex items-center justify-center pb-1 print:hidden">
              <div className="w-28 h-1 bg-slate-600/80 rounded-full"></div>
            </div>
          </div>
        ) : (
          /* Fullscreen Responsive Container */
          <div className="w-full max-w-5xl h-full bg-slate-50 text-slate-900 sm:rounded-2xl shadow-xl border border-slate-200/90 flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:bg-white print:text-black print:min-h-0 print:overflow-visible print:static">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
