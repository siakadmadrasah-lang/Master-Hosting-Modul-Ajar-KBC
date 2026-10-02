import JSZip from 'jszip';
import {
  loadStoredModules,
  loadStoredMateriBank,
  loadKopSurat,
  loadTTD,
  loadStoredTeachers,
  loadStoredStudents,
  loadStoredStudentQuizResults,
  loadCustomMapel,
  loadDeletedMapel,
  loadCustomTahunAjaran,
  loadActiveTahunAjaran,
  loadAdminAccounts,
  loadDocumentProtectionConfig,
  loadMadrasahList,
  getActiveMadrasah,
  loadCustomOgImage,
  BackupDataEnvelope
} from './storage';

export interface BackupStats {
  totalModules: number;
  totalMateri: number;
  totalTeachers: number;
  totalStudents: number;
  totalQuizResults: number;
  madrasahName: string;
  tahunAjaran: string;
  exportedAt: string;
}

function sanitizeFileName(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 50);
}

/**
 * Generate a complete, fully structured ZIP package containing all database entries,
 * individual module JSONs, curriculum materials, PTK, students, and recovery guidance.
 */
export async function generateCompleteBackupZip(): Promise<{ blob: Blob; filename: string; stats: BackupStats }> {
  const zip = new JSZip();

  const modules = loadStoredModules();
  const materiBank = loadStoredMateriBank();
  const kopSurat = loadKopSurat();
  const ttd = loadTTD();
  const teachers = loadStoredTeachers();
  const students = loadStoredStudents();
  const studentQuizResults = loadStoredStudentQuizResults();
  const customMapel = loadCustomMapel();
  const deletedMapel = loadDeletedMapel();
  const customTahunAjaran = loadCustomTahunAjaran();
  const activeTahunAjaran = loadActiveTahunAjaran();
  const adminAccounts = loadAdminAccounts();
  const documentProtection = loadDocumentProtectionConfig();
  const madrasahList = loadMadrasahList();
  const activeMadrasah = getActiveMadrasah();
  const customOgImage = loadCustomOgImage();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

  const stats: BackupStats = {
    totalModules: modules.length,
    totalMateri: materiBank.length,
    totalTeachers: teachers.length,
    totalStudents: students.length,
    totalQuizResults: studentQuizResults.length,
    madrasahName: activeMadrasah?.nama || kopSurat?.namaMadrasah || "MI Ma'arif NU 2 Sanggreman",
    tahunAjaran: activeTahunAjaran || '2025/2026',
    exportedAt: now.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })
  };

  // 1. Primary Full Database Envelope JSON (Single-file master for 1-click restore)
  const masterEnvelope: BackupDataEnvelope = {
    app: 'KBC-MI-Generator',
    version: '1.0',
    exportedAt: now.toISOString(),
    modules,
    materiBank,
    kopSurat,
    ttd,
    teachers,
    students,
    studentQuizResults,
    customMapel,
    deletedMapel,
    customTahunAjaran,
    activeTahunAjaran,
    adminAccounts,
    documentProtection,
    madrasahList,
    activeMadrasah,
    customOgImage
  };

  const masterJsonStr = JSON.stringify(masterEnvelope, null, 2);
  zip.file('cadangan_lengkap_database.json', masterJsonStr);

  // 2. Summary & Recovery Guide (Bilingual / clear Indonesian instructions)
  const readmeText = `================================================================================
PAKET LENGKAP CADANGAN DATA (FULL BACKUP ARCHIVE)
MODUL AJAR KURIKULUM BERBASIS CINTA (KBC) MADRASAH IBTIDAIYAH
================================================================================
Lembaga / Madrasah : ${stats.madrasahName}
Tahun Pelajaran    : ${stats.tahunAjaran}
Waktu Ekspor       : ${stats.exportedAt}
Penyusun / Author  : Jaenal Maskun, S.Pd.I.

RINGKASAN DATA YANG DICADANGKAN:
- Modul Ajar Terstruktur  : ${stats.totalModules} modul
- Bank Materi & LKPD      : ${stats.totalMateri} materi
- Tenaga Pendidik / PTK   : ${stats.totalTeachers} guru & staf
- Data Siswa & Akun Kuis  : ${stats.totalStudents} siswa
- Rekap Riwayat Kuis      : ${stats.totalQuizResults} hasil pengerjaan kuis
- Profil Madrasah         : Profil lengkap & ${madrasahList.length} madrasah terdaftar
- Identitas Kop Surat     : Kop resmi, nomor izin operasional, logo & TTD

STRUKTUR ISI PAKET ZIP INI:
1. cadangan_lengkap_database.json
   -> Berkas master untuk memulihkan seluruh data aplikasi sekaligus dalam 1 klik.
2. ringkasan_cadangan.json
   -> Ringkasan metadata & statistik arsip cadangan ini.
3. folder /modul_ajar/
   -> Tiap modul ajar disimpan rapi sebagai berkas JSON mandiri yang dapat dibaca.
4. folder /bank_materi/
   -> Data materi ajar, capaian pembelajaran (CP), dan tujuan pembelajaran (TP).
5. folder /kepegawaian_guru_ptk/
   -> Data guru, NIK, NIP, PIN login, dan riwayat penugasan kelas/mapel.
6. folder /kesiswaan_dan_kuis/
   -> Data siswa, rombel, dan rekapitulasi nilai kuis interaktif.
7. folder /profil_dan_kop_madrasah/
   -> Informasi profil EMIS, kop surat dinas, dan pengaturan penandatangan dokumen.

CARA MEMULIHKAN DATA (RESTORE KE APLIKASI):
--------------------------------------------------------------------------------
Metode A (Sangat Mudah - Unggah ZIP Langsung):
1. Buka aplikasi Modul Ajar Berbasis Cinta (KBC).
2. Buka menu "Pengaturan" -> pilih tab "Cadangan Data".
3. Pada kartu "Pulihkan / Impor Data", klik tombol "Pilih Berkas Cadangan".
4. Pilih langsung berkas ZIP ini ("${sanitizeFileName(stats.madrasahName)}_...zip").
5. Sistem akan otomatis mendeteksi dan memulihkan seluruh data tanpa perlu diekstrak!

Metode B (Manual - Gunakan JSON Master):
1. Ekstrak arsip ZIP ini ke komputer atau HP Anda.
2. Buka aplikasi KBC -> menu "Pengaturan" -> tab "Cadangan Data".
3. Unggah berkas "cadangan_lengkap_database.json".
4. Data akan langsung terpulihkan dengan sempurna.
================================================================================
`;
  zip.file('BACA_PANDUAN_PEMULIHAN.txt', readmeText);

  zip.file('ringkasan_cadangan.json', JSON.stringify(stats, null, 2));

  // 3. Folder: modul_ajar (Individual clean modular files)
  const modulFolder = zip.folder('modul_ajar');
  if (modulFolder) {
    let modulListTxt = `DAFTAR MODUL AJAR (${modules.length} Modul):\n\n`;
    modules.forEach((mod, idx) => {
      const mapelClean = sanitizeFileName(mod.identitas?.mataPelajaran || 'Mapel');
      const judulClean = sanitizeFileName(mod.identitas?.materi || mod.judul || `Modul_${idx + 1}`);
      const filename = `${String(idx + 1).padStart(2, '0')}_${mapelClean}_${judulClean}.json`;
      modulFolder.file(filename, JSON.stringify(mod, null, 2));
      modulListTxt += `${idx + 1}. [${mod.identitas?.mataPelajaran || '-'}] ${mod.judul || mod.identitas?.materi} (Fase: ${mod.identitas?.faseKelas || '-'})\n`;
    });
    modulFolder.file('daftar_seluruh_modul.txt', modulListTxt);
  }

  // 4. Folder: bank_materi
  const materiFolder = zip.folder('bank_materi');
  if (materiFolder) {
    materiFolder.file('bank_materi_kbc.json', JSON.stringify(materiBank, null, 2));
  }

  // 5. Folder: kepegawaian_guru_ptk
  const guruFolder = zip.folder('kepegawaian_guru_ptk');
  if (guruFolder) {
    guruFolder.file('daftar_guru_ptk.json', JSON.stringify(teachers, null, 2));
  }

  // 6. Folder: kesiswaan_dan_kuis
  const siswaFolder = zip.folder('kesiswaan_dan_kuis');
  if (siswaFolder) {
    siswaFolder.file('daftar_siswa_dan_akun.json', JSON.stringify(students, null, 2));
    siswaFolder.file('rekap_riwayat_kuis.json', JSON.stringify(studentQuizResults, null, 2));
  }

  // 7. Folder: profil_dan_kop_madrasah
  const profilFolder = zip.folder('profil_dan_kop_madrasah');
  if (profilFolder) {
    profilFolder.file('profil_madrasah_aktif.json', JSON.stringify(activeMadrasah, null, 2));
    profilFolder.file('daftar_semua_madrasah.json', JSON.stringify(madrasahList, null, 2));
    profilFolder.file('pengaturan_kop_surat.json', JSON.stringify(kopSurat, null, 2));
    profilFolder.file('pengaturan_tanda_tangan_ttd.json', JSON.stringify(ttd, null, 2));
    profilFolder.file('master_mata_pelajaran.json', JSON.stringify({ customMapel, deletedMapel }, null, 2));
  }

  // Generate ZIP blob with fast and standard compression
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const slug = sanitizeFileName(stats.madrasahName).toLowerCase();
  const filename = `Paket_Lengkap_Cadangan_KBC_${slug}_${dateStr}_${timeStr}.zip`;

  return { blob, filename, stats };
}

