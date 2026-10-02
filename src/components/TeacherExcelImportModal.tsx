import React, { useState, useRef } from 'react';
import { TeacherItem } from '../types';
import { downloadPtkExcelTemplate, parsePtkExcelBuffer, PTK_EXCEL_COLUMNS } from '../utils/excelPtkUtils';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  X, 
  Eye, 
  EyeOff, 
  Users, 
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Phone,
  Mail,
  Briefcase
} from 'lucide-react';

interface TeacherExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportMerge: (newTeachers: TeacherItem[]) => void;
  onImportReplace: (newTeachers: TeacherItem[]) => void;
  madrasahName: string;
  existingTeachersCount: number;
}

export const TeacherExcelImportModal: React.FC<TeacherExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportMerge,
  onImportReplace,
  madrasahName,
  existingTeachersCount
}) => {
  const [parsedData, setParsedData] = useState<TeacherItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showPins, setShowPins] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setErrorMessage('');
    setIsProcessing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const res = await parsePtkExcelBuffer(buffer);
      if (res.success && res.data.length > 0) {
        setParsedData(res.data);
      } else {
        setErrorMessage(res.error || 'Gagal membaca format Excel.');
        setParsedData([]);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat memproses file.');
      setParsedData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setParsedData([]);
    setFileName('');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                  Impor Massal PTK
                </span>
                <span className="text-xs text-emerald-200/80">16 Kolom Standar Kemenag</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Unggah Data Guru & PTK dari Excel
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Step 1: Download Template Notice */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Format Template Excel Resmi (16 Kolom)</span>
              </div>
              <p className="text-xs text-slate-600">
                Gunakan template resmi agar data NIK, PIN 6 Digit, NIP, NUPTK, NPK, Peg ID Simpatika, Jabatan, dan JTM terbaca sempurna.
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {PTK_EXCEL_COLUMNS.slice(0, 8).map(col => (
                  <span key={col} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono font-semibold">
                    {col}
                  </span>
                ))}
                <span className="text-[10px] text-slate-400 font-bold self-center">+ 8 kolom lainnya</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => downloadPtkExcelTemplate(madrasahName)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template Excel (.xlsx)</span>
            </button>
          </div>

          {/* Step 2: Upload Drag & Drop Area */}
          {parsedData.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 sm:p-10 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/80 scale-[0.99]'
                  : 'border-slate-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/20'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleInputChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
                <Upload className="w-8 h-8 animate-bounce" />
              </div>

              <h3 className="text-sm sm:text-base font-black text-slate-800">
                Pilih atau Tarik & Lepas File Excel (.xlsx / .xls / .csv)
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Klik untuk memilih file dari komputer atau seret file excel berisi daftar PTK madrasah Anda ke area ini.
              </p>

              {isProcessing && (
                <div className="mt-4 flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Sedang memproses dan membaca isi file Excel...</span>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-2 max-w-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Step 3: Live Preview Table of Parsed Data */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-900 text-white p-4 rounded-2xl">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">Hasil Pembacaan Excel</span>
                  </div>
                  <h4 className="text-sm font-black mt-0.5">
                    {parsedData.length} Akun Guru / PTK Siap Diimpor
                  </h4>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5">
                    File: <span className="font-mono font-bold text-white">{fileName}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPins(!showPins)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPins ? 'Sembunyikan PIN' : 'Intip PIN 6 Digit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Batal / Pilih Ulang</span>
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3 min-w-[180px]">Nama Lengkap & Gelar</th>
                        <th className="p-3 min-w-[130px]">NIK</th>
                        <th className="p-3 min-w-[100px]">PIN 6 Digit</th>
                        <th className="p-3 min-w-[110px]">Hak Akses</th>
                        <th className="p-3 min-w-[150px]">NIP / NUPTK / NPK</th>
                        <th className="p-3 min-w-[160px]">Jabatan & Status</th>
                        <th className="p-3 min-w-[80px] text-center">JK</th>
                        <th className="p-3 min-w-[90px] text-center">JTM</th>
                        <th className="p-3 min-w-[140px]">Kontak / WA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {parsedData.map((t, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-500">{t.no || (idx + 1)}</td>
                          <td className="p-3">
                            <div className="font-extrabold text-slate-900">
                              {t.nama} {t.gelar && <span className="text-emerald-700 font-bold">{t.gelar}</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {t.username}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">{t.nik || '-'}</td>
                          <td className="p-3 font-mono font-black text-emerald-700">
                            {showPins ? (t.pin || '123456') : '••••••'}
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
                            <div>NIP: <span className="font-mono font-bold">{t.nip || '-'}</span></div>
                            {t.nuptk && t.nuptk !== '-' && <div className="text-slate-500 text-[10px]">NUPTK: {t.nuptk}</div>}
                            {t.npk && t.npk !== '-' && <div className="text-slate-500 text-[10px]">NPK: {t.npk}</div>}
                            {t.pegIdSimpatika && t.pegIdSimpatika !== '-' && <div className="text-teal-700 text-[10px]">Peg ID: {t.pegIdSimpatika}</div>}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{t.jabatanMapel || t.jabatanAtauKelas}</div>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                              {t.statusKepegawaian || 'PNS'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              t.jenisKelamin === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {t.jenisKelamin === 'P' ? 'P' : 'L'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-800">{t.bebanJtm || '24 Jam'}</td>
                          <td className="p-3 text-[11px] text-slate-600">
                            {t.noWhatsapp && <div className="text-emerald-700 font-bold">{t.noWhatsapp}</div>}
                            {t.email && <div className="text-slate-500 truncate max-w-[130px]">{t.email}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Saat ini terdapat <strong className="text-slate-900">{existingTeachersCount}</strong> akun guru terdaftar.
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {parsedData.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => onImportMerge(parsedData)}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>📥 Gabung / Tambahkan ({parsedData.length} PTK)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Apakah Anda yakin ingin menimpa seluruh ${existingTeachersCount} data guru lama dengan ${parsedData.length} data guru baru dari Excel?`)) {
                      onImportReplace(parsedData);
                    }
                  }}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>🔄 Timpa Semua Data ({parsedData.length} PTK)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
