import React, { useState, useEffect } from 'react';
import { safeFetchJson } from '../utils/apiHelper';
import {
  ModulAjarCinta,
  KopSuratSettings,
  TTDSettings,
  MAPEL_MI_OPTIONS,
  PANCA_CINTA_OPTIONS,
  PROFIL_LULUSAN_OPTIONS,
  SoalKuis,
  Flashcard,
  MateriBankItem,
  DEFAULT_TAHUN_AJARAN_OPTIONS
} from '../types';
import { loadCustomTahunAjaran, saveCustomTahunAjaran, loadActiveTahunAjaran, loadMasterMapelList } from '../utils/storage';
import {
  getDefaultProfilDesc,
  getDefaultPancaCintaDesc,
  getRecommendedPancasilaAndPancaCinta
} from '../utils/pancasilaPancaCinta';
import { getTemplate6SubBab } from '../utils/templateHelper';
import {
  compressAndResizeImage,
  getEducationalSvgIllustration,
  EDUCATIONAL_IMAGE_PRESETS,
  handleImageError,
  getReliableImageUrl
} from '../utils/imageHelper';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle,
  ListOrdered,
  HelpCircle,
  FileText,
  Heart,
  BookMarked,
  PlusCircle,
  Zap,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  Upload,
  ImagePlus,
  RefreshCw
} from 'lucide-react';
import { MateriBankManager } from './MateriBankManager';
import { AnimatedToast } from './AnimatedToast';

interface EditorManualWizardProps {
  initialModul?: ModulAjarCinta | null;
  kopSurat: KopSuratSettings;
  ttd: TTDSettings;
  materiList?: MateriBankItem[];
  customMapelList?: string[];
  onSave: (modul: ModulAjarCinta) => void;
  onClose: () => void;
}

