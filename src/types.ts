export interface KopSuratSettings {
  namaInstansiAtas?: string;
  namaKantor: string;
  namaMadrasah: string;
  alamatMadrasah: string;
  kontakMadrasah: string;
  website: string;
  logoUrl: string | null;
  logoPosisi: 'kiri' | 'kiri-kanan' | 'tengah';
}

export interface TTDSettings {
  tempatPenetapan: string;
  tanggalPenetapan: string;
  tanggalMode?: 'otomatis' | 'manual';
  tanggalPenetapanManual?: string;
  kepalaMadrasahNama: string;
  kepalaMadrasahNIP: string;
  guruKelasNama: string;
  guruKelasNIP: string;
  jabatanGuru: string;
}

export interface MadrasahItem {
  id: string; // Kode unik e.g. "mi-maarif-nu-2-sanggreman"
  nama: string; // Nama Madrasah e.g. "MI Ma'arif NU 2 Sanggreman"
  kodeMadrasah: string; // Kode Singkat / Identitas Madrasah
  jenjang?: 'RA' | 'MI' | 'MTs' | 'MA' | 'MAK' | string; // Jenjang Pendidikan
  nsm?: string; // Nomor Statistik Madrasah (NSM)
  npsn?: string; // Nomor Pokok Sekolah Nasional (NPSN)
  nsmOrNpsn?: string; // Legacy/Fallback NSM atau NPSN
  statusSekolah?: 'Swasta' | 'Negeri' | string;
  akreditasi?: 'A (Unggul)' | 'B (Baik)' | 'C' | 'Belum Terakreditasi' | string;
  noSkAkreditasi?: string; // Nomor SK BAN-S/M
  tglAkreditasi?: string; // Tgl/Masa Berlaku Akreditasi
  skIzinOperasional?: string; // Nomor SK Izin Operasional (Kemenag)
  tglSkIzinOperasional?: string; // Tanggal SK Izin Operasional
  tahunBerdiri?: string; // Tahun Berdiri Madrasah
  kepalaMadrasah?: string; // Nama Kepala Madrasah beserta Gelar
  nipKepalaMadrasah?: string; // NIP/NPK Kepala Madrasah
  namaYayasan?: string; // Naungan / Yayasan / Instansi e.g. "LP Ma'arif NU Banyumas"
  noSkYayasan?: string; // Nomor SK Pendirian Yayasan / Badan Hukum
  alamat?: string; // Alamat Jalan / RT / RW
  rtRw?: string; // RT / RW
  dusun?: string; // Dusun / Dukuh
  alamatLengkap?: string; // Alamat Lengkap
  desaKelurahan?: string; // Desa / Kelurahan
  kecamatan?: string; // Kecamatan
  kotaKabupaten?: string; // Kabupaten / Kota
  provinsi?: string; // Provinsi
  kodePos?: string; // Kode Pos
  titikKoordinat?: string; // Titik Koordinat GPS (Lat, Long)
  kontak?: string; // No Telepon / WhatsApp
  email?: string; // Email Resmi Madrasah
  website?: string; // Website / Web Page
  logoUrl?: string | null; // Logo Madrasah
  // Statistik EMIS
  jumlahSiswaL?: number;
  jumlahSiswaP?: number;
  jumlahRombel?: number;
  jumlahGuruL?: number;
  jumlahGuruP?: number;
  jumlahTendik?: number;
  createdAt: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  tableName?: string;
  isEnabled: boolean;
  lastSyncedAt?: string | null;
}

export interface MysqlConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  tableName?: string;
  apiUrl?: string;
  apiKey?: string;
  isEnabled: boolean;
  lastSyncedAt?: string | null;
}

export type KategoriJabatanGuru = 'guru_kelas' | 'guru_mapel' | 'kepala_madrasah' | 'tendik';