/**
 * Extracts and parses backup data from either a ZIP file or direct JSON file.
 * Returns the raw JSON envelope string ready for `importAppDataJson()`.
 */
export async function extractBackupJsonFromUpload(file: File): Promise<{ jsonString: string; isZip: boolean }> {
  const isZip = file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip');

  if (!isZip) {
    const text = await file.text();
    return { jsonString: text, isZip: false };
  }

  const zip = new JSZip();
  const arrayBuffer = await file.arrayBuffer();
  const loadedZip = await zip.loadAsync(arrayBuffer);

  // 1. Direct check for cadangan_lengkap_database.json
  const masterFile = loadedZip.file('cadangan_lengkap_database.json');
  if (masterFile) {
    const content = await masterFile.async('string');
    return { jsonString: content, isZip: true };
  }

  // 2. Search for any JSON file in root or subdirectories containing backup envelope
  const allJsonFiles = Object.keys(loadedZip.files).filter(
    (name) => name.endsWith('.json') && !loadedZip.files[name].dir
  );

  for (const name of allJsonFiles) {
    const f = loadedZip.file(name);
    if (!f) continue;
    const content = await f.async('string');
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && (parsed.app === 'KBC-MI-Generator' || Array.isArray(parsed.modules))) {
        return { jsonString: content, isZip: true };
      }
    } catch (e) {
      // Continue search
    }
  }

  throw new Error('Berkas ZIP tidak memuat berkas cadangan database KBC (cadangan_lengkap_database.json tidak ditemukan).');
}
