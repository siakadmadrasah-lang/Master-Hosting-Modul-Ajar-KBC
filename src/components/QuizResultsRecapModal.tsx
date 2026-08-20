import React, { useState, useMemo, useEffect } from 'react';
import {
  StudentQuizResult,
  StudentQuizResultDetail,
  TeacherItem,
  ModulAjarCinta,
  KopSuratSettings,
  TTDSettings
} from '../types';
import {
  loadStoredStudentQuizResults,
  saveStudentQuizResults,
  deleteStudentQuizResult,
  clearStudentQuizResults,
  loadStoredStudents,
  loadStoredTeachers,
  loadMasterMapelList,
  loadKopSurat,
  loadTTD
} from '../utils/storage';
import { UserSession, isSuperAdminUser } from '../utils/auth';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Layers,
  Printer,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
  XCircle,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';

interface QuizResultsRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession?: UserSession | null;
  allModules?: ModulAjarCinta[];
  onDataChanged?: () => void;
}

export const QuizResultsRecapModal: React.FC<QuizResultsRecapModalProps> = ({
  isOpen,
  onClose,
  userSession,
  allModules = [],
  onDataChanged
}) => {
  const [results, setResults] = useState<StudentQuizResult[]>(() => loadStoredStudentQuizResults());
  const [teachers] = useState<TeacherItem[]>(() => loadStoredTeachers());
  const [kopSurat] = useState<KopSuratSettings>(() => loadKopSurat());
  const [ttd] = useState<TTDSettings>(() => loadTTD());

  // Active Main Subtab
  const [activeTab, setActiveTab] = useState<'per_siswa' | 'per_kelas' | 'per_mapel' | 'analisis'>('per_siswa');

  // Teacher Filter Mode ('my_classes' vs 'all')
  const isTeacher = userSession?.role === 'guru';
  const isAdmin = userSession?.role === 'admin' || isSuperAdminUser(userSession);
  const [teacherScope, setTeacherScope] = useState<'my_classes' | 'all'>(isTeacher ? 'my_classes' : 'all');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('semua');
  const [selectedMapel, setSelectedMapel] = useState<string>('semua');
  const [selectedGuru, setSelectedGuru] = useState<string>('semua');
  const [selectedStatus, setSelectedStatus] = useState<'semua' | 'tuntas' | 'remedial'>('semua');

  // Answer Sheet Modal State
  const [selectedDetailResult, setSelectedDetailResult] = useState<StudentQuizResult | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRefresh = () => {
    setResults(loadStoredStudentQuizResults());
    showToast('Data hasil kuis berhasil disegarkan!');
  };

  useEffect(() => {
    if (isOpen) {
      setResults(loadStoredStudentQuizResults());
    }
  }, [isOpen]);

  // Normalize matching strings helper
  const normStr = (str?: string) => (str || '').toLowerCase().trim();

  // Filter results based on Teacher assignment & Scope
  const scopedResults = useMemo(() => {
    if (!isTeacher || teacherScope === 'all') {
      return results;
    }

    const teacherName = normStr(userSession?.namaLengkap);
    const teacherMapelList = (userSession?.mapelAmpu || []).map(normStr);
    const teacherKelasList = (userSession?.kelasAmpu || []).map(normStr);

    return results.filter(r => {
      // 1. Check direct teacher name / NIP match
      if (r.guruPengampu && normStr(r.guruPengampu) === teacherName) return true;
      if (r.guruNip && userSession?.nip && r.guruNip.trim() === userSession.nip.trim()) return true;

      // 2. Check if the module was created by this teacher
      if (r.modulId) {
        const mod = allModules.find(m => m.id === r.modulId);
        if (mod) {
          if (normStr(mod.penyusun) === teacherName || normStr(mod.guruPengampu) === teacherName) return true;
          if (normStr(mod.ttd?.guruKelasNama) === teacherName) return true;
        }
      }

      // 3. Check subject match
      const rMapel = normStr(r.mataPelajaran);
      const isMapelMatched = teacherMapelList.some(m => m && (rMapel.includes(m) || m.includes(rMapel)));

      // 4. Check class / rombel match
      const rKelas = normStr(r.kelas);
      const isKelasMatched = teacherKelasList.some(k => {
        if (!k) return false;
        // Extract numbers e.g. "Kelas 4", "4", "Fase B"
        const numK = k.replace(/[^0-9]/g, '');
        const numR = rKelas.replace(/[^0-9]/g, '');
        if (numK && numR && numK === numR) return true;
        return rKelas.includes(k) || k.includes(rKelas);
      });

      return isMapelMatched || isKelasMatched;
    });
  }, [results, isTeacher, teacherScope, userSession, allModules]);

  // Dynamic filter options based on available scoped data
  const availableKelasOptions = useMemo(() => {
    const setK = new Set<string>();
    scopedResults.forEach(r => {
      if (r.kelas && r.kelas.trim()) setK.add(r.kelas.trim());
    });
    // Add standard defaults if empty
    if (setK.size === 0) {
      ['Kelas 1 (Fase A)', 'Kelas 2 (Fase A)', 'Kelas 3 (Fase B)', 'Kelas 4 (Fase B)', 'Kelas 5 (Fase C)', 'Kelas 6 (Fase C)'].forEach(k => setK.add(k));
    }
    return Array.from(setK).sort();
  }, [scopedResults]);

  const availableMapelOptions = useMemo(() => {
    const setM = new Set<string>();
    scopedResults.forEach(r => {
      if (r.mataPelajaran && r.mataPelajaran.trim()) setM.add(r.mataPelajaran.trim());
    });
    loadMasterMapelList().forEach(m => setM.add(m));
    return Array.from(setM).sort();
  }, [scopedResults]);

  const availableGuruOptions = useMemo(() => {
    const setG = new Set<string>();
    teachers.forEach(t => {
      if (t.nama && t.nama.trim()) setG.add(t.nama.trim());
    });
    scopedResults.forEach(r => {
      if (r.guruPengampu && r.guruPengampu.trim()) setG.add(r.guruPengampu.trim());
    });
    return Array.from(setG).sort();
  }, [teachers, scopedResults]);

  // Filtered by UI Selectors
  const filteredResults = useMemo(() => {
    return scopedResults.filter(r => {
      // Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = r.studentName.toLowerCase().includes(q);
        const matchNisn = r.nisn?.toLowerCase().includes(q);
        const matchModul = r.modulJudul?.toLowerCase().includes(q);
        const matchMapel = r.mataPelajaran?.toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchModul && !matchMapel) return false;
      }

      // Kelas
      if (selectedKelas !== 'semua') {
        const numSel = selectedKelas.replace(/[^0-9]/g, '');
        const numR = (r.kelas || '').replace(/[^0-9]/g, '');
        if (numSel && numR) {
          if (numSel !== numR && r.kelas !== selectedKelas) return false;
        } else if (r.kelas !== selectedKelas) {
          return false;
        }
      }

      // Mapel
      if (selectedMapel !== 'semua') {
        const normTarget = normStr(selectedMapel);
        const normR = normStr(r.mataPelajaran);
        if (!normR.includes(normTarget) && !normTarget.includes(normR)) return false;
      }

      // Guru
      if (selectedGuru !== 'semua') {
        if (normStr(r.guruPengampu) !== normStr(selectedGuru)) return false;
      }

      // Status Ketuntasan (KKTP >= 75)
      if (selectedStatus === 'tuntas' && r.nilai < 75) return false;
      if (selectedStatus === 'remedial' && r.nilai >= 75) return false;

      return true;
    });
  }, [scopedResults, searchQuery, selectedKelas, selectedMapel, selectedGuru, selectedStatus]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const count = filteredResults.length;
    if (count === 0) {
      return { total: 0, avg: 0, highest: 0, lowest: 0, tuntasCount: 0, tuntasPercent: 0 };
    }
    const sum = filteredResults.reduce((acc, r) => acc + r.nilai, 0);
    const avg = Math.round(sum / count);
    const highest = Math.max(...filteredResults.map(r => r.nilai));
    const lowest = Math.min(...filteredResults.map(r => r.nilai));
    const tuntasCount = filteredResults.filter(r => r.nilai >= 75).length;
    const tuntasPercent = Math.round((tuntasCount / count) * 100);

    return { total: count, avg, highest, lowest, tuntasCount, tuntasPercent };
  }, [filteredResults]);

  // Grouped by Class (For Tab 2)
  const groupedByKelas = useMemo(() => {
    const groups: Record<string, StudentQuizResult[]> = {};
    filteredResults.forEach(r => {
      const k = r.kelas || 'Belum Terdata';
      if (!groups[k]) groups[k] = [];
      groups[k].push(r);
    });
    return groups;
  }, [filteredResults]);

  // Grouped by Subject (For Tab 3)
  const groupedByMapel = useMemo(() => {
    const groups: Record<string, StudentQuizResult[]> = {};
    filteredResults.forEach(r => {
      const m = r.mataPelajaran || 'Mata Pelajaran Umum';
      if (!groups[m]) groups[m] = [];
      groups[m].push(r);
    });
    return groups;
  }, [filteredResults]);

  // Grade badge helper
  const getGradeInfo = (nilai: number) => {
    if (nilai >= 85) return { label: 'Sangat Baik (A)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (nilai >= 75) return { label: 'Baik (B) - Tuntas', color: 'bg-teal-100 text-teal-800 border-teal-300' };
    if (nilai >= 60) return { label: 'Cukup (C)', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: 'Perlu Remedial (D)', color: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  // Delete Result Handler
  const handleDeleteResult = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus arsip hasil kuis ini?')) return;
    deleteStudentQuizResult(id);
    setResults(loadStoredStudentQuizResults());
    showToast('Hasil kuis berhasil dihapus.');
    if (onDataChanged) onDataChanged();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredResults.length === 0) {
      alert('Tidak ada data hasil kuis untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Tanggal Pengerjaan',
      'Nama Siswa',
      'NISN',
      'Kelas / Rombel',
      'Mata Pelajaran',
      'Judul Modul / Materi',
      'Guru Pengampu',
      'Skor Benar',
      'Total Soal',
      'Nilai Akhir',
      'Kualifikasi / Keterangan'
    ];

    const rows = filteredResults.map((r, idx) => {
      const kualifikasi = r.nilai >= 85 ? 'Sangat Baik' : r.nilai >= 75 ? 'Baik (Tuntas)' : r.nilai >= 60 ? 'Cukup' : 'Perlu Remedial';
      return [
        idx + 1,
        `"${new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}"`,
        `"${r.studentName.replace(/"/g, '""')}"`,
        `"${r.nisn || '-'}"`,
        `"${(r.kelas || '-').replace(/"/g, '""')}"`,
        `"${(r.mataPelajaran || '-').replace(/"/g, '""')}"`,
        `"${(r.modulJudul || '-').replace(/"/g, '""')}"`,
        `"${(r.guruPengampu || '-').replace(/"/g, '""')}"`,
        r.skor,
        r.totalSoal,
        r.nilai,
        `"${kualifikasi}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Nilai_Kuis_KBC_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV Rekap Nilai berhasil diunduh!');
  };

  // Print Individual Student Quiz Report
  const handlePrintStudentReport = (r: StudentQuizResult) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const grade = getGradeInfo(r.nilai);
    const details = r.detailJawaban || [];

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rapor Kuis Siswa - ${r.studentName}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 11.5pt; }
          .kop { text-align: center; border-bottom: 2.5px solid #065f46; padding-bottom: 10px; margin-bottom: 15px; }
          .kop h2 { margin: 0; font-size: 14pt; color: #065f46; text-transform: uppercase; font-weight: 800; }
          .kop h3 { margin: 2px 0; font-size: 12pt; color: #1e293b; font-weight: 700; }
          .kop p { margin: 2px 0; font-size: 9pt; color: #64748b; }
          .title { text-align: center; font-size: 12pt; font-weight: 800; text-transform: uppercase; margin: 15px 0 10px; letter-spacing: 0.5px; color: #0f172a; }
          table.info { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          table.info td { padding: 4px 6px; font-size: 10.5pt; vertical-align: top; }
          table.info td.label { width: 180px; font-weight: 600; color: #475569; }
          table.info td.colon { width: 10px; font-weight: 700; }
          .score-card { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 12px; margin: 15px 0; text-align: center; }
          .score-num { font-size: 28pt; font-weight: 900; color: #15803d; margin: 0; }
          .score-label { font-size: 10pt; color: #166534; font-weight: 700; text-transform: uppercase; }
          table.detail { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 9.5pt; }
          table.detail th, table.detail td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          table.detail th { background: #f8fafc; font-weight: 800; color: #334155; }
          .benar { color: #16a34a; font-weight: bold; }
          .salah { color: #dc2626; font-weight: bold; }
          .ttd-box { margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .ttd-col { text-align: center; width: 200px; font-size: 10pt; }
          .ttd-space { height: 60px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="kop">
          <h2>${kopSurat.namaKantor || "LEMBAGA PENDIDIKAN MA'ARIF NU"}</h2>
          <h3>${kopSurat.namaMadrasah || 'MADRASAH IBTIDAIYAH BERBASIS CINTA'}</h3>
          <p>${kopSurat.alamatMadrasah || ''} | ${kopSurat.kontakMadrasah || ''}</p>
        </div>

        <div class="title">LEMBAR LAPORAN HASIL KUIS DIGITAL (KBC)</div>

        <table class="info">
          <tr>
            <td class="label">Nama Peserta Didik</td>
            <td class="colon">:</td>
            <td><strong>${r.studentName}</strong></td>
            <td class="label">Kelas / Rombel</td>
            <td class="colon">:</td>
            <td><strong>${r.kelas || '-'}</strong></td>
          </tr>
          <tr>
            <td class="label">NISN / No. Induk</td>
            <td class="colon">:</td>
            <td>${r.nisn || '-'}</td>
            <td class="label">Mata Pelajaran</td>
            <td class="colon">:</td>
            <td><strong>${r.mataPelajaran}</strong></td>
          </tr>
          <tr>
            <td class="label">Judul Modul / Materi</td>
            <td class="colon">:</td>
            <td colspan="4"><strong>${r.modulJudul}</strong></td>
          </tr>
          <tr>
            <td class="label">Guru Pengampu</td>
            <td class="colon">:</td>
            <td>${r.guruPengampu || ttd.guruKelasNama || '-'}</td>
            <td class="label">Waktu Pengerjaan</td>
            <td class="colon">:</td>
            <td>${new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        </table>

        <div class="score-card">
          <div class="score-label">NILAI AKHIR EVALUASI KUIS</div>
          <div class="score-num">${r.nilai}</div>
          <p style="margin: 4px 0 0; font-size: 10.5pt; font-weight: 600; color: #166534;">
            Skor Benar: ${r.skor} dari ${r.totalSoal} Soal (${grade.label})
          </p>
        </div>

        ${details.length > 0 ? `
          <h4 style="margin: 15px 0 6px; font-size: 10.5pt; color: #0f172a; text-transform: uppercase;">
            Rincian Lembar Jawaban Siswa:
          </h4>
          <table class="detail">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">No</th>
                <th>Pertanyaan Soal</th>
                <th style="width: 140px;">Jawaban Siswa</th>
                <th style="width: 140px;">Kunci Jawaban</th>
                <th style="width: 60px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${details.map((d, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td>${d.pertanyaan}</td>
                  <td>${d.pilihan?.[d.jawabanSiswaIndex] || `Pilihan ${String.fromCharCode(65 + d.jawabanSiswaIndex)}`}</td>
                  <td>${d.pilihan?.[d.kunciJawabanIndex] || `Pilihan ${String.fromCharCode(65 + d.kunciJawabanIndex)}`}</td>
                  <td style="text-align: center;" class="${d.isBenar ? 'benar' : 'salah'}">
                    ${d.isBenar ? '✓ Benar' : '✗ Salah'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="ttd-box">
          <div class="ttd-col">
            <p>Mengetahui,</p>
            <p>Orang Tua / Wali Murid</p>
            <div class="ttd-space"></div>
            <p><strong>_____________________</strong></p>
          </div>
          <div class="ttd-col">
            <p>${ttd.tempatPenetapan || 'Banyumas'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Guru Pengampu / Wali Kelas,</p>
            <div class="ttd-space"></div>
            <p><strong>${r.guruPengampu || ttd.guruKelasNama || 'Guru Pengampu'}</strong></p>
            <p style="font-size: 8.5pt; color: #64748b;">NIP: ${r.guruNip || ttd.guruKelasNIP || '-'}</p>
          </div>
        </div>

        <script>
          setTimeout(() => { window.print(); }, 400);
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // Print Class Leger Table
  const handlePrintClassLeger = (kelasName: string, classResults: StudentQuizResult[]) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rekap Nilai Leger - ${kelasName}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; font-size: 10pt; line-height: 1.4; }
          .kop { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 8px; margin-bottom: 12px; }
          .kop h2 { margin: 0; font-size: 13pt; color: #065f46; font-weight: 800; }
          .kop h3 { margin: 2px 0; font-size: 11pt; font-weight: 700; }
          .kop p { margin: 0; font-size: 8.5pt; color: #64748b; }
          .title { text-align: center; font-size: 12pt; font-weight: 800; text-transform: uppercase; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f0fdf4; color: #166534; font-weight: 800; text-transform: uppercase; font-size: 8.5pt; }
          .center { text-align: center; }
          .nilai-bold { font-weight: bold; color: #047857; }
          .ttd-box { margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .ttd-col { text-align: center; width: 220px; font-size: 9.5pt; }
          .ttd-space { height: 50px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="kop">
          <h2>${kopSurat.namaKantor || "LEMBAGA PENDIDIKAN MA'ARIF NU"}</h2>
          <h3>${kopSurat.namaMadrasah || 'MADRASAH IBTIDAIYAH BERBASIS CINTA'}</h3>
          <p>${kopSurat.alamatMadrasah || ''} | ${kopSurat.kontakMadrasah || ''}</p>
        </div>

        <div class="title">LEGER REKAPITULASI HASIL KUIS SISWA - ${kelasName.toUpperCase()}</div>
        <p style="font-size: 9pt; color: #475569; margin: 0 0 10px;">
          Tahun Pelajaran: 2025/2026 | Kurikulum Berbasis Cinta (KBC) | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}
        </p>

        <table>
          <thead>
            <tr>
              <th class="center" style="width: 30px;">No</th>
              <th style="width: 80px;">NISN</th>
              <th>Nama Peserta Didik</th>
              <th>Mata Pelajaran</th>
              <th>Judul Modul / Materi</th>
              <th class="center" style="width: 60px;">Skor</th>
              <th class="center" style="width: 50px;">Nilai</th>
              <th class="center" style="width: 90px;">Ketuntasan</th>
              <th>Guru Pengampu</th>
            </tr>
          </thead>
          <tbody>
            ${classResults.map((r, idx) => `
              <tr>
                <td class="center">${idx + 1}</td>
                <td>${r.nisn || '-'}</td>
                <td><strong>${r.studentName}</strong></td>
                <td>${r.mataPelajaran}</td>
                <td>${r.modulJudul}</td>
                <td class="center">${r.skor} / ${r.totalSoal}</td>
                <td class="center nilai-bold">${r.nilai}</td>
                <td class="center">${r.nilai >= 75 ? '<span style="color:#16a34a;font-weight:bold;">Tuntas</span>' : '<span style="color:#dc2626;font-weight:bold;">Remedial</span>'}</td>
                <td>${r.guruPengampu || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="ttd-box">
          <div class="ttd-col">
            <p>Mengetahui,</p>
            <p>Kepala Madrasah</p>
            <div class="ttd-space"></div>
            <p><strong>${kopSurat.namaMadrasah ? ttd.kepalaMadrasahNama : 'Siti Rochimah, S.Pd.I.'}</strong></p>
            <p style="font-size: 8pt; color: #64748b;">NIP: ${ttd.kepalaMadrasahNIP || '-'}</p>
          </div>
          <div class="ttd-col">
            <p>${ttd.tempatPenetapan || 'Banyumas'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Guru Kelas / Wali Kelas,</p>
            <div class="ttd-space"></div>
            <p><strong>${userSession?.namaLengkap || ttd.guruKelasNama || 'Guru Kelas'}</strong></p>
            <p style="font-size: 8pt; color: #64748b;">NIP: ${userSession?.nip || ttd.guruKelasNIP || '-'}</p>
          </div>
        </div>

        <script>
          setTimeout(() => { window.print(); }, 400);
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden animate-fadeIn">
      <div className="bg-white sm:rounded-2xl shadow-2xl max-w-6xl w-full h-full sm:h-[92vh] sm:max-h-[96vh] flex flex-col min-h-0 border-0 sm:border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Rekapitulasi Hasil Kuis & Nilai Siswa (KBC)
                </h3>
                {isTeacher ? (
                  <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    👨‍🏫 Akun Guru: {userSession?.namaLengkap}
                  </span>
                ) : (
                  <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    👑 Administrator Madrasah (Semua Rombel)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-100/80 truncate mt-0.5">
                Laporan penilaian kuis interaktif per siswa, per rombel/kelas, dan per mata pelajaran.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 ml-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-emerald-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all text-xs flex items-center space-x-1 cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-emerald-100 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtab Navigation Tabs (Fixed at top) */}
        <div className="bg-slate-100 px-3 sm:px-4 pt-2 border-b border-slate-200 flex items-center space-x-1.5 sm:space-x-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('per_siswa')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-t-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border-t border-x shrink-0 ${
              activeTab === 'per_siswa'
                ? 'bg-white text-emerald-800 border-slate-200 border-b-white font-black shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Hasil Kuis Per Siswa ({filteredResults.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('per_kelas')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-t-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border-t border-x shrink-0 ${
              activeTab === 'per_kelas'
                ? 'bg-white text-emerald-800 border-slate-200 border-b-white font-black shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
            <span>2. Rekap Leger Per Rombel ({Object.keys(groupedByKelas).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('per_mapel')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-t-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border-t border-x shrink-0 ${
              activeTab === 'per_mapel'
                ? 'bg-white text-emerald-800 border-slate-200 border-b-white font-black shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>3. Rekap Per Mapel ({Object.keys(groupedByMapel).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analisis')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-t-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border-t border-x shrink-0 ${
              activeTab === 'analisis'
                ? 'bg-white text-emerald-800 border-slate-200 border-b-white font-black shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>4. Analisis Ketuntasan</span>
          </button>
        </div>

        {/* Modal Body Content (Scrollable - includes Teacher Banner, Stats, Filters, and Table) */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0 bg-slate-50 text-xs overscroll-contain space-y-3">
          {toastMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-3.5 py-2.5 rounded-xl font-bold flex items-center space-x-2 animate-fadeIn shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Teacher Context Banner (Auto-Routing & Switcher) */}
          {isTeacher && (
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shadow-2xs">
              <div className="flex items-center space-x-2 text-emerald-950 font-medium min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                <span className="truncate">
                  <strong>Rombel Diampu:</strong> {userSession?.kelasAmpu?.join(', ') || 'Semua Kelas'} |{' '}
                  <strong>Mapel:</strong> {userSession?.mapelAmpu?.join(', ') || 'Semua Mapel'}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0 bg-white p-1 rounded-lg border border-emerald-200">
                <button
                  type="button"
                  onClick={() => setTeacherScope('my_classes')}
                  className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                    teacherScope === 'my_classes'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  ✓ Rombel & Mapel Saya
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherScope('all')}
                  className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                    teacherScope === 'all'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  Semua Rombel
                </button>
              </div>
            </div>
          )}

          {/* Stats Summary Cards Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">Total Pengerjaan</p>
              <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">{stats.total} <span className="text-[11px] font-normal text-slate-500">Siswa</span></p>
            </div>
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-emerald-200 shadow-2xs">
              <p className="text-[9.5px] uppercase font-bold text-emerald-700 tracking-wider">Rata-Rata Nilai</p>
              <p className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">{stats.avg} <span className="text-[11px] font-normal text-slate-500">/ 100</span></p>
            </div>
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">Tertinggi / Terendah</p>
              <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                <span className="text-emerald-700">{stats.highest}</span> / <span className="text-rose-600">{stats.lowest}</span>
              </p>
            </div>
            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">Ketuntasan (KKTP ≥75)</p>
              <p className="text-sm sm:text-base font-black text-emerald-800 mt-0.5">
                {stats.tuntasPercent}% <span className="text-[11px] font-semibold text-slate-500">({stats.tuntasCount}/{stats.total})</span>
              </p>
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa, NISN, atau judul modul materi..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Ekspor Seluruh Rekap ke File CSV / Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {/* Filter Kelas */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Kelas / Rombel:</label>
                <select
                  value={selectedKelas}
                  onChange={e => setSelectedKelas(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="semua">Semua Rombel</option>
                  {availableKelasOptions.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {/* Filter Mapel */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Mata Pelajaran:</label>
                <select
                  value={selectedMapel}
                  onChange={e => setSelectedMapel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="semua">Semua Mapel</option>
                  {availableMapelOptions.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Filter Guru Pengampu */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Guru Pengampu:</label>
                <select
                  value={selectedGuru}
                  onChange={e => setSelectedGuru(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="semua">Semua Guru</option>
                  {availableGuruOptions.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Filter Status Ketuntasan */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Ketuntasan (KKTP):</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="semua">Semua Status</option>
                  <option value="tuntas">✓ Tuntas (≥ 75)</option>
                  <option value="remedial">✗ Perlu Remedial (&lt; 75)</option>
                </select>
              </div>
            </div>
          </div>
          {/* TAB 1: HASIL KUIS PER SISWA */}
          {activeTab === 'per_siswa' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {filteredResults.length === 0 ? (
                <div className="text-center py-10 sm:py-14 px-4 space-y-3">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                    <Award className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <p className="text-sm font-bold text-slate-800">Belum Ada Data Hasil Kuis yang Cocok</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Siswa yang mengerjakan kuis pada modul atau link kuis interaktif akan otomatis tercatat dan terekap di sini. Gunakan filter di atas untuk melihat data lainnya.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile Card View (sm:hidden) */}
                  <div className="sm:hidden divide-y divide-slate-100 p-2 space-y-2.5">
                    {filteredResults.map((r, idx) => {
                      const grade = getGradeInfo(r.nilai);
                      const dateFormatted = new Date(r.tanggal).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div key={r.id} className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <h4 className="font-extrabold text-slate-900 text-xs truncate">{r.studentName}</h4>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 ml-6">
                                {r.nisn ? `NISN: ${r.nisn} • ` : ''}Rombel: <strong>{r.kelas || '-'}</strong>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-black text-sm text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-lg">
                                {r.nilai}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] space-y-1">
                            <p className="text-slate-700 font-medium truncate">
                              <strong className="text-teal-800">{r.mataPelajaran}:</strong> {r.modulJudul}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
                              <span>Skor: <strong>{r.skor}/{r.totalSoal}</strong></span>
                              <span className={`px-2 py-0.5 rounded-full font-bold border ${grade.color}`}>
                                {grade.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400 font-mono">{dateFormatted}</span>
                            <div className="flex items-center space-x-1.5">
                              {r.detailJawaban && r.detailJawaban.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailResult(r)}
                                  className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg border border-sky-200 font-bold text-[10.5px] flex items-center space-x-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Lembar</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handlePrintStudentReport(r)}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 font-bold text-[10.5px] flex items-center space-x-1 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Cetak</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteResult(r.id)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View (hidden sm:block) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3.5 text-center" style={{ width: '40px' }}>No</th>
                          <th className="py-3 px-3.5">Waktu Pengerjaan</th>
                          <th className="py-3 px-3.5">Nama Peserta Didik</th>
                          <th className="py-3 px-3.5">Kelas / Rombel</th>
                          <th className="py-3 px-3.5">Mata Pelajaran</th>
                          <th className="py-3 px-3.5">Modul / Materi</th>
                          <th className="py-3 px-3.5 text-center">Skor</th>
                          <th className="py-3 px-3.5 text-center">Nilai</th>
                          <th className="py-3 px-3.5 text-center">Kualifikasi</th>
                          <th className="py-3 px-3.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredResults.map((r, idx) => {
                          const grade = getGradeInfo(r.nilai);
                          const dateFormatted = new Date(r.tanggal).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-3.5 text-center text-slate-500">{idx + 1}</td>
                              <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">{dateFormatted}</td>
                              <td className="py-3 px-3.5">
                                <p className="font-extrabold text-slate-900">{r.studentName}</p>
                                {r.nisn && <p className="text-[10px] text-slate-400 font-mono">NISN: {r.nisn}</p>}
                              </td>
                              <td className="py-3 px-3.5 text-slate-700 font-semibold">{r.kelas || '-'}</td>
                              <td className="py-3 px-3.5">
                                <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80 text-[10.5px]">
                                  {r.mataPelajaran}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 max-w-[200px] truncate text-slate-700 font-medium" title={r.modulJudul}>
                                {r.modulJudul}
                              </td>
                              <td className="py-3 px-3.5 text-center font-bold text-slate-700 font-mono">
                                {r.skor} / {r.totalSoal}
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                <span className="font-black text-sm text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg">
                                  {r.nilai}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${grade.color}`}>
                                  {grade.label}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  {r.detailJawaban && r.detailJawaban.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDetailResult(r)}
                                      className="p-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg border border-sky-200 transition-all cursor-pointer"
                                      title="Lihat Lembar Jawaban Siswa"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handlePrintStudentReport(r)}
                                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                                    title="Cetak Laporan Rapor Kuis Siswa"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteResult(r.id)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                    title="Hapus Data Ini"
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
                </>
              )}
            </div>
          )}

          {/* TAB 2: REKAP LEGER PER KELAS / ROMBEL */}
          {activeTab === 'per_kelas' && (
            <div className="space-y-4">
              {Object.keys(groupedByKelas).length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
                  <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Belum ada data pengerjaan per kelas.</p>
                </div>
              ) : (
                (Object.entries(groupedByKelas) as [string, StudentQuizResult[]][]).map(([kelasName, classResults]) => {
                  const total = classResults.length;
                  const avg = Math.round(classResults.reduce((acc, c) => acc + c.nilai, 0) / total);
                  const tuntas = classResults.filter(c => c.nilai >= 75).length;
                  const tuntasPercent = Math.round((tuntas / total) * 100);

                  return (
                    <div key={kelasName} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
                      {/* Class Header */}
                      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-3.5 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <GraduationCap className="w-5 h-5 text-amber-300 shrink-0" />
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-wide">{kelasName}</h4>
                            <p className="text-[11px] text-teal-100">
                              {total} Pengerjaan Kuis • Rata-rata Nilai: <strong>{avg}</strong> • Ketuntasan: <strong>{tuntasPercent}%</strong>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePrintClassLeger(kelasName, classResults)}
                          className="bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Cetak Leger Nilai {kelasName}</span>
                        </button>
                      </div>

                      {/* Class Results Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 text-center" style={{ width: '40px' }}>No</th>
                              <th className="py-2.5 px-3">Nama Siswa</th>
                              <th className="py-2.5 px-3">NISN</th>
                              <th className="py-2.5 px-3">Mata Pelajaran</th>
                              <th className="py-2.5 px-3">Modul Materi</th>
                              <th className="py-2.5 px-3 text-center">Nilai</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                              <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {classResults.map((r, idx) => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">{r.studentName}</td>
                                <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{r.nisn || '-'}</td>
                                <td className="py-2.5 px-3 font-semibold text-emerald-800">{r.mataPelajaran}</td>
                                <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">{r.modulJudul}</td>
                                <td className="py-2.5 px-3 text-center font-black text-emerald-700">{r.nilai}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                                    r.nilai >= 75 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                                  }`}>
                                    {r.nilai >= 75 ? 'Tuntas' : 'Remedial'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handlePrintStudentReport(r)}
                                    className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                                    title="Cetak Rapor Siswa"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: REKAP PER MATA PELAJARAN */}
          {activeTab === 'per_mapel' && (
            <div className="space-y-4">
              {Object.keys(groupedByMapel).length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Belum ada data pengerjaan per mata pelajaran.</p>
                </div>
              ) : (
                (Object.entries(groupedByMapel) as [string, StudentQuizResult[]][]).map(([mapelName, mapelResults]) => {
                  const total = mapelResults.length;
                  const avg = Math.round(mapelResults.reduce((acc, m) => acc + m.nilai, 0) / total);
                  const tuntas = mapelResults.filter(m => m.nilai >= 75).length;
                  const tuntasPercent = Math.round((tuntas / total) * 100);

                  return (
                    <div key={mapelName} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
                      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-3.5 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <BookOpen className="w-5 h-5 text-amber-300 shrink-0" />
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-wide">{mapelName}</h4>
                            <p className="text-[11px] text-emerald-100">
                              {total} Pengerjaan Kuis • Rata-rata Mapel: <strong>{avg}</strong> • Ketuntasan: <strong>{tuntasPercent}%</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 text-center" style={{ width: '40px' }}>No</th>
                              <th className="py-2.5 px-3">Nama Siswa</th>
                              <th className="py-2.5 px-3">Kelas / Rombel</th>
                              <th className="py-2.5 px-3">Materi Modul</th>
                              <th className="py-2.5 px-3 text-center">Nilai</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                              <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {mapelResults.map((r, idx) => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">{r.studentName}</td>
                                <td className="py-2.5 px-3 text-slate-700">{r.kelas || '-'}</td>
                                <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">{r.modulJudul}</td>
                                <td className="py-2.5 px-3 text-center font-black text-emerald-700">{r.nilai}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                                    r.nilai >= 75 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                                  }`}>
                                    {r.nilai >= 75 ? 'Tuntas' : 'Remedial'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handlePrintStudentReport(r)}
                                    className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                                    title="Cetak Laporan Kuis Siswa"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: ANALISIS & DISTRIBUSI NILAI */}
          {activeTab === 'analisis' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Distribusi Kategori Nilai Siswa (KBC)</span>
                </h4>

                {filteredResults.length === 0 ? (
                  <p className="text-xs text-slate-500">Belum ada data nilai untuk dianalisis.</p>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const sangatBaik = filteredResults.filter(r => r.nilai >= 85).length;
                      const baik = filteredResults.filter(r => r.nilai >= 75 && r.nilai < 85).length;
                      const cukup = filteredResults.filter(r => r.nilai >= 60 && r.nilai < 75).length;
                      const remedial = filteredResults.filter(r => r.nilai < 60).length;
                      const total = filteredResults.length;

                      const categories = [
                        { label: 'Sangat Baik (Nilai 85 - 100)', count: sangatBaik, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                        { label: 'Baik - Tuntas (Nilai 75 - 84)', count: baik, color: 'bg-teal-500', textColor: 'text-teal-700' },
                        { label: 'Cukup (Nilai 60 - 74)', count: cukup, color: 'bg-amber-500', textColor: 'text-amber-700' },
                        { label: 'Perlu Bimbingan / Remedial (Nilai < 60)', count: remedial, color: 'bg-rose-500', textColor: 'text-rose-700' }
                      ];

                      return categories.map((cat, idx) => {
                        const pct = Math.round((cat.count / total) * 100) || 0;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-bold ${cat.textColor}`}>{cat.label}</span>
                              <span className="font-extrabold text-slate-800">{cat.count} Siswa ({pct}%)</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full ${cat.color} transition-all duration-500 rounded-full`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1 mt-4">
                  <p className="font-bold flex items-center space-x-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Rekomendasi Tindak Lanjut Berbasis Cinta (KBC):</span>
                  </p>
                  <p className="leading-relaxed text-[11px] text-slate-700 pl-5">
                    1. <strong>Pengayaan:</strong> Siswa dengan predikat Sangat Baik diberikan tantangan materi literasi lanjutan dan dijadikan tutor sebaya dengan prinsip kasih sayang.
                    <br />
                    2. <strong>Remedial Penuh Kasih:</strong> Siswa yang belum tuntas diberikan bimbingan ulang dengan metode flashcard dan penguatan konsep interaktif tanpa membebani mental anak.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-medium hidden sm:inline">
            💡 Data hasil kuis tersinkronisasi otomatis secara berkala ke database cloud madrasah.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer ml-auto"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>

      {/* MODAL DETAIL LEMBAR JAWABAN SISWA */}
      {selectedDetailResult && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col h-[85vh] max-h-[90vh] min-h-0">
            <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <h4 className="font-black text-sm truncate">Lembar Jawaban Siswa: {selectedDetailResult.studentName}</h4>
                <p className="text-[11px] text-teal-100 truncate">
                  Modul: {selectedDetailResult.modulJudul} | Nilai: <strong className="text-amber-300">{selectedDetailResult.nilai}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedDetailResult(null)}
                className="text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-3 text-xs bg-slate-50 overscroll-contain">
              {selectedDetailResult.detailJawaban?.map((d, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 leading-snug">
                      Soal #{idx + 1}: {d.pertanyaan}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                      d.isBenar ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {d.isBenar ? '✓ Benar' : '✗ Salah'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className={`p-2 rounded-lg border ${
                      d.isBenar ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' : 'bg-rose-50/50 border-rose-200 text-rose-950'
                    }`}>
                      <p className="font-bold text-[10px] uppercase text-slate-500 mb-0.5">Jawaban Siswa:</p>
                      <p className="font-semibold">{d.pilihan?.[d.jawabanSiswaIndex] || `Pilihan ${d.jawabanSiswaIndex + 1}`}</p>
                    </div>
                    <div className="p-2 rounded-lg border bg-emerald-50 border-emerald-300 text-emerald-950">
                      <p className="font-bold text-[10px] uppercase text-emerald-800 mb-0.5">Kunci Jawaban Benar:</p>
                      <p className="font-semibold">{d.pilihan?.[d.kunciJawabanIndex] || `Pilihan ${d.kunciJawabanIndex + 1}`}</p>
                    </div>
                  </div>

                  {d.penjelasanKbc && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-bold text-emerald-800">💡 Penjelasan KBC:</span> {d.penjelasanKbc}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white p-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetailResult(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-1.5 rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
