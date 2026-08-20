import React, { useState, useMemo } from 'react';
import { TeacherItem, TTDSettings, KategoriJabatanGuru } from '../types';
import { UserSession } from '../utils/auth';
import { loadMasterMapelList, getActiveMadrasah } from '../utils/storage';
import { downloadPtkExcelTemplate, exportTeachersToExcel, inferKategoriJabatan } from '../utils/excelPtkUtils';
import { TeacherExcelImportModal } from './TeacherExcelImportModal';
import { TeacherDetailModal } from './TeacherDetailModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  Copy, 
  Award, 
  Phone, 
  Mail, 
  X, 
  Star,
  CheckCircle2,
  Building2,
  Save,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Printer,
  FileSpreadsheet,
  Download,
  Upload,
  Shield,
  ShieldCheck,
  BookOpen,
  Sparkles,
  RefreshCw,
  Lock,
  GraduationCap,
  Layers,
  HelpCircle,
  QrCode,
  Filter,
  Table as TableIcon,
  LayoutGrid,
  Info,
  Clock,
  Briefcase,
  ExternalLink
} from 'lucide-react';

interface TeacherListManagerProps {
  teachers: TeacherItem[];
  ttd: TTDSettings;
  onSaveTeachers: (teachers: TeacherItem[]) => void;
  onUpdateTTD: (newTtd: TTDSettings) => void;
  userSession?: UserSession | null;
}

type TabMode = 'list' | 'single' | 'excel' | 'generate' | 'print' | 'permissions';
type ViewMode = 'table' | 'cards';

const KELAS_OPTIONS = [
  'Kelas 1 (Fase A)',
  'Kelas 2 (Fase A)',
  'Kelas 3 (Fase B)',
  'Kelas 4 (Fase B)',
  'Kelas 5 (Fase C)',
  'Kelas 6 (Fase C)'
];

const STATUS_KEPEGAWAIAN_OPTIONS = [
  'PNS',
  'PPPK',
  'GTY',
  'GTT',
  'Honorer',
  'Tendik',
  'Non-PNS'
];

const HAK_AKSES_OPTIONS = [
  { value: 'guru', label: 'Guru Mata Pelajaran / Guru Kelas' },
  { value: 'kepala_madrasah', label: 'Kepala Madrasah' },
  { value: 'admin', label: 'Administrator Madrasah' },
  { value: 'operator', label: 'Operator Madrasah (Simpatika / EMIS)' },
  { value: 'tendik', label: 'Tenaga Kependidikan / Tendik' }
];

export const TeacherListManager: React.FC<TeacherListManagerProps> = ({
  teachers,
  ttd,
  onSaveTeachers,
  onUpdateTTD,
  userSession
}) => {
  const isTeacherRole = userSession?.role === 'guru';

  // Compute teacher rombel context & filter (Strict Rombel Visibility for Teachers)
  const teacherRombelInfo = useMemo(() => {
    if (!userSession || !isTeacherRole) {
      return { isRestricted: false, matchedRombel: '', rombelTeachers: teachers, currentTeacher: null };
    }

    const cleanName = (userSession.namaLengkap || '').toLowerCase().trim();
    const cleanNip = (userSession.nip || '').trim();
    const cleanUser = (userSession.username || '').toLowerCase().trim();
    const teacherId = userSession.teacherId;

    // Find current teacher item
    const currentTeacher = teachers.find(t =>
      (teacherId && t.id === teacherId) ||
      (cleanNip && t.nip && t.nip !== '-' && t.nip.trim() === cleanNip) ||
      (cleanName && t.nama && (t.nama.toLowerCase().trim() === cleanName || t.nama.toLowerCase().includes(cleanName) || cleanName.includes(t.nama.toLowerCase().trim()))) ||
      (cleanUser && t.username && t.username.toLowerCase().trim() === cleanUser)
    ) || null;

    const meta = currentTeacher ? inferKategoriJabatan(currentTeacher) : null;
    const currentJabatan = (currentTeacher?.jabatanMapel || currentTeacher?.jabatanAtauKelas || userSession.jabatanAtauKelas || '').toLowerCase();
    const currentKelasTugas = (currentTeacher?.kelasTugas || meta?.kelasTugas || '').toLowerCase();
    const currentKelasAmpu = ((currentTeacher?.kelasAmpu && currentTeacher.kelasAmpu.length > 0) ? currentTeacher.kelasAmpu : (userSession.kelasAmpu || [])).map(k => k.toLowerCase());

    // Extract class numbers (1 to 6) that this teacher is associated with
    const classConfigs: { num: string; label: string; keys: string[] }[] = [
      { num: '1', label: 'Kelas 1 (Fase A)', keys: ['kelas 1', 'kelas i ', 'kelas i)', 'kelas i,', 'fase a (kelas 1', 'fase a (kelas i'] },
      { num: '2', label: 'Kelas 2 (Fase A)', keys: ['kelas 2', 'kelas ii ', 'kelas ii)', 'kelas ii,', 'fase a (kelas 2', 'fase a (kelas ii'] },
      { num: '3', label: 'Kelas 3 (Fase B)', keys: ['kelas 3', 'kelas iii', 'fase b (kelas 3', 'fase b (kelas iii'] },
      { num: '4', label: 'Kelas 4 (Fase B)', keys: ['kelas 4', 'kelas iv', 'fase b (kelas 4', 'fase b (kelas iv'] },
      { num: '5', label: 'Kelas 5 (Fase C)', keys: ['kelas 5', 'kelas v ', 'kelas v)', 'kelas v,', 'fase c (kelas 5', 'fase c (kelas v'] },
      { num: '6', label: 'Kelas 6 (Fase C)', keys: ['kelas 6', 'kelas vi', 'fase c (kelas 6', 'fase c (kelas vi'] },
    ];

    const matchedNums: string[] = [];
    const matchedLabels: string[] = [];

    classConfigs.forEach(cfg => {
      const inJabatan = cfg.keys.some(k => currentJabatan.includes(k));
      const inTugas = currentKelasTugas.includes(`kelas ${cfg.num}`) || cfg.keys.some(k => currentKelasTugas.includes(k));
      const inAmpu = currentKelasAmpu.some(ka => ka.includes(`kelas ${cfg.num}`) || cfg.keys.some(k => ka.includes(k)));

      if (inJabatan || inTugas || inAmpu) {
        matchedNums.push(cfg.num);
        matchedLabels.push(cfg.label);
      }
    });

    // If teacher is associated with specific rombel(s), get all teachers in the same rombel(s)
    let rombelTeachersList: TeacherItem[] = [];

    if (matchedNums.length > 0) {
      rombelTeachersList = teachers.filter(t => {
        // Always include self
        if (currentTeacher && t.id === currentTeacher.id) return true;
        if (cleanNip && t.nip && t.nip !== '-' && t.nip.trim() === cleanNip) return true;
        if (cleanName && t.nama && t.nama.toLowerCase().trim() === cleanName) return true;

        const tMeta = inferKategoriJabatan(t);
        const tJabatan = (t.jabatanMapel || t.jabatanAtauKelas || '').toLowerCase();
        const tKelasTugas = (t.kelasTugas || tMeta.kelasTugas || '').toLowerCase();
        const tKelasAmpu = (t.kelasAmpu || []).map(k => k.toLowerCase());

        return matchedNums.some(num => {
          const cfg = classConfigs.find(c => c.num === num);
          const keys = cfg ? cfg.keys : [`kelas ${num}`];
          const inTJabatan = keys.some(k => tJabatan.includes(k));
          const inTTugas = tKelasTugas.includes(`kelas ${num}`) || keys.some(k => tKelasTugas.includes(k));
          const inTAmpu = tKelasAmpu.some(ka => ka.includes(`kelas ${num}`) || keys.some(k => ka.includes(k)));
          return inTJabatan || inTTugas || inTAmpu;
        });
      });
    } else if (currentTeacher) {
      rombelTeachersList = [currentTeacher];
    } else {
      rombelTeachersList = teachers;
    }

    const rombelName = matchedLabels.length > 0 
      ? matchedLabels.join(' & ') 
      : (currentTeacher?.jabatanMapel || currentTeacher?.jabatanAtauKelas || userSession.jabatanAtauKelas || 'Rombel Penugasan Guru');

    return {
      isRestricted: true,
      currentTeacher,
      matchedRombel: rombelName,
      rombelTeachers: rombelTeachersList
    };
  }, [userSession, teachers, isTeacherRole]);

  const baseTeachers = teacherRombelInfo.isRestricted ? teacherRombelInfo.rombelTeachers : teachers;
  const [activeTab, setActiveTab] = useState<TabMode>('list');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategoriFilter, setSelectedKategoriFilter] = useState<'Semua' | 'guru_kelas' | 'guru_mapel' | 'kepala_madrasah' | 'tendik'>('Semua');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState<string>('Semua');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Semua');
  const [selectedHakAksesFilter, setSelectedHakAksesFilter] = useState<string>('Semua');
  const [selectedJkFilter, setSelectedJkFilter] = useState<string>('Semua');
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  
  // Single Add / Edit Form State (16 Columns)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNo, setFormNo] = useState<number>(1);
  const [formNama, setFormNama] = useState('');
  const [formGelar, setFormGelar] = useState('');
  const [formNik, setFormNik] = useState('');
  const [formPin, setFormPin] = useState('123456');
  const [formHakAkses, setFormHakAkses] = useState<string>('guru');
  const [formNip, setFormNip] = useState('');
  const [formNuptk, setFormNuptk] = useState('');
  const [formNpk, setFormNpk] = useState('');
  const [formPegId, setFormPegId] = useState('');
  
  // Jabatan Distinction: Guru Kelas vs Guru Mapel vs Kamad vs Tendik
  const [formKategoriJabatan, setFormKategoriJabatan] = useState<KategoriJabatanGuru>('guru_kelas');
  const [formKelasTugas, setFormKelasTugas] = useState<string>('Kelas 1 (Fase A)');
  const [formMapelUtama, setFormMapelUtama] = useState<string>('Akidah Akhlak');
  const [formJabatanMapel, setFormJabatanMapel] = useState('Guru Kelas 1 (Fase A)');
  const [formStatusKepegawaian, setFormStatusKepegawaian] = useState('PNS');
  const [formJenisKelamin, setFormJenisKelamin] = useState<'L' | 'P'>('L');
  const [formNoWhatsapp, setFormNoWhatsapp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBebanJtm, setFormBebanJtm] = useState('24 Jam');
  const [formUsername, setFormUsername] = useState('');
  const [formMapelAmpu, setFormMapelAmpu] = useState<string[]>([]);
  const [formKelasAmpu, setFormKelasAmpu] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');

  // Batch Generation State
  const [batchNames, setBatchNames] = useState('');
  const [batchPrefixNip, setBatchPrefixNip] = useState('198');
  const [batchDefaultPin, setBatchDefaultPin] = useState('123456');
  const [batchDefaultJabatan, setBatchDefaultJabatan] = useState('Guru Mapel');
  const [batchDefaultMapel, setBatchDefaultMapel] = useState<string[]>([]);

  // Print Mode State
  const [printColumns, setPrintColumns] = useState<2 | 3>(2);
  const [printFormat, setPrintFormat] = useState<'cards' | 'formal_table'>('cards');
  const [selectedPrintTeachers, setSelectedPrintTeachers] = useState<string[]>([]);

  // Modals & UI state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [selectedDetailTeacher, setSelectedDetailTeacher] = useState<TeacherItem | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  const activeMadrasah = getActiveMadrasah();
  const allMasterMapel = loadMasterMapelList();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const togglePinVisibility = (id: string) => {
    setVisiblePins(prev => ({ ...prev, [id]: !prev[id] }));
  };

