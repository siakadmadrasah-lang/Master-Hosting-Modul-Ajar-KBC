/**
 * Helper untuk menyusun Template 6 Sub-Bab Uraian Materi yang adaptif & kontekstual
 * sesuai rumpun Mata Pelajaran (Agama, PKn/Pancasila, IPAS, Bahasa, Matematika, PJOK, Seni, dll.)
 */

export function getTemplate6SubBab(mapel: string = '', judulMateri: string = ''): string {
  const cleanMapel = (mapel || '').toLowerCase().trim();
  const topik = judulMateri.trim() || 'Materi Pelajaran';

  // 1. Rumpun Fiqih / Ibadah
  if (cleanMapel.includes('fiqih') || cleanMapel.includes('fikih') || cleanMapel.includes('ibadah')) {
    return `1. Pengertian, Etimologi, & Hakikat Ibadah: Uraikan definisi mendalam, makna bahasa, dan kedudukan ${topik} dalam syariat Islam.

2. Landasan Syariat & Dalil Al-Qur'an / Hadis: Tuliskan lafaz Latin dan terjemahan ayat Al-Qur'an atau Hadis sahih yang menjadi dasar hukum ${topik}.

3. Ketentuan, Syarat Sah/Wajib, Rukun, & Komponen Pokok: Jelaskan kriteria hukum, syarat wajib, syarat sah, rukun utama, serta hal-hal yang membatalkan.

4. Tata Cara, Urutan Praktik, & Adab Pelaksanaan: Jabarkan tahapan pelaksanaan secara runtut dari awal hingga akhir beserta adab-adab mulia saat mengamalkannya.

5. Integrasi Nilai Panca Cinta KBC & Hikmah: Hubungkan ibadah ini dengan pilar Cinta Allah SWT & Rasul-Nya, keikhlasan batin, empati, dan ketenangan jiwa.

6. Penerapan Praktis & Pembiasaan Ibadah Sehari-hari: Berikan contoh nyata pembiasaan murid mengamalkan ${topik} di madrasah, masjid, dan lingkungan keluarga.`;
  }

  // 2. Rumpun Pendidikan Pancasila / PKn / PPKn / Kewarganegaraan
  if (
    cleanMapel.includes('pancasila') ||
    cleanMapel.includes('pkn') ||
    cleanMapel.includes('ppkn') ||
    cleanMapel.includes('kewarganegaraan')
  ) {
    return `1. Pengertian, Makna, & Hakikat Konsep: Uraikan pengertian mendalam, makna filosofis, dan batasan konsep mengenai ${topik}.

2. Landasan Konstitusional, Nilai Pancasila, & Dasar Hukum: Jelaskan keterkaitannya dengan Sila-Sila Pancasila, UUD NRI 1945, Semboyan Bhinneka Tunggal Ika, atau norma hukum yang berlaku.

3. Karakteristik, Nilai-Nilai Luhur, & Prinsip Pokok: Uraikan elemen-elemen penting, prinsip kebangsaan, keberagaman, hak dan kewajiban, atau nilai luhur yang wajib dipahami murid.

4. Sikap Kewarganegaraan, Adab Berbangsa, & Praktik Baik: Jabarkan langkah nyata dalam berinteraksi, bermusyawarah, bersikap toleran, dan menjaga persatuan dengan santun.

5. Integrasi Nilai Panca Cinta KBC & Hikmah Kebangsaan: Hubungkan materi ini dengan pilar Cinta Tanah Air, Cinta Sesama Manusia, dan Cinta Lingkungan untuk mencegah perundungan serta merajut kebhinekaan.

6. Penerapan Praktis & Pembiasaan Hidup Rukun Sehari-hari: Berikan contoh-contoh konkret aksi nyata hidup rukun, gotong royong, dan cinta damai di madrasah, rumah, dan masyarakat.`;
  }

  // 3. Rumpun IPAS / IPA / Sains / IPS
  if (
    cleanMapel.includes('ipas') ||
    cleanMapel.includes('ipa') ||
    cleanMapel.includes('sains') ||
    cleanMapel.includes('ips') ||
    cleanMapel.includes('alam') ||
    cleanMapel.includes('sosial')
  ) {
    return `1. Pengertian, Fenomena Alam/Sosial, & Konsep Pokok: Uraikan definisi ilmiah, batasan konsep, dan fenomena yang terjadi terkait ${topik}.

2. Landasan Keilmuan, Fakta Sains, & Tadabbur Ciptaan Tuhan: Jelaskan hukum alam/fakta ilmiah yang mendasari serta hubungkan dengan rasa takjub dan syukur atas keagungan ciptaan Allah SWT.

3. Karakteristik, Struktur, Ciri-Ciri, & Komponen Utama: Uraikan bagian-bagian penting, sifat khas, fungsi, atau klasifikasi unsur yang ada pada ${topik}.

4. Proses Terjadinya, Tahapan Fenomena, & Langkah Eksplorasi: Jabarkan mekanisme kejadian, siklus, atau alur eksperimen/pengamatan sederhana secara runtut.

5. Integrasi Nilai Panca Cinta KBC & Kepedulian Lingkungan: Hubungkan materi ini dengan pilar Cinta Alam & Lingkungan serta Cinta Sesama dalam menjaga kelestarian bumi dan keharmonisan sosial.

6. Penerapan Praktis & Tindakan Positif Sehari-hari: Berikan contoh nyata tindakan ramah lingkungan, pemanfaatan ilmu dalam kehidupan harian, dan kepedulian sosial murid.`;
  }

  // 4. Rumpun Bahasa (Bahasa Indonesia, Bahasa Arab, Bahasa Inggris, Bahasa Daerah)
  if (
    cleanMapel.includes('bahasa') ||
    cleanMapel.includes('indonesia') ||
    cleanMapel.includes('arab') ||
    cleanMapel.includes('inggris') ||
    cleanMapel.includes('literasi')
  ) {
    return `1. Pengertian, Fungsi Komunikatif, & Konsep Utama: Uraikan pengertian teks/materi ${topik}, tujuan komunikatif, dan peranannya dalam menyampaikan pesan.

2. Landasan Kaidah Kebahasaan, Struktur Teks, & Etika Berbahasa: Jelaskan struktur umum teks, kaidah ejaan/tata bahasa baku, serta pentingnya kesantunan berbahasa.

3. Unsur Pembangun, Ciri Kebahasaan, & Kosakata Kunci: Uraikan ciri-ciri kebahasaan khas, kosakata/istilah penting, dan pola kalimat yang wajib dikuasai murid.

4. Langkah-Langkah Praktik Berbahasa (Menyimak, Membaca, Menulis, atau Berbicara): Jabarkan tahapan menyusun, memahami, atau memperagakan ${topik} secara runtut dan terarah.

5. Integrasi Nilai Panca Cinta KBC & Kelembutan Tutur Kata: Hubungkan materi dengan pilar Cinta Sesama melalui pembiasaan bahasa kasih (senyum, salam, terima kasih, tolong, maaf) dan empati komunikasi.

6. Penerapan Praktis dalam Komunikasi Sehari-hari: Berikan contoh situasi nyata murid berkomunikasi secara efektif dan santun dengan guru, teman, orang tua, dan masyarakat.`;
  }

  // 5. Rumpun Matematika
  if (cleanMapel.includes('matematika') || cleanMapel.includes('hitung') || cleanMapel.includes('angka')) {
    return `1. Pengertian, Definisi Matematis, & Konsep Dasar: Uraikan pengertian konsep, istilah, dan pemahaman logika dasar mengenai ${topik}.

2. Sifat-Sifat Matematis, Rumus, & Prinsip Logika: Jelaskan sifat operasi, rumus matematika terkait, serta logika pembuktian/alasan penggunaannya secara sederhana.

3. Komponen Pokok, Simbol, Notasi, & Bentuk Penerapan: Uraikan elemen-elemen penyusun rumus/soal, satuan, dan variasi bentuk model matematika.

4. Langkah-Langkah Prosedur Penyelesaian Masalah Secara Runtut: Jabarkan tahapan menghitung atau memecahkan masalah langkah demi langkah (diketahui, ditanya, dijawab).

5. Integrasi Nilai Panca Cinta KBC & Pembentukan Karakter: Hubungkan pembelajaran berhitung dengan nilai kejujuran, ketelitian, kesabaran, kerja keras, dan berbagi kebaikan.

6. Penerapan Matematis dalam Kehidupan Sehari-hari: Berikan contoh kontekstual penggunaan ${topik} dalam aktivitas nyata murid (seperti jual beli jujur, berbagi adil, mengukur waktu/panjang).`;
  }

  // 6. Rumpun Akidah Akhlak / Al-Qur'an Hadis / SKI (Sejarah Kebudayaan Islam)
  if (
    cleanMapel.includes('akidah') ||
    cleanMapel.includes('akhlak') ||
    cleanMapel.includes('qur\'an') ||
    cleanMapel.includes('hadis') ||
    cleanMapel.includes('hadits') ||
    cleanMapel.includes('ski') ||
    cleanMapel.includes('sejarah')
  ) {
    return `1. Pengertian, Makna, & Konsep Pokok: Uraikan definisi mendalam, makna keyakinan/moral/sejarah, dan esensi dari materi ${topik}.

2. Landasan Ayat Al-Qur'an, Hadis, & Nilai Keteladanan: Tuliskan teks Latin dan terjemahan dalil yang relevan atau ibrah/keteladanan perjuangan tokoh sejarah.

3. Ciri-Ciri, Sifat Terpuji, & Prinsip Pokok Karakter: Uraikan sifat-sifat mulia, tanda-tanda keimanan/akhlak terpuji, atau fakta penting yang wajib diteladani murid.

4. Tata Cara Pembiasaan, Adab Mulia, & Langkah Meneladani: Jabarkan langkah-langkah konkret melatih diri, adab terpuji, dan cara menjauhi perilaku tercela.

5. Integrasi Nilai Panca Cinta KBC & Pembentukan Hati: Hubungkan materi dengan pilar Cinta Allah SWT & Rasul-Nya, Cinta Sesama, dan kehangatan budi pekerti luhur.

6. Penerapan Praktis & Pembiasaan Akhlak Mulia Sehari-hari: Berikan contoh tindakan nyata meneladani akhlak mulia dalam pergaulan di madrasah, keluarga, dan lingkungan sekitar.`;
  }

  // 7. Rumpun Seni Budaya, PJOK, Prakarya, & Mapel Umum Lainnya
  return `1. Pengertian, Konsep Dasar, & Esensi Materi: Uraikan definisi mendalam dan pemahaman konsep utama dari materi ${topik}.

2. Landasan Keilmuan, Teori, & Nilai Filosofis: Jelaskan prinsip dasar keilmuan, aturan main/teori, serta nilai keindahan/kesehatan raga sebagai anugerah Tuhan.

3. Komponen Pokok, Elemen Penting, & Karakteristik Materi: Uraikan unsur-unsur utama, teknik dasar, atau karakteristik yang wajib dikuasai murid secara tepat.

4. Langkah-Langkah Praktik, Urutan Gerak/Karya, & Tata Cara: Jabarkan tahapan pelaksanaan karya/gerakan/aktivitas secara runtut dan terstruktur.

5. Integrasi Nilai Panca Cinta KBC & Hikmah: Hubungkan materi dengan pilar Cinta Diri (kesehatan/kreativitas), Cinta Sesama (sportivitas/apresiasi karya), dan Cinta Lingkungan.

6. Penerapan Praktis & Pembiasaan Positif Sehari-hari: Berikan contoh penerapan nyata dalam menjaga kebugaran, mengekspresikan kreativitas, dan berkarya positif bagi lingkungan.`;
}
