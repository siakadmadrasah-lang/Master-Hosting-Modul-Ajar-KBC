import * as XLSX from 'xlsx';
import { TeacherItem, KategoriJabatanGuru } from '../types';

export const PTK_EXCEL_COLUMNS = [
  'No',
  'Nama Lengkap',
  'Gelar',
  'NIK',
  'PIN 6 Digit',
  'Hak Akses',
  'NIP',
  'NUPTK',
  'NPK Kemenag',
  'Peg ID Simpatika',
  'Jabatan (Guru Kelas / Guru Mapel)',
  'Status Kepegawaian',
  'Jenis Kelamin',
  'No WhatsApp',
  'Email',
  'Beban JTM'
] as const;

export const PTK_SAMPLE_DATA = [
  [
    1,
    'Jaenal Maskun',
    'S.Pd.I.',
    '3302141508820001',
    '123456',
    'Guru',
    '197808152009011009',
    '8452756658200022',
    '11823302005401',
    '201889921',
    'Guru Kelas 1 (Fase A)',
    'PNS',
    'Laki-laki',
    '081398765432',
    'jaenal.maskun@kemenag.go.id',
    '24 Jam'
  ],
  [
    2,
    'Siti Rochimah',
    'S.Pd.I.',
    '3302145205780002',
    '654321',
    'Kepala Madrasah',
    '197805122005012006',
    '9345756658200011',
    '11823302005402',
    '201998812',
    'Kepala Madrasah',
    'PNS',
    'Perempuan',
    '081234567890',
    'siti.rochimah@kemenag.go.id',
    '18 Jam'
  ],
  [
    3,
    'Ahmad Fauzi',
    'M.Pd.',
    '3302141010900003',
    '789123',
    'Guru',
    '-',
    '7123756658200033',
    '11823302005403',
    '202117733',
    'Guru Akidah Akhlak & Fiqih',
    'GTY',
    'Laki-laki',
    '085712345678',
    'ahmad.fauzi@gmail.com',
    '24 Jam'
  ],
  [
    4,
    'Nur Laili Rahmawati',
    'S.Pd.',
    '3302146004950004',
    '345678',
    'Guru',
    '-',
    '6543756658200044',
    '11823302005404',
    '202216644',
    'Guru Kelas 4 (Fase B)',
    'GTT',
    'Perempuan',
    '087812345678',
    'nurlaili@gmail.com',
    '24 Jam'
  ],
  [
    5,
    'Muhammad Ridwan',
    'S.Pd.',
    '3302141203920005',
    '554433',
    'Guru',
    '-',
    '7765123456780005',
    '11823302005405',
    '202318855',
    'Guru PJOK',
    'Honorer',
    'Laki-laki',
    '081233445566',
    'ridwan.pjok@gmail.com',
    '24 Jam'
  ]
];

/**
 * Infer category and details between Guru Kelas, Guru Mapel, Kepala Madrasah, and Tendik
 */
export function inferKategoriJabatan(teacher: Partial<TeacherItem>): {
  kategoriJabatan: KategoriJabatanGuru;
  jabatanGuru: string;
  jabatanMapel: string;
  kelasTugas?: string;
  mapelUtama?: string;
} {
  const hak = (teacher.hakAkses || '').toLowerCase();
  const rawJabatan = (teacher.jabatanMapel || teacher.jabatanAtauKelas || teacher.jabatanGuru || '').trim();
  const jLower = rawJabatan.toLowerCase();

  if (hak.includes('kepala') || jLower.includes('kepala madrasah') || jLower.includes('kamad')) {
    return {
      kategoriJabatan: 'kepala_madrasah',
      jabatanGuru: 'Kepala Madrasah',
      jabatanMapel: 'Kepala Madrasah'
    };
  }

  if (hak.includes('tendik') || hak.includes('operator') || jLower.includes('tendik') || jLower.includes('tu') || jLower.includes('operator') || jLower.includes('pustakawan')) {
    return {
      kategoriJabatan: 'tendik',
      jabatanGuru: 'Tenaga Kependidikan',
      jabatanMapel: rawJabatan || 'Tenaga Kependidikan / TU'
    };
  }

  // Check if explicit kategori exists or matches Guru Kelas
  if (teacher.kategoriJabatan === 'guru_kelas' || jLower.includes('guru kelas') || jLower.includes('wali kelas') || /kelas\s*[1-6]/i.test(jLower)) {
    let kelasTugas = teacher.kelasTugas;
    if (!kelasTugas) {
      const match = jLower.match(/kelas\s*([1-6])/i);
      if (match) {
        const num = match[1];
        const fase = (num === '1' || num === '2') ? 'Fase A' : (num === '3' || num === '4') ? 'Fase B' : 'Fase C';
        kelasTugas = `Kelas ${num} (${fase})`;
      }
    }
    const cleanJabatan = rawJabatan || (kelasTugas ? `Guru ${kelasTugas.split(' (')[0]}` : 'Guru Kelas');
    return {
      kategoriJabatan: 'guru_kelas',
      jabatanGuru: 'Guru Kelas',
      jabatanMapel: cleanJabatan,
      kelasTugas: kelasTugas || (teacher.kelasAmpu && teacher.kelasAmpu[0]) || 'Kelas 1 (Fase A)'
    };
  }

  // Default to Guru Mapel
  return {
    kategoriJabatan: 'guru_mapel',
    jabatanGuru: 'Guru Mata Pelajaran',
    jabatanMapel: rawJabatan || 'Guru Mapel',
    mapelUtama: teacher.mapelUtama || (teacher.mapelAmpu && teacher.mapelAmpu[0]) || 'Pendidikan Agama Islam'
  };
}

