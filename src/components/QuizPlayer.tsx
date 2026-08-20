import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SoalKuis, Flashcard, MediaDigital, ModulAjarCinta, HasilKuisItem, MateriBankItem, MAPEL_MI_OPTIONS, StudentAccount, StudentQuizResult, StudentQuizResultDetail } from '../types';
import { INITIAL_MATERI_BANK, DEFAULT_KOP_SURAT, DEFAULT_TTD } from '../data/sampleModules';
import { safeFetchJson } from '../utils/apiHelper';
import { handleImageError, getReliableImageUrl, compressAndResizeImage } from '../utils/imageHelper';
import { loadStudentSession, saveStudentSession, addStudentQuizResult, loadStoredStudentQuizResults, loadStoredModules, saveModules, loadMapelOgConfigs, loadMasterMapelList, loadDeletedMapel, loadDeletedMapelSet, isMapelDeleted, normalizeMapelKey } from '../utils/storage';
import { sanitizeMapelKey, strictUrlEncode, fetchMapelOgConfigsApi, saveMapelOgConfigApi, MapelOgConfig, getPresetImageForMapel } from '../utils/mapelOgApi';
import { updateOgForModuleOrMapel } from '../utils/metaHelper';
import { pushLocalDataToCloud } from '../utils/firebaseSync';
import { loadUserSession } from '../utils/auth';
import { StudentLoginModal } from './StudentLoginModal';
import { QuizResultsRecapModal } from './QuizResultsRecapModal';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  UserCheck,
  Lock,
  BookOpen,
  Award,
  Layers,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  Printer,
  RefreshCw,
  Zap,
  Loader2,
  BookMarked,
  Trash2,
  Save,
  Check,
  Eye,
  ExternalLink,
  Share2,
  Upload,
  Copy,
  MessageCircle,
  Send,
  X,
  Link2,
  Edit3,
  HeartHandshake,
  Scale,
  Landmark,
  Languages,
  GraduationCap,
  Globe,
  Calculator,
  Feather,
  ShieldCheck,
  AlertTriangle,
  Info,
  LayoutGrid,
  ListOrdered,
  ChevronDown,
  Search,
  Plus,
  Calendar,
  Camera,
  UploadCloud
} from 'lucide-react';

