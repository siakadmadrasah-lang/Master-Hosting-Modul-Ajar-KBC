import { ModulAjarCinta, KopSuratSettings, TTDSettings, MateriBankItem, TeacherItem } from '../types';

export const DEFAULT_KOP_SURAT: KopSuratSettings = {
  namaKantor: "LEMBAGA PENDIDIKAN MA'ARIF NU BANYUMAS",
  namaMadrasah: 'MI MA\'ARIF NU 2 SANGGREMAN',
  alamatMadrasah: 'Jl. Raya Sanggreman, Kec. Rawalo, Kabupaten Banyumas, Jawa Tengah 53173',
  kontakMadrasah: 'Telp: (0281) 6841234 | Email: mimaarifnu2sanggreman@kemenag.go.id',
  website: 'www.mimaarifnu2sanggreman.sch.id',
  logoUrl: null,
  logoPosisi: 'kiri'
};

export const DEFAULT_TTD: TTDSettings = {
  tempatPenetapan: 'Rawalo',
  tanggalPenetapan: '24 Juli 2026',
  tanggalMode: 'otomatis',
  tanggalPenetapanManual: '24 Juli 2026',
  kepalaMadrasahNama: 'Siti Rochimah, S.Pd.I.',
  kepalaMadrasahNIP: '19780512 200501 2 006',
  guruKelasNama: 'Jaenal Maskun, S.Pd.I.',
  guruKelasNIP: '197808152009011009',
  jabatanGuru: 'Guru Kelas / Penyusun'
};

