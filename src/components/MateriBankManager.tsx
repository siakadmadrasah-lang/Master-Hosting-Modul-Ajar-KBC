import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MateriBankItem, MAPEL_MI_OPTIONS, PANCA_CINTA_OPTIONS, DEFAULT_TAHUN_AJARAN_OPTIONS } from '../types';
import { UserSession } from '../utils/auth';
import { loadCustomMapel, saveCustomMapel, addMasterMapel, deleteMasterMapel, loadCustomTahunAjaran, saveCustomTahunAjaran, loadActiveTahunAjaran, loadMasterMapelList, loadDeletedMapel, loadDeletedMapelSet, isMapelDeleted } from '../utils/storage';
import { safeFetchJson } from '../utils/apiHelper';
import { 
  BookMarked, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Check, 
  X, 
  Layers, 
  Wand2, 
  PenTool, 
  RotateCcw,
  BookOpen,
  Loader2,
  AlertCircle,
  PlusCircle,
  Heart,
  Library,
  Compass,
  Languages,
  Calculator,
  FileText,
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  Save
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

interface MateriBankManagerProps {
  materiList: MateriBankItem[];
  apiKey?: string;
  customMapelList?: string[];
  onAddCustomMapel?: (mapel: string) => void;
  onDeleteCustomMapel?: (mapel: string) => void;
  onSaveMateriList: (list: MateriBankItem[]) => void;
  onSelectMateriForModule?: (materi: MateriBankItem, mode: 'AI' | 'MANUAL') => void;
  onCloseModal?: () => void;
  isPickerMode?: boolean;
  onPickMateri?: (materi: MateriBankItem) => void;
  userSession?: UserSession | null;
}

export const MateriBankManager: React.FC<MateriBankManagerProps> = ({
  materiList,
  apiKey,
  customMapelList: propCustomMapel,
  onAddCustomMapel,
  onDeleteCustomMapel,
  onSaveMateriList,
  onSelectMateriForModule,
  onCloseModal,
  isPickerMode = false,
  onPickMateri,
  userSession
}) => {
  const isTeacherRole = userSession?.role === 'guru';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState('Semua');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('Semua');
  const [selectedTahunFilter, setSelectedTahunFilter] = useState('Semua');
  const [selectedFaseFilter, setSelectedFaseFilter] = useState('Semua');
  const [groupingMode, setGroupingMode] = useState<'grouped' | 'grid'>('grouped');
  const [activeMapelModal, setActiveMapelModal] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Delete Modals & Multi-Select State
  const [itemToDelete, setItemToDelete] = useState<MateriBankItem | null>(null);
  const [mapelToDelete, setMapelToDelete] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Custom Mapel state
  const [localCustomMapel, setLocalCustomMapel] = useState<string[]>([]);
  const [showAddMapelModal, setShowAddMapelModal] = useState(false);
  const [newMapelInput, setNewMapelInput] = useState('');

  // Custom Tahun Ajaran State
  const [localCustomTahunAjaran, setLocalCustomTahunAjaran] = useState<string[]>([]);

  useEffect(() => {
    if (propCustomMapel) {
      setLocalCustomMapel(propCustomMapel);
    } else {
      setLocalCustomMapel(loadCustomMapel());
    }
    setLocalCustomTahunAjaran(loadCustomTahunAjaran());
  }, [propCustomMapel]);

  const allMapelOptions = useMemo(() => {
    const masterList = loadMasterMapelList();
    const deletedSet = loadDeletedMapelSet();
    const setMapel = new Set<string>(masterList);

    (localCustomMapel || []).forEach(m => { if (m) setMapel.add(m); });
    (materiList || []).forEach(m => {
      if (m.mataPelajaran) setMapel.add(m.mataPelajaran);
    });

    return Array.from(setMapel).filter(m => Boolean(m) && !isMapelDeleted(m, deletedSet));
  }, [localCustomMapel, materiList]);
  const allTahunAjaranOptions = Array.from(new Set([loadActiveTahunAjaran(), ...localCustomTahunAjaran, ...DEFAULT_TAHUN_AJARAN_OPTIONS]));

  const handleAddNewCustomMapel = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMapelInput.trim();
    if (!trimmed) return;

    if (allMapelOptions.some(m => m.trim().toLowerCase() === trimmed.toLowerCase())) {
      alert('Mata pelajaran ini sudah ada dalam daftar.');
      return;
    }

    addMasterMapel(trimmed);
    setLocalCustomMapel(loadCustomMapel());
    if (onAddCustomMapel) {
      onAddCustomMapel(trimmed);
    }
    setFormMapel(trimmed);
    setNewMapelInput('');
    setShowAddMapelModal(false);
  };

  // Form State for Add / Edit
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSaveStatus, setFormSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Compact View & Expansion State
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpandCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [formMapel, setFormMapel] = useState('Akidah Akhlak');
  const [formFase, setFormFase] = useState('Fase B (Kelas III MI)');
  const [formSemester, setFormSemester] = useState<'Ganjil (1)' | 'Genap (2)'>('Ganjil (1)');
  const [formTahunAjaran, setFormTahunAjaran] = useState(() => loadActiveTahunAjaran());
  const [formJudul, setFormJudul] = useState('');
  const [formUraian, setFormUraian] = useState('');
  const [formPancaCinta, setFormPancaCinta] = useState<string[]>([]);
  const [formCapaian, setFormCapaian] = useState('');

  const [isGeneratingUraian, setIsGeneratingUraian] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const filteredItems = materiList.filter(item => {
    const matchesMapel = selectedMapelFilter === 'Semua' || item.mataPelajaran === selectedMapelFilter;
    const matchesSemester = selectedSemesterFilter === 'Semua' || item.semester === selectedSemesterFilter;
    const matchesTahun = selectedTahunFilter === 'Semua' || item.tahunAjaran === selectedTahunFilter;
    const matchesFase = selectedFaseFilter === 'Semua' || (item.faseKelas && item.faseKelas.includes(selectedFaseFilter));
    const q = searchQuery.toLowerCase();
    const matchesSearch = item.judulMateri.toLowerCase().includes(q) || 
                          item.uraianMateri.toLowerCase().includes(q) ||
                          item.mataPelajaran.toLowerCase().includes(q) ||
                          item.faseKelas.toLowerCase().includes(q) ||
                          (item.semester && item.semester.toLowerCase().includes(q)) ||
                          (item.tahunAjaran && item.tahunAjaran.toLowerCase().includes(q));
    return matchesMapel && matchesSemester && matchesTahun && matchesFase && matchesSearch;
  });

  const groupedMapelMap = useMemo(() => {
    const groups: Record<string, MateriBankItem[]> = {};
    filteredItems.forEach(item => {
      const mapel = item.mataPelajaran || 'Mata Pelajaran Lainnya';
      if (!groups[mapel]) groups[mapel] = [];
      groups[mapel].push(item);
    });
    return groups;
  }, [filteredItems]);

  const listSectionRef = useRef<HTMLDivElement>(null);

  const handleMapelClick = (m: string) => {
    if (m === 'Semua') {
      setSelectedMapelFilter('Semua');
      setActiveMapelModal(null);
    } else {
      setActiveMapelModal(m);
      setModalSearchQuery('');
    }
  };

  const handleOpenAddModal = (presetMapel?: string) => {
    setEditingId(null);
    const initialMapel = (presetMapel && presetMapel !== 'Semua')
      ? presetMapel
      : (selectedMapelFilter !== 'Semua' ? selectedMapelFilter : 'Akidah Akhlak');
    setFormMapel(initialMapel);
    setFormFase('Fase B (Kelas III MI)');
    setFormSemester('Ganjil (1)');
    setFormTahunAjaran(loadActiveTahunAjaran());
    setFormJudul('');
    setFormUraian('1. \n2. \n3. ');
    setFormPancaCinta([]);
    setFormCapaian('');
    setGenError(null);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (item: MateriBankItem) => {
    if (isTeacherRole) {
      alert('Akses Dibatasi: Akun login Guru tidak diizinkan mengedit data materi yang sudah ada. Anda hanya diperbolehkan menambah materi baru.');
      return;
    }
    setEditingId(item.id);
    setFormMapel(item.mataPelajaran);
    setFormFase(item.faseKelas);
    setFormSemester(item.semester || 'Ganjil (1)');
    setFormTahunAjaran(item.tahunAjaran || '2025/2026');
    setFormJudul(item.judulMateri);
    setFormUraian(item.uraianMateri);
    setFormPancaCinta(item.topikPancaCintaDefault || []);
    setFormCapaian(item.capaianPembelajaranDefault || '');
    setGenError(null);
    setShowFormModal(true);
  };

  const handleGenerateUraianAI = async () => {
    if (!formJudul.trim()) {
      alert('Silakan isi Judul / Pokok Bahasan Materi terlebih dahulu sebelum memicu pembuatan AI.');
      return;
    }

    setIsGeneratingUraian(true);
    setGenError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['x-gemini-api-key'] = apiKey;
      }

      const data = await safeFetchJson('/api/generate-materi-uraian', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mataPelajaran: formMapel,
          faseKelas: formFase,
          judulMateri: formJudul,
          topikPancaCinta: formPancaCinta,
          userApiKey: apiKey
        })
      });

      if (!data || !data.success) {
        throw new Error(data?.error || 'Gagal menghasilkan uraian materi dengan AI.');
      }

      if (data.uraianMateri) {
        setFormUraian(data.uraianMateri.replace(/\*\*/g, '').replace(/__/g, ''));
      }
      if (data.capaianPembelajaranDefault && (!formCapaian || formCapaian.trim().length === 0)) {
        setFormCapaian(data.capaianPembelajaranDefault);
      }
    } catch (err: any) {
      console.error('Error generating AI uraian:', err);
      setGenError(err.message || 'Terjadi kesalahan saat membuat Uraian AI.');
    } finally {
      setIsGeneratingUraian(false);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim()) return;

    setFormSaveStatus('saving');
    setTimeout(() => {
      if (editingId) {
        const updated = materiList.map(item => item.id === editingId ? {
          ...item,
          mataPelajaran: formMapel,
          faseKelas: formFase,
          semester: formSemester,
          tahunAjaran: formTahunAjaran,
          judulMateri: formJudul,
          uraianMateri: formUraian,
          topikPancaCintaDefault: formPancaCinta,
          capaianPembelajaranDefault: formCapaian
        } : item);
        onSaveMateriList(updated);
      } else {
        const newItem: MateriBankItem = {
          id: 'mb-custom-' + Date.now(),
          mataPelajaran: formMapel,
          faseKelas: formFase,
          semester: formSemester,
          tahunAjaran: formTahunAjaran,
          judulMateri: formJudul,
          uraianMateri: formUraian,
          topikPancaCintaDefault: formPancaCinta,
          capaianPembelajaranDefault: formCapaian,
          isDefault: false
        };
        onSaveMateriList([newItem, ...materiList]);
      }
      setFormSaveStatus('saved');
      setTimeout(() => {
        setFormSaveStatus('idle');
        setShowFormModal(false);
      }, 900);
    }, 300);
  };

  const handleDelete = (item: MateriBankItem) => {
    if (isTeacherRole) {
      alert('Akses Dibatasi: Akun login Guru tidak diizinkan menghapus data materi yang sudah ada.');
      return;
    }
    setItemToDelete(item);
  };

  const handleConfirmDeleteItem = () => {
    if (isTeacherRole || !itemToDelete) return;
    const updated = materiList.filter(item => item.id !== itemToDelete.id);
    onSaveMateriList(updated);
    setSelectedItemIds(prev => prev.filter(id => id !== itemToDelete.id));
    setItemToDelete(null);
  };

  const handleConfirmDeleteMapel = () => {
    if (isTeacherRole || !mapelToDelete) return;
    deleteMasterMapel(mapelToDelete);
    setLocalCustomMapel(loadCustomMapel());
    if (onDeleteCustomMapel) {
      onDeleteCustomMapel(mapelToDelete);
    }
    if (selectedMapelFilter === mapelToDelete) {
      setSelectedMapelFilter('Semua');
    }
    setMapelToDelete(null);
  };

  const handleConfirmBulkDelete = () => {
    if (isTeacherRole || selectedItemIds.length === 0) return;
    const updated = materiList.filter(item => !selectedItemIds.includes(item.id));
    onSaveMateriList(updated);
    setSelectedItemIds([]);
    setShowBulkDeleteModal(false);
  };

  const toggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredItems.map(i => i.id);
    const allSelected = visibleIds.every(id => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const togglePancaCintaInForm = (opt: string) => {
    if (formPancaCinta.includes(opt)) {
      setFormPancaCinta(formPancaCinta.filter(x => x !== opt));
    } else {
      setFormPancaCinta([...formPancaCinta, opt]);
    }
  };

  const renderItemCard = (item: MateriBankItem, idx?: number) => {
    const isExpanded = expandedCards[item.id] || viewMode === 'detailed';
    return (
      <div
        key={idx !== undefined ? `${item.id}-${idx}` : item.id}
        className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 transition-all shadow-xs hover:shadow-md group"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[9px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                {item.mataPelajaran}
              </span>
              <span className="text-[9px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200">
                Sem: {item.semester || 'Ganjil (1)'}
              </span>
              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                TA: {item.tahunAjaran || '2025/2026'}
              </span>
              <span className="text-[9px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 font-bold">
                {item.faseKelas.replace('Fase B (', '').replace(')', '')}
              </span>
            </div>

            {!isPickerMode && !isTeacherRole && (
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => handleOpenEditModal(item)}
                  className="p-1 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded-md transition-colors"
                  title="Edit Materi"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-md transition-colors"
                  title="Hapus Materi Ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <h3 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
            {item.judulMateri}
          </h3>

          {/* Uraian Materi Section */}
          <div className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 leading-snug">
            <div className={isExpanded ? 'whitespace-pre-line' : 'line-clamp-2'}>
              {item.uraianMateri}
            </div>
            {item.uraianMateri.length > 80 && (
              <button
                type="button"
                onClick={() => toggleExpandCard(item.id)}
                className="mt-1 text-[9px] text-emerald-700 font-extrabold hover:underline block"
              >
                {isExpanded ? '▲ Ringkaskan' : '▼ Selengkapnya...'}
              </button>
            )}
          </div>

          {item.topikPancaCintaDefault && item.topikPancaCintaDefault.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.topikPancaCintaDefault.map((pc, idx) => (
                <span key={idx} className="text-[8px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded-md border border-rose-200 font-bold">
                  ♥ {pc}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-1.5">
          {isPickerMode && onPickMateri && (
            <button
              onClick={() => onPickMateri(item)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 rounded-xl text-xs flex items-center justify-center space-x-1 transition-all shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Pilih Materi Ini</span>
            </button>
          )}

          {!isPickerMode && onSelectMateriForModule && (
            <div className="flex items-center space-x-1.5 w-full">
              <button
                onClick={() => onSelectMateriForModule(item, 'AI')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 rounded-xl text-[10px] flex items-center justify-center space-x-1 shadow-xs transition-all"
              >
                <Wand2 className="w-3 h-3" />
                <span>Buat via AI</span>
              </button>
              <button
                onClick={() => onSelectMateriForModule(item, 'MANUAL')}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold py-1.5 rounded-xl text-[10px] flex items-center justify-center space-x-1 transition-all"
              >
                <PenTool className="w-3 h-3 text-emerald-700" />
                <span>Input Manual</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${isPickerMode ? 'p-1' : 'p-4 sm:p-6 max-w-6xl mx-auto'}`}>
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
              <BookMarked className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center space-x-2">
                <span>Modul Kelola Materi (Bank Materi KBC)</span>
                <span className="text-[10px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded-full border border-white/30">
                  {materiList.length} Materi Terdaftar
                </span>
              </h2>
              <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                {isPickerMode 
                  ? 'Pilih salah satu materi di bawah ini untuk mengisi otomatis field Modul Ajar KBC.' 
                  : 'Kelola repository materi pelajaran MI Ma\'arif NU 2 Sanggreman secara terstruktur, runtut & komprehensif.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isPickerMode && (
              <button
                onClick={handleOpenAddModal}
                className="bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md border border-emerald-200"
              >
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>Tambah Materi Baru</span>
              </button>
            )}

            {isPickerMode && onCloseModal && (
              <button
                onClick={onCloseModal}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl border border-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari judul materi, uraian, mapel, semester, atau tahun ajaran..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Layout Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setGroupingMode('grouped')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center space-x-1 ${
                  groupingMode === 'grouped'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Kelompokkan materi berdasarkan Mata Pelajaran, Semester & Tahun Ajaran"
              >
                <span>Kelompok Rapi</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupingMode('grid')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  groupingMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Grid Semua"
              >
                <span>Grid Semua</span>
              </button>
            </div>

            {/* View Mode (Compact vs Detailed) */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  viewMode === 'compact'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ringkas
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  viewMode === 'detailed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Detail
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Level Filters: Semester, Tahun Ajaran, Fase */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">
              📅 Semester
            </label>
            <select
              value={selectedSemesterFilter}
              onChange={e => setSelectedSemesterFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-extrabold focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua" className="bg-slate-900 text-slate-100">Semua Semester</option>
              <option value="Ganjil (1)" className="bg-slate-900 text-slate-100">Semester Ganjil (1)</option>
              <option value="Genap (2)" className="bg-slate-900 text-slate-100">Semester Genap (2)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider">
              🎓 Tahun Ajaran
            </label>
            <select
              value={selectedTahunFilter}
              onChange={e => setSelectedTahunFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-extrabold focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Tahun Ajaran</option>
              {allTahunAjaranOptions.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider">
              🏫 Fase / Kelas
            </label>
            <select
              value={selectedFaseFilter}
              onChange={e => setSelectedFaseFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-extrabold focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Fase Target</option>
              <option value="Fase A">Fase A (Kelas I - II)</option>
              <option value="Fase B">Fase B (Kelas III - IV)</option>
              <option value="Fase C">Fase C (Kelas V - VI)</option>
            </select>
          </div>
        </div>

        {/* Mapel Filters Grid OR Dedicated Subject Page Header */}
        {selectedMapelFilter !== 'Semua' ? (
          <div className="pt-2 border-t border-slate-100">
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMapelFilter('Semua')}
                  className="bg-white/10 hover:bg-white/20 text-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-white/15 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Kategori Mapel</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal(selectedMapelFilter)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Materi {selectedMapelFilter}</span>
                </button>
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
                      Daftar Materi Pelajaran: {selectedMapelFilter}
                    </h2>
                    <span className="bg-emerald-500/20 text-emerald-300 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      {filteredItems.length} Materi
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-0.5 font-medium">
                    Halaman khusus kelola pokok bahasan materi untuk mata pelajaran {selectedMapelFilter}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Daftar Mata Pelajaran ({allMapelOptions.length} Mapel)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {['Semua', ...allMapelOptions].map((m, idx) => {
                const isSelected = selectedMapelFilter === m;
                const isCustom = localCustomMapel.includes(m);
                const meta = getMapelMeta(m);
                const IconComp = meta.icon;
                const count = m === 'Semua' 
                  ? materiList.length 
                  : materiList.filter(i => i.mataPelajaran === m).length;

                return (
                  <div
                    key={`${m}-${idx}`}
                    onClick={() => handleMapelClick(m)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-center space-x-2 group ${
                      isSelected
                        ? 'bg-slate-900 text-white border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-white hover:bg-emerald-50/50 border-slate-200/90 text-slate-800 shadow-2xs hover:border-emerald-400'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105 ${
                      isSelected ? meta.activeBg : meta.bg
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold leading-tight truncate ${
                        isSelected ? 'text-white' : 'text-slate-900 group-hover:text-emerald-950'
                      }`}>
                        {m}
                      </h4>
                      <p className={`text-[10px] font-medium mt-0.5 truncate ${
                        isSelected ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-700'
                      }`}>
                        {count} Materi
                      </p>
                    </div>

                    {isCustom && !isTeacherRole && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setMapelToDelete(m);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0"
                        title={`Hapus mapel custom "${m}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Grid Card button for Add New Mapel */}
              <button
                type="button"
                onClick={() => setShowAddMapelModal(true)}
                className="p-2.5 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-900 font-bold transition-all flex items-center space-x-2 text-left cursor-pointer group"
                title="Tambah Mata Pelajaran Manual Baru"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-extrabold text-emerald-950 block truncate">+ Mapel Baru</span>
                  <span className="text-[10px] text-emerald-700 block truncate">Tambah Manual</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section Anchor & All Materials Header (Only when 'Semua') */}
      {selectedMapelFilter === 'Semua' && (
        <div ref={listSectionRef} className="scroll-mt-4 space-y-3">
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-wrap items-center justify-between gap-3 border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs sm:text-sm font-black text-white">
                    Daftar Semua Materi Pelajaran
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {filteredItems.length} Materi
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                  Menampilkan seluruh pokok bahasan materi dari semua mata pelajaran
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Materi</span>
            </button>
          </div>
        </div>
      )}

      {/* Cards List Display (Grouped Rapi vs Grid) */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              {selectedMapelFilter !== 'Semua'
                ? `Belum Ada Materi untuk "${selectedMapelFilter}"`
                : 'Tidak Ada Materi Ditemukan'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {selectedMapelFilter !== 'Semua'
                ? `Saat ini belum ada pokok bahasan materi yang terdaftar untuk ${selectedMapelFilter}. Silakan buat materi baru sekarang.`
                : 'Tidak ada materi yang sesuai dengan kombinasi pencarian dan filter.'}
            </p>
          </div>
          <div className="pt-1 flex items-center justify-center gap-2">
            {selectedMapelFilter !== 'Semua' && (
              <button
                type="button"
                onClick={() => handleOpenAddModal(selectedMapelFilter)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Materi {selectedMapelFilter} Baru</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedMapelFilter('Semua');
                setSelectedSemesterFilter('Semua');
                setSelectedTahunFilter('Semua');
                setSelectedFaseFilter('Semua');
                setSearchQuery('');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              Reset Semua Filter
            </button>
          </div>
        </div>
      ) : groupingMode === 'grouped' ? (
        <div className="space-y-4">
          {(Object.entries(groupedMapelMap) as [string, MateriBankItem[]][]).map(([mapel, items], idx) => (
            <div key={`${mapel}-${idx}`} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 font-bold border border-emerald-200">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">{mapel}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Tersedia {items.length} pokok bahasan materi
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-3 py-1 rounded-full border border-emerald-300">
                  {items.length} Materi
                </span>
              </div>

              <div className={`grid gap-2.5 ${viewMode === 'compact' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                {items.map((item, idx) => renderItemCard(item, idx))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-2.5 ${viewMode === 'compact' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          {filteredItems.map((item, idx) => renderItemCard(item, idx))}
        </div>
      )}

      {/* Modal Form Add / Edit */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] overflow-y-auto flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-xs text-slate-800">
            <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <BookMarked className="w-4 h-4 text-emerald-400" />
                <span>{editingId ? 'Edit Data Materi' : 'Tambah Materi Baru ke Bank'}</span>
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-800 font-bold block">Mata Pelajaran</label>
                  <button
                    type="button"
                    onClick={() => setShowAddMapelModal(true)}
                    className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3 h-3 text-emerald-600" />
                    <span>+ Mapel Manual</span>
                  </button>
                </div>
                <select
                  value={formMapel}
                  onChange={e => setFormMapel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  {allMapelOptions.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Semester & Tahun Ajaran */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-800 font-bold block mb-1">Semester</label>
                  <select
                    value={formSemester}
                    onChange={e => setFormSemester(e.target.value as 'Ganjil (1)' | 'Genap (2)')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Ganjil (1)">Ganjil (1)</option>
                    <option value="Genap (2)">Genap (2)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-800 font-bold block mb-1">Tahun Ajaran</label>
                  <select
                    value={formTahunAjaran}
                    onChange={e => setFormTahunAjaran(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    {allTahunAjaranOptions.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold block mb-1">Fase / Kelas Target</label>
                <select
                  value={formFase}
                  onChange={e => setFormFase(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="Fase A (Kelas I MI)">Fase A (Kelas I MI)</option>
                  <option value="Fase A (Kelas II MI)">Fase A (Kelas II MI)</option>
                  <option value="Fase B (Kelas III MI)">Fase B (Kelas III MI)</option>
                  <option value="Fase B (Kelas IV MI)">Fase B (Kelas IV MI)</option>
                  <option value="Fase C (Kelas V MI)">Fase C (Kelas V MI)</option>
                  <option value="Fase C (Kelas VI MI)">Fase C (Kelas VI MI)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-800 font-bold block mb-1">Judul / Pokok Bahasa Materi</label>
                <input
                  type="text"
                  value={formJudul}
                  onChange={e => setFormJudul(e.target.value)}
                  placeholder="misal: Mengenal Sifat Allah Ar-Rahman (Maha Pengasih)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-800 font-bold">Uraian Materi Pelajaran (Runtut, Detail, & Komprehensif)</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const template = `1. Pengertian, Etimologi, & Konsep Utama: Uraikan definisi mendalam dan batasan konsep dari materi ${formJudul || 'pelajaran'}.\n\n2. Landasan Syariat & Dalil Al-Qur'an / Hadis / Keilmuan Relevan: Tuliskan lafaz Latin/terjemahan ayat/hadis atau landasan teori yang relevan.\n\n3. Ketentuan, Syarat, Rukun, & Komponen Pokok: Jelaskan kriteria teknis, syarat sah/wajib, rukun, atau elemen penting yang wajib dikuasai.\n\n4. Tata Cara, Urutan Langkah, & Adab Pembiasaan: Jabarkan tahapan pelaksanaan secara runtut dari awal hingga akhir beserta adab-adab terpuji.\n\n5. Integrasi Nilai Panca Cinta KBC & Hikmah: Hubungkan materi dengan pilar Panca Cinta KBC, kehangatan empati, serta hikmah emosional/sosial.\n\n6. Penerapan Praktis & Pembiasaan Akhlak Sehari-hari: Berikan contoh-contoh tindakan nyata murid di madrasah, rumah, dan lingkungan masyarakat.`;
                        setFormUraian(template);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg text-[10px] border border-slate-300 transition-all"
                      title="Sisipkan template 6 poin sub-bab"
                    >
                      ✨ Template 6 Sub-Bab
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateUraianAI}
                      disabled={isGeneratingUraian}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-1 rounded-lg text-[10px] flex items-center space-x-1.5 transition-all shadow-xs disabled:opacity-50"
                      title="Otomatisasi penyusunan 6 sub-bab uraian materi secara runtut & komprehensif via Gemini AI"
                    >
                      {isGeneratingUraian ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Menyusun AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span>Generate AI 6-Poin ⚡</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {genError && (
                  <div className="mb-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{genError}</span>
                  </div>
                )}

                <textarea
                  rows={8}
                  value={formUraian}
                  onChange={e => setFormUraian(e.target.value)}
                  placeholder="1. Pengertian, Etimologi, & Konsep Utama...&#10;2. Landasan Syariat & Dalil...&#10;3. Ketentuan, Syarat, & Rukun...&#10;4. Tata Cara & Adab Pembiasaan...&#10;5. Integrasi Panca Cinta KBC & Hikmah...&#10;6. Penerapan Praktis Sehari-hari..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs leading-relaxed focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-normal"
                  required
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold block mb-1">Integrasi Panca Cinta Default (Opsional)</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PANCA_CINTA_OPTIONS.map((opt, idx) => {
                    const isSelected = formPancaCinta.includes(opt);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => togglePancaCintaInForm(opt)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all ${
                          isSelected
                            ? 'bg-rose-50 border-rose-400 text-rose-800 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                        }`}
                      >
                        ♥ {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold block mb-1">Draf Capaian Pembelajaran (Opsional)</label>
                <textarea
                  rows={2}
                  value={formCapaian}
                  onChange={e => setFormCapaian(e.target.value)}
                  placeholder="Catatan draf CP atau tujuan pembelajaran untuk materi ini..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-normal"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSaveStatus !== 'idle'}
                  className={`font-extrabold px-5 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                    formSaveStatus === 'saved'
                      ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-105'
                      : formSaveStatus === 'saving'
                      ? 'bg-emerald-600 text-white opacity-80 cursor-wait'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                  }`}
                >
                  {formSaveStatus === 'saving' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : formSaveStatus === 'saved' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>✓ Materi Berhasil Disimpan!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Materi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Custom Mapel */}
      {showAddMapelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Tambah Mata Pelajaran Manual</span>
              </h3>
              <button
                onClick={() => setShowAddMapelModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewCustomMapel} className="space-y-3">
              <div>
                <label className="text-slate-800 font-bold block mb-1 text-xs">Nama Mata Pelajaran Baru *</label>
                <input
                  type="text"
                  value={newMapelInput}
                  onChange={e => setNewMapelInput(e.target.value)}
                  placeholder="misal: Bahasa Jawa, Prakarya Khas, Koding & AI"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Mata pelajaran baru akan langsung disimpan dan muncul di filter serta pilihan dropdown.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddMapelModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-xs"
                >
                  Tambah Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Single Materi */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Konfirmasi Hapus Materi</h3>
                <p className="text-[11px] text-slate-500 font-medium">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1 text-xs">
              <span className="text-[10px] font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                {itemToDelete.mataPelajaran}
              </span>
              <p className="font-extrabold text-slate-900 leading-snug pt-1">
                {itemToDelete.judulMateri}
              </p>
              <p className="text-[11px] text-slate-600 line-clamp-2">
                {itemToDelete.uraianMateri}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Materi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Custom Mapel */}
      {mapelToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hapus Mata Pelajaran Custom</h3>
                <p className="text-[11px] text-slate-500 font-medium">Hapus mapel dari daftar filter & pilihan</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Apakah Anda yakin ingin menghapus mata pelajaran <span className="font-extrabold text-slate-900">"{mapelToDelete}"</span>?
            </p>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setMapelToDelete(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMapel}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Mapel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MODAL OVERLAY FOR CLICKED MAPEL ("TAMPILAN MELAYANG") */}
      {activeMapelModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveMapelModal(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-600/80 shrink-0">
              <div className="flex items-center space-x-3">
                {(() => {
                  const meta = getMapelMeta(activeMapelModal);
                  const IconComp = meta.icon;
                  return (
                    <div className="p-2.5 bg-white/15 text-white rounded-xl backdrop-blur-md border border-white/20">
                      <IconComp className="w-5 h-5 text-emerald-100" />
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                      Daftar Materi: {activeMapelModal}
                    </h3>
                    <span className="bg-white/20 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border border-white/30">
                      {materiList.filter(i => i.mataPelajaran === activeMapelModal).length} Materi
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/90 font-medium">
                    Pokok Bahasan &amp; Bank Materi (Tampilan Melayang)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!isPickerMode && (
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(activeMapelModal)}
                    className="bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>+ Tambah Materi</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveMapelModal(null)}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer flex items-center space-x-1 border border-white/20 text-xs font-bold"
                  title="Tutup Jendela Melayang"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Tutup</span>
                </button>
              </div>
            </div>

            {/* Modal Filter Sub-Bar */}
            <div className="bg-slate-50 p-3 border-b border-slate-200 flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={e => setModalSearchQuery(e.target.value)}
                  placeholder={`Cari materi khusus ${activeMapelModal}...`}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-4 sm:p-6 bg-slate-50 flex-1 overflow-y-auto space-y-3">
              {(() => {
                const mapelItems = materiList.filter(i => {
                  const isMapelMatch = i.mataPelajaran === activeMapelModal;
                  if (!isMapelMatch) return false;
                  if (!modalSearchQuery.trim()) return true;
                  const q = modalSearchQuery.toLowerCase();
                  return (
                    i.judulMateri.toLowerCase().includes(q) ||
                    i.uraianMateri.toLowerCase().includes(q) ||
                    (i.faseKelas && i.faseKelas.toLowerCase().includes(q))
                  );
                });

                if (mapelItems.length === 0) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 my-4">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          Belum Ada Materi untuk "{activeMapelModal}"
                        </h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Silakan klik tombol di bawah untuk menambah pokok bahasan materi baru untuk {activeMapelModal}.
                        </p>
                      </div>
                      {!isPickerMode && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddModal(activeMapelModal)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Tambah Materi {activeMapelModal} Baru</span>
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className={`grid gap-3 ${viewMode === 'compact' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {mapelItems.map((item, idx) => renderItemCard(item, idx))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                💡 Seluruh data materi {activeMapelModal} ditampilkan dalam jendela melayang.
              </span>
              <button
                type="button"
                onClick={() => setActiveMapelModal(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 ml-auto"
              >
                <Check className="w-4 h-4" />
                <span>Selesai &amp; Tutup Jendela Melayang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