const formatCreatedDate = (dateStr?: string, fallbackDateStr?: string): string => {
  const targetStr = dateStr || fallbackDateStr;
  if (!targetStr) return 'Dibuat: -';
  try {
    const d = new Date(targetStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  } catch (e) {
    // ignore
  }
  return targetStr;
};

const createDefaultModuleForMapel = (
  mapelName: string,
  bankItem: MateriBankItem | undefined,
  refModule?: ModulAjarCinta | null
): ModulAjarCinta => {
  const safeTitle = bankItem
    ? `Modul Ajar ${bankItem.mataPelajaran} - ${bankItem.judulMateri}`
    : `Modul Ajar ${mapelName} - Pembelajaran Kurikulum Berbasis Cinta (KBC)`;

  return {
    id: `auto-modul-${mapelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
    judul: safeTitle,
    modeBuat: 'AI',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    kopSurat: refModule?.kopSurat || DEFAULT_KOP_SURAT,
    ttd: refModule?.ttd || DEFAULT_TTD,
    identitas: {
      namaMadrasah: refModule?.identitas?.namaMadrasah || "MI Ma'arif NU 2 Sanggreman",
      mataPelajaran: mapelName,
      materi: bankItem?.judulMateri || `Materi Pokok Pembelajaran ${mapelName}`,
      faseKelas: bankItem?.faseKelas || 'Fase B (Kelas III MI)',
      semester: bankItem?.semester || 'Ganjil (1)',
      tahunPelajaran: '2025/2026',
      alokasiWaktu: '2 x 35 Menit (2 JP)'
    },
    identifikasi: {
      kesiapanMurid: {
        pahamUtuh: `Peserta didik mahir dalam pelajaran ${mapelName} mampu memahami konsep secara utuh dan menjadi tutor sebaya.`,
        pahamSebagian: `Peserta didik sedang berkembang dalam ${mapelName} memerlukan bimbingan diskusi kelompok.`,
        belumPaham: `Peserta didik perlu pendampingan khusus dalam ${mapelName} dengan pendekatan KBC.`
      },
      materiPelajaran: bankItem?.uraianMateri || `Pembelajaran ${mapelName} terintegrasi pilar Panca Cinta KBC.`,
      dimensiProfilLulusan: [
        'Beriman, Bertakwa, & Berakhlak Mulia',
        'Gotong Royong & Empati',
        'Penalaran Kritis & Mandiri'
      ],
      topikPancaCinta: bankItem?.topikPancaCintaDefault || ['Cinta Allah SWT & Rasul-Nya', 'Cinta Sesama & Bangsa'],
      materiIntegrasiKBC: `Penanaman nilai-nilai KBC pada mata pelajaran ${mapelName}.`
    },
    desainPembelajaran: {
      capaianPembelajaran: bankItem?.capaianPembelajaranDefault || `Peserta didik memahami dan menerapkan materi ${mapelName} berlandaskan nilai-nilai KBC.`,
      lintasDisiplinIlmu: `Integrasi ${mapelName} dengan nilai keindahan, bahasa, dan adab Islami.`,
      tujuanPembelajaran: [
        `Memahami materi pokok ${mapelName} secara cermat dan santun.`,
        `Mengaplikasikan nilai-nilai kebaikan dalam pembelajaran ${mapelName}.`
      ]
    },
    kerangkaPembelajaran: {
      praktekPedagogik: 'Mindful Learning, Deep Learning, & Joyful Learning.',
      kemitraanPembelajaran: 'Kolaborasi Guru, Murid, dan Orang Tua.',
      lingkunganPembelajaran: 'Ruang kelas ramah anak dan kondusif.',
      pemanfaatanDigital: 'Media Kuis Interaktif & Flashcard AI.'
    },
    pengalamanBelajar: {
      kegiatanAwal: { durasi: '10 Menit', kegiatan: ['Menyapa murid dengan senyuman dan sapaan KBC, berdoa bersama.'] },
      kegiatanInti: { durasi: '45 Menit', kegiatan: [`Membahas materi ${mapelName} melalui diskusi interaktif dan kuis.`] },
      mengaplikasi: { durasi: '10 Menit', kegiatan: ['Aksi kebaikan nyata di kelas.'] },
      merefleksi: { durasi: '5 Menit', kegiatan: ['Refleksi emosi dan jurnal kebaikan.'] },
      penutup: { durasi: '10 Menit', kegiatan: ['Kesimpulan, apresiasi, dan doa penutup.'] }
    },
    assesmen: {
      teknikAssesmen: 'Asesmen Formatif (Observasi & Kuis) & Sumatif.',
      rubrikAssesmenSikapCinta: 'Rubrik Sikap Panca Cinta (Skor 1-4).',
      instrumenPenilaian: 'Lembar Observasi & Kuis Digital.',
      lkpd: {
        judulLkpd: `LKPD ${mapelName}: Lembar Kerja Peserta Didik`,
        petunjuk: 'Kerjakan soal-soal berikut dengan cermat dan jujur.',
        tugasAktivitas: [`Pahami materi ${mapelName} dan diskusikan bersama teman.`],
        pertanyaanDiskusi: [`Apa manfaat mempelajari ${mapelName} dalam kehidupan sehari-hari?`],
        lembarRefleksiSiswa: 'Saya merasa senang belajar hari ini.'
      },
      mediaDigital: {
        soalKuis: [
          {
            id: `q-${mapelName}-1`,
            pertanyaan: `Apa tujuan utama mempelajari ${mapelName} di Madrasah?`,
            pilihan: [
              'Meningkatkan pemahaman, akhlakul karimah, dan ketakwaan',
              'Hanya untuk mendapat nilai angka',
              'Agar bisa menyombongkan diri',
              'Mengisi waktu luang saja'
            ],
            kunciJawaban: 0,
            penjelasanKbc: `Benar! Mempelajari ${mapelName} bertujuan membentuk pribadi yang berilmu dan berakhlak mulia.`
          },
          {
            id: `q-${mapelName}-2`,
            pertanyaan: `Bagaimana wujud penerapan nilai Panca Cinta KBC saat belajar ${mapelName}?`,
            pilihan: [
              'Mengganggu teman yang sedang belajar',
              'Saling menghargai, bekerjasama, dan bertutur kata santun',
              'Apatis dan tidak mau tahu',
              'Tergesa-gesa tanpa memperhatikan kebersihan'
            ],
            kunciJawaban: 1,
            penjelasanKbc: `Sangat tepat! Saling menghargai dan bertutur kata santun adalah cerminan utama KBC.`
          },
          {
            id: `q-${mapelName}-3`,
            pertanyaan: `Apa tindakan kita jika teman kesulitan memahami materi ${mapelName}?`,
            pilihan: [
              'Mengejeknya',
              'Membantunya dengan sabar dan tutur kata lembut',
              'Pura-pura tidak tahu',
              'Melaporkannya agar dihukum'
            ],
            kunciJawaban: 1,
            penjelasanKbc: `Luar biasa! Membantu teman dengan kesabaran adalah bukti nyata Cinta Sesama.`
          }
        ],
        materiInteraktif: {
          ringkasanRingkas: `Rangkuman materi ${mapelName} yang dirancang untuk memudahkan pemahaman murid dengan kehangatan KBC.`,
          poinPenting: [
            `Pahami konsep dasar ${mapelName} secara utuh.`,
            'Terapkan akhlak mulia dalam setiap aktivitas belajar.',
            'Saling menghormati dan menyayangi sesama teman.'
          ],
          flashcards: [
            { id: `fc-${mapelName}-1`, depan: `Mengapa kita belajar ${mapelName}?`, belakang: 'Untuk menuntut ilmu yang bermanfaat dan mendekatkan diri kepada Allah SWT.' },
            { id: `fc-${mapelName}-2`, depan: `Apa kaitan ${mapelName} dengan KBC?`, belakang: 'Menanamkan rasa cinta ilmu, cinta sesama, dan akhlakul karimah.' }
          ]
        },
        gambarInteraktif: {
          deskripsiVisual: `Ilustrasi suasana belajar ${mapelName} yang hangat dan interaktif di madrasah.`,
          promptGambar: `Vector illustration of Indonesian Islamic school students learning ${mapelName} in classroom, cheerful and warm style.`,
          imageUrl: (() => {
            try {
              const configs = loadMapelOgConfigs();
              const key = sanitizeMapelKey(mapelName);
              const cfg = configs[key] || configs[mapelName];
              if (cfg && cfg.imageUrl && cfg.imageUrl.trim()) return cfg.imageUrl.trim();
            } catch {}
            return 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=600&fit=crop';
          })(),
          hotspots: []
        }
      }
    }
  };
};

interface QuizPlayerProps {
  media: MediaDigital;
  judulModul: string;
  selectedModule?: ModulAjarCinta | null;
  allModules?: ModulAjarCinta[];
  materiBankList?: MateriBankItem[];
  customMapelList?: string[];
  onSelectModule?: (modul: ModulAjarCinta) => void;
  onUpdateModule?: (modul: ModulAjarCinta) => void;
  onOpenStudentMode?: () => void;
  apiKey?: string;
  isStudentMode?: boolean;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  media,
  judulModul,
  selectedModule,
  allModules = [],
  materiBankList = [],
  customMapelList = [],
  onSelectModule,
  onUpdateModule,
  onOpenStudentMode,
  apiKey = '',
  isStudentMode = false
}) => {
  const [mode, setMode] = useState<'quiz' | 'flashcard' | 'media' | 'rekap'>('quiz');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [genStatusMsg, setGenStatusMsg] = useState('');
  const [savedScoreMsg, setSavedScoreMsg] = useState('');
  const [targetJumlahSoal, setTargetJumlahSoal] = useState<number>(25);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [namaSiswa, setNamaSiswa] = useState<string>('');

  // Student Account Session State
  const [studentSession, setStudentSession] = useState<StudentAccount | null>(() => loadStudentSession());
  const [showStudentLoginModal, setShowStudentLoginModal] = useState<boolean>(false);
  const [studentQuizArchives, setStudentQuizArchives] = useState<StudentQuizResult[]>(() => loadStoredStudentQuizResults());
  const [showGlobalRecapModal, setShowGlobalRecapModal] = useState<boolean>(false);

  // Flashcard state
  const [flashIndex, setFlashIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Active Hotspot & Image Zoom
  const [activeHotspot, setActiveHotspot] = useState<any | null>(null);
  const [isZoomingImg, setIsZoomingImg] = useState<boolean>(false);

  // Share Link & Custom OG Image State (Grouped Per Mata Pelajaran)
  const [showShareOgModal, setShowShareOgModal] = useState<boolean>(false);
  const [previewWaModule, setPreviewWaModule] = useState<{
    id?: string;
    judul: string;
    mapel: string;
    materi: string;
    faseKelas: string;
    soalCount: number;
    studentUrl: string;
    waText: string;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCacheBuster, setCopiedCacheBuster] = useState<boolean>(false);
  const [customOgInputUrl, setCustomOgInputUrl] = useState<string>('');
  const [mapelOgConfigs, setMapelOgConfigs] = useState<Record<string, MapelOgConfig>>({});
  const mapelOgFileInputRef = useRef<HTMLInputElement | null>(null);

  // Direct Easy Thumbnail Manager State
  const [showThumbnailModal, setShowThumbnailModal] = useState<boolean>(false);
  const [targetMapelForThumb, setTargetMapelForThumb] = useState<string>('');
  const [urlInputForThumb, setUrlInputForThumb] = useState<string>('');
  const [isUploadingThumb, setIsUploadingThumb] = useState<boolean>(false);
  const [thumbTab, setThumbTab] = useState<'upload' | 'url' | 'preset'>('upload');
  const directThumbFileInputRef = useRef<HTMLInputElement | null>(null);
  const [testHostingDomain, setTestHostingDomain] = useState<string>(() => {
    try {
      return localStorage.getItem('kbc_test_hosting_domain') || '';
    } catch {
      return '';
    }
  });

  // Banner Logo State for Student Quiz
  const [bannerLogoUrl, setBannerLogoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('quiz_banner_logo_url') || '';
    } catch {
      return '';
    }
  });
  const bannerLogoInputRef = useRef<HTMLInputElement | null>(null);

  // Menu Collapsible & Floating State
  const [isMembuatSoalMenuOpen, setIsMembuatSoalMenuOpen] = useState<boolean>(true);
  const [showMembuatSoalFloatingModal, setShowMembuatSoalFloatingModal] = useState<boolean>(false);
  const [showPilihMapelFloatingModal, setShowPilihMapelFloatingModal] = useState<boolean>(false);

  // Mata Pelajaran Slide Ref & Scroll Handler
  const mapelSliderRef = useRef<HTMLDivElement | null>(null);

  const scrollMapelSlider = (direction: 'left' | 'right') => {
    if (mapelSliderRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      mapelSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMapelChangeInMenu = (mapel: string) => {
    setSelectedMapelOg(mapel);
    setFloatingMapel(mapel);
    const matchingMods = (allModules || []).filter(m =>
      m.identitas?.mataPelajaran?.toLowerCase().trim() === mapel.toLowerCase().trim() ||
      m.identitas?.mataPelajaran?.toLowerCase().includes(mapel.toLowerCase()) ||
      mapel.toLowerCase().includes(m.identitas?.mataPelajaran?.toLowerCase() || '')
    );
    if (matchingMods.length > 0 && onSelectModule) {
      const currentMatches = selectedModule && (
        selectedModule.identitas?.mataPelajaran?.toLowerCase().trim() === mapel.toLowerCase().trim() ||
        selectedModule.identitas?.mataPelajaran?.toLowerCase().includes(mapel.toLowerCase())
      );
      if (!currentMatches) {
        onSelectModule(matchingMods[0]);
      }
    }
  };

  const handleBannerLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Maksimal 12MB.');
      return;
    }

    try {
      setToastMsg('Mengompres & memproses logo banner...');
      const compressed = await compressAndResizeImage(file, 500, 0.85);
      setBannerLogoUrl(compressed);
      try {
        localStorage.setItem('quiz_banner_logo_url', compressed);
      } catch (err) {
        console.error('Failed to save banner logo to localStorage:', err);
      }
      setToastMsg('⚡ Logo Banner Kuis Siswa berhasil diunggah!');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err: any) {
      console.error('Failed to process banner logo:', err);
      alert('Gagal memproses gambar logo: ' + (err.message || 'Error tidak diketahui'));
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveBannerLogo = () => {
    setBannerLogoUrl('');
    try {
      localStorage.removeItem('quiz_banner_logo_url');
    } catch (err) {
      console.error('Failed to remove banner logo:', err);
    }
    setToastMsg('Logo Banner Kuis Siswa berhasil dihapus!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const mapelName = selectedModule?.identitas?.mataPelajaran || 'Pendidikan Agama Islam';
  const materiName = selectedModule?.identitas?.materi || judulModul || 'Materi Pembelajaran';
  const faseKelas = selectedModule?.identitas?.faseKelas || 'Fase A (Kelas 1)';
  const targetModulId = selectedModule?.id || '';

  // Fetch Mapel OG & Thumbnail Configs on mount
  useEffect(() => {
    fetchMapelOgConfigsApi().then(configs => {
      if (configs) {
        setMapelOgConfigs(configs);
      }
    });
  }, []);

  // Synchronize Student Session
  useEffect(() => {
    if (studentSession?.nama) {
      setNamaSiswa(studentSession.nama);
    }
  }, [studentSession]);

  // Prompt Login Modal in Student Mode if not logged in
  useEffect(() => {
    if (isStudentMode && !studentSession) {
      setShowStudentLoginModal(true);
    }
  }, [isStudentMode, studentSession]);

  // Auto Archive Quiz Result on Finish
  useEffect(() => {
    if (quizFinished) {
      const questionsCount = media.soalKuis?.length || 1;
      const finalPercentage = Math.round((score / questionsCount) * 100);
      const studentNameVal = studentSession?.nama || namaSiswa.trim() || 'Siswa';

      const questionsList = media.soalKuis || [];
      const details = questionsList.map((q, idx) => ({
        soalId: q.id,
        pertanyaan: q.pertanyaan,
        pilihan: q.pilihan,
        jawabanSiswaIndex: userAnswers[idx] !== undefined ? userAnswers[idx] : -1,
        kunciJawabanIndex: q.kunciJawaban,
        isBenar: userAnswers[idx] === q.kunciJawaban,
        penjelasanKbc: q.penjelasanKbc
      }));

      const newResult: StudentQuizResult = {
        id: `sqr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        studentId: studentSession?.id || 'guest',
        studentName: studentNameVal,
        nisn: studentSession?.nisn || '-',
        kelas: studentSession?.kelas || faseKelas,
        modulId: targetModulId,
        modulJudul: materiName,
        mataPelajaran: mapelName,
        faseKelas: faseKelas,
        skor: score,
        totalSoal: questionsCount,
        nilai: finalPercentage,
        tanggal: new Date().toISOString(),
        detailJawaban: details
      };

      addStudentQuizResult(newResult);
      setStudentQuizArchives(loadStoredStudentQuizResults());
    }
  }, [quizFinished]);

  const defaultMapelList = [
    'Akidah Akhlak',
    'Fiqih',
    'Al-Qur\'an Hadis',
    'Sejarah Kebudayaan Islam (SKI)',
    'Bahasa Arab',
    'Pendidikan Agama Islam',
    'IPAS (IPA & IPS)',
    'Matematika',
    'Bahasa Indonesia',
    'Pendidikan Pancasila'
  ];

  const getThumbnailForMapel = (mapel: string): string => {
    if (!mapel) return getPresetImageForMapel('Pendidikan Agama Islam');
    const sanitized = sanitizeMapelKey(mapel);
    const candidates = Array.from(new Set([sanitized, mapel, mapel.trim(), mapel.toLowerCase().replace(/[^a-z0-9]/g, '_')].filter(Boolean)));
    
    let bestImg = '';
    let bestTime = -1;

    for (const cand of candidates) {
      const cfg = mapelOgConfigs[cand];
      if (cfg && cfg.imageUrl && cfg.imageUrl.trim()) {
        const time = cfg.updatedAt ? new Date(cfg.updatedAt).getTime() : 0;
        if (time >= bestTime) {
          bestTime = time;
          bestImg = cfg.imageUrl.trim();
        }
      }
    }

    for (const [k, cfgObj] of Object.entries(mapelOgConfigs)) {
      const cfg = cfgObj as MapelOgConfig;
      if (sanitizeMapelKey(k) === sanitized && cfg && cfg.imageUrl && cfg.imageUrl.trim()) {
        const time = cfg.updatedAt ? new Date(cfg.updatedAt).getTime() : 0;
        if (time >= bestTime) {
          bestTime = time;
          bestImg = cfg.imageUrl.trim();
        }
      }
    }

    try {
      const localConfigs = loadMapelOgConfigs();
      for (const cand of candidates) {
        const localCfg = localConfigs[cand];
        if (localCfg && localCfg.imageUrl && localCfg.imageUrl.trim()) {
          const time = localCfg.updatedAt ? new Date(localCfg.updatedAt).getTime() : 0;
          if (time >= bestTime) {
            bestTime = time;
            bestImg = localCfg.imageUrl.trim();
          }
        }
      }
      for (const [k, localCfg] of Object.entries(localConfigs)) {
        if (sanitizeMapelKey(k) === sanitized && localCfg && localCfg.imageUrl && localCfg.imageUrl.trim()) {
          const time = localCfg.updatedAt ? new Date(localCfg.updatedAt).getTime() : 0;
          if (time >= bestTime) {
            bestTime = time;
            bestImg = localCfg.imageUrl.trim();
          }
        }
      }
    } catch {}

    if (bestImg) return bestImg;
    return getPresetImageForMapel(mapel);
  };

  const handleOpenThumbnailModal = (mapel: string) => {
    const target = mapel || selectedMapelOg || mapelName || 'Pendidikan Agama Islam';
    setTargetMapelForThumb(target);
    setUrlInputForThumb(getThumbnailForMapel(target));
    setShowThumbnailModal(true);
  };

  const syncThumbnailToModules = (mapel: string, newImageUrl: string) => {
    if (!mapel) return;
    const sanitizedTarget = sanitizeMapelKey(mapel);

    if (selectedModule && onUpdateModule) {
      const modMapel = selectedModule.identitas?.mataPelajaran || '';
      const isMatch = modMapel.toLowerCase().trim() === mapel.toLowerCase().trim() ||
                      (sanitizedTarget && sanitizeMapelKey(modMapel) === sanitizedTarget);
      if (isMatch) {
        const updatedModule: ModulAjarCinta = {
          ...selectedModule,
          updatedAt: new Date().toISOString(),
          assesmen: {
            ...selectedModule.assesmen,
            mediaDigital: {
              ...selectedModule.assesmen?.mediaDigital,
              gambarInteraktif: {
                ...selectedModule.assesmen?.mediaDigital?.gambarInteraktif,
                imageUrl: newImageUrl
              }
            }
          }
        };
        onUpdateModule(updatedModule);
      }
    }

    try {
      const currentMods = loadStoredModules();
      let changed = false;
      const updatedModsList = currentMods.map(m => {
        const mMapel = m.identitas?.mataPelajaran || '';
        if (mMapel.toLowerCase().trim() === mapel.toLowerCase().trim() || (sanitizedTarget && sanitizeMapelKey(mMapel) === sanitizedTarget)) {
          changed = true;
          return {
            ...m,
            updatedAt: new Date().toISOString(),
            assesmen: {
              ...m.assesmen,
              mediaDigital: {
                ...m.assesmen?.mediaDigital,
                gambarInteraktif: {
                  ...m.assesmen?.mediaDigital?.gambarInteraktif,
                  imageUrl: newImageUrl
                }
              }
            }
          };
        }
        return m;
      });
      if (changed) {
        saveModules(updatedModsList, true);
      }
    } catch (e) {
      console.warn('Error updating module thumbnails in storage:', e);
    }
  };

  const handleSaveMapelThumbnailUrl = async (mapel: string, url: string) => {
    if (!mapel || !url.trim()) return;
    setIsUploadingThumb(true);
    try {
      const trimmedUrl = url.trim();
      await saveMapelOgConfigApi(
        mapel,
        `Kuis & Media Interaktif ${mapel}`,
        `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${mapel}`,
        trimmedUrl
      );
      const updatedConfigs = await fetchMapelOgConfigsApi();
      setMapelOgConfigs(updatedConfigs);
      syncThumbnailToModules(mapel, trimmedUrl);
      updateOgForModuleOrMapel(selectedModule, mapel, Date.now());
      setToastMsg(`✅ Thumbnail mapel "${mapel}" berhasil disimpan!`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err: any) {
      console.error('Failed to save thumbnail:', err);
      alert('Gagal menyimpan thumbnail: ' + (err.message || 'Error tidak diketahui'));
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const handleUploadMapelThumbnailFile = async (e: React.ChangeEvent<HTMLInputElement>, mapel: string) => {
    const file = e.target.files?.[0];
    if (!file || !mapel) return;

    if (file.size > 12 * 1024 * 1024) {
      alert('Ukuran file thumbnail terlalu besar. Maksimal 12MB.');
      return;
    }

    setIsUploadingThumb(true);
    setToastMsg(`⚡ Mengompres & menyimpan thumbnail ${mapel}...`);
    try {
      const compressedDataUrl = await compressAndResizeImage(file, 700, 0.75);
      await saveMapelOgConfigApi(
        mapel,
        `Kuis & Media Interaktif ${mapel}`,
        `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${mapel}`,
        compressedDataUrl
      );

      const updatedConfigs = await fetchMapelOgConfigsApi();
      setMapelOgConfigs(updatedConfigs);
      syncThumbnailToModules(mapel, compressedDataUrl);
      updateOgForModuleOrMapel(selectedModule, mapel, Date.now());
      setToastMsg(`✅ Thumbnail mapel "${mapel}" berhasil diperbarui dalam sekejap!`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err: any) {
      console.error('Failed to upload mapel thumbnail:', err);
      alert('Gagal mengunggah thumbnail mapel: ' + (err.message || 'Error tidak diketahui'));
    } finally {
      setIsUploadingThumb(false);
      e.target.value = '';
    }
  };

  const handleResetMapelThumbnailTarget = async (mapel: string) => {
    if (!mapel) return;
    setIsUploadingThumb(true);
    try {
      const presetUrl = getPresetImageForMapel(mapel);
      await saveMapelOgConfigApi(
        mapel,
        `Kuis & Media Interaktif ${mapel}`,
        `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${mapel}`,
        ''
      );
      const updatedConfigs = await fetchMapelOgConfigsApi();
      setMapelOgConfigs(updatedConfigs);
      syncThumbnailToModules(mapel, presetUrl);
      updateOgForModuleOrMapel(selectedModule, mapel, Date.now());
      setToastMsg(`Thumbnail mapel "${mapel}" dikembalikan ke preset default.`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err: any) {
      console.error('Failed to reset mapel thumbnail:', err);
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const handleMapelThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleUploadMapelThumbnailFile(e, selectedMapelOg);
  };

  const handleResetMapelThumbnail = async () => {
    await handleResetMapelThumbnailTarget(selectedMapelOg);
  };

  if (mapelName && !defaultMapelList.includes(mapelName)) {
    defaultMapelList.unshift(mapelName);
  }

  const getMapelInfo = (mapel: string) => {
    const m = mapel.toLowerCase();
    if (m.includes('akidah') || m.includes('akhlak')) {
      return { icon: HeartHandshake, color: 'from-rose-500 to-pink-600', activeBorder: 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50', iconBg: 'bg-rose-100 text-rose-700' };
    }
    if (m.includes('fiqih') || m.includes('fikih')) {
      return { icon: Scale, color: 'from-amber-500 to-yellow-600', activeBorder: 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/50', iconBg: 'bg-amber-100 text-amber-700' };
    }
    if (m.includes('qur\'an') || m.includes('hadis') || m.includes('quran')) {
      return { icon: BookOpen, color: 'from-emerald-600 to-teal-700', activeBorder: 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/50', iconBg: 'bg-emerald-100 text-emerald-700' };
    }
    if (m.includes('ski') || m.includes('sejarah')) {
      return { icon: Landmark, color: 'from-amber-600 to-orange-700', activeBorder: 'border-amber-600 ring-2 ring-amber-200 bg-amber-50/50', iconBg: 'bg-amber-100 text-amber-800' };
    }
    if (m.includes('arab')) {
      return { icon: Languages, color: 'from-indigo-500 to-purple-600', activeBorder: 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/50', iconBg: 'bg-indigo-100 text-indigo-700' };
    }
    if (m.includes('agama') || m.includes('pai')) {
      return { icon: GraduationCap, color: 'from-teal-600 to-emerald-700', activeBorder: 'border-teal-500 ring-2 ring-teal-200 bg-teal-50/50', iconBg: 'bg-teal-100 text-teal-700' };
    }
    if (m.includes('ipas') || m.includes('ipa') || m.includes('ips')) {
      return { icon: Globe, color: 'from-cyan-500 to-blue-600', activeBorder: 'border-cyan-500 ring-2 ring-cyan-200 bg-cyan-50/50', iconBg: 'bg-cyan-100 text-cyan-700' };
    }
    if (m.includes('matematika') || m.includes('math')) {
      return { icon: Calculator, color: 'from-blue-600 to-indigo-700', activeBorder: 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/50', iconBg: 'bg-blue-100 text-blue-700' };
    }
    if (m.includes('indonesia')) {
      return { icon: Feather, color: 'from-fuchsia-500 to-pink-600', activeBorder: 'border-fuchsia-500 ring-2 ring-fuchsia-200 bg-fuchsia-50/50', iconBg: 'bg-fuchsia-100 text-fuchsia-700' };
    }
    if (m.includes('pancasila') || m.includes('pkn')) {
      return { icon: ShieldCheck, color: 'from-red-600 to-rose-700', activeBorder: 'border-red-500 ring-2 ring-red-200 bg-red-50/50', iconBg: 'bg-red-100 text-red-700' };
    }
    return { icon: Sparkles, color: 'from-emerald-600 to-teal-600', activeBorder: 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/50', iconBg: 'bg-emerald-100 text-emerald-700' };
  };

  const [selectedMapelOg, setSelectedMapelOg] = useState<string>(mapelName);

  // Synchronize document head Open Graph tags when subject or module selection changes
  useEffect(() => {
    updateOgForModuleOrMapel(selectedModule, selectedMapelOg);
  }, [selectedModule, selectedMapelOg, mapelOgConfigs]);
  const [floatingMapel, setFloatingMapel] = useState<string | null>(null);
  const [showMapelGridModal, setShowMapelGridModal] = useState<boolean>(false);
  const [showSoalGridModal, setShowSoalGridModal] = useState<boolean>(false);
  const [searchMapelGrid, setSearchMapelGrid] = useState<string>('');

  const getSecureOrigin = () => {
    const origin = window.location.origin;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal && origin.startsWith('http://')) {
      return origin.replace(/^http:\/\//i, 'https://');
    }
    return origin;
  };

  const normalizeDomainUrl = (input: string): string => {
    if (!input || !input.trim()) return '';
    let str = input.trim();
    // Fix typos like https:/domain.com, http:/domain.com, https///domain.com
    str = str.replace(/^(https?):\/+([^\/])/i, '$1://$2');
    if (!/^https?:\/\//i.test(str)) {
      str = str.replace(/^[:\/]+/, '');
      if (str) {
        str = `https://${str}`;
      }
    }
    try {
      const parsed = new URL(str);
      let origin = parsed.origin;
      if (!origin || origin === 'null' || origin === 'https://' || origin === 'http://') {
        return str.replace(/\/+$/, '');
      }
      let pathname = parsed.pathname;
      if (pathname === '/') pathname = '';
      return `${origin}${pathname}`.replace(/\/+$/, '');
    } catch {
      return str.replace(/\/+$/, '');
    }
  };

  const getEffectiveOrigin = () => {
    if (testHostingDomain.trim()) {
      return normalizeDomainUrl(testHostingDomain);
    }
    return getSecureOrigin();
  };

  const effectiveOrigin = getEffectiveOrigin();
  const isLocalHostOrPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('run.app');

  const getCleanShareUrl = () => {
    let origin = effectiveOrigin;
    let pathname = window.location.pathname;

    if (testHostingDomain.trim()) {
      const normalized = normalizeDomainUrl(testHostingDomain);
      try {
        const parsed = new URL(normalized);
        origin = parsed.origin;
        if (parsed.pathname && parsed.pathname !== '/') {
          pathname = parsed.pathname;
        }
      } catch {
        origin = normalized;
      }
    }

    const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const params: string[] = ['mode=siswa'];

    if (targetModulId) params.push(`moduleId=${strictUrlEncode(targetModulId)}`);
    if (selectedMapelOg) params.push(`mapel=${sanitizeMapelKey(selectedMapelOg)}`);

    return `${origin}${cleanPath}?${params.join('&')}`;
  };

  const studentShareUrl = getCleanShareUrl();
  const whatsappShareTextFull = `*Kuis & Media Interaktif ${selectedMapelOg}*\n📌 *Mata Pelajaran:* ${selectedMapelOg}\n📖 *Materi:* ${materiName}\n🏫 *Kelas:* ${faseKelas}\n\n${studentShareUrl}`;
  const whatsappShareUrlClean = `https://wa.me/?text=${encodeURIComponent(studentShareUrl)}`;
  const whatsappShareUrlFull = `https://wa.me/?text=${encodeURIComponent(whatsappShareTextFull)}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Kuis & Media Interaktif ${selectedMapelOg}`,
          text: `📌 *Mata Pelajaran:* ${selectedMapelOg} - ${materiName}`,
          url: studentShareUrl,
        });
        return;
      } catch (err) {
        console.log('Native share cancelled or not supported:', err);
      }
    }
    window.open(whatsappShareUrlClean, '_blank');
  };

  const handleCopyStudentShareLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(studentShareUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }).catch(() => {
        prompt('Salin link kuis & media khusus siswa berikut:', studentShareUrl);
      });
    } else {
      prompt('Salin link kuis & media khusus siswa berikut:', studentShareUrl);
    }
  };

  const questions: SoalKuis[] = media.soalKuis || [];
  const flashcards: Flashcard[] = media.materiInteraktif?.flashcards || [];
  const riwayatHasil: HasilKuisItem[] = media.riwayatHasilKuis || [];
  const currentQ = questions[currentQuestionIndex];

  const handleSaveScoreToModule = (nameOverride?: string) => {
    if (!selectedModule || !onUpdateModule || questions.length === 0) return;
    const studentName = (nameOverride || namaSiswa || studentSession?.nama).trim() || 'Siswa MI';
    const calculatedNilai = Math.round((score / questions.length) * 100);

    const detailedAnswers: StudentQuizResultDetail[] = questions.map((q, idx) => {
      const ansIdx = userAnswers[idx] !== undefined ? userAnswers[idx] : -1;
      const isBenar = ansIdx === q.kunciJawaban;
      return {
        soalId: q.id || `q-${idx}`,
        pertanyaan: q.pertanyaan,
        pilihan: q.pilihan,
        jawabanSiswaIndex: ansIdx,
        kunciJawabanIndex: q.kunciJawaban,
        isBenar,
        penjelasanKbc: q.penjelasanKbc || ''
      };
    });

    const resultId = `res-${Date.now()}`;
    const newItem: HasilKuisItem = {
      id: resultId,
      namaSiswa: studentName,
      studentId: studentSession?.id || '',
      nisn: studentSession?.nisn || '',
      kelas: studentSession?.kelas || selectedModule.identitas?.faseKelas || 'Kelas 1 (Fase A)',
      skor: score,
      totalSoal: questions.length,
      nilai: calculatedNilai,
      guruPengampu: selectedModule.guruPengampu || selectedModule.penyusun || selectedModule.ttd?.guruKelasNama || '',
      guruNip: selectedModule.ttd?.guruKelasNIP || '',
      tanggal: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      detailJawaban: detailedAnswers
    };

    const currentList = selectedModule.assesmen?.mediaDigital?.riwayatHasilKuis || [];
    const updatedList = [newItem, ...currentList];

    const updatedModule: ModulAjarCinta = {
      ...selectedModule,
      updatedAt: new Date().toISOString(),
      assesmen: {
        ...selectedModule.assesmen,
        mediaDigital: {
          ...selectedModule.assesmen.mediaDigital,
          riwayatHasilKuis: updatedList
        }
      }
    };

    onUpdateModule(updatedModule);

    // Also persist globally into StudentQuizResult
    const globalResult: StudentQuizResult = {
      id: resultId,
      studentId: studentSession?.id || '',
      studentName: studentName,
      nisn: studentSession?.nisn || '',
      kelas: studentSession?.kelas || selectedModule.identitas?.faseKelas || 'Kelas 1 (Fase A)',
      rombelId: studentSession?.rombelId || '',
      modulId: selectedModule.id,
      modulJudul: selectedModule.judul || selectedModule.identitas?.materi || 'Kuis KBC',
      mataPelajaran: selectedModule.identitas?.mataPelajaran || 'Mata Pelajaran Umum',
      materi: selectedModule.identitas?.materi || '',
      faseKelas: selectedModule.identitas?.faseKelas || '',
      guruPengampu: selectedModule.guruPengampu || selectedModule.penyusun || selectedModule.ttd?.guruKelasNama || '',
      guruNip: selectedModule.ttd?.guruKelasNIP || '',
      skor: score,
      totalSoal: questions.length,
      nilai: calculatedNilai,
      tanggal: new Date().toISOString(),
      waktuPengerjaan: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      detailJawaban: detailedAnswers
    };

    addStudentQuizResult(globalResult);
    setStudentQuizArchives(loadStoredStudentQuizResults());

    setSavedScoreMsg(`✅ Hasil kuis ${studentName} (${calculatedNilai}) berhasil disimpan ke Rekap Nilai!`);
    setTimeout(() => setSavedScoreMsg(''), 4000);
  };

  const handleDeleteHasilItem = (idToDelete: string) => {
    if (!selectedModule || !onUpdateModule) return;
    const currentList = selectedModule.assesmen?.mediaDigital?.riwayatHasilKuis || [];
    const updatedList = currentList.filter(item => item.id !== idToDelete);

    const updatedModule: ModulAjarCinta = {
      ...selectedModule,
      updatedAt: new Date().toISOString(),
      assesmen: {
        ...selectedModule.assesmen,
        mediaDigital: {
          ...selectedModule.assesmen.mediaDigital,
          riwayatHasilKuis: updatedList
        }
      }
    };
    onUpdateModule(updatedModule);
  };

  const handleGenerateQuizMediaAI = async () => {
    if (!selectedModule || !onUpdateModule) return;
    setIsGenerating(true);
    setGenStatusMsg(`Menghasilkan Kuis ${targetJumlahSoal} Soal & Media Digital AI...`);
    try {
      const data = await safeFetchJson('/api/generate-quiz-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey
        },
        body: JSON.stringify({
          mataPelajaran: selectedModule.identitas.mataPelajaran,
          materi: selectedModule.identitas.materi,
          faseKelas: selectedModule.identitas.faseKelas,
          jumlahSoal: targetJumlahSoal,
          userApiKey: apiKey
        })
      });

      if (!data || !data.success || !data.mediaDigital) {
        throw new Error(data?.error || 'Gagal menghasilkan media digital KBC.');
      }

      const updatedModule: ModulAjarCinta = {
        ...selectedModule,
        updatedAt: new Date().toISOString(),
        assesmen: {
          ...selectedModule.assesmen,
          mediaDigital: data.mediaDigital
        }
      };

      onUpdateModule(updatedModule);
      handleRestartQuiz();
      setFlashIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal membuat Kuis & Media AI: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
      setGenStatusMsg('');
    }
  };

  const handleFillInstantKbcTemplate = () => {
    if (!selectedModule || !onUpdateModule) return;
    const materiName = selectedModule.identitas.materi || 'Materi Pembelajaran';
    const mapelName = selectedModule.identitas.mataPelajaran || 'Pendidikan Agama Islam';

    // Generate 25 complete, varied KBC questions for the module
    const generated25Questions: SoalKuis[] = Array.from({ length: 25 }, (_, i) => {
      const num = i + 1;
      const questionTopics = [
        `Apa tujuan utama dan pemahaman mendalam dari mempelajari ${materiName}?`,
        `Bagaimana sikap terbaik siswa Madrasah Ibtidaiyah saat mempelajari ${materiName}?`,
        `Apa hikmah utama dari penerapan nilai ${materiName} dalam kehidupan sehari-hari?`,
        `Dalam Kurikulum Berbasis Cinta (KBC), bagaimana ${materiName} mencerminkan rasa syukur kepada Allah SWT?`,
        `Bagaimana cara mempraktikkan kebaikan ${materiName} kepada teman di madrasah?`,
        `Mengapa rasa empati dan kasih sayang menjadi bagian penting saat memahami ${materiName}?`,
        `Apa wujud nyata pengalaman bertoleransi dan menghargai saat mempelajari ${materiName}?`,
        `Bagaimana membiasakan tutur kata yang santun sesuai ajaran ${materiName}?`,
        `Sebutkan pilar Panca Cinta KBC yang paling erat kaitannya dengan ${materiName}!`,
        `Bagaimana peran orang tua dan guru dalam membimbing pengamalan ${materiName}?`,
        `Mengapa keikhlasan menjadi syarat utama dalam mengamalkan ${materiName}?`,
        `Apa manfaat dari menerapkan sikap disiplin dan bersunggguh-sungguh dalam belajar ${materiName}?`,
        `Bagaimana sikap siswa jika melihat teman kesulitan memahami ${materiName}?`,
        `Sebutkan contoh perbuatan terpuji harian yang lahir dari pemahaman ${materiName}!`,
        `Mengapa kita harus saling mendoakan kebaikan saat mempelajari ${materiName}?`,
        `Apa hubungan antara menjaga kebersihan lingkungan dengan ajaran ${materiName}?`,
        `Bagaimana cara merespons nasihat guru tentang materi ${materiName}?`,
        `Apa dampak positif jika seluruh siswa mengamalkan ${materiName} di kelas?`,
        `Bagaimana cara mengendalikan emosi sesuai prinsip kasih sayang KBC pada ${materiName}?`,
        `Mengapa adab membaca doa sebelum dan sesudah belajar ${materiName} sangat dianjurkan?`,
        `Apa keutamaan membagikan pemahaman ${materiName} kepada adik atau saudara di rumah?`,
        `Bagaimana menunjukkan rasa cinta tanah air dan persatuan melalui pembelajaran ${materiName}?`,
        `Mengapa keberkahan ilmu erat kaitannya dengan penghormatan kepada guru saat belajar ${materiName}?`,
        `Bagaimana memanfaatkan media digital dengan bijak untuk memperdalam ${materiName}?`,
        `Apa komitmen kebaikan diri yang ingin kamu terapkan setelah menyelesaikan ${materiName}?`
      ];

      const topicText = questionTopics[i % questionTopics.length];

      return {
        id: `q-${Date.now()}-${num}`,
        pertanyaan: `No. ${num}: ${topicText}`,
        pilihan: [
          `Memahami dan mengamalkan nilai ${materiName} dengan niat ikhlas, penuh rasa kasih sayang, dan kebersamaan`,
          `Sekadar menghafal tanpa perlu dipraktikkan dalam kehidupan sehari-hari`,
          `Hanya mencari pujian dan nilai angka tanpa kepedulian`,
          `Apatis dan tidak mau membantu sesama teman`
        ],
        kunciJawaban: 0,
        penjelasanKbc: `Masya Allah, jawaban Anda tepat sekali! Mengamalkan ${materiName} pada soal nomor ${num} mendatangkan keberkahan, memperhalus akhlak, dan mempererat tali kebersamaan.`
      };
    });

    const defaultKbcMedia: MediaDigital = {
      soalKuis: generated25Questions,
      materiInteraktif: {
        ringkasanRingkas: `Pembelajaran ${materiName} pada mata pelajaran ${mapelName} mengajarkan kita untuk memahami konsep secara utuh, melatih rasa empati, serta mempraktikkan kasih sayang kepada seluruh makhluk ciptaan Allah SWT.`,
        poinPenting: [
          `Pahami makna inti ${materiName} dengan bimbingan guru dan rasa cinta ilmu.`,
          `Praktikkan nilai kebaikan dalam tindakan harian di lingkungan kelas dan rumah.`,
          `Tebarkan kehangatan dan keteladanan akhlakul karimah kepada sesama murid.`
        ],
        flashcards: [
          { id: `fc1`, depan: `Apa materi utama hari ini?`, belakang: `${materiName}` },
          { id: `fc2`, depan: `Bagaimana mengamalkan ${materiName}?`, belakang: `Niat ikhlas karena Allah SWT, tutur kata santun, dan tindakan nyata kasih sayang.` },
          { id: `fc3`, depan: `Pesan KBC dalam ${mapelName}`, belakang: `Menjadikan belajar sebagai sarana menyemai Panca Cinta (Cinta Allah, Rasul, Orang Tua, Guru, Sesama & Alam).` }
        ]
      },
      gambarInteraktif: {
        deskripsiVisual: `Ilustrasi suasana pembelajaran ${materiName} di kelas Madrasah Ibtidaiyah yang ramah anak, bersih, dan penuh semangat kebersamaan.`,
        promptGambar: `A colorful vector illustration for Islamic elementary school classroom lesson ${materiName}, Indonesian students smiling helping each other, high quality educational flat design style.`,
        imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(`Vector illustration Islamic primary school classroom ${materiName}, Indonesian students smiling helping each other, child friendly`)}&width=800&height=600&nologo=true&seed=${Date.now()}`,
        hotspots: [
          { x: 30, y: 40, judul: 'Sudut Kebersamaan KBC', penjelasan: 'Tempat di mana para murid saling berdiskusi dan berbagi ide kebaikan.' },
          { x: 70, y: 50, judul: 'Area Karya & Refleksi', penjelasan: 'Ruang untuk menampilkan hasil refleksi cinta dan apresiasi positif.' }
        ]
      }
    };

    const updatedModule: ModulAjarCinta = {
      ...selectedModule,
      updatedAt: new Date().toISOString(),
      assesmen: {
        ...selectedModule.assesmen,
        mediaDigital: defaultKbcMedia
      }
    };

    onUpdateModule(updatedModule);
    handleRestartQuiz();
    setFlashIndex(0);
    setIsFlipped(false);
  };

  const handleRegenerateImageAI = async () => {
    if (!selectedModule || !onUpdateModule) return;
    setIsGeneratingImg(true);
    try {
      const promptText = media.gambarInteraktif?.promptGambar || `Illustration for Islamic primary school lesson ${selectedModule.identitas.materi}`;
      const data = await safeFetchJson('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey
        },
        body: JSON.stringify({
          prompt: promptText,
          userApiKey: apiKey
        })
      });

      if (data.success && data.imageUrl) {
        const updatedModule: ModulAjarCinta = {
          ...selectedModule,
          updatedAt: new Date().toISOString(),
          assesmen: {
            ...selectedModule.assesmen,
            mediaDigital: {
              ...selectedModule.assesmen.mediaDigital,
              gambarInteraktif: {
                ...selectedModule.assesmen.mediaDigital.gambarInteraktif,
                imageUrl: data.imageUrl
              }
            }
          }
        };
        onUpdateModule(updatedModule);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handlePrintQuizResult = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const finalScore = Math.round((score / questions.length) * 100);
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Hasil Kuis - ${judulModul}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; color: #065f46; font-size: 20px; text-transform: uppercase; }
            .header p { margin: 4px 0 0; color: #475569; font-size: 13px; font-weight: 600; }
            .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 12px; margin-bottom: 24px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
            .score-badge { font-size: 26px; font-weight: 800; color: #047857; text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #a7f3d0; }
            .pesan { background: #f8fafc; border-left: 4px solid #10b981; padding: 14px; font-style: italic; font-size: 12px; margin-bottom: 24px; border-radius: 4px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN HASIL KUIS INTERAKTIF DIGITAL</h1>
            <p>MADRASAH IBTIDAIYAH - KURIKULUM BERBASIS CINTA (KBC)</p>
          </div>
          <div class="info-box">
            <div class="info-grid">
              <div><strong>Nama Peserta Didik:</strong> ${namaSiswa.trim() || 'Siswa MI'}</div>
              <div><strong>Materi / Pembelajaran:</strong> ${judulModul}</div>
              <div><strong>Tanggal Pengerjaan:</strong> ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div><strong>Jumlah Soal:</strong> ${questions.length} Soal</div>
            </div>
            <div class="score-badge">
              NILAI AKHIR: ${finalScore} / 100 (${score} Benar dari ${questions.length} Soal)
            </div>
          </div>
          <div class="pesan">
            <strong>Pesan Kasih Sayang Guru (KBC):</strong><br>
            "Semoga ilmu yang dipelajari membawa berkah, memperhalus tutur kata, dan menyemai benih kasih sayang di dalam hati."
          </div>
          <div class="footer">
            <div style="text-align: center; width: 200px;">
              <p>Mengetahui,</p>
              <p style="font-weight: bold;">Guru Mata Pelajaran</p>
              <div style="height: 60px;"></div>
              <p>_______________________</p>
            </div>
            <div style="text-align: center; width: 200px;">
              <p>Siswa / Orang Tua,</p>
              <p style="font-weight: bold;">${namaSiswa.trim() || 'Peserta Didik'}</p>
              <div style="height: 60px;"></div>
              <p>_______________________</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQ) return;
    setIsAnswerSubmitted(true);
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: selectedOption }));
    if (selectedOption === currentQ.kunciJawaban) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setSelectedOption(userAnswers[nextIdx] ?? null);
      setIsAnswerSubmitted(userAnswers[nextIdx] !== undefined);
    } else {
      setQuizFinished(true);
      // Auto-save score if studentSession or namaSiswa is present
      const currentStudentName = studentSession?.nama || namaSiswa.trim();
      if (currentStudentName) {
        setTimeout(() => {
          handleSaveScoreToModule(currentStudentName);
        }, 100);
      }
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers({});
    setScore(0);
    setQuizFinished(false);
  };

  const allSubjectCards = useMemo(() => {
    // Single source of truth from Master Mapel list
    const masterList = loadMasterMapelList();
    const deletedSet = loadDeletedMapelSet();

    const rawList: string[] = [...masterList];

    (customMapelList || []).forEach(m => {
      if (m && m.trim()) rawList.push(m.trim());
    });

    const bankSource = (materiBankList && materiBankList.length > 0) ? materiBankList : INITIAL_MATERI_BANK;
    bankSource.forEach(b => {
      if (b.mataPelajaran && b.mataPelajaran.trim()) {
        rawList.push(b.mataPelajaran.trim());
      }
    });

    (allModules || []).forEach(m => {
      if (m.identitas?.mataPelajaran && m.identitas.mataPelajaran.trim()) {
        rawList.push(m.identitas.mataPelajaran.trim());
      }
    });

    // Clean, Deduplicate & Exclude Deleted Mapels
    const result: string[] = [];
    const seenNormalized = new Set<string>();

    for (const item of rawList) {
      if (!item) continue;
      const norm = normalizeMapelKey(item);
      if (!seenNormalized.has(norm) && !isMapelDeleted(item, deletedSet)) {
        seenNormalized.add(norm);
        result.push(item.trim());
      }
    }

    return result;
  }, [customMapelList, materiBankList, allModules]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-4 sm:space-y-5 bg-slate-50 text-slate-800 overscroll-contain">
      {!isStudentMode && (
        <>
          {/* 1. Banner Link Kuis Siswa (Siap Bagikan & Akses Langsung) */}
          <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 text-white rounded-2xl p-2.5 sm:p-5 shadow-md border border-emerald-500/40 space-y-2 sm:space-y-4 relative overflow-hidden">
            {/* Background glow accent */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-row items-center justify-between gap-2 pb-2 sm:pb-3 border-b border-emerald-800/80">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div 
                  onClick={() => bannerLogoInputRef.current?.click()}
                  className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-md overflow-hidden relative group cursor-pointer"
                  title="Klik untuk Upload / Ganti Logo Banner Kuis Siswa"
                >
                  {bannerLogoUrl ? (
                    <img src={bannerLogoUrl} alt="Logo Banner" className="w-full h-full object-cover rounded-full p-0.5" />
                  ) : (
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white rounded-full">
                    Ganti
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-0.5 sm:gap-1">
                    <h3 className="text-xs sm:text-base font-black tracking-tight text-white truncate">
                      Banner Link Kuis Siswa
                    </h3>
                    <span className="bg-amber-400 text-slate-950 text-[8px] sm:text-[10px] font-black px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full shadow-xs shrink-0">
                      Akses Tanpa Login
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-emerald-200/90 font-medium truncate mt-0.5">
                    Mata Pelajaran: <span className="font-extrabold text-amber-300">{selectedMapelOg}</span> ({faseKelas})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenStudentMode) {
                      onOpenStudentMode();
                    } else {
                      const url = getCleanShareUrl();
                      window.open(url, '_blank');
                    }
                  }}
                  className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 text-[10px] sm:text-xs px-2.5 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-emerald-700 font-bold flex items-center space-x-1 sm:space-x-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                  <span>Pratinjau</span>
                </button>
              </div>
            </div>

            {/* Hidden File Input for Banner Logo */}
            <input
              type="file"
              ref={bannerLogoInputRef}
              onChange={handleBannerLogoUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Input Link & Quick Actions Grid */}
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    readOnly
                    value={studentShareUrl}
                    className="w-full bg-slate-900/90 border border-emerald-600/60 rounded-lg sm:rounded-xl px-2.5 py-1 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-mono text-emerald-200 focus:outline-none truncate font-bold shadow-inner"
                  />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewWaModule({
                        id: selectedModule?.id,
                        judul: judulModul,
                        mapel: selectedMapelOg || mapelName,
                        materi: materiName,
                        faseKelas: faseKelas,
                        soalCount: media?.soalKuisList?.length || targetJumlahSoal || 25,
                        studentUrl: studentShareUrl,
                        waText: whatsappShareTextFull,
                      });
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl flex items-center justify-center space-x-1 sm:space-x-1.5 transition-all shadow-md cursor-pointer shrink-0 border border-sky-400/40"
                    title="Lihat Detail & Pratinjau Kuis Sebelum Dikirim ke WhatsApp"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-200" />
                    <span>View Detail</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyStudentShareLink}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl flex items-center justify-center space-x-1 sm:space-x-2 transition-all shadow-md cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
                  </button>

                  <a
                    href={whatsappShareUrlFull}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl flex items-center justify-center space-x-1 sm:space-x-2 transition-all shadow-md cursor-pointer shrink-0 border border-emerald-400/40"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Bagikan WA</span>
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-1.5 text-xs pt-0.5 sm:pt-1">
                <div className="flex items-center space-x-1 text-emerald-200/90 text-[10px] sm:text-[11px]">
                  <Info className="w-3 h-3 text-amber-300 shrink-0" />
                  <span className="truncate">Akses langsung tanpa login.</span>
                </div>

                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1">
                  {bannerLogoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveBannerLogo}
                      className="bg-rose-500/90 hover:bg-rose-600 text-white font-bold text-[10px] sm:text-xs px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1"
                      title="Hapus Logo Banner"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Hapus Logo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowShareOgModal(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center space-x-1 transition-all shadow-xs cursor-pointer border border-amber-300/50"
                    title="Bagikan link kuis ke siswa"
                  >
                    <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-950" />
                    <span>Bagikan Link Kuis</span>
                  </button>
                </div>
              </div>
            </div>
          </div>


        </>
      )}

      {!isStudentMode && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-3.5 sm:p-5 shadow-sm space-y-3.5 my-3">
          {/* Header Wadah Menu Utama */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-emerald-800 to-teal-900 text-amber-300 flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <span>Menu Utama Pengaturan & Media Kuis</span>
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                    Digital KBC
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                  Akses cepat kuis AI, mata pelajaran, atur thumbnail, dan logo banner sekolah/madrasah
                </p>
              </div>
            </div>
          </div>

          {/* Grid 4 Menu Ikon Cantik Berjejer Samping */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* 1. Card: Membuat Soal Kuis */}
            <button
              type="button"
              onClick={() => setShowMembuatSoalFloatingModal(true)}
              className="group relative bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 hover:from-emerald-900 hover:to-teal-950 text-white p-4 rounded-2xl border-2 border-emerald-500/40 hover:border-amber-400 shadow-sm hover:shadow-md transition-all duration-300 text-left cursor-pointer flex flex-col justify-between overflow-hidden active:scale-[0.98]"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-300 text-slate-950 p-0.5 shadow-sm group-hover:scale-110 transition-transform">
                  <div className="w-full h-full bg-emerald-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                </div>
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Soal AI
                </span>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                  Membuat Soal Kuis
                </h4>
                <p className="text-[11px] text-emerald-200/80 line-clamp-2 mt-0.5 font-medium">
                  Hasilkan kuis AI ({targetJumlahSoal} Soal), flashcard, & media interaktif
                </p>
              </div>
            </button>

            {/* 2. Card: Memilih Mata Pelajaran */}
            <button
              type="button"
              onClick={() => setShowPilihMapelFloatingModal(true)}
              className="group relative bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 hover:from-slate-900 hover:to-emerald-900 text-white p-4 rounded-2xl border-2 border-teal-500/40 hover:border-amber-400 shadow-sm hover:shadow-md transition-all duration-300 text-left cursor-pointer flex flex-col justify-between overflow-hidden active:scale-[0.98]"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-400 text-slate-950 p-0.5 shadow-sm group-hover:scale-110 transition-transform">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-300" />
                  </div>
                </div>
                <span className="bg-emerald-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  12+ Mapel
                </span>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                  Memilih Mata Pelajaran
                </h4>
                <p className="text-[11px] text-teal-200/80 line-clamp-1 mt-0.5 font-medium">
                  Aktif: <span className="font-extrabold text-amber-300">{selectedMapelOg || mapelName}</span>
                </p>
              </div>
            </button>

            {/* 3. Card: Atur Thumbnail */}
            <button
              type="button"
              onClick={() => handleOpenThumbnailModal(selectedMapelOg || mapelName)}
              className="group relative bg-gradient-to-br from-amber-950 via-slate-900 to-emerald-950 hover:from-amber-900 hover:to-slate-950 text-white p-4 rounded-2xl border-2 border-amber-500/40 hover:border-amber-400 shadow-sm hover:shadow-md transition-all duration-300 text-left cursor-pointer flex flex-col justify-between overflow-hidden active:scale-[0.98]"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-300 via-amber-400 to-amber-500 text-amber-950 p-0.5 shadow-sm group-hover:scale-110 transition-transform">
                  <div className="w-full h-full bg-amber-950 rounded-[10px] flex items-center justify-center">
                    <Camera className="w-5 h-5 text-amber-300" />
                  </div>
                </div>
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Gambar Mapel
                </span>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                  Atur Thumbnail
                </h4>
                <p className="text-[11px] text-amber-200/80 line-clamp-2 mt-0.5 font-medium">
                  Atur gambar thumbnail {selectedMapelOg || mapelName}
                </p>
              </div>
            </button>

            {/* 4. Card: Atur Logo Banner */}
            <button
              type="button"
              onClick={() => bannerLogoInputRef.current?.click()}
              className="group relative bg-gradient-to-br from-teal-950 via-slate-950 to-emerald-950 hover:from-teal-900 hover:to-slate-900 text-white p-4 rounded-2xl border-2 border-sky-500/40 hover:border-amber-400 shadow-sm hover:shadow-md transition-all duration-300 text-left cursor-pointer flex flex-col justify-between overflow-hidden active:scale-[0.98]"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-400 via-teal-300 to-emerald-400 text-slate-950 p-0.5 shadow-sm group-hover:scale-110 transition-transform">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Upload className="w-5 h-5 text-amber-300" />
                  </div>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs ${
                  bannerLogoUrl ? 'bg-emerald-400 text-slate-950' : 'bg-sky-400 text-slate-950'
                }`}>
                  {bannerLogoUrl ? 'Terpasang' : 'Upload Logo'}
                </span>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                  Atur Logo Banner
                </h4>
                <p className="text-[11px] text-sky-200/80 line-clamp-2 mt-0.5 font-medium">
                  {bannerLogoUrl ? 'Ganti logo madrasah/sekolah terpasang' : 'Unggah logo madrasah untuk banner kuis'}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* FLOATING MODAL LIST MODUL AJAR PER MAPEL (MELAYANG) */}
      {floatingMapel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[80] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header Modal Floating */}
            <div className="p-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  {React.createElement(getMapelInfo(floatingMapel).icon, { className: "w-5 h-5 text-amber-300" })}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold truncate flex items-center space-x-2">
                    <span>Daftar Modul Ajar:</span>
                    <span className="text-amber-300">{floatingMapel}</span>
                  </h3>
                  <p className="text-[11px] text-emerald-100/90 truncate">Pilih modul ajar yang ingin ditampilkan pada media pembelajaran</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFloatingMapel(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Floating Modules Grid */}
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
              {(() => {
                const currentMapel = floatingMapel.toLowerCase().trim();
                const matchingMods = (allModules || []).filter(m =>
                  m.identitas?.mataPelajaran?.toLowerCase().trim() === currentMapel ||
                  m.identitas?.mataPelajaran?.toLowerCase().includes(currentMapel) ||
                  currentMapel.includes(m.identitas?.mataPelajaran?.toLowerCase() || '')
                );

                if (matchingMods.length > 0) {
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {matchingMods.map((mod) => {
                        const isActive = selectedModule?.id === mod.id;
                        const info = getMapelInfo(mod.identitas.mataPelajaran);
                        const MapelIcon = info.icon;

                        return (
                          <div
                            key={mod.id}
                            onClick={() => {
                              if (onSelectModule) onSelectModule(mod);
                              setSelectedMapelOg(mod.identitas.mataPelajaran);
                              setFloatingMapel(null);
                            }}
                            className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-2.5 ${
                              isActive
                                ? 'bg-emerald-50/90 border-2 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                                : 'bg-white hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-400 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                isActive ? 'bg-emerald-600 text-white shadow-xs' : info.iconBg
                              }`}>
                                <MapelIcon className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                    isActive ? 'bg-emerald-200 text-emerald-950' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {mod.identitas.faseKelas || 'Fase B'}
                                  </span>
                                  {isActive && (
                                    <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      <span>Aktif</span>
                                    </span>
                                  )}
                                </div>

                                <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${
                                  isActive ? 'text-emerald-950 font-extrabold' : 'text-slate-900'
                                }`}>
                                  {mod.judul}
                                </h4>

                                {mod.identitas?.materi && (
                                  <p className="text-[11px] text-slate-500 truncate">
                                    Materi: {mod.identitas.materi}
                                  </p>
                                )}

                                <div className="flex items-center space-x-1.5 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded-md font-extrabold w-fit mt-1">
                                  <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Dibuat: {formatCreatedDate(mod.createdAt, mod.identitas?.tanggalPelaksanaan)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: View Detail, Salin Link Kuis & Bagikan ke WA */}
                            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center space-x-1 flex-wrap gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const mapel = mod.identitas?.mataPelajaran || 'Mata Pelajaran';
                                    const cleanKey = mapel ? sanitizeMapelKey(mapel) : '';
                                    const v = Date.now();
                                    const baseUrl = `${window.location.origin}${window.location.pathname}`;
                                    const studentUrl = `${baseUrl}?mode=siswa${mod.id ? `&moduleId=${strictUrlEncode(mod.id)}` : ''}${cleanKey ? `&mapel=${cleanKey}` : ''}&v=${v}`;
                                    const text = `Assalamualaikum Wr. Wb.\n\nAnanda Siswa/Siswi, berikut Link Kuis Interaktif:\n📚 *Mata Pelajaran:* ${mapel}\n🏷️ *Materi:* ${mod.identitas?.materi || mod.judul}\n🏫 *Kelas:* ${mod.identitas?.faseKelas || '-'}\n\nSilakan klik link berikut untuk pengerjaan kuis:\n👉 ${studentUrl}\n\nSelamat mengerjakan! 🚀`;

                                    setPreviewWaModule({
                                      id: mod.id,
                                      judul: mod.judul,
                                      mapel: mapel,
                                      materi: mod.identitas?.materi || mod.judul,
                                      faseKelas: mod.identitas?.faseKelas || '-',
                                      soalCount: mod.mediaDigital?.soalKuisList?.length || 0,
                                      studentUrl: studentUrl,
                                      waText: text,
                                    });
                                  }}
                                  className="bg-sky-100 hover:bg-sky-200 text-sky-950 border border-sky-300 font-extrabold text-[10px] px-2 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                                  title="Lihat Detail & Pratinjau Kuis Sebelum Dikirim ke WhatsApp"
                                >
                                  <Eye className="w-3 h-3 text-sky-700" />
                                  <span>View Detail</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanKey = mod.identitas?.mataPelajaran ? sanitizeMapelKey(mod.identitas.mataPelajaran) : '';
                                    const v = Date.now();
                                    const baseUrl = `${window.location.origin}${window.location.pathname}`;
                                    const studentUrl = `${baseUrl}?mode=siswa${mod.id ? `&moduleId=${strictUrlEncode(mod.id)}` : ''}${cleanKey ? `&mapel=${cleanKey}` : ''}&v=${v}`;

                                    if (navigator.clipboard && navigator.clipboard.writeText) {
                                      navigator.clipboard.writeText(studentUrl).then(() => {
                                        setToastMsg(`Link Kuis "${mod.judul}" Berhasil Disalin!`);
                                        setTimeout(() => setToastMsg(''), 4000);
                                      }).catch(() => {
                                        prompt('Salin link kuis khusus siswa berikut:', studentUrl);
                                      });
                                    } else {
                                      prompt('Salin link kuis khusus siswa berikut:', studentUrl);
                                    }
                                  }}
                                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 font-extrabold text-[10px] px-2 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                                  title="Salin Link Kuis Siswa untuk modul ini"
                                >
                                  <Copy className="w-3 h-3 text-emerald-700" />
                                  <span>Salin Link</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const mapel = mod.identitas?.mataPelajaran || 'Mata Pelajaran';
                                    const cleanKey = mapel ? sanitizeMapelKey(mapel) : '';
                                    const v = Date.now();
                                    const baseUrl = `${window.location.origin}${window.location.pathname}`;
                                    const studentUrl = `${baseUrl}?mode=siswa${mod.id ? `&moduleId=${strictUrlEncode(mod.id)}` : ''}${cleanKey ? `&mapel=${cleanKey}` : ''}&v=${v}`;

                                    const text = `Assalamualaikum Wr. Wb.\n\nAnanda Siswa/Siswi, berikut Link Kuis Interaktif:\n📚 *Mata Pelajaran:* ${mapel}\n🏷️ *Materi:* ${mod.identitas?.materi || mod.judul}\n🏫 *Kelas:* ${mod.identitas?.faseKelas || '-'}\n\nSilakan klik link berikut untuk pengerjaan kuis:\n👉 ${studentUrl}\n\nSelamat mengerjakan! 🚀`;

                                    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                                    window.open(waUrl, '_blank');
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-2 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                                  title="Bagikan Kuis ke WhatsApp"
                                >
                                  <Send className="w-3 h-3 text-amber-300" />
                                  <span>Bagikan WA</span>
                                </button>
                              </div>

                              <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-0.5">
                                <span>Pilih</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 text-center space-y-3 my-2">
                    <p className="text-xs text-slate-700 font-semibold">
                      Belum ada Modul Ajar khusus untuk mata pelajaran <strong>{floatingMapel}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const targetMapel = floatingMapel;
                        const bankSource = (materiBankList && materiBankList.length > 0) ? materiBankList : INITIAL_MATERI_BANK;
                        const bankItem = bankSource.find(b => b.mataPelajaran.toLowerCase().trim() === targetMapel.toLowerCase().trim());
                        const created = createDefaultModuleForMapel(targetMapel, bankItem, selectedModule);
                        if (onUpdateModule) onUpdateModule(created);
                        if (onSelectModule) onSelectModule(created);
                        setFloatingMapel(null);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-bold inline-flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-amber-300" />
                      <span>Gunakan / Buat Modul Default {floatingMapel}</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Footer Modal Floating */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-medium px-2">
                Pilih modul di atas untuk mengganti tampilan media
              </span>
              <button
                type="button"
                onClick={() => setFloatingMapel(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Lock Gate Jika Belum Login */}
      {!studentSession && (
        <div className="sticky top-2 z-30 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl text-white shadow-xl border border-amber-300/60 backdrop-blur-md flex flex-row items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 text-left min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-400 text-slate-900 font-black flex items-center justify-center shrink-0 shadow-md">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-xs sm:text-sm text-white leading-tight flex items-center space-x-1 sm:space-x-1.5 truncate">
                <span>LOGIN SISWA</span>
                <span className="bg-amber-300 text-slate-900 text-[8px] sm:text-[9px] px-1 py-0.2 rounded font-extrabold uppercase shrink-0">Wajib</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-amber-100 font-medium mt-0.5 truncate">
                Login untuk membuka kuis & media.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowStudentLoginModal(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs flex items-center space-x-1 sm:space-x-1.5 shadow-md transition-all shrink-0 cursor-pointer active:scale-98 uppercase tracking-wider"
          >
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900" />
            <span>Login Siswa</span>
          </button>
        </div>
      )}

      {/* Main Content Area: Locked Gate when !studentSession OR Unlocked Dashboard when studentSession */}
      {!studentSession ? (
        <div className="bg-white p-4 sm:p-10 rounded-2xl sm:rounded-3xl border border-amber-200 shadow-md text-center space-y-3 sm:space-y-5 my-2 sm:my-3">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto border-2 border-amber-300/80 shadow-inner">
            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
          </div>

          <div className="max-w-md mx-auto space-y-1 sm:space-y-2">
            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
              Akses Dashboard Kuis Belum Terbuka
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
              Silakan login dengan memilih Nama Siswa (PIN) atau NISN Anda untuk memulai kuis interaktif, flashcards, dan menyimpan nilai otomatis.
            </p>
          </div>

          <div className="pt-1 sm:pt-2">
            <button
              type="button"
              onClick={() => setShowStudentLoginModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs inline-flex items-center space-x-1.5 sm:space-x-2 shadow-lg transition-all cursor-pointer active:scale-98"
            >
              <UserCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300" />
              <span>MASUK AKUN SISWA SEKARANG</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Banner Header Kuis Siswa dengan Logo Upload */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-md border border-emerald-500/40 flex flex-row items-center justify-between gap-2 sm:gap-3 my-1.5 sm:my-2">
            <div className="flex items-center space-x-2 sm:space-x-3 text-left min-w-0">
              <div 
                onClick={() => !isStudentMode && bannerLogoInputRef.current?.click()}
                className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-md overflow-hidden group relative ${!isStudentMode ? 'cursor-pointer' : ''}`}
                title={!isStudentMode ? "Klik untuk Upload / Ganti Logo Banner Kuis Siswa" : "Logo Banner Kuis"}
              >
                {bannerLogoUrl ? (
                  <img src={bannerLogoUrl} alt="Logo Banner Kuis" className="w-full h-full object-cover rounded-full p-0.5" />
                ) : (
                  <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6 text-amber-300" />
                )}
                {!isStudentMode && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white rounded-full">
                    Ganti
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 flex-wrap gap-0.5 sm:gap-1">
                  <h3 className="font-extrabold text-xs sm:text-base text-white truncate">
                    KUIS SISWA INTERAKTIF
                  </h3>
                  <span className="bg-amber-400 text-slate-950 text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full uppercase shrink-0">
                    {faseKelas}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-emerald-200 font-medium truncate mt-0.5">
                  Mapel: <strong className="text-amber-300">{selectedMapelOg}</strong>
                </p>
              </div>
            </div>

            {!isStudentMode && (
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => bannerLogoInputRef.current?.click()}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl font-bold flex items-center space-x-1 sm:space-x-1.5 transition-all shadow-xs cursor-pointer"
                  title="Upload / Ganti Logo Banner Kuis Siswa"
                >
                  <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-950" />
                  <span>{bannerLogoUrl ? 'Ganti Logo' : 'Upload Logo'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Bar Akun Ringkas & Tombol Keluar */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50/90 border border-emerald-200/80 rounded-xl text-xs text-slate-700 my-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="truncate">Siswa: <strong className="text-emerald-950 font-bold">{studentSession.nama}</strong> <span className="text-[11px] text-slate-500">({studentSession.kelas})</span></span>
            </div>
            <button
              type="button"
              onClick={() => {
                saveStudentSession(null);
                setStudentSession(null);
                setNamaSiswa('');
              }}
              className="text-[11px] font-bold text-slate-600 hover:text-rose-600 flex items-center space-x-1 shrink-0 transition-colors cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-slate-200"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Ganti Akun</span>
            </button>
          </div>

          {/* Grid Ikon Minimalis Menu Link Kuis Siswa */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2">
        {[
          {
            id: 'quiz',
            title: 'Kuis Interaktif',
            count: `${questions.length} Soal Pilihan`,
            icon: HelpCircle,
            activeBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md ring-2 ring-emerald-500/40',
            iconBg: 'bg-white/20 text-white',
            inactiveIconBg: 'bg-emerald-100 text-emerald-700'
          },
          {
            id: 'flashcard',
            title: 'Flashcard Kartu',
            count: `${flashcards.length} Kartu Pembelajaran`,
            icon: Layers,
            activeBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md ring-2 ring-emerald-500/40',
            iconBg: 'bg-white/20 text-white',
            inactiveIconBg: 'bg-blue-100 text-blue-700'
          },
          {
            id: 'media',
            title: 'Visual & Ringkasan',
            count: 'Materi Gambar Digital',
            icon: ImageIcon,
            activeBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md ring-2 ring-emerald-500/40',
            iconBg: 'bg-white/20 text-white',
            inactiveIconBg: 'bg-indigo-100 text-indigo-700'
          },
          {
            id: 'rekap',
            title: 'Arsip & Hasil Nilai',
            count: `${studentSession ? studentQuizArchives.filter(a => a.studentId === studentSession.id || a.studentName === studentSession.nama).length : riwayatHasil.length} Arsip Pengerjaan`,
            icon: Award,
            activeBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md ring-2 ring-emerald-500/40',
            iconBg: 'bg-white/20 text-white',
            inactiveIconBg: 'bg-amber-100 text-amber-700'
          }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id as any)}
              className={`p-3.5 rounded-2xl border transition-all duration-200 text-left flex items-center space-x-3 cursor-pointer group active:scale-98 ${
                isActive
                  ? item.activeBg
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-2xs hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${
                isActive ? item.iconBg : item.inactiveIconBg
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-xs truncate leading-snug">{item.title}</p>
                <p className={`text-[10px] font-medium truncate mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {item.count}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* View Mode 1: Quiz */}
      {mode === 'quiz' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
          {questions.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">Belum ada soal kuis digital pada modul ini</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Klik tombol di bawah ini untuk secara otomatis menghasilkan soal kuis interaktif, flashcard, dan gambar ilustrasi berbasis AI.
                </p>
              </div>
              {selectedModule && onUpdateModule && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleGenerateQuizMediaAI}
                    disabled={isGenerating}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs px-4 py-2.5 rounded-xl font-bold inline-flex items-center space-x-2 shadow-xs transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                        <span>Sedang Membuat Kuis AI...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Otomatis Hasikan Kuis & Media AI</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleFillInstantKbcTemplate}
                    disabled={isGenerating}
                    className="bg-slate-100 hover:bg-slate-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl font-bold inline-flex items-center space-x-2 border border-slate-300 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Isi Kuis & Flashcard KBC (Instan)</span>
                  </button>
                </div>
              )}
            </div>
          ) : quizFinished ? (
            /* Result Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto border border-emerald-300 text-emerald-700">
                <Award className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-emerald-800">Alhamdulillah! Kuis Selesai</h3>
                <p className="text-xs text-slate-600">
                  Skor Anda: <span className="font-extrabold text-emerald-700 text-lg">{score}</span> / {questions.length} Soal Benar ({Math.round((score / questions.length) * 100)}%)
                </p>
              </div>

              {savedScoreMsg && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-2.5 rounded-xl max-w-md mx-auto font-bold flex items-center justify-center space-x-2 animate-fadeIn shadow-2xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{savedScoreMsg}</span>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 max-w-md mx-auto space-y-3 text-left shadow-2xs">
                <div>
                  <label className="text-[11px] font-bold text-emerald-800 block mb-1">Nama Peserta Didik (Untuk Rekap Nilai Modul):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={namaSiswa}
                      onChange={e => setNamaSiswa(e.target.value)}
                      placeholder="Masukkan nama lengkap siswa..."
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                    {selectedModule && onUpdateModule && (
                      <button
                        type="button"
                        onClick={() => handleSaveScoreToModule()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center space-x-1 transition-all shrink-0 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Ke Rekap</span>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">Pesan Kasih Sayang Guru:</p>
                  <p className="italic text-[11px] text-slate-500 mt-0.5">
                    "Semoga ilmu yang dipelajari membawa berkah, memperhalus tutur kata, dan menyemai benih kasih sayang di dalam hati."
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleRestartQuiz}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-4 py-2.5 rounded-xl font-medium flex items-center space-x-2 transition-all border border-slate-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ulangi Kuis</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedModule && onUpdateModule && namaSiswa.trim() && !savedScoreMsg) {
                      handleSaveScoreToModule();
                    }
                    setMode('rekap');
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all"
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Lihat Tab Rekap Nilai Siswa ({riwayatHasil.length})</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedModule && onUpdateModule && namaSiswa.trim() && !savedScoreMsg) {
                      handleSaveScoreToModule();
                    }
                    handlePrintQuizResult();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 py-2.5 rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Laporan Hasil Nilai</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Question Screen */
            <div className="space-y-4">
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold text-slate-800">Soal {currentQuestionIndex + 1} dari {questions.length}</span>
                <span className="text-emerald-800 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Skor: {score} / {questions.length}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              {/* Quick Jump Matrix Grid for 25 Questions */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Papan Navigasi Soal ({questions.length} Nomor):</span>
                  <span className="text-slate-500">Klik nomor untuk lompat soal</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                  {questions.map((_, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isAnswered = userAnswers[idx] !== undefined;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          setSelectedOption(userAnswers[idx] ?? null);
                          setIsAnswerSubmitted(userAnswers[idx] !== undefined);
                        }}
                        className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center border ${
                          isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/40 shadow-xs scale-105'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                        title={`Lompat ke Soal Nomor ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Box */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  {currentQ?.pertanyaan}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQ?.pilihan.map((opt, idx) => {
                  let isSelected = selectedOption === idx;
                  let isCorrect = idx === currentQ.kunciJawaban;
                  let buttonStyle = 'bg-white border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/40 text-slate-800';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      buttonStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = 'bg-rose-100 border-rose-400 text-rose-900 font-medium';
                    }
                  } else if (isSelected) {
                    buttonStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${buttonStyle}`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0 border border-slate-300">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isAnswerSubmitted && (
                        <div>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submitted Feedback Box */}
              {isAnswerSubmitted && (
                <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl space-y-1.5 animate-fadeIn">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Penjelasan Berbasis Cinta (KBC):</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {currentQ?.penjelasanKbc}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition-all shadow-xs"
                  >
                    Jawab Sekarang
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all shadow-xs"
                  >
                    <span>{currentQuestionIndex + 1 < questions.length ? 'Soal Berikutnya' : 'Lihat Hasil Kuis'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Mode 2: Flashcard */}
      {mode === 'flashcard' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-center">
          {flashcards.length === 0 ? (
            <div className="py-8 text-slate-500 text-xs">Belum ada flashcard pada modul ini.</div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="text-xs text-slate-500 font-medium">
                Kartu {flashIndex + 1} dari {flashcards.length} • Klik kartu untuk membalik
              </div>

              {/* Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full h-56 bg-slate-50 rounded-2xl border-2 border-emerald-500/60 p-6 flex flex-col items-center justify-center cursor-pointer shadow-xs transition-all hover:border-emerald-600 relative group overflow-hidden"
              >
                <div className="absolute top-3 left-3 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                  {isFlipped ? 'Jawaban / Penjelasan' : 'Pertanyaan / Istilah'}
                </div>

                <div className="space-y-2">
                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                    {isFlipped ? flashcards[flashIndex]?.belakang : flashcards[flashIndex]?.depan}
                  </p>
                  <p className="text-[10px] text-slate-500 italic">
                    {isFlipped ? '(Klik untuk lihat pertanyaan)' : '(Klik untuk balik kartu)'}
                  </p>
                </div>
              </div>

              {/* Flashcard Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setFlashIndex(prev => (prev > 0 ? prev - 1 : flashcards.length - 1));
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl border border-slate-300 flex items-center space-x-1 font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  {isFlipped ? 'Tutup Jawaban' : 'Buka Jawaban'}
                </button>

                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setFlashIndex(prev => (prev + 1 < flashcards.length ? prev + 1 : 0));
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl border border-slate-300 flex items-center space-x-1 font-semibold"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Mode 3: Gambar & Ringkasan */}
      {mode === 'media' && (
        <div className="space-y-4">
          {/* Ringkasan */}
          {media.materiInteraktif?.ringkasanRingkas && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Ringkasan Materi Interaktif</span>
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {media.materiInteraktif.ringkasanRingkas}
              </p>

              {media.materiInteraktif.poinPenting && (
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pt-1">
                  {media.materiInteraktif.poinPenting.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Gambar Interaktif Visual */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4" />
                <span>Media Gambar & Visual Ilustrasi</span>
              </h3>

              {selectedModule && onUpdateModule && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowShareOgModal(true)}
                    className="bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs px-3 py-1.5 rounded-xl border border-sky-300 font-bold flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer"
                    title="Bagikan link kuis & media mata pelajaran ini ke siswa"
                  >
                    <Share2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Bagikan Link Kuis</span>
                  </button>

                  <button
                    onClick={handleRegenerateImageAI}
                    disabled={isGeneratingImg}
                    className="bg-slate-100 hover:bg-slate-200 text-emerald-800 text-xs px-3 py-1.5 rounded-xl border border-slate-300 font-bold flex items-center space-x-1.5 transition-all shrink-0"
                  >
                    {isGeneratingImg ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span>Membuat Gambar AI...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Generasi Ulang Gambar AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">Deskripsi Ilustrasi Visual:</p>
              <p className="text-[11px] text-slate-500">{media.gambarInteraktif?.deskripsiVisual || 'Ilustrasi pembelajaran KBC'}</p>
            </div>

            {(() => {
              const materiName = selectedModule?.identitas?.materi || 'Materi Pembelajaran';
              const mapelTarget = selectedModule?.identitas?.mataPelajaran || selectedMapelOg || 'Pendidikan Agama Islam';
              const mapelThumb = getThumbnailForMapel(mapelTarget);
              const rawImg = media.gambarInteraktif?.imageUrl;
              const isDefaultUnsplash = rawImg && rawImg.includes('1577896851231-70ef18881754');

              let effectiveImg = rawImg;
              if (!effectiveImg || isDefaultUnsplash || effectiveImg.includes('placeholder-broken')) {
                if (mapelThumb && !mapelThumb.includes('1577896851231-70ef18881754')) {
                  effectiveImg = mapelThumb;
                }
              }

              const promptFallback = media.gambarInteraktif?.promptGambar || `Vector illustration of Islamic primary school lesson ${materiName}, Indonesian students smiling, child friendly`;
              const displayImg = getReliableImageUrl(
                effectiveImg,
                promptFallback,
                materiName,
                mapelTarget
              );
              
              return (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 p-2 flex items-center justify-center min-h-[300px]">
                    <img
                      src={displayImg}
                      alt="Media Visual Modul Pembelajaran"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, materiName, selectedModule?.identitas?.mataPelajaran)}
                      className="w-full h-auto max-h-[480px] object-contain mx-auto rounded-xl shadow-xs transition-all bg-white"
                    />

                    {/* Quick Control Bar Over Image */}
                    <div className="absolute top-4 right-4 flex items-center space-x-2 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-md">
                      <button
                        onClick={() => setIsZoomingImg(true)}
                        className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center space-x-1"
                        title="Buka Gambar Layar Penuh"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Layar Penuh</span>
                      </button>
                      <span className="text-slate-300">|</span>
                      <a
                        href={displayImg}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center space-x-1"
                        title="Buka Tab Baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      </a>
                    </div>

                    {/* Hotspot Markers */}
                    {media.gambarInteraktif?.hotspots?.map((hs, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveHotspot(hs)}
                        style={{ top: `${hs.y}%`, left: `${hs.x}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center border-2 border-white shadow-xl animate-bounce hover:scale-125 transition-transform"
                        title={hs.judul}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Hotspots Summary List */}
                  {media.gambarInteraktif?.hotspots && media.gambarInteraktif.hotspots.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                        📌 Poin Informasi Interaktif Visual (Klik Angka di Gambar):
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {media.gambarInteraktif.hotspots.map((hs, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActiveHotspot(hs)}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all space-y-0.5"
                          >
                            <div className="flex items-center space-x-1.5 font-bold text-xs text-emerald-800">
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-extrabold shrink-0">
                                {idx + 1}
                              </span>
                              <span>{hs.judul}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 pl-5 leading-relaxed">{hs.penjelasan}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fullscreen Zoom Modal */}
                  {isZoomingImg && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center animate-fadeIn">
                      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                            <span>Media Visual Pembelajaran - {selectedModule?.identitas?.materi || 'Detail'}</span>
                          </h3>
                          <button
                            onClick={() => setIsZoomingImg(false)}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 font-bold text-xs px-2.5"
                          >
                            Tutup (✕)
                          </button>
                        </div>
                        <div className="p-4 overflow-auto flex-1 bg-slate-100 flex items-center justify-center">
                          <img
                            src={displayImg}
                            alt="Media Visual Zoom"
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-md"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Hotspot Popup */}
            {activeHotspot && (
              <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl text-xs space-y-1 animate-fadeIn shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 text-xs flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">✓</span>
                    <span>{activeHotspot.judul}</span>
                  </h4>
                  <button onClick={() => setActiveHotspot(null)} className="text-xs text-slate-500 hover:text-slate-800 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    Tutup
                  </button>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed pl-5">{activeHotspot.penjelasan}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Mode 4: Rekap Hasil Nilai Kuis */}
      {mode === 'rekap' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Rekap Hasil Pengerjaan Kuis Siswa</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar nilai pengerjaan kuis peserta didik untuk modul: <strong className="text-slate-800">{judulModul}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGlobalRecapModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-200" />
                  <span>Rekap Lengkap Madrasah & Rombel</span>
                </button>

                {riwayatHasil.length > 0 && (
                  <button
                    onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Rekap Nilai Kuis - ${judulModul}</title>
                          <style>
                            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #0f172a; max-width: 900px; margin: 0 auto; }
                            h1 { color: #065f46; font-size: 18px; text-transform: uppercase; margin-bottom: 4px; }
                            p { font-size: 12px; color: #475569; margin: 0 0 20px; }
                            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
                            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
                            th { background-color: #f0fdf4; color: #166534; font-weight: 800; }
                            .nilai { font-weight: bold; color: #047857; }
                            @media print { body { padding: 0; } }
                          </style>
                        </head>
                        <body>
                          <h1>REKAP NILAI KUIS INTERAKTIF DIGITAL</h1>
                          <p>Modul: <strong>${judulModul}</strong> | Madrasah Ibtidaiyah KBC | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
                          <table>
                            <thead>
                              <tr>
                                <th>No</th>
                                <th>Nama Peserta Didik</th>
                                <th>Waktu Pengerjaan</th>
                                <th>Soal Benar</th>
                                <th>Nilai Akhir</th>
                                <th>Kualifikasi</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${riwayatHasil.map((item, idx) => `
                                <tr>
                                  <td>${idx + 1}</td>
                                  <td><strong>${item.namaSiswa}</strong></td>
                                  <td>${item.tanggal}</td>
                                  <td>${item.skor} dari ${item.totalSoal}</td>
                                  <td class="nilai">${item.nilai}</td>
                                  <td>${item.nilai >= 85 ? 'Sangat Baik' : item.nilai >= 70 ? 'Baik' : 'Perlu Bimbingan'}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          <script>window.onload = function() { window.print(); };</script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Rekap Nilai</span>
                </button>
              )}
            </div>
          </div>

          {riwayatHasil.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-200">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="text-sm font-bold text-slate-900">Belum Ada Rekap Nilai Siswa</p>
                  <p className="text-xs text-slate-500">
                    Setiap kali siswa menyelesaikan kuis pada modul ini dan menyimpan nama, nilainya akan otomatis tersimpan & terekap di sini.
                  </p>
                </div>
                <button
                  onClick={() => setMode('quiz')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-bold inline-flex items-center space-x-1.5 shadow-xs mt-2"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Mulai Kerjakan Kuis Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-emerald-900 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Peserta Didik</th>
                      <th className="py-2.5 px-3">Waktu Pengerjaan</th>
                      <th className="py-2.5 px-3">Soal Benar</th>
                      <th className="py-2.5 px-3">Nilai</th>
                      <th className="py-2.5 px-3">Kualifikasi</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {riwayatHasil.map((item, idx) => {
                      const kualifikasi = item.nilai >= 85 ? 'Sangat Baik' : item.nilai >= 70 ? 'Baik' : 'Perlu Bimbingan';
                      const badgeColor = item.nilai >= 85 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : item.nilai >= 70 ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-amber-100 text-amber-800 border-amber-300';

                      return (
                        <tr key={`${item.id || 'res'}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{item.namaSiswa}</td>
                          <td className="py-3 px-3 text-slate-500 text-[11px]">{item.tanggal}</td>
                          <td className="py-3 px-3">{item.skor} / {item.totalSoal} Soal</td>
                          <td className="py-3 px-3 font-extrabold text-sm text-emerald-700">{item.nilai}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                              {kualifikasi}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteHasilItem(item.id)}
                              className="text-rose-600 hover:text-rose-700 text-xs p-1.5 rounded hover:bg-rose-50 transition-all"
                              title="Hapus Rekap Nilai Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {/* Modal Bagikan Link Kuis/Media Siswa */}
      {showShareOgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col space-y-0">
            {/* Modal Header Ringkas */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                {(() => {
                  const info = getMapelInfo(selectedMapelOg);
                  const MapelIcon = info.icon;
                  return (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 text-amber-300 shrink-0">
                      <MapelIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-extrabold truncate">Bagikan Link Kuis & Media</h3>
                  <p className="text-[10px] text-emerald-100/90 truncate">
                    Mata Pelajaran <span className="font-extrabold text-amber-200">{selectedMapelOg}</span> ({faseKelas})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowShareOgModal(false)}
                className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all shrink-0 ml-2 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-3.5 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {toastMsg && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] px-3 py-2 rounded-xl font-bold flex items-center space-x-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{toastMsg}</span>
                </div>
              )}

              {/* Pilih Mata Pelajaran & Link Share */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <h4 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-1">
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Kuis Siswa ({selectedMapelOg})</span>
                </h4>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Mata Pelajaran:</label>
                  <select
                    value={selectedMapelOg}
                    onChange={(e) => {
                      const newMapel = e.target.value;
                      setSelectedMapelOg(newMapel);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-emerald-900 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                  >
                    {allSubjectCards.map((mapel) => (
                      <option key={mapel} value={mapel}>
                        {mapel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={studentShareUrl}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-800 focus:outline-none truncate font-semibold"
                  />
                  <button
                    onClick={handleCopyStudentShareLink}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 shrink-0 transition-all shadow-2xs cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                  <button
                    onClick={() => {
                      setPreviewWaModule({
                        id: selectedModule?.id,
                        judul: judulModul,
                        mapel: selectedMapelOg || mapelName,
                        materi: materiName,
                        faseKelas: faseKelas,
                        soalCount: media?.soalKuisList?.length || targetJumlahSoal || 25,
                        studentUrl: studentShareUrl,
                        waText: whatsappShareTextFull,
                      });
                    }}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white text-[11px] py-2 px-2.5 rounded-lg font-bold flex items-center justify-center space-x-1 shadow-2xs transition-all text-center cursor-pointer"
                    title="Lihat Detail & Pratinjau Kuis Sebelum Dikirim"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-200 shrink-0" />
                    <span>View Detail</span>
                  </button>

                  <button
                    onClick={handleNativeShare}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] py-2 px-2.5 rounded-lg font-bold flex items-center justify-center space-x-1.5 shadow-2xs transition-all text-center cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Bagikan WA (Direct)</span>
                  </button>

                  <a
                    href={whatsappShareUrlFull}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[11px] py-2 px-2.5 rounded-lg font-bold flex items-center justify-center space-x-1.5 shadow-2xs transition-all text-center cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span>Bagikan WA (Teks)</span>
                  </a>
                </div>
              </div>

              {/* Section Thumbnail Mata Pelajaran */}
              <div className="space-y-2 bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thumbnail Mata Pelajaran ({selectedMapelOg})</span>
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    KBC Mapel
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Foto thumbnail ini digunakan di setiap kartu mapel, slide carousel, grid modal, dan pratinjau media.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <div className="w-full sm:w-36 h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0 relative group shadow-inner">
                    <img
                      src={getThumbnailForMapel(selectedMapelOg)}
                      alt={`Thumbnail ${selectedMapelOg}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, getPresetImageForMapel(selectedMapelOg))}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold">
                      Pratinjau
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => mapelOgFileInputRef.current?.click()}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs border border-amber-300 flex items-center space-x-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-950" />
                        <span>Unggah Thumbnail Mapel</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetMapelThumbnail}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border border-slate-700 flex items-center space-x-1"
                        title="Kembalikan gambar thumbnail ke preset bawaan sistem"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reset Preset</span>
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 italic">
                      Format disarankan: JPG / PNG (Format horizontal 16:9 / persegi).
                    </div>
                  </div>
                </div>

                <input
                  type="file"
                  ref={mapelOgFileInputRef}
                  onChange={handleMapelThumbnailUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Section Logo Banner Kuis Siswa */}
              <div className="space-y-2 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                <h4 className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider flex items-center space-x-1">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Logo Banner Kuis Siswa</span>
                </h4>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Upload logo madrasah/sekolah yang akan ditampilkan pada Banner Kuis Siswa.
                </p>

                <div className="flex items-center space-x-3 pt-1">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-emerald-300 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {bannerLogoUrl ? (
                      <img src={bannerLogoUrl} alt="Logo Banner" className="w-full h-full object-cover rounded-full p-0.5" />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-emerald-700" />
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => bannerLogoInputRef.current?.click()}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs border border-amber-300"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-950" />
                      <span>{bannerLogoUrl ? 'Ganti Logo Banner' : 'Upload Logo Banner'}</span>
                    </button>

                    {bannerLogoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveBannerLogo}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Petunjuk Pengiriman Link WA */}
              <div className="bg-amber-50 border border-amber-200/90 rounded-lg p-2.5 text-[10px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center space-x-1 text-amber-950">
                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Petunjuk Pembagian Link ke Siswa:</span>
                </div>
                <p className="leading-relaxed text-amber-900">
                  Klik tombol <strong>"Bagikan WA (Direct)"</strong> atau <strong>"Salin Link"</strong> lalu tempelkan langsung di WhatsApp Group siswa untuk mengerjakan kuis & media interaktif.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-3 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setShowShareOgModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-4 py-1.5 rounded-lg font-bold transition-all shadow-2xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Modal Grid Modern Pilih Modul Ajar & Mata Pelajaran */}
      {showMapelGridModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold truncate">Pilih Modul Ajar & Mata Pelajaran</h3>
                  <p className="text-xs text-emerald-200/90 truncate">Pilih modul dari grid ikon interaktif di bawah ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMapelGridModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Filter Pencarian Modul */}
            {allModules && allModules.length > 4 && (
              <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchMapelGrid}
                    onChange={(e) => setSearchMapelGrid(e.target.value)}
                    placeholder="Cari mata pelajaran atau modul..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Grid Kartu Modul Ajar */}
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {allModules &&
                  allModules
                    .filter((mod) => {
                      if (!searchMapelGrid.trim()) return true;
                      const q = searchMapelGrid.toLowerCase();
                      return (
                        mod.identitas.mataPelajaran.toLowerCase().includes(q) ||
                        mod.judul.toLowerCase().includes(q) ||
                        (mod.identitas.materiPokok && mod.identitas.materiPokok.toLowerCase().includes(q))
                      );
                    })
                    .map((mod, idx) => {
                      const isSelected = selectedModule?.id === mod.id;
                      const info = getMapelInfo(mod.identitas.mataPelajaran);
                      const MapelIcon = info.icon;
                      const mapelThumb = getThumbnailForMapel(mod.identitas.mataPelajaran);

                      return (
                        <button
                          key={`${mod.id}-${idx}`}
                          type="button"
                          onClick={() => {
                            if (onSelectModule) onSelectModule(mod);
                            setSelectedMapelOg(mod.identitas.mataPelajaran);
                            setShowMapelGridModal(false);
                          }}
                          className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex items-start space-x-3 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-2 border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200/90 hover:border-emerald-500 hover:bg-emerald-50/20'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-200/90 shadow-2xs relative mt-0.5">
                            <img
                              src={mapelThumb}
                              alt={`Thumbnail ${mod.identitas.mataPelajaran}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => handleImageError(e, getPresetImageForMapel(mod.identitas.mataPelajaran))}
                            />
                            <div className={`absolute -bottom-0.5 -right-0.5 p-0.5 rounded-tl-md flex items-center justify-center ${
                              isSelected ? 'bg-emerald-600 text-white shadow-2xs' : info.iconBg
                            }`}>
                              <MapelIcon className="w-2.5 h-2.5" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                isSelected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {mod.identitas.mataPelajaran}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>

                            <h4 className={`text-xs font-extrabold mt-1.5 leading-snug line-clamp-2 ${
                              isSelected ? 'text-emerald-950' : 'text-slate-900'
                            }`}>
                              {mod.judul}
                            </h4>

                            <p className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1.5 font-medium flex-wrap gap-y-0.5">
                              <span>Fase {mod.identitas.fase || 'C'}</span>
                              <span>•</span>
                              <span>Kelas {mod.identitas.kelas || '5'}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{formatCreatedDate(mod.createdAt, mod.identitas?.tanggalPelaksanaan)}</span>
                              </span>
                            </p>
                          </div>
                        </button>
                      );
                    })}
              </div>

              {allModules &&
                allModules.filter((mod) => {
                  if (!searchMapelGrid.trim()) return true;
                  const q = searchMapelGrid.toLowerCase();
                  return (
                    mod.identitas.mataPelajaran.toLowerCase().includes(q) ||
                    mod.judul.toLowerCase().includes(q)
                  );
                }).length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Tidak ada modul yang cocok dengan kata kunci "{searchMapelGrid}".
                  </div>
                )}
            </div>

            {/* Footer Modal */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowMapelGridModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Grid Modern Pilih Target Jumlah Soal Kuis */}
      {showSoalGridModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-5 space-y-4">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Pilih Jumlah Soal Kuis</h3>
                  <p className="text-xs text-slate-500">Target nomor soal yang akan dihasilkan AI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSoalGridModal(false)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid Pilihan Jumlah Soal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                { count: 5, label: '5 Soal', desc: 'Ringkas & Cepat' },
                { count: 10, label: '10 Soal', desc: 'Format Standar Singkat' },
                { count: 15, label: '15 Soal', desc: 'Soal Sedang' },
                { count: 20, label: '20 Soal', desc: 'Soal Lengkap' },
                { count: 25, label: '25 Soal (Default)', desc: 'Komprehensif / Rekomendasi' },
              ].map((opt) => {
                const isSelected = targetJumlahSoal === opt.count;

                return (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => {
                      setTargetJumlahSoal(opt.count);
                      setShowSoalGridModal(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold ring-2 ring-emerald-500/30'
                        : 'bg-white hover:bg-emerald-50/30 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <p className="text-xs font-extrabold truncate">{opt.label}</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {opt.desc}
                      </p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-white shrink-0" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Modal */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSoalGridModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail & Pratinjau Kuis Sebelum Dikirim ke WhatsApp */}
      {previewWaModule && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <Eye className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">Detail & Pratinjau Kuis WA</h3>
                  <p className="text-[11px] text-emerald-100/90">Periksa detail modul & teks pesan sebelum dikirim ke WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewWaModule(null)}
                className="p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-700 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Modal (Scrollable) */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Info Ringkas Modul */}
              <div className="bg-emerald-50/70 rounded-xl p-3.5 border border-emerald-200/80 space-y-2">
                <div className="flex items-start space-x-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-emerald-300 shrink-0 shadow-xs">
                    <img
                      src={getThumbnailForMapel(previewWaModule.mapel)}
                      alt={`Thumbnail ${previewWaModule.mapel}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, getPresetImageForMapel(previewWaModule.mapel))}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="bg-emerald-800 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {previewWaModule.mapel}
                      </span>
                      <span className="text-xs font-bold text-emerald-900">
                        Kelas: {previewWaModule.faseKelas}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{previewWaModule.judul}</h4>
                    <p className="text-xs text-slate-600">
                      <strong>Materi:</strong> {previewWaModule.materi}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-emerald-200/60">
                  <span>Target Soal: <strong className="text-slate-800">{previewWaModule.soalCount || 25} Soal</strong></span>
                  <span className="text-[11px] text-emerald-800 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Siap Dibagikan</span>
                  </span>
                </div>
              </div>

              {/* Tampilan Gelembung Pesan WhatsApp (WhatsApp Speech Bubble Preview) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Pratinjau Teks Pesan WhatsApp:</span>
                </label>
                <div className="bg-[#efeae2] p-3.5 rounded-2xl border border-slate-300/80 shadow-inner">
                  <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-xs text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed border border-slate-200/60 relative">
                    {previewWaModule.waText}
                  </div>
                </div>
              </div>

              {/* Field URL Link Kuis Siswa */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Kuis Siswa (Langsung Dikerjakan):</span>
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    readOnly
                    value={previewWaModule.studentUrl}
                    className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(previewWaModule.studentUrl);
                        setToastMsg('Link Kuis Berhasil Disalin!');
                        setTimeout(() => setToastMsg(''), 3000);
                      } else {
                        prompt('Salin Link Kuis Siswa:', previewWaModule.studentUrl);
                      }
                    }}
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Salin</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  window.open(previewWaModule.studentUrl, '_blank');
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                title="Buka & uji tampilan kuis siswa di tab baru"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-200" />
                <span>Buka Tampilan Siswa (Uji)</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPreviewWaModule(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Tutup
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(previewWaModule.waText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer border border-emerald-500/50"
                >
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>Kirim ke WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Easy Thumbnail Manager Modal */}
      {showThumbnailModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 flex items-center justify-between shrink-0 border-b border-emerald-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-extrabold shadow-sm">
                  <Camera className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
                    <span>Atur Thumbnail Mata Pelajaran</span>
                  </h3>
                  <p className="text-[11px] text-emerald-200/90">Ganti gambar thumbnail untuk modul kuis & media interaktif</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowThumbnailModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {toastMsg && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl flex items-center space-x-2 text-xs font-bold animate-fadeIn shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{toastMsg}</span>
                </div>
              )}

              {/* Selector Mata Pelajaran */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Mata Pelajaran:</span>
                </label>
                <select
                  value={targetMapelForThumb}
                  onChange={(e) => {
                    const newMapel = e.target.value;
                    setTargetMapelForThumb(newMapel);
                    setUrlInputForThumb(getThumbnailForMapel(newMapel));
                  }}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
                >
                  {allSubjectCards.map((mp) => (
                    <option key={mp} value={mp}>
                      {mp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pratinjau Thumbnail Saat Ini */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pratinjau Thumbnail ({targetMapelForThumb})</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    16:9 / Kartu
                  </span>
                </div>
                <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative group shadow-inner">
                  <img
                    src={getThumbnailForMapel(targetMapelForThumb)}
                    alt={`Thumbnail ${targetMapelForThumb}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, getPresetImageForMapel(targetMapelForThumb))}
                  />
                  {isUploadingThumb && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xs flex flex-col items-center justify-center space-y-2 text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                      <span className="text-xs font-bold text-amber-200">Menyimpan Thumbnail...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tab Opsi Pengaturan Thumbnail */}
              <div className="space-y-3">
                <div className="flex items-center border-b border-slate-200 gap-1">
                  <button
                    type="button"
                    onClick={() => setThumbTab('upload')}
                    className={`px-3 py-2 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
                      thumbTab === 'upload'
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>1. Unggah Berkas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThumbTab('url')}
                    className={`px-3 py-2 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
                      thumbTab === 'url'
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>2. Tempel Link URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThumbTab('preset')}
                    className={`px-3 py-2 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
                      thumbTab === 'preset'
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>3. Galeri Preset (1-Klik)</span>
                  </button>
                </div>

                {/* Content Tab 1: Upload File */}
                {thumbTab === 'upload' && (
                  <div className="space-y-2">
                    <div
                      onClick={() => directThumbFileInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-extrabold text-slate-900">
                          Klik untuk Memilih Foto dari HP / Komputer
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Format: JPG, PNG, WEBP (Otomatis dikompres & dioptimalkan)
                        </p>
                      </div>
                      <span className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all">
                        Pilih File Gambar
                      </span>
                    </div>
                    <input
                      type="file"
                      ref={directThumbFileInputRef}
                      onChange={(e) => handleUploadMapelThumbnailFile(e, targetMapelForThumb)}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                )}

                {/* Content Tab 2: URL Input */}
                {thumbTab === 'url' && (
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-800 block">
                      Masukkan atau Tempel Alamat Link Gambar (URL):
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="url"
                        value={urlInputForThumb}
                        onChange={(e) => setUrlInputForThumb(e.target.value)}
                        placeholder="https://images.unsplash.com/... atau link gambar"
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveMapelThumbnailUrl(targetMapelForThumb, urlInputForThumb)}
                        disabled={isUploadingThumb || !urlInputForThumb.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs shrink-0 flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5 text-amber-300" />
                        <span>Gunakan URL</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Anda bisa menempelkan link dari Unsplash, Google Drive (direct link), Imgur, atau domain web manapun.
                    </p>
                  </div>
                )}

                {/* Content Tab 3: Preset Gallery */}
                {thumbTab === 'preset' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-600 font-medium">
                      Pilih salah satu foto Islami / Pendidikan berkualitas tinggi di bawah ini (1-Klik Terapkan):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1">
                      {[
                        { name: 'Fiqih & Ibadah', url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Akidah Akhlak', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Al-Qur\'an Hadis', url: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Sejarah / SKI', url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Bahasa Arab', url: '/data/og_mapel_bahasa_arab.png' },
                        { name: 'IPAS (Sains)', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Matematika', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Bahasa Indonesia', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Pancasila', url: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'PJOK / Olahraga', url: 'https://images.unsplash.com/photo-1517649763962-0c623266ecf0?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Bahasa Inggris', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Seni Budaya', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80' }
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleSaveMapelThumbnailUrl(targetMapelForThumb, item.url)}
                          className="group relative h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left"
                        >
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, getPresetImageForMapel(item.name))}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 flex items-end">
                            <span className="text-[10px] font-extrabold text-white line-clamp-1">
                              {item.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => handleResetMapelThumbnailTarget(targetMapelForThumb)}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                title="Kembalikan gambar thumbnail ke preset awal"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset Preset</span>
              </button>

              <button
                type="button"
                onClick={() => setShowThumbnailModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MODAL 1: MEMBUAT SOAL KUIS */}
      {showMembuatSoalFloatingModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-emerald-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-300 text-slate-950 p-0.5 shadow-md flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-emerald-950 rounded-[14px] flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                    <span>Membuat Soal Kuis & Media AI</span>
                    <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30">
                      KBC
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-200/90">
                    Hasilkan kuis otomatis, flashcard interaktif, serta media pembelajaran digital
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMembuatSoalFloatingModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Active Module Detail Box */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-800 text-white px-2.5 py-0.5 rounded-md">
                    Modul Ajar Aktif
                  </span>
                  <span className="text-xs font-bold text-emerald-900 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {selectedMapelOg || mapelName}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                  {judulModul}
                </h2>
                <p className="text-xs text-slate-600">
                  Hasilkan Kuis Cinta, Flashcard, serta Ilustrasi Visual Interaktif otomatis dengan AI untuk peserta didik.
                </p>
              </div>

              {/* Quiz Generation Actions */}
              {!isStudentMode && selectedModule && onUpdateModule && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Opsi Pembuatan Soal AI</span>
                  </h4>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Target Jumlah Soal Picker */}
                    <button
                      type="button"
                      onClick={() => setShowSoalGridModal(true)}
                      className="bg-slate-50 hover:bg-emerald-50 border-2 border-emerald-500/40 hover:border-emerald-600 text-slate-900 text-xs font-extrabold rounded-xl px-3.5 py-2.5 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                      title="Klik untuk memilih Target Jumlah Soal Kuis dari Grid Modern"
                    >
                      <div className="flex items-center space-x-2">
                        <ListOrdered className="w-4 h-4 text-emerald-700" />
                        <span>Target: {targetJumlahSoal} Soal</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </button>

                    {/* Generate Button */}
                    <button
                      type="button"
                      onClick={() => {
                        handleGenerateQuizMediaAI();
                      }}
                      disabled={isGenerating}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs px-4 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer active:scale-98"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                          <span>Membuat Kuis AI ({targetJumlahSoal} Soal)...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>Otomatis Hasilkan Kuis AI ({targetJumlahSoal} Soal)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Share Button */}
              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-sky-950 flex items-center space-x-1.5">
                    <Share2 className="w-4 h-4 text-sky-600" />
                    <span>Bagikan Kuis ke Siswa</span>
                  </h4>
                  <p className="text-[11px] text-sky-800">
                    Siswa dapat langsung mengerjakan kuis tanpa login dari HP/Laptop.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMembuatSoalFloatingModal(false);
                    setShowShareOgModal(true);
                  }}
                  className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 shrink-0"
                >
                  <Share2 className="w-4 h-4 text-sky-200" />
                  <span>Bagikan Link Kuis</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowMembuatSoalFloatingModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MODAL 2: MEMILIH MATA PELAJARAN */}
      {showPilihMapelFloatingModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-emerald-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-400 text-slate-950 p-0.5 shadow-md flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-emerald-300" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                    <span>Memilih Mata Pelajaran</span>
                    <span className="bg-emerald-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      12+ Mapel
                    </span>
                  </h3>
                  <p className="text-xs text-teal-200/90">
                    Pilih mata pelajaran untuk mengakses kuis & modul ajar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPilihMapelFloatingModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Info Active Mapel */}
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200/80 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700">Mata Pelajaran Aktif:</span>
                <span className="text-xs font-black text-emerald-950 bg-amber-400 px-3 py-1 rounded-xl shadow-2xs border border-amber-500">
                  {selectedMapelOg || mapelName}
                </span>
              </div>

              {/* Subject Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {allSubjectCards.map((mapel) => {
                  const isSelected = (selectedMapelOg || mapelName).toLowerCase().trim() === mapel.toLowerCase().trim();
                  const info = getMapelInfo(mapel);
                  const MapelIcon = info.icon;
                  const thumbUrl = getThumbnailForMapel(mapel);

                  const count = (allModules || []).filter(m =>
                    m.identitas?.mataPelajaran?.toLowerCase().trim() === mapel.toLowerCase().trim() ||
                    m.identitas?.mataPelajaran?.toLowerCase().includes(mapel.toLowerCase()) ||
                    mapel.toLowerCase().includes(m.identitas?.mataPelajaran?.toLowerCase() || '')
                  ).length;

                  return (
                    <button
                      key={mapel}
                      type="button"
                      onClick={() => {
                        handleMapelChangeInMenu(mapel);
                        setShowPilihMapelFloatingModal(false);
                      }}
                      className={`group relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-b from-slate-900 to-emerald-950 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                          : 'bg-white hover:bg-emerald-50/80 text-slate-800 border-slate-200/90 hover:border-emerald-300'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 mb-2 relative group/thumb">
                        <img
                          src={thumbUrl}
                          alt={mapel}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e, getPresetImageForMapel(mapel))}
                        />
                        <div className={`absolute top-1 right-1 p-1 rounded-md text-[10px] font-black shadow-2xs ${
                          isSelected ? 'bg-amber-400 text-slate-950' : info.iconBg
                        }`}>
                          <MapelIcon className="w-3 h-3" />
                        </div>
                      </div>

                      <div>
                        <p className={`text-xs font-black line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {mapel}
                        </p>
                        <p className={`text-[10px] font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-500'}`}>
                          {count} Modul Ajar
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Secondary action: Full Grid Modul */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-500 font-medium">Ingin melihat rincian modul lengkap?</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowPilihMapelFloatingModal(false);
                    setShowMapelGridModal(true);
                  }}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <LayoutGrid className="w-4 h-4 text-amber-300" />
                  <span>Buka Full Grid Modul</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowPilihMapelFloatingModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Login Modal */}
      <StudentLoginModal
        isOpen={showStudentLoginModal}
        onClose={() => setShowStudentLoginModal(false)}
        onLoginSuccess={(student) => {
          setStudentSession(student);
          setNamaSiswa(student.nama);
          setShowStudentLoginModal(false);
        }}
      />

      {/* Global Quiz Results Recap Modal */}
      <QuizResultsRecapModal
        isOpen={showGlobalRecapModal}
        onClose={() => {
          setShowGlobalRecapModal(false);
          setStudentQuizArchives(loadStoredStudentQuizResults());
        }}
        userSession={loadUserSession()}
        allModules={allModules}
      />
      {/* Hidden File Input for Logo Banner Upload */}
      <input
        type="file"
        ref={bannerLogoInputRef}
        onChange={handleBannerLogoUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
