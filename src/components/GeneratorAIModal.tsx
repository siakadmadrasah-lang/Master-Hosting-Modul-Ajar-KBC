import React, { useState, useEffect } from 'react';
import { ModulAjarCinta, KopSuratSettings, TTDSettings, MAPEL_MI_OPTIONS, PANCA_CINTA_OPTIONS, MateriBankItem, DEFAULT_TAHUN_AJARAN_OPTIONS } from '../types';
import { loadCustomTahunAjaran, saveCustomTahunAjaran, loadActiveTahunAjaran, loadMasterMapelList } from '../utils/storage';
import { getDefaultProfilDesc, getDefaultPancaCintaDesc } from '../utils/pancasilaPancaCinta';
import { safeFetchJson } from '../utils/apiHelper';
import { Sparkles, Wand2, ArrowLeft, CheckCircle2, AlertCircle, Loader2, BookMarked, PlusCircle } from 'lucide-react';
import { MateriBankManager } from './MateriBankManager';

interface GeneratorAIModalProps {
  kopSurat: KopSuratSettings;
  ttd: TTDSettings;
  apiKey: string;
  materiList?: MateriBankItem[];
  initialMateri?: MateriBankItem | null;
  customMapelList?: string[];
  onSuccess: (newModul: ModulAjarCinta) => void;
  onClose: () => void;
}

