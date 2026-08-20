import { GoogleGenAI, Type } from '@google/genai';

async function generateContentWithRetry(
  ai: GoogleGenAI,
  requestParams: { contents: any; config?: any },
  preferredModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash']
) {
  let lastError: any = null;

  for (const modelName of preferredModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: requestParams.contents,
          config: requestParams.config,
        });

        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || '');
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('overloaded');

        if (isTransient) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        } else {
          break;
        }
      }
    }
  }

  const rawMsg = lastError?.message || String(lastError || '');
  if (
    rawMsg.includes('503') ||
    rawMsg.includes('UNAVAILABLE') ||
    rawMsg.includes('high demand')
  ) {
    throw new Error(
      'Layanan Google AI sedang mengalami lonjakan trafik/beban tinggi. Sistem telah mencoba beberapa kali. Silakan klik tombol lagi dalam beberapa saat.'
    );
  }
  if (
    rawMsg.includes('429') ||
    rawMsg.includes('RESOURCE_EXHAUSTED')
  ) {
    throw new Error(
      'Batas kuota API Key Gemini telah tercapai (Rate Limit / Quota Exceeded). Silakan periksa kuota API Key Anda di Google AI Studio atau coba beberapa saat lagi.'
    );
  }

  throw lastError || new Error('Gagal memproses permintaan AI.');
}

export async function clientTestApiKey(apiKey: string) {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API Key Gemini belum diisi. Masukkan API Key di menu Pengaturan.');
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey.trim(),
  });

  const response = await generateContentWithRetry(ai, {
    contents: 'Tes koneksi API Key Gemini AI. Jawab singkat: OK',
  });

  if (response.text) {
    return {
      success: true,
      message: 'Koneksi API Key Gemini AI Berhasil! Kunci API aktif dan siap digunakan.'
    };
  } else {
    throw new Error('Respon dari Gemini AI kosong.');
  }
}