export const EditorManualWizard: React.FC<EditorManualWizardProps> = ({
  initialModul,
  kopSurat,
  ttd,
  materiList = [],
  customMapelList = [],
  onSave,
  onClose
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showMateriPicker, setShowMateriPicker] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [judul, setJudul] = useState<string>(
    initialModul?.judul || 'Modul Ajar KBC Akidah Akhlak - Kasih Sayang Ar-Rahman'
  );

  const handlePickMateri = (item: MateriBankItem) => {
    setIdentitas(prev => ({
      ...prev,
      mataPelajaran: item.mataPelajaran,
      faseKelas: item.faseKelas,
      materi: item.judulMateri
    }));
    setJudul(`Modul Ajar KBC ${item.mataPelajaran} - ${item.judulMateri}`);
    if (item.uraianMateri) {
      setIdentifikasi(prev => ({
        ...prev,
        materiPelajaran: item.uraianMateri,
        topikPancaCinta: item.topikPancaCintaDefault || prev.topikPancaCinta
      }));
    }
    if (item.capaianPembelajaranDefault) {
      setDesain(prev => ({
        ...prev,
        capaianPembelajaran: item.capaianPembelajaranDefault
      }));
    }
    setShowMateriPicker(false);
  };
  const [identitas, setIdentitas] = useState(
    initialModul?.identitas || {
      namaMadrasah: kopSurat.namaMadrasah || 'MI Ma\'arif NU 2 Sanggreman',
      mataPelajaran: 'Akidah Akhlak',
      materi: 'Meneladani Sifat Ar-Rahman dalam Bermasyarakat',
      faseKelas: 'Fase B (Kelas III MI)',
      semester: 'Ganjil (1)' as const,
      tahunPelajaran: loadActiveTahunAjaran(),
      alokasiWaktu: '2 x 35 Menit (2 JP)',
      tanggalPelaksanaan: 'Disesuaikan / Terlampir'
    }
  );

  const [tahunAjaranOptions] = useState<string[]>(() => loadCustomTahunAjaran());

  const allTahunAjaranList = Array.from(new Set([loadActiveTahunAjaran(), ...tahunAjaranOptions, ...DEFAULT_TAHUN_AJARAN_OPTIONS]));

  useEffect(() => {
    setIdentitas(prev => ({
      ...prev,
      tahunPelajaran: loadActiveTahunAjaran()
    }));
  }, [initialModul]);

  // Seksi 2: Identifikasi
  const [identifikasi, setIdentifikasi] = useState(
    initialModul?.identifikasi || {
      kesiapanMurid: {
        pahamUtuh: 'Peserta didik kategori mahir/paham utuh telah menguasai konsep dasar materi, lancar menghafal dan menjelaskan makna, serta mampu memberikan contoh konkret wujud pengamalan harian. Tindak lanjut: Diberikan tugas pengayaan sebagai "Duta Cinta KBC" dan menjadi tutor sebaya.',
        pahamSebagian: 'Peserta didik kategori berkembang/paham sebagian mengenal konsep materi secara umum, namun masih memerlukan bantuan dan bimbingan terarah dalam menghubungkan teori dengan aksi nyata. Tindak lanjut: Diberikan pendampingan terarah dan kartu panduan visual.',
        belumPaham: 'Peserta didik kategori perlu intervensi/belum paham belum mengenal konsep dasar materi dan memerlukan bimbingan personal intensif (scaffolding) dengan peragaan visual/konkret dan pendekatan afektif kehangatan KBC.'
      },
      materiPelajaran: '1. Pengertian & Hakikat Utama Materi Pembelajaran secara Komprehensif.\n2. Bukti-Bukti & Contoh Konkret Penerapan dalam Kehidupan Sehari-hari.\n3. Nilai-Nilai Akhlak Mulia & Tata Krama Islami yang Ditumbuhkan.\n4. Pembiasaan Aksi Nyata Kehangatan KBC di Sekolah, Rumah, dan Masyarakat.',
      dimensiProfilLulusan: [
        'Beriman, Bertakwa, & Berakhlak Mulia: Menghayati ajaran Islam melalui ketulusan ibadah dan kesantunan bersikap.',
        'Berkeadaban (Ta’addub): Membiasakan tata krama Islami, menghormati guru, dan menyayangi teman.'
      ],
      topikPancaCinta: [
        'Cinta Allah SWT & Rasul-Nya: Menumbuhkan rasa syukur dan ketaatan ibadah.',
        'Cinta Sesama & Bangsa: Mempererat ukhuwah melalui senyum, sapa, salam, dan kepedulian sosial.'
      ],
      materiIntegrasiKBC: 'Integrasi Kurikulum Berbasis Cinta (KBC) dilakukan melalui kehangatan sapaan, kelembutan tutur kata, empati sosial, dan pembiasaan aksi kebaikan harian.'
    }
  );

  // Seksi 3: Desain
  const [desain, setDesain] = useState(
    initialModul?.desainPembelajaran || {
      capaianPembelajaran: 'Peserta didik mampu memahami, meyakini, dan meneladani materi pembelajaran secara komprehensif, serta mampu menampilkan sikap penuh kasih sayang, empati, kelembutan tutur kata, dan saling menghargai dalam kehidupan sehari-hari sebagai cerminan Kurikulum Berbasis Cinta (KBC).',
      lintasDisiplinIlmu: 'Terintegrasi dengan Bahasa Indonesia (keterampilan menyimak kisah dan bertutur kata santun), Seni Budaya (kreasi pohon kebaikan KBC), dan IPAS (kepedulian merawat lingkungan sekitar).',
      tujuanPembelajaran: [
        'Melalui kegiatan menyimak kisah dan diskusi, peserta didik mampu menjelaskan pengertian dan makna materi dengan kalimat yang santun, jelas, dan penuh keyakinan.',
        'Melalui pengamatan kartu visual, peserta didik mampu mengidentifikasi minimal 3 contoh penerapan konkret dalam kehidupan sehari-hari dengan cermat.',
        'Melalui simulasi berpasangan, peserta didik mampu mempraktikkan sikap saling menyayangi, bertutur kata lembut, dan membantu teman yang mengalami kesulitan.'
      ]
    }
  );

  // Seksi 4: Kerangka
  const [kerangka, setKerangka] = useState(
    initialModul?.kerangkaPembelajaran || {
      praktekPedagogik: 'Mindful Learning, Deep Learning melalui Storytelling dialogis, dan Simulasi Kasih Sayang.',
      kemitraanPembelajaran: 'Kerja sama dengan Orang Tua melalui Jurnal Kebaikan Rumah dan kolaborasi antar guru kelas.',
      lingkunganPembelajaran: 'Ruang kelas ramah anak, bersih, inklusif, dan penuh kehangatan emosional.',
      pemanfaatanDigital: 'Media digital interaktif berupa Kuis Digital, Flashcard Pembelajaran, dan Ilustrasi Visual AI.'
    }
  );

  // Seksi 5: Langkah Pembelajaran
  const [pengalaman, setPengalaman] = useState(
    initialModul?.pengalamanBelajar || {
      kegiatanAwal: {
        durasi: '10 Menit',
        kegiatan: [
          'Guru menyapa seluruh peserta didik dengan senyuman hangat, salam kasih KBC, dan menanyakan kabar perasaan hari ini (Emotion Check-in).',
          'Berdoa bersama dipimpin oleh ketua kelas dengan khusyuk, dilanjutkan membaca doa bersuci dan salawat.',
          'Apersepsi Penuh Cinta: Guru menampilkan gambar/cerita pemantik interaktif dan bertanya jawab tentang keterkaitan materi dengan kehidupan harian.',
          'Guru menyampaikan tujuan pembelajaran hari ini dan mengajak siswa memelihara niat ikhlas belajar karena cinta kepada Allah SWT.'
        ]
      },
      kegiatanInti: {
        durasi: '45 Menit',
        kegiatan: [
          'Eksplorasi Konsep Mendalam: Guru menyampaikan uraian materi pembelajaran secara runtut dan kontekstual.',
          'Diskusi Kelompok Ramah Anak: Peserta didik dibagi menjadi beberapa kelompok cinta untuk menganalisis kartu gambar peristiwa.',
          'Analisis & Penalaran Kritis: Setiap kelompok mendiskusikan tindakan dan solusi kebaikan yang dapat dilakukan secara nyata.',
          'Presentasi Penuh Apresiasi: Masing-masing kelompok mempresentasikan hasilnya, kelompok lain memberikan tepuk kasih sayang dan pujian membangun.',
          'Pemanfaatan Media Digital: Guru menayangkan flashcard interaktif dan kuis digital singkat untuk memperkuat pemahaman.',
          'Mengaplikasi Aksi Cinta: Peserta didik menuliskan komitmen kebaikan pada Pohon Cinta KBC.'
        ]
      },
      mengaplikasi: {
        durasi: '10 Menit',
        kegiatan: [
          'Praktik Nyata Berpasangan: Peserta didik berpasangan dengan teman di sebelahnya, bertukar senyum ramah dan menyampaikan kalimat apresiasi tulus.',
          'Aksi Kebaikan Tersembunyi: Mengambil satu kupon misi kebaikan dari Kotak Kebaikan Cinta KBC.'
        ]
      },
      merefleksi: {
        durasi: '5 Menit',
        kegiatan: [
          'Refleksi Hati & Kontemplasi: Peserta didik memejamkan mata sejenak merenungkan nikmat dan kesempatan belajar dari Allah SWT.',
          'Menuliskan satu kalimat rasa syukur dan komitmen kebaikan harian pada jurnal refleksi emosi.'
        ]
      },
      penutup: {
        durasi: '10 Menit',
        kegiatan: [
          'Penguatan & Kesimpulan Bersama: Guru memberikan penguatan rangkuman materi dan pesan moral KBC.',
          'Apresiasi Positif Guru: Pemberian bintang kebaikan bagi seluruh kelas atas keaktifan dan kesantunan.',
          'Doa penutup majelis keberkahan dan salam kasih penuh kehangatan.'
        ]
      }
    }
  );

  // Seksi 6 & 7: Assesmen & LKPD & Media
  const [assesmen, setAssesmen] = useState(
    initialModul?.assesmen || {
      teknikAssesmen: 'Asesmen Formatif (Observasi Perilaku) & Sumatif (Kuis Digital).',
      rubrikAssesmenSikapCinta: 'Skor 1-4 untuk tutur kata santun dan empati.',
      instrumenPenilaian: 'Lembar observasi dan format penilaian LKPD.',
      lkpd: {
        judulLkpd: 'LKPD Mandiri: Jejak Kasih Sayang Ar-Rahman',
        petunjuk: 'Kerjakan tugas dengan jujur dan ceria!',
        tugasAktivitas: [
          'Lingkarilah gambar perilaku pengasih.',
          'Tuliskan 3 kebaikan yang kamu lakukan hari ini.'
        ],
        pertanyaanDiskusi: ['Mengapa kita harus menyayangi teman?'],
        lembarRefleksiSiswa: 'Saya merasa gembira dan ingin selalu bersikap lembut.'
      },
      mediaDigital: {
        soalKuis: [
          {
            id: 'q1',
            pertanyaan: 'Ar-Rahman artinya Allah Maha...',
            pilihan: ['Pengasih', 'Penyayang', 'Pencipta', 'Pengampun'],
            kunciJawaban: 0,
            penjelasanKbc: 'Ar-Rahman berarti Maha Pengasih bagi seluruh makhluk.'
          }
        ],
        materiInteraktif: {
          ringkasanRingkas: 'Ar-Rahman mengajarkan kasih sayang tanpa membeda-bedakan.',
          poinPenting: ['Pengasih tanpa batas', 'Mencintai ciptaan Allah'],
          flashcards: [{ id: 'f1', depan: 'Arti Ar-Rahman?', belakang: 'Maha Pengasih' }]
        },
        gambarInteraktif: {
          deskripsiVisual: 'Ilustrasi kelas madrasah yang penuh senyum dan kehangatan.',
          promptGambar: 'Vector illustration of young Muslim students in class smiling and helping each other.'
        }
      }
    }
  );

  const [isGeneratingQuizMedia, setIsGeneratingQuizMedia] = useState(false);

  const handleAutoGenerateQuizMedia = async () => {
    setIsGeneratingQuizMedia(true);
    try {
      const data = await safeFetchJson('/api/generate-quiz-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mataPelajaran: identitas.mataPelajaran,
          materi: identitas.materi,
          faseKelas: identitas.faseKelas
        })
      });

      if (data.success && data.mediaDigital) {
        setAssesmen(prev => ({
          ...prev,
          mediaDigital: data.mediaDigital
        }));
      }
    } catch (err) {
      console.error('Gagal generate quiz media di wizard:', err);
    } finally {
      setIsGeneratingQuizMedia(false);
    }
  };
  const handleAddTP = () => {
    setDesain(prev => ({
      ...prev,
      tujuanPembelajaran: [...prev.tujuanPembelajaran, 'Tujuan Pembelajaran Baru']
    }));
  };

  const handleRemoveTP = (idx: number) => {
    setDesain(prev => ({
      ...prev,
      tujuanPembelajaran: prev.tujuanPembelajaran.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateTP = (idx: number, val: string) => {
    const updated = [...desain.tujuanPembelajaran];
    updated[idx] = val;
    setDesain(prev => ({ ...prev, tujuanPembelajaran: updated }));
  };

  // Helper for Quiz editing
  const handleAddQuiz = () => {
    const newQ: SoalKuis = {
      id: `q-${Date.now()}`,
      pertanyaan: 'Pertanyaan kuis baru...',
      pilihan: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
      kunciJawaban: 0,
      penjelasanKbc: 'Penjelasan KBC untuk soal ini...'
    };
    setAssesmen(prev => ({
      ...prev,
      mediaDigital: {
        ...prev.mediaDigital,
        soalKuis: [...prev.mediaDigital.soalKuis, newQ]
      }
    }));
  };

  const handleRemoveQuiz = (id: string) => {
    setAssesmen(prev => ({
      ...prev,
      mediaDigital: {
        ...prev.mediaDigital,
        soalKuis: prev.mediaDigital.soalKuis.filter(q => q.id !== id)
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const finalModul: ModulAjarCinta = {
      id: initialModul?.id || `modul-manual-${Date.now()}`,
      judul: judul || `Modul Ajar KBC ${identitas.mataPelajaran} - ${identitas.materi}`,
      modeBuat: 'MANUAL',
      createdAt: initialModul?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      identitas,
      identifikasi,
      desainPembelajaran: desain,
      kerangkaPembelajaran: kerangka,
      pengalamanBelajar: pengalaman,
      assesmen,
      kopSurat,
      ttd
    };

    onSave(finalModul);
    setIsSaving(false);
    setIsSaved(true);
    setToastMessage('Modul Ajar KBC Berhasil Disimpan!');
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80] overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      <AnimatedToast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
        duration={3500}
      />
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] text-slate-800 text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 p-4 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <h3 className="font-black text-white text-sm">Mode 2: Editor Manual Wizard Modul KBC</h3>
            <p className="text-[10px] text-emerald-100 font-medium">Penyusunan mandiri 7 seksi modul ajar berbasis Kurikulum Berbasis Cinta</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => handleSubmit(e)}
              disabled={isSaving}
              className={`font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer ${
                isSaved
                  ? 'bg-emerald-300 text-emerald-950 ring-2 ring-white scale-105'
                  : isSaving
                  ? 'bg-emerald-600 text-white opacity-80 cursor-wait'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white active:scale-95'
              }`}
              title="Simpan perubahan modul sekarang"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-900" />
                  <span>✓ Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Modul</span>
                </>
              )}
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wizard Steps Bar */}
        <div className="flex overflow-x-auto bg-slate-100 border-b border-slate-200 p-2 space-x-1 shrink-0 text-[10px]">
          {[
            { id: 1, label: '1. Identitas' },
            { id: 2, label: '2. Identifikasi' },
            { id: 3, label: '3. Desain TP' },
            { id: 4, label: '4. Kerangka' },
            { id: 5, label: '5. Langkah Kegiatan' },
            { id: 6, label: '6. Asesmen & LKPD' },
            { id: 7, label: '7. Kuis & Media' }
          ].map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStep(s.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeStep === s.id
                  ? 'bg-emerald-600 text-white shadow-xs font-bold border border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50 text-slate-800">
          {/* STEP 1: IDENTITAS */}
          {activeStep === 1 && (
            <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs text-slate-800">
              <h4 className="font-extrabold text-emerald-800 text-xs uppercase border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>SEKSI 1: IDENTITAS MODUL</span>
                <span className="text-[10px] font-normal text-slate-500 normal-case">Lengkapi data pokok modul</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-800 font-bold">Judul Modul Ajar</label>
                  <input
                    type="text"
                    value={judul}
                    onChange={e => setJudul(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-800 font-bold">Nama Madrasah (Seksi Identitas)</label>
                  <input
                    type="text"
                    value={identitas.namaMadrasah}
                    onChange={e => setIdentitas({ ...identitas, namaMadrasah: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-500">Terpisah dari Kop Surat dokumen.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-800 font-bold">Mata Pelajaran</label>
                  <select
                    value={identitas.mataPelajaran}
                    onChange={e => {
                      const newMapel = e.target.value;
                      const matching = materiList.filter(m => m.mataPelajaran === newMapel);
                      if (matching.length > 0) {
                        setIdentitas({
                          ...identitas,
                          mataPelajaran: newMapel,
                          materi: matching[0].judulMateri,
                          faseKelas: matching[0].faseKelas || identitas.faseKelas
                        });
                      } else {
                        setIdentitas({ ...identitas, mataPelajaran: newMapel });
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none"
                  >
                    {loadMasterMapelList().map((m, i) => (
                      <option key={i} value={m} className="bg-white text-slate-900">{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-800 font-bold block">Materi Utama / Pokok Bahasan</label>
                    {materiList && materiList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowMateriPicker(true)}
                        className="text-[10px] bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-lg flex items-center space-x-1 transition-all"
                      >
                        <BookMarked className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Semua Bank Materi ({materiList.length})</span>
                      </button>
                    )}
                  </div>

                  {materiList.filter(item => item.mataPelajaran === identitas.mataPelajaran).length > 0 ? (
                    <div className="space-y-2">
                      <div className="bg-white border border-emerald-300 rounded-xl p-2.5 space-y-1">
                        <label className="text-[10px] text-emerald-800 font-extrabold block">
                          📌 Pilih Topik dari Kelola Materi ({identitas.mataPelajaran}):
                        </label>
                        <select
                          value={materiList.some(m => m.mataPelajaran === identitas.mataPelajaran && m.judulMateri === identitas.materi) ? identitas.materi : '__custom__'}
                          onChange={e => {
                            const val = e.target.value;
                            if (val !== '__custom__') {
                              const found = materiList.find(m => m.mataPelajaran === identitas.mataPelajaran && m.judulMateri === val);
                              if (found) {
                                setIdentitas({
                                  ...identitas,
                                  materi: found.judulMateri,
                                  faseKelas: found.faseKelas || identitas.faseKelas
                                });
                              }
                            }
                          }}
                          className="w-full bg-slate-50 border border-emerald-400 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {materiList.filter(m => m.mataPelajaran === identitas.mataPelajaran).map((item, idx) => (
                            <option key={`${item.id}-${idx}`} value={item.judulMateri} className="bg-white text-slate-900">
                              {item.judulMateri} ({item.faseKelas.replace('Fase B (', '').replace(')', '')})
                            </option>
                          ))}
                          <option value="__custom__" className="bg-white text-slate-900">✏️ Ketik Topik Baru / Kustom...</option>
                        </select>
                      </div>

                      <input
                        type="text"
                        value={identitas.materi}
                        onChange={e => setIdentitas({ ...identitas, materi: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={identitas.materi}
                      onChange={e => setIdentitas({ ...identitas, materi: e.target.value })}
                      placeholder="misal: Meneladani Sifat Ar-Rahman"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-slate-800 font-bold block">Fase / Kelas</label>
                  <input
                    type="text"
                    value={identitas.faseKelas}
                    onChange={e => setIdentitas({ ...identitas, faseKelas: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-800 font-bold block">Tahun Pelajaran (Aktif Pengaturan)</label>
                  <select
                    value={identitas.tahunPelajaran || loadActiveTahunAjaran()}
                    onChange={e => setIdentitas({ ...identitas, tahunPelajaran: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-semibold transition-all"
                  >
                    {allTahunAjaranList.map((t, idx) => (
                      <option key={idx} value={t} className="bg-white text-slate-900">{t} {t === loadActiveTahunAjaran() ? '(Aktif)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-800 font-bold block">Semester, Alokasi Waktu, & Tanggal Pelaksanaan</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={identitas.semester}
                      onChange={e => setIdentitas({ ...identitas, semester: e.target.value as any })}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none text-xs sm:text-sm"
                    >
                      <option value="Ganjil (1)" className="bg-white text-slate-900">Ganjil (1)</option>
                      <option value="Genap (2)" className="bg-white text-slate-900">Genap (2)</option>
                    </select>
                    <input
                      type="text"
                      value={identitas.alokasiWaktu}
                      onChange={e => setIdentitas({ ...identitas, alokasiWaktu: e.target.value })}
                      placeholder="Alokasi Waktu (2 x 35 Menit)"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none text-xs sm:text-sm"
                      required
                    />
                    <input
                      type="text"
                      value={identitas.tanggalPelaksanaan || ''}
                      onChange={e => setIdentitas({ ...identitas, tanggalPelaksanaan: e.target.value })}
                      placeholder="Tanggal Pelaksanaan (mis: 12 Ags 2026)"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none text-xs sm:text-sm border-emerald-300 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: IDENTIFIKASI */}
          {activeStep === 2 && (
            <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-emerald-800 text-xs uppercase border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>SEKSI 2: IDENTIFIKASI & INTEGRASI KBC</span>
                <span className="text-[10px] text-slate-500 font-normal">5 Komponen Utama</span>
              </h4>
              <div className="space-y-4">
                {/* 1. Kesiapan Murid */}
                <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50">
                  <label className="text-slate-800 font-bold block text-xs">1. Kesiapan Murid (Asesmen Diagnostik & Diferensiasi)</label>
                  <p className="text-[10px] text-slate-500">Jabarkan kriteria pemahaman, analisis kemampuan, serta strategi diferensiasi dan pendekatan KBC untuk tiap kategori:</p>
                  <div className="grid grid-cols-1 gap-2 pl-1">
                    <div>
                      <label className="text-emerald-700 font-bold text-[11px] block mb-1">Paham Utuh (Kategori Mahir):</label>
                      <textarea
                        rows={3}
                        value={identifikasi.kesiapanMurid.pahamUtuh}
                        onChange={e =>
                          setIdentifikasi({
                            ...identifikasi,
                            kesiapanMurid: { ...identifikasi.kesiapanMurid, pahamUtuh: e.target.value }
                          })
                        }
                        placeholder="Jabarkan karakteristik pemahaman utuh dan bentuk tantangan pengayaan/tutor sebaya..."
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 text-xs leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="text-amber-700 font-bold text-[11px] block mb-1">Paham Sebagian (Kategori Berkembang):</label>
                      <textarea
                        rows={3}
                        value={identifikasi.kesiapanMurid.pahamSebagian}
                        onChange={e =>
                          setIdentifikasi({
                            ...identifikasi,
                            kesiapanMurid: { ...identifikasi.kesiapanMurid, pahamSebagian: e.target.value }
                          })
                        }
                        placeholder="Jabarkan bagian yang dipahami vs yang membutuhkan bimbingan terarah..."
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 text-xs leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="text-rose-700 font-bold text-[11px] block mb-1">Belum Paham (Kategori Perlu Intervensi):</label>
                      <textarea
                        rows={3}
                        value={identifikasi.kesiapanMurid.belumPaham}
                        onChange={e =>
                          setIdentifikasi({
                            ...identifikasi,
                            kesiapanMurid: { ...identifikasi.kesiapanMurid, belumPaham: e.target.value }
                          })
                        }
                        placeholder="Jabarkan hambatan dasar dan kebutuhan scaffolding personal intensif..."
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Materi Pelajaran */}
                <div className="space-y-2 border border-slate-200 p-3.5 rounded-xl bg-slate-50">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <label className="text-slate-800 font-bold block text-xs flex items-center gap-1.5">
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">6 Poin Sub-Bab</span>
                        <span>2. Seksi Materi Pelajaran (Uraian Runtut, Detail, & Komprehensif)</span>
                      </label>
                      <p className="text-[10px] text-slate-500 mt-0.5">Jabarkan uraian materi pelajaran secara komprehensif mencakup 6 poin utama agar modul bernilai akademis & afektif tinggi.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const template6Poin = getTemplate6SubBab(identitas.mataPelajaran, identitas.materi);
                        setIdentifikasi({ ...identifikasi, materiPelajaran: template6Poin });
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-lg transition-all flex items-center gap-1 shadow-xs"
                    >
                      <span>✨ Sisipkan Template 6 Sub-Bab</span>
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={identifikasi.materiPelajaran || ''}
                    onChange={e => setIdentifikasi({ ...identifikasi, materiPelajaran: e.target.value })}
                    placeholder="Uraikan materi pelajaran secara terstruktur dan runtut..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-900 text-xs leading-relaxed focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Optimasi Profil & Panca Cinta Banner */}
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-rose-50 border border-emerald-200/80 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Optimasi Profil Pancasila & Panca Cinta
                    </span>
                    <p className="text-[10px] text-slate-600">
                      Rekomendasikan poin & uraian yang paling relevan secara otomatis berdasarkan materi: <strong className="text-slate-900">{identitas.materi || 'Materi Saat Ini'}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const recommended = getRecommendedPancasilaAndPancaCinta(identitas.mataPelajaran, identitas.materi);
                      setIdentifikasi(prev => ({
                        ...prev,
                        dimensiProfilLulusan: recommended.dimensiProfilLulusan,
                        topikPancaCinta: recommended.topikPancaCinta
                      }));
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    🎯 Rekomendasikan Poin & Uraian
                  </button>
                </div>

                {/* 3. Dimensi Profil Lulusan */}
                <div className="space-y-3 border border-slate-200 p-3.5 rounded-xl bg-slate-50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 border-b border-slate-200 pb-2">
                    <div>
                      <label className="text-slate-800 font-bold block text-xs">
                        3. Dimensi Profil Lulusan (Profil Pelajar Pancasila & Rahmatan lil 'Alamin)
                      </label>
                      <p className="text-[10px] text-slate-500">Pilih karakter yang relevan dan lengkapi uraian penjelasannya sesuai materi:</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = identifikasi.dimensiProfilLulusan.map(item => {
                          const title = item.split(':')[0].trim();
                          return `${title}: ${getDefaultProfilDesc(title, identitas.materi)}`;
                        });
                        setIdentifikasi({ ...identifikasi, dimensiProfilLulusan: updated });
                      }}
                      className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      title="Perbarui uraian teks menyesuaikan judul materi saat ini"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      ✨ Perbarui Uraian Sesuai Materi
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {PROFIL_LULUSAN_OPTIONS.map((option, idx) => {
                      const foundIdx = identifikasi.dimensiProfilLulusan.findIndex(item => item.startsWith(option) || item.split(':')[0].trim() === option);
                      const isChecked = foundIdx !== -1;

                      return (
                        <label
                          key={idx}
                          className={`flex items-center space-x-2 p-2 rounded-lg border text-[11px] cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                const updated = identifikasi.dimensiProfilLulusan.filter((_, i) => i !== foundIdx);
                                setIdentifikasi({ ...identifikasi, dimensiProfilLulusan: updated });
                              } else {
                                const newUraian = `${option}: ${getDefaultProfilDesc(option, identitas.materi)}`;
                                setIdentifikasi({ ...identifikasi, dimensiProfilLulusan: [...identifikasi.dimensiProfilLulusan, newUraian] });
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* List of Uraian Editor Cards for Profil Lulusan */}
                  {identifikasi.dimensiProfilLulusan.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Uraian Penjelasan Relevansi Profil Pancasila dengan Materi:
                      </span>
                      {identifikasi.dimensiProfilLulusan.map((item, idx) => {
                        const parts = item.split(':');
                        const title = parts[0]?.trim() || '';
                        const desc = parts.slice(1).join(':').trim();

                        return (
                          <div key={idx} className="bg-white border border-emerald-200 rounded-lg p-2.5 shadow-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                                {title}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = identifikasi.dimensiProfilLulusan.filter((_, i) => i !== idx);
                                  setIdentifikasi({ ...identifikasi, dimensiProfilLulusan: updated });
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors text-xs cursor-pointer"
                                title="Hapus poin ini"
                              >
                                ✕
                              </button>
                            </div>
                            <div>
                              <textarea
                                rows={2}
                                value={desc}
                                onChange={e => {
                                  const newText = `${title}: ${e.target.value}`;
                                  const updated = [...identifikasi.dimensiProfilLulusan];
                                  updated[idx] = newText;
                                  setIdentifikasi({ ...identifikasi, dimensiProfilLulusan: updated });
                                }}
                                placeholder={`Uraikan bagaimana ${title} ditumbuhkan pada materi ${identitas.materi}...`}
                                className="w-full bg-slate-50/80 border border-slate-200 rounded-md p-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 leading-relaxed"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Topik Panca Cinta */}
                <div className="space-y-3 border border-slate-200 p-3.5 rounded-xl bg-slate-50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 border-b border-slate-200 pb-2">
                    <div>
                      <label className="text-slate-800 font-bold block text-xs">
                        4. Topik Panca Cinta (Pilar KBC)
                      </label>
                      <p className="text-[10px] text-slate-500">Pilih pilar Panca Cinta yang diintegrasikan beserta uraian keterkaitannya:</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = identifikasi.topikPancaCinta.map(item => {
                          const title = item.split(':')[0].trim();
                          return `${title}: ${getDefaultPancaCintaDesc(title, identitas.materi)}`;
                        });
                        setIdentifikasi({ ...identifikasi, topikPancaCinta: updated });
                      }}
                      className="text-[11px] font-semibold text-rose-700 bg-rose-100/80 hover:bg-rose-200 px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      title="Perbarui uraian teks menyesuaikan judul materi saat ini"
                    >
                      <Sparkles className="w-3 h-3 text-rose-600" />
                      ✨ Perbarui Uraian Sesuai Materi
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {PANCA_CINTA_OPTIONS.map((option, idx) => {
                      const foundIdx = identifikasi.topikPancaCinta.findIndex(item => item.startsWith(option) || item.split(':')[0].trim() === option);
                      const isChecked = foundIdx !== -1;

                      return (
                        <label
                          key={idx}
                          className={`flex items-center space-x-2 p-2 rounded-lg border text-[11px] cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                const updated = identifikasi.topikPancaCinta.filter((_, i) => i !== foundIdx);
                                setIdentifikasi({ ...identifikasi, topikPancaCinta: updated });
                              } else {
                                const newUraian = `${option}: ${getDefaultPancaCintaDesc(option, identitas.materi)}`;
                                setIdentifikasi({ ...identifikasi, topikPancaCinta: [...identifikasi.topikPancaCinta, newUraian] });
                              }
                            }}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                          />
                          <span>♥ {option}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* List of Uraian Editor Cards for Topik Panca Cinta */}
                  {identifikasi.topikPancaCinta.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Uraian Penjelasan Relevansi Panca Cinta dengan Materi:
                      </span>
                      {identifikasi.topikPancaCinta.map((item, idx) => {
                        const parts = item.split(':');
                        const title = parts[0]?.trim() || '';
                        const desc = parts.slice(1).join(':').trim();

                        return (
                          <div key={idx} className="bg-white border border-rose-200 rounded-lg p-2.5 shadow-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span className="text-rose-600">♥</span>
                                <span>{title}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = identifikasi.topikPancaCinta.filter((_, i) => i !== idx);
                                  setIdentifikasi({ ...identifikasi, topikPancaCinta: updated });
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors text-xs cursor-pointer"
                                title="Hapus pilar ini"
                              >
                                ✕
                              </button>
                            </div>
                            <div>
                              <textarea
                                rows={2}
                                value={desc}
                                onChange={e => {
                                  const newText = `${title}: ${e.target.value}`;
                                  const updated = [...identifikasi.topikPancaCinta];
                                  updated[idx] = newText;
                                  setIdentifikasi({ ...identifikasi, topikPancaCinta: updated });
                                }}
                                placeholder={`Uraikan bagaimana ${title} dipraktikkan pada materi ${identitas.materi}...`}
                                className="w-full bg-slate-50/80 border border-slate-200 rounded-md p-2 text-xs text-slate-900 focus:bg-white focus:border-rose-500 leading-relaxed"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Materi Integrasi KBC */}
                <div className="space-y-1.5 border border-slate-200 p-3 rounded-xl bg-slate-50">
                  <label className="text-slate-800 font-bold block text-xs">
                    5. Materi Integrasi KBC (Kurikulum Berbasis Cinta)
                  </label>
                  <textarea
                    rows={3}
                    value={identifikasi.materiIntegrasiKBC}
                    onChange={e => setIdentifikasi({ ...identifikasi, materiIntegrasiKBC: e.target.value })}
                    placeholder="Deskripsikan nilai-nilai kasih sayang, empati, dan sikap cinta..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DESAIN PEMBELAJARAN */}
          {activeStep === 3 && (
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-emerald-800 text-xs uppercase border-b border-slate-200 pb-2">
                SEKSI 3: DESAIN PEMBELAJARAN (CP, TP & LINTAS DISIPLIN)
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-slate-700 font-semibold block text-xs mb-1">Capaian Pembelajaran (CP)</label>
                  <textarea
                    rows={3}
                    value={desain.capaianPembelajaran}
                    onChange={e => setDesain({ ...desain, capaianPembelajaran: e.target.value })}
                    placeholder="Uraikan CP secara lengkap mencakup ranah pengetahuan, keterampilan, dan karakter afektif KBC..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block text-xs mb-1">Lintas Disiplin Ilmu (Keterkaitan Antar Mata Pelajaran)</label>
                  <textarea
                    rows={3}
                    value={desain.lintasDisiplinIlmu}
                    onChange={e => setDesain({ ...desain, lintasDisiplinIlmu: e.target.value })}
                    placeholder="Uraikan keterkaitan dengan mata pelajaran lain..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 text-xs leading-relaxed"
                  />
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-semibold text-xs">Tujuan Pembelajaran (TP & ATP Berbasis Cinta)</label>
                    <button
                      type="button"
                      onClick={handleAddTP}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah TP</span>
                    </button>
                  </div>
                  {desain.tujuanPembelajaran.map((tp, idx) => (
                    <div key={idx} className="flex items-start space-x-2 my-1.5">
                      <span className="text-slate-500 font-bold text-xs mt-2 min-w-[20px]">{idx + 1}.</span>
                      <textarea
                        rows={2}
                        value={tp}
                        onChange={e => handleUpdateTP(idx, e.target.value)}
                        placeholder="Uraikan Tujuan Pembelajaran spesifik..."
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTP(idx)}
                        className="text-rose-600 hover:text-rose-700 p-1 mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: KERANGKA PEMBELAJARAN */}
          {activeStep === 4 && (
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-emerald-800 text-xs uppercase border-b border-slate-200 pb-2">
                SEKSI 4: KERANGKA PEMBELAJARAN
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-slate-700 font-semibold block">Praktek Pedagogik</label>
                  <input
                    type="text"
                    value={kerangka.praktekPedagogik}
                    onChange={e => setKerangka({ ...kerangka, praktekPedagogik: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block">Kemitraan Pembelajaran</label>
                  <input
                    type="text"
                    value={kerangka.kemitraanPembelajaran}
                    onChange={e => setKerangka({ ...kerangka, kemitraanPembelajaran: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block">Lingkungan Pembelajaran</label>
                  <input
                    type="text"
                    value={kerangka.lingkunganPembelajaran}
                    onChange={e => setKerangka({ ...kerangka, lingkunganPembelajaran: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block">Pemanfaatan Digital</label>
                  <input
                    type="text"
                    value={kerangka.pemanfaatanDigital}
                    onChange={e => setKerangka({ ...kerangka, pemanfaatanDigital: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: LANGKAH KEGIATAN */}
          {activeStep === 5 && (
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-bold text-emerald-800 text-xs uppercase flex items-center gap-1.5">
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">5 Langkah</span>
                    <span>SEKSI 5: PENGALAMAN BELAJAR (LANGKAH-LANGKAH DETAIL & KOMPREHENSIF)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Uraikan deskripsi langkah pembelajaran secara rinci, terstruktur, dan komprehensif dari Kegiatan Awal hingga Penutup. (Satu poin per baris)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const materiStr = identitas.materi || 'pelajaran';
                    setPengalaman({
                      kegiatanAwal: {
                        durasi: '10 Menit',
                        kegiatan: [
                          'Guru membuka pembelajaran dengan sapaan hangat: "Assalamu’alaikum anak-anakku yang disayangi Allah SWT", dilanjutkan pembiasaan budaya 5S (Senyum, Sapa, Salam, Sopan, Santun).',
                          'Berdoa bersama dipimpin oleh ketua kelas dengan khusyuk dan penuh penghayatan, dilanjutkan melantunkan doa bersuci dan hafalan ayat pilihan.',
                          'Pemeriksaan Kesiapan Belajar & Emotion Check-in: Guru mengecek kondisi perasaan murid pada papan refleksi emosi kelas.',
                          `Apersepsi Penuh Cinta: Guru menyajikan cerita/gambar pemantik interaktif terkait materi ${materiStr} dan bertanya jawab tentang penerapannya di lingkungan sehari-hari.`,
                          'Penyampaian Tujuan & Motivasi KBC: Guru menyampaikan tujuan pembelajaran, alur kegiatan harian, serta memberikan dorongan motivasi KBC.'
                        ]
                      },
                      kegiatanInti: {
                        durasi: '45 Menit',
                        kegiatan: [
                          `Eksplorasi Konsep & Literasi KBC: Peserta didik menyimak paparan materi ${materiStr} secara mendalam melalui teks bacaan/bahan ajar KBC dan ilustrasi visual.`,
                          'Tanya Jawab & Identifikasi Masalah: Guru memfasilitasi diskusi interaktif dengan pertanyaan bernalar kritis untuk merangsang kepekaan afektif murid.',
                          'Pengelompokan Heterogen Ramah Anak: Peserta didik dibagi menjadi kelompok-kelompok kecil (Kelompok Cinta) yang inklusif.',
                          'Investigasi & Diskusi Kolaboratif: Dalam kelompok, murid mendiskusikan lembar kerja, mengamati gambar peristiwa, dan merumuskan langkah kebaikan yang tepat.',
                          'Bimbingan Terarah & Diferensiasi (Scaffolding): Guru mendampingi kelompok secara bergantian, memberikan kartu bantuan bagi yang memerlukan, serta tantangan tutor sebaya bagi murid mahir.',
                          'Peragaan & Simulasi Nyata: Masing-masing kelompok mensimulasikan atau memeragakan tata cara/aksi kebaikan di depan kelas secara langsung.',
                          'Presentasi Penuh Apresiasi: Masing-masing kelompok menyampaikan hasil diskusi di depan kelas, kelompok lain memberikan tepuk kasih sayang KBC dan pujian tulus.',
                          'Penguatan Digital & Media Interaktif: Guru mengonfirmasi pemahaman konsep siswa melalui tayangan flashcard interaktif dan latihan kuis digital.'
                        ]
                      },
                      mengaplikasi: {
                        durasi: '10 Menit',
                        kegiatan: [
                          'Praktik Nyata Berpasangan: Peserta didik berpasangan dengan teman di sebelahnya, bertukar senyum ramah dan menyampaikan kalimat apresiasi tulus.',
                          'Pembuatan Karya "Pohon Cinta": Masing-masing siswa menuliskan satu komitmen kebaikan harian di lembar Daun Cinta dan menempelkannya di Pohon Cinta KBC.',
                          'Misi Kebaikan Tersembunyi: Mengambil satu kupon tugas kebaikan rahasia dari "Kotak Kebaikan Cinta KBC" untuk dilaksanakan.'
                        ]
                      },
                      merefleksi: {
                        durasi: '5 Menit',
                        kegiatan: [
                          'Kontemplasi & Hening Sejenak: Peserta didik memejamkan mata sejenak diiringi irama instrumen lembut, merenungkan nikmat kesehatan dan ilmu dari Allah SWT.',
                          'Refleksi Emosi & Lembar Refleksi: Murid mengisi lembar refleksi emosi dan menuliskan satu kalimat rasa syukur.',
                          'Saling Mengapresiasi (Peer Appreciation): Murid menyampaikan ucapan terima kasih tulus kepada teman sekelompok atas kerja sama yang hangat.'
                        ]
                      },
                      penutup: {
                        durasi: '10 Menit',
                        kegiatan: [
                          'Rangkuman & Kesimpulan Bersama: Guru bersama murid menyimpulkan poin-poin utama pembelajaran dan pesan moral KBC.',
                          'Apresiasi Positif & Bintang KBC: Guru memberikan pujian dan bintang kebaikan KBC kepada seluruh kelas atas ketertiban dan semangat belajar.',
                          'Tindak Lanjut Jurnal Rumah: Guru memberikan panduan pembiasaan di rumah bersama orang tua melalui Jurnal Kasih Sayang Keluarga.',
                          'Doa Penutup & Salam Kasih: Pembacaan doa Kaffaratul Majlis bersama-sama dan salam kasih kehangatan KBC.'
                        ]
                      }
                    });
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-lg transition-all flex items-center gap-1 shadow-xs"
                >
                  <span>✨ Sisipkan Template Pengalaman Belajar Detail</span>
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-800 text-xs">1. Kegiatan Awal ({pengalaman.kegiatanAwal.durasi})</span>
                  <textarea
                    rows={4}
                    value={pengalaman.kegiatanAwal.kegiatan.join('\n')}
                    onChange={e =>
                      setPengalaman({
                        ...pengalaman,
                        kegiatanAwal: { ...pengalaman.kegiatanAwal, kegiatan: e.target.value.split('\n') }
                      })
                    }
                    placeholder="Satu kegiatan per baris..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs leading-relaxed"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-800 text-xs">2. Kegiatan Inti ({pengalaman.kegiatanInti.durasi})</span>
                  <textarea
                    rows={6}
                    value={pengalaman.kegiatanInti.kegiatan.join('\n')}
                    onChange={e =>
                      setPengalaman({
                        ...pengalaman,
                        kegiatanInti: { ...pengalaman.kegiatanInti, kegiatan: e.target.value.split('\n') }
                      })
                    }
                    placeholder="Satu kegiatan per baris..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs leading-relaxed"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-800 text-xs">3. Mengaplikasi ({pengalaman.mengaplikasi.durasi})</span>
                  <textarea
                    rows={3}
                    value={pengalaman.mengaplikasi.kegiatan.join('\n')}
                    onChange={e =>
                      setPengalaman({
                        ...pengalaman,
                        mengaplikasi: { ...pengalaman.mengaplikasi, kegiatan: e.target.value.split('\n') }
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs leading-relaxed"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-800 text-xs">4. Merefleksi ({pengalaman.merefleksi.durasi})</span>
                  <textarea
                    rows={3}
                    value={pengalaman.merefleksi.kegiatan.join('\n')}
                    onChange={e =>
                      setPengalaman({
                        ...pengalaman,
                        merefleksi: { ...pengalaman.merefleksi, kegiatan: e.target.value.split('\n') }
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs leading-relaxed"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-800 text-xs">5. Penutup ({pengalaman.penutup.durasi})</span>
                  <textarea
                    rows={3}
                    value={pengalaman.penutup.kegiatan.join('\n')}
                    onChange={e =>
                      setPengalaman({
                        ...pengalaman,
                        penutup: { ...pengalaman.penutup, kegiatan: e.target.value.split('\n') }
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: ASESMEN & LKPD */}
          {activeStep === 6 && (
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-emerald-800 text-xs uppercase border-b border-slate-200 pb-2">
                SEKSI 6: ASESMEN & LEMBAR KERJA PESERTA DIDIK (LKPD)
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Teknik & Rubrik Asesmen Sikap Cinta</label>
                  <input
                    type="text"
                    value={assesmen.teknikAssesmen}
                    onChange={e => setAssesmen({ ...assesmen, teknikAssesmen: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 mb-2"
                  />
                  <input
                    type="text"
                    value={assesmen.rubrikAssesmenSikapCinta}
                    onChange={e => setAssesmen({ ...assesmen, rubrikAssesmenSikapCinta: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 pt-2">
                  <h5 className="font-bold text-emerald-800">Penyusunan LKPD Siswa</h5>
                  <div>
                    <label className="text-slate-700 text-[11px] font-bold">Judul LKPD</label>
                    <input
                      type="text"
                      value={assesmen.lkpd.judulLkpd}
                      onChange={e =>
                        setAssesmen({ ...assesmen, lkpd: { ...assesmen.lkpd, judulLkpd: e.target.value } })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 text-[11px] font-bold">Petunjuk LKPD</label>
                    <input
                      type="text"
                      value={assesmen.lkpd.petunjuk}
                      onChange={e =>
                        setAssesmen({ ...assesmen, lkpd: { ...assesmen.lkpd, petunjuk: e.target.value } })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 text-[11px] font-bold">Refleksi Hati Siswa</label>
                    <input
                      type="text"
                      value={assesmen.lkpd.lembarRefleksiSiswa}
                      onChange={e =>
                        setAssesmen({ ...assesmen, lkpd: { ...assesmen.lkpd, lembarRefleksiSiswa: e.target.value } })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: KUIS & MEDIA DIGITAL */}
          {activeStep === 7 && (
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <h4 className="font-bold text-emerald-800 text-xs uppercase">
                  SEKSI 7: MEDIA DIGITAL & SOAL KUIS INTERAKTIF
                </h4>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAutoGenerateQuizMedia}
                    disabled={isGeneratingQuizMedia}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-xs"
                  >
                    {isGeneratingQuizMedia ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-200" />
                        <span>Membuat AI...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>⚡ Auto Isi Kuis & Media AI</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddQuiz}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1 border border-slate-300 font-bold"
                  >
                    <Plus className="w-3 h-3 text-emerald-700" />
                    <span>Tambah Soal</span>
                  </button>
                </div>
              </div>

              {/* Seksi Media Visual & Gambar Interaktif */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Media Gambar & Visual Pembelajaran (Literasi Visual KBC)</span>
                  </h5>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const svgData = getEducationalSvgIllustration(identitas?.materi, identitas?.mataPelajaran);
                        setAssesmen({
                          ...assesmen,
                          mediaDigital: {
                            ...assesmen.mediaDigital,
                            gambarInteraktif: {
                              ...assesmen.mediaDigital?.gambarInteraktif,
                              imageUrl: svgData,
                              deskripsiVisual: assesmen?.mediaDigital?.gambarInteraktif?.deskripsiVisual || `Ilustrasi vektor offline KBC untuk materi ${identitas?.materi || 'pembelajaran'}`
                            }
                          }
                        });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 shadow-xs transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Buat Ilustrasi Vector Offline</span>
                    </button>
                    <label className="bg-teal-700 hover:bg-teal-800 text-white text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 cursor-pointer shadow-xs transition-all">
                      <Upload className="w-3 h-3" />
                      <span>Unggah Gambar Local</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressAndResizeImage(file, 700, 0.75);
                              setAssesmen({
                                ...assesmen,
                                mediaDigital: {
                                  ...assesmen.mediaDigital,
                                  gambarInteraktif: {
                                    ...assesmen.mediaDigital?.gambarInteraktif,
                                    imageUrl: compressed
                                  }
                                }
                              });
                            } catch (err) {
                              console.error('Failed to compress image:', err);
                            }
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-slate-700 font-bold text-[11px]">Deskripsi Visual Ilustrasi (Lengkap):</label>
                    <textarea
                      rows={2}
                      value={assesmen?.mediaDigital?.gambarInteraktif?.deskripsiVisual || ''}
                      onChange={e =>
                        setAssesmen({
                          ...assesmen,
                          mediaDigital: {
                            ...assesmen.mediaDigital,
                            gambarInteraktif: {
                              ...assesmen.mediaDigital?.gambarInteraktif,
                              deskripsiVisual: e.target.value
                            }
                          }
                        })
                      }
                      placeholder="Contoh: Suasana kelas Madrasah Ibtidaiyah yang ramah dan penuh kasih sayang, memperlihatkan anak-anak saling berkolaborasi..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 mt-0.5 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold text-[11px]">Pilih Gambar Preset Pembelajaran (Siap Pakai):</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1">
                      {EDUCATIONAL_IMAGE_PRESETS.map((preset, idx) => (
                        <button
                          key={`${preset.id}-${idx}`}
                          type="button"
                          onClick={() => {
                            setAssesmen({
                              ...assesmen,
                              mediaDigital: {
                                ...assesmen.mediaDigital,
                                gambarInteraktif: {
                                  ...assesmen.mediaDigital?.gambarInteraktif,
                                  imageUrl: preset.url,
                                  promptGambar: preset.prompt,
                                  deskripsiVisual: preset.description
                                }
                              }
                            });
                          }}
                          className="bg-white hover:bg-emerald-50 text-left p-1.5 rounded-lg border border-slate-200 hover:border-emerald-400 text-[10px] space-y-0.5 transition-all"
                        >
                          <span className="font-bold text-emerald-800 block truncate">{preset.category}: {preset.title}</span>
                          <span className="text-slate-500 line-clamp-1 block">{preset.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-slate-700 font-bold text-[11px]">Prompt Generasi Gambar AI:</label>
                      <input
                        type="text"
                        value={assesmen?.mediaDigital?.gambarInteraktif?.promptGambar || ''}
                        onChange={e =>
                          setAssesmen({
                            ...assesmen,
                            mediaDigital: {
                              ...assesmen.mediaDigital,
                              gambarInteraktif: {
                                ...assesmen.mediaDigital?.gambarInteraktif,
                                promptGambar: e.target.value
                              }
                            }
                          })
                        }
                        placeholder="Vector illustration Islamic primary school..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 mt-0.5"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-bold text-[11px]">URL atau Data Gambar:</label>
                      <input
                        type="text"
                        value={assesmen?.mediaDigital?.gambarInteraktif?.imageUrl || ''}
                        onChange={e =>
                          setAssesmen({
                            ...assesmen,
                            mediaDigital: {
                              ...assesmen.mediaDigital,
                              gambarInteraktif: {
                                ...assesmen.mediaDigital?.gambarInteraktif,
                                imageUrl: e.target.value
                              }
                            }
                          })
                        }
                        placeholder="https://... atau data:image/..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 mt-0.5 font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Hotspot Points Section */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 uppercase">Point Informasi Visual (Hotspots Interaktif):</span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentHotspots = assesmen?.mediaDigital?.gambarInteraktif?.hotspots || [];
                        const nextNum = currentHotspots.length + 1;
                        const newHs = {
                          x: Math.min(80, 25 * nextNum),
                          y: Math.min(80, 30 + 10 * nextNum),
                          judul: `Poin Informasi #${nextNum}`,
                          penjelasan: `Penjelasan detail poin visual ke-${nextNum} untuk mendukung pemahaman murid.`
                        };
                        setAssesmen({
                          ...assesmen,
                          mediaDigital: {
                            ...assesmen.mediaDigital,
                            gambarInteraktif: {
                              ...assesmen.mediaDigital?.gambarInteraktif,
                              hotspots: [...currentHotspots, newHs]
                            }
                          }
                        });
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Point Hotspot</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {((assesmen?.mediaDigital?.gambarInteraktif?.hotspots) || []).map((hs, hsIdx) => (
                      <div key={hsIdx} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center space-x-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {hsIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={hs.judul}
                          onChange={e => {
                            const updatedHs = [...(assesmen?.mediaDigital?.gambarInteraktif?.hotspots || [])];
                            if (updatedHs[hsIdx]) updatedHs[hsIdx].judul = e.target.value;
                            setAssesmen({
                              ...assesmen,
                              mediaDigital: {
                                ...assesmen.mediaDigital,
                                gambarInteraktif: {
                                  ...assesmen.mediaDigital?.gambarInteraktif,
                                  hotspots: updatedHs
                                }
                              }
                            });
                          }}
                          placeholder="Judul Poin"
                          className="w-1/3 bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 font-bold"
                        />
                        <input
                          type="text"
                          value={hs.penjelasan}
                          onChange={e => {
                            const updatedHs = [...(assesmen?.mediaDigital?.gambarInteraktif?.hotspots || [])];
                            if (updatedHs[hsIdx]) updatedHs[hsIdx].penjelasan = e.target.value;
                            setAssesmen({
                              ...assesmen,
                              mediaDigital: {
                                ...assesmen.mediaDigital,
                                gambarInteraktif: {
                                  ...assesmen.mediaDigital?.gambarInteraktif,
                                  hotspots: updatedHs
                                }
                              }
                            });
                          }}
                          placeholder="Penjelasan Detail Visual"
                          className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedHs = (assesmen?.mediaDigital?.gambarInteraktif?.hotspots || []).filter((_, idx) => idx !== hsIdx);
                            setAssesmen({
                              ...assesmen,
                              mediaDigital: {
                                ...assesmen.mediaDigital,
                                gambarInteraktif: {
                                  ...assesmen.mediaDigital?.gambarInteraktif,
                                  hotspots: updatedHs
                                }
                              }
                            });
                          }}
                          className="text-rose-600 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Image Preview in Wizard */}
                {(() => {
                  const promptFallback = assesmen?.mediaDigital?.gambarInteraktif?.promptGambar || `Vector illustration of Islamic primary school lesson ${identitas?.materi || 'pembelajaran'}, child friendly`;
                  const displayImg = getReliableImageUrl(
                    assesmen?.mediaDigital?.gambarInteraktif?.imageUrl,
                    promptFallback,
                    identitas?.materi,
                    identitas?.mataPelajaran
                  );
                  return (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase">
                        <span>Pratinjau Visual Gambar Pembelajaran:</span>
                        <span className="text-emerald-700 text-[10px]">✔ Tampil Utuh dalam Cetak &amp; Interaktif</span>
                      </div>
                      <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center justify-center min-h-[160px]">
                        <img
                          src={displayImg}
                          alt="Pratinjau Media Gambar"
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e, identitas?.materi, identitas?.mataPelajaran)}
                          className="max-h-56 w-full object-contain rounded-lg border border-slate-300 mx-auto shadow-xs bg-white"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-3">
                <p className="font-bold text-xs text-slate-800 uppercase">Daftar Soal Kuis Interaktif:</p>
                {(assesmen?.mediaDigital?.soalKuis || []).map((q, qIdx) => (
                  <div key={`${q.id || 'q'}-${qIdx}`} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800">Soal Kuis #{qIdx + 1}</span>
                      {(assesmen?.mediaDigital?.soalKuis || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuiz(q.id)}
                          className="text-rose-600 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.pertanyaan}
                      onChange={e => {
                        const updated = [...(assesmen?.mediaDigital?.soalKuis || [])];
                        if (updated[qIdx]) {
                          updated[qIdx].pertanyaan = e.target.value;
                        }
                        setAssesmen({
                          ...assesmen,
                          mediaDigital: {
                            ...assesmen.mediaDigital,
                            soalKuis: updated
                          }
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              className="bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold"
            >
              Kembali
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-700 text-white ring-4 ring-emerald-300 scale-105'
                    : isSaving
                    ? 'bg-emerald-700 text-white opacity-80 cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan Modul...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>✓ Modul Berhasil Disimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Modul</span>
                  </>
                )}
              </button>

              {activeStep < 7 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => Math.min(7, prev + 1))}
                  className="bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Lanjut Ke Seksi {activeStep + 1}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Picker Modal Overlay */}
      {showMateriPicker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[90] p-3 sm:p-6 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xl relative">
            <MateriBankManager
              materiList={materiList}
              onSaveMateriList={() => {}}
              isPickerMode={true}
              onPickMateri={handlePickMateri}
              onCloseModal={() => setShowMateriPicker(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
