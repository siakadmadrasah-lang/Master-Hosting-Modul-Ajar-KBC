import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ModulAjarCinta, KopSuratSettings, TTDSettings, MateriBankItem, TeacherItem, MadrasahItem, MAPEL_MI_OPTIONS } from './types';
import { SAMPLE_MODULES } from './data/sampleModules';
import {
  loadStoredModules,
  saveModules,
  loadKopSurat,
  saveKopSurat,
  loadTTD,
  saveTTD,
  loadApiKey,
  saveApiKey,
  loadStoredMateriBank,
  saveMateriBank,
  loadStoredTeachers,
  saveTeachers,
  loadCustomMapel,
  saveCustomMapel,
  addMasterMapel,
  deleteMasterMapel,
  loadMasterMapelList,
  loadDeletedMapel,
  loadDeletedMapelSet,
  isMapelDeleted,
  loadTeacherPin,
  loadCustomOgImage,
  loadActiveMadrasahId,
  saveActiveMadrasahId,
  getActiveMadrasah,
  loadActiveTahunAjaran,
  saveActiveTahunAjaran,
  loadSupabaseConfig,
  loadMysqlConfig
} from './utils/storage';
import { strictUrlEncode, sanitizeMapelKey } from './utils/mapelOgApi';
import { updateOpenGraphMeta, updateOgForModuleOrMapel } from './utils/metaHelper';
import {
  UserSession,
  TrialStatus,
  loadUserSession,
  getTrialStatus,
  logoutUser,
  isSuperAdminUser
} from './utils/auth';
import { pullCloudDataToLocal, pushLocalDataToCloud, subscribeToCloudDatabase, pullSuperAdminCredentialsFromCloud } from './utils/firebaseSync';
import { pullDataFromSupabase, pushDataToSupabase } from './utils/supabaseSync';
import { pullDataFromMysql } from './utils/mysqlSync';
import { AndroidFrame } from './components/AndroidFrame';
import { HeaderBar, NavTabType } from './components/HeaderBar';
import { BottomNav } from './components/BottomNav';
import { DocumentPrintView } from './components/DocumentPrintView';
import { GeneratorAIModal } from './components/GeneratorAIModal';
import { EditorManualWizard } from './components/EditorManualWizard';
import { QuizPlayer } from './components/QuizPlayer';
import { SettingsPanel } from './components/SettingsPanel';
import { MateriBankManager } from './components/MateriBankManager';
import { TeacherListManager } from './components/TeacherListManager';
import { MadrasahModal } from './components/MadrasahModal';
import { LoginModal } from './components/LoginModal';
import { OfficialRegisterModal } from './components/OfficialRegisterModal';
import { CurriculumLiteracyModal } from './components/CurriculumLiteracyModal';
import { WelcomeBanner } from './components/WelcomeBanner';
import { QuizResultsRecapModal } from './components/QuizResultsRecapModal';

import {
  Sparkles,
  Wand2,
  PenTool,
  BookOpen,
  Search,
  Printer,
  Trash2,
  Edit,
  Heart,
  Calendar,
  Layers,
  ChevronRight,
  HelpCircle,
  Plus,
  Users,
  Share2,
  Lock,
  Unlock,
  Copy,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Library,
  Compass,
  Languages,
  Calculator,
  FileText,
  GraduationCap,
  BookMarked,
  ArrowLeft,
  X,
  CheckCircle,
  Send,
  MessageCircle,
  User
} from 'lucide-react';

