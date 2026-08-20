import React, { useState, useMemo } from 'react';
import { StudentAccount, StudentQuizResult } from '../types';
import {
  loadStoredStudents,
  saveStudents,
  loadStoredStudentQuizResults,
  saveStudentQuizResults,
  DEFAULT_SAMPLE_STUDENTS
} from '../utils/storage';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  Key,
  GraduationCap,
  Sparkles,
  Printer,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCcw,
  Users,
  Award,
  BookOpen,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Scissors,
  SlidersHorizontal,
  Filter
} from 'lucide-react';

interface StudentListManagerProps {
  onDataChanged?: () => void;
}

export const StudentListManager: React.FC<StudentListManagerProps> = ({ onDataChanged }) => {
  const [students, setStudents] = useState<StudentAccount[]>(() => loadStoredStudents());
  const [quizResults, setQuizResults] = useState<StudentQuizResult[]>(() => loadStoredStudentQuizResults());
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'generate' | 'single' | 'print' | 'results'>('list');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('semua');
  const [showPinId, setShowPinId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Single Add Form
  const [namaInput, setNamaInput] = useState('');
  const [nisnInput, setNisnInput] = useState('');
  const [kelasInput, setKelasInput] = useState('Kelas 1 (Fase A)');
  const [pinInput, setPinInput] = useState('masbagus');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Edit Form
  const [editingStudent, setEditingStudent] = useState<StudentAccount | null>(null);

  // Batch Generate Form
  const [batchKelas, setBatchKelas] = useState('Kelas 1 (Fase A)');
  const [batchNamesText, setBatchNamesText] = useState('');
  const [batchNisnPrefix, setBatchNisnPrefix] = useState('202501');
  const [batchDefaultPin, setBatchDefaultPin] = useState('masbagus');
  const [msgNotice, setMsgNotice] = useState<string | null>(null);

  // Print Settings & Filtering
  const [printKelasFilter, setPrintKelasFilter] = useState<string>('semua');
  const [printSearchQuery, setPrintSearchQuery] = useState<string>('');
  const [printColsMode, setPrintColsMode] = useState<2 | 3>(2);

  const KELAS_OPTIONS = [
    'Kelas 1 (Fase A)',
    'Kelas 2 (Fase A)',
    'Kelas 3 (Fase B)',
    'Kelas 4 (Fase B)',
    'Kelas 5 (Fase C)',
    'Kelas 6 (Fase C)'
  ];

  const handleRefresh = () => {
    setStudents(loadStoredStudents());
    setQuizResults(loadStoredStudentQuizResults());
  };

  const showToast = (msg: string) => {
    setMsgNotice(msg);
    setTimeout(() => setMsgNotice(null), 3500);
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKelas = selectedKelasFilter === 'semua' || s.kelas === selectedKelasFilter;
      return matchSearch && matchKelas;
    });
  }, [students, searchQuery, selectedKelasFilter]);

  // Filtered Students for Printing
  const printableStudents = useMemo(() => {
    return students.filter(s => {
      const matchKelas = printKelasFilter === 'semua' || s.kelas === printKelasFilter;
      const matchSearch = s.nama.toLowerCase().includes(printSearchQuery.toLowerCase()) ||
        s.nisn.toLowerCase().includes(printSearchQuery.toLowerCase());
      return matchKelas && matchSearch;
    });
  }, [students, printKelasFilter, printSearchQuery]);

  // Statistics
  const totalStudents = students.length;
  const totalQuizDone = quizResults.length;

  // Single Add / Edit Submit
  const handleSaveSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaInput.trim()) {
      alert('Nama siswa tidak boleh kosong!');
      return;
    }

    const cleanNisn = nisnInput.trim() || `NISN-${Date.now().toString().slice(-6)}`;
    const cleanPin = pinInput.trim() || 'masbagus';

    setIsSaving(true);
    setTimeout(() => {
      if (editingStudent) {
        const updated = students.map(s => s.id === editingStudent.id ? {
          ...s,
          nama: namaInput.trim(),
          nisn: cleanNisn,
          kelas: kelasInput,
          pin: cleanPin
        } : s);
        saveStudents(updated);
        setStudents(updated);
        setEditingStudent(null);
        showToast(`Akun siswa "${namaInput.trim()}" berhasil diperbarui!`);
      } else {
        const newStudent: StudentAccount = {
          id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          nama: namaInput.trim(),
          nisn: cleanNisn,
          kelas: kelasInput,
          pin: cleanPin,
          createdAt: new Date().toISOString()
        };
        const updated = [newStudent, ...students];
        saveStudents(updated);
        setStudents(updated);
        showToast(`Akun siswa "${namaInput.trim()}" berhasil ditambahkan!`);
      }

      // Reset Form
      setNamaInput('');
      setNisnInput('');
      setPinInput('masbagus');
      if (onDataChanged) onDataChanged();

      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setActiveSubTab('list');
      }, 900);
    }, 300);
  };

  // Start Edit
  const handleStartEdit = (student: StudentAccount) => {
    setEditingStudent(student);
    setNamaInput(student.nama);
    setNisnInput(student.nisn);
    setKelasInput(student.kelas);
    setPinInput(student.pin);
    setActiveSubTab('single');
  };

  // Delete Student
  const handleDeleteStudent = (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun siswa "${nama}"?`)) return;
    const updated = students.filter(s => s.id !== id);
    saveStudents(updated);
    setStudents(updated);
    showToast(`Akun siswa "${nama}" berhasil dihapus.`);
    if (onDataChanged) onDataChanged();
  };

  // Reset to Sample Students
  const handleResetSampleStudents = () => {
    if (!confirm('Kembalikan daftar akun ke data sampel default? Data kustom akan ditimpa.')) return;
    saveStudents(DEFAULT_SAMPLE_STUDENTS);
    setStudents(DEFAULT_SAMPLE_STUDENTS);
    showToast('Berhasil mengembalikan data akun siswa ke sampel default!');
    if (onDataChanged) onDataChanged();
  };

  // Batch Generate Submit
  const handleBatchGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = batchNamesText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      alert('Masukkan minimal 1 nama siswa untuk digenerate!');
      return;
    }

    const prefix = batchNisnPrefix.trim() || '2025';
    const defaultPin = batchDefaultPin.trim() || 'masbagus';

    const newGenerated: StudentAccount[] = lines.map((name, idx) => {
      const padIndex = String(idx + 1).padStart(2, '0');
      const uniqueNisn = `${prefix}${padIndex}`;
      return {
        id: `student-gen-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        nama: name,
        nisn: uniqueNisn,
        kelas: batchKelas,
        pin: defaultPin,
        createdAt: new Date().toISOString()
      };
    });

    const updated = [...newGenerated, ...students];
    saveStudents(updated);
    setStudents(updated);
    setBatchNamesText('');
    showToast(`Berhasil meng-generate ${newGenerated.length} akun siswa untuk ${batchKelas}!`);
    setActiveSubTab('list');
    if (onDataChanged) onDataChanged();
  };

  // Copy Login Info
  const handleCopyCredentials = (student: StudentAccount) => {
    const text = `🎓 LOGIN KUIS SISWA\nNama: ${student.nama}\nKelas: ${student.kelas}\nNISN / ID Login: ${student.nisn}\nPIN: ${student.pin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Print Login Cards
  const handlePrintCards = () => {
    const printEl = document.getElementById('printable-student-cards');
    if (!printEl) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      window.print();
      return;
    }

    const is3Col = printColsMode === 3;
    const cardsHtml = printEl.innerHTML;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Kartu Login Siswa - Kuis KBC</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 6mm 6mm 6mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #ffffff;
            color: #0f172a;
            padding: 2mm;
            margin: 0;
          }
          .cards-print-wrapper {
            display: grid !important;
            grid-template-columns: ${is3Col ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'} !important;
            gap: ${is3Col ? '3mm' : '4mm'} !important;
            width: 100% !important;
          }
          .login-card-item {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 1px dashed #64748b !important;
            border-radius: 6px !important;
            background: #ffffff !important;
            padding: ${is3Col ? '2.5mm' : '3.5mm'} !important;
          }
          @media print {
            body { padding: 0 !important; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="cards-print-wrapper">
          ${cardsHtml}
        </div>
        <script>
          setTimeout(() => {
            window.print();
          }, 400);
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // Delete Quiz Result History Item
  const handleDeleteQuizResult = (id: string) => {
    if (!confirm('Hapus arsip kuis ini?')) return;
    const updated = quizResults.filter(r => r.id !== id);
    saveStudentQuizResults(updated);
    setQuizResults(updated);
    showToast('Arsip kuis berhasil dihapus.');
    if (onDataChanged) onDataChanged();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-emerald-800 p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Users className="w-5 h-5 text-emerald-100" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Manajemen & Generate Akun Siswa</h3>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl">
            Kelola dan generate akun siswa secara otomatis untuk login kuis interaktif. Setiap siswa memiliki akun, PIN, dan arsip riwayat kuis masing-masing.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-center">
            <p className="text-[10px] uppercase text-emerald-200 font-bold tracking-wider">Total Siswa</p>
            <p className="text-lg font-black">{totalStudents}</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-center">
            <p className="text-[10px] uppercase text-emerald-200 font-bold tracking-wider">Arsip Kuis</p>
            <p className="text-lg font-black">{totalQuizDone}</p>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {msgNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msgNotice}</span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs overflow-x-auto shadow-2xs gap-1">
        <button
          onClick={() => { setActiveSubTab('list'); setEditingStudent(null); }}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'list' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Daftar Akun Siswa ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('generate')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'generate' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>⚡ Generate Massal</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('single'); if (!editingStudent) { setNamaInput(''); setNisnInput(''); } }}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'single' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{editingStudent ? 'Edit Siswa' : 'Tambah Manual'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('print')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'print' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak Kartu Login</span>
        </button>

        <button
          onClick={() => setActiveSubTab('results')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'results' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-300" />
          <span>Arsip Kuis Seluruh Siswa ({quizResults.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: DAFTAR AKUN SISWA */}
      {activeSubTab === 'list' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau NISN siswa..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={selectedKelasFilter}
                onChange={e => setSelectedKelasFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="semua">Semua Kelas ({students.length})</option>
                {KELAS_OPTIONS.map(k => (
                  <option key={k} value={k}>
                    {k} ({students.filter(s => s.kelas === k).length})
                  </option>
                ))}
              </select>

              <button
                onClick={handleResetSampleStudents}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                title="Reset ke Sampel Default"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Students List Table / Cards */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Tidak ada akun siswa yang sesuai dengan filter filter ini.</p>
              <button
                onClick={() => setActiveSubTab('generate')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Akun Siswa Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">NISN / ID Login</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">PIN Login</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, index) => {
                    const isShowingPin = showPinId === student.id;
                    const isCopied = copiedId === student.id;
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {student.nama.charAt(0).toUpperCase()}
                          </div>
                          <span>{student.nama}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{student.nisn}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200">
                            {student.kelas}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5 font-mono">
                            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold">
                              {isShowingPin ? student.pin : '••••'}
                            </span>
                            <button
                              onClick={() => setShowPinId(isShowingPin ? null : student.id)}
                              className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                              title={isShowingPin ? "Sembunyikan PIN" : "Lihat PIN"}
                            >
                              {isShowingPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleCopyCredentials(student)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                isCopied ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                              title="Salin Data Akses Siswa"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleStartEdit(student)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer"
                              title="Edit Akun Siswa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteStudent(student.id, student.nama)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
                              title="Hapus Akun Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: GENERATE MASSAL AKUN SISWA */}
      {activeSubTab === 'generate' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Generate Akun Siswa Otomatis (Massal)</h4>
                <p className="text-xs text-slate-500">Masukkan daftar nama siswa per baris untuk membuat NISN & PIN otomatis sekaligus.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleBatchGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas / Rombel</label>
                <select
                  value={batchKelas}
                  onChange={e => setBatchKelas(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {KELAS_OPTIONS.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Awalan NISN / ID Login</label>
                <input
                  type="text"
                  value={batchNisnPrefix}
                  onChange={e => setBatchNisnPrefix(e.target.value)}
                  placeholder="Contoh: 202501"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default PIN Siswa</label>
                <input
                  type="text"
                  value={batchDefaultPin}
                  onChange={e => setBatchDefaultPin(e.target.value)}
                  placeholder="Contoh: 1234"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Daftar Nama Siswa <span className="font-normal text-slate-500">(Satu nama per baris)</span>
              </label>
              <textarea
                rows={8}
                value={batchNamesText}
                onChange={e => setBatchNamesText(e.target.value)}
                placeholder={"Contoh:\nAhmad Fauzi\nSiti Nurjanah\nBudi Santoso\nZahra Amelia\nMuhammad Rizky"}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                Sistem akan membuatkan ID NISN unik dan memasangkan PIN default untuk setiap siswa. Hasilnya dapat langsung dipakai siswa untuk login di link kuis.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('list')}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>🚀 Generate Akun Sekarang</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: TAMBAH / EDIT MANUAL */}
      {activeSubTab === 'single' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="border-b border-slate-100 pb-3 flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{editingStudent ? 'Edit Akun Siswa' : 'Tambah Akun Siswa Manual'}</h4>
              <p className="text-xs text-slate-500">Isi identitas siswa di bawah ini.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSingleStudent} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
              <input
                type="text"
                required
                value={namaInput}
                onChange={e => setNamaInput(e.target.value)}
                placeholder="Masukkan nama lengkap siswa..."
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NISN / Nomor Induk (ID Login)</label>
                <input
                  type="text"
                  value={nisnInput}
                  onChange={e => setNisnInput(e.target.value)}
                  placeholder="Contoh: 20250101"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kelas / Fase *</label>
                <select
                  value={kelasInput}
                  onChange={e => setKelasInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {KELAS_OPTIONS.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIN / Password Login *</label>
              <input
                type="text"
                required
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="4-6 digit angka, contoh: 1234"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => { setActiveSubTab('list'); setEditingStudent(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving || isSaved}
                className={`font-bold px-5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all ${
                  isSaved
                    ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-105'
                    : isSaving
                    ? 'bg-emerald-600 text-white opacity-80 cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>✓ Akun Siswa Berhasil Disimpan!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan Akun Siswa</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 4: CETAK KARTU LOGIN */}
      {activeSubTab === 'print' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {/* Header & Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Printer className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Cetak Kartu Akses Login Siswa</h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Format kartu dirancang ringkas & presisi agar muat banyak kartu per lembar A4 tanpa terpotong.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Kelas */}
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={printKelasFilter}
                  onChange={e => setPrintKelasFilter(e.target.value)}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value="semua">Semua Kelas ({students.length} Siswa)</option>
                  {KELAS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                      {opt} ({students.filter(s => s.kelas === opt).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Kolom / Kerapatan */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPrintColsMode(2)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    printColsMode === 2
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="2 Kolom: ~8 Kartu per lembar A4 (Ukuran Standar Proporsional)"
                >
                  2 Kolom (Standar)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintColsMode(3)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    printColsMode === 3
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="3 Kolom: ~12-15 Kartu per lembar A4 (Super Hemat Kertas)"
                >
                  3 Kolom (Super Hemat)
                </button>
              </div>

              {/* Tombol Cetak PDF */}
              <button
                onClick={handlePrintCards}
                disabled={printableStudents.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>

          {/* Search & Info Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-xl text-xs">
            <div className="flex items-center space-x-2 text-emerald-900 font-medium">
              <Scissors className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Menampilkan <strong>{printableStudents.length}</strong> kartu siswa{' '}
                <span className="text-emerald-700 font-normal">
                  (Estimasi:{' '}
                  <strong>
                    {Math.ceil(printableStudents.length / (printColsMode === 2 ? 8 : 12))}
                  </strong>{' '}
                  lembar kertas A4)
                </span>
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={printSearchQuery}
                onChange={e => setPrintSearchQuery(e.target.value)}
                placeholder="Cari nama atau NISN..."
                className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              {printSearchQuery && (
                <button
                  onClick={() => setPrintSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Empty State */}
          {printableStudents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-2">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-600 font-bold">Tidak ada data kartu siswa yang cocok.</p>
              <p className="text-[11px] text-slate-400">Silakan ubah filter kelas atau kata kunci pencarian.</p>
            </div>
          ) : (
            /* Printable Cards Grid (Simple, Space-Saving, No Wasted Margin) */
            <div
              id="printable-student-cards"
              className={`printable-document grid gap-2.5 ${
                printColsMode === 3
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              {printableStudents.map(student => (
                <div
                  key={student.id}
                  className="login-card-item border border-dashed border-slate-300 rounded-lg p-2.5 bg-white shadow-2xs relative flex flex-col justify-between space-y-2 text-slate-800"
                >
                  {/* Card Top Header */}
                  <div className="flex items-center justify-between border-b border-emerald-600/70 pb-1">
                    <div className="flex items-center space-x-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="text-[10px] font-black tracking-tight uppercase text-emerald-900">
                        KARTU LOGIN SISWA
                      </span>
                    </div>
                    <span className="text-[8.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-bold truncate max-w-[120px]">
                      {student.kelas}
                    </span>
                  </div>

                  {/* Student Name */}
                  <div className="px-0.5">
                    <p className="text-[8px] text-slate-400 uppercase font-semibold tracking-tight">
                      Nama Siswa:
                    </p>
                    <p className="text-[11px] font-extrabold text-slate-900 leading-snug truncate">
                      {student.nama}
                    </p>
                  </div>

                  {/* Credentials Box */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-50 border border-slate-200 rounded p-1.5 text-[10.5px] font-mono">
                    <div className="min-w-0">
                      <p className="text-[7.5px] text-slate-500 font-sans font-medium uppercase truncate">
                        NISN / ID LOGIN
                      </p>
                      <p className="font-bold text-emerald-800 truncate tracking-wide text-xs">
                        {student.nisn}
                      </p>
                    </div>
                    <div className="min-w-0 border-l border-slate-200 pl-1.5">
                      <p className="text-[7.5px] text-slate-500 font-sans font-medium uppercase truncate">
                        PIN LOGIN
                      </p>
                      <p className="font-bold text-amber-700 truncate tracking-wide text-xs">
                        {student.pin}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom / Cut Guide */}
                  <div className="flex items-center justify-between text-[7.5px] text-slate-400 border-t border-dashed border-slate-200 pt-1">
                    <span className="truncate">Modul Ajar KBC</span>
                    <span className="italic shrink-0">✂ Gunting sesuai garis</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: ARSIP KUIS SELURUH SISWA */}
      {activeSubTab === 'results' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Arsip Riwayat Kuis Seluruh Siswa</h4>
              <p className="text-xs text-slate-500">Seluruh hasil kuis yang telah dikerjakan siswa tersimpan di sini.</p>
            </div>
            <button
              onClick={handleRefresh}
              className="text-xs border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 flex items-center space-x-1 font-semibold text-slate-600"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {quizResults.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-2">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Belum ada arsip kuis yang dikerjakan oleh siswa.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4">Judul Modul/Kuis</th>
                    <th className="py-3 px-4 text-center">Skor</th>
                    <th className="py-3 px-4 text-center">Nilai</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizResults.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(result.tanggal).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{result.studentName}</td>
                      <td className="py-3 px-4 text-slate-600">{result.kelas || '-'}</td>
                      <td className="py-3 px-4 font-medium text-emerald-800">{result.mataPelajaran}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{result.modulJudul}</td>
                      <td className="py-3 px-4 text-center font-bold font-mono">
                        {result.skor} / {result.totalSoal}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-black text-xs ${
                          result.nilai >= 80 ? 'bg-emerald-100 text-emerald-800' :
                          result.nilai >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {result.nilai}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteQuizResult(result.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                          title="Hapus Arsip Kuis"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
