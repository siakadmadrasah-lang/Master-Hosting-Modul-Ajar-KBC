import React, { useState } from 'react';
import { TeacherItem, TTDSettings } from '../types';
import { inferKategoriJabatan } from '../utils/excelPtkUtils';
import { 
  X, 
  User, 
  Award, 
  CreditCard, 
  KeyRound, 
  Shield, 
  FileText, 
  Briefcase, 
  Clock, 
  Phone, 
  Mail, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Edit3,
  Star,
  GraduationCap
} from 'lucide-react';

interface TeacherDetailModalProps {
  teacher: TeacherItem | null;
  onClose: () => void;
  onEdit: (t: TeacherItem) => void;
  onSetAsTTD: (t: TeacherItem) => void;
  isDefaultTTD: boolean;
}

export const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  teacher,
  onClose,
  onEdit,
  onSetAsTTD,
  isDefaultTTD
}) => {
  const [showPin, setShowPin] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!teacher) return null;

  const meta = inferKategoriJabatan(teacher);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanPhone = (teacher.noWhatsapp || teacher.kontak || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}` : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`p-6 text-white relative ${
          meta.kategoriJabatan === 'guru_kelas' 
            ? 'bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900' 
            : meta.kategoriJabatan === 'guru_mapel'
            ? 'bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900'
            : meta.kategoriJabatan === 'kepala_madrasah'
            ? 'bg-gradient-to-r from-purple-900 via-violet-900 to-slate-900'
            : 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-3xl text-white flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/20 shrink-0 ${
              meta.kategoriJabatan === 'guru_kelas'
                ? 'bg-gradient-to-br from-indigo-500 to-blue-600'
                : meta.kategoriJabatan === 'guru_mapel'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                : 'bg-gradient-to-br from-purple-500 to-indigo-600'
            }`}>
              {teacher.nama.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {/* Badge Kategori Jabatan */}
                {meta.kategoriJabatan === 'guru_kelas' ? (
                  <span className="px-2.5 py-0.5 bg-indigo-400/30 text-indigo-200 border border-indigo-300/40 text-[11px] font-black rounded-md flex items-center space-x-1 uppercase tracking-wider">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Guru Kelas</span>
                  </span>
                ) : meta.kategoriJabatan === 'guru_mapel' ? (
                  <span className="px-2.5 py-0.5 bg-emerald-400/30 text-emerald-200 border border-emerald-300/40 text-[11px] font-black rounded-md flex items-center space-x-1 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Guru Mata Pelajaran</span>
                  </span>
                ) : meta.kategoriJabatan === 'kepala_madrasah' ? (
                  <span className="px-2.5 py-0.5 bg-purple-400/30 text-purple-200 border border-purple-300/40 text-[11px] font-black rounded-md flex items-center space-x-1 uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5" />
                    <span>Kepala Madrasah</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-400/30 text-slate-200 border border-slate-300/40 text-[11px] font-black rounded-md flex items-center space-x-1 uppercase tracking-wider">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Tendik / TU</span>
                  </span>
                )}

                <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] font-bold rounded-md">
                  {teacher.statusKepegawaian || 'PNS'}
                </span>
                {isDefaultTTD && (
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-md flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-slate-950" />
                    <span>TTD Modul Ajar</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black tracking-tight text-white">
                {teacher.nama} {teacher.gelar && <span className="text-emerald-300 font-bold">{teacher.gelar}</span>}
              </h2>
              <p className="text-xs text-white/90 font-medium">
                {teacher.jabatanMapel || meta.jabatanMapel || teacher.jabatanAtauKelas || 'Guru'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/50 flex-1">
          
          {/* Kredensial Login Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Kredensial Login Guru</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] text-slate-300 hover:text-white flex items-center space-x-1 cursor-pointer font-bold"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Tutup' : 'Intip PIN'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/10 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-300 block">Username / NIP / NIK</span>
                <span className="font-mono font-bold text-white text-sm select-all">
                  {teacher.username || teacher.nip || teacher.nik || '-'}
                </span>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-300 block">PIN 6 Digit</span>
                <span className="font-mono font-black text-amber-300 text-base tracking-widest">
                  {showPin ? (teacher.pin || '123456') : '••••••'}
                </span>
              </div>
            </div>
          </div>

          {/* 16 Formatted Fields Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              📋 Rincian Data Lengkap PTK
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Kategori Jabatan */}
              <div className={`p-2.5 rounded-xl border ${
                meta.kategoriJabatan === 'guru_kelas' 
                  ? 'bg-indigo-50/70 border-indigo-200' 
                  : meta.kategoriJabatan === 'guru_mapel'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-purple-50/70 border-purple-200'
              }`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kategori Jabatan</span>
                <span className={`font-black text-xs block mt-0.5 ${
                  meta.kategoriJabatan === 'guru_kelas' ? 'text-indigo-900' : meta.kategoriJabatan === 'guru_mapel' ? 'text-emerald-900' : 'text-purple-900'
                }`}>
                  {meta.jabatanGuru} {meta.kelasTugas ? `(${meta.kelasTugas})` : meta.mapelUtama ? `(${meta.mapelUtama})` : ''}
                </span>
              </div>

              {/* Jabatan Mapel Spesifik */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jabatan / Penugasan</span>
                <span className="font-bold text-slate-800 text-xs block mt-0.5">{teacher.jabatanMapel || meta.jabatanMapel}</span>
              </div>

              {/* NIK */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIK (16 Digit)</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-bold text-slate-800">{teacher.nik || '-'}</span>
                  {teacher.nik && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(teacher.nik!, 'nik')}
                      className="text-slate-400 hover:text-emerald-700 cursor-pointer"
                    >
                      {copiedField === 'nik' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* NIP */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIP Pegawai</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-bold text-slate-800">{teacher.nip || '-'}</span>
                  {teacher.nip && teacher.nip !== '-' && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(teacher.nip!, 'nip')}
                      className="text-slate-400 hover:text-emerald-700 cursor-pointer"
                    >
                      {copiedField === 'nip' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* NUPTK */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NUPTK</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-bold text-slate-800">{teacher.nuptk || '-'}</span>
                  {teacher.nuptk && teacher.nuptk !== '-' && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(teacher.nuptk!, 'nuptk')}
                      className="text-slate-400 hover:text-emerald-700 cursor-pointer"
                    >
                      {copiedField === 'nuptk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* NPK Kemenag */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NPK Kemenag</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-bold text-slate-800">{teacher.npk || '-'}</span>
                  {teacher.npk && teacher.npk !== '-' && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(teacher.npk!, 'npk')}
                      className="text-slate-400 hover:text-emerald-700 cursor-pointer"
                    >
                      {copiedField === 'npk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Peg ID Simpatika */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peg ID Simpatika / SIAGA</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-bold text-teal-800">{teacher.pegIdSimpatika || '-'}</span>
                  {teacher.pegIdSimpatika && teacher.pegIdSimpatika !== '-' && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(teacher.pegIdSimpatika!, 'pegid')}
                      className="text-slate-400 hover:text-emerald-700 cursor-pointer"
                    >
                      {copiedField === 'pegid' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Beban JTM */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Beban JTM (Jam Tatap Muka)</span>
                <span className="font-extrabold text-emerald-800 text-sm mt-0.5 block">{teacher.bebanJtm || '24 Jam'}</span>
              </div>

              {/* Jenis Kelamin */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jenis Kelamin</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {teacher.jenisKelamin === 'P' || teacher.jenisKelamin === 'Perempuan' ? 'Perempuan (P)' : 'Laki-laki (L)'}
                </span>
              </div>

              {/* Status Kepegawaian */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Kepegawaian</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{teacher.statusKepegawaian || 'PNS'}</span>
              </div>

              {/* No WhatsApp */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. WhatsApp</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-bold text-slate-800">{teacher.noWhatsapp || teacher.kontak || '-'}</span>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded flex items-center space-x-1 hover:bg-emerald-200"
                    >
                      <span>Chat WA</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Email</span>
                <span className="font-medium text-slate-800 truncate block mt-0.5">{teacher.email || '-'}</span>
              </div>
            </div>
          </div>

          {/* Mapel & Kelas yang Diampu */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div>
              <span className="text-xs font-black text-slate-900 block mb-1">Mata Pelajaran yang Diampu:</span>
              <div className="flex flex-wrap gap-1.5">
                {(teacher.mapelAmpu || ['Pendidikan Agama Islam']).map(m => (
                  <span key={m} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-black text-slate-900 block mb-1">Kelas / Fase Pembelajaran:</span>
              <div className="flex flex-wrap gap-1.5">
                {(teacher.kelasAmpu || ['Kelas 1 (Fase A)', 'Kelas 2 (Fase A)']).map(k => (
                  <span key={k} className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-xs font-medium">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div>
            {!isDefaultTTD && (
              <button
                type="button"
                onClick={() => {
                  onSetAsTTD(teacher);
                  onClose();
                }}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Star className="w-3.5 h-3.5" />
                <span>Jadikan TTD Default Modul</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onEdit(teacher);
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Data PTK</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