export async function clientGenerateModul(body: any, apiKey: string) {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API Key Gemini belum dikonfigurasi. Masukkan API Key di menu Pengaturan.');
  }

  const {
    namaMadrasah = "MI Ma'arif NU 2 Sanggreman",
    mataPelajaran = 'Akidah Akhlak',
    materi = 'Meneladani Sifat Ar-Rahman dalam Kasih Sayang',
    faseKelas = 'Fase B (Kelas III MI)',
    semester = 'Ganjil (1)',
    tahunPelajaran = '2025/2026',
    alokasiWaktu = '2 x 35 Menit (2 JP)',
    topikPancaCinta = [],
    instruksiKhusus = ''
  } = body || {};

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  const promptText = `Anda adalah Pakar Pengembang Kurikulum Berbasis Cinta (KBC) Madrasah Ibtidaiyah (MI) Kementerian Agama Republik Indonesia.
Buatkan Modul Ajar Berbasis Cinta (KBC) yang SANGAT LENGKAP, DETAIL, RUNTUT, DAN KOMPREHENSIF sesuai parameter berikut:

- Nama Madrasah (Seksi Identitas Modul): ${namaMadrasah}
- Mata Pelajaran: ${mataPelajaran}
- Materi Utama: ${materi}
- Fase / Kelas: ${faseKelas}
- Semester: ${semester}
- Tahun Pelajaran: ${tahunPelajaran}
- Alokasi Waktu: ${alokasiWaktu}
- Fokus Topik Panca Cinta: ${Array.isArray(topikPancaCinta) && topikPancaCinta.length > 0 ? topikPancaCinta.join(', ') : 'Disesuaikan secara otomatis'}
- Catatan Tambahan/Khusus: ${instruksiKhusus || 'Sajikan dengan nuansa Islami Rahmatan lil Aalamin, ramah anak, dan mendalam.'}

Modul Ajar KBC harus mencakup 7 Seksi Utama dengan deskripsi komprehensif:
1. Seksi Identitas Modul
2. Seksi Identifikasi (Kesiapan murid, Materi Pelajaran diuraikan sangat lengkap & detail memuat 6 poin sub-bab utama: 1. Pengertian/Konsep, 2. Landasan/Dalil, 3. Ketentuan/Rukun, 4. Tata Cara/Adab, 5. Integrasi Panca Cinta, 6. Penerapan Praktis tanpa markdown asteriks, Profil Lulusan, Topik Panca Cinta, Materi Integrasi KBC).
3. Seksi Desain Pembelajaran (CP, Lintas Disiplin Ilmu, TP & ATP).
4. Seksi Kerangka Pembelajaran (Praktek Pedagogik, Kemitraan Pembelajaran, Lingkungan Pembelajaran, Pemanfaatan Digital).
5. Seksi Pengalaman Belajar (WAJIB DIBUAT SANGAT DETIL, LENGKAP, TERSTRUKTUR, BERTAHAP, DAN KOMPREHENSIF MEMUAT URAIAN KONKRET INTERAKSI GURU DAN SISWA DENGAN DURASI & PERINCIAN MENDALAM):
   - Kegiatan Awal (Min 5-6 poin uraian rinci): Salam hangat KBC & 5S, doa bersuci, emotion check-in/pemeriksaan kesiapan psikologis murid, apersepsi cerita/visual KBC interaktif, penyampaian tujuan & motivasi.
   - Kegiatan Inti (Min 6-8 poin uraian rinci): Eksplorasi konsep & literasi KBC mendalam, tanya jawab & identifikasi masalah, pengelompokan heterogen ramah anak, diskusi kolaboratif & investigasi, bimbingan terarah & diferensiasi (scaffolding), peragaan/praktik pemahaman, presentasi penuh apresiasi, serta penguatan media digital interaktif.
   - Mengaplikasi (Min 4-5 poin uraian rinci): Praktik/aksi nyata KBC, karya kebaikan/pohon cinta, dan misi kebaikan tersembunyi Kotak Kebaikan Cinta KBC.
   - Merefleksi (Min 4-5 poin uraian rinci): Kontemplasi & hening sejenak rasa syukur, pengisian lembar refleksi emosi, serta saling memberikan apresiasi tulus antar murid.
   - Penutup (Min 4-5 poin uraian rinci): Rangkuman & kesimpulan bersama, apresiasi positif & bintang kebaikan KBC, tindak lanjut jurnal rumah bersama orang tua, doa penutup keberkahan majelis, dan salam kasih kehangatan KBC.
6. Seksi Assesmen (Teknik Asesmen, Rubrik Asesmen Sikap Cinta, Instrumen Penilaian).
7. LKPD dan Media Digital Spesifik untuk "${materi}" (Judul, Petunjuk, Tugas, Pertanyaan, Refleksi, Soal Kuis Digital min 25 nomor, Materi Interaktif, Gambar Interaktif + hotspots).

Sajikan dalam JSON rapi tanpa tambahan teks pembuka/penutup markdown.`;

  const response = await generateContentWithRetry(ai, {
    contents: promptText,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identitas: {
            type: Type.OBJECT,
            properties: {
              namaMadrasah: { type: Type.STRING },
              mataPelajaran: { type: Type.STRING },
              materi: { type: Type.STRING },
              faseKelas: { type: Type.STRING },
              semester: { type: Type.STRING },
              tahunPelajaran: { type: Type.STRING },
              alokasiWaktu: { type: Type.STRING }
            },
            required: ['namaMadrasah', 'mataPelajaran', 'materi', 'faseKelas', 'semester', 'tahunPelajaran', 'alokasiWaktu']
          },
          identifikasi: {
            type: Type.OBJECT,
            properties: {
              kesiapanMurid: {
                type: Type.OBJECT,
                properties: {
                  pahamUtuh: { type: Type.STRING },
                  pahamSebagian: { type: Type.STRING },
                  belumPaham: { type: Type.STRING }
                },
                required: ['pahamUtuh', 'pahamSebagian', 'belumPaham']
              },
              materiPelajaran: { type: Type.STRING },
              dimensiProfilLulusan: { type: Type.ARRAY, items: { type: Type.STRING } },
              topikPancaCinta: { type: Type.ARRAY, items: { type: Type.STRING } },
              materiIntegrasiKBC: { type: Type.STRING }
            },
            required: ['kesiapanMurid', 'materiPelajaran', 'dimensiProfilLulusan', 'topikPancaCinta', 'materiIntegrasiKBC']
          },
          desainPembelajaran: {
            type: Type.OBJECT,
            properties: {
              capaianPembelajaran: { type: Type.STRING },
              lintasDisiplinIlmu: { type: Type.STRING },
              tujuanPembelajaran: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['capaianPembelajaran', 'lintasDisiplinIlmu', 'tujuanPembelajaran']
          },
          kerangkaPembelajaran: {
            type: Type.OBJECT,
            properties: {
              praktekPedagogik: { type: Type.STRING },
              kemitraanPembelajaran: { type: Type.STRING },
              lingkunganPembelajaran: { type: Type.STRING },
              pemanfaatanDigital: { type: Type.STRING }
            },
            required: ['praktekPedagogik', 'kemitraanPembelajaran', 'lingkunganPembelajaran', 'pemanfaatanDigital']
          },
          pengalamanBelajar: {
            type: Type.OBJECT,
            properties: {
              kegiatanAwal: {
                type: Type.OBJECT,
                properties: { durasi: { type: Type.STRING }, kegiatan: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ['durasi', 'kegiatan']
              },
              kegiatanInti: {
                type: Type.OBJECT,
                properties: { durasi: { type: Type.STRING }, kegiatan: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ['durasi', 'kegiatan']
              },
              mengaplikasi: {
                type: Type.OBJECT,
                properties: { durasi: { type: Type.STRING }, kegiatan: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ['durasi', 'kegiatan']
              },
              merefleksi: {
                type: Type.OBJECT,
                properties: { durasi: { type: Type.STRING }, kegiatan: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ['durasi', 'kegiatan']
              },
              penutup: {
                type: Type.OBJECT,
                properties: { durasi: { type: Type.STRING }, kegiatan: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ['durasi', 'kegiatan']
              }
            },
            required: ['kegiatanAwal', 'kegiatanInti', 'mengaplikasi', 'merefleksi', 'penutup']
          },
          assesmen: {
            type: Type.OBJECT,
            properties: {
              teknikAssesmen: { type: Type.STRING },
              rubrikAssesmenSikapCinta: { type: Type.STRING },
              instrumenPenilaian: { type: Type.STRING },
              lkpd: {
                type: Type.OBJECT,
                properties: {
                  judulLkpd: { type: Type.STRING },
                  petunjuk: { type: Type.STRING },
                  tugasAktivitas: { type: Type.STRING },
                  pertanyaanDiskusi: { type: Type.ARRAY, items: { type: Type.STRING } },
                  lembarRefleksiSiswa: { type: Type.STRING }
                },
                required: ['judulLkpd', 'petunjuk', 'tugasAktivitas', 'pertanyaanDiskusi', 'lembarRefleksiSiswa']
              },
              mediaDigital: {
                type: Type.OBJECT,
                properties: {
                  soalKuis: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        pertanyaan: { type: Type.STRING },
                        pilihan: { type: Type.ARRAY, items: { type: Type.STRING } },
                        kunciJawaban: { type: Type.NUMBER },
                        penjelasanKbc: { type: Type.STRING }
                      },
                      required: ['id', 'pertanyaan', 'pilihan', 'kunciJawaban', 'penjelasanKbc']
                    }
                  },
                  materiInteraktif: {
                    type: Type.OBJECT,
                    properties: {
                      ringkasanRingkas: { type: Type.STRING },
                      poinPenting: { type: Type.ARRAY, items: { type: Type.STRING } },
                      flashcards: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            depan: { type: Type.STRING },
                            belakang: { type: Type.STRING }
                          },
                          required: ['id', 'depan', 'belakang']
                        }
                      }
                    },
                    required: ['ringkasanRingkas', 'poinPenting', 'flashcards']
                  },
                  gambarInteraktif: {
                    type: Type.OBJECT,
                    properties: {
                      deskripsiVisual: { type: Type.STRING },
                      promptGambar: { type: Type.STRING },
                      hotspots: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            x: { type: Type.NUMBER },
                            y: { type: Type.NUMBER },
                            judul: { type: Type.STRING },
                            penjelasan: { type: Type.STRING }
                          },
                          required: ['x', 'y', 'judul', 'penjelasan']
                        }
                      }
                    },
                    required: ['deskripsiVisual', 'promptGambar', 'hotspots']
                  }
                },
                required: ['soalKuis', 'materiInteraktif', 'gambarInteraktif']
              }
            },
            required: ['teknikAssesmen', 'rubrikAssesmenSikapCinta', 'instrumenPenilaian', 'lkpd', 'mediaDigital']
          }
        },
        required: ['identitas', 'identifikasi', 'desainPembelajaran', 'kerangkaPembelajaran', 'pengalamanBelajar', 'assesmen']
      }
    }
  });

  if (!response.text) {
    throw new Error('Tidak ada respon dari Gemini AI.');
  }

  const generatedData = JSON.parse(response.text);

  // Generate Image
  let imageUrl: string | undefined = undefined;
  const promptImg = generatedData.assesmen?.mediaDigital?.gambarInteraktif?.promptGambar || `Illustration for Islamic primary school lesson ${materi}`;
  try {
    const imgAi = new GoogleGenAI({ apiKey: apiKey.trim() });
    const imgRes = await imgAi.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: { parts: [{ text: promptImg + ', clean vector style, bright educational colors, child-friendly, high resolution.' }] },
      config: { imageConfig: { aspectRatio: '4:3' } }
    });
    if (imgRes.candidates && imgRes.candidates[0]?.content?.parts) {
      for (const part of imgRes.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }
  } catch (e) {
    console.warn('Gemini image generation fallback');
  }

  if (!imageUrl) {
    imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptImg + ', Islamic primary school vector educational illustration, child friendly')}&width=800&height=600&nologo=true&seed=${Date.now()}`;
  }

  if (generatedData.assesmen?.mediaDigital?.gambarInteraktif) {
    generatedData.assesmen.mediaDigital.gambarInteraktif.imageUrl = imageUrl;
  }

  return {
    success: true,
    modul: generatedData
  };
}

export async function clientGenerateMateriUraian(body: any, apiKey: string) {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API Key Gemini belum diisi.');
  }

  const { mapel = '', kelas = '', topik = '', pancaCinta = [] } = body || {};

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const promptText = `Anda adalah Pakar Penyusun Bahan Ajar Kurikulum Berbasis Cinta (KBC) Madrasah Ibtidaiyah (MI).
Buatkan URAIAN MATERI PELAJARAN LENGKAP, TERSTRUKTUR, SANGAT DETAIL DAN MUDAH DIPAHAMI MURID MI untuk:
- Mata Pelajaran: ${mapel}
- Kelas: ${kelas}
- Topik / Judul Materi: ${topik}
- Integrasi Panca Cinta: ${Array.isArray(pancaCinta) && pancaCinta.length > 0 ? pancaCinta.join(', ') : 'Disesuaikan dengan nuansa kasih sayang'}