export const GeneratorAIModal: React.FC<GeneratorAIModalProps> = ({
  kopSurat,
  ttd,
  apiKey,
  materiList = [],
  initialMateri,
  customMapelList = [],
  onSuccess,
  onClose
}) => {
  const [judulModul, setJudulModul] = useState<string>(
    initialMateri
      ? `Modul Ajar KBC ${initialMateri.mataPelajaran} - ${initialMateri.judulMateri}`
      : 'Modul Ajar KBC Akidah Akhlak - Meneladani Sifat Ar-Rahman dalam Kasih Sayang'
  );
  const [namaMadrasah, setNamaMadrasah] = useState<string>(
    initialMateri?.namaMadrasah || 'MI Ma\'arif NU 2 Sanggreman'
  );
  const [mataPelajaran, setMataPelajaran] = useState<string>(initialMateri?.mataPelajaran || 'Akidah Akhlak');
  const [materi, setMateri] = useState<string>(initialMateri?.judulMateri || 'Meneladani Sifat Ar-Rahman (Maha Pengasih) dalam Kasih Sayang Sesama');
  const [faseKelas, setFaseKelas] = useState<string>(initialMateri?.faseKelas || 'Fase B (Kelas III MI)');
  const [semester, setSemester] = useState<'Ganjil (1)' | 'Genap (2)'>('Ganjil (1)');
  const [tahunPelajaran, setTahunPelajaran] = useState<string>(() => loadActiveTahunAjaran());
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<string[]>([]);

  useEffect(() => {
    setTahunAjaranOptions(loadCustomTahunAjaran());
    setTahunPelajaran(loadActiveTahunAjaran());
  }, [initialMateri]);

  const allTahunAjaranList = Array.from(new Set([loadActiveTahunAjaran(), ...tahunAjaranOptions, ...DEFAULT_TAHUN_AJARAN_OPTIONS]));
  const [alokasiWaktu, setAlokasiWaktu] = useState<string>('2 x 35 Menit (2 JP)');
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState<string>(() => {
    const today = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  });
  const [selectedPancaCinta, setSelectedPancaCinta] = useState<string[]>(initialMateri?.topikPancaCintaDefault || []);
  const [instruksiKhusus, setInstruksiKhusus] = useState<string>('');

  const [showMateriPicker, setShowMateriPicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePickMateri = (item: MateriBankItem) => {
    setMataPelajaran(item.mataPelajaran);
    setFaseKelas(item.faseKelas);
    setMateri(item.judulMateri);
    setJudulModul(`Modul Ajar KBC ${item.mataPelajaran} - ${item.judulMateri}`);
    if (item.topikPancaCintaDefault && item.topikPancaCintaDefault.length > 0) {
      setSelectedPancaCinta(item.topikPancaCintaDefault);
    }
    if (item.uraianMateri) {
      setInstruksiKhusus(`Rincian materi pelajaran yang perlu ditekankan: \n${item.uraianMateri}`);
    }
    setShowMateriPicker(false);
  };

  const togglePancaCinta = (opt: string) => {
    if (selectedPancaCinta.includes(opt)) {
      setSelectedPancaCinta(selectedPancaCinta.filter(x => x !== opt));
    } else {
      setSelectedPancaCinta([...selectedPancaCinta, opt]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materi.trim()) {
      setErrorMsg('Materi pelajaran tidak boleh kosong.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setProgressMsg('Menghubungkan ke Gemini AI Engine...');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['x-gemini-api-key'] = apiKey;
      }

      setProgressMsg('Menyusun 7 Seksi Modul KBC Lengkap, LKPD, & Kuis Digital...');

      const data = await safeFetchJson('/api/generate-modul', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          namaMadrasah,
          mataPelajaran,
          materi,
          faseKelas,
          semester,
          tahunPelajaran,
          alokasiWaktu,
          tanggalPelaksanaan,
          topikPancaCinta: selectedPancaCinta,
          instruksiKhusus,
          userApiKey: apiKey
        })
      });

      if (!data || !data.success) {
        throw new Error(data?.error || 'Gagal menghasilkan modul AI.');
      }

      // Deep fallbacks for all sections
      const rawIdentitas = data.modul?.identitas || {};
      const safeIdentitas = {
        namaMadrasah: rawIdentitas.namaMadrasah || namaMadrasah || 'MI Ma\'arif NU 2 Sanggreman',
        mataPelajaran: rawIdentitas.mataPelajaran || mataPelajaran || 'Pendidikan Agama Islam',
        materi: rawIdentitas.materi || materi || 'Materi Pembelajaran',
        faseKelas: rawIdentitas.faseKelas || faseKelas || 'Fase B / Kelas 4',
        semester: rawIdentitas.semester || semester || 'Semester 1',
        alokasiWaktu: rawIdentitas.alokasiWaktu || alokasiWaktu || '2 x 35 Menit',
        tahunPelajaran: rawIdentitas.tahunPelajaran || tahunPelajaran || '2025/2026',
        tanggalPelaksanaan: rawIdentitas.tanggalPelaksanaan || tanggalPelaksanaan || 'Disesuaikan / Terlampir'
      };

      const rawIdentifikasi = data.modul?.identifikasi || {};
      const safeIdentifikasi = {
        kesiapanMurid: {
          pahamUtuh: rawIdentifikasi.kesiapanMurid?.pahamUtuh || `Peserta didik kategori mahir/paham utuh telah menguasai konsep ${materi} secara menyeluruh, lancar menjelaskan makna, serta mampu memberikan contoh pengamalan harian. Tindak lanjut: Diberikan peran sebagai "Duta Cinta KBC" dan tutor sebaya.`,
          pahamSebagian: rawIdentifikasi.kesiapanMurid?.pahamSebagian || `Peserta didik kategori berkembang/paham sebagian mengenal konsep ${materi} secara umum, namun masih memerlukan bantuan dan bimbingan terarah dalam menghubungkan teori dengan perilaku konkret. Tindak lanjut: Diberikan pendampingan kelompok terbimbing.`,
          belumPaham: rawIdentifikasi.kesiapanMurid?.belumPaham || `Peserta didik kategori perlu intervensi/belum paham belum mengenal konsep dasar ${materi} dan memerlukan bimbingan personal intensif (scaffolding) dengan media visual/konkret dan pendekatan afektif KBC.`
        },
        materiPelajaran: rawIdentifikasi.materiPelajaran || `1. Pengenalan Hakikat Utama ${materi}\n2. Bukti & Penerapan Konkret dalam Kehidupan Sehari-hari\n3. Pembiasaan Karakter Cinta & Akhlak Mulia di Sekolah & Rumah`,
        dimensiProfilLulusan: (
          Array.isArray(rawIdentifikasi.dimensiProfilLulusan) && rawIdentifikasi.dimensiProfilLulusan.length > 0
            ? rawIdentifikasi.dimensiProfilLulusan
            : [
                'Beriman, Bertakwa, & Berakhlak Mulia',
                'Berkeadaban (Ta’addub)',
                'Gotong Royong & Empati'
              ]
        ).map((item: string) => (item.includes(':') ? item : `${item}: ${getDefaultProfilDesc(item, materi)}`)),
        topikPancaCinta: (
          Array.isArray(rawIdentifikasi.topikPancaCinta) && rawIdentifikasi.topikPancaCinta.length > 0
            ? rawIdentifikasi.topikPancaCinta
            : (selectedPancaCinta.length > 0 ? selectedPancaCinta : [
                'Cinta Allah SWT & Rasul-Nya',
                'Cinta Sesama & Bangsa'
              ])
        ).map((item: string) => (item.includes(':') ? item : `${item}: ${getDefaultPancaCintaDesc(item, materi)}`)),
        materiIntegrasiKBC: rawIdentifikasi.materiIntegrasiKBC || `Mengintegrasikan rasa cinta ilmu, kehangatan sapaan, kelembutan tutur kata, dan aksi kebaikan harian dalam mempelajari ${materi}.`
      };

      const rawDesain = data.modul?.desainPembelajaran || {};
      const safeDesain = {
        capaianPembelajaran: rawDesain.capaianPembelajaran || `Peserta didik mampu memahami, meyakini, dan mengamalkan konsep ${materi} secara komprehensif dengan penuh rasa tanggung jawab, kelembutan sikap, dan kasih sayang (KBC).`,
        lintasDisiplinIlmu: rawDesain.lintasDisiplinIlmu || 'Bahasa Indonesia (membaca kisah inspiratif & bertutur kata santun), IPAS (kepedulian merawat lingkungan), dan Seni Budaya (kreasi pohon kebaikan KBC).',
        tujuanPembelajaran: Array.isArray(rawDesain.tujuanPembelajaran) && rawDesain.tujuanPembelajaran.length > 0
          ? rawDesain.tujuanPembelajaran
          : [
            `Melalui kegiatan menyimak dan diskusi, peserta didik mampu menjelaskan konsep ${materi} dengan kalimat yang santun, jelas, dan penuh keyakinan.`,
            `Melalui pengamatan kartu gambar visual, peserta didik mampu mengidentifikasi minimal 3 contoh penerapan ${materi} dalam kehidupan sehari-hari dengan cermat.`,
            `Melalui simulasi berpasangan, peserta didik mampu mempraktikkan sikap saling menyayangi, bertutur kata lembut, dan membantu teman kesulitan.`
          ]
      };

      const rawKerangka = data.modul?.kerangkaPembelajaran || {};
      const safeKerangka = {
        praktekPedagogik: rawKerangka.praktekPedagogik || 'Mindful Learning, Deep Learning melalui Storytelling dialogis, dan Differentiated Learning',
        kemitraanPembelajaran: rawKerangka.kemitraanPembelajaran || 'Kolaborasi bersama orang tua dalam mendampingi kebiasaan baik dan jurnal kebaikan di rumah.',
        lingkunganPembelajaran: rawKerangka.lingkunganPembelajaran || 'Suasana kelas yang aman, nyaman, inklusif, dan penuh rasa kasih sayang.',
        pemanfaatanDigital: rawKerangka.pemanfaatanDigital || 'Menggunakan media digital kuis interaktif, flashcard, dan ilustrasi visual AI.'
      };

      const rawPengalaman = data.modul?.pengalamanBelajar || {};
      const safePengalaman = {
        kegiatanAwal: {
          durasi: rawPengalaman.kegiatanAwal?.durasi || '10 Menit',
          kegiatan: Array.isArray(rawPengalaman.kegiatanAwal?.kegiatan) && rawPengalaman.kegiatanAwal.kegiatan.length > 0 ? rawPengalaman.kegiatanAwal.kegiatan : [
            'Guru menyapa murid dengan senyuman hangat, salam KBC, dan Emotion Check-in.',
            'Berdoa bersama dipimpin oleh ketua kelas dengan khusyuk dan membaca salawat.',
            'Apersepsi Penuh Cinta: Guru menampilkan gambar pemantik dan bertanya jawab hangat terkait materi.',
            'Guru menyampaikan tujuan pembelajaran hari ini dan mengajak memelihara niat belajar karena Allah SWT.'
          ]
        },
        kegiatanInti: {
          durasi: rawPengalaman.kegiatanInti?.durasi || '50 Menit',
          kegiatan: Array.isArray(rawPengalaman.kegiatanInti?.kegiatan) && rawPengalaman.kegiatanInti.kegiatan.length > 0 ? rawPengalaman.kegiatanInti.kegiatan : [
            `Eksplorasi Konsep: Guru menyampaikan uraian materi ${materi} secara runtut dan kontekstual.`,
            'Diskusi Kelompok Ramah Anak: Peserta didik berdiskusi menganalisis kartu gambar peristiwa.',
            'Presentasi Penuh Apresiasi: Masing-masing kelompok mempresentasikan hasilnya dan saling memberikan tepuk kasih sayang.',
            'Pemanfaatan Media Digital: Menayangkan flashcard dan kuis digital interaktif.',
            'Mengaplikasi Aksi Cinta: Menuliskan komitmen kebaikan pada Pohon Cinta KBC.'
          ]
        },
        mengaplikasi: {
          durasi: rawPengalaman.mengaplikasi?.durasi || '15 Menit',
          kegiatan: Array.isArray(rawPengalaman.mengaplikasi?.kegiatan) && rawPengalaman.mengaplikasi.kegiatan.length > 0 ? rawPengalaman.mengaplikasi.kegiatan : [
            'Praktik Nyata Berpasangan: Bertukar senyum ramah dan mengucapkan kalimat apresiasi tulus kepada teman.',
            'Aksi Kebaikan Tersembunyi: Mengambil satu misi kebaikan dari Kotak Kebaikan Cinta KBC.'
          ]
        },
        merefleksi: {
          durasi: rawPengalaman.merefleksi?.durasi || '10 Menit',
          kegiatan: Array.isArray(rawPengalaman.merefleksi?.kegiatan) && rawPengalaman.merefleksi.kegiatan.length > 0 ? rawPengalaman.merefleksi.kegiatan : [
            'Refleksi Hati & Kontemplasi: Memejamkan mata sejenak merenungkan nikmat dari Allah SWT.',
            'Menuliskan satu kalimat rasa syukur dan komitmen harian pada jurnal refleksi emosi.'
          ]
        },
        penutup: {
          durasi: rawPengalaman.penutup?.durasi || '5 Menit',
          kegiatan: Array.isArray(rawPengalaman.penutup?.kegiatan) && rawPengalaman.penutup.kegiatan.length > 0 ? rawPengalaman.penutup.kegiatan : [
            'Guru merangkum kesimpulan materi dan memberikan motivasi pesan moral KBC.',
            'Apresiasi dari guru, doa penutup majelis keberkahan, dan salam kasih sayang.'
          ]
        }
      };

      // Contextual fallback media digital structure tailored to current topic
      const defaultMediaDigital = {
        soalKuis: [
          {
            id: 'q1',
            pertanyaan: `Apa tujuan utama mempelajari ${materi}?`,
            pilihan: [
              `Memahami dan mengamalkan nilai ${materi} dalam kehidupan sehari-hari`,
              `Hanya menghafal tanpa dipraktikkan`,
              `Abaikan pelajaran saat di kelas`,
              `Mempelajarinya saat ujian saja`
            ],
            kunciJawaban: 0,
            penjelasanKbc: `Benar sekali! Memahami dan menerapkan ${materi} dengan penuh kasih sayang (KBC) merupakan cerminan akhlak terpuji murid madrasah.`
          },
          {
            id: 'q2',
            pertanyaan: `Sikap yang mencerminkan rasa cinta dan kehangatan dalam konteks ${materi} adalah...`,
            pilihan: [
              `Bersikap sopan, santun, dan peduli kepada sesama`,
              `Acuh tak acuh kepada teman`,
              `Bicara dengan nada keras`,
              `Ingin menang sendiri`
            ],
            kunciJawaban: 0,
            penjelasanKbc: `Luar biasa! Sikap santun dan peduli adalah wujud nyata penerapan Kurikulum Berbasis Cinta.`
          },
          {
            id: 'q3',
            pertanyaan: `Bagaimana cara murid madrasah menerapkan hikmah ${materi} di lingkungan sekolah?`,
            pilihan: [
              `Menebar senyum, menyapa guru, dan membantu teman kesulitan`,
              `Mengganggu teman yang sedang belajar`,
              `Membuang sampah sembarangan`,
              `Melanggar aturan kesepakatan kelas`
            ],
            kunciJawaban: 0,
            penjelasanKbc: `Hebat! Menunjukkan kepedulian dan membantu sesama membawa keberkahan dan kebahagiaan.`
          }
        ],
        materiInteraktif: {
          ringkasanRingkas: `Rangkuman materi ${materi} mengajarkan pentingnya mengamalkan ajaran agama dengan penuh kelembutan, kesucian hati, dan kepedulian sosial di madrasah maupun di rumah.`,
          poinPenting: [
            `Memahami hakikat dan keutamaan ${materi}`,
            `Menerapkan sikap kasih sayang (KBC) dalam setiap interaksi`,
            `Membiasakan perilaku terpuji dan tutur kata yang santun`,
            `Menjaga keharmonisan bersama teman, guru, dan keluarga`
          ],
          flashcards: [
            { id: 'fc1', depan: `Apa materi utama pembelajaran hari ini?`, belakang: `${materi}` },
            { id: 'fc2', depan: `Bagaimana cara mengamalkan ${materi}?`, belakang: `Dengan niat ikhlas karena Allah SWT, tutur kata lembut, dan aksi nyata kebaikan.` },
            { id: 'fc3', depan: `Apa pesan utama KBC pada materi ini?`, belakang: `Menyemai rasa kasih sayang, saling menghormati, dan menebar manfaat bagi sesama.` }
          ]
        },
        gambarInteraktif: {
          deskripsiVisual: `Ilustrasi visual interaktif untuk pembelajaran ${materi} di Madrasah Ibtidaiyah yang hangat, ramah anak, dan penuh keceriaan.`,
          promptGambar: `A warm Islamic primary school classroom vector illustration for lesson ${materi}, Indonesian students smiling, clean educational flat design style.`,
          hotspots: [
            { x: 30, y: 40, judul: 'Area Pembelajaran Interaktif', penjelasan: 'Sudut belajar di mana siswa berdiskusi dengan santun.' },
            { x: 70, y: 50, judul: 'Aksi Nyata KBC', penjelasan: 'Penerapan kebaikan dan toleransi antar murid di kelas.' }
          ]
        }
      };

      const rawAssesmen = data.modul?.assesmen || {};
      const rawMediaDigital = rawAssesmen.mediaDigital || defaultMediaDigital;
      const rawGambarInteraktif = rawMediaDigital.gambarInteraktif || defaultMediaDigital.gambarInteraktif;

      setProgressMsg('Membuat Ilustrasi Gambar Digital Pembelajaran KBC...');

      let generatedImageUrl: string | undefined = undefined;
      try {
        const imgData = await safeFetchJson('/api/generate-image', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: rawGambarInteraktif.promptGambar || `Illustration for Islamic primary school lesson ${materi}`,
            userApiKey: apiKey
          })
        });
        if (imgData.success && imgData.imageUrl) {
          generatedImageUrl = imgData.imageUrl;
        }
      } catch (imgErr) {
        console.warn('Image generation skipped or failed, using fallback:', imgErr);
      }

      if (!generatedImageUrl) {
        generatedImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent((rawGambarInteraktif.promptGambar || `Illustration for ${materi}`) + ', Islamic primary school vector educational illustration, child friendly')}&width=800&height=600&nologo=true&seed=${Date.now()}`;
      }

      const safeSoalKuis = Array.isArray(rawMediaDigital.soalKuis) && rawMediaDigital.soalKuis.length >= 2
        ? rawMediaDigital.soalKuis
        : defaultMediaDigital.soalKuis;

      const safeMateriInteraktif = {
        ringkasanRingkas: rawMediaDigital.materiInteraktif?.ringkasanRingkas || defaultMediaDigital.materiInteraktif.ringkasanRingkas,
        poinPenting: Array.isArray(rawMediaDigital.materiInteraktif?.poinPenting) && rawMediaDigital.materiInteraktif.poinPenting.length > 0
          ? rawMediaDigital.materiInteraktif.poinPenting
          : defaultMediaDigital.materiInteraktif.poinPenting,
        flashcards: Array.isArray(rawMediaDigital.materiInteraktif?.flashcards) && rawMediaDigital.materiInteraktif.flashcards.length > 0
          ? rawMediaDigital.materiInteraktif.flashcards
          : defaultMediaDigital.materiInteraktif.flashcards
      };

      const fullModul: ModulAjarCinta = {
        id: `modul-ai-${Date.now()}`,
        judul: judulModul.trim() || `Modul Ajar KBC ${mataPelajaran} - ${materi}`,
        modeBuat: 'AI',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        identitas: safeIdentitas,
        identifikasi: safeIdentifikasi,
        desainPembelajaran: safeDesain,
        kerangkaPembelajaran: safeKerangka,
        pengalamanBelajar: safePengalaman,
        assesmen: {
          ...rawAssesmen,
          teknikAssesmen: rawAssesmen.teknikAssesmen || 'Observasi, Tes Tertulis, dan Penilaian Diri',
          rubrikAssesmenSikapCinta: rawAssesmen.rubrikAssesmenSikapCinta || 'Menunjukkan sikap kasih sayang, sopan santun, dan empati.',
          instrumenPenilaian: rawAssesmen.instrumenPenilaian || 'Lembar observasi dan kuis interaktif',
          lkpd: {
            judulLkpd: rawAssesmen.lkpd?.judulLkpd || `LKPD - ${materi}`,
            petunjuk: rawAssesmen.lkpd?.petunjuk || 'Kerjakan dengan teliti dan bekerja sama dengan penuh kasih sayang.',
            tugasAktivitas: Array.isArray(rawAssesmen.lkpd?.tugasAktivitas) && rawAssesmen.lkpd.tugasAktivitas.length > 0 ? rawAssesmen.lkpd.tugasAktivitas : ['Diskusikan materi bersama kelompok.'],
            pertanyaanDiskusi: Array.isArray(rawAssesmen.lkpd?.pertanyaanDiskusi) && rawAssesmen.lkpd.pertanyaanDiskusi.length > 0 ? rawAssesmen.lkpd.pertanyaanDiskusi : ['Apa hikmah utama yang dipelajari?'],
            lembarRefleksiSiswa: rawAssesmen.lkpd?.lembarRefleksiSiswa || 'Saya merasa senang belajar materi ini.'
          },
          mediaDigital: {
            ...rawMediaDigital,
            soalKuis: safeSoalKuis,
            materiInteraktif: safeMateriInteraktif,
            gambarInteraktif: {
              ...rawGambarInteraktif,
              deskripsiVisual: rawGambarInteraktif.deskripsiVisual || `Ilustrasi pembelajaran ${materi}`,
              promptGambar: rawGambarInteraktif.promptGambar || `Illustration for ${materi}`,
              imageUrl: generatedImageUrl,
              hotspots: Array.isArray(rawGambarInteraktif.hotspots) && rawGambarInteraktif.hotspots.length > 0
                ? rawGambarInteraktif.hotspots
                : defaultMediaDigital.gambarInteraktif.hotspots
            }
          }
        },
        kopSurat,
        ttd
      };

      onSuccess(fullModul);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses generasi modul.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80] overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 p-4 flex items-center justify-between text-white shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm tracking-tight">Mode 1: Generasi Modul AI Cepat</h3>
              <p className="text-[10px] text-emerald-100 font-medium">Otomatisasi lengkap 7 seksi modul ajar KBC berbasis Gemini 3.6 Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/80 hover:text-white p-1 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Grid Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Judul Modul Field */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-800 font-bold block">Judul Modul Ajar (Versi Generasi)</label>
              <input
                type="text"
                value={judulModul}
                onChange={e => setJudulModul(e.target.value)}
                placeholder="misal: Modul Ajar KBC Akidah Akhlak - Kasih Sayang Ar-Rahman"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-extrabold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all shadow-xs"
                required
              />
              <p className="text-[10px] text-slate-500">Judul utama modul ajar yang akan ditampilkan pada daftar modul & sampul dokumen.</p>
            </div>

            <div className="space-y-1">
              <label className="text-slate-800 font-bold block">Nama Madrasah (Seksi Identitas)</label>
              <input
                type="text"
                value={namaMadrasah}
                onChange={e => setNamaMadrasah(e.target.value)}
                placeholder="misal: MI Ma'arif NU 2 Sanggreman"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                required
              />
              <p className="text-[10px] text-slate-500">Terpisah dari Kop Surat resmi. Khusus untuk tabel Seksi I Identitas Modul.</p>
            </div>

            <div className="space-y-1">
              <label className="text-slate-800 font-bold block">Mata Pelajaran (Mapel)</label>
              <select
                value={mataPelajaran}
                onChange={e => {
                  const newMapel = e.target.value;
                  setMataPelajaran(newMapel);
                  const matching = materiList.filter(m => m.mataPelajaran === newMapel);
                  if (matching.length > 0) {
                    handlePickMateri(matching[0]);
                  } else {
                    setJudulModul(`Modul Ajar KBC ${newMapel} - ${materi}`);
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 transition-all font-medium"
              >
                {loadMasterMapelList().map((m, idx) => (
                  <option key={idx} value={m} className="bg-white text-slate-900">{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-800 font-bold block">Materi Pelajaran / Topik Utama</label>
                {materiList && materiList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowMateriPicker(true)}
                    className="text-[10px] bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-800 font-extrabold px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all"
                  >
                    <BookMarked className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Semua Bank Materi ({materiList.length})</span>
                  </button>
                )}
              </div>

              {materiList.filter(item => item.mataPelajaran === mataPelajaran).length > 0 ? (
                <div className="space-y-2">
                  <div className="bg-white border border-emerald-200 rounded-xl p-2.5 space-y-1">
                    <label className="text-[10px] text-emerald-800 font-extrabold block flex items-center space-x-1">
                      <span>📌 Pilih Topik dari Kelola Materi ({mataPelajaran}):</span>
                    </label>
                    <select
                      value={materiList.some(m => m.mataPelajaran === mataPelajaran && m.judulMateri === materi) ? materi : '__custom__'}
                      onChange={e => {
                        const val = e.target.value;
                        if (val !== '__custom__') {
                          const found = materiList.find(m => m.mataPelajaran === mataPelajaran && m.judulMateri === val);
                          if (found) handlePickMateri(found);
                        }
                      }}
                      className="w-full bg-slate-50 border border-emerald-400 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {materiList.filter(m => m.mataPelajaran === mataPelajaran).map((item, idx) => (
                        <option key={`${item.id}-${idx}`} value={item.judulMateri} className="bg-white text-slate-900">
                          {item.judulMateri} ({item.faseKelas.replace('Fase B (', '').replace(')', '')})
                        </option>
                      ))}
                      <option value="__custom__" className="bg-white text-slate-900">✏️ Ketik Topik Baru / Kustom...</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={materi}
                    onChange={e => {
                      const newMateri = e.target.value;
                      setMateri(newMateri);
                      setJudulModul(`Modul Ajar KBC ${mataPelajaran} - ${newMateri}`);
                    }}
                    placeholder="misal: Meneladani Sifat Ar-Rahman dalam Berinteraksi dengan Teman"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-bold text-emerald-800 transition-all"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={materi}
                    onChange={e => {
                      const newMateri = e.target.value;
                      setMateri(newMateri);
                      setJudulModul(`Modul Ajar KBC ${mataPelajaran} - ${newMateri}`);
                    }}
                    placeholder="misal: Meneladani Sifat Ar-Rahman dalam Berinteraksi dengan Teman"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-bold text-emerald-800 transition-all"
                    required
                  />
                  <p className="text-[10px] text-slate-500">
                    Belum ada bank materi untuk mapel {mataPelajaran}. Silakan ketik topik manual di atas atau tambahkan di tab Kelola Materi.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-slate-800 font-bold block">Fase / Kelas</label>
              <select
                value={faseKelas}
                onChange={e => setFaseKelas(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 transition-all font-medium"
              >
                <option value="Fase A (Kelas I MI)" className="bg-white text-slate-900">Fase A (Kelas I MI)</option>
                <option value="Fase A (Kelas II MI)" className="bg-white text-slate-900">Fase A (Kelas II MI)</option>
                <option value="Fase B (Kelas III MI)" className="bg-white text-slate-900">Fase B (Kelas III MI)</option>
                <option value="Fase B (Kelas IV MI)" className="bg-white text-slate-900">Fase B (Kelas IV MI)</option>
                <option value="Fase C (Kelas V MI)" className="bg-white text-slate-900">Fase C (Kelas V MI)</option>
                <option value="Fase C (Kelas VI MI)" className="bg-white text-slate-900">Fase C (Kelas VI MI)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-800 font-bold block">Tahun Pelajaran (Aktif Pengaturan)</label>
              <select
                value={tahunPelajaran}
                onChange={e => setTahunPelajaran(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 transition-all font-semibold"
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
                  value={semester}
                  onChange={e => setSemester(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 transition-all font-medium text-xs sm:text-sm"
                >
                  <option value="Ganjil (1)" className="bg-white text-slate-900">Ganjil (1)</option>
                  <option value="Genap (2)" className="bg-white text-slate-900">Genap (2)</option>
                </select>
                <input
                  type="text"
                  value={alokasiWaktu}
                  onChange={e => setAlokasiWaktu(e.target.value)}
                  placeholder="Alokasi Waktu (2 x 35 Menit)"
                  className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 transition-all font-medium text-xs sm:text-sm"
                />
                <input
                  type="text"
                  value={tanggalPelaksanaan}
                  onChange={e => setTanggalPelaksanaan(e.target.value)}
                  placeholder="Tanggal Pelaksanaan (mis: 12 Ags 2026)"
                  className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 transition-all font-medium text-xs sm:text-sm border-emerald-300 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Topik Panca Cinta Options */}
          <div className="space-y-1.5 pt-1">
            <label className="text-slate-800 font-bold block">Fokus Topik Panca Cinta (Pilih minimal 1):</label>
            <div className="flex flex-wrap gap-1.5">
              {PANCA_CINTA_OPTIONS.map((opt, idx) => {
                const isSelected = selectedPancaCinta.includes(opt);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => togglePancaCinta(opt)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-rose-50 border-rose-300 text-rose-800 font-extrabold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span>♥ {opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div className="space-y-1 pt-1">
            <label className="text-slate-800 font-bold block">Catatan / Instruksi Khusus (Opsional)</label>
            <textarea
              rows={2}
              value={instruksiKhusus}
              onChange={e => setInstruksiKhusus(e.target.value)}
              placeholder="misal: Sertakan simulasi bermain peran (roleplay) antarteman dan lagu pembuka penuh kehangatan."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium transition-all"
            />
          </div>

          {/* Loading status */}
          {loading && (
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-center space-y-2 animate-pulse">
              <div className="flex items-center justify-center space-x-2 text-emerald-800 font-bold text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>{progressMsg}</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-medium">
                AI sedang merancang deskripsi 7 seksi urut, runtut, komprehensif beserta kuis & media digital...
              </p>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-200"
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Sedang Merancang Modul KBC...' : 'Generate Modul Ajar Berbasis AI'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Picker Modal Overlay */}
      {showMateriPicker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[90] p-3 sm:p-6 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xl relative text-slate-800">
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
