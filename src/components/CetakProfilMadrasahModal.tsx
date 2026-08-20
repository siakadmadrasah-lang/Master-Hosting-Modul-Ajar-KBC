import React from 'react';
import { MadrasahItem, KopSuratSettings, TTDSettings } from '../types';
import { Printer, X, School, Building2, MapPin, ShieldCheck, Phone, Users, Award, Hash, FileText } from 'lucide-react';

interface CetakProfilMadrasahModalProps {
  isOpen: boolean;
  onClose: () => void;
  madrasah: MadrasahItem;
  kopSurat: KopSuratSettings;
  ttd: TTDSettings;
}

export const CetakProfilMadrasahModal: React.FC<CetakProfilMadrasahModalProps> = ({
  isOpen,
  onClose,
  madrasah,
  kopSurat,
  ttd
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalSiswa = (madrasah.jumlahSiswaL || 0) + (madrasah.jumlahSiswaP || 0);
  const totalGuru = (madrasah.jumlahGuruL || 0) + (madrasah.jumlahGuruP || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Modal - Hidden when printing */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center space-x-2">
                <span>Cetak / Pratinjau Profil EMIS Madrasah</span>
              </h3>
              <p className="text-xs text-slate-400">
                Dokumen resmi data profil madrasah standar EMIS Kemenag
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:overflow-visible font-sans">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #cetak-profil-area, #cetak-profil-area * {
                visibility: visible;
              }
              #cetak-profil-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 15mm 15mm 15mm 15mm !important;
                background: white !important;
                color: black !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              @page {
                size: A4 portrait;
                margin: 0;
              }
            }
          `}</style>

          <div id="cetak-profil-area" className="space-y-6 max-w-3xl mx-auto border print:border-none p-6 sm:p-8 rounded-xl bg-white shadow-sm">
            {/* KOP SURAT FORMAL */}
            <div className="border-b-4 border-double border-slate-900 pb-4 text-center relative flex items-center justify-between">
              {kopSurat.logoUrl && (
                <img
                  src={kopSurat.logoUrl}
                  alt="Logo Madrasah"
                  className="w-20 h-20 object-contain shrink-0"
                />
              )}
              <div className="flex-1 px-4 text-center">
                <p className="text-xs font-black uppercase tracking-widest text-slate-700">
                  {madrasah.namaYayasan || kopSurat.namaInstansiAtas || "LEMBAGA PENDIDIKAN MA'ARIF NU BANYUMAS"}
                </p>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 mt-0.5">
                  {madrasah.nama}
                </h1>
                <p className="text-[11px] font-semibold text-slate-800 mt-1">
                  {madrasah.alamatLengkap || madrasah.alamat || kopSurat.alamatMadrasah}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  NSM: <span className="font-mono font-bold text-slate-900">{madrasah.nsm || madrasah.nsmOrNpsn || '-'}</span> | NPSN: <span className="font-mono font-bold text-slate-900">{madrasah.npsn || '-'}</span> | Akreditasi: <span className="font-bold">{madrasah.akreditasi || 'A'}</span>
                </p>
                <p className="text-[10px] text-slate-600">
                  Kontak: {madrasah.kontak || kopSurat.kontakMadrasah} | Email: {madrasah.email || '-'} | Web: {madrasah.website || kopSurat.website}
                </p>
              </div>
              <div className="w-16 shrink-0 hidden sm:block">
                <span className="text-2xl">🎓</span>
              </div>
            </div>

            {/* JUDUL DOKUMEN */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 underline decoration-2 underline-offset-4">
                KARTU DATA PROFIL MADRASAH (EMIS)
              </h2>
              <p className="text-xs font-bold text-slate-600">
                Tahun Pelajaran 2025/2026 — Kementerian Agama Republik Indonesia
              </p>
            </div>

            {/* RINGKASAN REKAPITULASI STATISTIK */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl">
                <span className="block text-[10px] font-bold uppercase text-slate-500">Total Siswa</span>
                <span className="text-lg font-black text-emerald-700">{totalSiswa} Siswa</span>
                <span className="block text-[9px] text-slate-500 mt-0.5">L: {madrasah.jumlahSiswaL || 0} | P: {madrasah.jumlahSiswaP || 0}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl">
                <span className="block text-[10px] font-bold uppercase text-slate-500">Rombongan Belajar</span>
                <span className="text-lg font-black text-emerald-700">{madrasah.jumlahRombel || 6} Rombel</span>
                <span className="block text-[9px] text-slate-500 mt-0.5">Kelas 1 s/d 6</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl">
                <span className="block text-[10px] font-bold uppercase text-slate-500">Pendidik & Tendik</span>
                <span className="text-lg font-black text-emerald-700">{totalGuru + (madrasah.jumlahTendik || 0)} Orang</span>
                <span className="block text-[9px] text-slate-500 mt-0.5">Guru: {totalGuru} | Tendik: {madrasah.jumlahTendik || 0}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl">
                <span className="block text-[10px] font-bold uppercase text-slate-500">Peringkat Akreditasi</span>
                <span className="text-lg font-black text-emerald-700">{madrasah.akreditasi || 'A (Unggul)'}</span>
                <span className="block text-[9px] text-slate-500 mt-0.5">BAN-S/M Kemenag</span>
              </div>
            </div>

            {/* TABLE DETAILS */}
            <div className="space-y-4 text-xs text-slate-800">
              {/* BAGIAN I: IDENTITAS KELEMBAGAAN */}
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wide bg-slate-100 p-2 rounded-lg border border-slate-300 text-slate-900 flex items-center space-x-2">
                  <School className="w-3.5 h-3.5 text-emerald-700" />
                  <span>I. Identitas Kelembagaan &amp; Legalitas Operational</span>
                </h3>
                <table className="w-full mt-2 border-collapse text-left border border-slate-300">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 w-1/3 border-r border-slate-300">Nama Resmi Madrasah</td>
                      <td className="p-2 font-bold text-slate-900">{madrasah.nama}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Jenjang Pendidikan</td>
                      <td className="p-2 font-medium">{madrasah.jenjang || 'MI (Madrasah Ibtidaiyah)'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Nomor Statistik Madrasah (NSM)</td>
                      <td className="p-2 font-mono font-bold text-slate-900">{madrasah.nsm || madrasah.nsmOrNpsn || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Nomor Pokok Sekolah Nasional (NPSN)</td>
                      <td className="p-2 font-mono font-bold text-slate-900">{madrasah.npsn || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Status Sekolah</td>
                      <td className="p-2 font-medium">{madrasah.statusSekolah || 'Swasta'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">SK Izin Operasional</td>
                      <td className="p-2 font-medium">{madrasah.skIzinOperasional || '-'} {madrasah.tglSkIzinOperasional ? `(Tgl: ${madrasah.tglSkIzinOperasional})` : ''}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Tahun Berdiri</td>
                      <td className="p-2 font-medium">{madrasah.tahunBerdiri || '1968'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Akreditasi &amp; No. SK BAN-S/M</td>
                      <td className="p-2 font-medium">{madrasah.akreditasi || 'A (Unggul)'} {madrasah.noSkAkreditasi ? `— No. SK: ${madrasah.noSkAkreditasi}` : ''}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Masa Berlaku Akreditasi</td>
                      <td className="p-2 font-medium">{madrasah.tglAkreditasi || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* BAGIAN II: ALAMAT & GEOGRAFIS */}
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wide bg-slate-100 p-2 rounded-lg border border-slate-300 text-slate-900 flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>II. Alamat Lokasi &amp; Wilayah Administrative</span>
                </h3>
                <table className="w-full mt-2 border-collapse text-left border border-slate-300">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 w-1/3 border-r border-slate-300">Jalan / Dusun / RT / RW</td>
                      <td className="p-2 font-medium">{madrasah.alamat || '-'} {madrasah.rtRw ? `(RT/RW: ${madrasah.rtRw})` : ''} {madrasah.dusun ? `Dusun: ${madrasah.dusun}` : ''}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Desa / Kelurahan</td>
                      <td className="p-2 font-medium">{madrasah.desaKelurahan || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Kecamatan</td>
                      <td className="p-2 font-medium">{madrasah.kecamatan || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Kabupaten / Kota</td>
                      <td className="p-2 font-medium">{madrasah.kotaKabupaten || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Provinsi &amp; Kode Pos</td>
                      <td className="p-2 font-medium">{madrasah.provinsi || '-'} (Kode Pos: {madrasah.kodePos || '-'})</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Alamat Lengkap Cetak</td>
                      <td className="p-2 font-medium">{madrasah.alamatLengkap || madrasah.alamat || '-'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Titik Koordinat GPS (EMIS)</td>
                      <td className="p-2 font-mono font-bold text-slate-800">{madrasah.titikKoordinat || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* BAGIAN III: NAUNGAN YAYASAN & PENANGGUNG JAWAB */}
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wide bg-slate-100 p-2 rounded-lg border border-slate-300 text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>III. Naungan Penyelenggara &amp; Pimpinan</span>
                </h3>
                <table className="w-full mt-2 border-collapse text-left border border-slate-300">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 w-1/3 border-r border-slate-300">Yayasan / Badan Hukum</td>
                      <td className="p-2 font-bold text-slate-900">{madrasah.namaYayasan || kopSurat.namaInstansiAtas || "LP Ma'arif NU"}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">No. SK Badan Hukum Yayasan</td>
                      <td className="p-2 font-medium">{madrasah.noSkYayasan || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Nama Kepala Madrasah</td>
                      <td className="p-2 font-bold text-slate-900">{madrasah.kepalaMadrasah || ttd.kepalaMadrasahNama || '-'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">NIP / NPK Kepala Madrasah</td>
                      <td className="p-2 font-mono font-bold">{madrasah.nipKepalaMadrasah || ttd.kepalaMadrasahNIP || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* BAGIAN IV: REKAPITULASI SDM & SISWA */}
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wide bg-slate-100 p-2 rounded-lg border border-slate-300 text-slate-900 flex items-center space-x-2">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>IV. Rekapitulasi Data Siswa &amp; SDM Pendidik</span>
                </h3>
                <table className="w-full mt-2 border-collapse text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-900">
                      <th className="p-2 border-r border-slate-300 font-bold">Kategori Data</th>
                      <th className="p-2 border-r border-slate-300 font-bold text-center">Laki-Laki</th>
                      <th className="p-2 border-r border-slate-300 font-bold text-center">Perempuan</th>
                      <th className="p-2 font-bold text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Jumlah Siswa Active</td>
                      <td className="p-2 text-center border-r border-slate-300 font-bold">{madrasah.jumlahSiswaL || 0}</td>
                      <td className="p-2 text-center border-r border-slate-300 font-bold">{madrasah.jumlahSiswaP || 0}</td>
                      <td className="p-2 text-center font-black text-emerald-800">{totalSiswa} Siswa</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Jumlah Guru / Pendidik</td>
                      <td className="p-2 text-center border-r border-slate-300 font-bold">{madrasah.jumlahGuruL || 0}</td>
                      <td className="p-2 text-center border-r border-slate-300 font-bold">{madrasah.jumlahGuruP || 0}</td>
                      <td className="p-2 text-center font-black text-emerald-800">{totalGuru} Guru</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Tenaga Kependidikan &amp; Rombel</td>
                      <td className="p-2 text-center border-r border-slate-300 font-medium" colSpan={2}>
                        {madrasah.jumlahTendik || 0} Staf Tendik
                      </td>
                      <td className="p-2 text-center font-black text-emerald-800">{madrasah.jumlahRombel || 6} Rombel</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* LEMBAR PENGESAHAN & TANDA TANGAN */}
            <div className="pt-6 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-900 border-t border-slate-200">
              <div className="text-center space-y-1 my-auto">
                <p className="text-[10px] text-slate-500 italic">
                  *Dokumen Profil EMIS ini dicetak secara otomatis dari Sistem Aplikasi Modul Ajar Terpadu.
                </p>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg inline-block text-[10px] text-slate-600 font-mono">
                  Kode Terverifikasi: {madrasah.kodeMadrasah}-EMIS-2026
                </div>
              </div>

              <div className="text-center space-y-1">
                <p>
                  {ttd.tempatPenetapan || madrasah.kotaKabupaten?.replace(/^Kab\.\s*|^Kota\s*/i, '') || 'Banyumas'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="font-bold">Kepala {madrasah.nama}</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-slate-300 text-[10px] italic">[ Tanda Tangan &amp; Stempel ]</span>
                </div>
                <p className="font-black underline uppercase">
                  {madrasah.kepalaMadrasah || ttd.kepalaMadrasahNama || 'JAENAL MASKUN, S.Pd.I.'}
                </p>
                <p className="text-[11px] font-mono">
                  NIP/NPK: {madrasah.nipKepalaMadrasah || ttd.kepalaMadrasahNIP || '198205122009011003'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
