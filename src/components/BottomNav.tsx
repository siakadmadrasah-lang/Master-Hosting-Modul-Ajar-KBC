import React from 'react';
import { BookOpen, BookMarked, Users, PlusCircle, Sparkles, Settings } from 'lucide-react';
import { NavTabType } from './HeaderBar';

interface BottomNavProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'my-modules' as const, label: 'Modul Saya', icon: BookOpen },
    { id: 'materi' as const, label: 'Kelola Materi', icon: BookMarked },
    { id: 'teachers' as const, label: 'Daftar Guru', icon: Users },
    { id: 'create' as const, label: 'Buat Modul', icon: PlusCircle },
    { id: 'quiz' as const, label: 'Kuis & Media', icon: Sparkles }
  ];

  return (
    <nav className="shrink-0 w-full bg-white/95 border-t border-slate-200 backdrop-blur-xl px-2 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around select-none print:hidden shadow-xl z-40">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center justify-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all duration-200 cursor-pointer ${
              isActive
                ? 'text-emerald-700 font-black scale-105'
                : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            {isActive && (
              <span className="absolute inset-0 bg-emerald-50 border border-emerald-300/80 rounded-xl shadow-xs"></span>
            )}
            <Icon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 relative z-10 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight relative z-10 leading-none font-sans font-bold">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

