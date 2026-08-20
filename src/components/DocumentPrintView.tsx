import React, { useState } from 'react';
import { ModulAjarCinta } from '../types';
import { Printer, ArrowLeft, Download, Heart, CheckCircle, Sparkles, Save, Check, Lock, Unlock, ShieldAlert, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { getEducationalSvgIllustration, handleImageError, getReliableImageUrl } from '../utils/imageHelper';
import { loadDocumentProtectionConfig, verifyDocumentProtectionPassword, isDocumentUnlockedInSession, setDocumentUnlockedInSession } from '../utils/storage';
import { loadUserSession } from '../utils/auth';

interface DocumentPrintViewProps {
  modul: ModulAjarCinta;
  onClose: () => void;
  onEdit?: () => void;
  onSaveModule?: (modul: ModulAjarCinta) => void;
  canEdit?: boolean;
}

export const DocumentPrintView: React.FC<DocumentPrintViewProps> = ({ modul, onClose, onEdit, onSaveModule, canEdit = true }) => {
  const userSession = loadUserSession();
  const isStaff = !!userSession && (userSession.role === 'admin' || userSession.role === 'superadmin' || userSession.role === 'guru');
  const docProtection = loadDocumentProtectionConfig();
  const isProtectionActive = docProtection.enabled && !!docProtection.password?.trim();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (isStaff) return true;
    if (!isProtectionActive) return true;
    return isDocumentUnlockedInSession();
  });

  const [inputPassword, setInputPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) {
      setUnlockError('Silakan masukkan kata sandi dokumen.');
      return;
    }

    if (verifyDocumentProtectionPassword(inputPassword)) {
      setUnlockError(null);
      setDocumentUnlockedInSession(true);
      setIsUnlocked(true);
    } else {
      setUnlockError('Kata sandi dokumen salah! Silakan minta kata sandi resmi kepada Administrator atau Guru Madrasah.');
    }
  };

  const [savedStatus, setSavedStatus] = useState<boolean>(true);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [isJustSaved, setIsJustSaved] = useState<boolean>(false);

  const handleManualSave = () => {
    if (onSaveModule) {
      onSaveModule(modul);
    }
    setSavedStatus(true);
    setShowSaveToast(true);
    setIsJustSaved(true);
    setTimeout(() => {
      setShowSaveToast(false);
      setIsJustSaved(false);
    }, 2500);
  };
  const handlePrint = () => {
    const printElement = document.getElementById('document-to-print');
    if (!printElement) {
      window.print();
      return;
    }

    try {
      let iframe = document.getElementById('print-frame') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        window.print();
        return;
      }

      const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');

      const safeMapel = modul?.identitas?.mataPelajaran || 'MI';
      const safeMateri = modul?.identitas?.materi || 'Modul';

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Modul Ajar KBC - ${safeMapel} - ${safeMateri}</title>
          ${headStyles}
          <style>
            @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              overflow: visible !important;
            }
            .printable-document {
              max-width: 100% !important;
              width: 100% !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print, button, .print\\:hidden {
              display: none !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="printable-document">
            ${printElement.outerHTML}
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print failed, fallback window.print()', err);
          window.print();
        }
      }, 300);
    } catch (e) {
      console.warn('Direct print failed, opening print tab:', e);
      handleOpenPrintTab();
    }
  };

  const handleOpenPrintTab = () => {
    const printElement = document.getElementById('document-to-print');
    if (!printElement) return;

    const safeMapel = modul?.identitas?.mataPelajaran || 'MI';
    const safeMateri = modul?.identitas?.materi || 'Modul';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback if popup blocked
      handlePrint();
      return;
    }

    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Modul Ajar KBC - ${safeMapel} - ${safeMateri}</title>
        ${headStyles}
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: ui-sans-serif, system-ui, sans-serif, BlinkMacSystemFont; background: #ffffff; color: #000000; padding: 20px; margin: 0; }
          .border-double { border-style: double; }
          .no-print { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 18px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .btn-print { background: #059669; color: white; border: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; }
          .btn-print:hover { background: #047857; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0 !important; background: white !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <span style="font-weight: bold; font-size: 14px; color: #0f172a;">Dokumen Resmi Modul Ajar KBC</span>
          <button onclick="window.print()" class="btn-print">
            🖨️ Cetak / Simpan PDF
          </button>
        </div>
        ${printElement.outerHTML}
        <script>
          setTimeout(() => {
            window.print();
          }, 600);
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadHtml = () => {
    const printElement = document.getElementById('document-to-print');
    if (!printElement) return;

    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const fullDoc = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Modul Ajar KBC - ${modul?.identitas?.mataPelajaran || 'MI'}</title>
        ${headStyles}
      </head>
      <body class="p-8 bg-white text-black">
        ${printElement.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeMapel = (modul?.identitas?.mataPelajaran || 'Mapel').replace(/\s+/g, '_');
    const safeMateri = (modul?.identitas?.materi || 'Materi').replace(/\s+/g, '_');
    link.download = `Modul_KBC_${safeMapel}_${safeMateri}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const identitas = modul?.identitas || {} as any;
  const identifikasi = modul?.identifikasi || {} as any;
  const kesiapanMurid = identifikasi.kesiapanMurid || {};
  const desainPembelajaran = modul?.desainPembelajaran || {} as any;
  const kerangkaPembelajaran = modul?.kerangkaPembelajaran || {} as any;
  const pengalamanBelajar = modul?.pengalamanBelajar || {} as any;
  const assesmen = modul?.assesmen || {} as any;
  const lkpd = assesmen.lkpd || {};
  const kopSurat = modul?.kopSurat || {} as any;
  const ttd = modul?.ttd || {} as any;

  // Helper untuk memformat tanggal ke format formal Bahasa Indonesia (contoh: 19 Agustus 2026)
  const formatIndonesianDate = (dateInput?: string | number | Date): string => {
    if (!dateInput) return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return String(dateInput);
    }
  };

  // State mode tanggal cetak (otomatis vs manual)
  const autoCreatedDate = React.useMemo(() => {
    return formatIndonesianDate(modul?.createdAt || modul?.identitas?.tanggalPelaksanaan || new Date());
  }, [modul?.createdAt, modul?.identitas?.tanggalPelaksanaan]);

  const [tanggalMode, setTanggalMode] = useState<'otomatis' | 'manual'>(() => {
    return ttd?.tanggalMode === 'manual' ? 'manual' : 'otomatis';
  });
  const [manualDateValue, setManualDateValue] = useState<string>(() => {
    return ttd?.tanggalPenetapanManual || ttd?.tanggalPenetapan || '24 Juli 2026';
  });

  const effectiveTanggalPenetapan = tanggalMode === 'otomatis' ? autoCreatedDate : (manualDateValue || autoCreatedDate);

  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[90] overflow-y-auto flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 text-white p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
              <Lock className="w-7 h-7 text-amber-300" />
            </div>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-300/30 uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3 h-3" />
              <span>Dokumen Resmi Terproteksi</span>
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              Kata Sandi Diperlukan
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-xs mx-auto line-clamp-2">
              {modul?.identitas?.mataPelajaran || 'Modul Pembelajaran'} - {modul?.identitas?.materi || 'KBC'}
            </p>
          </div>

          {/* Body Form */}
          <form onSubmit={handleUnlockSubmit} className="p-6 space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-600 leading-relaxed">
              <p className="font-medium">
                {docProtection.customMessage || 'Dokumen ini diproteksi oleh Madrasah. Silakan masukkan kata sandi resmi untuk membuka tampilan dan mencetak dokumen.'}
              </p>
            </div>

            {unlockError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-start space-x-2 animate-shake">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{unlockError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Masukkan Kata Sandi Dokumen
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    if (unlockError) setUnlockError(null);
                  }}
                  placeholder="Ketik kata sandi cetak..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Batal</span>
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.98] cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-emerald-200" />
                <span>Buka & Cetak Dokumen</span>
              </button>
            </div>

            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-[10px] text-slate-400">
                🔒 Hubungi Guru Pengajar atau Administrator madrasah untuk memperoleh kata sandi dokumen.
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80] overflow-y-auto flex flex-col items-center p-0 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
      {/* Top Action Bar (Hidden during print) */}
      <div className="w-full max-w-4xl bg-white border border-slate-200 p-3 sm:p-3.5 rounded-t-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs sticky top-0 z-[80] shadow-md print:hidden text-slate-800">
        <button
          onClick={onClose}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 font-bold transition-all border border-slate-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        {/* Kontrol Tanggal Cetak Dokumen: Otomatis vs Manual */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-extrabold text-slate-700 px-1">Tanggal Cetak:</span>
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-300 shadow-2xs">
            <button
              type="button"
              onClick={() => setTanggalMode('otomatis')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                tanggalMode === 'otomatis'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Otomatis menyesuaikan saat dokumen modul dibuat"
            >
              📅 Otomatis
            </button>
            <button
              type="button"
              onClick={() => setTanggalMode('manual')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                tanggalMode === 'manual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ketik tanggal kustom manual"
            >
              ✏️ Manual
            </button>
          </div>

          {tanggalMode === 'otomatis' ? (
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {autoCreatedDate}
            </span>
          ) : (
            <input
              type="text"
              value={manualDateValue}
              onChange={(e) => setManualDateValue(e.target.value)}
              placeholder="misal: 24 Juli 2026"
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 w-36"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleManualSave}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
              isJustSaved
                ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-105'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 shadow-emerald-600/20'
            }`}
            title="Simpan Modul Ajar ke Database"
          >
            {isJustSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>✓ Modul Berhasil Disimpan!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Modul</span>
              </>
            )}
          </button>
          {canEdit && onEdit && (
            <button
              onClick={onEdit}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-semibold transition-all border border-slate-300"
            >
              Edit Modul
            </button>
          )}
          <button
            onClick={handleDownloadHtml}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition-all border border-slate-300"
            title="Unduh file HTML dokumen"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Unduh HTML</span>
          </button>
          <button
            onClick={handleOpenPrintTab}
            className="bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 px-3.5 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all shadow-xs"
            title="Buka dokumen di tab terpisah untuk cetak"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Tab Cetak Baru</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-1.5 rounded-xl font-extrabold flex items-center space-x-1.5 transition-all shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Export PDF</span>
          </button>
        </div>
      </div>

      {showSaveToast && (
        <div className="w-full max-w-4xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg print:hidden animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-200" />
            <span>Modul Ajar berhasil disimpan ke database & cloud sync!</span>
          </div>
          <button onClick={() => setShowSaveToast(false)} className="text-emerald-100 hover:text-white font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Official Document Sheet */}
      <div id="document-to-print" className="printable-document w-full max-w-4xl bg-white text-slate-900 p-6 sm:p-10 rounded-b-2xl shadow-2xl font-sans print:shadow-none print:rounded-none print:p-6 print:max-w-none text-xs leading-relaxed space-y-6">
        {/* 1. KOP SURAT RESMI */}
        <div className="border-b-4 border-double border-slate-900 pb-3 text-center space-y-1 font-serif">
          <div className="flex items-center justify-between px-2">
            {kopSurat.logoUrl ? (
              <img src={kopSurat.logoUrl} alt="Logo Madrasah" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16"></div>
            )}
            <div className="flex-1 text-center space-y-0.5 px-2">
              <h5 className="font-bold text-xs uppercase tracking-wide text-slate-900">
                {kopSurat.namaKantor || "LEMBAGA PENDIDIKAN MA'ARIF NU BANYUMAS"}
              </h5>
              <h3 className="font-extrabold text-sm uppercase tracking-wide text-emerald-950">
                {kopSurat.namaMadrasah || 'MI MA\'ARIF NU 2 SANGGREMAN'}
              </h3>
              <p className="text-[10px] font-sans text-slate-600 font-normal">
                {kopSurat.alamatMadrasah} {kopSurat.kontakMadrasah ? `| ${kopSurat.kontakMadrasah}` : ''}
              </p>
            </div>
            <div className="w-16"></div>
          </div>
        </div>

        {/* DOCUMENT JUDUL */}
        <div className="text-center space-y-1 pt-1">
          <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wider">
            MODUL AJAR BERBASIS CINTA (KBC)
          </h2>
          <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
            KURIKULUM MERDEKA MADRASAH IBTIDAIYAH (MI)
          </p>
        </div>

        {/* SEKSI 1: IDENTITAS MODUL */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase bg-emerald-900 text-white px-3 py-1 rounded-sm flex items-center space-x-1.5">
            <span>I. SEKSI IDENTITAS MODUL</span>
          </h3>
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/3">Nama Madrasah</td>
                <td className="border border-slate-300 p-2 font-medium">{identitas.namaMadrasah}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Mata Pelajaran</td>
                <td className="border border-slate-300 p-2 font-bold text-emerald-900">{identitas.mataPelajaran}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Materi Utama</td>
                <td className="border border-slate-300 p-2">{identitas.materi}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Fase / Kelas</td>
                <td className="border border-slate-300 p-2">{identitas.faseKelas}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Semester / Alokasi Waktu</td>
                <td className="border border-slate-300 p-2">{identitas.semester} • {identitas.alokasiWaktu}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Tahun Pelajaran</td>
                <td className="border border-slate-300 p-2 font-medium">{identitas.tahunPelajaran || '2025/2026'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Tanggal Pelaksanaan</td>
                <td className="border border-slate-300 p-2 font-semibold text-emerald-900">{identitas.tanggalPelaksanaan || 'Disesuaikan / Terlampir'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SEKSI 2: IDENTIFIKASI */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase bg-emerald-900 text-white px-3 py-1 rounded-sm">
            II. SEKSI IDENTIFIKASI
          </h3>
          <div className="space-y-3 border border-slate-300 p-3.5 rounded-sm bg-white">
            <div>
              <p className="font-bold text-slate-900 text-xs mb-1.5 border-b border-slate-200 pb-1">
                1. Kesiapan Murid (Asesmen Diagnostik Awal & Diferensiasi):
              </p>
              <div className="space-y-2 pl-1">
                <div className="bg-emerald-50/70 border-l-4 border-emerald-600 p-2.5 rounded-r">
                  <p className="font-bold text-emerald-950 text-[11px] mb-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                    Paham Utuh (Kategori Mahir):
                  </p>
                  <p className="text-slate-800 text-[11px] leading-relaxed">
                    {kesiapanMurid?.pahamUtuh || 'Peserta didik memahami materi secara utuh dan siap mengikuti pengayaan/tutor sebaya KBC.'}
                  </p>
                </div>

                <div className="bg-amber-50/70 border-l-4 border-amber-500 p-2.5 rounded-r">
                  <p className="font-bold text-amber-950 text-[11px] mb-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                    Paham Sebagian (Kategori Berkembang):
                  </p>
                  <p className="text-slate-800 text-[11px] leading-relaxed">
                    {kesiapanMurid?.pahamSebagian || 'Peserta didik memahami sebagian konsep dan memerlukan bimbingan terarah.'}
                  </p>
                </div>

                <div className="bg-rose-50/70 border-l-4 border-rose-500 p-2.5 rounded-r">
                  <p className="font-bold text-rose-950 text-[11px] mb-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                    Belum Paham (Kategori Perlu Intervensi):
                  </p>
                  <p className="text-slate-800 text-[11px] leading-relaxed">
                    {kesiapanMurid?.belumPaham || 'Peserta didik memerlukan bimbingan personal intensif dengan alat bantu visual/konkret.'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 text-xs mb-1.5 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>2. Seksi Materi Pelajaran (Uraian Runtut, Detail, & Komprehensif):</span>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  Sub-Bab Terstruktur KBC
                </span>
              </p>
              {(() => {
                const text = identifikasi?.materiPelajaran || identitas?.materi || '-';
                if (!text || text === '-') return <div className="text-slate-500 italic text-[11px] pl-2">-</div>;

                const rawSections = text.split(/(?=\b[1-9]\.\s)/g).map(s => s.trim()).filter(Boolean);
                if (rawSections.length > 1) {
                  return (
                    <div className="space-y-2 mt-1.5 pl-1">
                      {rawSections.map((sec, idx) => {
                        const match = sec.match(/^([1-9]\.\s*[^:\n]+)(?::|\n|\s*)([\s\S]*)$/);
                        let title = '';
                        let body = sec;
                        if (match && match[1] && match[2]) {
                          title = match[1].trim();
                          body = match[2].trim();
                        }
                        return (
                          <div key={idx} className="bg-emerald-50/60 border border-emerald-200/90 rounded-md p-2.5 text-[11px] text-slate-800 leading-relaxed shadow-2xs">
                            {title ? (
                              <div>
                                <span className="font-extrabold text-emerald-950 text-xs block mb-1 border-b border-emerald-200/80 pb-0.5 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  <span>{title}</span>
                                </span>
                                <div className="text-slate-800 font-normal whitespace-pre-line leading-relaxed pl-1 pt-0.5">
                                  {body}
                                </div>
                              </div>
                            ) : (
                              <div className="whitespace-pre-line font-medium leading-relaxed">
                                {sec}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="text-slate-800 text-[11px] font-normal whitespace-pre-line leading-relaxed border-l-4 border-emerald-600 bg-emerald-50/40 p-3 rounded shadow-2xs my-1">
                    {text}
                  </div>
                );
              })()}
            </div>

            <div>
              <p className="font-bold text-slate-900 text-xs mb-1.5 border-b border-slate-200 pb-1">
                3. Dimensi Profil Lulusan (Profil Pelajar Pancasila & Rahmatan lil 'Alamin):
              </p>
              <div className="space-y-2 pl-1">
                {Array.isArray(identifikasi?.dimensiProfilLulusan) && identifikasi.dimensiProfilLulusan.length > 0 ? (
                  identifikasi.dimensiProfilLulusan.map((d: string, i: number) => {
                    const parts = d.split(':');
                    const title = parts[0]?.trim() || '';
                    const desc = parts.slice(1).join(':').trim();
                    return (
                      <div key={i} className="bg-emerald-50/80 border border-emerald-200/90 p-2.5 rounded-lg text-[11px] text-emerald-950 leading-relaxed space-y-1">
                        <div className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                          <span>{title}</span>
                        </div>
                        {desc ? (
                          <p className="text-slate-800 text-[11px] font-normal leading-relaxed pl-3.5 border-l-2 border-emerald-300 ml-1 mt-0.5">
                            {desc}
                          </p>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-slate-500 italic text-[11px] pl-2">- Belum ditentukan</span>
                )}
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 text-xs mb-1.5 border-b border-slate-200 pb-1">
                4. Topik Panca Cinta (Pilar Kurikulum Berbasis Cinta - KBC):
              </p>
              <div className="space-y-2 pl-1">
                {Array.isArray(identifikasi?.topikPancaCinta) && identifikasi.topikPancaCinta.length > 0 ? (
                  identifikasi.topikPancaCinta.map((tc: string, i: number) => {
                    const parts = tc.split(':');
                    const title = parts[0]?.trim() || '';
                    const desc = parts.slice(1).join(':').trim();
                    return (
                      <div key={i} className="bg-rose-50/80 border border-rose-200/90 p-2.5 rounded-lg text-[11px] text-rose-950 leading-relaxed space-y-1">
                        <div className="font-extrabold text-rose-900 text-xs flex items-center gap-1.5">
                          <span className="text-rose-600 font-bold shrink-0">♥</span>
                          <span>{title}</span>
                        </div>
                        {desc ? (
                          <p className="text-slate-800 text-[11px] font-normal leading-relaxed pl-3.5 border-l-2 border-rose-300 ml-1 mt-0.5">
                            {desc}
                          </p>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-slate-500 italic text-[11px] pl-2">- Belum ditentukan</span>
                )}
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 text-xs mb-1">
                5. Materi Integrasi KBC (Kurikulum Berbasis Cinta):
              </p>
              <p className="text-slate-800 text-[11px] leading-relaxed bg-emerald-50/50 p-2.5 rounded border border-emerald-200/60 font-medium italic">
                "{identifikasi?.materiIntegrasiKBC || 'Mengintegrasikan nilai-nilai KBC dalam materi.'}"
              </p>
            </div>
          </div>
        </div>

        {/* SEKSI 3: DESAIN PEMBELAJARAN */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase bg-emerald-900 text-white px-3 py-1 rounded-sm">
            III. SEKSI DESAIN PEMBELAJARAN
          </h3>
          <div className="border border-slate-300 p-3.5 rounded-sm space-y-3 bg-white">
            <div>
              <p className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 mb-1">
                1. Capaian Pembelajaran (CP):
              </p>
              <p className="text-slate-800 text-[11px] leading-relaxed pl-1">
                {desainPembelajaran?.capaianPembelajaran || '-'}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 mb-1">
                2. Lintas Disiplin Ilmu (Keterkaitan Antar Mata Pelajaran):
              </p>
              <p className="text-slate-800 text-[11px] leading-relaxed pl-1">
                {desainPembelajaran?.lintasDisiplinIlmu || '-'}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1 mb-1.5">
                3. Tujuan Pembelajaran (TP & ATP Berbasis Cinta):
              </p>
              <div className="space-y-1.5 pl-1">
                {(Array.isArray(desainPembelajaran?.tujuanPembelajaran) ? desainPembelajaran.tujuanPembelajaran : []).map((tp: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-2 rounded text-[11px] text-slate-800 leading-relaxed">
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                      TP {idx + 1}
                    </span>
                    <span className="flex-1">{tp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEKSI 4: KERANGKA PEMBELAJARAN */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase bg-emerald-900 text-white px-3 py-1 rounded-sm">
            IV. SEKSI KERANGKA PEMBELAJARAN
          </h3>
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/3">Praktek Pedagogik</td>
                <td className="border border-slate-300 p-2 text-[11px]">{kerangkaPembelajaran?.praktekPedagogik || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Kemitraan Pembelajaran</td>
                <td className="border border-slate-300 p-2 text-[11px]">{kerangkaPembelajaran?.kemitraanPembelajaran || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Lingkungan Pembelajaran</td>
                <td className="border border-slate-300 p-2 text-[11px]">{kerangkaPembelajaran?.lingkunganPembelajaran || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Pemanfaatan Digital</td>
                <td className="border border-slate-300 p-2 text-[11px]">{kerangkaPembelajaran?.pemanfaatanDigital || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SEKSI 5: PENGALAMAN BELAJAR */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase bg-emerald-900 text-white px-3 py-1 rounded-sm">
            V. SEKSI PENGALAMAN BELAJAR (LANGKAH-LANGKAH PEMBELAJARAN RUNTUT & DETAIL)
          </h3>
          <div className="space-y-3">
            <div className="border border-slate-300 rounded-sm overflow-hidden bg-white">
              <div className="bg-emerald-900 text-white font-bold px-3 py-1.5 flex items-center justify-between text-[11px]">
                <span>1. KEGIATAN AWAL (ORIENTASI PENUH CINTA & APERSEPSI)</span>
                <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded text-[10px] font-mono">Durasi: {pengalamanBelajar?.kegiatanAwal?.durasi || '10 Menit'}</span>
              </div>
              <ul className="divide-y divide-slate-100 p-2 text-[11px] text-slate-800 space-y-1">
                {(Array.isArray(pengalamanBelajar?.kegiatanAwal?.kegiatan) ? pengalamanBelajar.kegiatanAwal.kegiatan : []).map((k: string, i: number) => (
                  <li key={i} className="py-1.5 px-2 flex items-start gap-2 leading-relaxed">
                    <span className="font-bold text-emerald-700 text-xs min-w-[18px]">1.{i + 1}</span>
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-300 rounded-sm overflow-hidden bg-white">
              <div className="bg-emerald-900 text-white font-bold px-3 py-1.5 flex items-center justify-between text-[11px]">
                <span>2. KEGIATAN INTI (EKSPLORASI, LITERASI & ELABORASI NILAI CINTA)</span>
                <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded text-[10px] font-mono">Durasi: {pengalamanBelajar?.kegiatanInti?.durasi || '50 Menit'}</span>
              </div>
              <ul className="divide-y divide-slate-100 p-2 text-[11px] text-slate-800 space-y-1">
                {(Array.isArray(pengalamanBelajar?.kegiatanInti?.kegiatan) ? pengalamanBelajar.kegiatanInti.kegiatan : []).map((k: string, i: number) => (
                  <li key={i} className="py-1.5 px-2 flex items-start gap-2 leading-relaxed">
                    <span className="font-bold text-emerald-700 text-xs min-w-[18px]">2.{i + 1}</span>
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-300 rounded-sm overflow-hidden bg-white">
              <div className="bg-emerald-900 text-white font-bold px-3 py-1.5 flex items-center justify-between text-[11px]">
                <span>3. MENGAPLIKASI (PRAKTIK NYATA AKSI KASIH SAYANG & PEMBIASAAN)</span>
                <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded text-[10px] font-mono">Durasi: {pengalamanBelajar?.mengaplikasi?.durasi || '15 Menit'}</span>
              </div>
              <ul className="divide-y divide-slate-100 p-2 text-[11px] text-slate-800 space-y-1">
                {(Array.isArray(pengalamanBelajar?.mengaplikasi?.kegiatan) ? pengalamanBelajar.mengaplikasi.kegiatan : []).map((k: string, i: number) => (
                  <li key={i} className="py-1.5 px-2 flex items-start gap-2 leading-relaxed">
                    <span className="font-bold text-emerald-700 text-xs min-w-[18px]">3.{i + 1}</span>
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-300 rounded-sm overflow-hidden bg-white">
              <div className="bg-emerald-900 text-white font-bold px-3 py-1.5 flex items-center justify-between text-[11px]">
                <span>4. MEREFLEKSI (REFLEKSI HATI, KONTEMPLASI & RASA SYUKUR)</span>
                <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded text-[10px] font-mono">Durasi: {pengalamanBelajar?.merefleksi?.durasi || '10 Menit'}</span>
              </div>
              <ul className="divide-y divide-slate-100 p-2 text-[11px] text-slate-800 space-y-1">
                {(Array.isArray(pengalamanBelajar?.merefleksi?.kegiatan) ? pengalamanBelajar.merefleksi.kegiatan : []).map((k: string, i: number) => (
                  <li key={i} className="py-1.5 px-2 flex items-start gap-2 leading-relaxed">
                    <span className="font-bold text-emerald-700 text-xs min-w-[18px]">4.{i + 1}</span>
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-300 rounded-sm overflow-hidden bg-white">
              <div className="bg-emerald-900 text-white font-bold px-3 py-1.5 flex items-center justify-between text-[11px]">
                <span>5. PENUTUP (RANGKUMAN, APRESIASI & SALAM KASIH)</span>
                <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded text-[10px] font-mono">Durasi: {pengalamanBelajar?.penutup?.durasi || '5 Menit'}</span>
              </div>
              <ul className="divide-y divide-slate-100 p-2 text-[11px] text-slate-800 space-y-1">
                {(Array.isArray(pengalamanBelajar?.penutup?.kegiatan) ? pengalamanBelajar.penutup.kegiatan : []).map((k: string, i: number) => (
                  <li key={i} className="py-1.5 px-2 flex items-start gap-2 leading-relaxed">
                    <span className="font-bold text-emerald-700 text-xs min-w-[18px]">5.{i + 1}</span>
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* SEKSI 6: ASSESMEN & LKPD */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase bg-emerald-900 text-white px-3 py-1 rounded-sm">
            VI. SEKSI ASESMEN & LEMBAR KERJA PESERTA DIDIK (LKPD)
          </h3>
          <div className="border border-slate-300 p-3 rounded-sm space-y-3">
            <div>
              <p className="font-bold text-slate-800">Teknik & Rubrik Asesmen:</p>
              <p className="text-slate-700 text-[11px]"><span className="font-semibold">Teknik:</span> {assesmen?.teknikAssesmen || '-'}</p>
              <p className="text-slate-700 text-[11px]"><span className="font-semibold">Rubrik Sikap Cinta:</span> {assesmen?.rubrikAssesmenSikapCinta || '-'}</p>
              <p className="text-slate-700 text-[11px]"><span className="font-semibold">Instrumen:</span> {assesmen?.instrumenPenilaian || '-'}</p>
            </div>

            {/* LKPD Box */}
            <div className="bg-slate-50 border border-slate-300 p-3 rounded space-y-2">
              <h4 className="font-bold text-xs text-emerald-900 uppercase border-b border-slate-300 pb-1">
                {lkpd?.judulLkpd || 'Lembar Kerja Peserta Didik'}
              </h4>
              <p className="text-[11px] text-slate-700 font-medium">Petunjuk: {lkpd?.petunjuk || '-'}</p>
              <div>
                <p className="font-semibold text-slate-800 text-[11px]">Tugas & Aktivitas Murid:</p>
                <ol className="list-decimal list-inside text-[11px] text-slate-700 space-y-0.5 pl-1">
                  {(Array.isArray(lkpd?.tugasAktivitas) ? lkpd.tugasAktivitas : []).map((ta: string, i: number) => (
                    <li key={i}>{ta}</li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-[11px]">Pertanyaan Diskusi:</p>
                <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5 pl-1">
                  {(Array.isArray(lkpd?.pertanyaanDiskusi) ? lkpd.pertanyaanDiskusi : []).map((pd: string, i: number) => (
                    <li key={i}>{pd}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-[11px]">Lembar Refleksi Siswa:</p>
                <p className="text-[11px] text-slate-700 italic border-l-2 border-emerald-600 pl-2 bg-white py-1">
                  "{lkpd?.lembarRefleksiSiswa || '-'}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEKSI 7: MEDIA DIGITAL */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase bg-emerald-900 text-white px-3 py-1 rounded-sm">
            VII. MEDIA DIGITAL (KUIS INTERAKTIF & LITERASI VISUAL)
          </h3>
          <div className="border border-slate-300 p-3 rounded-sm space-y-3">
            {/* Soal Kuis Preview */}
            <div>
              <p className="font-bold text-slate-800 mb-1">Daftar Soal Kuis Interaktif ({(assesmen?.mediaDigital?.soalKuis || []).length} Soal):</p>
              <div className="space-y-2">
                {(assesmen?.mediaDigital?.soalKuis || []).map((q, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-2 rounded text-[11px]">
                    <p className="font-semibold text-slate-900">{idx + 1}. {q.pertanyaan}</p>
                    <div className="grid grid-cols-2 gap-1 mt-1 pl-2">
                      {(q.pilihan || []).map((p, pIdx) => (
                        <span key={pIdx} className={pIdx === q.kunciJawaban ? 'font-bold text-emerald-900' : 'text-slate-600'}>
                          {String.fromCharCode(65 + pIdx)}. {p} {pIdx === q.kunciJawaban ? '✓ (Kunci)' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gambar Interaktif Deskripsi & Visual */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <p className="font-bold text-slate-900 text-xs">Media Gambar & Visual Pembelajaran (Literasi Visual KBC):</p>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  {identitas?.mataPelajaran || 'Madrasah Ibtidaiyah'}
                </span>
              </div>
              <p className="text-[11px] text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900">Uraian Ilustrasi Visual: </span>
                {assesmen?.mediaDigital?.gambarInteraktif?.deskripsiVisual || `Ilustrasi visual pembelajaran KBC mengenai ${identitas?.materi || 'materi'}, menggambarkan suasana hangat murid madrasah belajar dengan empati, keceriaan, dan bimbingan afektif.`}
              </p>
              {(() => {
                const promptFallback = assesmen?.mediaDigital?.gambarInteraktif?.promptGambar || `Vector illustration of Islamic primary school lesson ${identitas?.materi || 'pembelajaran'}, Indonesian students, child friendly`;
                const displayImg = getReliableImageUrl(
                  assesmen?.mediaDigital?.gambarInteraktif?.imageUrl,
                  promptFallback,
                  identitas?.materi,
                  identitas?.mataPelajaran
                );
                const hotspots = (assesmen?.mediaDigital?.gambarInteraktif?.hotspots && assesmen.mediaDigital.gambarInteraktif.hotspots.length > 0)
                  ? assesmen.mediaDigital.gambarInteraktif.hotspots
                  : [
                      { x: 30, y: 40, judul: 'Poin Kebaikan Utuh', penjelasan: `Pemahaman inti materi ${identitas?.materi || 'pembelajaran'} secara komprehensif.` },
                      { x: 70, y: 60, judul: 'Aksi Kasih Sayang', penjelasan: 'Penerapan nyata budaya 5S dan kepekaan empati harian.' }
                    ];

                return (
                  <div className="mt-2 space-y-2.5">
                    <div className="text-center bg-slate-100/70 p-2.5 rounded-xl border border-slate-300 relative">
                      <img
                        src={displayImg}
                        alt={`Visual Pembelajaran ${identitas?.materi || ''}`}
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, identitas?.materi, identitas?.mataPelajaran)}
                        className="max-h-72 w-full object-contain rounded-lg border border-slate-300 mx-auto shadow-xs bg-white"
                      />
                    </div>
                    
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[11px] text-slate-800 space-y-1.5">
                      <p className="font-bold text-emerald-950 text-[11px] flex items-center gap-1.5 border-b border-emerald-200/80 pb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>Detail Poin Informasi Visual (Literasi Gambar & Hotspot Interaktif):</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        {hotspots.map((hs: any, hIdx: number) => (
                          <div key={hIdx} className="bg-white p-2 rounded-lg border border-emerald-200/90 shadow-2xs space-y-0.5">
                            <span className="font-extrabold text-emerald-900 text-xs block">
                              [{hIdx + 1}] {hs.judul}
                            </span>
                            <p className="text-slate-700 text-[11px] leading-relaxed">
                              {hs.penjelasan}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* BLOK PENANDATANGANAN (TTD) */}
        <div className="pt-6 text-xs font-serif">
          <div className="grid grid-cols-2 gap-8 text-center">
            {/* Kolom Kiri: Mengetahui Kepala Madrasah */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="invisible text-[11px] mb-0.5 select-none">-</p>
                <p className="font-semibold text-slate-900">Mengetahui,</p>
                <p className="font-semibold text-slate-900">Kepala {kopSurat?.namaMadrasah ? 'Madrasah' : 'Madrasah'}</p>
              </div>
              <div className="h-20"></div>
              <div>
                <p className="font-bold text-slate-900 underline uppercase">{ttd.kepalaMadrasahNama || 'Siti Rochimah, S.Pd.I.'}</p>
                <p className="text-[10px] text-slate-700">NIP. {ttd.kepalaMadrasahNIP || '-'}</p>
              </div>
            </div>

            {/* Kolom Kanan: Tempat & Tanggal Penetapan (Center menyesuaikan Guru Kelas) */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-slate-800 font-medium mb-0.5 text-center">
                  {ttd.tempatPenetapan || 'Banyumas'}, {effectiveTanggalPenetapan}
                </p>
                <p className="font-semibold text-slate-900">Guru Kelas / Penyusun,</p>
                <p className="font-semibold text-slate-900">{ttd.jabatanGuru || 'Guru Kelas'}</p>
              </div>
              <div className="h-20"></div>
              <div>
                <p className="font-bold text-slate-900 underline uppercase">{ttd.guruKelasNama || 'Jaenal Maskun, S.Pd.I.'}</p>
                <p className="text-[10px] text-slate-700">NIP. {ttd.guruKelasNIP || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