/**
 * Generate and download official Excel template for PTK (16 columns)
 */
export function downloadPtkExcelTemplate(madrasahName: string = 'Madrasah'): void {
  const wb = XLSX.utils.book_new();
  const wsData = [
    [...PTK_EXCEL_COLUMNS],
    ...PTK_SAMPLE_DATA
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 6 },   // No
    { wch: 26 },  // Nama Lengkap
    { wch: 12 },  // Gelar
    { wch: 20 },  // NIK
    { wch: 14 },  // PIN 6 Digit
    { wch: 18 },  // Hak Akses
    { wch: 22 },  // NIP
    { wch: 20 },  // NUPTK
    { wch: 18 },  // NPK Kemenag
    { wch: 18 },  // Peg ID Simpatika
    { wch: 32 },  // Jabatan Mapel / Kelas
    { wch: 20 },  // Status Kepegawaian
    { wch: 15 },  // Jenis Kelamin
    { wch: 18 },  // No WhatsApp
    { wch: 28 },  // Email
    { wch: 14 }   // Beban JTM
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template_PTK');
  const safeName = madrasahName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  XLSX.writeFile(wb, `Template_Data_Guru_PTK_${safeName}.xlsx`);
}

/**
 * Export current list of teachers to Excel format
 */
export function exportTeachersToExcel(teachers: TeacherItem[], madrasahName: string = 'Madrasah'): void {
  const wb = XLSX.utils.book_new();
  const rows = teachers.map((t, idx) => {
    const meta = inferKategoriJabatan(t);
    return [
      t.no || (idx + 1),
      t.nama || '',
      t.gelar || '',
      t.nik || '',
      t.pin || '123456',
      t.hakAkses || 'guru',
      t.nip || '-',
      t.nuptk || '-',
      t.npk || '-',
      t.pegIdSimpatika || '-',
      t.jabatanMapel || meta.jabatanMapel || 'Guru Mapel',
      t.statusKepegawaian || 'PNS',
      t.jenisKelamin === 'P' || t.jenisKelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
      t.noWhatsapp || t.kontak || '',
      t.email || '',
      t.bebanJtm || '24 Jam'
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([[...PTK_EXCEL_COLUMNS], ...rows]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 12 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 32 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Daftar_PTK');
  const safeName = madrasahName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  XLSX.writeFile(wb, `Daftar_Guru_PTK_${safeName}.xlsx`);
}

/**
 * Parse uploaded Excel file and return array of TeacherItem
 */
export async function parsePtkExcelBuffer(data: ArrayBuffer | string): Promise<{ success: boolean; data: TeacherItem[]; error?: string }> {
  try {
    const workbook = typeof data === 'string'
      ? XLSX.read(data, { type: 'binary', raw: false })
      : XLSX.read(data, { type: 'array', raw: false });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, data: [], error: 'File Excel tidak memiliki lembar kerja (worksheet).' };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawRows || rawRows.length < 2) {
      return { success: false, data: [], error: 'File Excel kosong atau tidak memiliki baris data.' };
    }

    // Find header row index
    const headerRowIndex = rawRows.findIndex(row => 
      Array.isArray(row) && row.some(cell => {
        const str = String(cell).toLowerCase().trim();
        return str.includes('nama') || str.includes('ptk') || str.includes('nik') || str.includes('nip');
      })
    );

    const headerIdx = headerRowIndex >= 0 ? headerRowIndex : 0;
    const headerCells: string[] = (rawRows[headerIdx] || []).map((h: any) => String(h).trim().toLowerCase());

    const findCol = (aliases: string[]): number => {
      return headerCells.findIndex((h: string) => aliases.some(a => h.includes(a)));
    };

    const noIdx = findCol(['no', 'nomor', 'no.']);
    const namaIdx = findCol(['nama lengkap', 'nama guru', 'nama ptk', 'nama']);
    const gelarIdx = findCol(['gelar', 'title', 'gelar akademik']);
    const nikIdx = findCol(['nik', 'no ktp', 'kependudukan']);
    const pinIdx = findCol(['pin 6 digit', 'pin', 'password', 'pass', 'sandi', 'kode pin']);
    const hakAksesIdx = findCol(['hak akses', 'role', 'akses', 'level']);
    const nipIdx = findCol(['nip', 'nip pegawai', 'no nip']);
    const nuptkIdx = findCol(['nuptk', 'no nuptk']);
    const npkIdx = findCol(['npk kemenag', 'npk', 'no npk']);
    const pegIdIdx = findCol(['peg id simpatika', 'peg id', 'pegid', 'simpatika', 'siaga']);
    const jabatanIdx = findCol(['jabatan mapel', 'jabatan', 'guru mapel', 'mapel', 'tugas']);
    const statusKepIdx = findCol(['status kepegawaian', 'status ptk', 'kepegawaian', 'status']);
    const jkIdx = findCol(['jenis kelamin', 'jk', 'gender', 'l/p']);
    const waIdx = findCol(['no whatsapp', 'no wa', 'whatsapp', 'wa', 'kontak', 'no hp', 'telepon']);
    const emailIdx = findCol(['email', 'e-mail', 'surel']);
    const jtmIdx = findCol(['beban jtm', 'jtm', 'jam tatap muka', 'beban mengajar', 'jam']);

    if (namaIdx === -1) {
      return { success: false, data: [], error: 'Kolom "Nama Lengkap" atau "Nama" tidak ditemukan pada baris judul Excel.' };
    }

    const result: TeacherItem[] = [];

    for (let i = headerIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!Array.isArray(row)) continue;

      const rawNama = String(row[namaIdx] || '').trim();
      if (!rawNama || rawNama.toLowerCase() === 'contoh' || rawNama.startsWith('---') || rawNama.toLowerCase().includes('nama lengkap')) {
        continue;
      }

      const rawNo = noIdx >= 0 && row[noIdx] ? parseInt(String(row[noIdx])) || (result.length + 1) : (result.length + 1);
      const rawGelar = gelarIdx >= 0 ? String(row[gelarIdx] || '').trim() : '';
      const rawNik = nikIdx >= 0 ? String(row[nikIdx] || '').replace(/[^0-9]/g, '').trim() : '';
      
      let rawPin = pinIdx >= 0 ? String(row[pinIdx] || '').trim() : '';
      if (!rawPin || rawPin.length < 4) {
        rawPin = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6 digit PIN
      }

      const rawHakAkses = hakAksesIdx >= 0 ? String(row[hakAksesIdx] || '').trim().toLowerCase() : 'guru';
      const cleanHakAkses = rawHakAkses.includes('admin')
        ? 'admin'
        : rawHakAkses.includes('operator')
        ? 'operator'
        : rawHakAkses.includes('kepala')
        ? 'kepala_madrasah'
        : rawHakAkses.includes('tendik')
        ? 'tendik'
        : 'guru';

      const rawNip = nipIdx >= 0 ? String(row[nipIdx] || '').trim() || '-' : '-';
      const rawNuptk = nuptkIdx >= 0 ? String(row[nuptkIdx] || '').trim() || '-' : '-';
      const rawNpk = npkIdx >= 0 ? String(row[npkIdx] || '').trim() || '-' : '-';
      const rawPegId = pegIdIdx >= 0 ? String(row[pegIdIdx] || '').trim() || '-' : '-';
      const rawJabatan = jabatanIdx >= 0 ? String(row[jabatanIdx] || '').trim() || 'Guru Mapel' : 'Guru Mapel';
      const rawStatusKep = statusKepIdx >= 0 ? String(row[statusKepIdx] || '').trim() || 'PNS' : 'PNS';
      
      const rawJkStr = jkIdx >= 0 ? String(row[jkIdx] || '').trim().toUpperCase() : 'L';
      const rawJk: 'L' | 'P' = rawJkStr.startsWith('P') || rawJkStr.includes('PEREMPUAN') ? 'P' : 'L';

      const rawWa = waIdx >= 0 ? String(row[waIdx] || '').replace(/[^0-9+]/g, '').trim() : '';
      const rawEmail = emailIdx >= 0 ? String(row[emailIdx] || '').trim() : '';
      const rawJtm = jtmIdx >= 0 ? String(row[jtmIdx] || '').trim() || '24 Jam' : '24 Jam';

      const cleanUsername = (rawNama || `guru${i}`).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);

      // Auto-detect default subject & class from jabatan
      let detectedMapels: string[] = [];
      const jLower = rawJabatan.toLowerCase();
      if (jLower.includes('akidah')) detectedMapels = ['Akidah Akhlak'];
      else if (jLower.includes('fikih') || jLower.includes('fiqih')) detectedMapels = ['Fiqih'];
      else if (jLower.includes('qur') || jLower.includes('hadis')) detectedMapels = ['Al-Qur\'an Hadis'];
      else if (jLower.includes('ski') || jLower.includes('sejarah')) detectedMapels = ['Sejarah Kebudayaan Islam (SKI)'];
      else if (jLower.includes('arab')) detectedMapels = ['Bahasa Arab'];
      else if (jLower.includes('pjok') || jLower.includes('jasmani') || jLower.includes('olahraga')) detectedMapels = ['PJOK'];
      else if (jLower.includes('pancasila') || jLower.includes('pkn')) detectedMapels = ['Pendidikan Pancasila'];
      else if (jLower.includes('ipas') || jLower.includes('ipa') || jLower.includes('ips')) detectedMapels = ['IPAS (IPA & IPS)'];
      else if (jLower.includes('matematika') || jLower.includes('math')) detectedMapels = ['Matematika'];
      else if (jLower.includes('indonesia')) detectedMapels = ['Bahasa Indonesia'];
      else if (jLower.includes('jawa')) detectedMapels = ['Bahasa Jawa'];
      else if (jLower.includes('inggris')) detectedMapels = ['Bahasa Inggris'];
      else if (jLower.includes('seni')) detectedMapels = ['Seni Budaya & Prakarya'];
      else if (jLower.includes('aswaja') || jLower.includes('ke-nu-an') || jLower.includes('nu')) detectedMapels = ['Ke-NU-an / Aswaja'];
      else if (jLower.includes('p5') || jLower.includes('ppra')) detectedMapels = ['P5-PPRA'];

      const inferred = inferKategoriJabatan({
        nama: rawNama,
        hakAkses: cleanHakAkses,
        jabatanMapel: rawJabatan,
        mapelAmpu: detectedMapels
      });

      // Default mapels for Guru Kelas if none matched
      if (inferred.kategoriJabatan === 'guru_kelas' && detectedMapels.length === 0) {
        detectedMapels = ['Bahasa Indonesia', 'Matematika', 'IPAS (IPA & IPS)', 'Pendidikan Pancasila', 'Seni Budaya & Prakarya'];
      } else if (detectedMapels.length === 0) {
        detectedMapels = ['Pendidikan Agama Islam'];
      }

      const assignedKelas = inferred.kategoriJabatan === 'guru_kelas' && inferred.kelasTugas
        ? [inferred.kelasTugas]
        : ['Kelas 1 (Fase A)', 'Kelas 2 (Fase A)', 'Kelas 3 (Fase B)', 'Kelas 4 (Fase B)', 'Kelas 5 (Fase C)', 'Kelas 6 (Fase C)'];

      result.push({
        id: `teacher-excel-${Date.now()}-${result.length}-${Math.random().toString(36).substring(2, 6)}`,
        no: rawNo,
        nama: rawNama,
        gelar: rawGelar,
        nik: rawNik,
        pin: rawPin,
        hakAkses: cleanHakAkses,
        nip: rawNip,
        nuptk: rawNuptk,
        npk: rawNpk,
        pegIdSimpatika: rawPegId,
        kategoriJabatan: inferred.kategoriJabatan,
        jabatanGuru: inferred.jabatanGuru,
        jabatanMapel: inferred.jabatanMapel,
        jabatanAtauKelas: inferred.jabatanMapel,
        kelasTugas: inferred.kelasTugas,
        mapelUtama: inferred.mapelUtama || detectedMapels[0],
        statusKepegawaian: rawStatusKep,
        jenisKelamin: rawJk,
        noWhatsapp: rawWa,
        kontak: rawWa,
        email: rawEmail,
        bebanJtm: rawJtm,
        username: cleanUsername,
        mapelAmpu: detectedMapels,
        kelasAmpu: assignedKelas,
        status: 'aktif',
        createdAt: new Date().toISOString()
      });
    }

    if (result.length === 0) {
      return { success: false, data: [], error: 'Tidak ditemukan baris data guru yang valid dalam file Excel.' };
    }

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || 'Gagal memproses file Excel.' };
  }
}