const getMapelMeta = (mapel: string) => {
  const norm = mapel.toLowerCase().trim();
  if (norm.includes('akidah') || norm.includes('akhlak')) {
    return { icon: Heart, bg: 'bg-rose-50 text-rose-600 border-rose-200', activeBg: 'bg-rose-600 text-white' };
  }
  if (norm.includes('fiqih') || norm.includes('fiq')) {
    return { icon: Library, bg: 'bg-amber-50 text-amber-700 border-amber-200', activeBg: 'bg-amber-600 text-white' };
  }
  if (norm.includes('qur\'an') || norm.includes('quran') || norm.includes('hadis') || norm.includes('hadits')) {
    return { icon: BookOpen, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', activeBg: 'bg-emerald-600 text-white' };
  }
  if (norm.includes('sejarah') || norm.includes('ski')) {
    return { icon: Compass, bg: 'bg-purple-50 text-purple-700 border-purple-200', activeBg: 'bg-purple-600 text-white' };
  }
  if (norm.includes('arab')) {
    return { icon: Languages, bg: 'bg-teal-50 text-teal-700 border-teal-200', activeBg: 'bg-teal-600 text-white' };
  }
  if (norm.includes('matematika') || norm.includes('math')) {
    return { icon: Calculator, bg: 'bg-blue-50 text-blue-700 border-blue-200', activeBg: 'bg-blue-600 text-white' };
  }
  if (norm.includes('indonesia')) {
    return { icon: FileText, bg: 'bg-red-50 text-red-700 border-red-200', activeBg: 'bg-red-600 text-white' };
  }
  if (norm.includes('pancasila') || norm.includes('pkn')) {
    return { icon: GraduationCap, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', activeBg: 'bg-indigo-600 text-white' };
  }
  if (norm.includes('ipas') || norm.includes('ipa') || norm.includes('ips')) {
    return { icon: Sparkles, bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', activeBg: 'bg-cyan-600 text-white' };
  }
  if (norm === 'semua') {
    return { icon: Layers, bg: 'bg-slate-100 text-slate-700 border-slate-200', activeBg: 'bg-slate-900 text-white' };
  }
  return { icon: BookMarked, bg: 'bg-slate-50 text-slate-700 border-slate-200', activeBg: 'bg-emerald-600 text-white' };
};

export default function App() {
  const [activeMadrasahId, setActiveMadrasahId] = useState<string>(loadActiveMadrasahId());
  const [activeMadrasah, setActiveMadrasah] = useState<MadrasahItem>(getActiveMadrasah());
  const [showMadrasahModal, setShowMadrasahModal] = useState<boolean>(false);

  // User Auth & Trial States
  const [userSession, setUserSession] = useState<UserSession | null>(() => loadUserSession());
  const [trialStatus, setTrialStatus] = useState<TrialStatus>(() => getTrialStatus());
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showOfficialRegisterModal, setShowOfficialRegisterModal] = useState<boolean>(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState<boolean>(() => !loadUserSession());

  const [modules, setModules] = useState<ModulAjarCinta[]>([]);
  const [kopSurat, setKopSurat] = useState<KopSuratSettings>(loadKopSurat());
  const [ttd, setTtd] = useState<TTDSettings>(loadTTD());
  const [apiKey, setApiKey] = useState<string>(loadApiKey());
  const [materiList, setMateriList] = useState<MateriBankItem[]>(loadStoredMateriBank());
  const [teachers, setTeachers] = useState<TeacherItem[]>(loadStoredTeachers());
  const [customMapel, setCustomMapel] = useState<string[]>(loadCustomMapel());
  const [activeTahunAjaran, setActiveTahunAjaran] = useState<string>(() => loadActiveTahunAjaran());

  const [activeTab, setActiveTab] = useState<NavTabType>('my-modules');
  const [selectedModule, setSelectedModule] = useState<ModulAjarCinta | null>(null);

  // Student Mode State
  const [isStudentMode, setIsStudentMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'siswa' || params.get('student') === 'true';
    }
    return false;
  });
  const [toastMsg, setToastMsg] = useState<string>('');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');

  // Modals state
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showManualWizard, setShowManualWizard] = useState<boolean>(false);
  const [showLiteracyModal, setShowLiteracyModal] = useState<boolean>(false);
  const [showQuizRecapModal, setShowQuizRecapModal] = useState<boolean>(false);
  const [editingModule, setEditingModule] = useState<ModulAjarCinta | null>(null);
  const [selectedBankMateri, setSelectedBankMateri] = useState<MateriBankItem | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState<string>('Semua');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('Semua');
  const [selectedMapelModal, setSelectedMapelModal] = useState<string | null>(null);
  const [modalModuleSearch, setModalModuleSearch] = useState<string>('');

  const moduleListSectionRef = useRef<HTMLDivElement>(null);

  const allMapelOptions = useMemo(() => {
    const masterList = loadMasterMapelList();
    const deletedSet = loadDeletedMapelSet();
    const setMapel = new Set<string>(masterList);

    (customMapel || []).forEach(m => { if (m) setMapel.add(m); });
    (modules || []).forEach(m => {
      if (m.identitas?.mataPelajaran) setMapel.add(m.identitas.mataPelajaran);
    });

    return Array.from(setMapel).filter(m => Boolean(m) && !isMapelDeleted(m, deletedSet));
  }, [customMapel, modules]);

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    setShowLoginModal(false);
    setShowWelcomeBanner(false);
    if (session.role === 'guru' && session.namaLengkap) {
      setSelectedTeacherFilter(session.namaLengkap);
    } else {
      setSelectedTeacherFilter('Semua');
    }
    if (isSuperAdminUser(session)) {
      pullSuperAdminCredentialsFromCloud().then(() => {
        setApiKey(loadApiKey());
        handleReloadAllData();
      }).catch(() => {
        setApiKey(loadApiKey());
        handleReloadAllData();
      });
    } else {
      setApiKey(loadApiKey());
      handleReloadAllData();
    }
    const status = getTrialStatus();
    setTrialStatus(status);
    if (status.isExpired && !status.isRegisteredOfficial) {
      setShowOfficialRegisterModal(true);
    } else {
      setToastMsg(`Selamat datang, ${session.namaLengkap}! Akses sistem aktif (${session.role === 'guru' ? 'Akun Guru' : 'Akun Administrator'}).`);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUserSession(null);
    setApiKey('');
    setShowLoginModal(true);
  };

  const handleOfficialRegisterSuccess = (newMadrasahId: string, namaMadrasah: string) => {
    setShowOfficialRegisterModal(false);
    handleSelectMadrasah(newMadrasahId);
    const updatedSession = loadUserSession();
    if (updatedSession) setUserSession(updatedSession);
    setTrialStatus(getTrialStatus());
    setToastMsg(`Madrasah "${namaMadrasah}" berhasil terdaftar secara resmi!`);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const handleCopyStudentLink = (modulId?: string) => {
    const targetId = modulId || selectedModule?.id || '';
    const matchedModule = modules.find(m => m.id === targetId) || selectedModule;
    const mapel = matchedModule?.identitas?.mataPelajaran || '';
    const cleanMapelKey = mapel ? sanitizeMapelKey(mapel) : '';
    const v = Date.now();
    const baseUrl = `${window.location.origin}${window.location.pathname}`;

    const studentUrl = `${baseUrl}?mode=siswa${targetId ? `&moduleId=${strictUrlEncode(targetId)}` : ''}${cleanMapelKey ? `&mapel=${cleanMapelKey}` : ''}&v=${v}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(studentUrl).then(() => {
        setToastMsg('Link Kuis Siswa Berhasil Disalin! Dashboard Guru Tetap Terproteksi.');
        setTimeout(() => setToastMsg(''), 4000);
      }).catch(() => {
        prompt('Salin link kuis khusus siswa berikut:', studentUrl);
      });
    } else {
      prompt('Salin link kuis khusus siswa berikut:', studentUrl);
    }
  };

  const handleShareWA = (modul: ModulAjarCinta, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetId = modul.id;
    const mapel = modul.identitas?.mataPelajaran || 'Mata Pelajaran';
    const cleanMapelKey = mapel ? sanitizeMapelKey(mapel) : '';
    const v = Date.now();
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const studentUrl = `${baseUrl}?mode=siswa${targetId ? `&moduleId=${strictUrlEncode(targetId)}` : ''}${cleanMapelKey ? `&mapel=${cleanMapelKey}` : ''}&v=${v}`;
    
    const text = `Assalamualaikum Wr. Wb.\n\nAnanda Siswa/Siswi, berikut Link Kuis Interaktif:\n📚 *Mata Pelajaran:* ${mapel}\n🏷️ *Materi:* ${modul.identitas?.materi || modul.judul}\n🏫 *Kelas:* ${modul.identitas?.faseKelas || '-'}\n\nSilakan klik link berikut untuk pengerjaan kuis:\n👉 ${studentUrl}\n\nSelamat mengerjakan! 🚀`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleUnlockTeacherMode = () => {
    const activePin = loadTeacherPin();
    if (pinInput.trim() === activePin) {
      setIsStudentMode(false);
      setShowPinModal(false);
      setPinInput('');
      window.history.pushState({}, '', window.location.pathname);
    } else {
      alert(`PIN Guru Salah! Silakan coba lagi. Silakan periksa PIN di Pengaturan.`);
    }
  };

  const handleReloadAllData = () => {
    const freshModules = loadStoredModules();
    setModules(freshModules);
    setKopSurat(loadKopSurat());
    setTtd(loadTTD());
    setApiKey(loadApiKey());
    setMateriList(loadStoredMateriBank());
    setTeachers(loadStoredTeachers());
    setCustomMapel(loadCustomMapel());
    setActiveTahunAjaran(loadActiveTahunAjaran());

    if (freshModules.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const modIdParam = params.get('moduleId');
      const mapelParam = params.get('mapel');

      setSelectedModule(prev => {
        if (modIdParam) {
          const matchedById = freshModules.find(m => m.id === modIdParam);
          if (matchedById) return matchedById;
        }
        if (mapelParam) {
          const decodedMapel = decodeURIComponent(mapelParam).trim().toLowerCase();
          const matchedByMapel = freshModules.find(m =>
            m.identitas?.mataPelajaran?.toLowerCase().trim() === decodedMapel ||
            m.identitas?.mataPelajaran?.toLowerCase().includes(decodedMapel) ||
            decodedMapel.includes(m.identitas?.mataPelajaran?.toLowerCase() || '')
          );
          if (matchedByMapel) return matchedByMapel;
        }
        if (!prev) return null;
        const matched = freshModules.find(m => m.id === prev.id);
        return matched || null;
      });
    }
  };

  const handleSaveActiveTahunAjaran = (newTahun: string) => {
    setActiveTahunAjaran(newTahun);
    saveActiveTahunAjaran(newTahun);
    pushLocalDataToCloud().catch(err => console.error('Cloud push error on year save:', err));
    setToastMsg(`📅 Tahun Ajaran "${newTahun}" berhasil disimpan sebagai aktif!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSaveTeachers = (newList: TeacherItem[]) => {
    setTeachers(newList);
    saveTeachers(newList);
  };

  const handleAddCustomMapel = (mapel: string) => {
    addMasterMapel(mapel);
    setCustomMapel(loadCustomMapel());
  };

  const handleSaveMateriList = (newList: MateriBankItem[]) => {
    setMateriList(newList);
    saveMateriBank(newList);
  };

  const handleSelectMateriForModule = (materiItem: MateriBankItem, mode: 'AI' | 'MANUAL') => {
    setSelectedBankMateri(materiItem);
    if (mode === 'AI') {
      setShowAiModal(true);
    } else {
      setEditingModule(null);
      setShowManualWizard(true);
    }
  };

  const handleSelectMadrasah = (newId: string) => {
    saveActiveMadrasahId(newId);
    setActiveMadrasahId(newId);
    const updatedM = getActiveMadrasah();
    setActiveMadrasah(updatedM);
    setShowMadrasahModal(false);
    setToastMsg(`Beralih ke Madrasah: "${updatedM.nama}"`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Dynamically update document head Open Graph metadata & og:image when selected module changes
  useEffect(() => {
    updateOgForModuleOrMapel(selectedModule);
  }, [selectedModule]);

  useEffect(() => {
    const loaded = loadStoredModules();
    setModules(loaded);

    // Reload all data for the active madrasah
    handleReloadAllData();

    // Sync Favicon and Open Graph Image in document head
    const customImg = loadCustomOgImage();
    const faviconTarget = customImg || '/og-image-round.jpg';
    const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel='apple-touch-icon']");
    iconLinks.forEach((link) => {
      link.href = faviconTarget;
    });

    // Read URL Parameters for Student Mode
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const modIdParam = params.get('moduleId') || params.get('id');
    const mapelParam = params.get('mapel');

    if (modeParam === 'siswa' || params.get('student') === 'true') {
      setIsStudentMode(true);
      
      let targetModule: ModulAjarCinta | null = null;
      if (modIdParam) {
        targetModule = loaded.find(m => m.id === modIdParam) || null;
      }

      if (!targetModule && mapelParam) {
        const decodedMapel = decodeURIComponent(mapelParam).trim().toLowerCase();
        targetModule = loaded.find(m => 
          m.identitas?.mataPelajaran?.toLowerCase().trim() === decodedMapel ||
          m.identitas?.mataPelajaran?.toLowerCase().includes(decodedMapel) ||
          decodedMapel.includes(m.identitas?.mataPelajaran?.toLowerCase() || '')
        ) || null;
      }

      if (!targetModule && loaded.length > 0) {
        targetModule = loaded[0];
      }

      if (targetModule) {
        setSelectedModule(targetModule);
      }

      // Canonicalize address bar URL so it always uses clean, valid mapel key (no spaces)
      const rawMapel = mapelParam ? (targetModule?.identitas?.mataPelajaran || mapelParam) : '';
      const cleanMapelKey = rawMapel ? sanitizeMapelKey(rawMapel) : '';
      const cleanModId = targetModule?.id || modIdParam || '';
      const vVal = params.get('v') || Date.now();
      const canonicalUrl = `${window.location.pathname}?mode=siswa${cleanModId ? `&moduleId=${strictUrlEncode(cleanModId)}` : ''}${cleanMapelKey ? `&mapel=${cleanMapelKey}` : ''}&v=${vVal}`;
      try {
        window.history.replaceState({}, '', canonicalUrl);
      } catch {}
    }

    // Pull latest data from Cloud Database (Firestore & Supabase) for active madrasah
    const syncAllCloudSources = async () => {
      const currentSession = loadUserSession();
      if (isSuperAdminUser(currentSession)) {
        try {
          await pullSuperAdminCredentialsFromCloud();
          setApiKey(loadApiKey());
        } catch (err) {
          console.warn('Superadmin cloud pull error:', err);
        }
      }

      try {
        await pullCloudDataToLocal();
        handleReloadAllData();
      } catch (err) {
        console.error('Cloud pull initial error:', err);
      }

      const supConfig = loadSupabaseConfig();
      if (supConfig.isEnabled && supConfig.supabaseUrl && supConfig.supabaseAnonKey) {
        try {
          const res = await pullDataFromSupabase(supConfig);
          if (res.success) {
            handleReloadAllData();
            console.log('✅ Synchronized latest data from Supabase!');
          }
        } catch (err) {
          console.error('Supabase pull initial error:', err);
        }
      }

      const mysqlCfg = loadMysqlConfig();
      if (mysqlCfg.isEnabled !== false && mysqlCfg.host && mysqlCfg.user && mysqlCfg.database) {
        try {
          const res = await pullDataFromMysql(mysqlCfg);
          if (res.success) {
            handleReloadAllData();
            console.log('✅ Synchronized latest data from MySQL!');
          }
        } catch (err) {
          console.error('MySQL pull initial error:', err);
        }
      }
    };

    syncAllCloudSources();

    const unsubscribe = subscribeToCloudDatabase(() => {
      handleReloadAllData();
    });

    const handleFocus = () => {
      syncAllCloudSources();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeMadrasahId]);

  const handleSaveModulesList = (newModules: ModulAjarCinta[]) => {
    setModules(newModules);
    saveModules(newModules);
  };

  const handleSaveKopSurat = (newKop: KopSuratSettings) => {
    setKopSurat(newKop);
    saveKopSurat(newKop);
    // Update existing modules with new Kop
    const updatedModules = modules.map(m => ({ ...m, kopSurat: newKop }));
    handleSaveModulesList(updatedModules);
  };

  const handleSaveTTD = (newTTD: TTDSettings) => {
    setTtd(newTTD);
    saveTTD(newTTD);
    // Update existing modules with new TTD
    const updatedModules = modules.map(m => ({ ...m, ttd: newTTD }));
    handleSaveModulesList(updatedModules);
  };

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    saveApiKey(newKey);
  };

  const handleCreateAiSuccess = (newModul: ModulAjarCinta) => {
    const updated = [newModul, ...modules];
    handleSaveModulesList(updated);
    setShowAiModal(false);
    setActiveTab('my-modules');
    setSelectedModule(newModul);
    setToastMsg(`🎉 Modul Ajar AI "${newModul.identitas?.materi || newModul.judul}" berhasil dibuat dan disimpan!`);
    setTimeout(() => setToastMsg(''), 5000);

    // Push immediately to cloud sync
    pushLocalDataToCloud().catch(err => console.error('Cloud push error:', err));
    const supCfg = loadSupabaseConfig();
    if (supCfg.isEnabled && supCfg.supabaseUrl && supCfg.supabaseAnonKey) {
      pushDataToSupabase(supCfg).catch(err => console.error('Supabase push error:', err));
    }
  };

  const handleSaveSingleModule = (updatedModul: ModulAjarCinta) => {
    const existsIndex = modules.findIndex(m => m.id === updatedModul.id);
    let updatedList: ModulAjarCinta[];
    if (existsIndex >= 0) {
      updatedList = [...modules];
      updatedList[existsIndex] = updatedModul;
    } else {
      updatedList = [updatedModul, ...modules];
    }
    handleSaveModulesList(updatedList);
    setSelectedModule(updatedModul);
    setToastMsg(`💾 Modul Ajar "${updatedModul.identitas?.materi || updatedModul.judul}" berhasil disimpan!`);
    setTimeout(() => setToastMsg(''), 4000);

    pushLocalDataToCloud().catch(err => console.error('Cloud push error:', err));
    const supCfg = loadSupabaseConfig();
    if (supCfg.isEnabled && supCfg.supabaseUrl && supCfg.supabaseAnonKey) {
      pushDataToSupabase(supCfg).catch(err => console.error('Supabase push error:', err));
    }
  };

  const handleSaveManualSuccess = (savedModul: ModulAjarCinta) => {
    const existsIndex = modules.findIndex(m => m.id === savedModul.id);
    let updated: ModulAjarCinta[];
    if (existsIndex >= 0) {
      updated = [...modules];
      updated[existsIndex] = savedModul;
    } else {
      updated = [savedModul, ...modules];
    }
    handleSaveModulesList(updated);
    setShowManualWizard(false);
    setEditingModule(null);
    setActiveTab('my-modules');
    setSelectedModule(savedModul);
    setToastMsg(`💾 Modul Ajar "${savedModul.identitas?.materi || savedModul.judul}" berhasil disimpan ke Database!`);
    setTimeout(() => setToastMsg(''), 5000);

    pushLocalDataToCloud().catch(err => console.error('Cloud push error:', err));
    const supCfg = loadSupabaseConfig();
    if (supCfg.isEnabled && supCfg.supabaseUrl && supCfg.supabaseAnonKey) {
      pushDataToSupabase(supCfg).catch(err => console.error('Supabase push error:', err));
    }
  };

  const handleDeleteCustomMapel = (mapel: string) => {
    deleteMasterMapel(mapel);
    setCustomMapel(loadCustomMapel());
  };

  const [moduleToDelete, setModuleToDelete] = useState<ModulAjarCinta | null>(null);

  const isTeacherRole = userSession?.role === 'guru';

  const isMyTeacherModule = (m: ModulAjarCinta): boolean => {
    if (!isTeacherRole) return true; // Admin/superadmin owns everything
    const currentName = (userSession?.namaLengkap || '').toLowerCase().trim();
    const currentNip = (userSession?.nip || '').trim();
    const penyusun = (m.penyusun || '').toLowerCase().trim();
    const guruPengampu = (m.guruPengampu || '').toLowerCase().trim();
    const ttdGuru = (m.ttd?.guruKelasNama || '').toLowerCase().trim();
    const ttdNip = (m.ttd?.guruKelasNIP || '').trim();

    return (
      (currentName && (penyusun === currentName || guruPengampu === currentName || ttdGuru === currentName)) ||
      (currentNip && ttdNip === currentNip)
    );
  };

  const handleDuplicateModule = (targetModul: ModulAjarCinta, e: React.MouseEvent) => {
    e.stopPropagation();
    const teacherName = userSession?.namaLengkap || 'Guru Pengampu';
    const teacherNip = userSession?.nip || '';
    const newId = `modul-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const cloned: ModulAjarCinta = {
      ...targetModul,
      id: newId,
      judul: `${targetModul.judul} (Salinan ${teacherName})`,
      penyusun: teacherName,
      guruPengampu: teacherName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ttd: {
        ...targetModul.ttd,
        guruKelasNama: teacherName,
        guruKelasNIP: teacherNip || targetModul.ttd?.guruKelasNIP || ''
      }
    };
    const updated = [cloned, ...modules];
    handleSaveModulesList(updated);
    setSelectedModule(cloned);
    setToastMsg(`✓ Modul berhasil diduplikasi ke koleksi Anda (${teacherName})!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleDeleteModuleClick = (m: ModulAjarCinta, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTeacherRole && !isMyTeacherModule(m)) {
      setToastMsg(`⚠️ Modul ini disusun oleh guru lain (${m.penyusun || 'Madrasah'}). Anda hanya dapat menghapus modul milik Anda sendiri.`);
      setTimeout(() => setToastMsg(''), 5000);
      return;
    }
    setModuleToDelete(m);
  };

  const handleConfirmDeleteModule = () => {
    if (!moduleToDelete) return;
    const updated = modules.filter(m => m.id !== moduleToDelete.id);
    handleSaveModulesList(updated);
    if (selectedModule?.id === moduleToDelete.id) {
      setSelectedModule(updated.length > 0 ? updated[0] : null);
    }
    setModuleToDelete(null);
  };

  // Filter modules
  const filteredModules = modules.filter(m => {
    const matchesSearch =
      m.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.identitas.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.identitas.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.penyusun && m.penyusun.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.guruPengampu && m.guruPengampu.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMapel =
      selectedMapelFilter === 'Semua' || m.identitas.mataPelajaran === selectedMapelFilter;
    const matchesTeacher =
      selectedTeacherFilter === 'Semua' ||
      m.penyusun === selectedTeacherFilter ||
      m.guruPengampu === selectedTeacherFilter;
    return matchesSearch && matchesMapel && matchesTeacher;
  });

  // STUDENT MODE VIEW (Restricted to Quiz & Digital Media only)
  if (isStudentMode) {
    const urlParams = new URLSearchParams(window.location.search);
    const studentModIdParam = urlParams.get('moduleId') || urlParams.get('id') || '';
    const sharedMapelParam = urlParams.get('mapel') ? decodeURIComponent(urlParams.get('mapel')!).trim() : '';
    const studentTargetMapel = sharedMapelParam || (selectedModule?.identitas?.mataPelajaran || '');

    let studentFilteredModules = modules;
    if (studentModIdParam) {
      const match = modules.filter(m => m.id === studentModIdParam);
      if (match.length > 0) {
        studentFilteredModules = match;
      }
    } else if (studentTargetMapel) {
      const match = modules.filter(m => 
        m.identitas?.mataPelajaran?.toLowerCase().trim() === studentTargetMapel.toLowerCase() ||
        m.identitas?.mataPelajaran?.toLowerCase().includes(studentTargetMapel.toLowerCase()) ||
        studentTargetMapel.toLowerCase().includes(m.identitas?.mataPelajaran?.toLowerCase() || '')
      );
      if (match.length > 0) {
        studentFilteredModules = match;
      }
    }

    const availableStudentModules = studentFilteredModules.length > 0 ? studentFilteredModules : modules;

    return (
      <AndroidFrame>
        <div className="w-full flex-1 flex flex-col overflow-hidden bg-slate-900 text-slate-100 relative">
          {/* Distinct Student Welcome Banner */}
          <WelcomeBanner
            isOpen={showWelcomeBanner}
            onClose={() => setShowWelcomeBanner(false)}
            isStudentMode={true}
            studentTargetMapel={studentTargetMapel}
            activeMadrasahName={activeMadrasah.nama}
            activeTahunAjaran={activeTahunAjaran}
            onOpenPinModal={() => setShowPinModal(true)}
            userSession={null}
          />

          {/* Top Bar Student Mode */}
          <header className="bg-slate-950 border-b border-emerald-900/80 px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center border border-emerald-500 shadow-xs">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xs sm:text-sm font-black text-emerald-400 tracking-tight">
                    MODE SISWA - KUIS & MEDIA DIGITAL
                  </h1>
                  <span className="bg-emerald-950 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full border border-emerald-800 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span className="hidden sm:inline">Dashboard Guru Terproteksi</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium flex items-center space-x-1.5 flex-wrap">
                  <span>MI Ma'arif NU 2 Sanggreman</span>
                  {studentTargetMapel && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-300 font-extrabold bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-800/80">
                        Mapel: {studentTargetMapel}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {availableStudentModules.length > 1 && (
                <select
                  value={selectedModule?.id || ''}
                  onChange={e => {
                    const found = availableStudentModules.find(m => m.id === e.target.value);
                    if (found) setSelectedModule(found);
                  }}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 max-w-[140px] sm:max-w-xs truncate"
                >
                  {availableStudentModules.map((m, idx) => (
                    <option key={`${m.id}-${idx}`} value={m.id}>
                      {m.identitas.mataPelajaran}: {m.judul}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setShowPinModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-bold flex items-center space-x-1.5 transition-all shrink-0"
                title="Buka Dashboard Guru"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Mode Guru</span>
              </button>
            </div>
          </header>

          {/* Main Quiz Area for Student */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {selectedModule ? (
              <QuizPlayer
                media={selectedModule.assesmen.mediaDigital}
                judulModul={selectedModule.judul}
                selectedModule={selectedModule}
                allModules={availableStudentModules}
                onSelectModule={setSelectedModule}
                onUpdateModule={handleSaveSingleModule}
                apiKey={apiKey}
                isStudentMode={true}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-400 text-xs">
                Belum ada kuis yang tersedia. Silakan hubungi Guru Anda.
              </div>
            )}
          </div>

          {/* PIN Modal to exit Student Mode */}
          {showPinModal && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Buka Dashboard Guru</h3>
                  <p className="text-xs text-slate-400 mt-1">Masukkan PIN untuk membuka akses lengkap guru.</p>
                </div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="PIN Guru..."
                  className="w-full bg-slate-950 border border-slate-700 text-center text-sm tracking-widest text-white rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowPinModal(false);
                      setPinInput('');
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleUnlockTeacherMode}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl"
                  >
                    Buka Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AndroidFrame>
    );
  }

  return (
    <AndroidFrame>
      <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-950 text-slate-100 relative">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-emerald-500 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-bold animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Top App Header Bar */}
        <HeaderBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeMadrasahName={activeMadrasah.nama}
          userSession={userSession}
          trialStatus={trialStatus}
          onLogout={handleLogout}
          onOpenOfficialRegister={() => setShowOfficialRegisterModal(true)}
          onOpenWelcomeBanner={() => setShowWelcomeBanner(true)}
          onOpenLoginModal={() => setShowLoginModal(true)}
          onOpenQuizRecap={() => setShowQuizRecapModal(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative bg-slate-50 text-slate-800">
          {/* TAB 1: MODUL SAYA (Home Dashboard) */}
          {activeTab === 'my-modules' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Clean Modern Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-900 text-white p-5 sm:p-6 space-y-4 shadow-xl border border-emerald-600/30">
                <div className="absolute -right-8 -bottom-8 text-white/10 pointer-events-none">
                  <Heart className="w-56 h-56 fill-current animate-pulse" />
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="inline-flex items-center space-x-1.5 bg-white/15 text-white text-[10px] px-3.5 py-1 rounded-full font-black border border-white/20 backdrop-blur-md shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                    <span className="font-sans tracking-wide">KURIKULUM BERBASIS CINTA (KBC)</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] bg-slate-900/60 text-emerald-200 border border-white/20 px-2.5 py-0.5 rounded-md font-sans font-bold backdrop-blur-md">
                    <span>Dev: Jaenal Maskun, S.Pd.I.</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-base sm:text-xl font-black leading-snug tracking-tight text-white drop-shadow-xs">
                    Penyusun Modul Ajar Terstruktur & Komprehensif
                  </h2>
                  <p className="text-[11px] text-emerald-100 leading-relaxed max-w-lg font-medium mt-1">
                    Buat Modul Ajar KBC 7 seksi lengkap dengan Kop Surat resmi, Penandatangan TTD, LKPD, serta Kuis & Visual Interaktif.
                  </p>
                </div>

                {/* Dashboard Micro Stats */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-white/15 text-center font-sans">
                  <div className="bg-white/10 rounded-2xl p-2 border border-white/15 backdrop-blur-xs">
                    <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">Total</p>
                    <p className="text-sm font-black text-white">{modules.length}</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2 border border-white/15 backdrop-blur-xs">
                    <p className="text-[9px] text-amber-300 font-bold uppercase tracking-wider">Modul AI</p>
                    <p className="text-sm font-black text-amber-300">{modules.filter(m => m.modeBuat === 'AI').length}</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2 border border-white/15 backdrop-blur-xs">
                    <p className="text-[9px] text-cyan-200 font-bold uppercase tracking-wider">Manual</p>
                    <p className="text-sm font-black text-cyan-200">{modules.filter(m => m.modeBuat === 'MANUAL').length}</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2 border border-white/15 backdrop-blur-xs">
                    <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">Materi</p>
                    <p className="text-sm font-black text-white">{materiList.length}</p>
                  </div>
                </div>

                {/* Two Main Creation Choice Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="relative overflow-hidden bg-white text-emerald-900 hover:bg-emerald-50 p-3 rounded-2xl flex items-center space-x-2.5 text-xs font-black transition-all shadow-md group border border-white/40"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-300 text-emerald-800 shadow-xs">
                      <Wand2 className="w-4 h-4 text-emerald-700 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div className="text-left">
                      <p className="leading-none text-emerald-950 font-black">Mode 1: Generasi AI</p>
                      <span className="text-[9px] font-extrabold text-emerald-700">Otomatis & Super Cepat</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setEditingModule(null);
                      setShowManualWizard(true);
                    }}
                    className="bg-emerald-950/40 hover:bg-emerald-950/60 text-white p-3 rounded-2xl border border-white/20 backdrop-blur-md flex items-center space-x-2.5 text-xs font-bold transition-all shadow-md group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                      <PenTool className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left">
                      <p className="leading-none text-white font-bold">Mode 2: Input Manual</p>
                      <span className="text-[9px] font-medium text-emerald-100">Wizard 7 Seksi</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Eye-Catching Curriculum Literacy Banner Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white p-4.5 sm:p-5 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 group">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-start space-x-3.5 z-10">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-emerald-400 p-0.5 shrink-0 shadow-lg mt-0.5">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-amber-300 fill-amber-300" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-black border border-amber-400/30 backdrop-blur-xs flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>STANDAR REGULASI & KARAKTER</span>
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border border-emerald-400/30">
                        KMA 450 / 2024
                      </span>
                    </div>
                    <h3 className="font-black text-sm sm:text-base text-white mt-1 leading-snug">
                      Pusat Literasi Kurikulum Merdeka & KBC
                    </h3>
                    <p className="text-[11px] text-emerald-100/90 mt-0.5 leading-relaxed max-w-xl font-medium">
                      Pelajari filosofi Kurikulum Berbasis Cinta (KBC), 4 Pilar Kasih Sayang, Standar CP/ATP, dan struktur 7 Seksi Modul Ajar.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowLiteracyModal(true)}
                  className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-lg border border-emerald-300/40 flex items-center justify-center space-x-2 transition-all hover:scale-102 group z-10"
                >
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span>Buka Referensi Kurikulum</span>
                  <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Grid Ikon Kategori Mapel ATAU Dedicated Subject Dashboard Banner */}
              {selectedMapelFilter === 'Semua' ? (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                        <Layers className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900">
                          Kategori Mata Pelajaran ({allMapelOptions.length} Mapel)
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Pilih mata pelajaran untuk langsung masuk ke halaman daftar modulnya
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {['Semua', ...allMapelOptions].map((mapel, idx) => {
                      const isSelected = selectedMapelFilter === mapel;
                      const meta = getMapelMeta(mapel);
                      const IconComp = meta.icon;
                      const count = mapel === 'Semua'
                        ? modules.length
                        : modules.filter(m => m.identitas?.mataPelajaran?.toLowerCase().trim() === mapel.toLowerCase().trim() || m.identitas?.mataPelajaran?.toLowerCase().includes(mapel.toLowerCase())).length;

                      return (
                        <div
                          key={`${mapel}-${idx}`}
                          onClick={() => {
                            if (mapel === 'Semua') {
                              setSelectedMapelFilter('Semua');
                              setSelectedMapelModal(null);
                            } else {
                              setSelectedMapelModal(mapel);
                              setModalModuleSearch('');
                            }
                          }}
                          className={`relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center space-x-2.5 group ${
                            isSelected
                              ? 'bg-slate-900 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30 -translate-y-0.5'
                              : 'bg-slate-50/80 hover:bg-emerald-50/60 border-slate-200/90 hover:border-emerald-400 text-slate-800 shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
                            isSelected ? meta.activeBg : meta.bg
                          }`}>
                            <IconComp className="w-4.5 h-4.5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-bold leading-tight truncate ${
                              isSelected ? 'text-white' : 'text-slate-900 group-hover:text-emerald-950'
                            }`}>
                              {mapel}
                            </h4>
                            <p className={`text-[10px] font-semibold mt-0.5 truncate ${
                              isSelected ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-700'
                            }`}>
                              {count} Modul
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-emerald-500/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMapelFilter('Semua')}
                      className="bg-white/10 hover:bg-white/20 text-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-white/15 transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Kategori Mapel</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowAiModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>+ Buat Modul AI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingModule(null);
                          setShowManualWizard(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                        <span>+ Input Manual</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pt-1">
                    {(() => {
                      const meta = getMapelMeta(selectedMapelFilter);
                      const IconComp = meta.icon;
                      return (
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-inner">
                          <IconComp className="w-6 h-6" />
                        </div>
                      );
                    })()}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base sm:text-lg font-black text-white">
                          Halaman Modul Ajar: {selectedMapelFilter}
                        </h2>
                        <span className="bg-emerald-500/20 text-emerald-300 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          {filteredModules.length} Modul
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100/80 mt-0.5 font-medium">
                        Daftar lengkap modul ajar KBC yang telah disiapkan khusus untuk mata pelajaran {selectedMapelFilter}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search & Filter Bar */}
              <div className="space-y-2">
                {isTeacherRole && (
                  <div className="p-3 bg-teal-50/90 border border-teal-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-2xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-extrabold text-teal-950 text-xs">
                            {userSession?.namaLengkap}
                          </span>
                          {userSession?.nip && (
                            <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-bold">
                              NIP: {userSession.nip}
                            </span>
                          )}
                          <span className="text-[9px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-black uppercase">
                            Guru Pengajar
                          </span>
                        </div>
                        <p className="text-[11px] text-teal-800 font-medium mt-0.5">
                          Mapel Diampu: <span className="font-bold">{(userSession?.mapelAmpu || []).join(', ') || 'Semua Mapel'}</span>
                          {userSession?.kelasAmpu && userSession.kelasAmpu.length > 0 && (
                            <span> • Kelas: <span className="font-bold">{userSession.kelasAmpu.join(', ')}</span></span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedTeacherFilter(userSession?.namaLengkap || 'Semua')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          selectedTeacherFilter === userSession?.namaLengkap
                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-white text-teal-800 border-teal-300 hover:bg-teal-100'
                        }`}
                      >
                        {selectedTeacherFilter === userSession?.namaLengkap ? '✓ Modul Saya' : 'Tampilkan Modul Saya'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTeacherFilter('Semua')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          selectedTeacherFilter === 'Semua'
                            ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Semua Modul Madrasah
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari judul modul ajar, materi, atau kata kunci..."
                    className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all shadow-xs"
                  />
                </div>

                {teachers.length > 0 && !isTeacherRole && (
                  <div className="flex items-center space-x-2 pt-0.5 font-sans text-[11px]">
                    <span className="font-bold text-slate-500 shrink-0 text-[10px] uppercase tracking-wider">Filter Guru:</span>
                    <select
                      value={selectedTeacherFilter}
                      onChange={e => setSelectedTeacherFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs text-slate-700 font-bold focus:outline-none focus:border-emerald-500 shadow-2xs"
                    >
                      <option value="Semua">Semua Guru ({teachers.length} Guru Terdaftar)</option>
                      {teachers.map((t, idx) => (
                        <option key={`${t.id}-${idx}`} value={t.nama}>
                          {t.nama} ({t.jabatanAtauKelas || 'Guru'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Section Anchor & Title (Only when Semua) */}
              <div ref={moduleListSectionRef} className="scroll-mt-4 space-y-3">
                {selectedMapelFilter === 'Semua' && (
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 pt-1">
                    <span className="flex items-center space-x-2">
                      <BookMarked className="w-4 h-4 text-emerald-600" />
                      <span className="font-extrabold text-sm">Daftar Semua Modul Ajar</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold border border-emerald-300">
                        {filteredModules.length} Modul
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Terbaru ke terlama</span>
                  </div>
                )}

                {filteredModules.length === 0 ? (
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-3 shadow-xs">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {selectedMapelFilter !== 'Semua'
                          ? `Belum Ada Modul Ajar untuk "${selectedMapelFilter}"`
                          : 'Belum Ada Modul Ajar Tersimpan'}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {selectedMapelFilter !== 'Semua'
                          ? `Anda belum memiliki modul ajar tersimpan khusus untuk ${selectedMapelFilter}. Buat modul baru sekarang secara instan!`
                          : 'Belum ada modul ajar yang sesuai dengan pencarian atau filter yang Anda pilih.'}
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowAiModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center space-x-2"
                      >
                        <Wand2 className="w-4 h-4 text-amber-300" />
                        <span>Buat Modul {selectedMapelFilter !== 'Semua' ? selectedMapelFilter : ''} dengan AI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingModule(null);
                          setShowManualWizard(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-slate-200"
                      >
                        Input Manual
                      </button>
                      {selectedMapelFilter !== 'Semua' && (
                        <button
                          type="button"
                          onClick={() => setSelectedMapelFilter('Semua')}
                          className="text-xs text-emerald-600 font-extrabold hover:underline py-2"
                        >
                          Tampilkan Semua Mapel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredModules.map((m, idx) => {
                    const isMyMod = isMyTeacherModule(m);

                    return (
                      <div
                        key={`${m.id}-${idx}`}
                        onClick={() => setSelectedModule(m)}
                        className="bg-white border border-slate-200/90 hover:border-emerald-500/70 p-4 rounded-2xl space-y-3 transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1.5 pr-2">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 font-sans">
                              <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase ${
                                m.modeBuat === 'AI'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              }`}>
                                {m.modeBuat === 'AI' ? '⚡ Generasi AI' : '✏️ Input Manual'}
                              </span>
                              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                                {m.identitas.mataPelajaran}
                              </span>
                              {isTeacherRole && (
                                isMyMod ? (
                                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center space-x-1">
                                    <span>✓ Modul Anda</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-md flex items-center space-x-1">
                                    <span>🔒 Modul: {m.penyusun || m.guruPengampu || 'Guru Lain'}</span>
                                  </span>
                                )
                              )}
                            </div>
                            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                              {m.judul}
                            </h3>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            {/* If Teacher and not my module, show Quick Duplicate Button */}
                            {isTeacherRole && !isMyMod ? (
                              <button
                                type="button"
                                onClick={e => handleDuplicateModule(m, e)}
                                className="p-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                                title="Duplikat modul ini ke akun saya"
                              >
                                <Copy className="w-3.5 h-3.5 text-teal-700" />
                                <span>Duplikat ke Modul Saya</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditingModule(m);
                                    setShowManualWizard(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Modul"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={e => handleDeleteModuleClick(m, e)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Modul"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          {m.identitas.materi}
                        </p>

                        {/* Bar Tombol Akses Kuis (Salin Link & Bagikan ke WA) */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleCopyStudentLink(m.id);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[11px] px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                              title="Salin Link Kuis khusus siswa untuk modul ini"
                            >
                              <Copy className="w-3 h-3 text-emerald-700" />
                              <span>Salin Link Kuis</span>
                            </button>

                            <button
                              type="button"
                              onClick={e => handleShareWA(m, e)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                              title="Bagikan Kuis ke WhatsApp"
                            >
                              <Send className="w-3 h-3 text-amber-300" />
                              <span>Bagikan ke WA</span>
                            </button>
                          </div>

                          <div className="flex items-center space-x-2 text-slate-500 text-[10px]">
                            <span className="font-bold text-slate-800">{m.identitas.faseKelas}</span>
                            <span className="text-emerald-500">•</span>
                            <button className="text-emerald-700 font-extrabold flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform">
                              <span>Buka Dokumen</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BUAT MODUL (Choice Screen) */}
          {activeTab === 'create' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-900 tracking-wide">Pilih Metode Pembuatan Modul Ajar</h2>
                <p className="text-xs text-slate-500">
                  Pilih salah satu dari 2 metode sesuai kebutuhan Anda dalam menyusun Kurikulum Berbasis Cinta (KBC).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Option 1: AI */}
                <div
                  onClick={() => setShowAiModal(true)}
                  className="bg-white border border-emerald-300 p-5 rounded-3xl space-y-3 cursor-pointer hover:border-emerald-500 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-xs">
                      <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-3 py-1 rounded-full font-extrabold border border-emerald-300">
                      PILIHAN 1: BERBASIS AI
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-emerald-900 group-hover:text-emerald-700 transition-colors">
                    Generasi AI Super Cepat (Gemini 3.6 Flash)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Otomatisasi perancangan 7 seksi modul ajar komprehensif lengkap dengan LKPD, Rubrik Asesmen, Soal Kuis Digital, dan Prompt Gambar Ilustrasi hanya dalam hitungan detik.
                  </p>
                  <div className="pt-2 flex justify-end">
                    <span className="text-xs font-black text-emerald-700 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                      <span>Mulai Generasi AI</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Option 2: Manual */}
                <div
                  onClick={() => {
                    setEditingModule(null);
                    setShowManualWizard(true);
                  }}
                  className="bg-white border border-slate-200 p-5 rounded-3xl space-y-3 cursor-pointer hover:border-emerald-400 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                      <PenTool className="w-5 h-5 group-hover:scale-110 transition-transform text-emerald-700" />
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-3 py-1 rounded-full font-extrabold border border-slate-200">
                      PILIHAN 2: WIZARD MANUAL
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Input Manual Bertahap (Wizard 7 Seksi)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Susun setiap komponen modul secara manual langkah demi langkah melalui formulir terpandu.
                  </p>
                  <div className="pt-2 flex justify-end">
                    <span className="text-xs font-black text-slate-700 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                      <span>Buka Wizard Manual</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB MATERI: KELOLA MATERI BANK */}
          {activeTab === 'materi' && (
            <div className="flex-1 overflow-y-auto p-4">
              <MateriBankManager
                materiList={materiList}
                apiKey={apiKey}
                customMapelList={customMapel}
                onAddCustomMapel={handleAddCustomMapel}
                onDeleteCustomMapel={handleDeleteCustomMapel}
                onSaveMateriList={handleSaveMateriList}
                onSelectMateriForModule={handleSelectMateriForModule}
                userSession={userSession}
              />
            </div>
          )}

          {/* TAB TEACHERS: DAFTAR GURU & NIP & KELAS */}
          {activeTab === 'teachers' && (
            <div className="flex-1 overflow-y-auto p-4">
              <TeacherListManager
                teachers={teachers}
                ttd={ttd}
                onSaveTeachers={handleSaveTeachers}
                onUpdateTTD={handleSaveTTD}
                userSession={userSession}
              />
            </div>
          )}

          {/* TAB 3: KUIS & MEDIA DIGITAL */}
          {activeTab === 'quiz' && (() => {
            const activeQuizModule = selectedModule || (modules.length > 0 ? modules[0] : null);

            return (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <QuizPlayer
                  media={activeQuizModule?.assesmen?.mediaDigital || {
                    soalKuis: [],
                    materiInteraktif: { ringkasanRingkas: '', poinPenting: [], flashcards: [] },
                    gambarInteraktif: { deskripsiVisual: '', promptGambar: '' }
                  }}
                  judulModul={activeQuizModule?.judul || 'Kuis & Media Interaktif KBC'}
                  selectedModule={activeQuizModule}
                  allModules={modules}
                  materiBankList={materiList}
                  customMapelList={customMapel}
                  onSelectModule={setSelectedModule}
                  onUpdateModule={handleSaveSingleModule}
                  onOpenStudentMode={() => {
                    if (!selectedModule && activeQuizModule) setSelectedModule(activeQuizModule);
                    setIsStudentMode(true);
                  }}
                  apiKey={apiKey}
                />
              </div>
            );
          })()}

          {/* TAB 4: PENGATURAN */}
          {activeTab === 'settings' && (
            <SettingsPanel
              kopSurat={kopSurat}
              onSaveKopSurat={handleSaveKopSurat}
              ttd={ttd}
              onSaveTTD={handleSaveTTD}
              apiKey={apiKey}
              onSaveApiKey={handleSaveApiKey}
              onSaveActiveTahun={handleSaveActiveTahunAjaran}
              onDataRestored={handleReloadAllData}
              onOpenMadrasahModal={() => setShowMadrasahModal(true)}
              onOpenWelcomeBanner={() => setShowWelcomeBanner(true)}
              activeMadrasah={activeMadrasah}
              userSession={userSession}
            />
          )}
        </div>

        {/* Official Printable Document Modal */}
        {selectedModule && activeTab === 'my-modules' && (
          <DocumentPrintView
            modul={selectedModule}
            onClose={() => setSelectedModule(null)}
            onSaveModule={handleSaveSingleModule}
            canEdit={userSession?.role !== 'guru'}
            onEdit={() => {
              if (userSession?.role === 'guru') {
                return;
              }
              setEditingModule(selectedModule);
              setShowManualWizard(true);
            }}
          />
        )}

        {/* AI Generator Modal */}
        {showAiModal && (
          <GeneratorAIModal
            kopSurat={kopSurat}
            ttd={ttd}
            apiKey={apiKey}
            materiList={materiList}
            initialMateri={selectedBankMateri}
            onSuccess={handleCreateAiSuccess}
            onClose={() => {
              setShowAiModal(false);
              setSelectedBankMateri(null);
            }}
          />
        )}

        {/* Manual Editor Wizard Modal */}
        {showManualWizard && (
          <EditorManualWizard
            initialModul={editingModule}
            kopSurat={kopSurat}
            ttd={ttd}
            materiList={materiList}
            onSave={handleSaveManualSuccess}
            onClose={() => {
              setShowManualWizard(false);
              setEditingModule(null);
              setSelectedBankMateri(null);
            }}
          />
        )}

        {/* Modal Confirm Delete Module */}
        {moduleToDelete && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[70] overflow-y-auto flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 space-y-4">
              <div className="flex items-center space-x-3 text-rose-400">
                <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-100 text-sm">Konfirmasi Hapus Modul Ajar</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1 text-xs">
                <span className="text-[10px] font-extrabold text-teal-300 bg-teal-950 px-2 py-0.5 rounded-md border border-teal-800">
                  {moduleToDelete.identitas.mataPelajaran}
                </span>
                <p className="font-extrabold text-slate-100 leading-snug pt-1">{moduleToDelete.judul}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2">{moduleToDelete.identitas.materi}</p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModuleToDelete(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteModule}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Modul</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Madrasah Multi-Tenant */}
        <MadrasahModal
          isOpen={showMadrasahModal}
          onClose={() => setShowMadrasahModal(false)}
          activeMadrasahId={activeMadrasahId}
          onSelectMadrasah={handleSelectMadrasah}
        />

        {/* System User Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            if (!userSession) {
              setShowWelcomeBanner(true);
            }
          }}
          onLoginSuccess={handleLoginSuccess}
          onOpenOfficialRegister={() => setShowOfficialRegisterModal(true)}
        />

        {/* Official Madrasah Registration Modal */}
        <OfficialRegisterModal
          isOpen={showOfficialRegisterModal || (Boolean(userSession) && trialStatus.isExpired && !trialStatus.isRegisteredOfficial)}
          isExpiredReason={Boolean(userSession) && trialStatus.isExpired && !trialStatus.isRegisteredOfficial}
          onClose={() => setShowOfficialRegisterModal(false)}
          onSuccess={handleOfficialRegisterSuccess}
        />

        {/* Curriculum Literacy & Reference Modal */}
        <CurriculumLiteracyModal
          isOpen={showLiteracyModal}
          onClose={() => setShowLiteracyModal(false)}
          onStartCreateModule={() => {
            setShowAiModal(true);
          }}
        />

        {/* Floating Literacy & Curriculum Reference Quick Button */}
        <button
          onClick={() => setShowLiteracyModal(true)}
          className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white p-3 sm:px-4 sm:py-2.5 rounded-full shadow-2xl flex items-center space-x-2 border border-emerald-300/40 font-extrabold text-xs transition-all duration-300 hover:scale-105 active:scale-95 group"
          title="Buka Referensi Kurikulum Merdeka & KBC"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
            <BookOpen className="w-3.5 h-3.5 text-amber-300 fill-amber-300 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="hidden sm:inline font-sans text-[11px] tracking-wide">Literasi Kurikulum KBC</span>
          <span className="bg-amber-400 text-slate-900 text-[9px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
            NEW
          </span>
        </button>

        {/* FLOATING MODAL OVERLAY FOR CLICKED MAPEL MODUL ("TAMPILAN MELAYANG") */}
        {selectedMapelModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedMapelModal(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-600/80 shrink-0">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const meta = getMapelMeta(selectedMapelModal);
                    const IconComp = meta.icon;
                    const mapelModulesCount = modules.filter(m =>
                      m.identitas?.mataPelajaran?.toLowerCase().trim() === selectedMapelModal.toLowerCase().trim() ||
                      m.identitas?.mataPelajaran?.toLowerCase().includes(selectedMapelModal.toLowerCase())
                    ).length;

                    return (
                      <>
                        <div className="p-2.5 bg-white/15 text-white rounded-xl backdrop-blur-md border border-white/20">
                          <IconComp className="w-5 h-5 text-emerald-100" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                              Daftar Modul Ajar: {selectedMapelModal}
                            </h3>
                            <span className="bg-white/20 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border border-white/30">
                              {mapelModulesCount} Modul
                            </span>
                          </div>
                          <p className="text-xs text-emerald-100/90 font-medium">
                            Koleksi Dokumen Modul Ajar KBC (Tampilan Melayang)
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAiModal(true);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition-all shadow-xs cursor-pointer border border-emerald-400/50"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">+ Buat Modul AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingModule(null);
                      setShowManualWizard(true);
                    }}
                    className="bg-white hover:bg-emerald-50 text-emerald-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline">+ Input Manual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMapelModal(null)}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer flex items-center space-x-1 border border-white/20 text-xs font-bold"
                    title="Tutup Jendela Melayang"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Tutup</span>
                  </button>
                </div>
              </div>

              {/* Modal Search Sub-Bar */}
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={modalModuleSearch}
                    onChange={e => setModalModuleSearch(e.target.value)}
                    placeholder={`Cari modul ajar khusus ${selectedMapelModal}...`}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Modal Content Body */}
              <div className="p-4 sm:p-6 bg-slate-50 flex-1 overflow-y-auto space-y-3">
                {(() => {
                  const mapelModules = modules.filter(m => {
                    const mapelMatch =
                      m.identitas?.mataPelajaran?.toLowerCase().trim() === selectedMapelModal.toLowerCase().trim() ||
                      m.identitas?.mataPelajaran?.toLowerCase().includes(selectedMapelModal.toLowerCase());
                    if (!mapelMatch) return false;
                    if (!modalModuleSearch.trim()) return true;
                    const q = modalModuleSearch.toLowerCase();
                    return (
                      m.judul.toLowerCase().includes(q) ||
                      m.identitas.materi.toLowerCase().includes(q) ||
                      (m.identitas.faseKelas && m.identitas.faseKelas.toLowerCase().includes(q))
                    );
                  });

                  if (mapelModules.length === 0) {
                    return (
                      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 my-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            Belum Ada Modul Ajar untuk "{selectedMapelModal}"
                          </h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Saat ini belum ada modul ajar tersimpan untuk {selectedMapelModal}. Anda dapat membuatnya sekarang dengan AI atau Input Manual.
                          </p>
                        </div>
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAiModal(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Wand2 className="w-4 h-4 text-amber-300" />
                            <span>Buat via AI Sekarang</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingModule(null);
                              setShowManualWizard(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
                          >
                            Input Manual
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {mapelModules.map((m, idx) => {
                        const isMyMod = isMyTeacherModule(m);

                        return (
                          <div
                            key={`${m.id}-${idx}`}
                            onClick={() => {
                              setSelectedModule(m);
                              setSelectedMapelModal(null);
                            }}
                            className="bg-white border border-slate-200/90 hover:border-emerald-500/70 p-4 rounded-2xl space-y-3 transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1.5 pr-2">
                                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 font-sans">
                                  <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase ${
                                    m.modeBuat === 'AI'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                  }`}>
                                    {m.modeBuat === 'AI' ? '⚡ Generasi AI' : '✏️ Input Manual'}
                                  </span>
                                  <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                                    {m.identitas.mataPelajaran}
                                  </span>
                                  {isTeacherRole && (
                                    isMyMod ? (
                                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                                        ✓ Modul Anda
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-md">
                                        🔒 {m.penyusun || m.guruPengampu || 'Guru Lain'}
                                      </span>
                                    )
                                  )}
                                </div>
                                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                                  {m.judul}
                                </h3>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                {isTeacherRole && !isMyMod ? (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      handleDuplicateModule(m, e);
                                      setSelectedMapelModal(null);
                                    }}
                                    className="p-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                                    title="Duplikat modul ini ke akun saya"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-teal-700" />
                                    <span>Duplikat</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setEditingModule(m);
                                        setShowManualWizard(true);
                                        setSelectedMapelModal(null);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Modul"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={e => handleDeleteModuleClick(m, e)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus Modul"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            {m.identitas.materi}
                          </p>

                          {/* Bar Tombol Akses Kuis (Salin Link & Bagikan ke WA) */}
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCopyStudentLink(m.id);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[11px] px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                                title="Salin Link Kuis khusus siswa untuk modul ini"
                              >
                                <Copy className="w-3 h-3 text-emerald-700" />
                                <span>Salin Link Kuis</span>
                              </button>

                              <button
                                type="button"
                                onClick={e => handleShareWA(m, e)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                                title="Bagikan Kuis ke WhatsApp"
                              >
                                <Send className="w-3 h-3 text-amber-300" />
                                <span>Bagikan ke WA</span>
                              </button>
                            </div>

                            <div className="flex items-center space-x-2 text-slate-500 text-[10px]">
                              <span className="font-bold text-slate-800">{m.identitas.faseKelas}</span>
                              <span className="text-emerald-500">•</span>
                              <button className="text-emerald-700 font-extrabold flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform">
                                <span>Buka Dokumen</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  💡 Klik pada salah satu modul untuk membuka dan melihat dokumen secara lengkap.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMapelModal(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 ml-auto"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Selesai &amp; Tutup Jendela Melayang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <WelcomeBanner
          isOpen={showWelcomeBanner}
          onClose={() => {
            setShowWelcomeBanner(false);
            if (!userSession) {
              setShowLoginModal(true);
            }
          }}
          userSession={userSession}
          activeMadrasahName={activeMadrasah.nama}
          activeTahunAjaran={activeTahunAjaran}
          onOpenAiModal={() => {
            setShowWelcomeBanner(false);
            if (!userSession) {
              setShowLoginModal(true);
            } else {
              setShowAiModal(true);
            }
          }}
          onOpenLoginModal={() => {
            setShowWelcomeBanner(false);
            setShowLoginModal(true);
          }}
          onLogout={handleLogout}
          onNavigateTab={(tab) => {
            setShowWelcomeBanner(false);
            if (!userSession) {
              setShowLoginModal(true);
            } else {
              setActiveTab(tab || 'settings');
            }
          }}
        />

        {/* Quiz Results Recap Modal */}
        <QuizResultsRecapModal
          isOpen={showQuizRecapModal}
          onClose={() => setShowQuizRecapModal(false)}
          userSession={userSession}
          allModules={modules}
          onDataChanged={handleReloadAllData}
        />

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AndroidFrame>
  );
}
