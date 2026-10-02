export function getDefaultProfilDesc(optionTitle: string, materi: string): string {
  const cleanMateri = materi?.trim() || 'pembelajaran ini';
  const cleanTitle = optionTitle.split(':')[0].trim();

  const map: Record<string, string> = {
    'Beriman, Bertakwa, & Berakhlak Mulia': `Menghayati ajaran Islam dan mengamalkan nilai ${cleanMateri} melalui ketaatan ibadah, tutur kata santun, dan ketulusan bersikap.`,
    'Berkeadaban (Ta’addub)': `Membiasakan tata krama Islami, menghormati guru, serta menyayangi teman saat mempelajari dan menerapkan ${cleanMateri}.`,
    'Kewarganegaraan dan Kebangsaan (Muwatanah)': `Menumbuhkan rasa cinta tanah air, kerukunan sesama anak bangsa, dan kedisiplinan berlandaskan hikmah ${cleanMateri}.`,
    'Keteladanan (Qudwah)': `Menjadi pendorong kebaikan di kelas melalui contoh sikap disiplin, kejujuran, dan kehangatan saat mempelajari ${cleanMateri}.`,
    'Toleransi (Tasamuh)': `Membangun sikap saling menghargai perbedaan, keheningan menyimak, dan tepuk apresiasi teman terkait materi ${cleanMateri}.`,
    'Kesetaraan (Musawah)': `Bersikap adil dan tidak membeda-bedakan latar belakang teman dalam interaksi dan kerja kelompok ${cleanMateri}.`,
    'Musyawarah (Syura)': `Mengutamakan musyawarah, mufakat, serta kebiasaan saling mendengarkan saat berdiskusi tentang ${cleanMateri}.`,
    'Gotong Royong & Empati': `Mengembangkan kepekaan sosial dan kepedulian untuk saling membantu dalam memahami dan mengamalkan ${cleanMateri}.`,
    'Bernalar Kritis & Kreatif': `Mampu menganalisis hikmah kebaikan, merenungkan pesan moral, dan menghasilkan karya kreatif dari ${cleanMateri}.`,
    'Mandiri': `Menunjukkan kesadaran dan tanggung jawab pribadi untuk mempraktikkan pembiasaan positif dari ${cleanMateri} tanpa bergantung pada orang lain.`
  };

  return map[cleanTitle] || `Menanamkan nilai dan karakter terpuji melalui pemahaman serta pengamalan ${cleanMateri} secara berkelanjutan.`;
}

export function getDefaultPancaCintaDesc(optionTitle: string, materi: string): string {
  const cleanMateri = materi?.trim() || 'pembelajaran ini';
  const cleanTitle = optionTitle.split(':')[0].trim();

  const map: Record<string, string> = {
    'Cinta Allah SWT & Rasul-Nya': `Menumbuhkan rasa kagum, syukur, dan ketaatan ibadah kepada Allah SWT serta meneladani sunnah Rasulullah SAW melalui pengamalan ${cleanMateri}.`,
    'Cinta Orang Tua & Guru': `Mewujudkan rasa hormat, bakti, kesantunan bertutur kata, dan ketaatan kepada nasihat orang tua serta guru berlandaskan hikmah ${cleanMateri}.`,
    'Cinta Sesama & Bangsa': `Menebar budaya 5S (Senyum, Sapa, Salam, Sopan, Santun) dan kepedulian sosial untuk mempererat ukhuwah murid melalui ${cleanMateri}.`,
    'Cinta Ilmu & Alam Lingkungan': `Bersemangat menuntut ilmu serta aktif merawat kelestarian flora, fauna, dan kebersihan lingkungan sekolah sebagai cerminan ${cleanMateri}.`,
    'Cinta Diri Sendiri & Kesehatan': `Menjaga kesucian lahir dan batin, kesehatan fisik, serta kebersihan jiwa dalam mempraktikkan tuntunan ${cleanMateri}.`
  };

  return map[cleanTitle] || `Mengintegrasikan pilar cinta KBC dalam kehidupan sehari-hari melalui penerapan materi ${cleanMateri}.`;
}

/**
 * Recommends relevant Profil Pancasila and Panca Cinta points with material-specific descriptions based on Mapel & Materi text.
 */
