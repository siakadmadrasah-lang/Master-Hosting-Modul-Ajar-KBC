import React, { useState } from 'react';
import { registerOfficialMadrasah } from '../utils/auth';
import { Building2, School, CheckCircle2, ShieldAlert, Sparkles, MapPin, Hash, Phone, ArrowRight, X } from 'lucide-react';

interface OfficialRegisterModalProps {
  isOpen: boolean;
  isExpiredReason?: boolean; // If opened because 3-day trial expired
  onClose?: () => void;
  onSuccess: (newMadrasahId: string, namaMadrasah: string) => void;
}

export const OfficialRegisterModal: React.FC<OfficialRegisterModalProps> = ({
  isOpen,
  isExpiredReason = false,
  onClose,
  onSuccess
}) => {
  const [namaMadrasah, setNamaMadrasah] = useState('');
  const [kotaKabupaten, setKotaKabupaten] = useState('Banyumas');
  const [nsmOrNpsn, setNsmOrNpsn] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kontak, setKontak] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMadrasah.trim()) {
      setErrorMsg('Nama Madrasah wajib diisi!');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = registerOfficialMadrasah({
        namaMadrasah,
        kotaKabupaten,
        nsmOrNpsn,
        alamat,
        kontak
      });
      setIsSubmitting(false);

      if (res.success) {
        onSuccess(res.newMadrasahId, namaMadrasah.trim());
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-8">
        {/* Header Visual */}
        <div className={`p-6 sm:p-8 text-white relative overflow-hidden ${
          isExpiredReason 
            ? 'bg-gradient-to-br from-amber-700 via-rose-900 to-slate-900'
            : 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900'
        }`}>
          {!isExpiredReason && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="relative z-10 space-y-3">
            <div className="inline-flex p-3 bg-white/10 border border-white/20 rounded-2xl text-white shadow-inner">
              {isExpiredReason ? <ShieldAlert className="w-7 h-7 text-amber-300" /> : <Building2 className="w-7 h-7 text-emerald-300" />}
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 bg-amber-400/20 text-amber-200 border border-amber-300/30">
                {isExpiredReason ? '⚠️ MASA TRIAL 3 HARI BERAKHIR' : 'FORM PENDAFTARAN RESMI'}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Pendaftaran Resmi Madrasah
              </h2>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {isExpiredReason
                  ? 'Masa trial 3 hari Anda telah habis. Silakan mendaftarkan nama madrasah secara resmi agar dapat terus mengakses dan mengelola sistem modul ajar tanpa batas waktu.'
                  : 'Daftarkan nama madrasah Anda ke dalam sistem pengelola multi-madrasah terpadu.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Nama Madrasah Resmi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={namaMadrasah}
                onChange={(e) => setNamaMadrasah(e.target.value)}
                placeholder="Contoh: MI Atas Angin"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Nama ini akan otomatis masuk dalam Daftar Pengelola Madrasah.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kota / Kabupaten
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={kotaKabupaten}
                  onChange={(e) => setKotaKabupaten(e.target.value)}
                  placeholder="Contoh: Banyumas"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NSM / NPSN
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={nsmOrNpsn}
                  onChange={(e) => setNsmOrNpsn(e.target.value)}
                  placeholder="Contoh: 111233020099"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Lengkap Madrasah
            </label>
            <input
              type="text"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Contoh: Jl. Ma'arif No. 05, Rawalo, Banyumas"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kontak / Nomor Telepon / WA
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={kontak}
                onChange={(e) => setKontak(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
            <div className="font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Keuntungan Pendaftaran Resmi:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[10.5px] text-emerald-800">
              <li>Akses penuh selamanya tanpa batasan masa trial 3 hari</li>
              <li>Otomatis tersimpan dalam Cloud Multi-Madrasah Storage</li>
              <li>Dapat langsung membuat, mencetak, dan mengunduh Modul Ajar</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Mendaftarkan...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Daftarkan Madrasah & Buka Akses Penuh</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