export const DEFAULT_TEACHERS: TeacherItem[] = [
  {
    id: 'teacher-1',
    no: 1,
    nama: 'Jaenal Maskun',
    gelar: 'S.Pd.I.',
    nik: '3302141508820001',
    pin: '123456',
    hakAkses: 'guru',
    nip: '197808152009011009',
    nuptk: '8452756658200022',
    npk: '11823302005401',
    pegIdSimpatika: '201889921',
    jabatanMapel: 'Guru Akidah Akhlak',
    jabatanAtauKelas: 'Guru Kelas III / Pengampu PAI',
    statusKepegawaian: 'PNS',
    jenisKelamin: 'L',
    noWhatsapp: '081398765432',
    kontak: '081398765432',
    email: 'jaenal.maskun@kemenag.go.id',
    bebanJtm: '24 Jam',
    username: 'jaenalmaskun',
    mapelAmpu: ['Akidah Akhlak', 'Al-Qur\'an Hadis', 'Fiqih', 'IPAS (IPA & IPS)', 'Bahasa Arab'],
    kelasAmpu: ['Kelas 3 (Fase B)', 'Kelas 4 (Fase B)'],
    status: 'aktif',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'teacher-2',
    no: 2,
    nama: 'Siti Rochimah',
    gelar: 'S.Pd.I.',
    nik: '3302145205780002',
    pin: '654321',
    hakAkses: 'kepala_madrasah',
    nip: '197805122005012006',
    nuptk: '9345756658200011',
    npk: '11823302005402',
    pegIdSimpatika: '201998812',
    jabatanMapel: 'Kepala Madrasah / Guru PAI',
    jabatanAtauKelas: 'Kepala Madrasah / Guru PAI',
    statusKepegawaian: 'PNS',
    jenisKelamin: 'P',
    noWhatsapp: '081234567890',
    kontak: '081234567890',
    email: 'siti.rochimah@kemenag.go.id',
    bebanJtm: '18 Jam',
    username: 'sitirochimah',
    mapelAmpu: ['Pendidikan Agama Islam', 'Pendidikan Pancasila'],
    kelasAmpu: ['Kelas 1 (Fase A)', 'Kelas 2 (Fase A)'],
    status: 'aktif',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'teacher-3',
    no: 3,
    nama: 'Ahmad Fauzi',
    gelar: 'M.Pd.',
    nik: '3302141010900003',
    pin: '789123',
    hakAkses: 'guru',
    nip: '-',
    nuptk: '7123756658200033',
    npk: '11823302005403',
    pegIdSimpatika: '202117733',
    jabatanMapel: 'Guru Fikih & Qur\'an Hadis',
    jabatanAtauKelas: 'Guru Mapel Fikih',
    statusKepegawaian: 'GTY',
    jenisKelamin: 'L',
    noWhatsapp: '085712345678',
    kontak: '085712345678',
    email: 'ahmad.fauzi@gmail.com',
    bebanJtm: '24 Jam',
    username: 'ahmadfauzi',
    mapelAmpu: ['Fiqih', 'Al-Qur\'an Hadis'],
    kelasAmpu: ['Kelas 5 (Fase C)', 'Kelas 6 (Fase C)'],
    status: 'aktif',
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

export const INITIAL_MATERI_BANK: MateriBankItem[] = [
  {
    id: 'mb-1',
    mataPelajaran: 'Akidah Akhlak',
    faseKelas: 'Fase B (Kelas III MI)',
    semester: 'Ganjil (1)',
    tahunAjaran: '2025/2026',
    judulMateri: 'Mengenal & Meneladani Asmaul Husna Ar-Rahman (Maha Pengasih)',
    uraianMateri: '1. Pengertian, Etimologi, & Konsep Utama: Ar-Rahman adalah salah satu Asmaul Husna teragung Allah SWT yang bermakna Maha Pengasih. Kasih sayang Allah SWT bersifat luas, meliputi seluruh makhluk ciptaan-Nya di alam semesta tanpa terkecuali, baik manusia, hewan, tumbuhan, maupun alam sekitar.\n\n2. Landasan Syariat & Dalil: Ditegaskan dalam Al-Qur\'an Surat Al-Fatihah ayat 3 "Ar-Rahmanir-Rahim" (Maha Pengasih lagi Maha Penyayang) serta Hadis Nabi SAW: "Orang-orang yang penyayang akan dikasihi oleh Tuhan Yang Maha Pengasih. Sayangilah yang ada di bumi, niscaya yang di langit akan menyayangimu" (HR. Tirmidzi).\n\n3. Ketentuan, Syarat, & Komponen Pokok Meneladani Ar-Rahman: Seorang murid muslim yang meneladani Ar-Rahman wajib memiliki kelembutan hati, niat tulus dalam berbuat baik, menjauhi sifat dendam dan kasar, serta menumbuhkan kebiasaan memberi maaf.\n\n4. Tata Cara, Urutan Langkah, & Adab Pembiasaan: Dimulai dengan senyuman dan sapaan hangat saat bertemu guru dan teman, mendengarkan curahan hati teman dengan empati, berbagi makanan/peralatan belajar saat ada yang membutuhkan, serta mendoakan kebaikan bagi sesama.\n\n5. Integrasi Nilai Panca Cinta KBC & Hikmah: Menghubungkan pilar Cinta Allah SWT dengan Cinta Sesama & Cinta Alam Lingkungan. Hikmahnya menciptakan iklim kelas yang aman, bebas dari perundungan (bullying), serta melatih kecerdasan emosional dan spiritual murid.\n\n6. Penerapan Praktis Sehari-hari: Menebar budaya 5S (Senyum, Sapa, Salam, Sopan, Santun), aktif mengisi Kotak Kebaikan Cinta KBC, membantu teman yang kesulitan memahami pelajaran, serta menyiram tanaman dan memberi makan hewan peliharaan.',
    topikPancaCintaDefault: ['Cinta Allah SWT & Rasul-Nya', 'Cinta Sesama & Bangsa'],
    capaianPembelajaranDefault: 'Peserta didik mampu memahami Asmaul Husna Ar-Rahman dan mengaplikasikan perilaku kasih sayang serta empati dalam kehidupan sehari-hari.',
    isDefault: true
  },
  {
    id: 'mb-2',
    mataPelajaran: 'Fikih',
    faseKelas: 'Fase A (Kelas II MI)',
    semester: 'Ganjil (1)',
    tahunAjaran: '2025/2026',
    judulMateri: 'Tata Cara Berwudhu yang Tertib & Adab Hemat Air',
    uraianMateri: '1. Pengertian wudhu dan urgensinya sebagai syarat sah shalat.\n2. Bacaan niat wudhu dan doa setelah berwudhu.\n3. Urutan rukun dan sunnah wudhu runtut.\n4. Adab berwudhu dan perilaku hemat air sebagai cerminan Cinta Alam Lingkungan.',
    topikPancaCintaDefault: ['Cinta Allah SWT & Rasul-Nya', 'Cinta Ilmu & Alam Lingkungan'],
    capaianPembelajaranDefault: 'Peserta didik dapat menyimulasikan tata cara wudhu yang tertib serta membiasakan sikap hemat air.',
    isDefault: true
  },
  {
    id: 'mb-3',
    mataPelajaran: 'Al-Qur’an Hadis',
    faseKelas: 'Fase B (Kelas III MI)',
    semester: 'Ganjil (1)',
    tahunAjaran: '2025/2026',
    judulMateri: 'Membaca & Memahami Surat Al-Ma’un (Menyayangi Anak Yatim & Peduli Sesama)',
    uraianMateri: '1. Pelafalan dan hukum tajwid dasar Surat Al-Ma’un.\n2. Terjemahan dan pesan pokok Surat Al-Ma’un tentang kepedulian sosial.\n3. Larangan menelantarkan anak yatim dan menghardik orang miskin.\n4. Pembiasaan gerakan infak subuh dan santunan kasih di madrasah.',
    topikPancaCintaDefault: ['Cinta Allah SWT & Rasul-Nya', 'Cinta Sesama & Bangsa'],
    capaianPembelajaranDefault: 'Peserta didik mampu membaca Surat Al-Ma’un dengan tartil dan mengamalkan isi kandungannya lewat kepedulian sosial.',
    isDefault: true
  },
  {
    id: 'mb-4',
    mataPelajaran: 'Sejarah Kebudayaan Islam (SKI)',
    faseKelas: 'Fase C (Kelas V MI)',
    semester: 'Genap (2)',
    tahunAjaran: '2025/2026',
    judulMateri: 'Keteladanan Akhlak Rasulullah SAW dalam Peristiwa Fathu Makkah',
    uraianMateri: '1. Chronologi singkat peristiwa Fathu Makkah (Pembebasan Kota Makkah).\n2. Sifat pemaaf, keteladanan, dan kasih sayang tanpa dendam Rasulullah SAW.\n3. Penerapan sikap toleransi, pemaaf, dan perdamaian di lingkungan sekolah & masyarakat.',
    topikPancaCintaDefault: ['Cinta Allah SWT & Rasul-Nya', 'Cinta Sesama & Bangsa'],
    capaianPembelajaranDefault: 'Peserta didik menganalisis keagungan akhlak Rasulullah SAW dan meneladani sikap pemaaf.',
    isDefault: true
  },
  {
    id: 'mb-5',
    mataPelajaran: 'Bahasa Arab',
    faseKelas: 'Fase A (Kelas I MI)',
    semester: 'Ganjil (1)',
    tahunAjaran: '2025/2026',
    judulMateri: 'Mufrodat Peralatan Sekolah (Adawatul Madrosiyyah) & Percakapan Kesantunan',
    uraianMateri: '1. Pengenalan kosa kata benda di kelas (pulpen, buku, tas, papan tulis).\n2. Percakapan interaktif menggunakan kalimat kesantunan dan kasih sayang.\n3. Lagu anak Bahasa Arab berlandaskan kehangatan KBC.',
    topikPancaCintaDefault: ['Cinta Ilmu & Alam Lingkungan'],
    capaianPembelajaranDefault: 'Peserta didik merespons ucapan sederhana dan melafalkan kosa kata peralatan sekolah dalam Bahasa Arab.',
    isDefault: true
  },
  {
    id: 'mb-6',
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam & Sosial)',
    faseKelas: 'Fase B (Kelas IV MI)',
    semester: 'Genap (2)',
    tahunAjaran: '2025/2026',
    judulMateri: 'Hubungan Antar Makhluk Hidup dalam Ekosistem & Menjaga Kelestarian Alam',
    uraianMateri: '1. Pengertian ekosistem, rantai makanan, dan jaring-jaring kehidupan.\n2. Peran manusia dalam menjaga kelestarian lingkungan ciptaan Allah SWT.\n3. Aksi nyata penghijauan dan pemilahan sampah organik/anorganik di madrasah.',
    topikPancaCintaDefault: ['Cinta Ilmu & Alam Lingkungan'],
    capaianPembelajaranDefault: 'Peserta didik menganalisis hubungan antar makhluk hidup dan peran manusia dalam menjaga kelestarian ekosistem.',
    isDefault: true
  },
  {
    id: 'mb-7',
    mataPelajaran: 'Pendidikan Pancasila',
    faseKelas: 'Fase B (Kelas IV MI)',
    semester: 'Genap (2)',
    tahunAjaran: '2025/2026',
    judulMateri: 'Penerapan Sila Pancasila dalam Kehidupan Bermasyarakat & Gotong Royong',
    uraianMateri: '1. Simbol dan makna lima Sila Pancasila.\n2. Wujud gotong royong, empati, dan tenggang rasa di sekolah.\n3. Mengembangkan persatuan dan kepedulian terhadap keanekaragaman bangsa.',
    topikPancaCintaDefault: ['Cinta Sesama & Bangsa'],
    capaianPembelajaranDefault: 'Peserta didik menunjukkan sikap kepedulian dan gotong royong sesuai nilai-nilai Pancasila.',
    isDefault: true
  }
];

export const SAMPLE_MODULES: ModulAjarCinta[] = [
  {
    id: 'sample-modul-1',
    judul: 'Modul Ajar Akidah Akhlak - Meneladani Sifat Ar-Rahman dengan Cinta',
    modeBuat: 'AI',
    createdAt: '2026-07-24T08:00:00Z',
    updatedAt: '2026-07-24T08:00:00Z',
    kopSurat: DEFAULT_KOP_SURAT,
    ttd: DEFAULT_TTD,
    identitas: {
      namaMadrasah: 'MI Ma\'arif NU 2 Sanggreman',
      mataPelajaran: 'Akidah Akhlak',
      materi: 'Mengenal Sifat Allah Ar-Rahman (Maha Pengasih) & Mewujudkannya dalam Kasih Sayang Sesama',
      faseKelas: 'Fase B (Kelas III MI)',
      semester: 'Ganjil (1)',
      tahunPelajaran: '2025/2026',
      alokasiWaktu: '2 x 35 Menit (2 JP)'
    },
    identifikasi: {
      kesiapanMurid: {
        pahamUtuh: 'Peserta didik kategori mahir/paham utuh telah menghafal lafaz Asmaul Husna Ar-Rahman beserta artinya dengan lancar, serta mampu menjelaskan dan memberikan contoh konkret wujud kasih sayang Allah SWT dalam kehidupan sehari-hari di rumah dan madrasah. Tindak lanjut diferensiasi: Diberikan aktivitas tantangan pengayaan sebagai "Duta Cinta KBC" dan ditugaskan menjadi tutor sebaya untuk membantu kelompok teman yang memerlukan bimbingan.',
        pahamSebagian: 'Peserta didik kategori berkembang/paham sebagian telah mengenal arti Ar-Rahman secara umum dan menghafal lafaznya, namun masih memerlukan bimbingan dan analogi sederhana dalam menghubungkan sifat Maha Pengasih Allah SWT dengan tindakan kasih sayang konkret kepada teman sebaya. Tindak lanjut diferensiasi: Diberikan pendampingan terarah melalui diskusi kelompok terbimbing dan bantuan kartu visual peristiwa KBC.',
        belumPaham: 'Peserta didik kategori perlu intervensi/belum paham belum mengenal lafaz Asmaul Husna Ar-Rahman dan belum memahami makna kasih sayang dalam konteks ibadah dan akhlak. Tindak lanjut diferensiasi: Diberikan bimbingan personal intensif (scaffolding) dengan peragaan gambar bercerita yang ramah anak, pendekatan kehangatan afektif KBC, serta pengenalan nada Asmaul Husna yang syahdu.'
      },
      materiPelajaran: '1. Pengertian, Etimologi, & Hakikat Asmaul Husna Ar-Rahman: Ar-Rahman adalah nama Allah SWT yang bermakna Maha Pengasih secara mutlak. Rahmat dan kasih sayang-Nya melingkupi seluruh ciptaan di dunia tanpa membeda-bedakan status atau latar belakang.\n\n2. Landasan Syariat & Dalil Al-Qur\'an / Hadis: Ditegaskan dalam QS. Al-Fatihah ayat 3 dan Hadis Riwayat Tirmidzi bahwa barangsiapa menyayangi makhluk di bumi, maka ia akan dikasihi oleh Allah Yang Maha Pengasih di langit.\n\n3. Ketentuan, Syarat, & Komponen Pokok Meneladani Ar-Rahman: Murid muslim yang meneladani Ar-Rahman wajib menjaga ketulusan niat, menjauhi sifat iri dan prasangka buruk, serta memiliki dorongan kuat untuk menolong sesama.\n\n4. Tata Cara, Langkah-Langkah, & Adab Pembiasaan: Mengawali hari dengan salam dan kehangatan senyuman, bertutur kata lembut penuh kesantunan, aktif menjadi pendengar yang baik bagi teman, serta tidak menyakiti perasaan siapapun.\n\n5. Integrasi Nilai Panca Cinta KBC & Hikmah: Mengaitkan pilar Cinta Allah SWT, Cinta Sesama, dan Cinta Alam. Hikmah utamanya adalah menciptakan iklim pembelajaran yang damai, penuh kebersamaan, dan bebas perundungan.\n\n6. Penerapan Praktis Dalam Kehidupan Sehari-hari: Membiasakan senyum-sapa-salam di madrasah, membagikan bekal/alat tulis kepada teman yang membutuhkan, mengisi Kotak Kebaikan Cinta KBC, serta menyiram tanaman madrasah.',
      dimensiProfilLulusan: [
        'Beriman, Bertakwa, & Berakhlak Mulia: Menghayati sifat Ar-Rahman Allah SWT melalui ketulusan beribadah dan perwujudan akhlakul karimah yang lembut serta santun kepada sesama.',
        'Keteladanan (Qudwah): Menjadi pendorong kebaikan di kelas melalui sikap disiplin, tutur kata yang menentramkan, dan kejujuran dalam berinteraksi.',
        'Gotong Royong & Empati: Mengembangkan kepekaan sosial untuk saling menolong saat ada teman yang mengalami kesulitan belajar atau musibah.',
        'Berkeadaban (Ta’addub): Membiasakan tata krama Islami, menghormati guru, serta menyayangi teman tanpa membeda-bedakan latar belakang.'
      ],
      topikPancaCinta: [
        'Cinta Allah SWT & Rasul-Nya: Menumbuhkan rasa kagum dan syukur atas kasih sayang Allah SWT yang tak terbatas melalui pengamalan sifat Ar-Rahman.',
        'Cinta Sesama & Bangsa: Menerapkan budaya senyum, sapa, salam, dan kepedulian sosial untuk mempererat tali ukhuwah antar murid madrasah.',
        'Cinta Ilmu & Alam Lingkungan: Mewujudkan kasih sayang dengan merawat flora dan fauna di madrasah serta bersemangat menuntut ilmu sebagai ibadah.'
      ],
      materiIntegrasiKBC: 'Penerapan Kurikulum Berbasis Cinta (KBC) dilakukan secara komprehensif melalui penanaman rasa kehangatan, sapaan kasih sayang, latihan empati mendengar perasaan teman, serta aksi nyata "Kotak Kebaikan Cinta" di mana setiap siswa melakukan satu kebaikan tersembunyi bagi temannya.'
    },
    desainPembelajaran: {
      capaianPembelajaran: 'Peserta didik mampu memahami, meyakini, dan meneladani sifat-sifat Allah SWT melalui Asmaul Husna Ar-Rahman (Maha Pengasih), serta mampu menampilkan sikap penuh kasih sayang, empati, kelembutan tutur kata, dan saling menghargai dalam kehidupan sehari-hari di sekolah dan rumah sebagai cerminan utama Kurikulum Berbasis Cinta (KBC).',
      lintasDisiplinIlmu: 'Terintegrasi harmonis dengan Bahasa Indonesia (keterampilan membaca cerita naratif inspiratif dan bertutur kata santun), Seni Budaya dan Prakarya (kreativitas membuat "Kartu Doa Kasih Sayang" dan menempelkan daun kebaikan di Pohon Cinta KBC), serta IPAS (menumbuhkan kepedulian dan kebiasaan merawat tumbuhan serta hewan ciptaan Allah SWT).',
      tujuanPembelajaran: [
        'Melalui kegiatan menyimak kisah dan bernyanyi Asmaul Husna, peserta didik mampu menjelaskan makna Asmaul Husna Ar-Rahman (Maha Pengasih) dengan kalimat yang santun, jelas, dan penuh keyakinan.',
        'Melalui pengamatan kartu gambar visual dan diskusi kelompok, peserta didik mampu mengidentifikasi minimal 3 bukti nyata wujud kasih sayang Allah SWT di lingkungan keluarga, sekolah, dan alam semesta dengan cermat.',
        'Melalui simulasi aksi KBC berpasangan, peserta didik mampu mempraktikkan sikap saling menyayangi, bertutur kata lembut, dan membantu teman kesulitan dalam interaksi pembelajaran harian.'
      ]
    },
    kerangkaPembelajaran: {
      praktekPedagogik: 'Pendekatan Pembelajaran Berkesadaran (Mindful Learning), Deep Learning melalui metode bercerita dialogis (Storytelling), Diskusi Kelompok Reflektif, dan Simulasi Kasih Sayang (Roleplay).',
      kemitraanPembelajaran: 'Kerja sama dengan Orang Tua melalui "Jurnal Kasih Sayang Rumah" (mencatat kebaikan anak di rumah), serta kolaborasi dengan Guru Bimbingan untuk membangun iklim kelas aman tanpa perundungan.',
      lingkunganPembelajaran: 'Ruang kelas yang ramah anak, berhias pohon cinta interaktif, pengaturan duduk melingkar yang hangat, serta aturan kesepakatan kelas berlandaskan tutur kata sopan.',
      pemanfaatanDigital: 'Penggunaan Media Digital Interaktif berupa Soal Kuis Digital, Flashcard Pembelajaran Digital, dan Ilustrasi Visual AI "Taman Kasih Sayang Ar-Rahman".'
    },
    pengalamanBelajar: {
      kegiatanAwal: {
        durasi: '10 Menit',
        kegiatan: [
          'Guru membuka pembelajaran dengan menyapa seluruh peserta didik secara ramah dan penuh kehangatan: "Assalamu’alaikum anak-anakku yang disayangi Allah SWT, bagaimana perasaan hati kalian hari ini?", diikuti pembiasaan budaya 5S (Senyum, Sapa, Salam, Sopan, Santun).',
          'Berdoa bersama dipimpin oleh ketua kelas dengan khusyuk dan penuh penghayatan, dilanjutkan melantunkan bacaan Asmaul Husna Ar-Rahman bersama-sama diiringi irama syahdu untuk menenangkan jiwa.',
          'Pemeriksaan Kesiapan Belajar & Emotion Check-in: Guru meminta siswa memilih emoji perasaan hari ini pada papan refleksi emosi kelas untuk memastikan kesiapan psikologis murid.',
          'Apersepsi Penuh Cinta: Guru menampilkan gambar ilustrasi seorang ibu yang menyayangi bayinya dan bertindak interaktif: "Siapakah di rumah yang paling menyayangi kita? Bagaimanakah kasih sayang Allah SWT yang melingkupi seluruh alam semesta tanpa pilih kasih?"',
          'Penyampaian Tujuan & Motivasi KBC: Guru menyampaikan tujuan pembelajaran, skenario alur aktivitas harian, serta memberikan dorongan motivasi bahwa belajar Asmaul Husna adalah wujud cinta kita kepada Allah SWT dan Rasul-Nya.'
        ]
      },
      kegiatanInti: {
        durasi: '45 Menit',
        kegiatan: [
          'Eksplorasi Konsep & Literasi KBC: Peserta didik menyimak pembacaan teks kisah inspiratif "Anak Pengasih di Madrasah" yang menggambarkan peneladanan sifat Ar-Rahman dalam kehidupan harian.',
          'Identifikasi & Penalaran Kritis: Guru memfasilitasi tanya jawab interaktif dengan memberikan pertanyaan terbuka: "Mengapa kita wajib mengasihi teman yang sedang kesulitan? Bagaimana perasaan teman saat kita membantunya?"',
          'Pengelompokan Heterogen Ramah Anak: Peserta didik dibagi menjadi 4 "Kelompok Cinta" yang inklusif untuk mendiskusikan kartu gambar peristiwa (contoh: teman terjatuh, tanaman layu, kucing kelaparan).',
          'Investigasi & Diskusi Kolaboratif: Dalam kelompok, murid mendiskusikan solusi kebaikan dan tindakan nyata kasih sayang yang paling sesuai sebagai wujud meneladani Ar-Rahman.',
          'Bimbingan Terarah & Diferensiasi (Scaffolding): Guru mendampingi kelompok secara bergantian, memberikan bantuan khusus berupa kartu petunjuk bergambar bagi kelompok belum paham, serta memberikan tantangan peran tutor sebaya bagi kelompok paham utuh.',
          'Peragaan & Simulasi Nyata: Masing-masing kelompok mensimulasikan satu adegan bertutur kata santun dan menolong teman di depan kelas secara bergantian.',
          'Presentasi Penuh Apresiasi: Masing-masing kelompok menyampaikan hasil diskusinya. Kelompok lain menyimak dengan tertib dan memberikan apresiasi berupa "Tepuk Kasih Sayang" dan kata-kata pujian membangun.',
          'Penguatan Digital & Media Interaktif: Guru mengonfirmasi pemahaman konsep siswa melalui tayangan flashcard digital interaktif dan latihan kuis interaktif singkat di layar.'
        ]
      },
      mengaplikasi: {
        durasi: '10 Menit',
        kegiatan: [
          'Praktik Nyata Berpasangan (Aksi Cinta): Peserta didik berpasangan dengan teman di sebelahnya, bertukar senyum hangat dan menyampaikan kalimat apresiasi tulus: "Terima kasih sudah menjadi teman yang baik dan selalu bersikap lembut kepadaku."',
          'Pembuatan Karya "Daun Cinta": Masing-masing siswa menuliskan satu janji aksi kebaikan harian di atas lembaran kertas berbentuk daun, lalu menempelkannya pada Pohon Cinta KBC kelas.',
          'Misi Kebaikan Tersembunyi: Murid mengambil satu kupon dari "Kotak Kebaikan Cinta KBC" yang berisi satu tugas kebaikan rahasia untuk dipraktikkan hingga jam istirahat.'
        ]
      },
      merefleksi: {
        durasi: '5 Menit',
        kegiatan: [
          'Kontemplasi & Hening Sejenak: Peserta didik memejamkan mata sejenak diiringi irama instrumen seruling lembut, merenungkan nikmat kesehatan, keberadaan orang tua, dan teman-teman baik pemberian Allah SWT.',
          'Refleksi Emosi & Lembar Refleksi: Peserta didik menuliskan satu kalimat rasa syukur dan komitmen kebaikan harian pada jurnal refleksi emosi siswa.',
          'Saling Mengapresiasi (Peer Appreciation): Murid secara bergantian menyampaikan ungkapan terima kasih kepada teman sekelompok atas kerja sama yang menyenangkan selama pelajaran.'
        ]
      },
      penutup: {
        durasi: '10 Menit',
        kegiatan: [
          'Rangkuman & Kesimpulan Bersama: Guru bersama peserta didik merangkum poin-poin utama pembelajaran bahwa meneladani Ar-Rahman wujudnya adalah menyayangi seluruh ciptaan Allah.',
          'Apresiasi Positif & Bintang KBC: Guru memberikan pujian dan memberikan bintang kebaikan KBC bagi seluruh kelas atas kesungguhan, ketertiban, dan kehangatan kerja sama.',
          'Tindak Lanjut Bersama Orang Tua: Guru mengarahkan siswa untuk mempraktikkan kasih sayang di rumah dan mencatatnya dalam "Jurnal Kasih Sayang Keluarga".',
          'Doa Penutup & Salam Kasih: Pembacaan doa Kaffaratul Majlis bersama-sama, memohon keberkahan ilmu, dan diakhiri dengan salam kasih kehangatan KBC.'
        ]
      }
    },
    assesmen: {
      teknikAssesmen: 'Asesmen Diagnostik (Awal), Asesmen Formatif (Observasi Sikap Cinta & Performa Diskusi), serta Asesmen Sumatif (Kuis Interaktif & LKPD Mandiri).',
      rubrikAssesmenSikapCinta: 'Rubrik Sikap Kasih Sayang (Skor 1-4): 1. Berkata Lembut dan Santun, 2. Empati Membantu Teman, 3. Menjaga Kebersihan Kelas, 4. Menghargai Perbedaan.',
      instrumenPenilaian: 'Lembar Observasi Perilaku Berbasis Cinta, Format Penilaian LKPD, dan Catatan Anekdot Perkembangan Karakter Murid.',
      lkpd: {
        judulLkpd: 'Lembar Kerja Peserta Didik (LKPD): "Jejak Kasih Sayang Ar-Rahman di Sekitarku"',
        petunjuk: 'Bacalah setiap petunjuk dengan teliti dan penuh senyuman. Kerjakan dengan jujur dan semangat kebaikan!',
        tugasAktivitas: [
          'Aktivitas 1: Lingkarilah gambar yang menunjukkan tindakan meneladani sifat Ar-Rahman (Maha Pengasih).',
          'Aktivitas 2: Tuliskan 3 wujud kasih sayang yang pernah kamu terima dari Allah SWT minggu ini.',
          'Aktivitas 3: Gambarkan atau ceritakan satu rencana kebaikan yang akan kamu lakukan untuk orang tuamu sore nanti.'
        ],
        pertanyaanDiskusi: [
          'Mengapa kita harus menyayangi teman yang berbeda dengan kita?',
          'Apa yang kamu rasakan ketika kamu membantu teman yang sedang bersedih?'
        ],
        lembarRefleksiSiswa: 'Hari ini saya merasa senang karena bisa belajar tentang Ar-Rahman. Janji saya adalah akan selalu bersikap lembut dan tidak memanggil teman dengan julukan buruk.'
      },
      mediaDigital: {
        soalKuis: [
          {
            id: 'q1',
            pertanyaan: 'Asmaul Husna "Ar-Rahman" artinya adalah Allah Maha...',
            pilihan: ['Pengasih', 'Penyayang', 'Pencipta', 'Pengampun'],
            kunciJawaban: 0,
            penjelasanKbc: 'Benar sekali! Ar-Rahman berarti Allah Maha Pengasih kepada seluruh makhluk di alam semesta tanpa terkecuali.'
          },
          {
            id: 'q2',
            pertanyaan: 'Contoh perilaku meneladani sifat Ar-Rahman kepada teman di madrasah adalah...',
            pilihan: [
              'Ejekan ketika teman salah',
              'Membagi bekal makanan dengan ikhlas dan tersenyum',
              'Membiarkan teman membawa beban berat sendirian',
              'Hanya mau berteman dengan anak yang kaya'
            ],
            kunciJawaban: 1,
            penjelasanKbc: 'Hebat! Membagi makanan dan tersenyum ramah adalah wujud nyata kasih sayang yang dicintai Allah SWT.'
          },
          {
            id: 'q3',
            pertanyaan: 'Ketika ada kucing yang kelaparan di halaman sekolah, sikap murid berlandaskan Kurikulum Berbasis Cinta adalah...',
            pilihan: [
              'Mengusirnya dengan keras',
              'Memberinya sisa makanan atau air bersih dengan lembut',
              'Menakut-nakutinya sampai lari',
              'Membiarkannya tanpa kepedulian'
            ],
            kunciJawaban: 1,
            penjelasanKbc: 'Luar biasa! Menyayangi hewan adalah bagian dari Cinta Alam Lingkungan cerminan Ar-Rahman.'
          }
        ],
        materiInteraktif: {
          ringkasanRingkas: 'Sifat Ar-Rahman mengajarkan kita bahwa Allah SWT melimpahkan kasih sayang-Nya kepada semua makhluk. Sebagai murid madrasah, kita dianjurkan menebarkan senyum, tutur kata santun, dan bantuan penuh kehangatan.',
          poinPenting: [
            'Ar-Rahman = Maha Pengasih tanpa batas.',
            'Cinta kepada Allah diwujudkan dengan mencintai ciptaan-Nya.',
            'Tutur kata yang lembut adalah sedekah kasih sayang.'
          ],
          flashcards: [
            { id: 'f1', depan: 'Apa arti Ar-Rahman?', belakang: 'Allah Maha Pengasih kepada seluruh makhluk.' },
            { id: 'f2', depan: 'Bagaimana cara menyayangi orang tua?', belakang: 'Mendengarkan nasihatnya, membantu pekerjaan rumah, dan mendoakannya setiap hari.' },
            { id: 'f3', depan: 'Apa contoh cinta lingkungan?', belakang: 'Menyiram tanaman, tidak membuang sampah sembarangan, dan menyayangi hewan.' }
          ]
        },
        gambarInteraktif: {
          deskripsiVisual: 'Ilustrasi suasana kelas Madrasah Ibtidaiyah yang hangat, terang, berhiaskan Pohon Cinta KBC, murid-murid berbaju seragam rapi saling membantu dan tersenyum.',
          promptGambar: 'A colorful warm vector illustration for Islamic elementary school Madrasah classroom with Indonesian students smiling, helping each other, a banner saying Modul Ajar Berbasis Cinta, educational posters, high quality flat design style.',
          imageUrl: 'https://image.pollinations.ai/prompt/A%20colorful%20warm%20vector%20illustration%20for%20Islamic%20elementary%20school%20Madrasah%20classroom%20with%20Indonesian%20students%20smiling%20helping%20each%20other%20child%20friendly?width=800&height=600&nologo=true',
          hotspots: [
            { x: 30, y: 40, judul: 'Pohon Cinta KBC', penjelasan: 'Tempat siswa menempelkan daun kebaikan harian mereka.' },
            { x: 70, y: 50, judul: 'Area Berbagi Bekal', penjelasan: 'Sudut di mana siswa saling membagi bekal dan belajar rasa syukur.' }
          ]
        }
      }
    }
  },
  {
    id: 'sample-modul-2',
    judul: 'Modul Ajar Fikih - Indahnya Wudhu dengan Kasih Sayang & Menjaga Kesucian',
    modeBuat: 'MANUAL',
    createdAt: '2026-07-24T08:30:00Z',
    updatedAt: '2026-07-24T08:30:00Z',
    kopSurat: DEFAULT_KOP_SURAT,
    ttd: DEFAULT_TTD,
    identitas: {
      namaMadrasah: 'MI Ma\'arif NU 2 Sanggreman',
      mataPelajaran: 'Fikih',
      materi: 'Tata Cara Wudhu yang Tertib dan Sempurna Berlandaskan Rasa Cinta Kepada Allah SWT',
      faseKelas: 'Fase A (Kelas II MI)',
      semester: 'Ganjil (1)',
      tahunPelajaran: '2025/2026',
      alokasiWaktu: '2 x 35 Menit (2 JP)'
    },
    identifikasi: {
      kesiapanMurid: {
        pahamUtuh: 'Peserta didik kategori mahir/paham utuh telah menghafal urutan 6 rukun wudhu secara sempurna, lancar membaca niat dan doa setelah wudhu, serta mampu memperagakan gerakan membasuh secara tertib dan mandiri. Tindak lanjut diferensiasi: Ditugaskan menjadi "Pendamping Berwudhu Cinta" untuk membantu mengawasi dan menuntun ketertiban teman kelompok di tempat wudhu.',
        pahamSebagian: 'Peserta didik kategori berkembang/paham sebagian mengetahui rukun wudhu secara umum, namun urutan gerakannya terkadang masih tertukar, kurang sempurna dalam meratakan air hingga batas anggota wudhu, atau masih cenderung boros air saat memutar keran. Tindak lanjut diferensiasi: Diberikan pandangan visual stiker langkah wudhu di dekat keran serta pendampingan langsung oleh guru.',
        belumPaham: 'Peserta didik kategori perlu intervensi/belum paham belum mengenal bacaan niat wudhu, belum membedakan antara rukun dan sunnah wudhu, serta memerlukan contoh gerakan langsung secara perlahan. Tindak lanjut diferensiasi: Diberikan latihan khusus (scaffolding) dengan peragaan fisik gerakan wudhu tanpa air dulu (tayammum/simulasi) dan dibantu kartu bimbingan bergambar.'
      },
      materiPelajaran: '1. Pengertian Wudhu & Urgensinya sebagai Syarat Sah Shalat dan Bersuci dari Hadats Kecil.\n2. Niat Wudhu & Doa Setelah Wudhu (Lafaz, arti, dan keutamaan membaca doa dengan mengangkat kedua tangan).\n3. Rukun & Sunnah Wudhu Runtut (Membasuh wajah, membasuh kedua tangan hingga siku, mengusap sebagian kepala, membasuh kedua kaki hingga mata kaki, serta tertib).\n4. Adab Berwudhu & Hemat Air (Menjaga kebersihan tempat bersuci, antre dengan penuh kesabaran, dan tidak membuang-buang air sebagai bentuk Cinta Alam Lingkungan).',
      dimensiProfilLulusan: [
        'Beriman, Bertakwa, & Berakhlak Mulia: Menjaga kesucian lahir dan batin sebagai wujud ketaatan ibadah dan kecintaan kepada Allah SWT.',
        'Mandiri: Mampu melaksanakan wudhu secara tertib dan disiplin tanpa harus selalu disuruh atau dibantu orang tua.',
        'Toleransi & Kesabaran (Tasamuh): Membiasakan sikap sabar saat mengantre di tempat wudhu madrasah dan saling mendahulukan teman.'
      ],
      topikPancaCinta: [
        'Cinta Allah SWT & Rasul-Nya: Meneladani sunnah Rasulullah SAW dalam bersuci untuk mendekatkan diri kepada Allah SWT.',
        'Cinta Ilmu & Alam Lingkungan: Menggunakan air secara hemat dan bijak saat berwudhu untuk menjaga kelestarian ekosistem bumi.',
        'Cinta Diri Sendiri & Kesehatan: Menjaga kebersihan tubuh dan anggota wudhu agar terhindar dari penyakit serta tampil segar berwibawa.'
      ],
      materiIntegrasiKBC: 'Integrasi KBC: Wudhu diajarkan bukan sekadar ritual fisik, melainkan proses membasuh hati dari sifat tidak baik, diawali dengan kesadaran cinta kebersihan, kelembutan bersikap, dan hemat air untuk kelestarian bumi.'
    },
    desainPembelajaran: {
      capaianPembelajaran: 'Peserta didik mampu memahami, melafalkan doa, dan memperagakan tata cara bersuci (wudhu) dengan baik, benar, tertib, beradab, dan hemat air sebagai wujud nyata cinta kebersihan dan ketaatan ibadah kepada Allah SWT.',
      lintasDisiplinIlmu: 'Sains dan Lingkungan Hidup (pemahaman akan pentingnya menjaga kebersihan air dan konservasi sumber daya alam) serta PJOK (koordinasi motorik halus dan keseimbangan tubuh saat melakukan gerakan membasuh wudhu).',
      tujuanPembelajaran: [
        'Melalui tayangan video simulasi dan peragaan guru, peserta didik mampu menyebutkan 6 rukun wudhu secara runtut, jelas, dan percaya diri.',
        'Melalui pembiasaan rutin sebelum shalat dhuha, peserta didik mampu melafalkan niat wudhu dan doa setelah wudhu dengan lancar dan khusyuk.',
        'Melalui praktik wudhu terbimbing di madrasah, peserta didik mampu memperagakan gerakan wudhu secara mandiri, tertib, dan hemat air.'
      ]
    },
    kerangkaPembelajaran: {
      praktekPedagogik: 'Metode Demonstrasi Langsung, Lagu Wudhu Cinta, dan Pembimbingan Sebaya (Peer Tutoring).',
      kemitraanPembelajaran: 'Pendampingan Orang Tua saat shalat dan wudhu di rumah lewat lembar kontrol harian.',
      lingkunganPembelajaran: 'Area tempat wudhu madrasah yang bersih, aman, dilengkapi stiker panduan bergambar yang ramah anak.',
      pemanfaatanDigital: 'Video simulasi tata cara wudhu interaktif dan Kuis Pilihan Ganda Digital.'
    },
    pengalamanBelajar: {
      kegiatanAwal: {
        durasi: '10 Menit',
        kegiatan: [
          'Guru menyapa seluruh siswa dengan senyuman gembira, mengucapkan salam KBC, dan mengajak bernyanyi bersama "Lagu Tepuk Wudhu Penuh Cinta" untuk membangkitkan keceriaan.',
          'Pembiasaan Doa & Niat: Berdoa sebelum belajar dan mengajak siswa meluruskan niat belajar Fikih sebagai wujud rasa cinta kepada ajaran Islam.',
          'Tanya Jawab Pemantik Apersepsi: Guru bertanya hangat: "Siapakah yang tadi pagi sudah berwudhu untuk shalat Subuh? Bagaimana rasanya ketika air dingin yang segar membasuh wajah kita?"',
          'Penyampaian Tujuan & Motivasi: Guru menjelaskan tujuan pembelajaran hari ini yaitu belajar bersuci dengan benar dan hemat air.'
        ]
      },
      kegiatanInti: {
        durasi: '45 Menit',
        kegiatan: [
          'Demonstrasi Visual Guru: Guru memperagakan tata cara gerakan wudhu yang benar mulai dari niat, membasuh telapak tangan, hingga membasuh kaki dan membaca doa sesudah wudhu.',
          'Penjelasan Adab & Hemat Air: Guru memberi penekanan khusus tentang cara membuka keran secukupnya agar tidak menyia-nyiakan air ciptaan Allah.',
          'Latihan Berpasangan (Peer Practice): Siswa berlatih berpasangan di dalam kelas saling mengamati dan membetulkan gerakan wudhu teman dengan tutur kata yang santun.',
          'Praktik Langsung Terbimbing: Siswa berjalan tertib menuju tempat wudhu madrasah, mengantre dengan sabar, dan mempraktikkan wudhu langsung di bawah bimbingan guru.',
          'Penguatan Kuis Digital: Sekembalinya ke kelas, siswa menjawab kuis pilihan ganda digital mengenai rukun dan adab wudhu.'
        ]
      },
      mengaplikasi: {
        durasi: '10 Menit',
        kegiatan: [
          'Praktik Melafalkan Doa: Siswa mempraktikkan pelafalan doa setelah wudhu bersama-sama dengan menghadap kiblat, mengangkat kedua tangan, dan hati yang khusyuk.',
          'Aksi Menghemat Air: Siswa membuat komitmen bersama untuk selalu mematikan keran air setelah digunakan.'
        ]
      },
      merefleksi: {
        durasi: '5 Menit',
        kegiatan: [
          'Refleksi Kesegaran Wudhu: Siswa membagikan kesan dan rasa nyaman, segar, serta tenang yang dirasakan setelah membasuh tubuh dengan air wudhu.',
          'Mengisi ceklis refleksi mandiri: "Saya sudah berwudhu dengan tertib dan hemat air."'
        ]
      },
      penutup: {
        durasi: '10 Menit',
        kegiatan: [
          'Rangkuman & Penguatan Guru: Guru merangkum 6 rukun wudhu yang wajib diingat dan dipraktikkan saat shalat di rumah maupun di madrasah.',
          'Apresiasi & Bintang Kebersihan: Guru memberikan apresiasi atas ketertiban dan kesabaran siswa saat mengantre wudhu.',
          'Doa penutup majelis dan salam kehangatan sebelum mengakhiri sesi.'
        ]
      }
    },
    assesmen: {
      teknikAssesmen: 'Tes Unjuk Kerja Praktik Wudhu & Kuis Digital.',
      rubrikAssesmenSikapCinta: 'Rubrik Sikap Cinta Kebersihan & Ketertiban (Tertib Antre, Hemat Air, Lembut Kepada Teman).',
      instrumenPenilaian: 'Lembar Ceklis Praktik Wudhu Mandiri.',
      lkpd: {
        judulLkpd: 'LKPD Fikih: "Aku Bisa Berwudhu dengan Tertib dan Cinta Kebersihan"',
        petunjuk: 'Urutkan nomor pada gambar gerakan wudhu di bawah ini dengan benar!',
        tugasAktivitas: [
          'Berikan angka 1 sampai 6 pada lingkaran gambar sesuai urutan rukun wudhu.',
          'Warnailah kaligrafi bacaan Niat Wudhu dengan warna kesukaanmu!'
        ],
        pertanyaanDiskusi: ['Mengapa kita tidak boleh menyia-nyiakan air saat berwudhu?'],
        lembarRefleksiSiswa: 'Saya berjanji akan selalu berwudhu dengan tenang dan hemat air.'
      },
      mediaDigital: {
        soalKuis: [
          {
            id: 'fq1',
            pertanyaan: 'Rukun wudhu yang pertama setelah berniat adalah...',
            pilihan: ['Membasuh Muka', 'Membasuh Tangan', 'Mengusap Kepala', 'Membasuh Kaki'],
            kunciJawaban: 0,
            penjelasanKbc: 'Benar! Membasuh muka adalah rukun wudhu pertama setelah berniat karena Allah SWT.'
          },
          {
            id: 'fq2',
            pertanyaan: 'Mengapa kita disunnahkan tidak menghamburkan air saat wudhu?',
            pilihan: [
              'Karena air mahal',
              'Sebagai bentuk cinta lingkungan dan tidak mubazir',
              'Agar baju tidak basah saja',
              'Supaya cepat selesai'
            ],
            kunciJawaban: 1,
            penjelasanKbc: 'Hebat! Menjaga kelestarian air adalah amanah cinta alam lingkungan dari Rasulullah SAW.'
          },
          {
            id: 'fq3',
            pertanyaan: 'Makna "Tertib" dalam rukun wudhu adalah...',
            pilihan: [
              'Dilakukan secara berurutan dari awal sampai akhir',
              'Boleh acak mana saja dulu',
              'Hanya dilakukan saat shalat Jumat',
              'Dikerjakan sambil berlari'
            ],
            kunciJawaban: 0,
            penjelasanKbc: 'Luar biasa! Tertib melatih kedisiplinan dan kerapian diri murid madrasah.'
          }
        ],
        materiInteraktif: {
          ringkasanRingkas: 'Wudhu adalah cara bersuci dari hadas kecil. Dilakukan dengan tertib, khusyuk, serta menjaga air agar tidak terbuang sia-sia sebagai bentuk cinta lingkungan.',
          poinPenting: [
            'Niat wudhu dilakukan dalam hati saat membasuh muka.',
            'Tertib artinya berurutan dari awal sampai akhir tanpa terputus.',
            'Hemat air adalah wujud cinta lingkungan yang diajarkan Islam.'
          ],
          flashcards: [
            { id: 'ff1', depan: 'Sebutkan 6 Rukun Wudhu!', belakang: '1. Niat, 2. Membasuh Muka, 3. Membasuh Tangan sampai Siku, 4. Mengusap Kepala, 5. Membasuh Kaki sampai Mata Kaki, 6. Tertib.' },
            { id: 'ff2', depan: 'Apa arti Hadas Kecil?', belakang: 'Kondisi tidak suci yang disucikan dengan cara berwudhu atau bertayamum.' },
            { id: 'ff3', depan: 'Mengapa wudhu penting?', belakang: 'Wudhu adalah syarat sah shalat dan sarana membersihkan lahir serta batin.' }
          ]
        },
        gambarInteraktif: {
          deskripsiVisual: 'Ilustrasi langkah-langkah wudhu anak madrasah yang bahagia, rapi, dan fasilitas air jernih mengalir hemat.',
          promptGambar: 'Vector illustration of young Muslim boy performing wudhu ablution neatly and cheerfully in clean Islamic school fountain area, high quality educational style.',
          imageUrl: 'https://image.pollinations.ai/prompt/Vector%20illustration%20of%20young%20Muslim%20boy%20performing%20wudhu%20ablution%20neatly%20and%20cheerfully%20in%20clean%20Islamic%20school%20fountain%20area%20child%20friendly?width=800&height=600&nologo=true',
          hotspots: [
            { x: 35, y: 45, judul: 'Kran Air Hemat', penjelasan: 'Menggunakan aliran air secukupnya tanpa berlebihan.' },
            { x: 65, y: 55, judul: 'Area Wudhu Bersih', penjelasan: 'Suasana bersuci yang teratur dan ramah lingkungan.' }
          ]
        }
      }
    }
  }
];
