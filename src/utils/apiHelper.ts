import { loadApiKey } from './storage';
import {
  clientTestApiKey,
  clientGenerateModul,
  clientGenerateMateriUraian,
  clientGenerateQuizMedia,
  clientGenerateImage
} from './clientGemini';

export async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  let isHtmlOrNotFound = false;
  let status = 200;
  let statusText = 'OK';

  try {
    const res = await fetch(url, options);
    status = res.status;
    statusText = res.statusText;
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Terjadi kesalahan server (${res.status}).`);
      }
      return data;
    } else {
      const text = await res.text();
      if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html') || text.includes('<body') || status === 404) {
        isHtmlOrNotFound = true;
      } else {
        throw new Error(`Respon server bukan JSON (${res.status}): ${text.substring(0, 100)}`);
      }
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('Terjadi kesalahan server') || err.message.includes('Respon server bukan JSON'))) {
      throw err;
    }
    // Network error or HTML response -> fallback
    isHtmlOrNotFound = true;
  }

  // If Express backend is not running or returning HTML static fallback (e.g. GitHub Pages / Vercel SPA)
  if (isHtmlOrNotFound) {
    let apiKey = '';
    if (options?.headers) {
      const headersObj = options.headers as Record<string, string>;
      apiKey = headersObj['x-gemini-api-key'] || headersObj['X-Gemini-Api-Key'] || headersObj['x-api-key'] || '';
    }
    let bodyObj: any = {};
    if (options?.body) {
      try {
        bodyObj = JSON.parse(String(options.body));
        if (bodyObj.userApiKey) apiKey = bodyObj.userApiKey;
      } catch (e) {
        // ignore
      }
    }
    if (!apiKey) {
      apiKey = loadApiKey();
    }

    // Route to client-side Gemini AI engine
    if (url.includes('/api/test-api-key')) {
      return (await clientTestApiKey(apiKey)) as T;
    }
    if (url.includes('/api/generate-modul')) {
      return (await clientGenerateModul(bodyObj, apiKey)) as T;
    }
    if (url.includes('/api/generate-materi-uraian')) {
      return (await clientGenerateMateriUraian(bodyObj, apiKey)) as T;
    }
    if (url.includes('/api/generate-quiz-media')) {
      return (await clientGenerateQuizMedia(bodyObj, apiKey)) as T;
    }
    if (url.includes('/api/generate-image')) {
      return (await clientGenerateImage(bodyObj, apiKey)) as T;
    }
    if (url.includes('/api/custom-og-image')) {
      return {
        success: true,
        message: 'Gambar Favicon & Open Graph berhasil disimpan secara lokal.'
      } as T;
    }

    throw new Error(`Server backend tidak mengembalikan JSON (Status ${status} ${statusText}).`);
  }

  throw new Error('Gagal memproses permintaan server.');
}
