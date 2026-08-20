import React, { useState } from 'react';
import {
  BookOpen,
  Heart,
  Sparkles,
  Award,
  CheckCircle2,
  HelpCircle,
  FileText,
  Layers,
  GraduationCap,
  Users,
  Smile,
  ShieldCheck,
  Target,
  Compass,
  X,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  Zap
} from 'lucide-react';

interface CurriculumLiteracyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCreateModule?: () => void;
}

export const CurriculumLiteracyModal: React.FC<CurriculumLiteracyModalProps> = ({
  isOpen,
  onClose,
  onStartCreateModule
}) => {
  const [activeTab, setActiveTab] = useState<'kbc' | 'merdeka' | 'seksi' | 'panduan'>('kbc');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white text-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-all border border-white/20"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-200 mb-2">
            <span className="bg-white/15 px-3 py-1 rounded-full border border-white/20 flex items-center space-x-1.5 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
              <span>Standar Kurikulum Nasional & Karakter</span>
            </span>
            <span className="bg-amber-400/20 text-amber-200 px-2.5 py-1 rounded-full border border-amber-400/30 font-mono text-[10px]">
              KMA 450 / 2024 & KBC
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-snug flex items-center space-x-2">
            <span>Pusat Literasi Kurikulum Merdeka & KBC</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1 leading-relaxed max-w-2xl">
            Panduan lengkap landasan filosofis, standar regulasi Kemendikdasmen & Kemenag, serta struktur penyusunan Modul Ajar Berbasis Cinta (KBC).
          </p>

          {/* Modal Navigation Tabs */}
          <div className="flex overflow-x-auto space-x-2 mt-5 pt-2 border-t border-white/15 scrollbar-none font-sans text-xs">
            <button
              onClick={() => setActiveTab('kbc')}
              className={`px-3.5 py-2 rounded-2xl font-black transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'kbc'
                  ? 'bg-white text-emerald-900 shadow-md scale-102'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${activeTab === 'kbc' ? 'text-rose-600 fill-rose-600' : 'text-rose-300'}`} />
              <span>Kurikulum Berbasis Cinta (KBC)</span>
            </button>

            <button
              onClick={() => setActiveTab('merdeka')}
              className={`px-3.5 py-2 rounded-2xl font-black transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'merdeka'
                  ? 'bg-white text-emerald-900 shadow-md scale-102'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Standar Kurikulum Merdeka</span>
            </button>

            <button
              onClick={() => setActiveTab('seksi')}
              className={`px-3.5 py-2 rounded-2xl font-black transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'seksi'
                  ? 'bg-white text-emerald-900 shadow-md scale-102'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-500" />
              <span>7 Seksi Modul KBC</span>
            </button>

            <button
              onClick={() => setActiveTab('panduan')}
              className={`px-3.5 py-2 rounded-2xl font-black transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'panduan'
                  ? 'bg-white text-emerald-900 shadow-md scale-102'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Zap className="w-4 h-4 text-cyan-500" />
              <span>Panduan Praktis Guru</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50 text-slate-800 text-xs sm:text-sm">
          {/* TAB 1: KURIKULUM BERBASIS CINTA (KBC) */}
          {activeTab === 'kbc' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-4 flex items-start space-x-3 text-rose-950">
                <div className="p-2.5 bg-rose-500 text-white rounded-xl shrink-0 shadow-xs">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-rose-900">
                    Apa itu Kurikulum Berbasis Cinta (KBC)?
                  </h3>
                  <p className="text-xs leading-relaxed text-rose-800 mt-1">
                    Kurikulum Berbasis Cinta (KBC) adalah pendekatan pembelajaran berlandaskan kasih sayang (*Rahmatan lil 'Alamin*), empati, keteladanan, dan penghargaan terhadap fitrah unik peserta didik. Pembelajaran tidak hanya menransfer ilmu pengetahuan (kognitif), tetapi menanamkan nilai adab, cinta Allah, rasa peduli sesama, serta menciptakan suasana kelas yang aman, membahagiakan, dan bebas dari intimidasi.
                  </p>
                </div>
              </div>

              {/* 4 Pilar Utama KBC */}
              <div>
                <h4 className="font-black text-slate-900 text-sm mb-3 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>4 Pilar Utama Kurikulum Berbasis Cinta</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center space-x-2 text-rose-600 font-extrabold text-xs">
                      <Heart className="w-4 h-4" />
                      <span>1. Cinta Kepada Allah & Rasul</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Menanamkan kesadaran tauhid dan ibadah secara sukarela melalui rasa cinta, sanjungan, dan pemahaman hikmah, bukan karena rasa takut atau paksaan.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center space-x-2 text-teal-600 font-extrabold text-xs">
                      <Users className="w-4 h-4" />
                      <span>2. Cinta Sesama Manusia</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Menumbuhkan empati, saling menghargai perbedaan, persaudaraan (*Ukhuwah*), dan budaya anti-perundungan (*anti-bullying*) di lingkungan sekolah.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center space-x-2 text-amber-600 font-extrabold text-xs">
                      <Smile className="w-4 h-4" />
                      <span>3. Cinta Belajar & Ilmu</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Mengembangkan minat belajar intrinsik melalui metode yang menyenangkan (*Joyful Learning*), eksperimen, kuis interaktif, dan pemberian apresiasi positif.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center space-x-2 text-emerald-600 font-extrabold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>4. Cinta Lingkungan & Bangsa</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Memupuk kepedulian pada kelestarian alam sekitar serta semangat berkontribusi positif bagi masyarakat dan NKRI.
                    </p>
                  </div>
                </div>
              </div>

              {/* Implementasi dalam Kelas KBC */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-extrabold text-emerald-900 text-xs sm:text-sm flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ciri-ciri Kelas Berbasis Cinta (KBC)</span>
                </h4>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Guru menyambut siswa dengan senyuman, salam hangat, dan sapaan penuh perhatian di awal pelajaran.</li>
                  <li>Umpan balik (*feedback*) asesmen mengutamakan penguatan emosional positif dan motivasi membangun.</li>
                  <li>Penyusunan modul ajar secara eksplisit memasukkan seksi **Profil Cinta & Karakter Rahmatan lil 'Alamin**.</li>
                  <li>Langkah pembelajaran memadukan diskusi empatik, kerja kelompok kolaboratif, dan refleksi batiniah.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: STANDAR KURIKULUM MERDEKA */}
          {activeTab === 'merdeka' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 text-emerald-950">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-emerald-950">
                    Standar Kurikulum Merdeka (KMA 450 Tahun 2024 / Permendikbud)
                  </h3>
                  <p className="text-xs leading-relaxed text-emerald-900 mt-1">
                    Kurikulum Merdeka berfokus pada materi esensial, pengembangan karakter peserta didik melalui P5 (Proyek Penguatan Profil Pelajar Pancasila) dan PPRA (Profil Pelajar Rahmatan lil 'Alamin), serta fleksibilitas bagi guru untuk merancang pembelajaran berdiferensiasi.
                  </p>
                </div>
              </div>

              {/* Komponen Kunci Kurikulum Merdeka */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-black text-xs">
                    CP
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Capaian Pembelajaran (CP)</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Kompetensi pembelajaran minimal yang harus dicapai peserta didik pada setiap fase (Fase A, B, C untuk MI/SD).
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="w-7 h-7 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center font-black text-xs">
                    TP
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Tujuan Pembelajaran (TP) & ATP</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Rangkaian tujuan pembelajaran yang disusun secara logis dan sistematis dalam Alur Tujuan Pembelajaran (ATP).
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="w-7 h-7 bg-teal-100 text-teal-800 rounded-lg flex items-center justify-center font-black text-xs">
                    P5
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">P5 & PPRA</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Proyek kokurikuler untuk membentuk karakter Pancasila serta moderasi beragama Rahmatan lil 'Alamin.
                  </p>
                </div>
              </div>

              {/* Pembelajaran Berdiferensiasi & Asesmen */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>3 Bentuk Asesmen Standar Kurikulum Merdeka</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-sans">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <p className="font-extrabold text-emerald-700 text-xs">1. Asesmen Awal (Diagnostic)</p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Memetakan kemampuan dasar, kesiapan belajar, dan minat awal siswa sebelum memulai materi.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <p className="font-extrabold text-indigo-700 text-xs">2. Asesmen Formatif</p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Memantau proses belajar, memberikan umpan balik langsung, dan memandu perbaikan instruksional.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <p className="font-extrabold text-amber-700 text-xs">3. Asesmen Sumatif</p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Mengukur ketercapaian tujuan pembelajaran di akhir bab, semester, atau fase secara adil.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 7 SEKSI MODUL AJAR KBC */}
          {activeTab === 'seksi' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-950">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 shadow-xs">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-900">
                    Struktur 7 Seksi Modul Ajar Cinta (Standar Aplikasi)
                  </h3>
                  <p className="text-xs leading-relaxed text-amber-800 mt-1">
                    Setiap modul ajar yang dihasilkan di aplikasi ini dirancang secara otomatis maupun manual memenuhi 7 seksi terstruktur berikut untuk memastikan kelengkapan administratif & pedagogis.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    no: '1',
                    title: 'Seksi 1: Identitas & Informasi Umum',
                    desc: 'Nama Penyusun, Nama Madrasah, Fase/Kelas, Mata Pelajaran, Alokasi Waktu, Elemen, dan Target Peserta Didik.'
                  },
                  {
                    no: '2',
                    title: 'Seksi 2: Profil Pelajar Rahmatan lil \'Alamin & Nilai Cinta',
                    desc: 'Integrasi nilai kasih sayang, kesopanan, toleransi, empati, kebersihan, dan karakter moderasi beragama.'
                  },
                  {
                    no: '3',
                    title: 'Seksi 3: Kompetensi Inti & Tujuan Pembelajaran',
                    desc: 'Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), Alur Tujuan (ATP), Pemahaman Bermakna, & Pertanyaan Pemantik.'
                  },
                  {
                    no: '4',
                    title: 'Seksi 4: Langkah Pembelajaran Berbasis Kasih Sayang',
                    desc: 'Kegiatan Awal (Apresiasi & Doa Kasih), Kegiatan Inti (Berdiferensiasi & Eksplorasi), dan Kegiatan Penutup (Refleksi Batin & Apresiasi).'
                  },
                  {
                    no: '5',
                    title: 'Seksi 5: Asesmen Pembelajaran KBC',
                    desc: 'Rubrik penilaian Sikap/Akhlak (Observasi Cinta), Pengetahuan (Tes/Kuis), dan Keterampilan (Proyek/Unjuk Kerja).'
                  },
                  {
                    no: '6',
                    title: 'Seksi 6: Lembar Kerja Peserta Didik (LKPD)',
                    desc: 'Lembar tugas interaktif ramah anak dengan petunjuk pengerjaan santun dan ruang jawaban kolaboratif.'
                  },
                  {
                    no: '7',
                    title: 'Seksi 7: Media Digital & Kuis Interaktif',
                    desc: 'Soal kuis pilihan ganda interaktif, video/bahan bacaan digital, dan mode permainan kuis siswa langsung.'
                  }
                ].map((s, idx) => (
                  <div key={idx} className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 flex items-start space-x-3 shadow-2xs">
                    <span className="w-7 h-7 bg-emerald-700 text-white font-black rounded-xl flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {s.no}
                    </span>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{s.title}</h5>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PANDUAN PRAKTIS GURU */}
          {activeTab === 'panduan' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 flex items-start space-x-3 text-cyan-950">
                <div className="p-2.5 bg-cyan-600 text-white rounded-xl shrink-0 shadow-xs">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-cyan-950">
                    Panduan Cepat Menyusun Modul Ajar dalam 3 Menit
                  </h3>
                  <p className="text-xs leading-relaxed text-cyan-900 mt-1">
                    Langkah mudah membuat dokumen Modul Ajar KBC yang langsung siap dicetak dengan Kop Surat resmi dan TTD Madrasah.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-xs">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Metode 1: Generasi AI Otomatis</span>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4 leading-relaxed">
                    <li>Klik tombol **"Mode 1: Generasi AI"** di beranda.</li>
                    <li>Pilih Mata Pelajaran, Kelas/Fase, dan masukkan Topik/Materi.</li>
                    <li>Klik **"Generasikan Modul AI"** dan biarkan sistem menyusun 7 seksi lengkap.</li>
                    <li>Lakukan review atau sedikit penyesuaian lalu simpan.</li>
                  </ol>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-800 font-extrabold text-xs">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Metode 2: Wizard Manual 7 Seksi</span>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4 leading-relaxed">
                    <li>Klik tombol **"Mode 2: Input Manual"**.</li>
                    <li>Isi data langkah demi langkah mulai dari Seksi 1 hingga Seksi 7.</li>
                    <li>Gunakan fitur Bank Materi jika ingin memilih rangkuman materi terstruktur.</li>
                    <li>Selesaikan wizard untuk menyimpan dokumen.</li>
                  </ol>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-slate-800 space-y-1">
                <p className="font-extrabold text-xs text-amber-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Tips Cetak Dokumen Resmi:</span>
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Pastikan Anda telah mengisi identitas Madrasah, mengunggah Logo di menu **Kop Surat**, serta mengatur nama & NIP Kepala Madrasah di menu **Penandatangan TTD** pada tab **Pengaturan** agar cetakan modul memiliki format administrasi legal yang sah.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Diakomodasi oleh Modul Ajar KBC © 2026</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all"
            >
              Tutup
            </button>
            {onStartCreateModule && (
              <button
                onClick={() => {
                  onClose();
                  onStartCreateModule();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md transition-all border border-emerald-500"
              >
                <span>Mulai Buat Modul Ajar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
