import React, { useState, useEffect, useMemo, useRef } from 'react';
import { KopSuratSettings, TTDSettings, SupabaseConfig, MysqlConfig, DEFAULT_TAHUN_AJARAN_OPTIONS, MadrasahItem, MAPEL_MI_OPTIONS, WelcomeBannerConfig, DEFAULT_WELCOME_BANNER_CONFIG, DocumentProtectionConfig, DEFAULT_DOCUMENT_PROTECTION_CONFIG } from '../types';
import { safeFetchJson } from '../utils/apiHelper';
import { handleImageError } from '../utils/imageHelper';
import defaultOgBadgeImage from '../assets/images/og_badge_jaenal_inside_1784949367744.jpg';
import {
  exportAllAppDataJson,
  importAppDataJson,
  loadActiveTahunAjaran,
  saveActiveTahunAjaran,
  loadCustomTahunAjaran,
  saveCustomTahunAjaran,
  loadTeacherPin,
  saveTeacherPin,
  loadCustomOgImage,
  saveCustomOgImage,
  loadCustomMapel,
  saveCustomMapel,
  addMasterMapel,
  loadMasterMapelList,
  renameOrMergeMapel,
  deleteMasterMapel,
  loadDeletedMapel,
  restoreDeletedMapel,
  clearDeletedMapelList,
  syncModulesWithMasterMapel,
  loadStoredModules,
  loadStoredMateriBank,
  loadMapelOgConfigs,
  saveMapelOgConfigs,
  loadSupabaseConfig,
  saveSupabaseConfig,
  loadMysqlConfig,
  saveMysqlConfig,
  loadMadrasahList,
  saveMadrasahList,
  saveActiveMadrasahId,
  getActiveMadrasah,
  loadWelcomeBannerConfig,
  saveWelcomeBannerConfig,
  loadDocumentProtectionConfig,
  saveDocumentProtectionConfig
} from '../utils/storage';
import { saveMapelOgConfigApi, fetchMapelOgConfigsApi, sanitizeMapelKey, getPresetImageForMapel, MapelOgConfig } from '../utils/mapelOgApi';
import { pushLocalDataToCloud, pullCloudDataToLocal, clearQuotaCooldown } from '../utils/firebaseSync';
import { updateOpenGraphMeta } from '../utils/metaHelper';
import {
  testSupabaseConnection,
  pushDataToSupabase,
  pullDataFromSupabase
} from '../utils/supabaseSync';
import {
  testMysqlConnection,
  diagnoseMysqlConnection,
  MysqlDiagnosticResult,
  pushDataToMysql,
  pullDataFromMysql
} from '../utils/mysqlSync';
import { isSuperAdminUser, loadUserSession, UserSession } from '../utils/auth';
import { compressAndResizeImage } from '../utils/imageHelper';
import { MasterKurikulumSection } from './MasterKurikulumSection';
import { CetakProfilMadrasahModal } from './CetakProfilMadrasahModal';
import { StudentListManager } from './StudentListManager';
import { AdminAccountsManager } from './AdminAccountsManager';
import {
  FileText,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Activity,
  Terminal,
  Stethoscope,
  XCircle,
  AlertCircle,
  Key,
  PenTool,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  Download,
  Database,
  Laptop,
  AlertTriangle,
  RefreshCw,
  RefreshCcw,
  Calendar,
  Plus,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Share2,
  Globe,
  Copy,
  ExternalLink,
  UploadCloud,
  RotateCcw,
  Layers,
  Zap,
  CheckCircle2,
  Server,
  Building2,
  School,
  Crown,
  Loader2,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Hash,
  Link2,
  BookOpen,
  Search,
  GitMerge,
  BookMarked,
  BookOpenCheck,
  GraduationCap,
  X,
  Printer,
  Users,
  Heart,
  Award,
  Edit3,
  Palette,
  Flame,
  Link as LinkIcon,
  Building,
  Unlock
} from 'lucide-react';