ATURAN PENULISAN:
1. Uraikan secara sistematis dan komprehensif menjadi poin-poin utama penomoran 1, 2, 3, dst.
2. JANGAN gunakan tanda asteriks markdown ** atau * untuk cetak tebal/miring. Gunakan teks biasa yang bersih.
3. Sertakan contoh konkret kehidupan harian murid MI, hikmah kebaikan KBC, dan ajakan penerapan cinta kasih sesama manusia dan alam.
4. Buat minimal 4-6 sub-poin pembahasan yang mendalam.`;

  const response = await generateContentWithRetry(ai, {
    contents: promptText
  });

  return {
    success: true,
    uraianMateri: response.text || 'Gagal menghasilkan materi.'
  };
}

export async function clientGenerateQuizMedia(body: any, apiKey: string) {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API Key Gemini belum diisi.');
  }

  const { mapel = '', kelas = '', materi = '', pancaCinta = [], targetJumlahSoal = 25 } = body || {};

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const promptText = `Anda adalah Pakar Pengembang Kuis & Media Pembelajaran Berbasis Cinta (KBC) Madrasah Ibtidaiyah.
Buatkan Paket Media Digital Lengkap dan Kuis Interaktif SANGAT DETAIL khusus untuk:
- Mata Pelajaran: ${mapel}
- Kelas/Fase: ${kelas}
- Materi Pembelajaran: ${materi}
- Integrasi Panca Cinta: ${Array.isArray(pancaCinta) && pancaCinta.length > 0 ? pancaCinta.join(', ') : 'Disesuaikan'}
- WAJIB Jumlah Soal Kuis Pilihan Ganda: TEPAT ${targetJumlahSoal} NOMOR SOAL.