export interface TeacherItem {
  id: string;
  no?: number;
  nama: string; // Nama Lengkap
  gelar?: string; // Gelar Akademik / Keagamaan e.g. "S.Pd.I", "M.Pd"
  nik?: string; // NIK 16 digit
  pin?: string; // PIN 6 digit login (default: 123456)
  hakAkses?: 'guru' | 'admin' | 'operator' | 'tendik' | 'wali_kelas' | 'kepala_madrasah' | string;
  nip?: string; // NIP Pegawai
  nuptk?: string; // NUPTK
  npk?: string; // NPK Kemenag
  pegIdSimpatika?: string; // Peg ID Simpatika / SIAGA
  kategoriJabatan?: KategoriJabatanGuru | string; // Pemisahan eksplisit: 'guru_kelas' | 'guru_mapel' | 'kepala_madrasah' | 'tendik'
  jabatanGuru?: string; // Kategori label: "Guru Kelas" | "Guru Mata Pelajaran" | "Kepala Madrasah" | "Tendik"
  jabatanMapel?: string; // Jabatan spesifik / Mapel Utama e.g. "Guru Kelas 1", "Guru Akidah Akhlak"
  jabatanAtauKelas?: string; // Fallback alias
  kelasTugas?: string; // Khusus Guru Kelas e.g. "Kelas 1 (Fase A)"
  mapelUtama?: string; // Khusus Guru Mapel e.g. "Akidah Akhlak", "Fiqih", "Bahasa Arab"
  statusKepegawaian?: 'PNS' | 'PPPK' | 'GTY' | 'GTT' | 'Honorer' | 'Tendik' | string;
  jenisKelamin?: 'L' | 'P' | 'Laki-laki' | 'Perempuan';
  noWhatsapp?: string; // No WhatsApp / HP
  kontak?: string; // Alias
  email?: string;
  bebanJtm?: number | string; // Beban Jam Tatap Muka (JTM) per minggu
  username?: string; // Username / ID login khusus
  mapelAmpu?: string[]; // Daftar mata pelajaran yang diampu guru
  kelasAmpu?: string[]; // Daftar kelas / fase yang diampu guru
  status?: 'aktif' | 'nonaktif';
  createdAt?: string;
}

export interface SeksiIdentitas {
  namaMadrasah: string;
  mataPelajaran: string;
  materi: string;
  faseKelas: string;
  semester: 'Ganjil (1)' | 'Genap (2)';
  tahunPelajaran: string;
  alokasiWaktu: string;
  tanggalPelaksanaan?: string;
}

export interface MateriBankItem {
  id: string;
  mataPelajaran: string;
  faseKelas: string;
  judulMateri: string;
  uraianMateri: string;
  semester?: 'Ganjil (1)' | 'Genap (2)';
  tahunAjaran?: string;
  topikPancaCintaDefault?: string[];
  capaianPembelajaranDefault?: string;
  tujuanPembelajaranDefault?: string[];
  isDefault?: boolean;
}

export interface SeksiIdentifikasi {
  kesiapanMurid: {
    pahamUtuh: string;
    pahamSebagian: string;
    belumPaham: string;
  };
  materiPelajaran: string;
  dimensiProfilLulusan: string[];
  topikPancaCinta: string[];
  materiIntegrasiKBC: string;
}

export interface SeksiDesainPembelajaran {
  capaianPembelajaran: string;
  lintasDisiplinIlmu: string;
  tujuanPembelajaran: string[];
}

export interface SeksiKerangkaPembelajaran {
  praktekPedagogik: string;
  kemitraanPembelajaran: string;
  lingkunganPembelajaran: string;
  pemanfaatanDigital: string;
}

export interface LangkahKegiatan {
  kegiatanAwal: {
    durasi: string;
    kegiatan: string[];
  };
  kegiatanInti: {
    durasi: string;
    kegiatan: string[];
  };
  mengaplikasi: {
    durasi: string;
    kegiatan: string[];
  };
  merefleksi: {
    durasi: string;
    kegiatan: string[];
  };
  penutup: {
    durasi: string;
    kegiatan: string[];
  };
}

export interface SoalKuis {
  id: string;
  pertanyaan: string;
  pilihan: string[];
  kunciJawaban: number;
  penjelasanKbc: string;
}

export interface Flashcard {
  id: string;
  depan: string;
  belakang: string;
}

export interface HotspotGambar {
  x: number;
  y: number;
  judul: string;
  penjelasan: string;
}

export interface SiswaItem {
  id: string;
  rombelId: string;
  nisn: string;
  nis?: string;
  nik?: string;
  namaSiswa: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir?: string;
  tanggalLahir?: string;
  alamat?: string;
  noHp?: string;
  namaAyah?: string;
  namaIbu?: string;
  nomorKipPip?: string;
}

export interface StudentAccount {
  id: string;
  nisn: string;
  nik?: string;
  nama: string;
  kelas: string;
  pin: string;
  jenisKelamin?: 'L' | 'P';
  tempatLahir?: string;
  tanggalLahir?: string;
  alamat?: string;
  noHp?: string;
  namaAyah?: string;
  namaIbu?: string;
  nomorKipPip?: string;
  rombelId?: string;
  createdAt: string;
}

export interface StudentQuizResultDetail {
  soalId: string;
  pertanyaan: string;
  pilihan: string[];
  jawabanSiswaIndex: number;
  kunciJawabanIndex: number;
  isBenar: boolean;
  penjelasanKbc?: string;
}