const GURU_KELAS_DEFAULT_MAPEL = [
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Pendidikan Pancasila',
  'Seni Rupa',
  'Seni Budaya'
];

const GURU_MAPEL_POPULAR_LIST = [
  'Akidah Akhlak',
  'Fiqih',
  'Al-Qur\'an Hadis',
  'Sejarah Kebudayaan Islam (SKI)',
  'Bahasa Arab',
  'Pendidikan Jasmani Olahraga & Kesehatan (PJOK)',
  'Bahasa Inggris',
  'Bahasa Jawa',
  'Seni Budaya',
  'Ke-NU-an / Aswaja',
  'P5-PPRA'
];

  const handleCopyCredentials = (t: TeacherItem) => {
    const meta = inferKategoriJabatan(t);
    const categoryLabel = meta.kategoriJabatan === 'guru_kelas' 
      ? `Guru Kelas (${meta.kelasTugas || t.jabatanMapel})`
      : meta.kategoriJabatan === 'guru_mapel'
      ? `Guru Mapel (${meta.mapelUtama || t.jabatanMapel})`
      : meta.kategoriJabatan === 'kepala_madrasah'
      ? 'Kepala Madrasah'
      : 'Tenaga Kependidikan / TU';

    const text = `📋 *KREDENSIAL LOGIN GURU/PTK KBC-MI*\nMadrasah: ${activeMadrasah.nama}\nNama: ${t.nama}${t.gelar ? ' ' + t.gelar : ''}\nKategori Jabatan: ${categoryLabel}\nNIK: ${t.nik || '-'}\nNIP: ${t.nip || '-'}\nUsername: ${t.username || t.nip || t.nik}\nPIN Login 6 Digit: ${t.pin || '123456'}\nHak Akses: ${t.hakAkses || 'Guru'}\nJabatan/Mapel: ${t.jabatanMapel || t.jabatanAtauKelas}\nJTM: ${t.bebanJtm || '24 Jam'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(t.id);
    showToast(`✅ Akun Login "${t.nama}" disalin ke clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSelectKategori = (kat: KategoriJabatanGuru) => {
    setFormKategoriJabatan(kat);
    if (kat === 'guru_kelas') {
      const jbt = `Guru ${formKelasTugas}`;
      setFormJabatanMapel(jbt);
      setFormKelasAmpu([formKelasTugas]);
      setFormMapelAmpu(GURU_KELAS_DEFAULT_MAPEL);
      if (formHakAkses === 'kepala_madrasah' || formHakAkses === 'tendik') {
        setFormHakAkses('guru');
      }
    } else if (kat === 'guru_mapel') {
      const jbt = `Guru ${formMapelUtama}`;
      setFormJabatanMapel(jbt);
      setFormMapelAmpu([formMapelUtama]);
      if (formHakAkses === 'kepala_madrasah' || formHakAkses === 'tendik') {
        setFormHakAkses('guru');
      }
    } else if (kat === 'kepala_madrasah') {
      setFormJabatanMapel('Kepala Madrasah');
      setFormHakAkses('kepala_madrasah');
    } else if (kat === 'tendik') {
      setFormJabatanMapel('Tenaga Kependidikan / TU');
      setFormHakAkses('tendik');
    }
  };

  const handleSelectKelasTugas = (kelas: string) => {
    setFormKelasTugas(kelas);
    if (formKategoriJabatan === 'guru_kelas') {
      setFormJabatanMapel(`Guru ${kelas}`);
      setFormKelasAmpu([kelas]);
    }
  };

  const handleSelectMapelUtama = (mapel: string) => {
    setFormMapelUtama(mapel);
    if (formKategoriJabatan === 'guru_mapel') {
      setFormJabatanMapel(`Guru ${mapel}`);
      setFormMapelAmpu(prev => prev.includes(mapel) ? prev : [mapel, ...prev]);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormNo(teachers.length + 1);
    setFormNama('');
    setFormGelar('');
    setFormNik('');
    setFormPin(Math.floor(100000 + Math.random() * 900000).toString());
    setFormHakAkses('guru');
    setFormNip('');
    setFormNuptk('');
    setFormNpk('');
    setFormPegId('');
    setFormKategoriJabatan('guru_kelas');
    setFormKelasTugas('Kelas 1 (Fase A)');
    setFormMapelUtama('Akidah Akhlak');
    setFormJabatanMapel('Guru Kelas 1 (Fase A)');
    setFormStatusKepegawaian('PNS');
    setFormJenisKelamin('L');
    setFormNoWhatsapp('');
    setFormEmail('');
    setFormBebanJtm('24 Jam');
    setFormUsername('');
    setFormMapelAmpu(GURU_KELAS_DEFAULT_MAPEL);
    setFormKelasAmpu(['Kelas 1 (Fase A)']);
    setFormStatus('aktif');
    setActiveTab('single');
  };

  const handleOpenEdit = (t: TeacherItem) => {
    if (isTeacherRole) {
      showToast('⚠️ Akun Guru tidak diizinkan mengubah data PTK yang sudah ada. Anda hanya dapat menambah data PTK baru.');
      return;
    }
    const meta = inferKategoriJabatan(t);
    setEditingId(t.id);
    setFormNo(t.no || 1);
    setFormNama(t.nama);
    setFormGelar(t.gelar || '');
    setFormNik(t.nik || '');
    setFormPin(t.pin || '123456');
    setFormHakAkses(t.hakAkses || (meta.kategoriJabatan === 'kepala_madrasah' ? 'kepala_madrasah' : meta.kategoriJabatan === 'tendik' ? 'tendik' : 'guru'));
    setFormNip(t.nip && t.nip !== '-' ? t.nip : '');
    setFormNuptk(t.nuptk && t.nuptk !== '-' ? t.nuptk : '');
    setFormNpk(t.npk && t.npk !== '-' ? t.npk : '');
    setFormPegId(t.pegIdSimpatika && t.pegIdSimpatika !== '-' ? t.pegIdSimpatika : '');
    setFormKategoriJabatan(meta.kategoriJabatan);
    setFormKelasTugas(meta.kelasTugas || 'Kelas 1 (Fase A)');
    setFormMapelUtama(meta.mapelUtama || 'Akidah Akhlak');
    setFormJabatanMapel(t.jabatanMapel || t.jabatanAtauKelas || (meta.kategoriJabatan === 'guru_kelas' ? `Guru ${meta.kelasTugas || 'Kelas 1 (Fase A)'}` : meta.kategoriJabatan === 'guru_mapel' ? `Guru ${meta.mapelUtama || 'Akidah Akhlak'}` : 'Guru Mapel'));
    setFormStatusKepegawaian(t.statusKepegawaian || 'PNS');
    setFormJenisKelamin((t.jenisKelamin === 'P' || t.jenisKelamin === 'Perempuan') ? 'P' : 'L');
    setFormNoWhatsapp(t.noWhatsapp || t.kontak || '');
    setFormEmail(t.email || '');
    setFormBebanJtm(t.bebanJtm ? String(t.bebanJtm) : '24 Jam');
    setFormUsername(t.username || t.nip?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || '');
    setFormMapelAmpu(t.mapelAmpu && t.mapelAmpu.length > 0 ? t.mapelAmpu : (meta.kategoriJabatan === 'guru_kelas' ? GURU_KELAS_DEFAULT_MAPEL : [meta.mapelUtama || 'Akidah Akhlak']));
    setFormKelasAmpu(t.kelasAmpu && t.kelasAmpu.length > 0 ? t.kelasAmpu : (meta.kelasTugas ? [meta.kelasTugas] : ['Kelas 1 (Fase A)']));
    setFormStatus(t.status || 'aktif');
    setActiveTab('single');
  };

  const handleToggleMapel = (mapel: string) => {
    setFormMapelAmpu(prev => 
      prev.includes(mapel) ? prev.filter(m => m !== mapel) : [...prev, mapel]
    );
  };

  const handleToggleKelas = (kelas: string) => {
    setFormKelasAmpu(prev => 
      prev.includes(kelas) ? prev.filter(k => k !== kelas) : [...prev, kelas]
    );
  };

  const handleGenerateRandomPin = () => {
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    setFormPin(random);
  };

  const handleSaveSingleTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && isTeacherRole) {
      showToast('⚠️ Akun Guru tidak diizinkan mengubah data PTK yang sudah ada. Anda hanya diperbolehkan menambah PTK baru.');
      return;
    }
    if (!formNama.trim()) {
      showToast('⚠️ Nama lengkap PTK wajib diisi!');
      return;
    }

    setIsSaving(true);

    const cleanUsername = (formUsername.trim() || formNik.trim() || formNip.trim().replace(/[^a-zA-Z0-9]/g, '') || formNama.trim().replace(/[^a-zA-Z0-9]/g, '')).toLowerCase().slice(0, 20);

    const teacherData: TeacherItem = {
      id: editingId || `teacher-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      no: formNo || (editingId ? undefined : teachers.length + 1),
      nama: formNama.trim(),
      gelar: formGelar.trim() || undefined,
      nik: formNik.trim() || undefined,
      pin: formPin.trim() || '123456',
      hakAkses: formHakAkses,
      nip: formNip.trim() || '-',
      nuptk: formNuptk.trim() || '-',
      npk: formNpk.trim() || '-',
      pegIdSimpatika: formPegId.trim() || '-',
      kategoriJabatan: formKategoriJabatan,
      kelasTugas: formKategoriJabatan === 'guru_kelas' ? formKelasTugas : undefined,
      mapelUtama: formKategoriJabatan === 'guru_mapel' ? formMapelUtama : undefined,
      jabatanGuru: formKategoriJabatan === 'guru_kelas' ? 'Guru Kelas' : formKategoriJabatan === 'guru_mapel' ? 'Guru Mapel' : formKategoriJabatan === 'kepala_madrasah' ? 'Kepala Madrasah' : 'Tenaga Kependidikan',
      jabatanMapel: formJabatanMapel.trim() || (formKategoriJabatan === 'guru_kelas' ? `Guru ${formKelasTugas}` : formKategoriJabatan === 'guru_mapel' ? `Guru ${formMapelUtama}` : 'Guru Mapel'),
      jabatanAtauKelas: formJabatanMapel.trim() || (formKategoriJabatan === 'guru_kelas' ? `Guru ${formKelasTugas}` : formKategoriJabatan === 'guru_mapel' ? `Guru ${formMapelUtama}` : 'Guru Mapel'),
      statusKepegawaian: formStatusKepegawaian,
      jenisKelamin: formJenisKelamin,
      noWhatsapp: formNoWhatsapp.trim() || undefined,
      kontak: formNoWhatsapp.trim() || undefined,
      email: formEmail.trim() || undefined,
      bebanJtm: formBebanJtm.trim() || '24 Jam',
      username: cleanUsername,
      mapelAmpu: formMapelAmpu.length > 0 ? formMapelAmpu : (formKategoriJabatan === 'guru_kelas' ? GURU_KELAS_DEFAULT_MAPEL : ['Akidah Akhlak']),
      kelasAmpu: formKelasAmpu.length > 0 ? formKelasAmpu : [formKelasTugas || 'Kelas 1 (Fase A)'],
      status: formStatus,
      createdAt: editingId ? undefined : new Date().toISOString()
    };

    let updated: TeacherItem[];
    if (editingId) {
      updated = teachers.map(t => t.id === editingId ? { ...t, ...teacherData } : t);
      if (ttd.guruKelasNama === formNama || ttd.guruKelasNIP === formNip) {
        onUpdateTTD({
          ...ttd,
          guruKelasNama: teacherData.nama + (teacherData.gelar ? ', ' + teacherData.gelar : ''),
          guruKelasNIP: teacherData.nip || '',
          jabatanGuru: teacherData.jabatanMapel || teacherData.jabatanAtauKelas
        });
      }
    } else {
      updated = [...teachers, teacherData];
    }

    onSaveTeachers(updated);
    setIsSaving(false);
    showToast(`🎉 Data PTK "${teacherData.nama}" (${formKategoriJabatan === 'guru_kelas' ? 'Guru Kelas' : formKategoriJabatan === 'guru_mapel' ? 'Guru Mapel' : 'PTK'}) berhasil disimpan!`);
    setActiveTab('list');
  };

  const handleBatchGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTeacherRole) {
      showToast('⚠️ Akses Dibatasi: Hanya Administrator yang dapat menggunakan fitur batch generate.');
      return;
    }
    const lines = batchNames.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      showToast('⚠️ Masukkan minimal satu nama guru!');
      return;
    }

    setIsSaving(true);
    const newItems: TeacherItem[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(',').map(p => p.trim());
      const nama = parts[0];
      const gelar = parts[1] || '';
      const nip = parts[2] || `${batchPrefixNip}${String(Date.now()).slice(-6)}${String(idx + 1).padStart(2, '0')}`;
      const jabatan = parts[3] || batchDefaultJabatan;
      const username = nama.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || `guru${Date.now()}`;
      const pin = batchDefaultPin || Math.floor(100000 + Math.random() * 900000).toString();

      newItems.push({
        id: `teacher-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        no: teachers.length + idx + 1,
        nama,
        gelar: gelar || undefined,
        nik: `330214${String(Date.now()).slice(-6)}${String(idx + 1).padStart(4, '0')}`,
        nip,
        username,
        pin,
        hakAkses: 'guru',
        nuptk: '-',
        npk: '-',
        pegIdSimpatika: '-',
        jabatanMapel: jabatan,
        jabatanAtauKelas: jabatan,
        statusKepegawaian: 'PNS',
        jenisKelamin: 'L',
        bebanJtm: '24 Jam',
        mapelAmpu: batchDefaultMapel.length > 0 ? batchDefaultMapel : ['Pendidikan Agama Islam'],
        kelasAmpu: ['Kelas 1 (Fase A)', 'Kelas 2 (Fase A)', 'Kelas 3 (Fase B)'],
        status: 'aktif',
        createdAt: new Date().toISOString()
      });
    });

    const updated = [...teachers, ...newItems];
    onSaveTeachers(updated);
    setIsSaving(false);
    setBatchNames('');
    showToast(`🎉 Berhasil membuat ${newItems.length} akun PTK baru secara massal!`);
    setActiveTab('list');
  };

  const handleDeleteTeacher = () => {
    if (isTeacherRole) {
      showToast('⚠️ Akun Guru tidak diizinkan menghapus data PTK.');
      setTeacherToDelete(null);
      return;
    }
    if (!teacherToDelete) return;
    const updated = teachers.filter(t => t.id !== teacherToDelete.id);
    onSaveTeachers(updated);
    showToast(`🗑️ Akun Guru "${teacherToDelete.nama}" berhasil dihapus.`);
    setTeacherToDelete(null);
  };

  const handleSetAsTTD = (t: TeacherItem) => {
    const fullName = t.nama + (t.gelar ? ', ' + t.gelar : '');
    onUpdateTTD({
      ...ttd,
      guruKelasNama: fullName,
      guruKelasNIP: t.nip && t.nip !== '-' ? t.nip : '',
      jabatanGuru: t.jabatanMapel || t.jabatanAtauKelas || 'Guru Mapel / Penyusun'
    });
    showToast(`✍️ "${fullName}" dijadikan penandatangan default Modul Ajar!`);
  };

  // Excel Handlers
  const handleImportMerge = (newTeachers: TeacherItem[]) => {
    if (isTeacherRole) {
      showToast('⚠️ Akun Guru tidak diizinkan mengimpor data PTK dari Excel.');
      return;
    }
    const updated = [...teachers, ...newTeachers];
    onSaveTeachers(updated);
    setIsExcelModalOpen(false);
    showToast(`📥 Berhasil menambahkan ${newTeachers.length} data Guru/PTK dari Excel!`);
    setActiveTab('list');
  };

  const handleImportReplace = (newTeachers: TeacherItem[]) => {
    if (isTeacherRole) {
      showToast('⚠️ Akun Guru tidak diizinkan menimpa data PTK dari Excel.');
      return;
    }
    onSaveTeachers(newTeachers);
    setIsExcelModalOpen(false);
    showToast(`🔄 Berhasil menimpa data dengan ${newTeachers.length} data Guru/PTK baru dari Excel!`);
    setActiveTab('list');
  };

  const handlePrint = () => {
    window.print();
  };

  // Category Counts (Scoped to baseTeachers for Teachers)
  const countGuruKelas = baseTeachers.filter(t => inferKategoriJabatan(t).kategoriJabatan === 'guru_kelas').length;
  const countGuruMapel = baseTeachers.filter(t => inferKategoriJabatan(t).kategoriJabatan === 'guru_mapel').length;
  const countKamad = baseTeachers.filter(t => inferKategoriJabatan(t).kategoriJabatan === 'kepala_madrasah').length;
  const countTendik = baseTeachers.filter(t => inferKategoriJabatan(t).kategoriJabatan === 'tendik').length;

  // Filtered teachers list (Scoped to baseTeachers)
  const filteredTeachers = baseTeachers.filter(t => {
    const meta = inferKategoriJabatan(t);
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      t.nama.toLowerCase().includes(q) ||
      (t.gelar && t.gelar.toLowerCase().includes(q)) ||
      (t.nik && t.nik.toLowerCase().includes(q)) ||
      (t.nip && t.nip.toLowerCase().includes(q)) ||
      (t.nuptk && t.nuptk.toLowerCase().includes(q)) ||
      (t.npk && t.npk.toLowerCase().includes(q)) ||
      (t.pegIdSimpatika && t.pegIdSimpatika.toLowerCase().includes(q)) ||
      (t.username && t.username.toLowerCase().includes(q)) ||
      (t.jabatanMapel && t.jabatanMapel.toLowerCase().includes(q)) ||
      (t.jabatanAtauKelas && t.jabatanAtauKelas.toLowerCase().includes(q)) ||
      (meta.kelasTugas && meta.kelasTugas.toLowerCase().includes(q)) ||
      (meta.mapelUtama && meta.mapelUtama.toLowerCase().includes(q)) ||
      (t.mapelAmpu && t.mapelAmpu.some(m => m.toLowerCase().includes(q)));

    const matchKategori = selectedKategoriFilter === 'Semua' || meta.kategoriJabatan === selectedKategoriFilter;

    const matchMapel = selectedMapelFilter === 'Semua' || 
      (t.mapelAmpu && t.mapelAmpu.includes(selectedMapelFilter)) ||
      (t.jabatanMapel && t.jabatanMapel.toLowerCase().includes(selectedMapelFilter.toLowerCase())) ||
      (meta.mapelUtama && meta.mapelUtama.toLowerCase().includes(selectedMapelFilter.toLowerCase()));

    const matchStatus = selectedStatusFilter === 'Semua' || t.statusKepegawaian === selectedStatusFilter;
    const matchHakAkses = selectedHakAksesFilter === 'Semua' || t.hakAkses === selectedHakAksesFilter;
    const matchJk = selectedJkFilter === 'Semua' || 
      (selectedJkFilter === 'L' && (t.jenisKelamin === 'L' || t.jenisKelamin === 'Laki-laki')) ||
      (selectedJkFilter === 'P' && (t.jenisKelamin === 'P' || t.jenisKelamin === 'Perempuan'));

    return matchSearch && matchKategori && matchMapel && matchStatus && matchHakAkses && matchJk;
  });

  const printList = selectedPrintTeachers.length > 0
    ? baseTeachers.filter(t => selectedPrintTeachers.includes(t.id))
    : (filteredTeachers.length > 0 ? filteredTeachers : baseTeachers);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-extrabold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Format Standar 16 Kolom PTK & Akun Login Madrasah</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Manajemen Data Guru & PTK Madrasah
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
              Pemisahan terstruktur: Guru Kelas (Fase A-C), Guru Mapel Utama, Kepala Madrasah & Tendik dengan format 16 kolom resmi Kemenag.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isTeacherRole && (
              <>
                <button
                  type="button"
                  onClick={() => setIsExcelModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah Data Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadPtkExcelTemplate(activeMadrasah.nama)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Unduh format template Excel 16 Kolom"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>Template Excel</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => exportTeachersToExcel(baseTeachers, activeMadrasah.nama)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Ekspor data PTK ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-300" />
              <span>Ekspor Data ({baseTeachers.length})</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-white text-emerald-950 font-black text-xs rounded-xl shadow-md hover:bg-emerald-50 transition-all flex items-center space-x-1 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>+ Tambah PTK</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="text-[11px] text-emerald-200/80 font-bold flex items-center space-x-1">
              <Users className="w-3 h-3 text-emerald-300" />
              <span>{isTeacherRole ? `PTK ${teacherRombelInfo.matchedRombel}` : 'Total PTK Terdaftar'}</span>
            </div>
            <div className="text-xl font-black mt-0.5">{baseTeachers.length} Orang</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="text-[11px] text-indigo-200 font-bold flex items-center space-x-1">
              <GraduationCap className="w-3 h-3 text-indigo-300" />
              <span>Guru Kelas (1-6)</span>
            </div>
            <div className="text-xl font-black mt-0.5 text-indigo-300">
              {countGuruKelas} Guru
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="text-[11px] text-teal-200 font-bold flex items-center space-x-1">
              <BookOpen className="w-3 h-3 text-teal-300" />
              <span>Guru Mata Pelajaran</span>
            </div>
            <div className="text-xl font-black mt-0.5 text-teal-300">
              {countGuruMapel} Guru
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <div className="text-[11px] text-amber-200 font-bold flex items-center space-x-1">
              <Award className="w-3 h-3 text-amber-300" />
              <span>Kamad & Tendik</span>
            </div>
            <div className="text-xl font-black mt-0.5 text-amber-300">
              {countKamad + countTendik} Orang
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Subtabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'list'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Guru & PTK ({baseTeachers.length})</span>
        </button>

        {!isTeacherRole && (
          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 cursor-pointer bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Unggah Data Excel</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleOpenAdd}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'single'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>{editingId && !isTeacherRole ? 'Edit Data PTK' : 'Tambah 1 PTK Baru'}</span>
        </button>

        {!isTeacherRole && (
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Buat Cepat (Batch NIP/PIN)</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('print')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'print'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Kartu & Leger PTK</span>
        </button>

        {!isTeacherRole && (
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-500" />
            <span>Hak Akses Guru vs Admin</span>
          </button>
        )}
      </div>

      {/* TAB 1: LIST AKUN GURU & PTK */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          
          {/* Teacher Rombel Context Alert */}
          {isTeacherRole && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 shadow-xs">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-200 text-emerald-900 rounded-xl shrink-0 mt-0.5">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Akun Guru (Akses Terbatas)
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      Rombel: <strong>{teacherRombelInfo.matchedRombel}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                    Sesuai kebijakan madrasah, Anda hanya dapat melihat data guru dan PTK pada rombel <strong>{teacherRombelInfo.matchedRombel}</strong>. Opsi ubah dan hapus dinonaktifkan untuk akun guru (hanya diperbolehkan menambah PTK baru).
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Multi-Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIK, NIP, NUPTK, Peg ID..."
                  className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                    viewMode === 'table' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Tampilan Tabel Lengkap 16 Kolom"
                >
                  <TableIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Tabel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                    viewMode === 'cards' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Tampilan Kartu Grid"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Kartu</span>
                </button>
              </div>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedKategoriFilter('Semua')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                  selectedKategoriFilter === 'Semua'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>🌟 Semua PTK</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedKategoriFilter === 'Semua' ? 'bg-white/20' : 'bg-slate-200 text-slate-800'}`}>{teachers.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedKategoriFilter('guru_kelas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                  selectedKategoriFilter === 'guru_kelas'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Guru Kelas (1-6)</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedKategoriFilter === 'guru_kelas' ? 'bg-white/20' : 'bg-indigo-200 text-indigo-900'}`}>{countGuruKelas}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedKategoriFilter('guru_mapel')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                  selectedKategoriFilter === 'guru_mapel'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Guru Mata Pelajaran</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedKategoriFilter === 'guru_mapel' ? 'bg-white/20' : 'bg-teal-200 text-teal-900'}`}>{countGuruMapel}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedKategoriFilter('kepala_madrasah')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                  selectedKategoriFilter === 'kepala_madrasah'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Kepala Madrasah</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedKategoriFilter === 'kepala_madrasah' ? 'bg-white/20' : 'bg-purple-200 text-purple-900'}`}>{countKamad}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedKategoriFilter('tendik')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                  selectedKategoriFilter === 'tendik'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Tendik / TU</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedKategoriFilter === 'tendik' ? 'bg-white/20' : 'bg-slate-300 text-slate-900'}`}>{countTendik}</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-500 flex items-center space-x-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter Lainnya:</span>
              </span>

              {/* Status Kepegawaian */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="Semua">Semua Status Kepegawaian</option>
                {STATUS_KEPEGAWAIAN_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Hak Akses */}
              <select
                value={selectedHakAksesFilter}
                onChange={(e) => setSelectedHakAksesFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="Semua">Semua Hak Akses</option>
                {HAK_AKSES_OPTIONS.map(h => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>

              {/* Jenis Kelamin */}
              <select
                value={selectedJkFilter}
                onChange={(e) => setSelectedJkFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="Semua">Semua JK (L / P)</option>
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>

              {/* Filter Mapel */}
              <select
                value={selectedMapelFilter}
                onChange={(e) => setSelectedMapelFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="Semua">Semua Mata Pelajaran</option>
                {allMasterMapel.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {(searchQuery || selectedKategoriFilter !== 'Semua' || selectedStatusFilter !== 'Semua' || selectedHakAksesFilter !== 'Semua' || selectedJkFilter !== 'Semua' || selectedMapelFilter !== 'Semua') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedKategoriFilter('Semua');
                    setSelectedStatusFilter('Semua');
                    setSelectedHakAksesFilter('Semua');
                    setSelectedJkFilter('Semua');
                    setSelectedMapelFilter('Semua');
                  }}
                  className="px-2 py-1 text-rose-600 hover:bg-rose-50 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Results Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Menampilkan <strong>{filteredTeachers.length}</strong> dari <strong>{teachers.length}</strong> Guru & PTK terdaftar</span>
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-800">Tidak ada data PTK yang sesuai kriteria</h3>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau unggah file Excel data PTK.</p>
              <div className="flex items-center justify-center space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsExcelModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah File Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  + Tambah Manual
                </button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            /* TABEL VIEW LENGKAP */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3 min-w-[200px]">Nama Lengkap & Gelar</th>
                      <th className="p-3 min-w-[130px]">NIK</th>
                      <th className="p-3 min-w-[105px]">PIN 6 Digit</th>
                      <th className="p-3 min-w-[110px]">Hak Akses</th>
                      <th className="p-3 min-w-[160px]">NIP / NUPTK / Peg ID</th>
                      <th className="p-3 min-w-[160px]">Jabatan & Status</th>
                      <th className="p-3 min-w-[70px] text-center">JK</th>
                      <th className="p-3 min-w-[90px] text-center">Beban JTM</th>
                      <th className="p-3 min-w-[130px]">No. WhatsApp</th>
                      <th className="p-3 min-w-[120px] text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredTeachers.map((t, idx) => {
                      const meta = inferKategoriJabatan(t);
                      const isDefaultTTD = ttd.guruKelasNama?.includes(t.nama);
                      const isPinVisible = visiblePins[t.id];
                      const cleanPhone = (t.noWhatsapp || t.kontak || '').replace(/[^0-9]/g, '');

                      return (
                        <tr key={t.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-500">{t.no || (idx + 1)}</td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                meta.kategoriJabatan === 'guru_kelas'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : meta.kategoriJabatan === 'guru_mapel'
                                  ? 'bg-teal-100 text-teal-800'
                                  : meta.kategoriJabatan === 'kepala_madrasah'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {t.nama.charAt(0)}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 flex items-center space-x-1">
                                  <span>{t.nama}</span>
                                  {t.gelar && <span className="text-emerald-700 font-bold">{t.gelar}</span>}
                                  {isDefaultTTD && (
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" title="TTD Default Modul Ajar" />
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">User: {t.username || t.nip || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">{t.nik || '-'}</td>
                          <td className="p-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-black text-emerald-700 tracking-wider">
                                {isPinVisible ? (t.pin || '123456') : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePinVisibility(t.id)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                title={isPinVisible ? 'Sembunyikan PIN' : 'Lihat PIN'}
                              >
                                {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              t.hakAkses === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : t.hakAkses === 'kepala_madrasah'
                                ? 'bg-amber-100 text-amber-800'
                                : t.hakAkses === 'operator'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {t.hakAkses || 'Guru'}
                            </span>
                          </td>
                          <td className="p-3 text-[11px]">
                            <div>NIP: <span className="font-mono font-bold text-slate-800">{t.nip || '-'}</span></div>
                            {t.nuptk && t.nuptk !== '-' && <div className="text-slate-500 text-[10px]">NUPTK: {t.nuptk}</div>}
                            {t.pegIdSimpatika && t.pegIdSimpatika !== '-' && <div className="text-teal-700 text-[10px]">PegID: {t.pegIdSimpatika}</div>}
                          </td>
                          <td className="p-3">
                            {meta.kategoriJabatan === 'guru_kelas' ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-md text-[10px] font-black inline-flex items-center space-x-1">
                                  <GraduationCap className="w-3 h-3 text-indigo-600 shrink-0" />
                                  <span>Guru Kelas {meta.kelasTugas?.replace('Kelas ', '') || t.jabatanMapel}</span>
                                </span>
                                <div className="text-[10px] text-slate-500 font-medium">{t.statusKepegawaian || 'PNS'}</div>
                              </div>
                            ) : meta.kategoriJabatan === 'guru_mapel' ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-teal-50 text-teal-900 border border-teal-200 rounded-md text-[10px] font-black inline-flex items-center space-x-1">
                                  <BookOpen className="w-3 h-3 text-teal-600 shrink-0" />
                                  <span>Guru {meta.mapelUtama || t.jabatanMapel}</span>
                                </span>
                                <div className="text-[10px] text-slate-500 font-medium">{t.statusKepegawaian || 'PNS'}</div>
                              </div>
                            ) : meta.kategoriJabatan === 'kepala_madrasah' ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-900 border border-purple-200 rounded-md text-[10px] font-black inline-flex items-center space-x-1">
                                  <Award className="w-3 h-3 text-purple-600 shrink-0" />
                                  <span>Kepala Madrasah</span>
                                </span>
                                <div className="text-[10px] text-slate-500 font-medium">{t.statusKepegawaian || 'PNS'}</div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-[10px] font-black inline-flex items-center space-x-1">
                                  <Briefcase className="w-3 h-3 text-slate-600 shrink-0" />
                                  <span>Tendik / TU</span>
                                </span>
                                <div className="text-[10px] text-slate-500 font-medium">{t.statusKepegawaian || 'PNS'}</div>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              t.jenisKelamin === 'P' || t.jenisKelamin === 'Perempuan' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {t.jenisKelamin === 'P' || t.jenisKelamin === 'Perempuan' ? 'P' : 'L'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-800">
                            {t.bebanJtm || '24 Jam'}
                          </td>
                          <td className="p-3 text-[11px]">
                            {cleanPhone ? (
                              <a
                                href={`https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 font-bold hover:underline flex items-center space-x-1"
                              >
                                <span>{t.noWhatsapp || t.kontak}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => setSelectedDetailTeacher(t)}
                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Lihat Profil 16 Data Lengkap"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(t)}
                                className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                title="Salin Kredensial Login"
                              >
                                {copiedId === t.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              </button>
                              {!isTeacherRole && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(t)}
                                    className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Data PTK"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTeacherToDelete(t)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus Data PTK"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* KARTU GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTeachers.map(t => {
                const meta = inferKategoriJabatan(t);
                const isDefaultTTD = ttd.guruKelasNama?.includes(t.nama);
                const isPinVisible = visiblePins[t.id];

                return (
                  <div
                    key={t.id}
                    className={`bg-white rounded-2xl border p-5 transition-all shadow-xs relative flex flex-col justify-between ${
                      isDefaultTTD ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center font-black text-base shadow-sm shrink-0 ${
                            meta.kategoriJabatan === 'guru_kelas'
                              ? 'bg-gradient-to-br from-indigo-600 to-blue-700'
                              : meta.kategoriJabatan === 'guru_mapel'
                              ? 'bg-gradient-to-br from-teal-600 to-emerald-700'
                              : meta.kategoriJabatan === 'kepala_madrasah'
                              ? 'bg-gradient-to-br from-purple-600 to-indigo-800'
                              : 'bg-gradient-to-br from-slate-600 to-slate-800'
                          }`}>
                            {t.nama.charAt(0)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="text-sm font-black text-slate-900">
                                {t.nama} {t.gelar && <span className="text-emerald-700 font-bold">{t.gelar}</span>}
                              </h4>
                              {isDefaultTTD && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md flex items-center space-x-1">
                                  <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                                  <span>TTD Modul</span>
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5">
                              {meta.kategoriJabatan === 'guru_kelas' ? (
                                <span className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-700">
                                  <GraduationCap className="w-3.5 h-3.5" />
                                  <span>Guru Kelas {meta.kelasTugas?.replace('Kelas ', '') || t.jabatanMapel}</span>
                                </span>
                              ) : meta.kategoriJabatan === 'guru_mapel' ? (
                                <span className="inline-flex items-center space-x-1 text-xs font-bold text-teal-700">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>Guru {meta.mapelUtama || t.jabatanMapel}</span>
                                </span>
                              ) : meta.kategoriJabatan === 'kepala_madrasah' ? (
                                <span className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700">
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Kepala Madrasah</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600">
                                  <Briefcase className="w-3.5 h-3.5" />
                                  <span>Tendik / Tenaga Kependidikan</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailTeacher(t)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                            title="Detail Profil PTK"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(t)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                            title="Salin Kredensial Login"
                          >
                            {copiedId === t.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                          {!isTeacherRole && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(t)}
                                className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all cursor-pointer"
                                title="Edit Data PTK"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTeacherToDelete(t)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                title="Hapus Akun PTK"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Login & Registration Box */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/90 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIK / NIP</span>
                          <span className="font-mono font-bold text-slate-800 block truncate" title={t.nik || t.nip}>
                            {t.nik || t.nip || '-'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIN 6 Digit</span>
                            <button
                              type="button"
                              onClick={() => togglePinVisibility(t.id)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                          <span className="font-mono font-black text-emerald-700 tracking-wider">
                            {isPinVisible ? (t.pin || '123456') : '••••••'}
                          </span>
                        </div>
                      </div>

                      {/* Badges Status & JTM */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold">
                          Status: {t.statusKepegawaian || 'PNS'}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-black">
                          JTM: {t.bebanJtm || '24 Jam'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          t.jenisKelamin === 'P' || t.jenisKelamin === 'Perempuan' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          JK: {t.jenisKelamin === 'P' || t.jenisKelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 font-medium truncate">
                        {t.noWhatsapp ? `WA: ${t.noWhatsapp}` : t.email ? `Email: ${t.email}` : `NIP: ${t.nip || '-'}`}
                      </div>

                      {!isDefaultTTD && (
                        <button
                          type="button"
                          onClick={() => handleSetAsTTD(t)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer shrink-0"
                        >
                          Jadikan TTD Default
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SINGLE ADD / EDIT PTK (16 FIELDS) */}
      {activeTab === 'single' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                {editingId ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingId ? 'Edit Data PTK & Akun Guru' : 'Tambah 1 Data PTK Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Lengkapi 16 atribut data pendidik/tenaga kependidikan sesuai format standar Kemenag.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveSingleTeacher} className="space-y-6">
            
            {/* Bagian 1: Identitas Pribadi */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>1. Identitas Pribadi PTK</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* No Urut */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Urut
                  </label>
                  <input
                    type="number"
                    value={formNo}
                    onChange={(e) => setFormNo(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Nama Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap (Tanpa Gelar) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Jaenal Maskun"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Gelar */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gelar Akademik / Keagamaan
                  </label>
                  <input
                    type="text"
                    value={formGelar}
                    onChange={(e) => setFormGelar(e.target.value)}
                    placeholder="Contoh: S.Pd.I. / M.Pd."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* NIK */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK (16 Digit)
                  </label>
                  <input
                    type="text"
                    value={formNik}
                    onChange={(e) => setFormNik(e.target.value)}
                    placeholder="Contoh: 3302141508820001"
                    maxLength={16}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formJenisKelamin}
                    onChange={(e) => setFormJenisKelamin(e.target.value as 'L' | 'P')}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bagian 2: Kredensial & Hak Akses */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>2. Akun & Kredensial Login</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Hak Akses */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hak Akses Modul / Aplikasi
                  </label>
                  <select
                    value={formHakAkses}
                    onChange={(e) => setFormHakAkses(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    {HAK_AKSES_OPTIONS.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>

                {/* PIN 6 Digit */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      PIN Login (6 Digit) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPin}
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Acak PIN</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    placeholder="Contoh: 123456"
                    maxLength={10}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-emerald-700 tracking-widest focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Username / ID Login Khusus */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Bisa login pakai NIK, NIP, atau username"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Nomor Registrasi Pendidik */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>3. Nomor Registrasi Resmi PTK</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* NIP Pegawai */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP Pegawai
                  </label>
                  <input
                    type="text"
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    placeholder="Contoh: 197808152009011009"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* NUPTK */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NUPTK
                  </label>
                  <input
                    type="text"
                    value={formNuptk}
                    onChange={(e) => setFormNuptk(e.target.value)}
                    placeholder="Contoh: 8452756658200022"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* NPK Kemenag */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NPK Kemenag
                  </label>
                  <input
                    type="text"
                    value={formNpk}
                    onChange={(e) => setFormNpk(e.target.value)}
                    placeholder="Contoh: 11823302005401"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Peg ID Simpatika */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peg ID Simpatika / SIAGA
                  </label>
                  <input
                    type="text"
                    value={formPegId}
                    onChange={(e) => setFormPegId(e.target.value)}
                    placeholder="Contoh: 201889921"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 4: Penugasan, Kepegawaian, dan Beban JTM */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>4. Penugasan, Klasifikasi Jabatan & Beban Mengajar</span>
              </h4>

              {/* Pemisahan Jabatan Guru Kelas vs Guru Mapel */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-2">
                    Klasifikasi Penugasan PTK <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectKategori('guru_kelas')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        formKategoriJabatan === 'guru_kelas'
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <GraduationCap className={`w-5 h-5 ${formKategoriJabatan === 'guru_kelas' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {formKategoriJabatan === 'guru_kelas' && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-black">Guru Kelas</div>
                        <div className="text-[10px] text-slate-500 leading-tight">Wali Kelas 1-6 (Fase A-C)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectKategori('guru_mapel')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        formKategoriJabatan === 'guru_mapel'
                          ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 text-teal-950'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <BookOpen className={`w-5 h-5 ${formKategoriJabatan === 'guru_mapel' ? 'text-teal-600' : 'text-slate-400'}`} />
                        {formKategoriJabatan === 'guru_mapel' && <Check className="w-4 h-4 text-teal-600" />}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-black">Guru Mapel</div>
                        <div className="text-[10px] text-slate-500 leading-tight">Pengampu Bidang Studi</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectKategori('kepala_madrasah')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        formKategoriJabatan === 'kepala_madrasah'
                          ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-950'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Award className={`w-5 h-5 ${formKategoriJabatan === 'kepala_madrasah' ? 'text-purple-600' : 'text-slate-400'}`} />
                        {formKategoriJabatan === 'kepala_madrasah' && <Check className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-black">Kepala Madrasah</div>
                        <div className="text-[10px] text-slate-500 leading-tight">Pimpinan Lembaga</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectKategori('tendik')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        formKategoriJabatan === 'tendik'
                          ? 'bg-slate-800 border-slate-900 ring-2 ring-slate-700/20 text-white'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Briefcase className={`w-5 h-5 ${formKategoriJabatan === 'tendik' ? 'text-slate-200' : 'text-slate-400'}`} />
                        {formKategoriJabatan === 'tendik' && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-black">Tendik / TU</div>
                        <div className={`text-[10px] leading-tight ${formKategoriJabatan === 'tendik' ? 'text-slate-300' : 'text-slate-500'}`}>Tata Usaha / Staf</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sub-form Spesifik sesuai Kategori Jabatan */}
                {formKategoriJabatan === 'guru_kelas' && (
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                    <label className="block text-xs font-black text-indigo-950">
                      Penugasan Kelas (Tingkat & Fase Kurikulum Merdeka) <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {KELAS_OPTIONS.map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => handleSelectKelasTugas(k)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                            formKelasTugas === k
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                              : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          <div>{k.split(' ')[0]} {k.split(' ')[1]}</div>
                          <div className="text-[10px] opacity-80">{k.includes('(') ? k.substring(k.indexOf('(')) : ''}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formKategoriJabatan === 'guru_mapel' && (
                  <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                    <label className="block text-xs font-black text-teal-950">
                      Mata Pelajaran Utama yang Diampu <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formMapelUtama}
                      onChange={(e) => handleSelectMapelUtama(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-teal-300 rounded-xl text-xs font-bold text-teal-950 focus:border-teal-600 outline-none cursor-pointer"
                    >
                      <option value="">-- Pilih Mata Pelajaran Utama --</option>
                      {allMasterMapel.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Sebutan / Jabatan Resmi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Penugasan Resmi (Teks Lengkap)
                  </label>
                  <input
                    type="text"
                    value={formJabatanMapel}
                    onChange={(e) => setFormJabatanMapel(e.target.value)}
                    placeholder="Contoh: Guru Kelas 1 / Guru Akidah Akhlak"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Status Kepegawaian */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={formStatusKepegawaian}
                    onChange={(e) => setFormStatusKepegawaian(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    {STATUS_KEPEGAWAIAN_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Beban JTM */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Beban JTM (Jam Tatap Muka)
                  </label>
                  <input
                    type="text"
                    value={formBebanJtm}
                    onChange={(e) => setFormBebanJtm(e.target.value)}
                    placeholder="Contoh: 24 Jam"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Kontak WA & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formNoWhatsapp}
                    onChange={(e) => setFormNoWhatsapp(e.target.value)}
                    placeholder="Contoh: 081398765432"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Contoh: guru@kemenag.go.id"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Mapel yang Diampu Multi-select */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-slate-900">
                  Mata Pelajaran yang Diampu Guru
                </label>
                <div className="flex items-center space-x-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setFormMapelAmpu(allMasterMapel)}
                    className="text-emerald-700 hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setFormMapelAmpu([])}
                    className="text-rose-600 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
                {allMasterMapel.map(m => {
                  const isChecked = formMapelAmpu.includes(m);
                  return (
                    <label
                      key={m}
                      className={`flex items-center space-x-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMapel(m)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="truncate">{m}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Data PTK</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: BATCH GENERATION */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-100 text-amber-900 rounded-2xl">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Buat Akun PTK Cepat (Massal / Batch)
                </h3>
                <p className="text-xs text-slate-500">
                  Tulis satu baris per nama guru. Sistem otomatis membuat NIK acak, NIP prefix, dan PIN 6 Digit.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleBatchGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Daftar Nama Guru (1 baris per guru)
              </label>
              <textarea
                rows={6}
                value={batchNames}
                onChange={(e) => setBatchNames(e.target.value)}
                placeholder="Contoh:&#10;Ahmad Dahlan, S.Pd.I.&#10;Hasyim Asy'ari, M.Pd.&#10;Wahid Hasyim, S.Ag."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prefix NIP</label>
                <input
                  type="text"
                  value={batchPrefixNip}
                  onChange={(e) => setBatchPrefixNip(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PIN 6 Digit Default</label>
                <input
                  type="text"
                  value={batchDefaultPin}
                  onChange={(e) => setBatchDefaultPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan Default</label>
                <input
                  type="text"
                  value={batchDefaultJabatan}
                  onChange={(e) => setBatchDefaultJabatan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Generate Akun PTK
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: PRINT KARTU & LEGER PTK */}
      {activeTab === 'print' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Cetak Dokumen Guru & PTK</h4>
                <p className="text-xs text-slate-500">Pilih format cetak kartu login atau format buku induk PTK resmi madrasah.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={printFormat}
                onChange={(e) => setPrintFormat(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="cards">Format Kartu Akun Login</option>
                <option value="formal_table">Format Buku Induk PTK</option>
              </select>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / PDF</span>
              </button>
            </div>
          </div>

          {/* Printable Container */}
          <div id="printable-teacher-section" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none">
            {printFormat === 'cards' ? (
              <div className={`grid ${printColumns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'} gap-4 print:grid-cols-2 print:gap-3`}>
                {printList.map((t, idx) => (
                  <div key={t.id} className="border-2 border-slate-800 rounded-2xl p-4 bg-white relative overflow-hidden break-inside-avoid">
                    <div className="flex items-center space-x-2 border-b pb-2 mb-2 border-slate-200">
                      <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-black text-xs">
                        MI
                      </div>
                      <div className="leading-tight">
                        <div className="text-[10px] font-black uppercase text-slate-900">{activeMadrasah.nama}</div>
                        <div className="text-[9px] text-slate-500 font-bold">KARTU LOGIN RESMI GURU & PTK</div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div><strong className="text-slate-500 text-[10px]">Nama:</strong> <span className="font-bold">{t.nama} {t.gelar}</span></div>
                      <div><strong className="text-slate-500 text-[10px]">NIK:</strong> <span className="font-mono">{t.nik || '-'}</span></div>
                      <div><strong className="text-slate-500 text-[10px]">NIP:</strong> <span className="font-mono">{t.nip || '-'}</span></div>
                      <div>
                        <strong className="text-slate-500 text-[10px]">Jabatan:</strong>{' '}
                        <span className="font-bold">
                          {(() => {
                            const meta = inferKategoriJabatan(t);
                            if (meta.kategoriJabatan === 'guru_kelas') return `Guru Kelas ${meta.kelasTugas?.replace('Kelas ', '') || ''}`;
                            if (meta.kategoriJabatan === 'guru_mapel') return `Guru ${meta.mapelUtama || t.jabatanMapel}`;
                            if (meta.kategoriJabatan === 'kepala_madrasah') return 'Kepala Madrasah';
                            return t.jabatanMapel || t.jabatanAtauKelas || 'Tendik';
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-800 block">PIN LOGIN 6 DIGIT:</span>
                        <span className="font-mono font-black text-emerald-950 text-sm tracking-widest">{t.pin || '123456'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-emerald-800 block">HAK AKSES:</span>
                        <span className="text-[10px] font-extrabold uppercase text-emerald-900">{t.hakAkses || 'Guru'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Tabel Formal Buku Induk PTK */
              <div className="space-y-4">
                <div className="text-center pb-4 border-b-2 border-slate-900">
                  <h2 className="text-base font-black uppercase tracking-wider">{activeMadrasah.nama}</h2>
                  <h3 className="text-sm font-bold text-slate-700">DAFTAR BUKU INDUK PENDIDIK DAN TENAGA KEPENDIDIKAN (PTK)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{activeMadrasah.alamatLengkap || activeMadrasah.alamat}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border border-slate-300 text-center w-8">No</th>
                        <th className="p-2 border border-slate-300">Nama Lengkap & Gelar</th>
                        <th className="p-2 border border-slate-300">NIK</th>
                        <th className="p-2 border border-slate-300">NIP</th>
                        <th className="p-2 border border-slate-300">NUPTK</th>
                        <th className="p-2 border border-slate-300">NPK</th>
                        <th className="p-2 border border-slate-300">Peg ID</th>
                        <th className="p-2 border border-slate-300">Jabatan Mapel</th>
                        <th className="p-2 border border-slate-300 text-center">Status</th>
                        <th className="p-2 border border-slate-300 text-center">JK</th>
                        <th className="p-2 border border-slate-300 text-center">JTM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printList.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-300 text-center font-bold">{t.no || (idx + 1)}</td>
                          <td className="p-2 border border-slate-300 font-bold">{t.nama} {t.gelar}</td>
                          <td className="p-2 border border-slate-300 font-mono">{t.nik || '-'}</td>
                          <td className="p-2 border border-slate-300 font-mono">{t.nip || '-'}</td>
                          <td className="p-2 border border-slate-300 font-mono">{t.nuptk || '-'}</td>
                          <td className="p-2 border border-slate-300 font-mono">{t.npk || '-'}</td>
                          <td className="p-2 border border-slate-300 font-mono">{t.pegIdSimpatika || '-'}</td>
                          <td className="p-2 border border-slate-300">{t.jabatanMapel || t.jabatanAtauKelas}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold">{t.statusKepegawaian || 'PNS'}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold">{t.jenisKelamin === 'P' || t.jenisKelamin === 'Perempuan' ? 'P' : 'L'}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold">{t.bebanJtm || '24 Jam'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tanda Tangan */}
                <div className="pt-6 flex justify-end">
                  <div className="text-center text-xs space-y-1">
                    <div>{activeMadrasah.kecamatan || 'Banyumas'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div className="font-bold">Kepala Madrasah,</div>
                    <div className="h-16"></div>
                    <div className="font-black underline">{activeMadrasah.kepalaMadrasah || 'JAENAL MASKUN, S.Pd.I.'}</div>
                    <div className="text-[10px] text-slate-600">NIP. {activeMadrasah.nipKepalaMadrasah || '-'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PERMISSIONS INFO */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-2xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Struktur Hak Akses & Keamanan Akun</h3>
              <p className="text-xs text-slate-500">Panduan hak akses Guru Mapel, Operator, Tendik, dan Administrator Madrasah.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="font-black text-emerald-900 text-sm">Hak Akses Guru (PTK)</div>
              <ul className="list-disc pl-4 space-y-1 text-emerald-800">
                <li>Login menggunakan NIK / NIP / Username dan PIN 6 Digit.</li>
                <li>Hanya dapat menyusun dan mengedit Modul Ajar sesuai Mapel yang diampu.</li>
                <li>Dapat membuat soal kuis interaktif & melihat rekap hasil kuis siswanya.</li>
                <li>Mencetak RPP / Modul Ajar ber-Kop resmi madrasah.</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
              <div className="font-black text-amber-900 text-sm">Kepala Madrasah</div>
              <ul className="list-disc pl-4 space-y-1 text-amber-800">
                <li>Meninjau seluruh modul ajar yang disusun para guru.</li>
                <li>Menjadi penandatangan resmi (TTD) modul & surat madrasah.</li>
                <li>Melihat rekap nilai kuis siswa seluruh kelas dan mapel.</li>
                <li>Akses laporan supervisi pembelajaran.</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
              <div className="font-black text-purple-900 text-sm">Admin & Operator</div>
              <ul className="list-disc pl-4 space-y-1 text-purple-800">
                <li>Akses penuh ke semua modul ajar, bank materi, dan kuis.</li>
                <li>Kelola data guru (Impor Excel, Ekspor Excel, Tambah PTK).</li>
                <li>Kelola identitas madrasah, Kop Surat, dan sinkronisasi Cloud.</li>
                <li>Atur reset PIN guru yang lupa kata sandi.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Excel Import Modal */}
      <TeacherExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportMerge={handleImportMerge}
        onImportReplace={handleImportReplace}
        madrasahName={activeMadrasah.nama}
        existingTeachersCount={teachers.length}
      />

      {/* 2. Teacher Detail 16 Columns Modal */}
      <TeacherDetailModal
        teacher={selectedDetailTeacher}
        onClose={() => setSelectedDetailTeacher(null)}
        onEdit={handleOpenEdit}
        onSetAsTTD={handleSetAsTTD}
        isDefaultTTD={selectedDetailTeacher ? (ttd.guruKelasNama?.includes(selectedDetailTeacher.nama) || false) : false}
      />

      {/* 3. Delete Confirmation Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Hapus Data PTK?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus akun guru <strong>"{teacherToDelete.nama}"</strong>? Guru ini tidak akan bisa login ke aplikasi lagi.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteTeacher}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