Ketentuan Soal Kuis:
1. Buat TEPAT ${targetJumlahSoal} nomor soal pilihan ganda (A, B, C, D) yang bervariasi dari tingkat pemahaman hingga penalaran sederhana.
2. Setiap soal wajib memiliki penjelasan bernuansa KBC (kasih sayang, keteladanan, akhlak mulia).
3. Kunci jawaban berupa index angka: 0 untuk A, 1 untuk B, 2 untuk C, 3 untuk D.

Sajikan dalam JSON rapi tanpa tambahan teks pembuka/penutup markdown.`;

  const response = await generateContentWithRetry(ai, {
    contents: promptText,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          soalKuis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                pertanyaan: { type: Type.STRING },
                pilihan: { type: Type.ARRAY, items: { type: Type.STRING } },
                kunciJawaban: { type: Type.NUMBER },
                penjelasanKbc: { type: Type.STRING }
              },
              required: ['id', 'pertanyaan', 'pilihan', 'kunciJawaban', 'penjelasanKbc']
            }
          },
          materiInteraktif: {
            type: Type.OBJECT,
            properties: {
              ringkasanRingkas: { type: Type.STRING },
              poinPenting: { type: Type.ARRAY, items: { type: Type.STRING } },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    depan: { type: Type.STRING },
                    belakang: { type: Type.STRING }
                  },
                  required: ['id', 'depan', 'belakang']
                }
              }
            },
            required: ['ringkasanRingkas', 'poinPenting', 'flashcards']
          },
          gambarInteraktif: {
            type: Type.OBJECT,
            properties: {
              deskripsiVisual: { type: Type.STRING },
              promptGambar: { type: Type.STRING },
              hotspots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    judul: { type: Type.STRING },
                    penjelasan: { type: Type.STRING }
                  },
                  required: ['x', 'y', 'judul', 'penjelasan']
                }
              }
            },
            required: ['deskripsiVisual', 'promptGambar', 'hotspots']
          }
        },
        required: ['soalKuis', 'materiInteraktif', 'gambarInteraktif']
      }
    }
  });

  if (!response.text) {
    throw new Error('Tidak ada respon dari Gemini AI.');
  }

  const generatedMedia = JSON.parse(response.text);

  let imageUrl: string | undefined = undefined;
  const promptImg = generatedMedia.gambarInteraktif?.promptGambar || `Illustration for Islamic primary school lesson ${materi}`;
  try {
    const imgRes = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: { parts: [{ text: promptImg + ', clean vector style, bright educational colors, child-friendly, high resolution.' }] },
      config: { imageConfig: { aspectRatio: '4:3' } }
    });
    if (imgRes.candidates && imgRes.candidates[0]?.content?.parts) {
      for (const part of imgRes.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }
  } catch (e) {
    console.warn('Fallback image for quiz media');
  }

  if (!imageUrl) {
    imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptImg + ', Islamic primary school vector educational illustration, child friendly')}&width=800&height=600&nologo=true&seed=${Date.now()}`;
  }

  if (generatedMedia.gambarInteraktif) {
    generatedMedia.gambarInteraktif.imageUrl = imageUrl;
  }

  return {
    success: true,
    mediaDigital: generatedMedia
  };
}

export async function clientGenerateImage(body: any, apiKey: string) {
  const { prompt = 'A warm Islamic elementary school educational illustration for Modul Ajar KBC' } = body || {};

  let imageUrl: string | null = null;

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt + ', clean vector style, bright educational colors, child-friendly, high resolution.' }]
        },
        config: {
          imageConfig: { aspectRatio: '4:3' }
        }
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (err) {
      console.warn('Fallback to pollinations image generator');
    }
  }

  if (!imageUrl) {
    const cleanPrompt = String(prompt).replace(/[^\w\s]/gi, ' ').trim();
    imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt + ', Islamic primary school vector educational illustration, child friendly')}&width=800&height=600&nologo=true&seed=${Date.now()}`;
  }

  return { success: true, imageUrl };
}
