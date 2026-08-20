import React, { useState, useEffect } from 'react';
import { StudentAccount } from '../types';
import { loadStoredStudents, saveStudentSession, DEFAULT_SAMPLE_STUDENTS } from '../utils/storage';
import {
  GraduationCap,
  Key,
  UserCheck,
  Search,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  X,
  Eye,
  EyeOff,
  BookOpen
} from 'lucide-react';

interface StudentLoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (student: StudentAccount) => void;
  onClose?: () => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose
}) => {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [method, setMethod] = useState<'dropdown' | 'nisn'>('dropdown');

  // Dropdown method state
  const [selectedKelas, setSelectedKelas] = useState<string>('semua');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');

  // NISN method state
  const [nisnInput, setNisnInput] = useState<string>('');

  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const list = loadStoredStudents();
      setStudents(list.length > 0 ? list : DEFAULT_SAMPLE_STUDENTS);
      setErrorMsg(null);
      setPinInput('');
      setNisnInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const KELAS_OPTIONS = Array.from(new Set([
    'Kelas 1 (Fase A)',
    'Kelas 2 (Fase A)',
    'Kelas 3 (Fase B)',
    'Kelas 4 (Fase B)',
    'Kelas 5 (Fase C)',
    'Kelas 6 (Fase C)',
    ...students.map(s => s.kelas).filter(Boolean)
  ]));

  const filteredStudents = students.filter(s => {
    if (selectedKelas === 'semua') return true;
    return s.kelas === selectedKelas || s.kelas.toLowerCase().includes(selectedKelas.toLowerCase());
  });

  const handleDropdownLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudentId) {
      setErrorMsg('Pilih nama siswa terlebih dahulu!');
      return;
    }

    const matched = students.find(s => s.id === selectedStudentId);
    if (!matched) {
      setErrorMsg('Akun siswa tidak ditemukan.');
      return;
    }

    if (matched.pin && matched.pin !== pinInput.trim()) {
      setErrorMsg('PIN yang Anda masukkan salah. Hubungi Guru atau Wali Kelas Anda.');
      return;
    }

    saveStudentSession(matched);
    onLoginSuccess(matched);
  };

  const handleNisnLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNisn = nisnInput.trim();
    if (!cleanNisn) {
      setErrorMsg('Masukkan NISN / ID Login siswa!');
      return;
    }

    const matched = students.find(s => s.nisn.toLowerCase() === cleanNisn.toLowerCase());
    if (!matched) {
      setErrorMsg('Akun dengan NISN tersebut tidak ditemukan.');
      return;
    }

    if (matched.pin && matched.pin !== pinInput.trim()) {
      setErrorMsg('PIN yang Anda masukkan salah. Hubungi Guru Anda.');
      return;
    }

    saveStudentSession(matched);
    onLoginSuccess(matched);
  };

  const handleDemoLogin = (student: StudentAccount) => {
    saveStudentSession(student);
    onLoginSuccess(student);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden relative space-y-0">
        {/* Top Decorative Header - Compact */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-emerald-800 px-5 py-4 text-white text-center relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-lg pointer-events-none"></div>

          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-3 top-3 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-md shadow-inner">
            <GraduationCap className="w-6 h-6 text-amber-300" />
          </div>

          <h3 className="text-base font-extrabold tracking-tight">LOGIN KUIS SISWA</h3>
          <p className="text-[11px] text-emerald-100/90 mt-0.5">
            MI Ma'arif NU 2 Sanggreman
          </p>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Method Selector Tabs - Slim */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => { setMethod('dropdown'); setErrorMsg(null); }}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                method === 'dropdown' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Pilih Nama</span>
            </button>

            <button
              type="button"
              onClick={() => { setMethod('nisn'); setErrorMsg(null); }}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                method === 'nisn' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>NISN / ID</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] flex items-center space-x-2 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Method A: Dropdown Form */}
          {method === 'dropdown' ? (
            <form onSubmit={handleDropdownLogin} className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Filter Kelas</label>
                  <select
                    value={selectedKelas}
                    onChange={e => { setSelectedKelas(e.target.value); setSelectedStudentId(''); }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="semua">Semua Kelas ({students.length})</option>
                    {KELAS_OPTIONS.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nama Siswa *</label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={e => {
                      const id = e.target.value;
                      setSelectedStudentId(id);
                      const matched = students.find(s => s.id === id);
                      if (matched && matched.pin) {
                        setPinInput(matched.pin);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Nama Siswa --</option>
                    {filteredStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kelas})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">PIN Login *</label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      value={pinInput}
                      onChange={e => setPinInput(e.target.value)}
                      placeholder="PIN (default: masbagus)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <UserCheck className="w-4 h-4" />
                <span>Masuk Ke Kuis</span>
              </button>
            </form>
          ) : (
            /* Method B: NISN Form */
            <form onSubmit={handleNisnLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">NISN / ID Login Siswa *</label>
                <input
                  type="text"
                  required
                  value={nisnInput}
                  onChange={e => setNisnInput(e.target.value)}
                  placeholder="Contoh: 20240101"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">PIN Login *</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    placeholder="Masukkan PIN"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <UserCheck className="w-4 h-4" />
                <span>Masuk Ke Kuis</span>
              </button>
            </form>
          )}

          {/* Quick Demo Section */}
          <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Login Cepat Demo (1-Klik):
            </span>
            <div className="flex flex-wrap gap-1 justify-center">
              {students.slice(0, 3).map(student => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleDemoLogin(student)}
                  className="bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer border border-slate-200 hover:border-emerald-300"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate max-w-[100px]">{student.nama.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
