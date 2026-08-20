import React, { useState, useEffect } from 'react';
import { School, CheckCircle2, Plus, Edit2, Trash2, X, Building2, MapPin, Hash, Phone, ShieldCheck, Crown, Lock, Unlock, KeyRound, ShieldAlert, Printer, Users, Award, FileText, Loader2, Check } from 'lucide-react';
import { MadrasahItem } from '../types';
import {
  loadMadrasahList,
  saveMadrasahList,
  saveActiveMadrasahId,
  loadKopSurat,
  saveKopSurat,
  loadTTD,
  saveTeachers,
  saveTeacherPin,
  loadSuperAdminMode,
  saveSuperAdminMode,
  verifySuperAdminPin
} from '../utils/storage';
import { isSuperAdminUser, loadUserSession } from '../utils/auth';
import { DEFAULT_TEACHERS } from '../data/sampleModules';
import { CetakProfilMadrasahModal } from './CetakProfilMadrasahModal';

interface MadrasahModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMadrasahId: string;
  onSelectMadrasah: (madrasahId: string) => void;
}

export const MadrasahModal: React.FC<MadrasahModalProps> = ({
  isOpen,
  onClose,
  activeMadrasahId,
  onSelectMadrasah
}) => {
  const [madrasahList, setMadrasahList] = useState<MadrasahItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Save State & Visual Indicators
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);

  // Super Admin State
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [showSuperLogin, setShowSuperLogin] = useState<boolean>(false);
  const [inputSuperPin, setInputSuperPin] = useState<string>('');
  const [superPinError, setSuperPinError] = useState<string>('');

  // Form State EMIS Kemenag Lengkap
  const [nama, setNama] = useState('');
  const [kodeMadrasah, setKodeMadrasah] = useState('');
  const [jenjang, setJenjang] = useState('MI');
  const [nsm, setNsm] = useState('');
  const [npsn, setNpsn] = useState('');
  const [statusSekolah, setStatusSekolah] = useState('Swasta');
  const [akreditasi, setAkreditasi] = useState('A (Unggul)');
  const [noSkAkreditasi, setNoSkAkreditasi] = useState('');
  const [tglAkreditasi, setTglAkreditasi] = useState('');
  const [skIzinOperasional, setSkIzinOperasional] = useState('');
  const [tglSkIzinOperasional, setTglSkIzinOperasional] = useState('');
  const [tahunBerdiri, setTahunBerdiri] = useState('');
  const [kepalaMadrasah, setKepalaMadrasah] = useState('');
  const [nipKepalaMadrasah, setNipKepalaMadrasah] = useState('');
  const [namaYayasan, setNamaYayasan] = useState('');
  const [noSkYayasan, setNoSkYayasan] = useState('');
  const [alamat, setAlamat] = useState('');
  const [rtRw, setRtRw] = useState('');
  const [dusun, setDusun] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [desaKelurahan, setDesaKelurahan] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kotaKabupaten, setKotaKabupaten] = useState('');
  const [provinsi, setProvinsi] = useState('');
  const [kodePos, setKodePos] = useState('');
  const [titikKoordinat, setTitikKoordinat] = useState('');
  const [kontak, setKontak] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // EMIS Data Statistik
  const [jumlahSiswaL, setJumlahSiswaL] = useState<number>(100);
  const [jumlahSiswaP, setJumlahSiswaP] = useState<number>(90);
  const [jumlahRombel, setJumlahRombel] = useState<number>(6);
  const [jumlahGuruL, setJumlahGuruL] = useState<number>(4);
  const [jumlahGuruP, setJumlahGuruP] = useState<number>(8);
  const [jumlahTendik, setJumlahTendik] = useState<number>(2);

  const [errorMsg, setErrorMsg] = useState('');

  // Cetak Profil State
  const [cetakModalOpen, setCetakModalOpen] = useState<boolean>(false);
  const [madrasahCetak, setMadrasahCetak] = useState<MadrasahItem | null>(null);

  // Delete Confirm State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MadrasahItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setIsAdding(false);
      setEditingId(null);
      setErrorMsg('');
      const superUser = isSuperAdminUser();
      setIsSuperAdmin(superUser || loadSuperAdminMode());
      setShowSuperLogin(false);
      setInputSuperPin('');
      setSuperPinError('');
    }
  }, [isOpen]);

  const refreshList = () => {
    setMadrasahList(loadMadrasahList());
  };

  const handleUnlockSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifySuperAdminPin(inputSuperPin)) {
      saveSuperAdminMode(true);
      setIsSuperAdmin(true);
      setShowSuperLogin(false);
      setInputSuperPin('');
      setSuperPinError('');
    } else {
      setSuperPinError('PIN Super Admin salah! (Default: 9999)');
    }
  };

  const handleLockSuperAdmin = () => {
    saveSuperAdminMode(false);
    setIsSuperAdmin(false);
    setIsAdding(false);
  };

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setNama('');
    setKodeMadrasah('');
    setJenjang('MI');
    setNsm('');
    setNpsn('');
    setStatusSekolah('Swasta');
    setAkreditasi('A (Unggul)');
    setNoSkAkreditasi('1347/BAN-SM/SK/2021');
    setTglAkreditasi('08 Desember 2021 - 2026');
    setSkIzinOperasional('Kd.11.02/4/PP.00.4/0125/2010');
    setTglSkIzinOperasional('12 Juli 2010');
    setTahunBerdiri('1968');
    setKepalaMadrasah('');
    setNipKepalaMadrasah('');
    setNamaYayasan("Lembaga Pendidikan Ma'arif NU Banyumas");
    setNoSkYayasan('AHU-0001234.AH.01.04.Tahun 2015');
    setAlamat('');
    setRtRw('03 / 01');
    setDusun('');
    setAlamatLengkap('');
    setDesaKelurahan('');
    setKecamatan('');
    setKotaKabupaten('Kab. Banyumas');
    setProvinsi('Jawa Tengah');
    setKodePos('53173');
    setTitikKoordinat('-7.518294, 109.184721');
    setKontak('');
    setEmail('');
    setWebsite('https://maarifnubanyumas.or.id');
    setJumlahSiswaL(100);
    setJumlahSiswaP(90);
    setJumlahRombel(6);
    setJumlahGuruL(4);
    setJumlahGuruP(8);
    setJumlahTendik(2);
    setErrorMsg('');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (m: MadrasahItem) => {
    setNama(m.nama || '');
    setKodeMadrasah(m.kodeMadrasah || '');
    setJenjang(m.jenjang || 'MI');
    setNsm(m.nsm || m.nsmOrNpsn || '');
    setNpsn(m.npsn || '');
    setStatusSekolah(m.statusSekolah || 'Swasta');
    setAkreditasi(m.akreditasi || 'A (Unggul)');
    setNoSkAkreditasi(m.noSkAkreditasi || '');
    setTglAkreditasi(m.tglAkreditasi || '');
    setSkIzinOperasional(m.skIzinOperasional || '');
    setTglSkIzinOperasional(m.tglSkIzinOperasional || '');
    setTahunBerdiri(m.tahunBerdiri || '');
    setKepalaMadrasah(m.kepalaMadrasah || '');
    setNipKepalaMadrasah(m.nipKepalaMadrasah || '');
    setNamaYayasan(m.namaYayasan || "Lembaga Pendidikan Ma'arif NU Banyumas");
    setNoSkYayasan(m.noSkYayasan || '');
    setAlamat(m.alamat || '');
    setRtRw(m.rtRw || '');
    setDusun(m.dusun || '');
    setAlamatLengkap(m.alamatLengkap || m.alamat || '');
    setDesaKelurahan(m.desaKelurahan || '');
    setKecamatan(m.kecamatan || '');
    setKotaKabupaten(m.kotaKabupaten || 'Kab. Banyumas');
    setProvinsi(m.provinsi || 'Jawa Tengah');
    setKodePos(m.kodePos || '');
    setTitikKoordinat(m.titikKoordinat || '');
    setKontak(m.kontak || '');
    setEmail(m.email || '');
    setWebsite(m.website || '');
    setJumlahSiswaL(m.jumlahSiswaL || 100);
    setJumlahSiswaP(m.jumlahSiswaP || 90);
    setJumlahRombel(m.jumlahRombel || 6);
    setJumlahGuruL(m.jumlahGuruL || 4);
    setJumlahGuruP(m.jumlahGuruP || 8);
    setJumlahTendik(m.jumlahTendik || 2);
    setErrorMsg('');
    setEditingId(m.id);
    setIsAdding(true);
  };

  const handleSaveMadrasah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg('Nama Madrasah wajib diisi!');
      return;
    }

    setSaveStatus('saving');
    setErrorMsg('');

    try {
      const currentList = loadMadrasahList();

      const fullAlamat = alamatLengkap.trim() || [
        alamat.trim(),
        rtRw.trim() ? `RT ${rtRw.trim()}` : '',
        dusun.trim() ? `Dusun ${dusun.trim()}` : '',
        desaKelurahan.trim() ? `Desa ${desaKelurahan.trim()}` : '',
        kecamatan.trim() ? `Kec. ${kecamatan.trim()}` : '',
        kotaKabupaten.trim(),
        provinsi.trim(),
        kodePos.trim()
      ].filter(Boolean).join(', ');

      if (editingId) {
        // Edit mode
        let targetMadrasahNama = nama.trim();
        const updated = currentList.map(item => {
          if (item.id === editingId) {
            const updatedItem: MadrasahItem = {
              ...item,
              nama: nama.trim(),
              kodeMadrasah: kodeMadrasah.trim() || nama.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
              jenjang,
              nsm: nsm.trim(),
              npsn: npsn.trim(),
              nsmOrNpsn: nsm.trim() || npsn.trim() || item.nsmOrNpsn,
              statusSekolah,
              akreditasi,
              noSkAkreditasi: noSkAkreditasi.trim(),
              tglAkreditasi: tglAkreditasi.trim(),
              skIzinOperasional: skIzinOperasional.trim(),
              tglSkIzinOperasional: tglSkIzinOperasional.trim(),
              tahunBerdiri: tahunBerdiri.trim(),
              kepalaMadrasah: kepalaMadrasah.trim(),
              nipKepalaMadrasah: nipKepalaMadrasah.trim(),
              namaYayasan: namaYayasan.trim(),
              noSkYayasan: noSkYayasan.trim(),
              alamat: alamat.trim() || fullAlamat,
              rtRw: rtRw.trim(),
              dusun: dusun.trim(),
              alamatLengkap: fullAlamat,
              desaKelurahan: desaKelurahan.trim(),
              kecamatan: kecamatan.trim(),
              kotaKabupaten: kotaKabupaten.trim(),
              provinsi: provinsi.trim(),
              kodePos: kodePos.trim(),
              titikKoordinat: titikKoordinat.trim(),
              kontak: kontak.trim(),
              email: email.trim(),
              website: website.trim(),
              jumlahSiswaL,
              jumlahSiswaP,
              jumlahRombel,
              jumlahGuruL,
              jumlahGuruP,
              jumlahTendik
            };

            // If this is active madrasah, auto sync Kop Surat & TTD settings
            if (editingId === activeMadrasahId) {
              const currentKop = loadKopSurat();
              saveKopSurat({
                ...currentKop,
                namaMadrasah: updatedItem.nama,
                alamatMadrasah: updatedItem.alamatLengkap || updatedItem.alamat || currentKop.alamatMadrasah,
                kontakMadrasah: updatedItem.kontak || currentKop.kontakMadrasah,
                website: updatedItem.website || currentKop.website,
                namaInstansiAtas: updatedItem.namaYayasan || currentKop.namaInstansiAtas
              });

              // Also sync Kepala Madrasah to TTD
              if (updatedItem.kepalaMadrasah) {
                const currentTTD = loadTTD();
                import('../utils/storage').then(m => {
                  m.saveTTD({
                    ...currentTTD,
                    kepalaMadrasahNama: updatedItem.kepalaMadrasah || currentTTD.kepalaMadrasahNama,
                    kepalaMadrasahNIP: updatedItem.nipKepalaMadrasah || currentTTD.kepalaMadrasahNIP
                  });
                });
              }
            }

            return updatedItem;
          }
          return item;
        });

        saveMadrasahList(updated, true);
        setMadrasahList(updated);
        setRecentlySavedId(editingId);
        setSaveStatus('saved');
        setSavedSuccessMsg(`✓ Data Profil Madrasah "${targetMadrasahNama}" berhasil disimpan & disinkronkan!`);

        setTimeout(() => {
          setIsAdding(false);
          setEditingId(null);
          setSaveStatus('idle');
          setTimeout(() => setSavedSuccessMsg(null), 4000);
        }, 1200);
      } else {
        // Add mode
        const slugId = 'mi-' + nama.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);
        const newMadrasah: MadrasahItem = {
          id: slugId,
          nama: nama.trim(),
          kodeMadrasah: kodeMadrasah.trim() || nama.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
          jenjang,
          nsm: nsm.trim(),
          npsn: npsn.trim(),
          nsmOrNpsn: nsm.trim() || npsn.trim() || '111233020054',
          statusSekolah,
          akreditasi,
          noSkAkreditasi: noSkAkreditasi.trim(),
          tglAkreditasi: tglAkreditasi.trim(),
          skIzinOperasional: skIzinOperasional.trim(),
          tglSkIzinOperasional: tglSkIzinOperasional.trim(),
          tahunBerdiri: tahunBerdiri.trim(),
          kepalaMadrasah: kepalaMadrasah.trim(),
          nipKepalaMadrasah: nipKepalaMadrasah.trim(),
          namaYayasan: namaYayasan.trim(),
          noSkYayasan: noSkYayasan.trim(),
          alamat: alamat.trim() || fullAlamat,
          rtRw: rtRw.trim(),
          dusun: dusun.trim(),
          alamatLengkap: fullAlamat,
          desaKelurahan: desaKelurahan.trim(),
          kecamatan: kecamatan.trim(),
          kotaKabupaten: kotaKabupaten.trim(),
          provinsi: provinsi.trim(),
          kodePos: kodePos.trim(),
          titikKoordinat: titikKoordinat.trim(),
          kontak: kontak.trim(),
          email: email.trim(),
          website: website.trim(),
          jumlahSiswaL,
          jumlahSiswaP,
          jumlahRombel,
          jumlahGuruL,
          jumlahGuruP,
          jumlahTendik,
          createdAt: new Date().toISOString()
        };

        const updated = [...currentList, newMadrasah];
        saveMadrasahList(updated, true);
        setMadrasahList(updated);

        // Auto initialize Kop Surat & Teachers for new Madrasah
        saveActiveMadrasahId(newMadrasah.id);
        saveKopSurat({
          namaInstansiAtas: newMadrasah.namaYayasan || "LEMBAGA PENDIDIKAN MA'ARIF NU BANYUMAS",
          namaKantor: newMadrasah.namaYayasan || "LEMBAGA PENDIDIKAN MA'ARIF NU BANYUMAS",
          namaMadrasah: newMadrasah.nama,
          alamatMadrasah: newMadrasah.alamatLengkap || 'Jl. Pendidikan No. 1',
          kontakMadrasah: newMadrasah.kontak || 'Telp. (0281) 123456',
          website: newMadrasah.website || 'https://maarifnubanyumas.or.id',
          logoUrl: null,
          logoPosisi: 'kiri'
        });
        saveTeachers(DEFAULT_TEACHERS);
        saveTeacherPin('1234');

        onSelectMadrasah(newMadrasah.id);
        setRecentlySavedId(newMadrasah.id);
        setSaveStatus('saved');
        setSavedSuccessMsg(`🎉 Madrasah baru "${newMadrasah.nama}" berhasil didaftarkan dan disimpan!`);

        setTimeout(() => {
          setIsAdding(false);
          setSaveStatus('idle');
          setTimeout(() => setSavedSuccessMsg(null), 4000);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Error saving madrasah profile:', err);
      setErrorMsg('Gagal menyimpan profil madrasah: ' + (err.message || 'Kesalahan sistem'));
      setSaveStatus('idle');
    }
  };

  const handleRequestDelete = (m: MadrasahItem) => {
    setDeleteError(null);
    if (m.id === activeMadrasahId) {
      setDeleteError('Tidak dapat menghapus madrasah yang sedang aktif digunakan! Silakan beralih ke madrasah lain terlebih dahulu.');
      return;
    }
    const currentList = loadMadrasahList();
    if (currentList.length <= 1) {
      setDeleteError('Aplikasi harus memiliki minimal 1 madrasah terdaftar!');
      return;
    }
    setDeleteConfirmItem(m);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;
    const currentList = loadMadrasahList();
    const filtered = currentList.filter(item => item.id !== deleteConfirmItem.id);
    saveMadrasahList(filtered);
    setMadrasahList(filtered);
    setDeleteConfirmItem(null);
    setDeleteError(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Building2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center space-x-2">
                <span>Kelola & Pilih Madrasah</span>
                <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-bold">
                  Multi-Tenant
                </span>
              </h2>
              <p className="text-xs text-emerald-100/80">
                Pilih profil madrasah aktif. Data guru & modul terisolasi penuh antar madrasah.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-100/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Banner Role */}
          {savedSuccessMsg && (
            <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-900 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">Status Penyimpanan:</h4>
                  <p className="text-xs font-bold text-emerald-800">{savedSuccessMsg}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSavedSuccessMsg(null)}
                className="text-xs font-extrabold text-emerald-700 hover:text-emerald-950 p-1"
              >
                ✕
              </button>
            </div>
          )}

          {isSuperAdmin ? (
            <div className="p-3.5 bg-amber-50 border border-amber-300/90 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 flex items-center space-x-1.5">
                    <span>Mode Super Admin Otomatis (jaenalmaskun@gmail.com)</span>
                    <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold">Super Admin</span>
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Akses penuh melihat, menambah, dan beralih ke seluruh {madrasahList.length} madrasah terdaftar.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-100 border border-slate-200/90 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Mode Admin Madrasah (Terisolasi)</h4>
                  <p className="text-[11px] text-slate-600">
                    Hanya menampilkan profil madrasah Anda sendiri.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isAdding ? (
            /* Form Tambah/Edit Madrasah Lengkap */
            <form onSubmit={handleSaveMadrasah} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <School className="w-4 h-4 text-emerald-600" />
                  <span>{editingId ? 'Edit Profile Madrasah Lengkap' : 'Tambah Madrasah Baru'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  Batal
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              {/* SEKSI 1: INFORMASI UTAMA & NAUNGAN */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Informasi Utama &amp; Naungan</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Resmi Madrasah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => {
                      setNama(e.target.value);
                      if (!kodeMadrasah) {
                        setKodeMadrasah(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                      }
                    }}
                    placeholder="Contoh: MI Ma'arif NU 2 Sanggreman"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jenjang Pendidikan
                    </label>
                    <select
                      value={jenjang}
                      onChange={(e) => setJenjang(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="RA">RA (Raudhatul Athfal)</option>
                      <option value="MI">MI (Madrasah Ibtidaiyah)</option>
                      <option value="MTs">MTs (Madrasah Tsanawiyah)</option>
                      <option value="MA">MA (Madrasah Aliyah)</option>
                      <option value="MAK">MAK (Madrasah Aliyah Kejuruan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Identitas
                    </label>
                    <input
                      type="text"
                      value={kodeMadrasah}
                      onChange={(e) => setKodeMadrasah(e.target.value)}
                      placeholder="MIMNU2SANGGREMAN"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status Sekolah
                    </label>
                    <select
                      value={statusSekolah}
                      onChange={(e) => setStatusSekolah(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="Swasta">Swasta (LP Ma'arif NU)</option>
                      <option value="Negeri">Negeri (Kemenag)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Peringkat Akreditasi
                    </label>
                    <select
                      value={akreditasi}
                      onChange={(e) => setAkreditasi(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="A (Unggul)">A (Unggul)</option>
                      <option value="B (Baik)">B (Baik)</option>
                      <option value="C">C</option>
                      <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Yayasan / Naungan / Instansi Atas
                    </label>
                    <input
                      type="text"
                      value={namaYayasan}
                      onChange={(e) => setNamaYayasan(e.target.value)}
                      placeholder="Lembaga Pendidikan Ma'arif NU Banyumas"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. SK Yayasan / Badan Hukum
                    </label>
                    <input
                      type="text"
                      value={noSkYayasan}
                      onChange={(e) => setNoSkYayasan(e.target.value)}
                      placeholder="AHU-0001234.AH.01.04.Tahun 2015"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 2: LEGALITAS (NSM, NPSN, SK OPERASIONAL, AKREDITASI) */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <Hash className="w-4 h-4 text-emerald-600" />
                  <span>2. Identitas Legalitas &amp; SK Kemenag</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Statistik Madrasah (NSM)
                    </label>
                    <input
                      type="text"
                      value={nsm}
                      onChange={(e) => setNsm(e.target.value)}
                      placeholder="111233020054 (12 Digit)"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Pokok Sekolah Nasional (NPSN)
                    </label>
                    <input
                      type="text"
                      value={npsn}
                      onChange={(e) => setNpsn(e.target.value)}
                      placeholder="60712345 (8 Digit)"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. SK Izin Operasional
                    </label>
                    <input
                      type="text"
                      value={skIzinOperasional}
                      onChange={(e) => setSkIzinOperasional(e.target.value)}
                      placeholder="Kd.11.02/4/PP.00.4/0125/2010"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal SK Izin Operasional
                    </label>
                    <input
                      type="text"
                      value={tglSkIzinOperasional}
                      onChange={(e) => setTglSkIzinOperasional(e.target.value)}
                      placeholder="12 Juli 2010"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tahun Berdiri Madrasah
                    </label>
                    <input
                      type="text"
                      value={tahunBerdiri}
                      onChange={(e) => setTahunBerdiri(e.target.value)}
                      placeholder="1968"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. SK Akreditasi BAN-S/M
                    </label>
                    <input
                      type="text"
                      value={noSkAkreditasi}
                      onChange={(e) => setNoSkAkreditasi(e.target.value)}
                      placeholder="1347/BAN-SM/SK/2021"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Masa Berlaku / Tanggal Akreditasi
                    </label>
                    <input
                      type="text"
                      value={tglAkreditasi}
                      onChange={(e) => setTglAkreditasi(e.target.value)}
                      placeholder="08 Desember 2021 - 2026"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 3: KEPALA MADRASAH */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>3. Kepala Madrasah &amp; Penanggung Jawab</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Kepala Madrasah (Beserta Gelar)
                    </label>
                    <input
                      type="text"
                      value={kepalaMadrasah}
                      onChange={(e) => setKepalaMadrasah(e.target.value)}
                      placeholder="Contoh: JAENAL MASKUN, S.Pd.I."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP / NPK Kepala Madrasah
                    </label>
                    <input
                      type="text"
                      value={nipKepalaMadrasah}
                      onChange={(e) => setNipKepalaMadrasah(e.target.value)}
                      placeholder="Contoh: 198205122009011003 atau -"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 4: ALAMAT LENGKAP & WILAYAH */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>4. Alamat Lengkap, RT/RW &amp; Koordinat GPS</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jalan / Duku / Alamat Jalan
                    </label>
                    <input
                      type="text"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      placeholder="Jl. Ma'arif No. 02"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      RT / RW
                    </label>
                    <input
                      type="text"
                      value={rtRw}
                      onChange={(e) => setRtRw(e.target.value)}
                      placeholder="03 / 01"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Dusun / Dukuh</label>
                    <input
                      type="text"
                      value={dusun}
                      onChange={(e) => setDusun(e.target.value)}
                      placeholder="Grumbul Duku"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Desa / Kelurahan</label>
                    <input
                      type="text"
                      value={desaKelurahan}
                      onChange={(e) => setDesaKelurahan(e.target.value)}
                      placeholder="Sanggreman"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kecamatan</label>
                    <input
                      type="text"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      placeholder="Rawalo"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
                    <input
                      type="text"
                      value={kotaKabupaten}
                      onChange={(e) => setKotaKabupaten(e.target.value)}
                      placeholder="Kab. Banyumas"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Provinsi</label>
                    <input
                      type="text"
                      value={provinsi}
                      onChange={(e) => setProvinsi(e.target.value)}
                      placeholder="Jawa Tengah"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kode Pos</label>
                    <input
                      type="text"
                      value={kodePos}
                      onChange={(e) => setKodePos(e.target.value)}
                      placeholder="53173"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Titik Koordinat GPS (Latitude, Longitude)
                    </label>
                    <input
                      type="text"
                      value={titikKoordinat}
                      onChange={(e) => setTitikKoordinat(e.target.value)}
                      placeholder="-7.518294, 109.184721"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Lengkap Cetak (Otomatis)
                    </label>
                    <input
                      type="text"
                      value={alamatLengkap}
                      onChange={(e) => setAlamatLengkap(e.target.value)}
                      placeholder="Jl. Ma'arif No. 02, Sanggreman, Kec. Rawalo, Kab. Banyumas, Jawa Tengah 53173"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 5: KONTAK & MEDIA INFORMASI */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>5. Kontak &amp; Media Informasi</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. Telp / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={kontak}
                      onChange={(e) => setKontak(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Resmi Madrasah
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mimaarifnu2sanggreman@gmail.com"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Situs Web Resmi
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://maarifnubanyumas.or.id"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 6: REKAPITULASI STATISTIK EMIS (SISWA, GURU, ROMBEL, TENDIK) */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>6. Rekapitulasi Statistik EMIS (Siswa, Rombel, Guru)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Siswa (L)</label>
                    <input
                      type="number"
                      value={jumlahSiswaL}
                      onChange={(e) => setJumlahSiswaL(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Siswa (P)</label>
                    <input
                      type="number"
                      value={jumlahSiswaP}
                      onChange={(e) => setJumlahSiswaP(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rombel</label>
                    <input
                      type="number"
                      value={jumlahRombel}
                      onChange={(e) => setJumlahRombel(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Guru (L)</label>
                    <input
                      type="number"
                      value={jumlahGuruL}
                      onChange={(e) => setJumlahGuruL(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Guru (P)</label>
                    <input
                      type="number"
                      value={jumlahGuruP}
                      onChange={(e) => setJumlahGuruP(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tendik</label>
                    <input
                      type="number"
                      value={jumlahTendik}
                      onChange={(e) => setJumlahTendik(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setSaveStatus('idle');
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveStatus === 'saving'}
                  className={`px-6 py-2.5 text-xs font-black rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer ${
                    saveStatus === 'saved'
                      ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-105'
                      : saveStatus === 'saving'
                      ? 'bg-emerald-700 text-white opacity-80 cursor-wait'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                  }`}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan Data Profil...</span>
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>✓ Data Profil Berhasil Disimpan!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingId ? 'Simpan Perubahan Profile' : 'Daftarkan Madrasah Baru'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Multi Madrasah List */
            <div>
              {deleteError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center justify-between">
                  <span>{deleteError}</span>
                  <button onClick={() => setDeleteError(null)} className="font-bold text-rose-800 ml-2">✕</button>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isSuperAdmin
                      ? `Seluruh Madrasah Terdaftar (${madrasahList.length})`
                      : 'Profil Madrasah Anda'}
                  </span>
                </h3>
                {isSuperAdmin && (
                  <button
                    onClick={handleOpenAdd}
                    className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Madrasah Baru</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(isSuperAdmin ? madrasahList : madrasahList.filter(m => m.id === activeMadrasahId)).map((m, idx) => {
                  const isActive = m.id === activeMadrasahId;
                  return (
                    <div
                      key={`${m.id}-${idx}`}
                      className={`relative p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h4 className="text-sm font-black text-slate-900">{m.nama}</h4>
                            {isActive && (
                              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Madrasah Aktif</span>
                              </span>
                            )}
                            {recentlySavedId === m.id && (
                              <span className="bg-teal-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1 shadow-2xs animate-pulse">
                                <Check className="w-3 h-3" />
                                <span>✓ Data Profil Tersimpan</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3 text-[11px] text-slate-500 flex-wrap">
                            {m.kodeMadrasah && (
                              <span className="flex items-center space-x-1 font-semibold text-slate-700">
                                <Hash className="w-3 h-3 text-slate-400" />
                                <span>Kode: {m.kodeMadrasah}</span>
                              </span>
                            )}
                            {m.nsmOrNpsn && (
                              <span>NSM/NPSN: {m.nsmOrNpsn}</span>
                            )}
                          </div>

                          {m.alamat && (
                            <p className="text-xs text-slate-600 flex items-center space-x-1 pt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{m.alamat}</span>
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setMadrasahCetak(m);
                              setCetakModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1"
                            title="Cetak Profil Madrasah EMIS"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Cetak Profil</span>
                          </button>
                          {isSuperAdmin && !isActive && (
                            <button
                              onClick={() => onSelectMadrasah(m.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                            >
                              Gunakan
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            title="Edit Info Madrasah"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRequestDelete(m)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors disabled:opacity-40"
                              title={isActive ? 'Tidak dapat menghapus madrasah aktif' : 'Hapus Madrasah'}
                              disabled={isActive}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Unlock Super Admin */}
        {showSuperLogin && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs z-[70] flex items-center justify-center p-6 animate-fade-in">
            <form onSubmit={handleUnlockSuperAdmin} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Akses Pemilik / Super Admin</h3>
                  <p className="text-xs text-slate-500">Masukkan PIN Super Admin untuk melihat seluruh madrasah</p>
                </div>
              </div>

              {superPinError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {superPinError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Keamanan Super Admin
                </label>
                <input
                  type="password"
                  value={inputSuperPin}
                  onChange={(e) => setInputSuperPin(e.target.value)}
                  placeholder="Masukkan PIN Super Admin"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-base tracking-widest font-black text-slate-900 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                <span className="block text-[10px] text-slate-400 mt-1 text-center">
                  *PIN Default Super Admin Pemilik: <strong>9999</strong> atau PIN Guru
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowSuperLogin(false); setSuperPinError(''); setInputSuperPin(''); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Buka Mode Super Admin
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Confirmation Sub-Modal */}
        {deleteConfirmItem && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs z-[70] flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Konfirmasi Hapus Madrasah</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Apakah Anda yakin ingin menghapus profile <strong className="text-slate-900 font-bold">"{deleteConfirmItem.nama}"</strong>?
                  <br />Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Ya, Hapus Sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex items-center justify-between shrink-0">
          <span className="font-medium">
            🔒 Setiap madrasah memiliki database guru, modul, dan PIN keamanan terisolasi.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Modal Cetak Profil Madrasah EMIS */}
      <CetakProfilMadrasahModal
        isOpen={cetakModalOpen}
        onClose={() => setCetakModalOpen(false)}
        madrasah={madrasahCetak}
      />
    </div>
  );
};