interface SettingsPanelProps {
  kopSurat: KopSuratSettings;
  onSaveKopSurat: (kop: KopSuratSettings) => void;
  ttd: TTDSettings;
  onSaveTTD: (ttd: TTDSettings) => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onSaveActiveTahun?: (tahun: string) => void;
  onDataRestored?: () => void;
  onOpenMadrasahModal?: () => void;
  onOpenWelcomeBanner?: () => void;
  activeMadrasah?: MadrasahItem;
  userSession?: UserSession | null;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  kopSurat,
  onSaveKopSurat,
  ttd,
  onSaveTTD,
  apiKey,
  onSaveApiKey,
  onSaveActiveTahun,
  onDataRestored,
  onOpenMadrasahModal,
  onOpenWelcomeBanner,
  activeMadrasah,
  userSession
}) => {
  const isSuperAdmin = isSuperAdminUser(userSession);
  const [activeTab, setActiveTab] = useState<'madrasah' | 'welcome_banner' | 'admin_accounts' | 'kop' | 'ttd' | 'mapel' | 'kurikulum' | 'students' | 'tahun' | 'pin' | 'doc_protection' | 'og' | 'api' | 'supabase' | 'mysql' | 'backup' | null>(null);

  const handleTabClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
  };

  // Welcome Banner State & Handlers
  const [welcomeForm, setWelcomeForm] = useState<WelcomeBannerConfig>(() => loadWelcomeBannerConfig());
  const [isUploadingWelcomeLogo, setIsUploadingWelcomeLogo] = useState(false);
  const [isWelcomeDragOver, setIsWelcomeDragOver] = useState(false);
  const [welcomeUploadError, setWelcomeUploadError] = useState<string | null>(null);
  const [welcomeSaveToast, setWelcomeSaveToast] = useState(false);
  const welcomeFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'welcome_banner') {
      setWelcomeForm(loadWelcomeBannerConfig());
    }
  }, [activeTab]);

  const processAndSetWelcomeLogo = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setWelcomeUploadError('File harus berupa gambar (PNG, JPG, WEBP, SVG, GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setWelcomeUploadError('Ukuran gambar terlalu besar! Maksimal 10MB.');
      return;
    }

    setIsUploadingWelcomeLogo(true);
    setWelcomeUploadError(null);

    try {
      const base64Data = await compressAndResizeImage(file, 600, 0.85);

      if (!base64Data) {
        setWelcomeUploadError('Gagal memproses gambar. Silakan coba file lain.');
        return;
      }

      setWelcomeForm((prev) => ({ ...prev, gambarUrl: base64Data }));
    } catch (err) {
      console.error('Error processing welcome logo image:', err);
      setWelcomeUploadError('Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsUploadingWelcomeLogo(false);
    }
  };

  const handleWelcomePresetLogo = (type: 'madrasah' | 'kop' | 'kemenag' | 'kbc' | 'pendidikan' | 'default') => {
    setWelcomeUploadError(null);
    if (type === 'madrasah') {
      const active = activeMadrasah || getActiveMadrasah();
      if (active && active.logoUrl) {
        setWelcomeForm((prev) => ({ ...prev, gambarUrl: active.logoUrl || '' }));
      } else if (kopSurat && kopSurat.logoUrl) {
        setWelcomeForm((prev) => ({ ...prev, gambarUrl: kopSurat.logoUrl || '' }));
      } else {
        setWelcomeUploadError('Logo Profil Madrasah belum diunggah. Silakan atur Logo di Profil Madrasah atau Kop Surat.');
      }
    } else if (type === 'kop') {
      if (kopSurat && kopSurat.logoUrl) {
        setWelcomeForm((prev) => ({ ...prev, gambarUrl: kopSurat.logoUrl || '' }));
      } else if (activeMadrasah && activeMadrasah.logoUrl) {
        setWelcomeForm((prev) => ({ ...prev, gambarUrl: activeMadrasah.logoUrl || '' }));
      } else {
        setWelcomeUploadError('Logo Kop Surat Madrasah belum diatur di Pengaturan Kop Surat.');
      }
    } else if (type === 'kemenag') {
      const kemenagSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="95" fill="%23047857" stroke="%23fbbf24" stroke-width="8"/><path d="M100 30 L160 80 L140 160 L60 160 L40 80 Z" fill="%23065f46" stroke="%23ffffff" stroke-width="4"/><text x="100" y="100" font-family="Arial" font-size="22" font-weight="bold" fill="%23fef08a" text-anchor="middle">KEMENAG</text><text x="100" y="130" font-family="Arial" font-size="16" font-weight="bold" fill="%23ffffff" text-anchor="middle">MADRASAH</text></svg>`;
      setWelcomeForm((prev) => ({ ...prev, gambarUrl: kemenagSvg }));
    } else if (type === 'kbc') {
      const kbcSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" rx="40" fill="%230f766e"/><path d="M100 40 C60 10, 20 60, 100 160 C180 60, 140 10, 100 40 Z" fill="%23f43f5e" opacity="0.9"/><text x="100" y="105" font-family="Arial" font-size="28" font-weight="900" fill="%23ffffff" text-anchor="middle">KBC</text><text x="100" y="180" font-family="Arial" font-size="13" font-weight="bold" fill="%23fef08a" text-anchor="middle">BERBASIS CINTA</text></svg>`;
      setWelcomeForm((prev) => ({ ...prev, gambarUrl: kbcSvg }));
    } else if (type === 'pendidikan') {
      const tutWuriSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" rx="40" fill="%231e3a8a"/><polygon points="100,25 175,75 145,165 55,165 25,75" fill="%231d4ed8" stroke="%23fbbf24" stroke-width="6"/><text x="100" y="100" font-family="Arial" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">PENDIDIKAN</text><text x="100" y="130" font-family="Arial" font-size="14" font-weight="bold" fill="%23fef08a" text-anchor="middle">INDONESIA</text></svg>`;
      setWelcomeForm((prev) => ({ ...prev, gambarUrl: tutWuriSvg }));
    } else if (type === 'default') {
      setWelcomeForm((prev) => ({ ...prev, gambarUrl: '' }));
    }
  };

  const handleSaveWelcomeBanner = (e: React.FormEvent) => {
    e.preventDefault();
    saveWelcomeBannerConfig(welcomeForm);
    setWelcomeSaveToast(true);
    setTimeout(() => setWelcomeSaveToast(false), 3000);
  };

  const handleResetWelcomeBanner = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan pengaturan Banner Welcome ke standar awal?')) {
      saveWelcomeBannerConfig(DEFAULT_WELCOME_BANNER_CONFIG);
      setWelcomeForm(DEFAULT_WELCOME_BANNER_CONFIG);
      setWelcomeSaveToast(true);
      setTimeout(() => setWelcomeSaveToast(false), 3000);
    }
  };

  // Active Madrasah Profile Form State EMIS Kemenag
  const [mNama, setMNama] = useState('');
  const [mKode, setMKode] = useState('');
  const [mJenjang, setMJenjang] = useState('MI');
  const [mNsm, setMNsm] = useState('');
  const [mNpsn, setMNpsn] = useState('');
  const [mStatus, setMStatus] = useState('Swasta');
  const [mAkreditasi, setMAkreditasi] = useState('A (Unggul)');
  const [mNoSkAkreditasi, setMNoSkAkreditasi] = useState('');
  const [mTglAkreditasi, setMTglAkreditasi] = useState('');
  const [mSkIzinOperasional, setMSkIzinOperasional] = useState('');
  const [mTglSkIzinOperasional, setMTglSkIzinOperasional] = useState('');
  const [mTahunBerdiri, setMTahunBerdiri] = useState('');
  const [mKepala, setMKepala] = useState('');
  const [mNipKepala, setMNipKepala] = useState('');
  const [mYayasan, setMYayasan] = useState('');
  const [mNoSkYayasan, setMNoSkYayasan] = useState('');
  const [mAlamat, setMAlamat] = useState('');
  const [mRtRw, setMRtRw] = useState('');
  const [mDusun, setMDusun] = useState('');
  const [mAlamatLengkap, setMAlamatLengkap] = useState('');
  const [mDesa, setMDesa] = useState('');
  const [mKecamatan, setMKecamatan] = useState('');
  const [mKota, setMKota] = useState('');
  const [mProvinsi, setMProvinsi] = useState('');
  const [mKodePos, setMKodePos] = useState('');
  const [mTitikKoordinat, setMTitikKoordinat] = useState('');
  const [mKontak, setMKontak] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mWebsite, setMWebsite] = useState('');
  const [mSiswaL, setMSiswaL] = useState<number>(100);
  const [mSiswaP, setMSiswaP] = useState<number>(90);
  const [mRombel, setMRombel] = useState<number>(6);
  const [mGuruL, setMGuruL] = useState<number>(4);
  const [mGuruP, setMGuruP] = useState<number>(8);
  const [mTendik, setMTendik] = useState<number>(2);
  const [mSavedMsg, setMSavedMsg] = useState<string | null>(null);
  const [mSaveStatus, setMSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Print Profile State
  const [mCetakModalOpen, setMCetakModalOpen] = useState<boolean>(false);

  // Sync state when activeMadrasah prop changes or when madrasah tab opens
  useEffect(() => {
    const cur = activeMadrasah || getActiveMadrasah();
    if (cur) {
      setMNama(cur.nama || '');
      setMKode(cur.kodeMadrasah || '');
      setMJenjang(cur.jenjang || 'MI');
      setMNsm(cur.nsm || cur.nsmOrNpsn || '');
      setMNpsn(cur.npsn || '');
      setMStatus(cur.statusSekolah || 'Swasta');
      setMAkreditasi(cur.akreditasi || 'A (Unggul)');
      setMNoSkAkreditasi(cur.noSkAkreditasi || '');
      setMTglAkreditasi(cur.tglAkreditasi || '');
      setMSkIzinOperasional(cur.skIzinOperasional || '');
      setMTglSkIzinOperasional(cur.tglSkIzinOperasional || '');
      setMTahunBerdiri(cur.tahunBerdiri || '');
      setMKepala(cur.kepalaMadrasah || ttd?.kepalaMadrasahNama || '');
      setMNipKepala(cur.nipKepalaMadrasah || ttd?.kepalaMadrasahNIP || '');
      setMYayasan(cur.namaYayasan || kopSurat?.namaInstansiAtas || "Lembaga Pendidikan Ma'arif NU Banyumas");
      setMNoSkYayasan(cur.noSkYayasan || '');
      setMAlamat(cur.alamat || '');
      setMRtRw(cur.rtRw || '');
      setMDusun(cur.dusun || '');
      setMAlamatLengkap(cur.alamatLengkap || cur.alamat || kopSurat?.alamatMadrasah || '');
      setMDesa(cur.desaKelurahan || '');
      setMKecamatan(cur.kecamatan || '');
      setMKota(cur.kotaKabupaten || 'Kab. Banyumas');
      setMProvinsi(cur.provinsi || 'Jawa Tengah');
      setMKodePos(cur.kodePos || '');
      setMTitikKoordinat(cur.titikKoordinat || '');
      setMKontak(cur.kontak || kopSurat?.kontakMadrasah || '');
      setMEmail(cur.email || '');
      setMWebsite(cur.website || kopSurat?.website || '');
      setMSiswaL(cur.jumlahSiswaL || 100);
      setMSiswaP(cur.jumlahSiswaP || 90);
      setMRombel(cur.jumlahRombel || 6);
      setMGuruL(cur.jumlahGuruL || 4);
      setMGuruP(cur.jumlahGuruP || 8);
      setMTendik(cur.jumlahTendik || 2);
    }
  }, [activeMadrasah, activeTab]);

  const handleSaveActiveMadrasahProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMSaveStatus('saving');
    const currentActive = activeMadrasah || getActiveMadrasah();
    const list = loadMadrasahList();

    const fullAlamat = mAlamatLengkap.trim() || [
      mAlamat.trim(),
      mRtRw.trim() ? `RT ${mRtRw.trim()}` : '',
      mDusun.trim() ? `Dusun ${mDusun.trim()}` : '',
      mDesa.trim() ? `Desa ${mDesa.trim()}` : '',
      mKecamatan.trim() ? `Kec. ${mKecamatan.trim()}` : '',
      mKota.trim(),
      mProvinsi.trim(),
      mKodePos.trim()
    ].filter(Boolean).join(', ');

    const updatedList = list.map(item => {
      if (item.id === currentActive.id) {
        return {
          ...item,
          nama: mNama.trim() || item.nama,
          kodeMadrasah: mKode.trim() || item.kodeMadrasah,
          jenjang: mJenjang,
          nsm: mNsm.trim(),
          npsn: mNpsn.trim(),
          nsmOrNpsn: mNsm.trim() || mNpsn.trim() || item.nsmOrNpsn,
          statusSekolah: mStatus,
          akreditasi: mAkreditasi,
          noSkAkreditasi: mNoSkAkreditasi.trim(),
          tglAkreditasi: mTglAkreditasi.trim(),
          skIzinOperasional: mSkIzinOperasional.trim(),
          tglSkIzinOperasional: mTglSkIzinOperasional.trim(),
          tahunBerdiri: mTahunBerdiri.trim(),
          kepalaMadrasah: mKepala.trim(),
          nipKepalaMadrasah: mNipKepala.trim(),
          namaYayasan: mYayasan.trim(),
          noSkYayasan: mNoSkYayasan.trim(),
          alamat: mAlamat.trim() || fullAlamat,
          rtRw: mRtRw.trim(),
          dusun: mDusun.trim(),
          alamatLengkap: fullAlamat,
          desaKelurahan: mDesa.trim(),
          kecamatan: mKecamatan.trim(),
          kotaKabupaten: mKota.trim(),
          provinsi: mProvinsi.trim(),
          kodePos: mKodePos.trim(),
          titikKoordinat: mTitikKoordinat.trim(),
          kontak: mKontak.trim(),
          email: mEmail.trim(),
          website: mWebsite.trim(),
          jumlahSiswaL: mSiswaL,
          jumlahSiswaP: mSiswaP,
          jumlahRombel: mRombel,
          jumlahGuruL: mGuruL,
          jumlahGuruP: mGuruP,
          jumlahTendik: mTendik
        };
      }
      return item;
    });

    saveMadrasahList(updatedList, true);

    // Sync Kop Surat
    onSaveKopSurat({
      ...kopSurat,
      namaMadrasah: mNama.trim() || kopSurat.namaMadrasah,
      alamatMadrasah: fullAlamat || mAlamat.trim() || kopSurat.alamatMadrasah,
      kontakMadrasah: mKontak.trim() || kopSurat.kontakMadrasah,
      website: mWebsite.trim() || kopSurat.website,
      namaInstansiAtas: mYayasan.trim() || kopSurat.namaInstansiAtas
    });

    // Sync TTD Settings
    if (mKepala.trim()) {
      onSaveTTD({
        ...ttd,
        kepalaMadrasahNama: mKepala.trim(),
        kepalaMadrasahNIP: mNipKepala.trim() || ttd.kepalaMadrasahNIP,
        tempatPenetapan: mKota.trim() ? mKota.trim().replace(/^Kab\.\s*|^Kota\s*/i, '') : ttd.tempatPenetapan
      });
    }

    if (onDataRestored) onDataRestored();

    setMSaveStatus('saved');
    setMSavedMsg('✓ Data Profil Madrasah Aktif berhasil disimpan & disinkronkan!');
    setTimeout(() => {
      setMSaveStatus('idle');
      setTimeout(() => setMSavedMsg(null), 3500);
    }, 2500);
  };

  // Master Mapel Management State
  const [masterMapelList, setMasterMapelList] = useState<string[]>(() => loadMasterMapelList());
  const [deletedMapelList, setDeletedMapelList] = useState<string[]>(() => loadDeletedMapel());
  const [searchMapel, setSearchMapel] = useState<string>('');
  const [newMapelInput, setNewMapelInput] = useState<string>('');
  const [editingMapel, setEditingMapel] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');
  const [mergingMapel, setMergingMapel] = useState<string | null>(null);
  const [targetMergeMapel, setTargetMergeMapel] = useState<string>('');
  const [mapelSavedMsg, setMapelSavedMsg] = useState<string | null>(null);
  const [deletingMapelModal, setDeletingMapelModal] = useState<string | null>(null);

  const refreshMapels = () => {
    setMasterMapelList(loadMasterMapelList());
    setDeletedMapelList(loadDeletedMapel());
  };

  const handleRestoreMapel = (mapelName: string) => {
    restoreDeletedMapel(mapelName);
    refreshMapels();
    setMapelSavedMsg(`Mata pelajaran "${mapelName}" berhasil dipulihkan ke Master Mapel.`);
    setTimeout(() => setMapelSavedMsg(null), 3000);
    if (onDataRestored) onDataRestored();
  };

  const handleRestoreAllMapels = () => {
    clearDeletedMapelList();
    refreshMapels();
    setMapelSavedMsg('Semua mata pelajaran yang dihapus telah dipulihkan ke Master Mapel.');
    setTimeout(() => setMapelSavedMsg(null), 3000);
    if (onDataRestored) onDataRestored();
  };

  // Mapel OG & Thumbnail Config State
  const [mapelOgConfigsState, setMapelOgConfigsState] = useState<Record<string, { title?: string; desc?: string; imageUrl?: string; updatedAt?: string }>>(() => loadMapelOgConfigs());

  // Refresh master mapel list and mapel OG configs when tab changes
  useEffect(() => {
    if (activeTab === 'mapel' || activeTab === 'og') {
      setMasterMapelList(loadMasterMapelList());
      const freshLocalOg = loadMapelOgConfigs();
      setMapelOgConfigsState(freshLocalOg);
      fetchMapelOgConfigsApi().then(apiCfgs => {
        if (apiCfgs && Object.keys(apiCfgs).length > 0) {
          const merged = { ...loadMapelOgConfigs(), ...apiCfgs };
          saveMapelOgConfigs(merged, false);
          setMapelOgConfigsState(merged);
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  const handleMapelThumbnailUpload = async (mapelName: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Sila pilih berkas gambar yang valid (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran gambar terlalu besar! Maksimal 10MB.');
      return;
    }

    setOgUploading(true);
    try {
      const base64Data = await compressAndResizeImage(file, 1200, 0.88);
      if (!base64Data) {
        setOgUploading(false);
        return;
      }

      const title = `Kuis & Media Interaktif ${mapelName}`;
      const desc = `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${mapelName}`;

      await saveMapelOgConfigApi(mapelName, title, desc, base64Data);

      const freshOg = loadMapelOgConfigs();
      setMapelOgConfigsState(freshOg);
      fetchMapelOgConfigsApi().then(apiCfgs => {
        if (apiCfgs && Object.keys(apiCfgs).length > 0) {
          const merged = { ...loadMapelOgConfigs(), ...apiCfgs };
          saveMapelOgConfigs(merged, false);
          setMapelOgConfigsState(merged);
        }
      }).catch(() => {});

      setOgUploadMsg(`Thumbnail untuk mata pelajaran "${mapelName}" berhasil terdeteksi, terekam, & disimpan di server!`);
      setOgCacheBuster(Date.now());
    } catch (err) {
      console.error('Gagal mengunggah thumbnail mapel:', err);
      setOgUploadMsg(`Gagal memproses thumbnail untuk "${mapelName}".`);
    } finally {
      setOgUploading(false);
      setTimeout(() => setOgUploadMsg(null), 5000);
    }

    pushLocalDataToCloud().catch(err => console.error(err));
  };

  const handleResetMapelThumbnail = async (mapelName: string) => {
    if (!confirm(`Hapus thumbnail custom untuk mata pelajaran "${mapelName}" dan kembalikan ke gambar default?`)) return;

    setOgUploading(true);
    try {
      const title = `Kuis & Media Interaktif ${mapelName}`;
      const desc = `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${mapelName}`;

      await saveMapelOgConfigApi(mapelName, title, desc, '');

      const freshOg = loadMapelOgConfigs();
      setMapelOgConfigsState(freshOg);

      setOgUploadMsg(`Thumbnail mata pelajaran "${mapelName}" telah dikembalikan ke default.`);
      setOgCacheBuster(Date.now());
    } catch (err) {
      console.error('Gagal reset thumbnail mapel:', err);
    } finally {
      setOgUploading(false);
      setTimeout(() => setOgUploadMsg(null), 4000);
    }

    pushLocalDataToCloud().catch(err => console.error(err));
  };

  // Calculate usage stats per mapel (count of modules & materi bank)
  const mapelUsageStats = useMemo(() => {
    const stats: Record<string, { modulesCount: number; bankCount: number }> = {};
    const modules = loadStoredModules();
    const bank = loadStoredMateriBank();

    modules.forEach(m => {
      const mp = m.identitas?.mataPelajaran?.trim();
      if (mp) {
        if (!stats[mp]) stats[mp] = { modulesCount: 0, bankCount: 0 };
        stats[mp].modulesCount++;
      }
    });

    bank.forEach(b => {
      const mp = b.mataPelajaran?.trim();
      if (mp) {
        if (!stats[mp]) stats[mp] = { modulesCount: 0, bankCount: 0 };
        stats[mp].bankCount++;
      }
    });

    return stats;
  }, [masterMapelList, activeTab]);

  // Handle Add New Custom Mapel
  const handleAddMasterMapel = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMapelInput.trim();
    if (!trimmed) return;

    if (masterMapelList.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      setMapelSavedMsg(`Mata pelajaran "${trimmed}" sudah ada dalam daftar.`);
      setTimeout(() => setMapelSavedMsg(null), 3500);
      return;
    }

    addMasterMapel(trimmed);

    // Record and register new mapel OG thumbnail config automatically
    saveMapelOgConfigApi(
      trimmed,
      `Modul Ajar & Kuis ${trimmed}`,
      `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${trimmed}`,
      getPresetImageForMapel(trimmed)
    ).then(() => {
      setMapelOgConfigsState(loadMapelOgConfigs());
    }).catch(() => {});

    setNewMapelInput('');
    refreshMapels();
    if (onDataRestored) onDataRestored();

    setMapelSavedMsg(`Mata pelajaran "${trimmed}" berhasil ditambahkan ke Master Mapel & otomatis terdeteksi di Atur Thumbnail!`);
    setTimeout(() => setMapelSavedMsg(null), 3500);
  };

  // Handle Rename Mapel
  const handleRenameMapelSubmit = (oldName: string) => {
    const trimmedNew = renameInput.trim();
    if (!trimmedNew || trimmedNew === oldName) {
      setEditingMapel(null);
      return;
    }

    const res = renameOrMergeMapel(oldName, trimmedNew);
    setEditingMapel(null);
    setRenameInput('');
    refreshMapels();
    if (onDataRestored) onDataRestored();

    setMapelSavedMsg(
      `Mata pelajaran "${oldName}" diperbarui menjadi "${trimmedNew}". ` +
      `(${res.modulesUpdated} Modul Ajar & ${res.bankUpdated} Bank Materi disesuaikan).`
    );
    setTimeout(() => setMapelSavedMsg(null), 4500);
  };

  // Handle Merge Mapel
  const handleMergeMapelSubmit = (sourceName: string) => {
    const target = targetMergeMapel.trim();
    if (!target || target === sourceName) {
      setMergingMapel(null);
      return;
    }

    if (!confirm(`Gabungkan seluruh data mapel "${sourceName}" ke dalam "${target}"? Nama mapel "${sourceName}" pada modul dan bank materi akan otomatis diganti.`)) {
      return;
    }

    const res = renameOrMergeMapel(sourceName, target);
    setMergingMapel(null);
    setTargetMergeMapel('');
    refreshMapels();
    if (onDataRestored) onDataRestored();

    setMapelSavedMsg(
      `Berhasil menggabungkan "${sourceName}" ke "${target}"! ` +
      `(${res.modulesUpdated} Modul Ajar & ${res.bankUpdated} Bank Materi diperbarui).`
    );
    setTimeout(() => setMapelSavedMsg(null), 4500);
  };

  // Handle Delete Mapel
  const handleDeleteMapelItem = (mapelName: string) => {
    setDeletingMapelModal(mapelName);
  };

  const executeDeleteMapelItem = (mapelName: string) => {
    deleteMasterMapel(mapelName);
    refreshMapels();
    if (onDataRestored) onDataRestored();

    setMapelSavedMsg(`Mata pelajaran "${mapelName}" telah dihapus dari Master Mapel.`);
    setTimeout(() => setMapelSavedMsg(null), 3500);
  };

  // Handle Synchronize all modules with master mapel
  const handleSyncAllModules = () => {
    const res = syncModulesWithMasterMapel();
    const fresh = loadMasterMapelList();
    setMasterMapelList(fresh);
    if (onDataRestored) onDataRestored();

    setMapelSavedMsg(
      `Berhasil menyinkronkan seluruh modul! ` +
      `(${res.modulesSynced} Modul Ajar & ${res.bankSynced} Bank Materi disesuaikan dengan Master Mapel).`
    );
    setTimeout(() => setMapelSavedMsg(null), 4000);
  };

  // Smart Detection for similar mapel spellings (e.g. Fiqih vs Fikih, Qur'an vs Quran)
  const mapelDiscrepancies = useMemo(() => {
    const pairs: Array<{ mapelA: string; mapelB: string; reason: string }> = [];
    const list = masterMapelList;

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const normA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normB = b.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (normA === normB && a !== b) {
          pairs.push({
            mapelA: a,
            mapelB: b,
            reason: `Perbedaan tanda baca/spasi ("${a}" vs "${b}")`
          });
        } else if ((normA.includes('fikih') && normB.includes('fiqih')) || (normA.includes('fiqih') && normB.includes('fikih'))) {
          pairs.push({
            mapelA: a,
            mapelB: b,
            reason: `Variasi ejaan Fikih/Fiqih`
          });
        } else if ((normA.includes('quran') && normB.includes('quran')) && a !== b) {
          pairs.push({
            mapelA: a,
            mapelB: b,
            reason: `Variasi ejaan Al-Qur'an`
          });
        }
      }
    }
    return pairs;
  }, [masterMapelList]);

  // Supabase Configuration State
  const [supabaseForm, setSupabaseForm] = useState<SupabaseConfig>(() => loadSupabaseConfig());
  const [showSupabaseKey, setShowSupabaseKey] = useState<boolean>(false);
  const [supabaseTesting, setSupabaseTesting] = useState<boolean>(false);
  const [supabaseSyncing, setSupabaseSyncing] = useState<boolean>(false);
  const [supabaseResult, setSupabaseResult] = useState<{ success: boolean; message: string } | null>(null);
  const [supabaseSavedMsg, setSupabaseSavedMsg] = useState<string | null>(null);

  // MySQL / Plesk Hosting Configuration State
  const [mysqlForm, setMysqlForm] = useState<MysqlConfig>(() => loadMysqlConfig());
  const [showMysqlPassword, setShowMysqlPassword] = useState<boolean>(false);
  const [mysqlTesting, setMysqlTesting] = useState<boolean>(false);
  const [mysqlDiagnosing, setMysqlDiagnosing] = useState<boolean>(false);
  const [mysqlDiagnostic, setMysqlDiagnostic] = useState<MysqlDiagnosticResult | null>(null);
  const [mysqlSyncing, setMysqlSyncing] = useState<boolean>(false);
  const [mysqlResult, setMysqlResult] = useState<{ success: boolean; message: string } | null>(null);
  const [mysqlSavedMsg, setMysqlSavedMsg] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const handleSecureDownload = async (endpoint: string, filename: string, isZip: boolean = false) => {
    setDownloadingFile(filename);
    try {
      const response = await fetch(endpoint, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Gagal mengunduh file (HTTP ${response.status}: ${response.statusText})`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (isZip && contentType.includes('text/html')) {
        throw new Error('Respons berupa halaman HTML, bukan file ZIP valid.');
      }

      const blob = await response.blob();
      if (blob.size < 10) {
        throw new Error('File yang diunduh kosong.');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();

      setTimeout(() => {
        if (document.body.contains(tempLink)) {
          document.body.removeChild(tempLink);
        }
        window.URL.revokeObjectURL(blobUrl);
      }, 500);
    } catch (err: any) {
      console.error(`Gagal mengunduh ${filename}:`, err);
      alert(`Terjadi kesalahan saat mengunduh ${filename}: ` + (err.message || err));
    } finally {
      setDownloadingFile(null);
    }
  };

  useEffect(() => {
    setSupabaseForm(loadSupabaseConfig());
    setMysqlForm(loadMysqlConfig());
  }, [activeTab, apiKey]);

  const handleSaveMysqlConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveMysqlConfig(mysqlForm);
    setMysqlSavedMsg('Pengaturan koneksi Database MySQL / Plesk Hosting berhasil disimpan!');
    setTimeout(() => setMysqlSavedMsg(null), 3500);
  };

  const handleTestMysql = async () => {
    setMysqlTesting(true);
    setMysqlResult(null);
    try {
      const res = await testMysqlConnection(mysqlForm);
      setMysqlResult(res);
    } catch (err: any) {
      setMysqlResult({
        success: false,
        message: err.message || 'Gagal menguji koneksi MySQL.'
      });
    } finally {
      setMysqlTesting(false);
    }
  };

  const handleDiagnoseMysql = async () => {
    setMysqlDiagnosing(true);
    setMysqlDiagnostic(null);
    try {
      saveMysqlConfig(mysqlForm);
      const res = await diagnoseMysqlConnection(mysqlForm);
      setMysqlDiagnostic(res);
    } catch (err: any) {
      setMysqlDiagnostic({
        success: false,
        title: 'Gagal Menjalankan Diagnosa',
        summary: err.message || 'Terjadi kesalahan saat memproses diagnosa MySQL.'
      });
    } finally {
      setMysqlDiagnosing(false);
    }
  };

  const handlePushMysql = async () => {
    setMysqlSyncing(true);
    setMysqlResult(null);
    try {
      saveMysqlConfig(mysqlForm);
      const res = await pushDataToMysql(mysqlForm);
      setMysqlResult(res);
      if (res.success) {
        setMysqlForm(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      }
    } catch (err: any) {
      setMysqlResult({
        success: false,
        message: err.message || 'Gagal mengunggah data ke MySQL.'
      });
    } finally {
      setMysqlSyncing(false);
    }
  };

  const handlePullMysql = async () => {
    setMysqlSyncing(true);
    setMysqlResult(null);
    try {
      saveMysqlConfig(mysqlForm);
      const res = await pullDataFromMysql(mysqlForm);
      setMysqlResult(res);
      if (res.success) {
        setMysqlForm(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
        if (onDataRestored) onDataRestored();
      }
    } catch (err: any) {
      setMysqlResult({
        success: false,
        message: err.message || 'Gagal memuat data dari MySQL.'
      });
    } finally {
      setMysqlSyncing(false);
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseForm);
    setSupabaseSavedMsg('Pengaturan koneksi Akun Supabase berhasil disimpan!');
    setTimeout(() => setSupabaseSavedMsg(null), 3500);
  };

  const handleTestSupabase = async () => {
    setSupabaseTesting(true);
    setSupabaseResult(null);
    try {
      const res = await testSupabaseConnection(supabaseForm);
      setSupabaseResult(res);
    } catch (err: any) {
      setSupabaseResult({
        success: false,
        message: err.message || 'Gagal menguji koneksi Supabase.'
      });
    } finally {
      setSupabaseTesting(false);
    }
  };

  const handlePushSupabase = async () => {
    setSupabaseSyncing(true);
    setSupabaseResult(null);
    try {
      saveSupabaseConfig(supabaseForm);
      const res = await pushDataToSupabase(supabaseForm);
      setSupabaseResult(res);
      if (res.success) {
        setSupabaseForm(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      }
    } catch (err: any) {
      setSupabaseResult({
        success: false,
        message: err.message || 'Gagal mengunggah data ke Supabase.'
      });
    } finally {
      setSupabaseSyncing(false);
    }
  };

  const handlePullSupabase = async () => {
    setSupabaseSyncing(true);
    setSupabaseResult(null);
    try {
      saveSupabaseConfig(supabaseForm);
      const res = await pullDataFromSupabase(supabaseForm);
      setSupabaseResult(res);
      if (res.success) {
        setSupabaseForm(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
        if (onDataRestored) onDataRestored();
      }
    } catch (err: any) {
      setSupabaseResult({
        success: false,
        message: err.message || 'Gagal memuat data dari Supabase.'
      });
    } finally {
      setSupabaseSyncing(false);
    }
  };

  // Teacher PIN State
  const [pinInput, setPinInput] = useState<string>(() => loadTeacherPin());
  const [showPinText, setShowPinText] = useState<boolean>(false);
  const [pinSavedMsg, setPinSavedMsg] = useState<string | null>(null);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pinInput.trim();
    if (!trimmed) {
      setPinSavedMsg('PIN tidak boleh kosong!');
      setTimeout(() => setPinSavedMsg(null), 3000);
      return;
    }
    saveTeacherPin(trimmed);
    setPinSavedMsg(`PIN Mode Guru berhasil diperbarui menjadi: "${trimmed}"`);
    setTimeout(() => setPinSavedMsg(null), 3500);
  };

  // Document Print Protection State & Handlers
  const [docProtConfig, setDocProtConfig] = useState<DocumentProtectionConfig>(() => loadDocumentProtectionConfig());
  const [showDocProtPass, setShowDocProtPass] = useState<boolean>(false);
  const [docProtSavedMsg, setDocProtSavedMsg] = useState<string | null>(null);
  const [testInputDocPass, setTestInputDocPass] = useState<string>('');
  const [testResultMsg, setTestResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'doc_protection') {
      setDocProtConfig(loadDocumentProtectionConfig());
      setTestResultMsg(null);
      setTestInputDocPass('');
    }
  }, [activeTab]);

  const handleSaveDocProtection = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPassword = (docProtConfig.password || '').trim();
    if (docProtConfig.enabled && !trimmedPassword) {
      setDocProtSavedMsg('Peringatan: Password tidak boleh kosong jika proteksi diaktifkan!');
      setTimeout(() => setDocProtSavedMsg(null), 3500);
      return;
    }

    const updated: DocumentProtectionConfig = {
      ...docProtConfig,
      password: trimmedPassword,
      lastUpdatedBy: userSession?.nama || (isSuperAdmin ? 'Super Admin' : 'Admin'),
      lastUpdatedAt: new Date().toISOString()
    };
    saveDocumentProtectionConfig(updated);
    setDocProtConfig(updated);
    setDocProtSavedMsg('✓ Konfigurasi Proteksi Password Dokumen Cetak Berhasil Disimpan!');
    setTimeout(() => setDocProtSavedMsg(null), 4000);
  };

  const handleGenerateRandomDocPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'KBC-';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDocProtConfig(prev => ({ ...prev, password: res }));
    setDocProtSavedMsg(`Password baru di-generate: "${res}". Klik "Simpan Pengaturan Proteksi" untuk menerapkan.`);
    setTimeout(() => setDocProtSavedMsg(null), 4000);
  };

  const handleTestDocPassword = () => {
    if (!testInputDocPass.trim()) {
      setTestResultMsg({ success: false, text: 'Masukkan kata sandi yang ingin diuji coba.' });
      return;
    }
    if (testInputDocPass.trim() === (docProtConfig.password || '').trim()) {
      setTestResultMsg({ success: true, text: '✓ Kata Sandi COCOK! Dokumen publik akan terbuka dengan kata sandi ini.' });
    } else {
      setTestResultMsg({ success: false, text: '✕ Kata Sandi TIDAK COCOK! Akses dokumen cetak publik akan ditolak.' });
    }
  };

  // Active Tahun Ajaran & Options State
  const [activeTahun, setActiveTahun] = useState<string>(() => loadActiveTahunAjaran());
  const [customTahunList, setCustomTahunList] = useState<string[]>(() => loadCustomTahunAjaran());
  const [newTahunInput, setNewTahunInput] = useState('');
  const [tahunSaveMsg, setTahunSaveMsg] = useState<string | null>(null);

  const allTahunList = Array.from(new Set([...customTahunList, ...DEFAULT_TAHUN_AJARAN_OPTIONS]));

  const handleSelectActiveTahun = (val: string) => {
    setActiveTahun(val);
    saveActiveTahunAjaran(val);
    if (onSaveActiveTahun) onSaveActiveTahun(val);
    pushLocalDataToCloud().catch(err => console.error(err));
    setTahunSaveMsg(`Tahun ajaran aktif berhasil disimpan: ${val}`);
    setTimeout(() => setTahunSaveMsg(null), 3000);
  };

  // Custom Open Graph Image State
  const [customOgImage, setCustomOgImage] = useState<string>(() => loadCustomOgImage());
  const [ogUploadMsg, setOgUploadMsg] = useState<string | null>(null);
  const [ogUploading, setOgUploading] = useState<boolean>(false);
  const [ogCacheBuster, setOgCacheBuster] = useState<number>(Date.now());
  const [testHostingDomain] = useState<string>(() => {
    try {
      return localStorage.getItem('kbc_test_hosting_domain') || '';
    } catch {
      return '';
    }
  });

  // Dynamically update document head favicon whenever custom icon/og image changes
  useEffect(() => {
    const faviconUrl = customOgImage || `/og-image-round.jpg?v=${ogCacheBuster}`;
    const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel='apple-touch-icon']");
    iconLinks.forEach((link) => {
      link.href = faviconUrl;
    });
  }, [customOgImage, ogCacheBuster]);

  const handleOgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Sila pilih berkas gambar yang valid (JPG, PNG, WEBP, ICO)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran gambar terlalu besar! Maksimal 10MB.');
      return;
    }

    setOgUploading(true);
    try {
      // Compress and resize image to ~500px so base64 size stays small (~30-80KB) and never exceeds LocalStorage quotas
      const base64Data = await compressAndResizeImage(file, 500, 0.85);

      if (!base64Data) {
        setOgUploading(false);
        return;
      }

      saveCustomOgImage(base64Data);
      setCustomOgImage(base64Data);

      // Force refresh Open Graph metadata & favicons in head with cache buster ?v=...
      updateOpenGraphMeta({
        imageUrl: base64Data,
        version: Date.now()
      });

      // Upload to server backend so /og-image-round.jpg & /favicon.ico serve it directly
      let resSuccess = false;
      let serverMsg = '';
      try {
        let res = await safeFetchJson<{ success: boolean; message?: string; error?: string }>('/api/custom-og-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: base64Data })
        });
        if (!res?.success) {
          // Fallback call directly to api.php for hosting setups without mod_rewrite
          res = await safeFetchJson<{ success: boolean; message?: string; error?: string }>('/api.php?action=custom_og_image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData: base64Data })
          });
        }
        resSuccess = !!res?.success;
        if (res?.message) serverMsg = res.message;
      } catch (backendErr) {
        try {
          const res = await safeFetchJson<{ success: boolean; message?: string; error?: string }>('/api.php?action=custom_og_image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData: base64Data })
          });
          resSuccess = !!res?.success;
          if (res?.message) serverMsg = res.message;
        } catch (e) {}
      }

      setOgUploadMsg(
        resSuccess
          ? (serverMsg || 'Favicon tab browser & gambar Open Graph berhasil diperbarui! (Tersimpan di Penyimpanan Lokal & Server Hosting)')
          : 'Favicon tab browser & gambar Open Graph berhasil diperbarui di Penyimpanan Lokal!'
      );
    } catch (err: any) {
      console.error('Gagal memproses gambar:', err);
      setOgUploadMsg('Gagal memproses gambar. Sila coba gambar lain.');
    } finally {
      setOgUploading(false);
      setOgCacheBuster(Date.now());
      setTimeout(() => setOgUploadMsg(null), 5000);
      e.target.value = '';
    }

    pushLocalDataToCloud().catch(err => console.error(err));
  };

  const handleResetOgImage = async () => {
    if (!confirm('Apakah Anda yakin ingin mengembalikan Favicon & Gambar Open Graph ke tampilan default sistem?')) return;

    setOgUploading(true);
    try {
      saveCustomOgImage('');
      setCustomOgImage('');

      updateOpenGraphMeta({
        imageUrl: '/og-image-round.jpg',
        version: Date.now()
      });

      try {
        await safeFetchJson('/api/custom-og-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' })
        });
      } catch (e1) {
        await safeFetchJson('/api.php?action=custom_og_image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' })
        });
      }

      setOgUploadMsg('Favicon & Gambar Open Graph dikembalikan ke default sistem!');
    } catch (err) {
      setOgUploadMsg('Favicon & Gambar Open Graph dikembalikan ke default.');
    } finally {
      setOgUploading(false);
      setOgCacheBuster(Date.now());
      setTimeout(() => setOgUploadMsg(null), 4000);
    }
  };

  const handleDownloadOgImage = async () => {
    try {
      const imgTargetUrl = customOgImage || defaultOgBadgeImage;
      const response = await fetch(imgTargetUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = customOgImage ? 'og-image-custom.jpg' : 'og-image-round.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    } catch (err) {
      const a = document.createElement('a');
      a.href = customOgImage || defaultOgBadgeImage;
      a.download = 'og-image-round.jpg';
      a.target = '_blank';
      a.click();
    }
  };

  const handleAddTahunInSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTahunInput.trim();
    if (!trimmed) return;
    if (allTahunList.includes(trimmed)) {
      setTahunSaveMsg(`Tahun ajaran "${trimmed}" sudah ada.`);
      setTimeout(() => setTahunSaveMsg(null), 3000);
      return;
    }
    const updated = [trimmed, ...customTahunList];
    setCustomTahunList(updated);
    saveCustomTahunAjaran(updated);
    setActiveTahun(trimmed);
    saveActiveTahunAjaran(trimmed);
    if (onSaveActiveTahun) onSaveActiveTahun(trimmed);
    pushLocalDataToCloud().catch(err => console.error(err));
    setNewTahunInput('');
    setTahunSaveMsg(`Tahun ajaran baru "${trimmed}" ditambahkan & disimpan sebagai tahun aktif!`);
    setTimeout(() => setTahunSaveMsg(null), 3500);
  };

  // Backup & Restore State
  const [backupStatus, setBackupStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Cloud Database Sync State
  const [cloudSyncing, setCloudSyncing] = useState<boolean>(false);
  const [cloudMsg, setCloudMsg] = useState<{ success: boolean; message: string } | null>(null);

  const handleManualPushCloud = async () => {
    setCloudSyncing(true);
    setCloudMsg(null);
    clearQuotaCooldown();
    try {
      const ok = await pushLocalDataToCloud();
      if (ok) {
        setCloudMsg({
          success: true,
          message: 'Seluruh data aplikasi berhasil disinkronkan dan disimpan aman ke Cloud Database!'
        });
      } else {
        setCloudMsg({
          success: false,
          message: 'Gagal mengunggah data ke Cloud Database.'
        });
      }
    } catch (err: any) {
      setCloudMsg({
        success: false,
        message: err.message || 'Terjadi kesalahan saat menyambung ke Cloud Database.'
      });
    } finally {
      setCloudSyncing(false);
      setTimeout(() => setCloudMsg(null), 4000);
    }
  };

  const handleManualPullCloud = async () => {
    setCloudSyncing(true);
    setCloudMsg(null);
    clearQuotaCooldown();
    try {
      const ok = await pullCloudDataToLocal();
      if (ok) {
        setCloudMsg({
          success: true,
          message: 'Data terbaru berhasil dimuat dari Cloud Database!'
        });
        if (onDataRestored) onDataRestored();
      } else {
        setCloudMsg({
          success: false,
          message: 'Gagal memuat data dari Cloud Database.'
        });
      }
    } catch (err: any) {
      setCloudMsg({
        success: false,
        message: err.message || 'Gagal tersambung ke Cloud Database.'
      });
    } finally {
      setCloudSyncing(false);
      setTimeout(() => setCloudMsg(null), 4000);
    }
  };

  const handleDownloadBackup = () => {
    try {
      const jsonStr = exportAllAppDataJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `Cadangan_KBC_MI_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus({
        success: true,
        message: 'Berkas cadangan (.json) berhasil diunduh! Anda dapat menyimpannya di Google Drive, Flashdisk, atau mengirimnya via WhatsApp untuk dipulihkan di komputer/HP lain.'
      });
    } catch (err: any) {
      setBackupStatus({
        success: false,
        message: 'Gagal mengunduh cadangan data: ' + err.message
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const res = importAppDataJson(content);
      setBackupStatus({
        success: res.success,
        message: res.message
      });

      if (res.success) {
        setTimeout(() => {
          if (onDataRestored) {
            onDataRestored();
          } else {
            window.location.reload();
          }
        }, 1200);
      }
    };
    reader.readAsText(file);
  };

  // Kop State
  const [kopForm, setKopForm] = useState<KopSuratSettings>(kopSurat);
  const [kopSaved, setKopSaved] = useState<boolean>(false);

  // TTD State
  const [ttdForm, setTtdForm] = useState<TTDSettings>(ttd);
  const [ttdSaved, setTtdSaved] = useState<boolean>(false);

  useEffect(() => {
    setKopForm(kopSurat);
  }, [kopSurat]);

  useEffect(() => {
    setTtdForm(ttd);
  }, [ttd]);

  // API Key State
  const [keyInput, setKeyInput] = useState<string>(apiKey);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [keySaved, setKeySaved] = useState<boolean>(false);
  const [testingKey, setTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Handle Logo Upload with Auto-Save
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Ukuran file logo terlalu besar. Maksimal 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoData = reader.result as string;
        setKopForm(prev => {
          const updated = { ...prev, logoUrl: logoData };
          onSaveKopSurat(updated);
          pushLocalDataToCloud().catch(err => console.error(err));
          return updated;
        });
        setKopSaved(true);
        setTimeout(() => setKopSaved(false), 3000);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleSaveKop = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKopSurat(kopForm);
    setKopSaved(true);
    setTimeout(() => setKopSaved(false), 3000);
  };

  const handleSaveTTD = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTTD(ttdForm);
    setTtdSaved(true);
    setTimeout(() => setTtdSaved(false), 3000);
  };

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(keyInput);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 3000);
  };

  const handleTestKey = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const data = await safeFetchJson<{ success: boolean; message?: string; error?: string }>('/api/test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': keyInput
        },
        body: JSON.stringify({ userApiKey: keyInput })
      });

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Koneksi API Key Gemini AI Berhasil! Kunci API aktif dan siap digunakan.'
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Gagal terhubung ke Gemini AI.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Koneksi ke server backend gagal.'
      });
    } finally {
      setTestingKey(false);
    }
  };

  const currentActiveMadrasahItem: MadrasahItem = useMemo(() => {
    const cur = activeMadrasah || getActiveMadrasah();
    const fullAlamat = mAlamatLengkap.trim() || [
      mAlamat.trim(),
      mRtRw.trim() ? `RT ${mRtRw.trim()}` : '',
      mDusun.trim() ? `Dusun ${mDusun.trim()}` : '',
      mDesa.trim() ? `Desa ${mDesa.trim()}` : '',
      mKecamatan.trim() ? `Kec. ${mKecamatan.trim()}` : '',
      mKota.trim(),
      mProvinsi.trim(),
      mKodePos.trim()
    ].filter(Boolean).join(', ');

    return {
      id: cur?.id || 'default',
      nama: mNama.trim() || cur?.nama || "MI Ma'arif NU 2 Sanggreman",
      kodeMadrasah: mKode.trim() || cur?.kodeMadrasah || 'MIMNU2SANGGREMAN',
      jenjang: mJenjang || 'MI',
      nsm: mNsm.trim() || cur?.nsm || '111233020054',
      npsn: mNpsn.trim() || cur?.npsn || '60712345',
      nsmOrNpsn: mNsm.trim() || mNpsn.trim() || cur?.nsmOrNpsn || '111233020054',
      statusSekolah: mStatus || 'Swasta',
      akreditasi: mAkreditasi || 'A (Unggul)',
      noSkAkreditasi: mNoSkAkreditasi || cur?.noSkAkreditasi || '',
      tglAkreditasi: mTglAkreditasi || cur?.tglAkreditasi || '',
      skIzinOperasional: mSkIzinOperasional || cur?.skIzinOperasional || '',
      tglSkIzinOperasional: mTglSkIzinOperasional || cur?.tglSkIzinOperasional || '',
      tahunBerdiri: mTahunBerdiri || cur?.tahunBerdiri || '',
      kepalaMadrasah: mKepala.trim() || cur?.kepalaMadrasah || 'JAENAL MASKUN, S.Pd.I.',
      nipKepalaMadrasah: mNipKepala.trim() || cur?.nipKepalaMadrasah || '-',
      namaYayasan: mYayasan.trim() || cur?.namaYayasan || "Lembaga Pendidikan Ma'arif NU Banyumas",
      noSkYayasan: mNoSkYayasan || cur?.noSkYayasan || '',
      alamat: mAlamat.trim() || cur?.alamat || "Jl. Ma'arif No. 02",
      rtRw: mRtRw.trim() || cur?.rtRw || '03/01',
      dusun: mDusun.trim() || cur?.dusun || '',
      alamatLengkap: fullAlamat || cur?.alamatLengkap || "Jl. Ma'arif No. 02, Sanggreman, Kec. Rawalo, Kab. Banyumas, Jawa Tengah 53173",
      desaKelurahan: mDesa.trim() || cur?.desaKelurahan || 'Sanggreman',
      kecamatan: mKecamatan.trim() || cur?.kecamatan || 'Rawalo',
      kotaKabupaten: mKota.trim() || cur?.kotaKabupaten || 'Kab. Banyumas',
      provinsi: mProvinsi.trim() || cur?.provinsi || 'Jawa Tengah',
      kodePos: mKodePos.trim() || cur?.kodePos || '53173',
      titikKoordinat: mTitikKoordinat.trim() || cur?.titikKoordinat || '',
      kontak: mKontak.trim() || cur?.kontak || '081234567890',
      email: mEmail.trim() || cur?.email || 'mimaarifnu2sanggreman@gmail.com',
      website: mWebsite.trim() || cur?.website || 'https://maarifnubanyumas.or.id',
      jumlahSiswaL: mSiswaL,
      jumlahSiswaP: mSiswaP,
      jumlahRombel: mRombel,
      jumlahGuruL: mGuruL,
      jumlahGuruP: mGuruP,
      jumlahTendik: mTendik
    };
  }, [
    activeMadrasah, mNama, mKode, mJenjang, mNsm, mNpsn, mStatus, mAkreditasi, mNoSkAkreditasi,
    mTglAkreditasi, mSkIzinOperasional, mTglSkIzinOperasional, mTahunBerdiri, mKepala, mNipKepala,
    mYayasan, mNoSkYayasan, mAlamat, mRtRw, mDusun, mAlamatLengkap, mDesa, mKecamatan, mKota,
    mProvinsi, mKodePos, mTitikKoordinat, mKontak, mEmail, mWebsite, mSiswaL, mSiswaP, mRombel,
    mGuruL, mGuruP, mTendik
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-5 rounded-2xl text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <PenTool className="w-5 h-5 text-emerald-100" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Pengaturan Modul Ajar & Sistem</h2>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl">
            Kelola Kop Surat Resmi Madrasah, Data Penandatangan TTD, Kunci API Gemini AI, Tahun Ajaran Aktif, Keamanan PIN, dan Cadangan Data Aplikasi.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          {onOpenWelcomeBanner && (
            <button
              type="button"
              onClick={onOpenWelcomeBanner}
              className="bg-white/20 hover:bg-white/30 border border-white/30 px-3 py-1.5 rounded-xl text-xs font-black text-white flex items-center space-x-1.5 transition-all cursor-pointer backdrop-blur-xs active:scale-95 shadow-xs"
              title="Pratinjau & Edit Banner Welcome"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Banner Welcome</span>
            </button>
          )}
          <div className="bg-white/15 border border-white/20 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 backdrop-blur-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-200" />
            <span>TA Aktif: {activeTahun}</span>
          </div>
        </div>
      </div>

      {/* Main Container Card for Navigation & Settings Content */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Modern Iconic Navigation Grid with Enhanced Legibility & Size */}
        <div className="bg-slate-100/90 p-4 sm:p-5 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Pilih Modul Pengaturan
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                16 Modul Tersedia
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Klik modul untuk membuka konfigurasi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-3.5">
            {[
              { id: 'madrasah', label: 'Profil Madrasah', icon: Building2, desc: 'Identitas Sekolah & Kelembagaan' },
              { id: 'admin_accounts', label: 'Akun Admin', icon: ShieldCheck, desc: 'Admin & Operator Madrasah', badge: 'Baru' },
              { id: 'welcome_banner', label: 'Banner Welcome', icon: Sparkles, desc: 'Full Edit Banner Landing Page', badge: 'Full Edit' },
              { id: 'kop', label: 'Kop Surat', icon: FileText, desc: 'Format Cetak Header & Logo' },
              { id: 'ttd', label: 'Penandatangan', icon: PenTool, desc: 'Jabatan, NIP & Stempel Resmi' },
              { id: 'mapel', label: 'Master Mapel', icon: BookOpen, desc: 'Kelola & Penyetaraan Mata Pelajaran' },
              { id: 'kurikulum', label: 'Master Kurikulum', icon: BookOpenCheck, desc: 'Modul, Jadwal, Rombel & Cetak', badge: 'Terbaru' },
              { id: 'students', label: 'Akun Siswa', icon: Users, desc: 'Generate & Login Kuis Siswa', badge: 'Baru' },
              { id: 'tahun', label: 'Tahun Ajaran', icon: Calendar, desc: 'Aktifkan Semester & Tahun Pelajaran' },
              { id: 'pin', label: 'PIN Guru', icon: Lock, desc: 'Keamanan Akses Login Guru' },
              { id: 'doc_protection', label: 'Proteksi Dokumen', icon: ShieldAlert, desc: 'Password Dokumen Cetak Publik', badge: docProtConfig.enabled ? 'Aktif' : 'Bebas' },
              { id: 'og', label: 'Favicon & OG', icon: Share2, desc: 'Meta Share & Ikon Web Global' },
              { id: 'api', label: 'API Key AI', icon: Key, desc: 'Integrasi Kunci Gemini AI' },
              { id: 'supabase', label: 'Supabase Sync', icon: Server, desc: 'Sinkronisasi Database Cloud' },
              { id: 'mysql', label: 'MySQL Hosting', icon: Database, desc: 'Hosting Web Server Plesk/cPanel' },
              { id: 'backup', label: 'Cadangan Data', icon: Database, desc: 'Ekspor & Impor Cadangan Lengkap' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id as any)}
                  className={`group relative p-3.5 sm:p-4 rounded-2xl transition-all duration-200 flex items-start space-x-3 cursor-pointer text-left ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-500/50 scale-[1.02]'
                      : 'bg-white text-slate-700 hover:bg-slate-50/90 hover:text-slate-900 border border-slate-200/90 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <div
                    className={`p-2.5 sm:p-3 rounded-xl shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white shadow-inner'
                        : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span className={`text-xs sm:text-sm font-extrabold leading-snug tracking-tight ${isActive ? 'text-white' : 'text-slate-800 group-hover:text-emerald-900'}`}>
                        {tab.label}
                      </span>
                      {(tab as any).badge && (
                        <span className={`text-[9.5px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                          isActive ? 'bg-amber-300 text-slate-950 shadow-xs' : 'bg-amber-400 text-slate-950 shadow-xs'
                        }`}>
                          {(tab as any).badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs leading-normal block font-medium ${
                        isActive ? 'text-emerald-100' : 'text-slate-500 group-hover:text-slate-600'
                      }`}
                    >
                      {tab.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Overview Panel when no modal tab is active */}
        {!activeTab && (
          <div className="p-6 sm:p-8 text-center space-y-4 bg-slate-50/80">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center shadow-xs border border-emerald-200">
              <Sparkles className="w-7 h-7 text-emerald-600 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">
                Dasbor Pengaturan Sistem & Modul Ajar
              </h3>
              <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                Klik salah satu ikon menu di atas untuk membuka formulir konfigurasi secara <span className="font-bold text-emerald-700">Melayang (Modal Overlay)</span> tanpa menggeser posisi dasbor.
              </p>
            </div>

            {/* Quick Overview Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto pt-2 text-left">
              <button
                type="button"
                onClick={() => setActiveTab('madrasah')}
                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Madrasah</span>
                </div>
                <span className="text-[11px] text-slate-500 truncate block mt-1">
                  {activeMadrasah?.nama || 'Profil Sekolah'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mapel')}
                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Master Mapel</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {masterMapelList.length} Mapel Terdaftar
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tahun')}
                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Tahun Ajaran</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {activeTahun}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('api')}
                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>Gemini AI Key</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {apiKey ? '✓ Terpasang' : 'Belum diisi'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING MODAL OVERLAY FOR ACTIVE MENU ("TAMPILAN MELAYANG") */}
      {activeTab && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveTab(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-600/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/15 text-white rounded-xl backdrop-blur-md border border-white/20">
                  {activeTab === 'madrasah' && <Building2 className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'admin_accounts' && <ShieldCheck className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'welcome_banner' && <Sparkles className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'kop' && <FileText className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'ttd' && <PenTool className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'mapel' && <BookOpen className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'kurikulum' && <BookOpenCheck className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'tahun' && <Calendar className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'pin' && <Lock className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'doc_protection' && <ShieldAlert className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'og' && <Share2 className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'api' && <Key className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'supabase' && <Server className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'mysql' && <Database className="w-5 h-5 text-emerald-100" />}
                  {activeTab === 'backup' && <Database className="w-5 h-5 text-emerald-100" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                    {activeTab === 'madrasah' && 'Profil & Identitas Madrasah'}
                    {activeTab === 'admin_accounts' && 'Kelola Akun Admin & Operator Sekolah'}
                    {activeTab === 'welcome_banner' && 'Full Edit Banner Welcome & Logo Landing'}
                    {activeTab === 'kop' && 'Format Kop Surat Resmi'}
                    {activeTab === 'ttd' && 'Penandatangan TTD & Stempel'}
                    {activeTab === 'mapel' && 'Master Mata Pelajaran'}
                    {activeTab === 'kurikulum' && 'MASTER KURIKULUM'}
                    {activeTab === 'students' && 'Kelola Akun Siswa & Hasil Kuis'}
                    {activeTab === 'tahun' && 'Tahun Ajaran & Semester'}
                    {activeTab === 'pin' && 'Keamanan PIN Guru'}
                    {activeTab === 'doc_protection' && 'Kelola Password Proteksi Dokumen Cetak Publik'}
                    {activeTab === 'og' && 'Favicon & Open Graph (Meta Share)'}
                    {activeTab === 'api' && 'Gemini AI API Key'}
                    {activeTab === 'supabase' && 'Supabase Cloud Synchronization'}
                    {activeTab === 'mysql' && 'MySQL Web Server Database'}
                    {activeTab === 'backup' && 'Cadangan & Pemulihan Data'}
                  </h3>
                  <p className="text-xs text-emerald-100/90 font-medium">
                    Formulir Konfigurasi Pengaturan (Tampilan Melayang)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 border border-white/20 text-xs font-bold shadow-xs"
                title="Tutup Jendela Melayang"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Tutup</span>
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="p-4 sm:p-6 bg-slate-50 flex-1 overflow-y-auto space-y-4">

      {/* Tab Content: Full Edit Banner Welcome */}
      {activeTab === 'welcome_banner' && (
        <form onSubmit={handleSaveWelcomeBanner} className="space-y-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          {/* Header & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <span>Pengaturan Full Edit Banner Welcome Landing Page</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kustomisasi seluruh isi teks, slogan, logo header, warna tema, tombol pintas, dan banner khusus mode siswa.
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
              {onOpenWelcomeBanner && (
                <button
                  type="button"
                  onClick={onOpenWelcomeBanner}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Pratinjau Banner</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleResetWelcomeBanner}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Kembalikan ke standar awal"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                  welcomeSaveToast
                    ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-105'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
                }`}
              >
                {welcomeSaveToast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>✓ Banner Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Banner</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {welcomeSaveToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pengaturan Banner Welcome berhasil disimpan! Perubahan akan langsung tampil di halaman depan.</span>
            </div>
          )}

          {/* SECTION 1: VISIBILITAS & TEKS UTAMA */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Edit3 className="w-4 h-4 text-emerald-600" />
              <span>1. Visibilitas & Teks Utama Banner</span>
            </h4>

            {/* Banner Active Toggle */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Tampilkan Banner Welcome saat Aplikasi Dibuka</span>
                <span className="text-[11px] text-slate-500 block">Jika diaktifkan, banner sambutan akan otomatis muncul saat tamu atau guru mengakses web.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={welcomeForm.isBannerActive !== false}
                  onChange={(e) => setWelcomeForm((prev) => ({ ...prev, isBannerActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Badge Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Kategori Header</label>
                <input
                  type="text"
                  value={welcomeForm.badgeText || ''}
                  onChange={(e) => setWelcomeForm((prev) => ({ ...prev, badgeText: e.target.value }))}
                  placeholder="Contoh: Modul Ajar KBC v1.0 • Kemenag RI"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* Judul Utama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Utama Banner</label>
                <input
                  type="text"
                  value={welcomeForm.judul || ''}
                  onChange={(e) => setWelcomeForm((prev) => ({ ...prev, judul: e.target.value }))}
                  placeholder="Contoh: Aplikasi Generator Modul Ajar KBC"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-950"
                />
              </div>
            </div>

            {/* Sub Judul */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sub-judul / Deskripsi Sambutan</label>
              <textarea
                rows={2}
                value={welcomeForm.subJudul || ''}
                onChange={(e) => setWelcomeForm((prev) => ({ ...prev, subJudul: e.target.value }))}
                placeholder="Deskripsi singkat aplikasi dan ajakan bagi pendidik..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium"
              />
            </div>

            {/* Motto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motto / Slogan Pembelajaran</label>
              <input
                type="text"
                value={welcomeForm.motto || ''}
                onChange={(e) => setWelcomeForm((prev) => ({ ...prev, motto: e.target.value }))}
                placeholder='Contoh: "Menciptakan Pembelajaran Bermakna, Humanis, dan Penuh Cinta Kasih"'
                className="w-full text-xs p-2.5 bg-amber-50/50 border border-amber-200 text-amber-950 rounded-xl focus:ring-2 focus:ring-amber-500 font-serif italic"
              />
            </div>
          </div>

          {/* SECTION 2: LOGO HEADER & GAMBAR */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>2. Logo Header & Gambar Banner Welcome</span>
            </h4>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={welcomeFileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processAndSetWelcomeLogo(e.target.files[0]);
                }
              }}
              accept="image/*"
              className="hidden"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Image Preview Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pratinjau Logo Banner</span>
                <div className="w-24 h-24 rounded-full bg-white border-2 border-emerald-500 p-1 shadow-md flex items-center justify-center overflow-hidden relative group">
                  {welcomeForm.gambarUrl ? (
                    <img
                      src={welcomeForm.gambarUrl}
                      alt="Logo Banner"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <School className="w-12 h-12 text-emerald-600" />
                  )}
                </div>
                {welcomeForm.gambarUrl && (
                  <button
                    type="button"
                    onClick={() => setWelcomeForm((prev) => ({ ...prev, gambarUrl: '' }))}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Logo</span>
                  </button>
                )}
              </div>

              {/* Upload & Preset Options */}
              <div className="md:col-span-2 space-y-3">
                {/* Drag & Drop Upload Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsWelcomeDragOver(true);
                  }}
                  onDragLeave={() => setIsWelcomeDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsWelcomeDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processAndSetWelcomeLogo(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => welcomeFileInputRef.current?.click()}
                  className={`p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                    isWelcomeDragOver
                      ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                      : 'border-slate-300 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-400'
                  }`}
                >
                  {isUploadingWelcomeLogo ? (
                    <div className="flex items-center justify-center space-x-2 text-xs font-bold text-emerald-700">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Memproses & Mengompres Gambar...</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="w-7 h-7 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-800">
                        Klik di sini atau Tarik & Lepas Berkas Gambar Logo
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Format disarankan: PNG, JPG, WEBP, SVG (Maks. 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {welcomeUploadError && (
                  <p className="text-xs text-rose-600 font-bold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{welcomeUploadError}</span>
                  </p>
                )}

                {/* Preset Logo Buttons */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Gunakan Logo Standar / Preset Cepat:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <button
                      type="button"
                      onClick={() => handleWelcomePresetLogo('madrasah')}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Madrasah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWelcomePresetLogo('kop')}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Kop Surat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWelcomePresetLogo('kemenag')}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <School className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Kemenag</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWelcomePresetLogo('kbc')}
                      className="p-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                      <span>Logo KBC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWelcomePresetLogo('pendidikan')}
                      className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                      <span>Pendidikan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWelcomePresetLogo('default')}
                      className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                      <span>Reset Auto</span>
                    </button>
                  </div>
                </div>

                {/* Custom URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Atau Masukkan URL Gambar / Base64:</label>
                  <input
                    type="text"
                    value={welcomeForm.gambarUrl || ''}
                    onChange={(e) => setWelcomeForm((prev) => ({ ...prev, gambarUrl: e.target.value }))}
                    placeholder="https://... atau data:image/..."
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: TEMA WARNA BANNER */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              <span>3. Pilihan Tema Warna Banner Sambutan</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { id: 'emerald', label: 'Emerald KBC', bg: 'bg-emerald-800', border: 'border-emerald-600', text: 'text-emerald-100' },
                { id: 'indigo', label: 'Indigo Modern', bg: 'bg-indigo-900', border: 'border-indigo-600', text: 'text-indigo-100' },
                { id: 'amber', label: 'Amber Gold', bg: 'bg-amber-900', border: 'border-amber-600', text: 'text-amber-100' },
                { id: 'rose', label: 'Rose Love', bg: 'bg-rose-900', border: 'border-rose-600', text: 'text-rose-100' },
                { id: 'dark', label: 'Dark Luxury', bg: 'bg-slate-950', border: 'border-slate-700', text: 'text-amber-400' },
              ].map((style) => {
                const isSelected = (welcomeForm.themeStyle || 'emerald') === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setWelcomeForm((prev) => ({ ...prev, themeStyle: style.id as any }))}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 shadow-md scale-[1.02] border-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-full h-8 rounded-lg ${style.bg} ${style.border} border flex items-center justify-center mb-2`}>
                      <Sparkles className={`w-4 h-4 ${style.text}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 block truncate">{style.label}</span>
                    <span className="text-[10px] text-slate-400 block">{isSelected ? '✓ Terpilih' : 'Pilih'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: TOMBOL PINTAS (QUICK ACTIONS) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>4. Label Tombol Akses Pintas pada Banner</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tombol Pintas 1 (Buat Modul Ajar)</label>
                <input
                  type="text"
                  value={welcomeForm.tombol1Teks || ''}
                  onChange={(e) => setWelcomeForm((prev) => ({ ...prev, tombol1Teks: e.target.value }))}
                  placeholder="Contoh: ✨ Buat Modul Ajar AI"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tombol Pintas 2 (Kelola Materi / Bank)</label>
                <input
                  type="text"
                  value={welcomeForm.tombol2Teks || ''}
                  onChange={(e) => setWelcomeForm((prev) => ({ ...prev, tombol2Teks: e.target.value }))}
                  placeholder="Contoh: 📚 Bank Materi KBC"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tombol Pintas 3 (Siswa / Kuis)</label>
                <input
                  type="text"
                  value={welcomeForm.tombol3Teks || ''}
                  onChange={(e) => setWelcomeForm((prev) => ({ ...prev, tombol3Teks: e.target.value }))}
                  placeholder="Contoh: 🎓 Kuis & Ujian Siswa"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: BANNER SISWA / KUIS */}
          <div className="space-y-3 pt-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-200">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center space-x-2 border-b border-indigo-200 pb-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>5. Pengaturan Banner Mode Siswa (Kuis Interaktif)</span>
            </h4>

            {/* Student Active Toggle */}
            <div className="p-3 bg-white rounded-xl border border-indigo-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Tampilkan Banner Sambutan Khusus Siswa</span>
                <span className="text-[11px] text-slate-500 block">Banner khusus untuk siswa saat mengerjakan kuis atau latihan online.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={welcomeForm.studentBannerActive !== false}
                  onChange={(e) => setWelcomeForm((prev) => ({ ...prev, studentBannerActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Banner Siswa</label>
                <input
                  type="text"
                  value={welcomeForm.studentTitle || ''}
                  onChange={(e) => setWelcomeForm((prev) => ({ ...prev, studentTitle: e.target.value }))}
                  placeholder="Selamat Datang di Ruang Kuis Siswa"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Label Tombol Mulai Kuis Siswa</label>
                <input
                  type="text"
                  value={welcomeForm.studentButtonText || ''}
                  onChange={(e) => setWelcomeForm((prev) => ({ ...prev, studentButtonText: e.target.value }))}
                  placeholder="🚀 Mulai Kerjakan Kuis"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sub-judul Sambutan Siswa</label>
              <input
                type="text"
                value={welcomeForm.studentSubTitle || ''}
                onChange={(e) => setWelcomeForm((prev) => ({ ...prev, studentSubTitle: e.target.value }))}
                placeholder="Siapkan diri Anda untuk menjawab soal kuis dengan teliti dan jujur."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetWelcomeBanner}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Kembalikan Default Banner</span>
            </button>

            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center space-x-2 cursor-pointer ${
                welcomeSaveToast
                  ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-105'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
              }`}
            >
              {welcomeSaveToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>✓ Banner Berhasil Disimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Banner Welcome</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab Content: Master Kurikulum */}
      {activeTab === 'kurikulum' && (
        <MasterKurikulumSection kopSurat={kopSurat} ttd={ttd} />
      )}

      {/* Tab Content: Master Mata Pelajaran */}
      {activeTab === 'mapel' && (
        <div className="space-y-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Master Mata Pelajaran (Modul Ajar & Bank Materi)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola daftar mata pelajaran resmi, ubah/rename nama mapel, dan satukan ejaan yang berbeda antar modul secara otomatis.
              </p>
            </div>
            {mapelSavedMsg && (
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full flex items-center space-x-1 font-bold animate-pulse">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{mapelSavedMsg}</span>
              </span>
            )}
          </div>

          {/* Master Mapel Summary Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block">Total Master Mapel</span>
                <span className="text-lg font-black text-emerald-950">{masterMapelList.length} Mapel</span>
              </div>
            </div>

            <div className="bg-teal-50/80 border border-teal-200 p-3.5 rounded-xl flex items-center space-x-3">
              <div className="p-2.5 bg-teal-600 text-white rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block">Modul Ajar Terhubung</span>
                <span className="text-lg font-black text-teal-950">
                  {(Object.values(mapelUsageStats) as Array<{ modulesCount: number; bankCount: number }>).reduce((acc, curr) => acc + curr.modulesCount, 0)} Modul
                </span>
              </div>
            </div>

            <div className="bg-indigo-50/80 border border-indigo-200 p-3.5 rounded-xl flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block">Topik Bank Materi</span>
                <span className="text-lg font-black text-indigo-950">
                  {(Object.values(mapelUsageStats) as Array<{ modulesCount: number; bankCount: number }>).reduce((acc, curr) => acc + curr.bankCount, 0)} Topik
                </span>
              </div>
            </div>
          </div>

          {/* Discrepancy / Similar Spelled Mapels Warning Banner */}
          {mapelDiscrepancies.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Terdeteksi Kemungkinan Ketidakcocokan Ejaan Mapel ({mapelDiscrepancies.length})</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Beberapa modul atau bank materi memiliki ejaan nama mapel yang sedikit berbeda (misal: "Fikih" vs "Fiqih"). Anda dapat menyatukan ejaan ini agar seluruh modul dan bank materi seragam.
              </p>
              <div className="space-y-1.5 pt-1">
                {mapelDiscrepancies.map((pair, idx) => (
                  <div key={idx} className="bg-white/80 p-2 rounded-xl border border-amber-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="font-medium text-slate-800">
                      <strong>"{pair.mapelA}"</strong> ↔ <strong>"{pair.mapelB}"</strong> ({pair.reason})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleMergeMapelSubmit(pair.mapelB);
                        setTargetMergeMapel(pair.mapelA);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-colors inline-flex items-center space-x-1"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Satukan ke "{pair.mapelA}"</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Tambah Master Mapel */}
          <form onSubmit={handleAddMasterMapel} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Tambah Mata Pelajaran Baru</span>
            </h4>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMapelInput}
                onChange={(e) => setNewMapelInput(e.target.value)}
                placeholder="Misal: Bahasa Sunda, Muatan Lokal Robotik, Seni Rupa..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <button
                type="submit"
                disabled={!newMapelInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mapel</span>
              </button>
            </div>
          </form>

          {/* Search Bar & List Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchMapel}
                onChange={(e) => setSearchMapel(e.target.value)}
                placeholder="Cari nama mata pelajaran..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleSyncAllModules}
                title="Sinkronkan ejaan seluruh Modul Ajar dan Bank Materi dengan Master Mapel"
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sinkronkan Seluruh Modul</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  refreshMapels();
                  setMapelSavedMsg('Daftar Master Mapel berhasil diperbarui dan disegarkan!');
                  setTimeout(() => setMapelSavedMsg(null), 3000);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Master Mapel</span>
              </button>
            </div>
          </div>

          {/* Section Mapel Dihapus / Disembunyikan jika ada */}
          {deletedMapelList.length > 0 && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-900">
                    Mata Pelajaran Dihapus / Disembunyikan ({deletedMapelList.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRestoreAllMapels}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Pulihkan Semua</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-800">
                Mapel di bawah ini saat ini disembunyikan dari Master Mapel. Klik <strong>Pulihkan</strong> jika ingin memunculkannya kembali ke daftar aktif.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {deletedMapelList.map((delMapel, idx) => (
                  <div
                    key={`del-${delMapel}-${idx}`}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-amber-300 text-amber-900 text-xs font-semibold rounded-xl shadow-2xs"
                  >
                    <span>{delMapel}</span>
                    <button
                      type="button"
                      onClick={() => handleRestoreMapel(delMapel)}
                      title="Pulihkan mapel ini"
                      className="ml-1 px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-md transition-colors cursor-pointer flex items-center space-x-0.5"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Pulihkan</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Master Mapel Item Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {masterMapelList
              .filter(m => m.toLowerCase().includes(searchMapel.toLowerCase()))
              .map((mapel, idx) => {
                const isDefault = MAPEL_MI_OPTIONS.includes(mapel);
                const stats = mapelUsageStats[mapel] || { modulesCount: 0, bankCount: 0 };
                const isEditing = editingMapel === mapel;
                const isMerging = mergingMapel === mapel;

                return (
                  <div
                    key={`${mapel}-${idx}`}
                    className="p-3.5 bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl shadow-2xs space-y-2 transition-all"
                  >
                    {isEditing ? (
                      /* Editing / Renaming Mode */
                      <div className="space-y-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                          Ubah Nama Mapel (Otomatis perbarui seluruh modul)
                        </span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={renameInput}
                            onChange={(e) => setRenameInput(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Nama mapel baru..."
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameMapelSubmit(mapel)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMapel(null)}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : isMerging ? (
                      /* Merging Mode */
                      <div className="space-y-2 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-200">
                        <span className="text-[10px] font-bold text-indigo-900 uppercase block">
                          Gabungkan "{mapel}" ke Mapel lain:
                        </span>
                        <div className="flex items-center space-x-2">
                          <select
                            value={targetMergeMapel}
                            onChange={(e) => setTargetMergeMapel(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-medium outline-none"
                          >
                            <option value="">-- Pilih Mapel Tujuan --</option>
                            {masterMapelList
                              .filter(m => m !== mapel)
                              .map((m, idx) => (
                                <option key={`${m}-${idx}`} value={m}>{m}</option>
                              ))}
                          </select>
                          <button
                            type="button"
                            disabled={!targetMergeMapel}
                            onClick={() => handleMergeMapelSubmit(mapel)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-2xs"
                          >
                            Gabungkan
                          </button>
                          <button
                            type="button"
                            onClick={() => setMergingMapel(null)}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Standard Card Display */
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className="text-xs font-extrabold text-slate-900">
                              {mapel}
                            </h4>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                isDefault
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              {isDefault ? 'Default MI' : 'Kustom'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600 border border-slate-200">
                              📄 {stats.modulesCount} Modul Ajar
                            </span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600 border border-slate-200">
                              📚 {stats.bankCount} Bank Materi
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMapel(mapel);
                              setRenameInput(mapel);
                            }}
                            title="Ubah nama mapel ini di seluruh modul"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMergingMapel(mapel);
                              setTargetMergeMapel('');
                            }}
                            title="Gabungkan ejaan mapel ini ke mapel lain"
                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMapelItem(mapel)}
                            title="Hapus mata pelajaran dari Master Mapel"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Mapel */}
      {deletingMapelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Mata Pelajaran?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Anda akan menghapus <span className="font-bold text-slate-800">"{deletingMapelModal}"</span> dari daftar Master Mapel.
                </p>
              </div>
            </div>

            {(() => {
              const stats = mapelUsageStats[deletingMapelModal];
              const totalUsage = (stats?.modulesCount || 0) + (stats?.bankCount || 0);
              if (totalUsage > 0) {
                return (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-1">
                    <p className="font-bold">⚠️ Perhatian Usage Modul:</p>
                    <p>Mata pelajaran ini terdeteksi pada <strong>{stats?.modulesCount || 0} Modul Ajar</strong> dan <strong>{stats?.bankCount || 0} Bank Materi</strong>. Menghapusnya dari Master Mapel tidak menghapus berkas modul Anda, namun tidak akan muncul lagi di pilihan dropdown baru.</p>
                  </div>
                );
              }
              return (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  Mata pelajaran ini akan disembunyikan dari pilihan Master Mapel dan dapat ditambahkan kembali kapan saja jika diperlukan.
                </p>
              );
            })()}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingMapelModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = deletingMapelModal;
                  setDeletingMapelModal(null);
                  executeDeleteMapelItem(target);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Mapel Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 0: Pengaturan Profil Madrasah */}
      {activeTab === 'madrasah' && (
        <div className="space-y-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan &amp; Profil Madrasah Lengkap</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola profil madrasah aktif, NSM/NPSN, identitas kepala madrasah, alamat resmi, dan integrasi Kop Surat/TTD.
              </p>
            </div>
            {onOpenMadrasahModal && (
              <button
                type="button"
                onClick={onOpenMadrasahModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 shrink-0"
              >
                <Building2 className="w-4 h-4" />
                <span>Buka Pengelola Multi-Madrasah</span>
              </button>
            )}
          </div>

          {/* Active Madrasah Overview Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 space-y-4 shadow-md border border-slate-700">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                      MADRASAH AKTIF
                    </span>
                    {(mAkreditasi || activeMadrasah?.akreditasi) && (
                      <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30">
                        Akreditasi {mAkreditasi || activeMadrasah?.akreditasi}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-1">
                    {mNama || activeMadrasah?.nama || kopSurat.namaMadrasah || "MI Ma'arif NU 2 Sanggreman"}
                  </h4>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-700/80">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">NSM</span>
                <span className="font-mono font-bold text-slate-100 text-xs">
                  {mNsm || activeMadrasah?.nsm || activeMadrasah?.nsmOrNpsn || '-'}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">NPSN</span>
                <span className="font-mono font-bold text-slate-100 text-xs">
                  {mNpsn || activeMadrasah?.npsn || '-'}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Kepala Madrasah</span>
                <span className="font-bold text-slate-100 text-xs truncate block">
                  {mKepala || activeMadrasah?.kepalaMadrasah || ttd?.kepalaMadrasahNama || '-'}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Status / Yayasan</span>
                <span className="font-bold text-slate-100 text-xs truncate block">
                  {mStatus} ({mYayasan ? mYayasan.replace(/^Lembaga Pendidikan\s*/i, '') : 'LP Ma\'arif NU'})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <p className="text-slate-300 text-[11px] truncate">
                <strong className="text-slate-100">Alamat:</strong> {mAlamatLengkap || mAlamat || activeMadrasah?.alamatLengkap || kopSurat.alamatMadrasah || '-'}
              </p>
            </div>
          </div>

          {/* Form Edit Profil Madrasah Aktif */}
          <form onSubmit={handleSaveActiveMadrasahProfile} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center space-x-2">
                <PenTool className="w-4 h-4 text-emerald-600" />
                <span>Form Edit Profil Madrasah Aktif</span>
              </h4>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setMCetakModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  title="Cetak Laporan Profil Madrasah EMIS Format Resmi"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Profil EMIS</span>
                </button>
                {mSavedMsg && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl flex items-center space-x-1 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{mSavedMsg}</span>
                  </span>
                )}
              </div>
            </div>

            {/* SEKSI 1: INFORMASI UTAMA & NAUNGAN */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <h5 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>1. Informasi Utama &amp; Naungan</span>
              </h5>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Resmi Madrasah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={mNama}
                  onChange={(e) => setMNama(e.target.value)}
                  placeholder="Contoh: MI Ma'arif NU 2 Sanggreman"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Singkat / Identitas
                  </label>
                  <input
                    type="text"
                    value={mKode}
                    onChange={(e) => setMKode(e.target.value)}
                    placeholder="MIMNU2SANGGREMAN"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Sekolah
                  </label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Swasta">Swasta (LP Ma'arif NU)</option>
                    <option value="Negeri">Negeri (Kemenag)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peringkat Akreditasi
                  </label>
                  <select
                    value={mAkreditasi}
                    onChange={(e) => setMAkreditasi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="A (Unggul)">A (Unggul)</option>
                    <option value="B (Baik)">B (Baik)</option>
                    <option value="C">C</option>
                    <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yayasan / Naungan / Instansi Atas
                </label>
                <input
                  type="text"
                  value={mYayasan}
                  onChange={(e) => setMYayasan(e.target.value)}
                  placeholder="Lembaga Pendidikan Ma'arif NU Banyumas"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* SEKSI 2: LEGALITAS (NSM & NPSN) */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <h5 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <Hash className="w-4 h-4 text-emerald-600" />
                <span>2. Identitas Legalitas (NSM &amp; NPSN)</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Statistik Madrasah (NSM)
                  </label>
                  <input
                    type="text"
                    value={mNsm}
                    onChange={(e) => setMNsm(e.target.value)}
                    placeholder="111233020054 (12 Digit)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Pokok Sekolah Nasional (NPSN)
                  </label>
                  <input
                    type="text"
                    value={mNpsn}
                    onChange={(e) => setMNpsn(e.target.value)}
                    placeholder="60712345 (8 Digit)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* SEKSI 3: KEPALA MADRASAH */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <h5 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3. Kepala Madrasah &amp; Penanggung Jawab</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kepala Madrasah (Beserta Gelar)
                  </label>
                  <input
                    type="text"
                    value={mKepala}
                    onChange={(e) => setMKepala(e.target.value)}
                    placeholder="Contoh: JAENAL MASKUN, S.Pd.I."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP / NPK Kepala Madrasah
                  </label>
                  <input
                    type="text"
                    value={mNipKepala}
                    onChange={(e) => setMNipKepala(e.target.value)}
                    placeholder="Contoh: 198205122009011003 atau -"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* SEKSI 4: ALAMAT LENGKAP & WILAYAH */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <h5 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>4. Alamat Lengkap &amp; Wilayah Administrasi</span>
              </h5>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jalan / RT / RW / Dusun
                </label>
                <input
                  type="text"
                  value={mAlamat}
                  onChange={(e) => setMAlamat(e.target.value)}
                  placeholder="Jl. Ma'arif No. 02 RT 03 RW 01"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Desa / Kelurahan</label>
                  <input
                    type="text"
                    value={mDesa}
                    onChange={(e) => setMDesa(e.target.value)}
                    placeholder="Sanggreman"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={mKecamatan}
                    onChange={(e) => setMKecamatan(e.target.value)}
                    placeholder="Rawalo"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
                  <input
                    type="text"
                    value={mKota}
                    onChange={(e) => setMKota(e.target.value)}
                    placeholder="Kab. Banyumas"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={mProvinsi}
                    onChange={(e) => setMProvinsi(e.target.value)}
                    placeholder="Jawa Tengah"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={mKodePos}
                    onChange={(e) => setMKodePos(e.target.value)}
                    placeholder="53173"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap Cetak (Otomatis Sync ke Kop Surat)
                </label>
                <input
                  type="text"
                  value={mAlamatLengkap}
                  onChange={(e) => setMAlamatLengkap(e.target.value)}
                  placeholder="Jl. Ma'arif No. 02, Sanggreman, Kec. Rawalo, Kab. Banyumas, Jawa Tengah 53173"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* SEKSI 5: KONTAK & MEDIA INFORMASI */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <h5 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>5. Kontak &amp; Media Informasi</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Telp / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={mKontak}
                    onChange={(e) => setMKontak(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Resmi Madrasah
                  </label>
                  <input
                    type="email"
                    value={mEmail}
                    onChange={(e) => setMEmail(e.target.value)}
                    placeholder="mimaarifnu2sanggreman@gmail.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Situs Web Resmi
                  </label>
                  <input
                    type="text"
                    value={mWebsite}
                    onChange={(e) => setMWebsite(e.target.value)}
                    placeholder="https://maarifnubanyumas.or.id"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={mSaveStatus === 'saving'}
                className={`px-6 py-2.5 text-xs font-black rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer ${
                  mSaveStatus === 'saved'
                    ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-105'
                    : mSaveStatus === 'saving'
                    ? 'bg-emerald-700 text-white opacity-80 cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                }`}
              >
                {mSaveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan &amp; Menyinkronkan Profil...</span>
                  </>
                ) : mSaveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>✓ Profil Madrasah Berhasil Disimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan &amp; Sinkronkan Profil Madrasah</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Notice Card */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-2">
            <h4 className="font-bold flex items-center space-x-1.5 text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Multi-Tenant Madrasah System (Aman &amp; Terisolasi)</span>
            </h4>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              Setiap madrasah terdaftar memiliki basis data modul ajar dan guru tersendiri. Sebagai Admin/Guru Madrasah, Anda dapat mengubah informasi di atas kapan saja. Perubahan akan otomatis disinkronkan ke Kop Surat dan TTD.
            </p>
          </div>
        </div>
      )}

      {/* Tab Content 1: Kop Surat & Logo */}
      {activeTab === 'kop' && (
        <form onSubmit={handleSaveKop} className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Format Kop Surat Resmi Madrasah</span>
            </h3>
            {kopSaved && (
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center space-x-1 font-bold animate-pulse">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kop Surat Tersimpan!</span>
              </span>
            )}
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Logo Madrasah / Kementerian Agama</label>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="w-20 h-20 bg-white rounded-xl border border-slate-300 flex items-center justify-center overflow-hidden relative shrink-0 shadow-2xs">
                {kopForm.logoUrl ? (
                  <img src={kopForm.logoUrl} alt="Logo Madrasah" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                <p className="text-[11px] text-slate-500">
                  Upload logo resmi (PNG/JPG maks 3MB). Logo akan muncul di bagian header Kop Surat dokumen Modul Ajar.
                </p>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-bold transition-all shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {kopForm.logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setKopForm(prev => {
                          const updated = { ...prev, logoUrl: null };
                          onSaveKopSurat(updated);
                          pushLocalDataToCloud().catch(err => console.error(err));
                          return updated;
                        });
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all border border-rose-200 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-700 font-bold block">Nama Kantor Kemenag / Dinas</label>
              <input
                type="text"
                value={kopForm.namaKantor}
                onChange={e => setKopForm({ ...kopForm, namaKantor: e.target.value })}
                placeholder="misal: LEMBAGA PENDIDIKAN MA'ARIF NU BANYUMAS"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-700 font-bold block">Nama Madrasah / Sekolah</label>
              <input
                type="text"
                value={kopForm.namaMadrasah}
                onChange={e => setKopForm({ ...kopForm, namaMadrasah: e.target.value })}
                placeholder="misal: MADRASAH IBTIDAIYAH NEGERI 1 BANYUMAS"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-emerald-800 font-bold focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-700 font-bold block">Alamat Lengkap Madrasah</label>
              <input
                type="text"
                value={kopForm.alamatMadrasah}
                onChange={e => setKopForm({ ...kopForm, alamatMadrasah: e.target.value })}
                placeholder="misal: Jl. Pemuda No. 12, Purwokerto, Jawa Tengah"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Kontak (Telepon / Email)</label>
              <input
                type="text"
                value={kopForm.kontakMadrasah}
                onChange={e => setKopForm({ ...kopForm, kontakMadrasah: e.target.value })}
                placeholder="misal: Telp: (0281) 635123 | Email: min1banyumas@kemenag.go.id"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Website Madrasah</label>
              <input
                type="text"
                value={kopForm.website}
                onChange={e => setKopForm({ ...kopForm, website: e.target.value })}
                placeholder="misal: www.min1banyumas.sch.id"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Live Kop Preview Box */}
          <div className="space-y-1 pt-2">
            <span className="text-[11px] text-slate-500 font-bold">Pratinjau Kop Surat Dokumen:</span>
            <div className="bg-white text-black p-4 rounded-xl border border-slate-300 text-center font-serif text-xs space-y-1 shadow-2xs">
              <div className="flex items-center justify-center space-x-3">
                {kopForm.logoUrl && (
                  <img src={kopForm.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                )}
                <div>
                  <h5 className="font-bold uppercase text-[11px] text-slate-800 leading-tight">
                    {kopForm.namaKantor || "LEMBAGA PENDIDIKAN MA'ARIF NU BANYUMAS"}
                  </h5>
                  <h3 className="font-extrabold uppercase text-xs text-emerald-900 leading-tight">
                    {kopForm.namaMadrasah || 'MADRASAH IBTIDAIYAH NEGERI 1 BANYUMAS'}
                  </h3>
                  <p className="text-[9px] font-sans text-slate-600 mt-0.5">
                    {kopForm.alamatMadrasah} | {kopForm.kontakMadrasah}
                  </p>
                </div>
              </div>
              <div className="border-b-2 border-black pt-2"></div>
              <div className="border-b border-black -mt-0.5"></div>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs mt-2 cursor-pointer ${
              kopSaved
                ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-[1.01]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
            }`}
          >
            {kopSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>✓ Pengaturan Kop Surat Berhasil Disimpan!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Kop Surat</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab Content 2: Penandatangan TTD */}
      {activeTab === 'ttd' && (
        <form onSubmit={handleSaveTTD} className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <PenTool className="w-4 h-4 text-emerald-600" />
              <span>Data Penandatangan Dokumen Modul Ajar</span>
            </h3>
            {ttdSaved && (
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center space-x-1 animate-pulse font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Data TTD Tersimpan!</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Tempat & Tanggal Penetapan (Otomatis vs Manual) */}
            <div className="space-y-2 sm:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-slate-200 pb-2">
                <div>
                  <label className="text-slate-800 font-extrabold text-xs block">Tempat & Tanggal Penetapan Dokumen</label>
                  <p className="text-[11px] text-slate-500">Pilih mode penanggalan untuk dokumen cetak modul ajar.</p>
                </div>
                <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-300 shadow-2xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setTtdForm({ ...ttdForm, tanggalMode: 'otomatis' })}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      ttdForm.tanggalMode !== 'manual'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📅 Otomatis
                  </button>
                  <button
                    type="button"
                    onClick={() => setTtdForm({ ...ttdForm, tanggalMode: 'manual' })}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      ttdForm.tanggalMode === 'manual'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✏️ Manual
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-700 font-bold text-[11px] block mb-1">Tempat / Kota Penetapan</label>
                  <input
                    type="text"
                    value={ttdForm.tempatPenetapan}
                    onChange={e => setTtdForm({ ...ttdForm, tempatPenetapan: e.target.value })}
                    placeholder="misal: Sanggreman / Rawalo / Banyumas"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold text-[11px] block mb-1">
                    {ttdForm.tanggalMode === 'manual' ? 'Tanggal Penetapan (Manual)' : 'Tanggal Penetapan (Otomatis)'}
                  </label>
                  {ttdForm.tanggalMode === 'manual' ? (
                    <input
                      type="text"
                      value={ttdForm.tanggalPenetapanManual || ttdForm.tanggalPenetapan}
                      onChange={e => setTtdForm({ ...ttdForm, tanggalPenetapan: e.target.value, tanggalPenetapanManual: e.target.value })}
                      placeholder="misal: 24 Juli 2026"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-xl px-3 py-2 text-emerald-900 font-semibold text-[11px] flex items-center justify-between">
                      <span>Mengikuti tanggal pembuatan modul ajar</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-950 font-bold px-2 py-0.5 rounded">
                        Aktif
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kepala Madrasah Section */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Kepala Madrasah</span>
              </h4>
              <div className="space-y-1.5">
                <div>
                  <label className="text-slate-600 font-semibold text-[11px] block">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    value={ttdForm.kepalaMadrasahNama}
                    onChange={e => setTtdForm({ ...ttdForm, kepalaMadrasahNama: e.target.value })}
                    placeholder="misal: Siti Rochimah, S.Pd.I."
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold text-[11px] block">NIP Kepala Madrasah</label>
                  <input
                    type="text"
                    value={ttdForm.kepalaMadrasahNIP}
                    onChange={e => setTtdForm({ ...ttdForm, kepalaMadrasahNIP: e.target.value })}
                    placeholder="misal: 19780512 200501 2 006"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Guru Kelas / Mapel Section */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Guru Kelas / Penyusun</span>
              </h4>
              <div className="space-y-1.5">
                <div>
                  <label className="text-slate-600 font-semibold text-[11px] block">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    value={ttdForm.guruKelasNama}
                    onChange={e => setTtdForm({ ...ttdForm, guruKelasNama: e.target.value })}
                    placeholder="misal: Jaenal Maskun, S.Pd.I."
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold text-[11px] block">NIP Guru</label>
                  <input
                    type="text"
                    value={ttdForm.guruKelasNIP}
                    onChange={e => setTtdForm({ ...ttdForm, guruKelasNIP: e.target.value })}
                    placeholder="misal: 19850314 201001 1 012"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold text-[11px] block">Jabatan Guru</label>
                  <input
                    type="text"
                    value={ttdForm.jabatanGuru}
                    onChange={e => setTtdForm({ ...ttdForm, jabatanGuru: e.target.value })}
                    placeholder="misal: Guru Kelas III / Penyusun"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live TTD Preview Box */}
          <div className="space-y-1 pt-2">
            <span className="text-[11px] text-slate-500 font-bold">Pratinjau Blok TTD di Dokumen Cetak (Format Resmi):</span>
            <div className="bg-white text-black p-4 rounded-xl border border-slate-300 text-xs shadow-2xs">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="invisible text-[11px] select-none">-</p>
                    <p className="font-semibold text-slate-800 text-[11px]">Mengetahui,</p>
                    <p className="font-semibold text-slate-800 text-[11px]">Kepala Madrasah</p>
                  </div>
                  <div className="h-14"></div>
                  <div>
                    <p className="font-bold text-slate-900 underline">{ttdForm.kepalaMadrasahNama || 'Nama Kepala Madrasah'}</p>
                    <p className="text-[10px] text-slate-700">NIP. {ttdForm.kepalaMadrasahNIP || '-'}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-800 text-center">
                      {ttdForm.tempatPenetapan || 'Banyumas'}, {
                        ttdForm.tanggalMode === 'manual'
                          ? (ttdForm.tanggalPenetapanManual || ttdForm.tanggalPenetapan || '24 Juli 2026')
                          : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      }
                    </p>
                    <p className="font-semibold text-slate-800 text-[11px]">Guru Kelas / Penyusun,</p>
                    <p className="font-semibold text-slate-800 text-[11px]">{ttdForm.jabatanGuru || 'Guru Kelas'}</p>
                  </div>
                  <div className="h-14"></div>
                  <div>
                    <p className="font-bold text-slate-900 underline">{ttdForm.guruKelasNama || 'Nama Guru'}</p>
                    <p className="text-[10px] text-slate-700">NIP. {ttdForm.guruKelasNIP || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs mt-2 cursor-pointer ${
              ttdSaved
                ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-[1.01]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
            }`}
          >
            {ttdSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>✓ Data Penandatangan TTD Berhasil Disimpan!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Data Penandatangan TTD</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab Content 3: API Key */}
      {activeTab === 'api' && (
        <form onSubmit={handleSaveApi} className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Key className="w-4 h-4 text-emerald-600" />
              <span>Konfigurasi API Key Gemini AI</span>
            </h3>
            {keySaved && (
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center space-x-1 font-bold animate-pulse">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>API Key Tersimpan!</span>
              </span>
            )}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-slate-700 space-y-1.5">
            <div className="flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Generasi Tercepat & Akurat</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Aplikasi ini menggunakan model AI Gemini 3.6 Flash untuk teks penyusunan modul lengkap 7 seksi dan Gemini 3.1 Flash Lite Image untuk pembuatan ilustrasi visual media digital. Jika Anda memasukkan API Key khusus di sini, aplikasi akan memprioritaskan API Key Anda. Jika dikosongkan, backend akan menggunakan API Key bawaan lingkungan.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Kunci API Gemini (Gemini API Key)</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="misal: AIzaSy..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 pr-10 focus:outline-none focus:border-emerald-500 font-mono font-medium"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start space-x-2 font-medium ${
                testResult.success
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="submit"
              className={`flex-1 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer ${
                keySaved
                  ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-[1.01]'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              }`}
            >
              {keySaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>✓ API Key Berhasil Disimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan API Key</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testingKey}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all border border-slate-300 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{testingKey ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab Content 4: Tahun Ajaran Aktif */}
      {activeTab === 'tahun' && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Tahun Ajaran Aktif (Global Default)</span>
            </h3>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-2 text-slate-700">
            <p className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
              <span>📌 Tahun Ajaran Aktif Berlakunya Statis</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tahun ajaran yang Anda pilih di bawah ini akan digunakan secara otomatis sebagai **default bawaan** di seluruh formulir pembuatan modul ajar baru (Mode AI & Manual) serta Bank Materi. Anda cukup mengubahnya sekali di sini saat terjadi pergantian tahun pelajaran baru.
            </p>
          </div>

          {tahunSaveMsg && (
            <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{tahunSaveMsg}</span>
            </div>
          )}

          {/* Active Year Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Pilih Tahun Ajaran Aktif Saat Ini:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <select
                value={activeTahun}
                onChange={e => handleSelectActiveTahun(e.target.value)}
                className="flex-1 bg-white border border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              >
                {allTahunList.map((t, idx) => (
                  <option key={idx} value={t} className="bg-white text-slate-900">
                    Tahun Ajaran: {t} {t === activeTahun ? '(AKTIF)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleSelectActiveTahun(activeTahun)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shrink-0 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Tahun Ajaran</span>
              </button>
            </div>
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Status Terpasang: Tahun Ajaran {activeTahun} (AKTIF)</span>
            </div>
          </div>

          {/* Form Add New Dynamic Academic Year */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-700 block flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Tambah Opsi Tahun Ajaran Baru (Dinamis)</span>
            </label>
            <form onSubmit={handleAddTahunInSettings} className="flex items-center space-x-2">
              <input
                type="text"
                value={newTahunInput}
                onChange={e => setNewTahunInput(e.target.value)}
                placeholder="misal: 2028/2029, 2029/2030"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs shrink-0 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah & Aktifkan</span>
              </button>
            </form>
            <p className="text-[10px] text-slate-500">
              Format: YYYY/YYYY (Contoh: 2028/2029). Tahun ajaran baru akan otomatis tersimpan dan tersedia di seluruh dropdown aplikasi.
            </p>
          </div>

          {/* List of Registered Academic Years */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Daftar Tahun Ajaran Terdaftar di Sistem:
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {allTahunList.map((t, idx) => {
                const isActive = t === activeTahun;
                return (
                  <button
                    key={`${t}-${idx}`}
                    type="button"
                    onClick={() => handleSelectActiveTahun(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{t}</span>
                    {isActive && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Tab Content 5: PIN Mode Guru */}
      {activeTab === 'pin' && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan PIN Keamanan Mode Guru</span>
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            PIN ini digunakan untuk mengunci Dashboard Guru ketika Anda membagikan link kuis atau membuka tampilan Mode Siswa. Siswa tidak dapat mengakses menu pembuat modul atau data guru tanpa memasukkan PIN ini.
          </p>

          {pinSavedMsg && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2 font-bold animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pinSavedMsg}</span>
            </div>
          )}

          <form onSubmit={handleSavePin} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-2 max-w-sm">
              <label className="text-xs font-bold text-slate-700 block flex items-center space-x-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>PIN Akses Dashboard Guru:</span>
              </label>
              <div className="relative">
                <input
                  type={showPinText ? 'text' : 'password'}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="Masukkan PIN Baru (misal: 1234)..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold tracking-widest text-slate-900 focus:outline-none focus:border-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPinText(!showPinText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Default PIN saat ini adalah <code className="bg-slate-200 px-1.5 py-0.5 rounded text-emerald-800 font-bold border border-slate-300">1234</code>. Anda dapat menggantinya sesuai keinginan.
              </p>
            </div>

            <button
              type="submit"
              className={`font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-xs cursor-pointer ${
                pinSavedMsg
                  ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-[1.01]'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              }`}
            >
              {pinSavedMsg ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>✓ PIN Guru Berhasil Disimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan PIN Guru</span>
                </>
              )}
            </button>
          </form>

          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-1.5">
            <p className="font-bold text-emerald-900 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Bagaimana Mode Siswa Bekerja?</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
              <li>Saat Anda membagikan link kuis ke siswa (menggunakan tombol <strong>Salin Link Kuis Siswa</strong>), siswa langsung berada dalam tampilan kuis.</li>
              <li>Jika siswa menekan tombol <strong>Mode Guru</strong>, sistem akan meminta PIN ini terlebih dahulu.</li>
              <li>Selama PIN belum diisi dengan benar, Dashboard Guru, Modul Ajar, dan Pengaturan tetap aman terproteksi.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab Content 5.1: Kelola Password Proteksi Dokumen Cetak Publik */}
      {activeTab === 'doc_protection' && (
        <div className="space-y-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3.5 gap-2.5">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-800 border border-emerald-200 shadow-2xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <span>Kelola Password Proteksi Dokumen Cetak Publik</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cukup 1 password bersama untuk seluruh dokumen modul ajar publik. Password dapat diubah sewaktu-waktu oleh Admin.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {docProtConfig.enabled ? (
                <span className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1.5 rounded-full font-bold shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Proteksi Aktif (Terkunci)</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-600 border border-slate-300 text-xs px-3 py-1.5 rounded-full font-bold">
                  <Unlock className="w-4 h-4 text-slate-500" />
                  <span>Proteksi Non-Aktif (Terbuka)</span>
                </span>
              )}
            </div>
          </div>

          {docProtSavedMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs px-4 py-3 rounded-xl flex items-center justify-between font-bold shadow-xs animate-fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{docProtSavedMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setDocProtSavedMsg(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-black cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSaveDocProtection} className="space-y-4">
            {/* Master Toggle */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-800 block cursor-pointer" onClick={() => setDocProtConfig(prev => ({ ...prev, enabled: !prev.enabled }))}>
                  Status Proteksi Password Dokumen
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Bila diaktifkan, pengunjung halaman publik wajib memasukkan password sebelum melihat atau mencetak dokumen modul ajar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDocProtConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  docProtConfig.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    docProtConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Password Configuration */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>Kata Sandi Dokumen (1 Password untuk Semua Dokumen):</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomDocPassword}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200/80 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all flex items-center space-x-1 cursor-pointer"
                    title="Buat kata sandi acak baru"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Generate Password Acak</span>
                  </button>
                </div>

                <div className="relative max-w-md">
                  <input
                    type={showDocProtPass ? 'text' : 'password'}
                    value={docProtConfig.password}
                    onChange={e => setDocProtConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Contoh: KBC2026 atau madrasahhebat"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-20 py-2.5 text-sm font-extrabold text-slate-900 tracking-wider focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowDocProtPass(!showDocProtPass)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title={showDocProtPass ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showDocProtPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {docProtConfig.password && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(docProtConfig.password);
                          setDocProtSavedMsg(`Kata sandi "${docProtConfig.password}" berhasil disalin ke clipboard!`);
                          setTimeout(() => setDocProtSavedMsg(null), 3000);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Salin kata sandi"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Password ini berlaku untuk seluruh modul ajar yang dicetak melalui halaman publik. Guru/Admin yang login di dashboard tidak akan diminta password ini.
                </p>
              </div>

              {/* Custom Notice Message */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Pesan / Petunjuk untuk Pengunjung Publik:
                </label>
                <textarea
                  rows={2}
                  value={docProtConfig.customMessage || ''}
                  onChange={e => setDocProtConfig(prev => ({ ...prev, customMessage: e.target.value }))}
                  placeholder="Contoh: Dokumen ini diproteksi oleh Madrasah. Silakan hubungi Guru Pengajar atau Admin untuk mendapatkan password cetak."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Pesan ini akan tampil di layar pengunjung saat mereka membuka dokumen yang terkunci.
                </p>
              </div>
            </div>

            {/* Riwayat Pembaruan */}
            {docProtConfig.lastUpdatedAt && (
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 px-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Terakhir diperbarui oleh <strong className="text-slate-700">{docProtConfig.lastUpdatedBy || 'Admin'}</strong> pada {new Date(docProtConfig.lastUpdatedAt).toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Proteksi Dokumen</span>
              </button>
            </div>
          </form>

          {/* Test Sandbox Box */}
          <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-teal-900">
              <KeyRound className="w-4 h-4 text-teal-700" />
              <span>Simulasi & Uji Coba Kata Sandi Publik</span>
            </div>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              Ketik kata sandi di bawah ini untuk mencoba apakah kata sandi yang Anda tentukan dapat membuka proteksi dokumen secara benar:
            </p>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={testInputDocPass}
                onChange={e => {
                  setTestInputDocPass(e.target.value);
                  if (testResultMsg) setTestResultMsg(null);
                }}
                placeholder="Ketik kata sandi uji coba..."
                className="bg-white border border-teal-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-600 flex-1"
              />
              <button
                type="button"
                onClick={handleTestDocPassword}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
              >
                Uji Sandi
              </button>
            </div>

            {testResultMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  testResultMsg.success
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                    : 'bg-rose-100 border border-rose-300 text-rose-900'
                }`}
              >
                {testResultMsg.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResultMsg.text}</span>
              </div>
            )}
          </div>

          {/* Panduan & Catatan Keamanan */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <p className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Ketentuan & Alur Kerja Proteksi Dokumen Cetak:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
              <li><strong>1 Password untuk Semua:</strong> Anda tidak perlu mengatur password per dokumen satu per satu. Cukup 1 password ini yang akan memproteksi seluruh modul ajar di halaman publik.</li>
              <li><strong>Dapat Diubah Kapan Saja:</strong> Admin atau Super Admin dapat mengubah password ini sewaktu-waktu (misalnya per semester atau tahun ajaran baru).</li>
              <li><strong>Akses Guru & Admin Otomatis:</strong> Guru dan Admin yang telah login di aplikasi ini tidak akan diminta password proteksi saat melihat/mencetak dokumen.</li>
              <li><strong>Sesi Pengunjung:</strong> Pengunjung publik yang telah berhasil memasukkan kata sandi 1 kali dalam sesi browsernya dapat membuka dokumen tanpa harus mengetik ulang berulang-ulang sampai tab ditutup.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab Content 5.5: Dynamic Supabase Connection */}
      {activeTab === 'supabase' && (
        <div className="space-y-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Integrasi & Keterhubungan Akun Supabase (Dynamic)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hubungkan database aplikasi ini dengan proyek Supabase pribadi Anda secara dinamis.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {supabaseForm.supabaseUrl && supabaseForm.supabaseAnonKey ? (
                <span className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Proyek Terkonfigurasi</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-800 border border-amber-300 text-xs px-3 py-1 rounded-full font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Belum Terkonfigurasi</span>
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
              {/* URL Supabase */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  1. Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="Contoh: https://xyzprojectid.supabase.co"
                  value={supabaseForm.supabaseUrl}
                  onChange={(e) => setSupabaseForm(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Dapatkan URL ini di Dashboard Supabase Anda: <strong>Project Settings &gt; API &gt; Project URL</strong>.
                </p>
              </div>

              {/* Anon API Key */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  2. Supabase Anon API Key (public)
                </label>
                <div className="relative">
                  <input
                    type={showSupabaseKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseForm.supabaseAnonKey}
                    onChange={(e) => setSupabaseForm(prev => ({ ...prev, supabaseAnonKey: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-10 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showSupabaseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Dapatkan Kunci API ini di Dashboard Supabase Anda: <strong>Project Settings &gt; API &gt; Project API keys (anon public)</strong>.
                </p>
              </div>

              {/* Table Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    3. Nama Tabel Supabase
                  </label>
                  <input
                    type="text"
                    placeholder="kbc_mi_app_settings"
                    value={supabaseForm.tableName || 'kbc_mi_app_settings'}
                    onChange={(e) => setSupabaseForm(prev => ({ ...prev, tableName: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer bg-white border border-slate-200 px-3.5 py-2 rounded-xl w-full">
                    <input
                      type="checkbox"
                      checked={supabaseForm.isEnabled}
                      onChange={(e) => setSupabaseForm(prev => ({ ...prev, isEnabled: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Aktifkan Sinkronisasi Supabase
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {supabaseSavedMsg && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{supabaseSavedMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="submit"
                className={`font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-xs cursor-pointer ${
                  supabaseSavedMsg
                    ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-[1.01]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                }`}
              >
                {supabaseSavedMsg ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>✓ Pengaturan Supabase Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={supabaseTesting || !supabaseForm.supabaseUrl || !supabaseForm.supabaseAnonKey}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${supabaseTesting ? 'animate-bounce text-amber-300' : 'text-amber-300'}`} />
                <span>{supabaseTesting ? 'Menguji Koneksi...' : 'Uji Koneksi Supabase'}</span>
              </button>

              <button
                type="button"
                onClick={handlePushSupabase}
                disabled={supabaseSyncing || !supabaseForm.supabaseUrl || !supabaseForm.supabaseAnonKey}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4 text-emerald-300" />
                <span>{supabaseSyncing ? 'Mengunggah...' : 'Unggah Data ke Supabase'}</span>
              </button>

              <button
                type="button"
                onClick={handlePullSupabase}
                disabled={supabaseSyncing || !supabaseForm.supabaseUrl || !supabaseForm.supabaseAnonKey}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 ${supabaseSyncing ? 'animate-spin' : ''}`} />
                <span>{supabaseSyncing ? 'Memuat...' : 'Muat Data dari Supabase'}</span>
              </button>
            </div>
          </form>

          {/* Result Alert Box */}
          {supabaseResult && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              supabaseResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center space-x-2 font-extrabold text-sm">
                {supabaseResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{supabaseResult.success ? 'Koneksi & Sync Supabase Berhasil!' : 'Pemberitahuan Supabase'}</span>
              </div>
              <p className="text-xs leading-relaxed font-medium pl-7">
                {supabaseResult.message}
              </p>
            </div>
          )}

          {/* Guide Note Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2 text-slate-700">
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-slate-900 flex items-center space-x-1.5 text-xs">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Skrip SQL Pembuatan Tabel & Akses Supabase (Bebas Error)</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  const tbl = supabaseForm.tableName || 'kbc_mi_app_settings';
                  const sqlText = `-- 1. Buat Tabel jika belum ada
CREATE TABLE IF NOT EXISTS ${tbl} (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buka Akses Tabel (Matikan RLS agar bebas Sync)
ALTER TABLE ${tbl} DISABLE ROW LEVEL SECURITY;`;
                  navigator.clipboard.writeText(sqlText);
                  alert('Skrip SQL berhasil disalin! Buka menu SQL Editor di Supabase, Paste lalu klik Run.');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] flex items-center space-x-1 transition-all shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin SQL Supabase</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Silakan buka menu <strong>SQL Editor</strong> di Dashboard Supabase Anda, buat New Query, lalu Salin, Paste, dan klik <strong>Run</strong> pada skrip SQL berikut:
            </p>
            <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto select-all leading-relaxed">
{`-- 1. Buat Tabel jika belum ada
CREATE TABLE IF NOT EXISTS ${supabaseForm.tableName || 'kbc_mi_app_settings'} (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buka Akses Tabel (Matikan RLS agar bebas Sync)
ALTER TABLE ${supabaseForm.tableName || 'kbc_mi_app_settings'} DISABLE ROW LEVEL SECURITY;`}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Database MySQL / Plesk / cPanel Hosting */}
      {activeTab === 'mysql' && (
        <div className="space-y-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Koneksi Database MySQL / Plesk Hosting</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hubungkan aplikasi ke database MySQL di hosting Plesk / cPanel / VPS Anda.
              </p>
            </div>
            {mysqlForm.lastSyncedAt && (
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span>Sync terakhir: {new Date(mysqlForm.lastSyncedAt).toLocaleString('id-ID')}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveMysqlConfig} className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
                <Server className="w-4 h-4 text-blue-600" />
                <span>Konfigurasi Server Database MySQL (Plesk / cPanel)</span>
              </div>
              <p className="text-xs text-blue-800/80 leading-relaxed">
                Aplikasi server backend akan langsung terhubung ke database MySQL hosting Anda untuk menyimpan dan menyinkronkan seluruh modul ajar, bank materi, dan data guru.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Database Host (Server MySQL) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: localhost, 127.0.0.1, atau rsl02.as.net.id / ip_server_plesk"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                    value={mysqlForm.host}
                    onChange={(e) => setMysqlForm(prev => ({ ...prev, host: e.target.value }))}
                  />
                  {(mysqlForm.host === '127.0.0.1' || mysqlForm.host === 'localhost') && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed space-y-1">
                      <div className="font-bold flex items-center space-x-1 text-amber-800">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Catatan Pengujian 'localhost' di Pratinjau Web AI Studio:</span>
                      </div>
                      <p className="text-slate-700">
                        Saat ini Anda menguji dari server Cloud AI Studio (bukan laptop/hosting Anda). Host <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">127.0.0.1 / localhost</code> di Cloud AI Studio tidak memiliki database MySQL aktif, sehingga tombol uji koneksi di sini akan menampilkan <em>ECONNREFUSED</em>.
                      </p>
                      <p className="text-emerald-800 font-medium">
                        ✅ <strong>Solusi:</strong> Unggah file <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono">hosting-dist.zip</code> dan <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono">api.php</code> ke Hosting Plesk/cPanel Anda. Saat dibuka dari web hosting Anda, koneksi <code className="font-mono">localhost</code> akan <strong>otomatis terhubung 100%</strong>.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Port MySQL
                  </label>
                  <input
                    type="number"
                    placeholder="3306"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={mysqlForm.port || 3306}
                    onChange={(e) => setMysqlForm(prev => ({ ...prev, port: Number(e.target.value) || 3306 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Database User <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: u12345_kbcuser"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={mysqlForm.user}
                    onChange={(e) => setMysqlForm(prev => ({ ...prev, user: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Database Password
                  </label>
                  <div className="relative">
                    <input
                      type={showMysqlPassword ? 'text' : 'password'}
                      placeholder="Password pengguna database"
                      className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      value={mysqlForm.password || ''}
                      onChange={(e) => setMysqlForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowMysqlPassword(!showMysqlPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showMysqlPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Database <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: u12345_kbc_db"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={mysqlForm.database}
                    onChange={(e) => setMysqlForm(prev => ({ ...prev, database: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Tabel MySQL
                  </label>
                  <input
                    type="text"
                    placeholder="kbc_mi_app_settings"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                    value={mysqlForm.tableName || 'kbc_mi_app_settings'}
                    onChange={(e) => setMysqlForm(prev => ({ ...prev, tableName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>API / Bridge URL <span className="text-slate-400 font-normal">(Opsional)</span></span>
                  </label>
                  <input
                    type="url"
                    placeholder="Contoh: https://madrasah.sch.id/api.php"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono text-slate-700"
                    value={mysqlForm.apiUrl || ''}
                    onChange={(e) => setMysqlForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">URL file <code>api.php</code> di cPanel/Plesk hosting jika menggunakan REST API endpoint.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>API Key / Token <span className="text-slate-400 font-normal">(Opsional)</span></span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: kbc_secret_key_12345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono text-slate-700"
                    value={mysqlForm.apiKey || ''}
                    onChange={(e) => setMysqlForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Kunci autentikasi pengaman untuk otorisasi akses API MySQL PHP Bridge.</p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mysqlForm.isEnabled}
                    onChange={(e) => setMysqlForm(prev => ({ ...prev, isEnabled: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Aktifkan Fitur Sync MySQL Hosting
                  </span>
                </label>

                <button
                  type="submit"
                  className={`px-4 py-2 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                    mysqlSavedMsg
                      ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-[1.01]'
                      : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                  }`}
                >
                  {mysqlSavedMsg ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>✓ MySQL Tersimpan!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Pengaturan MySQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {mysqlSavedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mysqlSavedMsg}</span>
            </div>
          )}

          {/* Controls: Test, Push, Pull */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTestMysql}
                disabled={mysqlTesting || !mysqlForm.host || !mysqlForm.user || !mysqlForm.database}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
              >
                <Zap className={`w-4 h-4 ${mysqlTesting ? 'animate-bounce text-amber-300' : 'text-amber-300'}`} />
                <span>{mysqlTesting ? 'Menguji Koneksi...' : 'Uji Koneksi MySQL'}</span>
              </button>

              <button
                type="button"
                onClick={handleDiagnoseMysql}
                disabled={mysqlDiagnosing || !mysqlForm.host || !mysqlForm.user || !mysqlForm.database}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-xs"
              >
                <Stethoscope className={`w-4 h-4 ${mysqlDiagnosing ? 'animate-spin' : ''}`} />
                <span>{mysqlDiagnosing ? 'Mendiagnosa (SELECT 1)...' : "Diagnosa MySQL ('SELECT 1')"}</span>
              </button>

              <button
                type="button"
                onClick={handlePushMysql}
                disabled={mysqlSyncing || !mysqlForm.host || !mysqlForm.user || !mysqlForm.database}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{mysqlSyncing ? 'Mengunggah...' : 'Unggah Data ke MySQL'}</span>
              </button>

              <button
                type="button"
                onClick={handlePullMysql}
                disabled={mysqlSyncing || !mysqlForm.host || !mysqlForm.user || !mysqlForm.database}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${mysqlSyncing ? 'animate-spin' : ''}`} />
                <span>{mysqlSyncing ? 'Memuat...' : 'Muat Data dari MySQL'}</span>
              </button>
            </div>

            {mysqlDiagnostic && (
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-3 transition-all ${
                mysqlDiagnostic.success
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/90 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center space-x-2">
                    {mysqlDiagnostic.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm tracking-tight">{mysqlDiagnostic.title}</h4>
                      {mysqlDiagnostic.latencyMs !== undefined && (
                        <p className="text-[11px] opacity-80">Waktu Respon (Latency): <strong>{mysqlDiagnostic.latencyMs} ms</strong></p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-extrabold uppercase tracking-wide border ${
                    mysqlDiagnostic.success
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {mysqlDiagnostic.code || (mysqlDiagnostic.success ? 'OK' : 'ERROR')}
                  </span>
                </div>

                {mysqlDiagnostic.queryResult && (
                  <div className="bg-white/80 border border-slate-200 rounded-lg p-2.5 font-mono text-[11px] space-y-1">
                    <div className="text-slate-500 font-sans font-semibold text-[10px] uppercase">Hasil Query 'SELECT 1':</div>
                    <div className="text-slate-800">{JSON.stringify(mysqlDiagnostic.queryResult)}</div>
                  </div>
                )}

                {mysqlDiagnostic.summary && (
                  <div>
                    <strong className="block text-slate-900 mb-0.5">Ringkasan Diagnosa:</strong>
                    <p className="text-slate-800">{mysqlDiagnostic.summary}</p>
                  </div>
                )}

                {mysqlDiagnostic.explanation && (
                  <div className="bg-white/90 border border-slate-200 rounded-lg p-3 space-y-1 text-slate-800">
                    <strong className="block text-blue-900 font-bold flex items-center space-x-1">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>Mengapa Ini Terjadi? (Penjelasan Teknis)</span>
                    </strong>
                    <p className="text-[11px] leading-relaxed text-slate-700">{mysqlDiagnostic.explanation}</p>
                  </div>
                )}

                {mysqlDiagnostic.solution && (
                  <div className="bg-emerald-100/80 border border-emerald-300 rounded-lg p-3 space-y-1.5 text-emerald-950">
                    <strong className="block text-emerald-900 font-extrabold flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Solusi & Langkah Selanjutnya:</span>
                    </strong>
                    <pre className="text-[11px] font-sans whitespace-pre-wrap leading-relaxed text-emerald-900 font-medium">
                      {mysqlDiagnostic.solution}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {mysqlResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start space-x-2.5 ${
                  mysqlResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {mysqlResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold mb-0.5">
                    {mysqlResult.success ? 'Koneksi & Sync MySQL Berhasil!' : 'Pemberitahuan MySQL'}
                  </div>
                  <div>{mysqlResult.message}</div>
                </div>
              </div>
            )}
          </div>

          {/* Instruction Card for phpMyAdmin / Plesk & PHP Bridge File */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 text-xs text-slate-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Skrip SQL DDL (Untuk phpMyAdmin Plesk):</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const tbl = mysqlForm.tableName || 'kbc_mi_app_settings';
                    const sqlText = `CREATE TABLE IF NOT EXISTS ${tbl} (
  madrasah_id VARCHAR(255) PRIMARY KEY,
  data LONGTEXT,
  updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
                    navigator.clipboard.writeText(sqlText);
                    alert('Skrip SQL MySQL berhasil disalin!');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] flex items-center space-x-1 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin SQL MySQL</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tabel akan otomatis dibuat ketika melakukan Uji Koneksi / Unggah Data. Jika Anda ingin membuat tabel secara manual di phpMyAdmin Plesk Hosting Anda, gunakan skrip berikut:
              </p>
              <div className="bg-slate-900 text-blue-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto select-all leading-relaxed">
{`CREATE TABLE IF NOT EXISTS ${mysqlForm.tableName || 'kbc_mi_app_settings'} (
  madrasah_id VARCHAR(255) PRIMARY KEY,
  data LONGTEXT,
  updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`}
              </div>
            </div>

            {/* PHP Bridge File & ZIP Download Section */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-slate-900">
                  <span className="flex items-center space-x-2 text-blue-900">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Paket ZIP Aplikasi Siap Unggah (Plesk / cPanel):</span>
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-md font-extrabold flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Siap Pakai</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSecureDownload('/api/download/hosting-dist.zip', 'hosting-dist.zip', true)}
                    disabled={!!downloadingFile}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-sm scale-[1.02] cursor-pointer disabled:opacity-50"
                  >
                    {downloadingFile === 'hosting-dist.zip' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Unduh hosting-dist.zip (1.2 MB)</span>
                  </button>
                </div>
                <p className="text-[11px] text-blue-800/90 leading-relaxed">
                  File ZIP ini berisi seluruh hasil kompilasi web statis (`index.html`, `assets/`, `api.php`, `.htaccess`, dan `database.sql`). Cukup unduh lalu ekstrak langsung ke dalam folder <strong>httpdocs</strong> atau <strong>public_html</strong> di hosting Plesk / cPanel Anda.
                </p>

                {/* Troubleshooting Guide Box for Hosting Upload Issues */}
                <div className="mt-2.5 bg-amber-50/90 border border-amber-200/90 p-3 rounded-xl space-y-2 text-xs text-amber-900">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Solusi Jika Upload File ZIP Gagal di Hosting cPanel / Plesk:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/90 leading-relaxed font-sans">
                    <li><strong>Ukuran File Terlalu Besar / Timeout:</strong> Jika cPanel File Manager menolak ZIP, unduh file satuan (<code>database.sql</code> dan <code>api.php</code>) di bawah ini, lalu unggah file statis secara terpisah.</li>
                    <li><strong>Ekstraksi Gagal (Corrupted ZIP):</strong> Gunakan browser Google Chrome / Edge terbaru saat mengunduh <code>hosting-dist.zip</code> tanpa IDM agar file tidak terpotong.</li>
                    <li><strong>Error 500 Internal Server Error:</strong> Pastikan versi PHP di hosting adalah <strong>PHP 7.4 / 8.0 / 8.1 / 8.2</strong> dan folder <code>data/</code> dibuat dengan izin akses <code>chmod 0755</code>.</li>
                    <li><strong>Koneksi Database MySQL:</strong> Buat Database MySQL baru di cPanel, lalu Import <code>database.sql</code> lewat phpMyAdmin. Isikan nama DB, User &amp; Password ke dalam <code>api.php</code>.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-slate-900">
                <span className="flex items-center space-x-1.5">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>File Tambahan Pendukung Hosting:</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSecureDownload('/api/download/database.sql', 'database.sql', false)}
                    disabled={!!downloadingFile}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {downloadingFile === 'database.sql' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Unduh database.sql</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSecureDownload('/api/download/api.php', 'api.php', false)}
                    disabled={!!downloadingFile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {downloadingFile === 'api.php' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Unduh api.php</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 6: Cadangan Data & Ganti Perangkat */}
      {activeTab === 'backup' && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Penyimpanan Cloud Database & Cadangan Perangkat</span>
            </h3>
          </div>

          {/* Cloud Database Auto-Sync Card */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4.5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="bg-emerald-500/20 p-2.5 rounded-xl backdrop-blur-md shrink-0 border border-emerald-400/30">
                  <Globe className="w-6 h-6 text-emerald-300" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold flex items-center space-x-2 text-white">
                    <span>Cloud Database Real-Time Terhubung</span>
                    <span className="bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      AKTIF
                    </span>
                  </h4>
                  <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                    Setiap perubahan Modul Ajar, Bank Materi, Kop Surat, TTD, dan Daftar Guru disinkronkan secara otomatis dan aman ke Cloud Database. Anda dapat membuka link aplikasi dari **HP, Laptop, Tablet, atau Komputer Manapun** dan seluruh data Anda akan langsung tersedia!
                  </p>
                </div>
              </div>
            </div>

            {cloudMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 font-bold ${
                cloudMsg.success
                  ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
                  : 'bg-rose-500/30 text-rose-100 border border-rose-400/40'
              }`}>
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-300" />
                <span>{cloudMsg.message}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-emerald-700/60">
              <button
                type="button"
                onClick={handleManualPushCloud}
                disabled={cloudSyncing}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{cloudSyncing ? 'Menyimpan...' : 'Unggah / Paksa Simpan ke Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={handleManualPullCloud}
                disabled={cloudSyncing}
                className="w-full sm:w-auto bg-emerald-950/80 hover:bg-emerald-950 text-emerald-200 border border-emerald-600/60 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncing ? 'animate-spin' : ''}`} />
                <span>{cloudSyncing ? 'Memuat...' : 'Muat Data Terbaru dari Cloud'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-2 text-slate-700">
            <div className="flex items-start space-x-2.5">
              <Laptop className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-xs">Cadangan Berkas Manual (.json)</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Selain sinkronisasi otomatis Cloud Database, Anda juga dapat mengunduh berkas cadangan offline (.json) untuk disimpan secara fisik di Flashdisk, Google Drive, atau WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {backupStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start space-x-2 font-medium ${
                backupStatus.success
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{backupStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Export Card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                  <Download className="w-4 h-4" />
                  <span>1. Unduh Cadangan Data (.json)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Unduh berkas cadangan ke HP/Komputer Anda. Berkas ini dapat disimpan di Flashdisk, Google Drive, atau WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Berkas Cadangan</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-cyan-700 font-bold text-xs">
                  <Upload className="w-4 h-4" />
                  <span>2. Pulihkan / Impor Data</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Pilih berkas .json yang telah diunduh dari perangkat lain untuk memulihkan seluruh data aplikasi secara otomatis.
                </p>
              </div>
              <label className="w-full cursor-pointer bg-white hover:bg-slate-100 text-cyan-800 border border-cyan-300 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all text-center">
                <Upload className="w-4 h-4 text-cyan-600" />
                <span>Pilih Berkas Cadangan (.json)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 7: Favicon & Open Graph Link Preview & Dynamic Image Manager */}
      {activeTab === 'og' && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Dynamic Favicon & Gambar Open Graph Share Link</span>
            </h3>

            {/* Status Badge */}
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              customOgImage
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              {customOgImage ? 'Favicon & OG Custom Aktif' : 'Default Sistem (Bulat KBC)'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Gambar ini digunakan sebagai <strong>Favicon di Tab Browser</strong> sekaligus <strong>Gambar Open Graph (OG)</strong> saat link aplikasi dibagikan ke WhatsApp, Facebook, Telegram, atau Twitter. Anda dapat mengganti gambar secara dinamis kapan saja dengan mengunggah gambar custom baru. Gambar default buatan sistem tetap aman dan dapat dikembalikan kapan saja.
          </p>

          {/* Toast / Notification message */}
          {ogUploadMsg && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{ogUploadMsg}</span>
            </div>
          )}

          {/* Dynamic Image Customizer Controls */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Ganti / Unggah Favicon & Gambar Share Link Custom:</span>
            </h4>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className={`cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-xs ${
                ogUploading ? 'opacity-50 pointer-events-none' : ''
              }`}>
                <UploadCloud className="w-4 h-4" />
                <span>{ogUploading ? 'Memproses Gambar...' : 'Unggah Favicon & Logo Custom Baru'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleOgFileUpload}
                  disabled={ogUploading}
                  className="hidden"
                />
              </label>

              {customOgImage && (
                <button
                  type="button"
                  onClick={handleResetOgImage}
                  disabled={ogUploading}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center space-x-2 transition-all border border-slate-300"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Kembalikan ke Default Sistem</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 italic">
              *Rekomendasi gambar rasio 1:1 (persegi) atau bulat. Format yang didukung: JPG, PNG, WEBP (maksimal 5MB). Otomatis mengganti Favicon Tab Browser & Gambar Share Link secara bersamaan.
            </p>
          </div>

          {/* Live Simulated WhatsApp / Social Media Card Preview */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-700 block">
              Simulasi Pratinjau Tampilan Link saat Bagikan ke WhatsApp / Media Sosial:
            </span>
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 max-w-md mx-auto sm:mx-0 shadow-2xs">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                {/* Round Image Emblem Box */}
                <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-6 flex flex-col items-center justify-center relative">
                  <div className="w-32 h-32 rounded-full border-4 border-amber-400 shadow-xl overflow-hidden bg-white p-0.5 flex items-center justify-center">
                    <img
                      key={ogCacheBuster}
                      src={customOgImage || defaultOgBadgeImage}
                      alt="Logo Open Graph Jaenal Maskun S.Pd.I."
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== defaultOgBadgeImage) {
                          target.src = defaultOgBadgeImage;
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="p-3.5 space-y-1 bg-white">
                  <div className="text-[10px] font-mono text-emerald-700 font-bold uppercase truncate">
                    {window.location.hostname || 'modulajar.kbc.sch.id'}
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs leading-snug">
                    Modul Ajar Berbasis Cinta - MI Ma'arif NU 2 Sanggreman
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-normal line-clamp-2">
                    Aplikasi Penyusun Modul Ajar Kurikulum Berbasis Cinta (KBC) Terintegrasi AI Gemini, Bank Materi, Media Digital & Kuis Interaktif.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons & WhatsApp Link Share */}
          <div className="space-y-3 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Link2 className="w-4 h-4 text-emerald-600" />
                <span>Link Share Default Aplikasi (Menggunakan Logo Favicon & OG Sistem):</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    testHostingDomain.trim()
                      ? `${testHostingDomain.replace(/\/+$/, '')}/?v=${ogCacheBuster}`
                      : `${window.location.protocol}//${window.location.host}/?v=${ogCacheBuster}`
                  }
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-emerald-800 font-bold flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const cleanAppUrl = testHostingDomain.trim()
                      ? `${testHostingDomain.replace(/\/+$/, '')}/?v=${ogCacheBuster}`
                      : `${window.location.protocol}//${window.location.host}/?v=${ogCacheBuster}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(cleanAppUrl);
                      alert(`Link Default Aplikasi Berhasil Disalin:\n${cleanAppUrl}\n\nSaat dibagikan ke WhatsApp/Sosmed, logo default Favicon & OG aplikasi akan langsung diperbarui oleh crawler.`);
                    } else {
                      prompt('Salin link default aplikasi berikut:', cleanAppUrl);
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shrink-0"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Salin Link Default</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `*Modul Ajar Berbasis Cinta - MI Ma'arif NU 2 Sanggreman*\n\nAplikasi Penyusun Modul Ajar Kurikulum Berbasis Cinta (KBC) Terintegrasi AI Gemini, Bank Materi, Media Digital & Kuis Interaktif.\n\n${
                    testHostingDomain.trim()
                      ? `${testHostingDomain.replace(/\/+$/, '')}/?v=${ogCacheBuster}`
                      : `${window.location.protocol}//${window.location.host}/?v=${ogCacheBuster}`
                  }`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
              >
                <Share2 className="w-4 h-4 text-emerald-200" />
                <span>Share ke WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadOgImage}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Gambar (.jpg)</span>
              </button>

              <a
                href={customOgImage || defaultOgBadgeImage}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all border border-slate-300"
              >
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                <span>Buka Logo di Tab Baru</span>
              </a>
            </div>
          </div>

          {/* Section: Atur Thumbnail Per Mata Pelajaran (Otomatis Terdeteksi & Terekam) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Atur Thumbnail Per Mata Pelajaran ({masterMapelList.length} Mapel Terdeteksi)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Penambahan mapel baru atau perubahan gambar thumbnail yang diunggah akan otomatis terdeteksi, terekam, dan disinkronkan.
                  </p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deteksi Otomatis Aktif</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {masterMapelList.map((mapel, idx) => {
                const sanitizedKey = sanitizeMapelKey(mapel);
                const candidates = [sanitizedKey, mapel, mapel.trim()];
                let cfg: { title?: string; desc?: string; imageUrl?: string; updatedAt?: string } | null = null;
                let bestTime = -1;

                for (const cand of candidates) {
                  const c = mapelOgConfigsState[cand];
                  if (c && c.imageUrl && c.imageUrl.trim()) {
                    const time = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
                    if (time >= bestTime) {
                      bestTime = time;
                      cfg = c;
                    }
                  }
                }

                if (!cfg) {
                  for (const [k, cObj] of Object.entries(mapelOgConfigsState)) {
                    const c = cObj as MapelOgConfig;
                    if (sanitizeMapelKey(k) === sanitizedKey && c && c.imageUrl && c.imageUrl.trim()) {
                      const time = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
                      if (time >= bestTime) {
                        bestTime = time;
                        cfg = c;
                      }
                    }
                  }
                }

                const thumbnailImg = (cfg?.imageUrl && cfg.imageUrl.trim()) ? cfg.imageUrl.trim() : getPresetImageForMapel(mapel);

                return (
                  <div key={`${mapel}-thumb-${idx}`} className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Thumbnail Preview Circle / Box */}
                      <div className="w-14 h-14 rounded-xl border-2 border-emerald-400 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center shadow-xs relative">
                        {thumbnailImg ? (
                          <img
                            src={thumbnailImg}
                            alt={`Thumbnail ${mapel}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, getPresetImageForMapel(mapel))}
                          />
                        ) : (
                          <div className="p-2 text-center text-slate-400">
                            <ImageIcon className="w-6 h-6 mx-auto text-emerald-600/70" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h5 className="text-xs font-extrabold text-slate-900 truncate" title={mapel}>{mapel}</h5>
                        <span className="text-[10px] font-medium text-slate-500 block">
                          {thumbnailImg ? (
                            <span className="text-emerald-700 font-bold flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600 inline shrink-0" />
                              <span>Thumbnail Terekam</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Gambar Default</span>
                          )}
                        </span>
                        {cfg?.updatedAt && (
                          <span className="text-[9px] text-slate-400 font-mono block">
                            Terekam: {new Date(cfg.updatedAt).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                      <label className="flex-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-1.5 px-2.5 rounded-lg text-[11px] flex items-center justify-center space-x-1.5 transition-all text-center">
                        <UploadCloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Unggah Thumbnail</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleMapelThumbnailUpload(mapel, file);
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {thumbnailImg && (
                        <button
                          type="button"
                          onClick={() => handleResetMapelThumbnail(mapel)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-300 shrink-0"
                          title="Hapus / Reset Thumbnail ke Default"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-slate-700 space-y-1">
            <p className="font-bold text-emerald-900 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Status Dikelola Server Backend & Lokal</span>
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Server backend Express secara otomatis menyajikan gambar Open Graph dari route <code className="bg-emerald-100 text-emerald-900 font-mono px-1 rounded">/og-image-round.jpg</code>. Jika Anda mengunggah gambar custom, server menyajikan gambar custom tersebut. Saat di-reset, server otomatis mengembalikan ke gambar default sistem berbentuk bulat secara instan.
            </p>
          </div>
        </div>
      )}

      {/* Tab Content: Akun Siswa */}
      {activeTab === 'students' && (
        <div className="p-4 sm:p-5">
          <StudentListManager onDataChanged={onDataRestored} />
        </div>
      )}

      {/* Tab Content: Akun Admin & Operator */}
      {activeTab === 'admin_accounts' && (
        <div className="p-4 sm:p-5">
          <AdminAccountsManager userSession={userSession} onClose={() => setActiveTab(null)} />
        </div>
      )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                💡 Seluruh perubahan konfigurasi otomatis tersimpan secara langsung.
              </span>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 ml-auto"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Selesai &amp; Tutup Jendela Melayang</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Developer Credit Box */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
        <div className="flex items-center space-x-2.5 text-emerald-600">
          <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Informasi Pengembang Aplikasi
          </h4>
        </div>
        <div className="text-xs text-slate-700 space-y-1 pl-8">
          <p className="font-extrabold text-emerald-700 text-sm">
            Jaenal Maskun, S.Pd.I.
          </p>
          <p className="text-[11px] font-medium text-slate-700">
            Guru Kelas & Pengembang Sistem Kurikulum Berbasis Cinta (KBC)
          </p>
          <p className="text-[11px] font-medium text-slate-500">
            MI Ma'arif NU 2 Sanggreman & Kelompok Kerja Guru (KKG) MI Kabupaten Banyumas
          </p>
        </div>
      </div>

      {/* Modal Cetak Profil Madrasah EMIS */}
      <CetakProfilMadrasahModal
        isOpen={mCetakModalOpen}
        onClose={() => setMCetakModalOpen(false)}
        madrasah={currentActiveMadrasahItem}
      />
    </div>
  );
};