export interface StudentQuizResult {
  id: string;
  studentId: string;
  studentName: string;
  nisn: string;
  kelas: string;
  rombelId?: string;
  modulId: string;
  modulJudul: string;
  mataPelajaran: string;
  materi?: string;
  faseKelas?: string;
  guruPengampu?: string;
  guruNip?: string;
  skor: number;
  totalSoal: number;
  nilai: number;
  tanggal: string;
  waktuPengerjaan?: string;
  durasiDetik?: number;
  detailJawaban?: StudentQuizResultDetail[];
}

export interface HasilKuisItem {
  id: string;
  namaSiswa: string;
  skor: number;
  totalSoal: number;
  nilai: number;
  tanggal: string;
  studentId?: string;
  nisn?: string;
  kelas?: string;
  rombelId?: string;
  guruPengampu?: string;
  guruNip?: string;
  detailJawaban?: StudentQuizResultDetail[];
}

export interface MediaDigital {
  soalKuis: SoalKuis[];
  riwayatHasilKuis?: HasilKuisItem[];
  materiInteraktif: {
    ringkasanRingkas: string;
    poinPenting: string[];
    flashcards: Flashcard[];
  };
  gambarInteraktif: {
    deskripsiVisual: string;
    promptGambar: string;
    imageUrl?: string;
    hotspots?: HotspotGambar[];
  };
}

export interface SeksiAssesmen {
  teknikAssesmen: string;
  rubrikAssesmenSikapCinta: string;
  instrumenPenilaian: string;
  lkpd: {
    judulLkpd: string;
    petunjuk: string;
    tugasAktivitas: string[];
    pertanyaanDiskusi: string[];
    lembarRefleksiSiswa: string;
  };
  mediaDigital: MediaDigital;
}

export interface ModulAjarCinta {
  id: string;
  judul: string;
  modeBuat: 'AI' | 'MANUAL';
  createdAt: string;
  updatedAt: string;
  penyusun?: string;
  guruPengampu?: string;
  identitas: SeksiIdentitas;
  identifikasi: SeksiIdentifikasi;
  desainPembelajaran: SeksiDesainPembelajaran;
  kerangkaPembelajaran: SeksiKerangkaPembelajaran;
  pengalamanBelajar: LangkahKegiatan;
  assesmen: SeksiAssesmen;
  kopSurat: KopSuratSettings;
  ttd: TTDSettings;
}

export const PANCA_CINTA_OPTIONS = [
  'Cinta Allah SWT & Rasul-Nya',
  'Cinta Orang Tua & Guru',
  'Cinta Sesama & Bangsa',
  'Cinta Ilmu & Alam Lingkungan',
  'Cinta Diri Sendiri & Kesehatan'
];

export const PROFIL_LULUSAN_OPTIONS = [
  'Beriman, Bertakwa, & Berakhlak Mulia',
  'Berkeadaban (Ta’addub)',
  'Kewarganegaraan dan Kebangsaan (Muwatanah)',
  'Keteladanan (Qudwah)',
  'Toleransi (Tasamuh)',
  'Kesetaraan (Musawah)',
  'Musyawarah (Syura)',
  'Gotong Royong & Empati',
  'Bernalar Kritis & Kreatif',
  'Mandiri'
];

export const MAPEL_MI_OPTIONS = [
  'Akidah Akhlak',
  'Al-Qur’an Hadis',
  'Fikih',
  'Sejarah Kebudayaan Islam (SKI)',
  'Bahasa Arab',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'IPAS (Ilmu Pengetahuan Alam & Sosial)',
  'Seni Budaya & Prakarya',
  'Pendidikan Jasmani, Olahraga & Kesehatan'
];

export const DEFAULT_TAHUN_AJARAN_OPTIONS = [
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028'
];

export interface WelcomeBannerConfig {
  judulBanner: string;
  subJudulBanner: string;
  mottoBanner: string;
  kategoriBadge: string;
  gambarUrl?: string;
  tombolUtamaText: string;
  tombolUtamaAction: 'ai-modal' | 'materi-bank' | 'quiz-player' | 'my-modules' | 'master-kurikulum' | 'settings';
  tombolSekunderText: string;
  tombolSekunderAction: 'ai-modal' | 'materi-bank' | 'quiz-player' | 'my-modules' | 'master-kurikulum' | 'settings';
  tombolTersierText: string;
  tombolTersierAction: 'ai-modal' | 'materi-bank' | 'quiz-player' | 'my-modules' | 'master-kurikulum' | 'settings';
  autoDismissSeconds: number;
  isAutoDismissEnabled: boolean;
  isBannerActive: boolean;
  themeStyle: 'emerald' | 'indigo' | 'amber' | 'rose' | 'dark_luxury';