export function getRecommendedPancasilaAndPancaCinta(mataPelajaran: string, materi: string) {
  const text = `${mataPelajaran} ${materi}`.toLowerCase();

  let profilTitles: string[] = [];
  let pancaCintaTitles: string[] = [];

  if (text.includes('akidah') || text.includes('asmaul husna') || text.includes('iman') || text.includes('akhlak') || text.includes('rasul') || text.includes('allah')) {
    profilTitles = ['Beriman, Bertakwa, & Berakhlak Mulia', 'Keteladanan (Qudwah)', 'Berkeadaban (Ta’addub)', 'Gotong Royong & Empati'];
    pancaCintaTitles = ['Cinta Allah SWT & Rasul-Nya', 'Cinta Sesama & Bangsa', 'Cinta Orang Tua & Guru'];
  } else if (text.includes('fikih') || text.includes('wudhu') || text.includes('shalat') || text.includes('bersuci') || text.includes('thaharah') || text.includes('ibadah')) {
    profilTitles = ['Beriman, Bertakwa, & Berakhlak Mulia', 'Mandiri', 'Berkeadaban (Ta’addub)'];
    pancaCintaTitles = ['Cinta Allah SWT & Rasul-Nya', 'Cinta Diri Sendiri & Kesehatan', 'Cinta Ilmu & Alam Lingkungan'];
  } else if (text.includes('qur') || text.includes('hadis') || text.includes('surat') || text.includes('ayat') || text.includes('yatim') || text.includes('ma\'un')) {
    profilTitles = ['Beriman, Bertakwa, & Berakhlak Mulia', 'Gotong Royong & Empati', 'Toleransi (Tasamuh)'];
    pancaCintaTitles = ['Cinta Allah SWT & Rasul-Nya', 'Cinta Sesama & Bangsa', 'Cinta Orang Tua & Guru'];
  } else if (text.includes('ski') || text.includes('sejarah') || text.includes('fathu makkah') || text.includes('kebudayaan')) {
    profilTitles = ['Keteladanan (Qudwah)', 'Toleransi (Tasamuh)', 'Berkeadaban (Ta’addub)'];
    pancaCintaTitles = ['Cinta Allah SWT & Rasul-Nya', 'Cinta Sesama & Bangsa'];
  } else if (text.includes('ipas') || text.includes('ekosistem') || text.includes('alam') || text.includes('lingkungan') || text.includes('tumbuhan') || text.includes('hewan')) {
    profilTitles = ['Bernalar Kritis & Kreatif', 'Gotong Royong & Empati', 'Mandiri'];
    pancaCintaTitles = ['Cinta Ilmu & Alam Lingkungan', 'Cinta Allah SWT & Rasul-Nya'];
  } else if (text.includes('pancasila') || text.includes('gotong royong') || text.includes('bangsa') || text.includes('simbol')) {
    profilTitles = ['Kewarganegaraan dan Kebangsaan (Muwatanah)', 'Gotong Royong & Empati', 'Toleransi (Tasamuh)'];
    pancaCintaTitles = ['Cinta Sesama & Bangsa', 'Cinta Orang Tua & Guru'];
  } else if (text.includes('bahasa') || text.includes('arab') || text.includes('mufrodat')) {
    profilTitles = ['Berkeadaban (Ta’addub)', 'Bernalar Kritis & Kreatif', 'Mandiri'];
    pancaCintaTitles = ['Cinta Ilmu & Alam Lingkungan', 'Cinta Sesama & Bangsa'];
  } else {
    profilTitles = ['Beriman, Bertakwa, & Berakhlak Mulia', 'Berkeadaban (Ta’addub)', 'Gotong Royong & Empati'];
    pancaCintaTitles = ['Cinta Allah SWT & Rasul-Nya', 'Cinta Sesama & Bangsa', 'Cinta Ilmu & Alam Lingkungan'];
  }

  const dimensiProfilLulusan = profilTitles.map(t => `${t}: ${getDefaultProfilDesc(t, materi)}`);
  const topikPancaCinta = pancaCintaTitles.map(t => `${t}: ${getDefaultPancaCintaDesc(t, materi)}`);

  return { dimensiProfilLulusan, topikPancaCinta };
}