  // Pengaturan Khusus Banner Link Kuis Siswa
  studentBannerActive?: boolean;
  studentJudulBanner?: string;
  studentSubJudulBanner?: string;
  studentBadgeText?: string;
  studentTombolUtamaText?: string;
}

export const DEFAULT_WELCOME_BANNER_CONFIG: WelcomeBannerConfig = {
  judulBanner: "Selamat Datang di Portal Modul Ajar Berbasis Cinta (KBC)",
  subJudulBanner: "Platform Pembelajaran Digital Terintegrasi Kurikulum Berbasis Cinta untuk Madrasah Ibtidaiyah",
  mottoBanner: "Mendidik dengan Cinta, Mengajar dengan Ilmu, Mengabdi dengan Keikhlasan",
  kategoriBadge: "Sistem Informasi & Kurikulum KBC",
  gambarUrl: "",
  tombolUtamaText: "✨ Buat Modul Ajar AI",
  tombolUtamaAction: "ai-modal",
  tombolSekunderText: "📚 Bank Materi & LKPD",
  tombolSekunderAction: "materi-bank",
  tombolTersierText: "⚡ Kuis Interaktif Siswa",
  tombolTersierAction: "quiz-player",
  autoDismissSeconds: 0,
  isAutoDismissEnabled: false,
  isBannerActive: true,
  themeStyle: "emerald",

  studentBannerActive: true,
  studentJudulBanner: "SELAMAT DATANG DI KUIS SISWA 🚀",
  studentSubJudulBanner: "Selamat mengerjakan kuis dan latihan interaktif secara mandiri. Silakan tekan tombol di bawah untuk mulai mengerjakan kuis!",
  studentBadgeText: "🎓 KUIS & LATIHAN SISWA INTERAKTIF",
  studentTombolUtamaText: "🎯 MULAI KERJAKAN KUIS"
};

export type AdminRoleType = 'superadmin' | 'admin' | 'operator' | 'kepala_madrasah';

export interface AdminAccountItem {
  id: string;
  username: string;
  password?: string;
  pin?: string;
  namaLengkap: string;
  role: AdminRoleType;
  email?: string;
  noWhatsapp?: string;
  status: 'aktif' | 'nonaktif';
  madrasahId?: string;
  madrasahNama?: string;
  jabatanKhusus?: string;
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
  isProtected?: boolean;
  notes?: string;
}

export const ALL_ADMIN_PERMISSIONS = [
  { id: 'kelola_modul', label: 'Kelola Modul Ajar (Buat, Edit, Hapus)', category: 'Modul & Kurikulum' },
  { id: 'kelola_bank_materi', label: 'Kelola Bank Materi & LKPD', category: 'Modul & Kurikulum' },
  { id: 'kelola_master_mapel', label: 'Kelola Master Mata Pelajaran & Kurikulum', category: 'Modul & Kurikulum' },
  { id: 'kelola_guru', label: 'Kelola Data Guru, PTK & Penugasan', category: 'Kepegawaian & PTK' },
  { id: 'kelola_siswa', label: 'Kelola Data Siswa & Akun Kuis', category: 'Kesiswaan' },
  { id: 'kelola_pengaturan', label: 'Akses Pengaturan Madrasah & Kop Surat', category: 'Sistem & Konfigurasi' },
  { id: 'kelola_proteksi_dokumen', label: 'Kelola Password Proteksi Dokumen Publik', category: 'Keamanan Akun' },
  { id: 'kelola_admin', label: 'Kelola Akun Admin & Operator Sekolah', category: 'Keamanan Akun' },
  { id: 'kelola_database', label: 'Sinkronisasi Cloud, Supabase & MySQL', category: 'Database & Sync' },
  { id: 'backup_restore', label: 'Cadangkan & Pulihkan Seluruh Data', category: 'Database & Sync' },
];

export interface DocumentProtectionConfig {
  enabled: boolean;
  password: string;
  customMessage?: string;
  allowPublicViewWithoutPrint?: boolean; // false = protect both preview and print, true = protect print only
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export const DEFAULT_DOCUMENT_PROTECTION_CONFIG: DocumentProtectionConfig = {
  enabled: false,
  password: '',
  customMessage: 'Dokumen ini diproteksi oleh Madrasah. Silakan masukkan kata sandi resmi untuk membuka dan mencetak dokumen.',
  allowPublicViewWithoutPrint: false,
};


