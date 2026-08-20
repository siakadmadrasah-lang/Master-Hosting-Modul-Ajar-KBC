import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Explicit download endpoints for Plesk/cPanel hosting assets (Bypasses Vite 403 PHP file restrictions)
app.options(['/api/download/*', '/hosting-dist.zip', '/api.php', '/database.sql'], (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  return res.sendStatus(204);
});

app.get(['/api/download/hosting-dist.zip', '/hosting-dist.zip'], (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  const publicZipPath = path.join(process.cwd(), 'public', 'hosting-dist.zip');
  const distZipPath = path.join(process.cwd(), 'dist', 'hosting-dist.zip');

  // Always regenerate if missing, stale (> 2 minutes), or requested with rebuild=true
  let needRegenerate = !fs.existsSync(publicZipPath);
  if (!needRegenerate) {
    try {
      const zipAgeMs = Date.now() - fs.statSync(publicZipPath).mtimeMs;
      if (zipAgeMs > 2 * 60 * 1000 || _req.query.rebuild === 'true') {
        needRegenerate = true;
      }
    } catch (e) {
      needRegenerate = true;
    }
  }

  if (needRegenerate) {
    try {
      execSync('node scripts/create-hosting-zip.js', { stdio: 'inherit' });
    } catch (e) {
      console.error('Failed to auto-generate hosting-dist.zip:', e);
    }
  }

  const foundPath = [publicZipPath, distZipPath].find(p => fs.existsSync(p));

  if (foundPath && fs.existsSync(foundPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="hosting-dist.zip"');
    return res.sendFile(foundPath);
  }
  return res.status(404).send('File ZIP hosting tidak dapat dibuat');
});

app.get(['/api/download/api.php', '/api.php'], (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  const phpPath = path.join(process.cwd(), 'public', 'api.php');
  if (fs.existsSync(phpPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="api.php"');
    return res.sendFile(phpPath);
  }
  return res.status(404).send('File api.php tidak ditemukan');
});

app.get(['/api/download/database.sql', '/database.sql'], (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  const sqlPath = path.join(process.cwd(), 'public', 'database.sql');
  if (fs.existsSync(sqlPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="database.sql"');
    return res.sendFile(sqlPath);
  }
  return res.status(404).send('File database.sql tidak ditemukan');
});

// MySQL / Plesk Hosting API endpoints
app.post('/api/mysql/diagnose', async (req, res) => {
  const { config } = req.body || {};
  if (!config || !config.host || !config.user || !config.database) {
    return res.status(400).json({
      success: false,
      title: 'Parameter Konfigurasi Tidak Lengkap',
      message: 'Host, User, dan Database harus diisi untuk melakukan diagnosa MySQL.',
      code: 'MISSING_PARAMS'
    });
  }

  const host = config.host.trim();
  const port = Number(config.port) || 3306;
  const user = config.user.trim();
  const database = config.database.trim();
  const isLocalhost = host === '127.0.0.1' || host === 'localhost';

  const startTime = Date.now();
  let connection;

  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password: config.password || '',
      database,
      connectTimeout: 7000
    });

    const [rows]: any = await connection.query('SELECT 1 AS alive, NOW() as server_time');
    const latencyMs = Date.now() - startTime;
    await connection.end();

    return res.json({
      success: true,
      code: 'SUCCESS',
      latencyMs,
      queryResult: rows[0],
      title: 'Diagnosis Berhasil (SELECT 1 OK)',
      message: `Terkoneksi langsung ke MySQL server (${host}:${port}). Respon query 'SELECT 1' diterima dalam ${latencyMs}ms.`,
      isLocalhost,
      recommendation: isLocalhost
        ? 'Aplikasi berjalan di server Node.js lokal/Cloud. Untuk penggunaan di hosting Plesk/cPanel, cukup unggah hosting-dist.zip dan api.php.'
        : 'Koneksi remote MySQL berjalan normal. Anda dapat melakukan sync data.'
    });
  } catch (err: any) {
    if (connection) {
      try { await connection.end(); } catch (e) {}
    }

    const latencyMs = Date.now() - startTime;
    const rawError = err.message || String(err);
    const code = err.code || (rawError.includes('ECONNREFUSED') ? 'ECONNREFUSED' : 'UNKNOWN');

    let title = 'Gagal Diagnosis MySQL';
    let summary = rawError;
    let explanation = '';
    let solution = '';

    if (code === 'ECONNREFUSED' || rawError.includes('ECONNREFUSED')) {
      title = 'Koneksi Ditolak (ECONNREFUSED)';
      if (isLocalhost) {
        summary = `Port ${port} pada 127.0.0.1/localhost ditolak oleh kontainer Cloud AI Studio.`;
        explanation = `Pengujian 'Uji Koneksi' dari tombol Pratinjau Cloud AI Studio saat ini berjalan di server Cloud Google (bukan di laptop atau server hosting cPanel/Plesk Anda). Di dalam server Cloud ini, tidak ada service MySQL lokal yang berjalan di port ${port}.`;
        solution = `INI SANGAT NORMAL & BUKAN ERROR APLIKASI!\n1. Unduh file 'hosting-dist.zip' dan 'api.php' dari tombol di halaman ini.\n2. Ekstrak 'hosting-dist.zip' dan upload 'api.php' ke folder httpdocs / public_html di cPanel / Plesk Hosting Anda.\n3. Setelah dibuka dari domain/URL hosting Anda sendiri, opsi 'localhost' / '127.0.0.1' akan OTOMATIS BERHASIL 100% karena web & MySQL berjalan di server hosting yang sama.`;
      } else {
        summary = `Server MySQL Remote di ${host}:${port} menolak sambungan (ECONNREFUSED).`;
        explanation = `Server hosting tempat MySQL berada menolak koneksi eksternal dari IP Cloud Run / AI Studio. Ini biasanya terjadi karena Port 3306 ditutup oleh Firewall hosting atau fitur 'Remote MySQL' belum diizinkan.`;
        solution = `1. Buka cPanel / Plesk Hosting Anda -> menu 'Remote MySQL' -> tambahkan IP '%' (wildcard) agar server luar dapat mengakses MySQL.\n2. Atau gunakan Bridge PHP 'api.php' yang kami sediakan untuk diunggah langsung ke web hosting Anda (lebih aman & tanpa perlu buka port 3306).`;
      }
    } else if (code === 'ER_ACCESS_DENIED_ERROR' || rawError.includes('Access denied')) {
      title = 'Akses Ditolak (User / Password Salah)';
      summary = `User '${user}' tidak diizinkan mengakses database '${database}' di ${host}.`;
      explanation = `Sistem berhasil terhubung ke port MySQL ${port}, namun kombinasi Username dan Password ditolak oleh server MySQL.`;
      solution = `1. Periksa kembali Username dan Password MySQL di cPanel/Plesk.\n2. Pastikan User '${user}' sudah diberi privilege (hak akses) penuh ke database '${database}'.`;
    } else if (code === 'ER_BAD_DB_ERROR' || rawError.includes('Unknown database')) {
      title = 'Database Tidak Ditemukan (ER_BAD_DB_ERROR)';
      summary = `Database '${database}' tidak ditemukan di server MySQL ${host}.`;
      explanation = `User dan password berhasil diverifikasi, namun nama database '${database}' tidak ada.`;
      solution = `Buka cPanel / Plesk -> MySQL Databases -> Buat database baru dengan nama '${database}'.`;
    } else if (code === 'ETIMEDOUT' || code === 'ENOTFOUND' || rawError.includes('ETIMEDOUT') || rawError.includes('ENOTFOUND')) {
      title = 'Koneksi Waktu Habis / Domain Tidak Ditemukan';
      summary = `Host '${host}' tidak dapat dijangkau atau port ${port} terhalang firewall.`;
      explanation = `Aplikasi menunggu koneksi selama 7 detik namun tidak mendapat respon sama sekali dari server MySQL remote.`;
      solution = `1. Pastikan nama Host '${host}' sudah benar (bisa IP Address atau domain hosting).\n2. Pastikan port MySQL (${port}) terbuka pada firewall server.`;
    }

    return res.status(500).json({
      success: false,
      code,
      latencyMs,
      title,
      summary,
      explanation,
      solution,
      rawError,
      isLocalhost
    });
  }
});

app.post('/api/mysql/test', async (req, res) => {
  const { config } = req.body || {};
  if (!config || !config.host || !config.user || !config.database) {
    return res.status(400).json({ success: false, message: 'Host, User, dan Database harus diisi.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.host.trim(),
      port: Number(config.port) || 3306,
      user: config.user.trim(),
      password: config.password || '',
      database: config.database.trim(),
      connectTimeout: 8000
    });

    const safeTableName = (config.tableName || 'kbc_mi_app_settings').replace(/[^a-zA-Z0-9_]/g, '') || 'kbc_mi_app_settings';
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`${safeTableName}\` (
        madrasah_id VARCHAR(255) PRIMARY KEY,
        data LONGTEXT,
        updated_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.end();
    return res.json({ success: true, message: `Koneksi ke database MySQL '${config.database}' dan tabel '${safeTableName}' berhasil!` });
  } catch (err: any) {
    if (connection) {
      try { await connection.end(); } catch (e) {}
    }
    let errMsg = err.message || 'Error tidak diketahui';
    if (errMsg.includes('ECONNREFUSED') && (config.host === '127.0.0.1' || config.host === 'localhost')) {
      errMsg += ' -> CATATAN: Pengujian koneksi ke "127.0.0.1/localhost" dari Pratinjau Web AI Studio tidak dapat menjangkau MySQL di laptop/hosting Anda. Namun setelah Anda mengunggah "hosting-dist.zip" dan "api.php" ke hosting Plesk/cPanel Anda, koneksi localhost akan OTOMATIS BERHASIL karena web dan MySQL berjalan di server hosting yang sama.';
    }
    return res.status(500).json({ success: false, message: `Gagal koneksi MySQL: ${errMsg}` });
  }
});

app.post('/api/mysql/push', async (req, res) => {
  const { config, data } = req.body || {};
  if (!config || !config.host || !config.user || !config.database) {
    return res.status(400).json({ success: false, message: 'Konfigurasi MySQL tidak lengkap.' });
  }
  const madrasahId = data?.madrasahId || 'default-madrasah';

  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.host.trim(),
      port: Number(config.port) || 3306,
      user: config.user.trim(),
      password: config.password || '',
      database: config.database.trim(),
      connectTimeout: 10000
    });

    const safeTableName = (config.tableName || 'kbc_mi_app_settings').replace(/[^a-zA-Z0-9_]/g, '') || 'kbc_mi_app_settings';
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`${safeTableName}\` (
        madrasah_id VARCHAR(255) PRIMARY KEY,
        data LONGTEXT,
        updated_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const jsonStr = JSON.stringify(data || {});
    await connection.query(
      `INSERT INTO \`${safeTableName}\` (madrasah_id, data, updated_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()`,
      [madrasahId, jsonStr]
    );

    await connection.end();
    return res.json({ success: true, message: 'Data berhasil disimpan ke MySQL!' });
  } catch (err: any) {
    if (connection) {
      try { await connection.end(); } catch (e) {}
    }
    let errMsg = err.message || 'Error tidak diketahui';
    if (errMsg.includes('ECONNREFUSED') && (config.host === '127.0.0.1' || config.host === 'localhost')) {
      errMsg += ' -> CATATAN: "127.0.0.1/localhost" merujuk ke Cloud AI Studio. Silakan unduh "hosting-dist.zip" dan ekspor ke hosting Plesk/cPanel Anda.';
    }
    return res.status(500).json({ success: false, message: `Gagal simpan ke MySQL: ${errMsg}` });
  }
});

app.post('/api/mysql/pull', async (req, res) => {
  const { config, madrasahId: requestedMadrasahId } = req.body || {};
  if (!config || !config.host || !config.user || !config.database) {
    return res.status(400).json({ success: false, message: 'Konfigurasi MySQL tidak lengkap.' });
  }
  const madrasahId = requestedMadrasahId || 'default-madrasah';

  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.host.trim(),
      port: Number(config.port) || 3306,
      user: config.user.trim(),
      password: config.password || '',
      database: config.database.trim(),
      connectTimeout: 10000
    });

    const safeTableName = (config.tableName || 'kbc_mi_app_settings').replace(/[^a-zA-Z0-9_]/g, '') || 'kbc_mi_app_settings';
    const [rows]: [any[], any] = await connection.query(
      `SELECT data FROM \`${safeTableName}\` WHERE madrasah_id = ? LIMIT 1`,
      [madrasahId]
    );

    await connection.end();

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan di database MySQL untuk Madrasah ini.' });
    }

    const payload = JSON.parse(rows[0].data || '{}');
    return res.json({ success: true, data: payload });
  } catch (err: any) {
    if (connection) {
      try { await connection.end(); } catch (e) {}
    }
    return res.status(500).json({ success: false, message: `Gagal memuat dari MySQL: ${err.message || 'Error tidak diketahui'}` });
  }
});

// Helper function to resolve dynamic base URL for absolute Open Graph tags
function getBaseUrl(req: express.Request): string {
  const envUrl = process.env.APP_URL;
  if (envUrl && envUrl.trim().length > 0 && !envUrl.includes('MY_APP_URL')) {
    let cleanEnv = envUrl.trim().replace(/\/+$/, '');
    cleanEnv = cleanEnv.replace(/^(https?):\/+([^\/])/i, '$1://$2');
    if (!/^https?:\/\//i.test(cleanEnv)) {
      cleanEnv = `https://${cleanEnv.replace(/^[:\/]+/, '')}`;
    }
    return cleanEnv;
  }
  let proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  if (proto.includes(',')) {
    proto = proto.split(',')[0].trim();
  }
  proto = proto.replace(/[:\/]/g, '');
  if (!proto) proto = 'https';

  let host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
  if (host.includes(',')) {
    host = host.split(',')[0].trim();
  }
  host = host.replace(/^https?:\/*/, '').replace(/\/+$/, '');

  // Enforce https for external domains / Cloud Run
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    proto = 'https';
  }
  return `${proto}://${host}`;
}

// Helper function to verify if a file exists on disk and is a valid binary image (JPEG, PNG, GIF)
function isValidImageFile(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size < 1000) return false;
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    const hex = buf.toString('hex');
    return hex.startsWith('ffd8ff') || hex.startsWith('89504e47') || hex.startsWith('47494638');
  } catch (e) {
    return false;
  }
}

// Open Graph Image Endpoint (Serves custom or system default round emblem image with CORS & caching headers)
let customOgImageBuffer: Buffer | null = null;
let customOgMimeType: string = 'image/jpeg';

app.get([
  '/og-image.jpg',
  '/og-image.png',
  '/og-image-round.jpg',
  '/og-image-round.png',
  '/favicon.ico',
  '/favicon.png',
  '/favicon.jpg',
  '/apple-touch-icon.png'
], (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // If user uploaded a custom OG image
  if (customOgImageBuffer) {
    res.setHeader('Content-Type', customOgMimeType);
    return res.send(customOgImageBuffer);
  }

  // Check if custom image file exists in public directory
  const customFilePath = path.join(process.cwd(), 'public', 'custom-og-image.jpg');
  if (isValidImageFile(customFilePath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    return res.sendFile(customFilePath);
  }

  // System Default Round Emblem Image (Checks public, dist, and src folders)
  const pathsToCheck = [
    path.join(process.cwd(), 'public', 'og-image-round.jpg'),
    path.join(process.cwd(), 'public', 'og-image.jpg'),
    path.join(process.cwd(), 'dist', 'og-image-round.jpg'),
    path.join(process.cwd(), 'dist', 'og-image.jpg'),
    path.join(process.cwd(), 'src', 'assets', 'images', 'og_badge_jaenal_inside_1784949367744.jpg'),
    path.join(process.cwd(), 'src', 'assets', 'images', 'og_jaenal_vibrant_1784948587404.jpg'),
    path.join(process.cwd(), 'src', 'assets', 'images', 'og_image_round_jaenal_1784946706402.jpg')
  ];

  const finalPath = pathsToCheck.find(p => isValidImageFile(p));

  if (finalPath) {
    if (req.path.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    } else if (req.path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    return res.sendFile(finalPath);
  }
  
  res.status(404).send('Image not found');
});

// API endpoint to update custom OG image dynamically
app.post('/api/custom-og-image', (req, res) => {
  try {
    const { imageData, action } = req.body || {};

    if (action === 'reset') {
      customOgImageBuffer = null;
      const customFilePath = path.join(process.cwd(), 'public', 'custom-og-image.jpg');
      if (fs.existsSync(customFilePath)) {
        try { fs.unlinkSync(customFilePath); } catch (e) {}
      }
      return res.json({ success: true, message: 'Gambar Open Graph berhasil dikembalikan ke default sistem.' });
    }

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ success: false, error: 'Data gambar tidak valid' });
    }

    if (imageData.startsWith('data:image/')) {
      const matches = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
      if (matches) {
        customOgMimeType = matches[1];
        customOgImageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        return res.status(400).json({ success: false, error: 'Format data URL gambar tidak dikenali' });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Gunakan format Base64 / Data URL yang valid' });
    }

    // Save to public directory for persistence
    const customFilePath = path.join(process.cwd(), 'public', 'custom-og-image.jpg');
    fs.writeFileSync(customFilePath, customOgImageBuffer);

    return res.json({
      success: true,
      message: 'Gambar Open Graph custom berhasil diperbarui!'
    });
  } catch (err: any) {
    console.error('Error updating custom OG image:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal menyimpan gambar custom' });
  }
});

// Mapel OG & Thumbnail Configs Endpoint
const mapelOgJsonPath = path.join(process.cwd(), 'public', 'data', 'mapel_og_configs.json');

app.get('/api/mapel-og-configs', (_req, res) => {
  try {
    if (fs.existsSync(mapelOgJsonPath)) {
      const content = fs.readFileSync(mapelOgJsonPath, 'utf-8');
      const configs = JSON.parse(content);
      return res.json({ success: true, configs });
    }
  } catch (e) {
    console.error('Error reading mapel_og_configs.json:', e);
  }
  return res.json({ success: true, configs: {} });
});

app.post('/api/mapel-og-configs', (req, res) => {
  try {
    const { mapel, mapelKey, title, desc, imageUrl } = req.body || {};
    if (!mapel) {
      return res.status(400).json({ success: false, error: 'Mapel wajib diisi' });
    }

    const dataDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let existing: Record<string, any> = {};
    if (fs.existsSync(mapelOgJsonPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(mapelOgJsonPath, 'utf-8'));
      } catch (e) {}
    }

    const rawKey = mapelKey || sanitizeMapelKey(mapel) || mapel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const keyToUse = sanitizeMapelKey(rawKey) || rawKey;

    let finalImageUrl = imageUrl || '';

    // If imageUrl is a base64 data string, decode and save to physical file on disk
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:image/')) {
      const match = imageUrl.match(/^data:image\/([^;]+);base64,(.+)$/s);
      if (match) {
        const mime = match[1].toLowerCase();
        let ext = 'jpg';
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        else if (mime.includes('svg')) ext = 'svg';

        const base64Data = match[2].replace(/\s+/g, '');
        const buffer = Buffer.from(base64Data, 'base64');

        if (buffer && buffer.length > 0) {
          // Unlink old files to prevent extension mismatches
          for (const oldExt of ['jpg', 'png', 'jpeg', 'webp', 'svg', 'gif']) {
            const oldFileP = path.join(dataDir, `og_mapel_${keyToUse}.${oldExt}`);
            if (fs.existsSync(oldFileP)) {
              try { fs.unlinkSync(oldFileP); } catch {}
            }
            const oldFileD = path.join(process.cwd(), 'dist', 'data', `og_mapel_${keyToUse}.${oldExt}`);
            if (fs.existsSync(oldFileD)) {
              try { fs.unlinkSync(oldFileD); } catch {}
            }
          }

          const fileName = `og_mapel_${keyToUse}.${ext}`;
          const filePathP = path.join(dataDir, fileName);
          fs.writeFileSync(filePathP, buffer);

          const distDataDir = path.join(process.cwd(), 'dist', 'data');
          if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
            if (!fs.existsSync(distDataDir)) {
              fs.mkdirSync(distDataDir, { recursive: true });
            }
            fs.writeFileSync(path.join(distDataDir, fileName), buffer);
          }

          const mtime = Date.now();
          finalImageUrl = `/data/${fileName}?v=${mtime}`;
        }
      }
    } else if (finalImageUrl && typeof finalImageUrl === 'string' && (finalImageUrl.startsWith('http://') || finalImageUrl.startsWith('https://'))) {
      if (finalImageUrl.startsWith('http://')) {
        finalImageUrl = finalImageUrl.replace(/^http:\/\//i, 'https://');
      }
      const distDataDir = path.join(process.cwd(), 'dist', 'data');
      for (const oldExt of ['jpg', 'png', 'jpeg', 'webp', 'svg', 'gif']) {
        const pPath = path.join(dataDir, `og_mapel_${keyToUse}.${oldExt}`);
        const dPath = path.join(distDataDir, `og_mapel_${keyToUse}.${oldExt}`);
        if (fs.existsSync(pPath)) { try { fs.unlinkSync(pPath); } catch {} }
        if (fs.existsSync(dPath)) { try { fs.unlinkSync(dPath); } catch {} }
      }
    }

    const updatedCfg = {
      title: title || `Kuis & Media Interaktif ${mapel}`,
      desc: desc || `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${mapel}`,
      imageUrl: finalImageUrl,
      updatedAt: new Date().toISOString()
    };

    existing[keyToUse] = updatedCfg;
    existing[mapel] = updatedCfg;

    const aliasGroups: Record<string, string[]> = {
      ke_nu_an: ['ke_nu_an', 'ke_nu', 'aswaja', 'nu', 'nahdlatul_ulama', 'kemuhammadiyahan', 'ke_nu_an_aswaja'],
      aswaja: ['ke_nu_an', 'ke_nu', 'aswaja', 'nu', 'nahdlatul_ulama', 'kemuhammadiyahan', 'ke_nu_an_aswaja'],
      ke_nu_an_aswaja: ['ke_nu_an', 'ke_nu', 'aswaja', 'nu', 'nahdlatul_ulama', 'kemuhammadiyahan', 'ke_nu_an_aswaja'],
      nu: ['ke_nu_an', 'ke_nu', 'aswaja', 'nu', 'nahdlatul_ulama', 'kemuhammadiyahan', 'ke_nu_an_aswaja'],

      al_qur_an_hadis: ['quran_hadis', 'al_qur_an_hadis', 'quran', 'hadis', 'hadits', 'al_quran_hadis'],
      quran_hadis: ['quran_hadis', 'al_qur_an_hadis', 'quran', 'hadis', 'hadits', 'al_quran_hadis'],

      akidah_akhlak: ['akidah_akhlak', 'akidah', 'akhlak', 'aqidah', 'aqidah_akhlak'],
      akidah: ['akidah_akhlak', 'akidah', 'akhlak', 'aqidah', 'aqidah_akhlak'],

      fiqih: ['fiqih', 'fikih'],
      fikih: ['fiqih', 'fikih'],

      sejarah_kebudayaan_islam_ski: ['sejarah_kebudayaan_islam_ski', 'ski', 'sejarah', 'sejarah_kebudayaan_islam'],
      ski: ['sejarah_kebudayaan_islam_ski', 'ski', 'sejarah', 'sejarah_kebudayaan_islam'],

      bahasa_arab: ['bahasa_arab', 'arab'],
      arab: ['bahasa_arab', 'arab'],

      ipas: ['ipas', 'ipa', 'ips', 'ipas_ipa_ips', 'ipas__ipa___ips_'],
      matematika: ['matematika', 'mtk'],
      pendidikan_pancasila: ['pendidikan_pancasila', 'pancasila', 'ppkn', 'pkn'],
      bahasa_indonesia: ['bahasa_indonesia', 'indonesia'],
      bahasa_inggris: ['bahasa_inggris', 'inggris', 'english', 'Bahasa Inggris', 'English', 'b_inggris'],
      inggris: ['bahasa_inggris', 'inggris', 'english', 'Bahasa Inggris', 'English', 'b_inggris'],
      english: ['bahasa_inggris', 'inggris', 'english', 'Bahasa Inggris', 'English', 'b_inggris'],
      'Bahasa Inggris': ['bahasa_inggris', 'inggris', 'english', 'Bahasa Inggris', 'English', 'b_inggris'],
      bahasa_jawa: ['bahasa_jawa', 'jawa'],
      pjok: ['pjok', 'olahraga', 'penjas', 'penjaskes', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
      penjas: ['pjok', 'olahraga', 'penjas', 'penjaskes', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
      penjaskes: ['pjok', 'olahraga', 'penjas', 'penjaskes', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
      olahraga: ['pjok', 'olahraga', 'penjas', 'penjaskes', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
      jasmani: ['pjok', 'olahraga', 'penjas', 'penjaskes', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
      pendidikan_jasmani: ['pjok', 'olahraga', 'penjas', 'penjaskes', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
      PJOK: ['pjok', 'olahraga', 'penjas', 'penjaskes', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
      'Pendidikan Jasmani': ['pjok', 'olahraga', 'penjas', 'penjaskes', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],

      seni_budaya: ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
      seni: ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
      prakarya: ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
      sbk: ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
      sbdp: ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
      'Seni Budaya': ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
      p5_ppra: ['p5_ppra', 'p5', 'ppra', 'proyek']
    };

    if (aliasGroups[keyToUse]) {
      for (const alias of aliasGroups[keyToUse]) {
        existing[alias] = updatedCfg;
      }
    }

    fs.writeFileSync(mapelOgJsonPath, JSON.stringify(existing, null, 2), 'utf-8');

    const distMapelOgJsonPath = path.join(process.cwd(), 'dist', 'data', 'mapel_og_configs.json');
    if (fs.existsSync(path.join(process.cwd(), 'dist', 'data'))) {
      fs.writeFileSync(distMapelOgJsonPath, JSON.stringify(existing, null, 2), 'utf-8');
    }

    return res.json({ success: true, config: updatedCfg, message: `Thumbnail & OG Mapel ${mapel} berhasil disimpan!` });
  } catch (err: any) {
    console.error('Error saving mapel_og_configs:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal menyimpan config mapel' });
  }
});

// Dedicated GET Endpoint for Mapel OG Images
app.get('/api/mapel-og-image/:mapelKey', (req, res) => {
  try {
    const rawMapel = req.params.mapelKey || (req.query.mapel as string) || 'general';
    const mapelKey = sanitizeMapelKey(rawMapel) || rawMapel;

    // 1. Check physical file on disk first
    for (const ext of ['jpg', 'png', 'jpeg', 'webp', 'gif', 'svg']) {
      const pPath = path.join(process.cwd(), 'public', 'data', `og_mapel_${mapelKey}.${ext}`);
      const dPath = path.join(process.cwd(), 'dist', 'data', `og_mapel_${mapelKey}.${ext}`);
      const targetPath = fs.existsSync(pPath) ? pPath : (fs.existsSync(dPath) ? dPath : null);
      if (targetPath) {
        const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : `image/${ext}`;
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.sendFile(targetPath);
      }
    }

    // 2. Check stored configs in mapel_og_configs.json
    const configs = readMapelOgConfigs();
    const cfg = findMapelOgConfig(configs, rawMapel, rawMapel, mapelKey);
    if (cfg && cfg.imageUrl) {
      const url = cfg.imageUrl.trim();
      if (url.startsWith('data:image/')) {
        const match = url.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,(.+)$/s);
        if (match) {
          const mime = match[1];
          const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
          res.setHeader('Content-Type', mime);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(buffer);
        }
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        return res.redirect(url);
      } else if (url.startsWith('/')) {
        const cleanRel = url.replace(/\?.*$/, '');
        const pPath = path.join(process.cwd(), 'public', cleanRel);
        const dPath = path.join(process.cwd(), 'dist', cleanRel);
        const targetPath = fs.existsSync(pPath) ? pPath : (fs.existsSync(dPath) ? dPath : null);
        if (targetPath) {
          const mime = cleanRel.endsWith('.png') ? 'image/png' : 'image/jpeg';
          res.setHeader('Content-Type', mime);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.sendFile(targetPath);
        }
      }
    }

    // 3. Fallback to default preset subject image if mapelKey is present
    if (mapelKey && mapelKey !== 'general') {
      return res.redirect('https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop');
    }

    // 4. Fallback to global custom image or default round badge
    const customJpg = path.join(process.cwd(), 'public', 'custom-og-image.jpg');
    if (fs.existsSync(customJpg)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(customJpg);
    }

    const defaultRound = path.join(process.cwd(), 'public', 'og-image-round.jpg');
    if (fs.existsSync(defaultRound)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(defaultRound);
    }

    return res.status(404).json({ success: false, error: 'Gambar mapel tidak ditemukan' });
  } catch (err: any) {
    console.error('Error serving mapel og image:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error serving image' });
  }
});

// Helper function to resolve Gemini API key
function getApiKey(req: express.Request): string | undefined {
  const headerKey = req.headers['x-gemini-api-key'] as string;
  if (headerKey && headerKey.trim().length > 0) {
    return headerKey.trim();
  }
  if (req.body && req.body.userApiKey && String(req.body.userApiKey).trim().length > 0) {
    return String(req.body.userApiKey).trim();
  }
  return process.env.GEMINI_API_KEY;
}

// Helper with exponential backoff & fallback models for high server load (503 / 429)
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
          // Pause briefly before retrying or switching models
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        } else {
          // Non-transient error, break to try next fallback model
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

// Endpoint dedicated to testing Gemini API Key connection
app.post('/api/test-api-key', async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API Key Gemini belum diisi atau dikonfigurasi.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const response = await generateContentWithRetry(ai, {
      contents: 'Tes koneksi API Key Gemini AI. Jawab singkat: OK',
    });

    if (response.text) {
      return res.json({
        success: true,
        message: 'Koneksi API Key Gemini AI Berhasil! Kunci API aktif dan siap digunakan untuk menyusun modul KBC.'
      });
    } else {
      throw new Error('Respon dari Gemini AI kosong.');
    }
  } catch (error: any) {
    console.error('Error testing API key:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Kunci API Gemini tidak valid atau terjadi kesalahan koneksi.'
    });
  }
});

app.post('/api/generate-modul', async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) {
      return res.status(400).json({
        error: 'API Key Gemini belum dikonfigurasi. Masukkan API Key di menu Pengaturan atau pastikan GEMINI_API_KEY diatur di environment.'
      });
    }

    const {
      namaMadrasah = 'MI Ma\'arif NU 2 Sanggreman',
      mataPelajaran = 'Akidah Akhlak',
      materi = 'Meneladani Sifat Ar-Rahman dalam Kasih Sayang',
      faseKelas = 'Fase B (Kelas III MI)',
      semester = 'Ganjil (1)',
      tahunPelajaran = '2025/2026',
      alokasiWaktu = '2 x 35 Menit (2 JP)',
      tanggalPelaksanaan = 'Terlampir / Disesuaikan',
      topikPancaCinta = [],
      instruksiKhusus = ''
    } = req.body;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const promptText = `Anda adalah Pakar Pengembang Kurikulum Berbasis Cinta (KBC) Madrasah Ibtidaiyah (MI) Kementerian Agama Republik Indonesia.
Buatkan Modul Ajar Berbasis Cinta (KBC) yang SANGAT LENGKAP, DETAIL, RUNTUT, TERSTRUKTUR, DAN JELAS sesuai parameter berikut:

- Nama Madrasah (Seksi Identitas Modul): ${namaMadrasah}
- Mata Pelajaran: ${mataPelajaran}
- Materi Utama: ${materi}
- Fase / Kelas: ${faseKelas}
- Semester: ${semester}
- Tahun Pelajaran: ${tahunPelajaran}
- Alokasi Waktu: ${alokasiWaktu}
- Tanggal Pelaksanaan: ${tanggalPelaksanaan}
- Fokus Topik Panca Cinta: ${Array.isArray(topikPancaCinta) && topikPancaCinta.length > 0 ? topikPancaCinta.join(', ') : 'Disesuaikan secara otomatis'}
- Catatan Tambahan/Khusus: ${instruksiKhusus || 'Sajikan dengan nuansa Islami Rahmatan lil Aalamin, ramah anak, dan mendalam.'}

PETUNJUK PENYUSUNAN SANGAT DETAIL DENGAN DESKRIPSI URAIAN LENGKAP:
1. Seksi Identitas Modul: (Nama Madrasah, Mata Pelajaran, Materi, Fase/Kelas, Semester, Tahun Pelajaran, Alokasi Waktu, Tanggal Pelaksanaan).
2. Seksi Identifikasi (WAJIB DIBUAT SANGAT LENGKAP & JELAS SEHINGGA KRISTAL):
   - Kesiapan Murid (Asesmen Diagnostik Awal):
     * pahamUtuh: Uraikan secara sangat mendalam & rinci mengenai karakteristik pemahaman murid kategori tinggi/mahir, indikator spesifik penguasaan materi, serta bentuk intervensi diferensiasi berupa tantangan pengayaan dan peran sebagai tutor sebaya KBC.
     * pahamSebagian: Uraikan secara sangat mendalam & rinci mengenai materi/konsep yang sudah dipahami dan bagian mana yang masih membingungkan, serta bentuk pendampingan terarah yang diberikan guru.
     * belumPaham: Uraikan secara sangat mendalam & rinci mengenai kesulitan/hambatan dasar murid, kebutuhan scaffolding/bimbingan personal intensif melalui media konkret/visual, serta perlakuan afektif penuh kehangatan KBC.
   - Materi Pelajaran (WAJIB DIURAIKAN SANGAT LENGKAP, DETAIL, & KOMPREHENSIF MEMUAT 6 POIN SUB-BAB UTAMA BERIKUT TANPA SIMBOL ASTERIKS ** ATAU *):
     1. Pengertian, Etimologi, & Konsep Utama (Definisi mendalam, etimologi/istilah, dan pemahaman konsep secara utuh sesuai level MI).
     2. Landasan Syariat & Dalil Al-Qur'an / Hadis atau Keilmuan Relevan (Lafaz Latin/terjemahan, landasan hukum/syariat, serta pesan moral spiritual utama yang terkandung).
     3. Ketentuan, Syarat, Rukun, & Komponen Pokok (Syarat sah/wajib, kriteria teknis, atau elemen-elemen penting yang wajib dipahami cermat oleh murid).
     4. Tata Cara, Urutan Langkah, & Adab Pembiasaan (Tahapan pelaksanaan runtut dari awal sampai akhir, keutamaan, serta adab-adab kebaikan terpuji).
     5. Integrasi Nilai Panca Cinta KBC & Hikmah (Kaitan materi dengan Cinta Allah SWT & Rasul-Nya, Cinta Sesama, Cinta Lingkungan, dan Cinta Diri, serta hikmah emosional/sosial).
     6. Penerapan Praktis & Pembiasaan Akhlak Sehari-hari (Contoh-contoh konkret aksi nyata dan pembiasaan positif yang langsung dipraktikkan di madrasah, rumah, dan masyarakat).
   - Dimensi Profil Lulusan: Cantumkan 3-4 dimensi Profil Pelajar Pancasila & Rahmatan lil 'Alamin yang PALING RELEVAN dengan materi "${materi}". WAJIB MENGGUNAKAN FORMAT "Nama Dimensi: Uraian/deskripsi rinci..." yang menjelaskan secara spesifik bagaimana dimensi karakter tersebut ditumbuhkan dan diwujudkan melalui materi "${materi}".
   - Topik Panca Cinta: Cantumkan 2-3 pilar Panca Cinta KBC yang PALING RELEVAN dengan materi "${materi}". WAJIB MENGGUNAKAN FORMAT "Nama Panca Cinta: Uraian/deskripsi rinci..." yang menjelaskan secara spesifik bagaimana nilai cinta tersebut dipraktikkan secara nyata melalui materi "${materi}".
   - Materi Integrasi KBC: Uraikan secara rinci dan komprehensif bagaimana kehangatan sapaan, kelembutan tutur kata, empati sosial, dan pembiasaan aksi kebaikan terintegrasi dalam materi.
3. Seksi Desain Pembelajaran (WAJIB URAIAN DESKRIPSI LENGKAP, RINCI, DAN TRANSPARAN):
   - Capaian Pembelajaran (CP): Uraikan deskripsi CP secara lengkap dan utuh mencakup ranah pengetahuan, keterampilan, serta karakter sikap cinta KBC sesuai Fase.
   - Lintas Disiplin Ilmu: Uraikan deskripsi lengkap dan komprehensif bagaimana materi ini terhubung dengan mata pelajaran lain (seperti Bahasa Indonesia, IPAS, Seni Budaya, PJOK) dilengkapi contoh penerapannya.
   - Tujuan Pembelajaran (TP & ATP): Buat minimal 3-4 Tujuan Pembelajaran yang spesifik, terukur, lengkap dengan indikator ketercapaian dan nuansa nilai KBC.
4. Seksi Kerangka Pembelajaran: (Praktek Pedagogik [Mindful Learning, Deep Learning, Differentiated], Kemitraan Pembelajaran [Orang Tua & Komunitas], Lingkungan Pembelajaran [Aman, Nyaman, Inklusif, Penuh Cinta], Pemanfaatan Digital).
5. Seksi Pengalaman Belajar (WAJIB DIBUAT SANGAT DETIL, LENGKAP, TERSTRUKTUR, BERTAHAP, DAN KOMPREHENSIF MEMUAT URAIAN KONKRET INTERAKSI GURU DAN SISWA DENGAN DURASI & PERINCIAN MENDALAM):
   - Kegiatan Awal (Minimal 5-6 poin uraian rinci dan mendalam):
     * Pembuka & Orientasi Penuh Cinta: Guru membuka pembelajaran dengan sapaan hangat "Assalamu'alaikum anak-anakku yang disayangi Allah SWT", pembiasaan budaya 5S (Senyum, Sapa, Salam, Sopan, Santun), serta pemeriksaan kebersihan dan kerapian kelas.
     * Spiritualisasi & Doa Bersuci: Berdoa bersama dipimpin oleh ketua kelas/murid secara bergantian dengan khusyuk, membaca doa bersuci, salawat nabi, serta hafalan ayat/surat pendek pilihan.
     * Emotion Check-in & Kesiapan Psikologis: Guru mengecek kondisi emosi/perasaan murid hari ini menggunakan roda emosi atau sapaan personal untuk memastikan kesiapan belajar murid secara mindful.
     * Apersepsi & Pemantik KBC: Guru menyajikan cerita inspiratif, fenomena gambar/video kontekstual, atau pertanyaan pemantik yang menggugah empati dan rasa ingin tahu murid terkait materi.
     * Penyampaian Tujuan & Motivasi: Guru menyampaikan tujuan pembelajaran, alur kegiatan, dan nilai kebaikan/hikmah KBC yang akan didapatkan peserta didik selama proses belajar.
   - Kegiatan Inti (Minimal 6-8 poin uraian rinci dan mendalam):
     * Eksplorasi Konsep & Literasi KBC: Peserta didik membaca/menyimak paparan materi secara mendalam dan kontekstual melalui literasi teks/bahan ajar KBC, ilustrasi visual, atau media digital.
     * Tanya Jawab & Identifikasi Masalah: Guru memfasilitasi sesi diskusi interaktif dengan pertanyaan bernalar kritis yang merangsang kepekaan afektif dan pemahaman murid.
     * Pengelompokan Heterogen Ramah Anak: Murid dibagi menjadi kelompok-kelompok kecil (Kelompok Cinta) yang heterogen untuk mendiskusikan studi kasus, gambar peristiwa, atau lembar kerja.
     * Investigasi & Diskusi Kolaboratif: Peserta didik berdiskusi aktif dalam suasana saling menghargai, mendengarkan pendapat teman tanpa memotong, dan menggali tindakan kebaikan yang tepat.
     * Bimbingan Terarah & Diferensiasi (Scaffolding): Guru berkeliling mendampingi kelompok, memberikan intervensi khusus dan bantuan bertahap bagi murid yang paham sebagian/belum paham, serta memberikan tantangan bagi murid yang paham utuh.
     * Peragaan / Praktik Pemahaman: Murid mensimulasikan atau memeragakan tata cara/langkah-langkah materi dalam kelompok secara langsung di depan kelas.
     * Presentasi Penuh Apresiasi: Masing-masing kelompok mempresentasikan hasil diskusi di depan kelas, kelompok lain menyimak dengan sopan dan memberikan kalimat pujian/tepuk kasih sayang KBC.
     * Penguatan Digital & Media Interaktif: Guru memperkuat pemahaman konsep materi menggunakan media digital (flashcard interaktif, kuis digital, atau gambar interaktif).
   - Mengaplikasi (Minimal 4-5 poin uraian rinci dan mendalam):
     * Praktik Aksi Nyata KBC: Peserta didik mempraktikkan secara langsung sikap/perilaku kebaikan dalam bentuk aksi nyata (misal: simulasi bertutur kata santun, saling menolong, atau merawat lingkungan).
     * Karya Kebaikan / Pohon Cinta: Murid membuat produk sederhana berupa daun komitmen/kartu doa/pohon cinta KBC dan menempelkannya di papan ekspresi kelas.
     * Misi Kebaikan Tersembunyi: Mengambil kupon aksi kebaikan dari "Kotak Kebaikan Cinta KBC" untuk dilaksanakan hingga akhir jam pelajaran atau di rumah.
   - Merefleksi (Minimal 4-5 poin uraian rinci dan mendalam):
     * Kontemplasi & Hening Sejenak: Peserta didik memejamkan mata diiringi nada instrumen lembut untuk merenungkan nikmat Allah SWT dan pentingnya mengamalkan materi yang telah dipelajari.
     * Refleksi Emosi & Lembar Refleksi: Murid mengisi lembar refleksi emosi dan menuliskan satu pesan kebaikan/rasa syukur atas bimbingan Allah SWT.
     * Saling Mengapresiasi (Peer Appreciation): Murid memberikan apresiasi/terima kasih tulus kepada teman sebaya atas kerja sama dan kebaikan selama proses belajar.
   - Penutup (Minimal 4-5 poin uraian rinci dan mendalam):
     * Rangkuman & Kesimpulan Bersama: Guru bersama murid menyimpulkan poin-poin utama pembelajaran dan pesan moral spiritual KBC.
     * Apresiasi Positif & Bintang KBC: Guru memberikan pujian dan bintang kebaikan kepada seluruh kelas atas kesungguhan, kerja sama, dan akhlak terpuji.
     * Tindak Lanjut & Jurnal Rumah: Guru memberikan panduan pembiasaan di rumah bersama orang tua melalui "Jurnal Kasih Sayang Keluarga".
     * Doa Penutup & Salam Kasih: Pembacaan doa penutup majelis (Kaffaratul Majlis), permohonan keberkahan ilmu, dan diakhiri salam kasih kehangatan KBC.
6. Seksi Assesmen: (Teknik Asesmen, Rubrik Asesmen Sikap Cinta, Instrumen Penilaian).
7. LKPD dan Media Digital WAJIB DIPENUHI SANGAT SPESIFIK UNTUK MATERI "${materi}":
   - LKPD (Judul, Petunjuk, Tugas Aktivitas, Pertanyaan Diskusi, Lembar Refleksi Siswa).
   - Soal Kuis Digital: Wajib minimal 25 nomor soal pilihan ganda interaktif lengkap dengan kunci jawaban (index 0-3) dan pembahasan bernuansa KBC khusus materi "${materi}".
   - Materi Interaktif: Ringkasan ringkas, minimal 4 poin penting, minimal 4 flashcard interaktif (depan & belakang) khusus materi "${materi}".
   - Gambar Interaktif: Deskripsi visual detail dan prompt gambar bahasa Inggris untuk ilustrasi pembelajaran "${materi}", plus minimal 3 hotspot interaktif (koordinat x, y 10-90, judul, penjelasan).

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
                alokasiWaktu: { type: Type.STRING },
                tanggalPelaksanaan: { type: Type.STRING }
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
                  properties: {
                    durasi: { type: Type.STRING },
                    kegiatan: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['durasi', 'kegiatan']
                },
                kegiatanInti: {
                  type: Type.OBJECT,
                  properties: {
                    durasi: { type: Type.STRING },
                    kegiatan: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['durasi', 'kegiatan']
                },
                mengaplikasi: {
                  type: Type.OBJECT,
                  properties: {
                    durasi: { type: Type.STRING },
                    kegiatan: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['durasi', 'kegiatan']
                },
                merefleksi: {
                  type: Type.OBJECT,
                  properties: {
                    durasi: { type: Type.STRING },
                    kegiatan: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['durasi', 'kegiatan']
                },
                penutup: {
                  type: Type.OBJECT,
                  properties: {
                    durasi: { type: Type.STRING },
                    kegiatan: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
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
                    tugasAktivitas: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                          kunciJawaban: { type: Type.INTEGER },
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
                      required: ['deskripsiVisual', 'promptGambar']
                    }
                  },
                  required: ['soalKuis', 'materiInteraktif', 'gambarInteraktif']
                }
              },
              required: ['teknikAssesmen', 'rubrikAssesmenSikapCinta', 'instrumenPenilaian', 'lkpd', 'mediaDigital']
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Hasil respon AI kosong.');
    }

    let cleanJson = resultText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
    }

    let generatedData: any = {};
    try {
      generatedData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('JSON parse error from Gemini output:', parseErr, cleanJson);
      throw new Error('Respon AI tidak berformat JSON yang valid. Silakan coba generate kembali.');
    }

    if (generatedData?.identifikasi?.materiPelajaran && typeof generatedData.identifikasi.materiPelajaran === 'string') {
      generatedData.identifikasi.materiPelajaran = generatedData.identifikasi.materiPelajaran.replace(/\*\*/g, '').replace(/__/g, '');
    }
    return res.json({
      success: true,
      modul: generatedData
    });
  } catch (error: any) {
    console.error('Error generating modul:', error);
    return res.status(500).json({
      error: error.message || 'Gagal memproses pembuatan modul ajar berbasis AI.'
    });
  }
});

app.post('/api/generate-materi-uraian', async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) {
      return res.status(400).json({
        error: 'API Key Gemini belum dikonfigurasi. Silakan masukkan API Key di Pengaturan.'
      });
    }

    const {
      mataPelajaran = 'Akidah Akhlak',
      faseKelas = 'Fase B (Kelas III MI)',
      judulMateri = 'Meneladani Sifat Ar-Rahman dalam Kasih Sayang',
      topikPancaCinta = []
    } = req.body;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const promptText = `Anda adalah pakar ahli kurikulum Madrasah Ibtidaiyah (MI) Kementerian Agama RI dan Kurikulum Berbasis Cinta (KBC).
Buatkan URAIAN MATERI PELAJARAN yang SANGAT RUNTUT, LENGKAP, TERSTRUKTUR, SANGAT DETAIL, DAN KOMPREHENSIF untuk:
- Mata Pelajaran: ${mataPelajaran}
- Fase / Kelas Target: ${faseKelas}
- Judul / Pokok Bahasan Utama: ${judulMateri}
- Fokus Integrasi Panca Cinta: ${Array.isArray(topikPancaCinta) && topikPancaCinta.length > 0 ? topikPancaCinta.join(', ') : 'Disesuaikan dengan konteks kasih sayang & akhlak terpuji'}

Petunjuk Struktur Wajib (Gunakan teks biasa TANPA simbol markdown asteriks ** atau *):
1. Gunakan penomoran poin 1 sampai 6 dengan judul sub-materi jelas dan uraian penjelasan rinci. Jangan gunakan simbol ** atau * untuk cetak tebal.
2. Wajib mencakup 6 sub-bahasan utama berikut secara komprehensif:
   - Poin 1: Pengertian, Etimologi, & Konsep Utama (Penjelasan rinci konsep dasar, etimologi istilah, dan pemahaman awal yang utuh).
   - Poin 2: Landasan Syariat & Dalil Al-Qur'an / Hadis atau Keilmuan Relevan (Teks Latin/terjemahan, landasan hukum/syariat, serta pesan moral spiritual utama).
   - Poin 3: Ketentuan, Syarat, Rukun, & Komponen Pokok (Syarat sah/wajib, kriteria teknis, atau elemen-elemen penting yang wajib dipahami cermat).
   - Poin 4: Tata Cara, Urutan Langkah, & Adab Pembiasaan (Tahapan pelaksanaan runtut dari awal sampai akhir, keutamaan, serta adab-adab kebaikan terpuji).
   - Poin 5: Integrasi Nilai Panca Cinta KBC & Hikmah (Kaitan materi dengan Panca Cinta KBC, hikmah emosional, kehangatan hubungan, dan kepedulian sosial).
   - Poin 6: Penerapan Praktis & Pembiasaan Akhlak Sehari-hari (Contoh-contoh konkret aksi nyata dan pembiasaan positif di sekolah, rumah, dan masyarakat).
3. Bahasa disesuaikan dengan tingkat perkembangan emosional & kognitif murid ${faseKelas}, namun tetap kaya materi akademik & spiritual.

Kembalikan respon JSON persis dengan format berikut (tanpa simbol **):
{
  "uraianMateri": "1. Pengertian, Etimologi, & Konsep Utama: ...\n\n2. Landasan Syariat & Dalil: ...\n\n3. Ketentuan, Syarat, & Rukun: ...\n\n4. Tata Cara & Adab Pembiasaan: ...\n\n5. Integrasi Panca Cinta & Hikmah: ...\n\n6. Penerapan Praktis Sehari-hari: ...",
  "capaianPembelajaranDefault": "Peserta didik mampu memahami..."
}`;

    const response = await generateContentWithRetry(ai, {
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            uraianMateri: { type: Type.STRING },
            capaianPembelajaranDefault: { type: Type.STRING }
          },
          required: ['uraianMateri']
        }
      }
    });

    if (!response.text) {
      throw new Error('Tidak ada respon dari Gemini AI.');
    }

    const result = JSON.parse(response.text);
    const cleanedUraian = (result.uraianMateri || '').replace(/\*\*/g, '').replace(/__/g, '');
    const cleanedCp = (result.capaianPembelajaranDefault || '').replace(/\*\*/g, '').replace(/__/g, '');
    return res.json({
      success: true,
      uraianMateri: cleanedUraian,
      capaianPembelajaranDefault: cleanedCp
    });

  } catch (error: any) {
    console.error('Error generating materi uraian:', error);
    return res.status(500).json({
      error: error.message || 'Gagal membuat uraian materi AI.'
    });
  }
});

app.post('/api/generate-quiz-media', async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    if (!apiKey) {
      return res.status(400).json({
        error: 'API Key Gemini belum dikonfigurasi. Masukkan API Key di menu Pengaturan.'
      });
    }

    const {
      mataPelajaran = 'Akidah Akhlak',
      materi = 'Meneladani Sifat Ar-Rahman dalam Kasih Sayang',
      faseKelas = 'Fase B (Kelas III MI)',
      jumlahSoal = 25
    } = req.body;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const promptText = `Anda adalah Pakar Pengembang Media Digital KBC Madrasah Ibtidaiyah (MI) Kementerian Agama RI.
Buatkan Media Digital KBC lengkap (Kuis Interaktif, Flashcard, Ringkasan, Deskripsi Visual, Hotspot) khusus untuk:
- Mata Pelajaran: ${mataPelajaran}
- Topik/Materi: ${materi}
- Fase/Kelas: ${faseKelas}

Wajib buatkan:
1. Soal Kuis Digital: Wajib buatkan sebanyak ${jumlahSoal} nomor soal pilihan ganda interaktif beserta pilihan (A, B, C, D), kunci jawaban (index 0-3), dan pembahasan KBC yang mendalam, variatif, edukatif, dan sangat relevan dengan ${materi}.
2. Materi Interaktif: Ringkasan ringkas, minimal 4 poin penting, minimal 4 flashcard interaktif (depan & belakang).
3. Gambar Interaktif: Deskripsi visual detail, prompt gambar bahasa Inggris untuk ilustrasi pembelajaran, dan minimal 3 hotspot interaktif (koordinat x, y 10-90, judul, penjelasan).

Sajikan dalam JSON rapi tanpa markdown:`;

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
                  kunciJawaban: { type: Type.INTEGER },
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

    // Try to auto-generate image as well
    let imageUrl: string | undefined = undefined;
    const promptImg = generatedMedia.gambarInteraktif?.promptGambar || `Illustration for Islamic primary school lesson ${materi}`;
    try {
      const imgAi = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
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
      console.log('Quiz media image using educational illustration fallback provider.');
    }

    if (!imageUrl) {
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptImg + ', Islamic primary school vector educational illustration, child friendly')}&width=800&height=600&nologo=true&seed=${Date.now()}`;
    }

    if (generatedMedia.gambarInteraktif) {
      generatedMedia.gambarInteraktif.imageUrl = imageUrl;
    }

    return res.json({
      success: true,
      mediaDigital: generatedMedia
    });

  } catch (error: any) {
    console.error('Error generating quiz media:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghasilkan media digital KBC.'
    });
  }
});

app.post('/api/generate-image', async (req, res) => {
  const { prompt = 'A warm Islamic elementary school educational illustration for Modul Ajar KBC' } = req.body;
  const apiKey = getApiKey(req);

  let imageUrl: string | null = null;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              text: prompt + ', clean vector style, bright educational colors, child-friendly, high resolution.'
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: '4:3'
          }
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
    } catch (error: any) {
      console.log('Switching to educational image fallback provider due to image API availability/quota.');
    }
  }

  if (!imageUrl) {
    // Fallback to high-quality educational image generator so an image is ALWAYS displayed
    const cleanPrompt = String(prompt).replace(/[^\w\s]/gi, ' ').trim();
    imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt + ', Islamic primary school vector educational illustration, child friendly')}&width=800&height=600&nologo=true&seed=${Date.now()}`;
  }

  return res.json({ success: true, imageUrl });
});

// ==================== MAPEL OG CONFIGS & DYNAMIC IMAGE ENDPOINTS ====================

const mapelOgDataDir = path.join(process.cwd(), 'public', 'data');
if (!fs.existsSync(mapelOgDataDir)) {
  try { fs.mkdirSync(mapelOgDataDir, { recursive: true }); } catch (e) {}
}

// Serve uploaded data files statically with CORS & cache headers
app.use('/data', express.static(mapelOgDataDir, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

const mapelOgConfigFile = path.join(mapelOgDataDir, 'mapel_og_configs.json');

function readMapelOgConfigs(): Record<string, { title?: string; desc?: string; imageUrl?: string; updatedAt?: string }> {
  try {
    if (fs.existsSync(mapelOgConfigFile)) {
      const content = fs.readFileSync(mapelOgConfigFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading mapel_og_configs.json:', e);
  }
  return {};
}

function findMapelOgConfig(
  configs: Record<string, any>,
  rawMapel: string,
  queryMapel: string,
  mapelKey: string
): { title?: string; desc?: string; imageUrl?: string; updatedAt?: string } | null {
  if (!configs || typeof configs !== 'object') return null;

  let extracted = '';
  if (rawMapel && /auto-modul-(.+?)(?:-[0-9]{10,})?$/i.test(rawMapel)) {
    const m = rawMapel.match(/auto-modul-(.+?)(?:-[0-9]{10,})?$/i);
    if (m) extracted = m[1];
  }

  const candidates = Array.from(new Set([
    mapelKey,
    queryMapel,
    rawMapel,
    extracted,
    sanitizeMapelKey(extracted),
    rawMapel.replace(/[_-]/g, ' '),
    extracted.replace(/[_-]/g, ' '),
    rawMapel.toLowerCase().trim(),
    queryMapel.toLowerCase().trim()
  ].filter(Boolean)));

  // 1. Direct exact key match
  for (const cand of candidates) {
    if (configs[cand] && (configs[cand].imageUrl || configs[cand].title)) return configs[cand];
  }

  // 2. Normalized key match
  for (const [k, v] of Object.entries(configs)) {
    const ck = sanitizeMapelKey(k);
    for (const cand of candidates) {
      const candCk = sanitizeMapelKey(cand);
      if (ck && candCk && ck === candCk) {
        return v;
      }
      if (k.toLowerCase().trim() === cand.toLowerCase().trim()) {
        return v;
      }
    }
  }

  return null;
}

function saveMapelOgConfigs(data: Record<string, any>) {
  try {
    if (!fs.existsSync(mapelOgDataDir)) {
      fs.mkdirSync(mapelOgDataDir, { recursive: true });
    }
    fs.writeFileSync(mapelOgConfigFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing mapel_og_configs.json:', e);
  }
}

function sanitizeMapelKey(mapel: string): string {
  if (!mapel) return '';
  let str = String(mapel).trim();
  if (['default', 'app', 'main', 'all', 'none', 'general'].includes(str.toLowerCase())) return '';

  // 1. Unescape HTML entities
  str = str
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

  // 2. Safely decode URI components
  try { str = decodeURIComponent(str); } catch {}
  try { str = decodeURIComponent(str.replace(/\+/g, ' ')); } catch {}

  // 3. Lowercase and replace non-alphanumeric with underscore
  let key = str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  if (!key || ['default', 'app', 'main', 'all', 'none', 'general'].includes(key)) return '';

  // 4. Canonicalize subject key aliases with exact dictionary
  const aliases: Record<string, string> = {
    quran_hadis: 'al_qur_an_hadis',
    quran: 'al_qur_an_hadis',
    hadis: 'al_qur_an_hadis',
    hadits: 'al_qur_an_hadis',
    al_quran_hadis: 'al_qur_an_hadis',
    al_qur_an_hadis: 'al_qur_an_hadis',

    akidah: 'akidah_akhlak',
    akhlak: 'akidah_akhlak',
    aqidah: 'akidah_akhlak',
    aqidah_akhlak: 'akidah_akhlak',
    akidah_akhlak: 'akidah_akhlak',

    fikih: 'fiqih',
    fiqih: 'fiqih',

    ski: 'sejarah_kebudayaan_islam_ski',
    sejarah_kebudayaan_islam: 'sejarah_kebudayaan_islam_ski',
    sejarah_kebudayaan_islam_ski: 'sejarah_kebudayaan_islam_ski',

    arab: 'bahasa_arab',
    bahasa_arab: 'bahasa_arab',

    pancasila: 'pendidikan_pancasila',
    ppkn: 'pendidikan_pancasila',
    pkn: 'pendidikan_pancasila',
    pendidikan_pancasila: 'pendidikan_pancasila',

    indonesia: 'bahasa_indonesia',
    bahasa_indonesia: 'bahasa_indonesia',

    mtk: 'matematika',
    math: 'matematika',
    matematika: 'matematika',

    ipa: 'ipas',
    ips: 'ipas',
    ipas: 'ipas',
    ipas_ipa_ips: 'ipas',
    sains: 'ipas',

    inggris: 'bahasa_inggris',
    english: 'bahasa_inggris',
    bahasa_inggris: 'bahasa_inggris',

    jawa: 'bahasa_jawa',
    bahasa_jawa: 'bahasa_jawa',

    penjas: 'pjok',
    penjaskes: 'pjok',
    olahraga: 'pjok',
    jasmani: 'pjok',
    pjok: 'pjok',

    seni: 'seni_budaya',
    prakarya: 'seni_budaya',
    sbk: 'seni_budaya',
    sbdp: 'seni_budaya',
    seni_budaya: 'seni_budaya',

    p5: 'p5_ppra',
    ppra: 'p5_ppra',
    proyek: 'p5_ppra',
    p5_ppra: 'p5_ppra',

    pai: 'pendidikan_agama_islam',
    pendidikan_agama_islam: 'pendidikan_agama_islam'
  };

  if (aliases[key]) {
    return aliases[key];
  }

  return key;
}

// Mapel OG Configs & Custom Image Server Endpoints

app.get('/api/mapel-og-configs', (_req, res) => {
  const configs = readMapelOgConfigs();
  return res.json({ success: true, configs });
});

app.post('/api/mapel-og-configs', (req, res) => {
  const { mapel, mapelKey: rawKey, title, desc, imageUrl } = req.body || {};
  if (!mapel && !rawKey) {
    return res.status(400).json({ success: false, message: 'Mapel required' });
  }

  const mapelKey = rawKey || sanitizeMapelKey(mapel);
  const configs = readMapelOgConfigs();
  let finalImageUrl = imageUrl || '';

  if (imageUrl && imageUrl.startsWith('data:image/')) {
    const matches = imageUrl.match(/^data:image\/([^;]+);base64,(.+)$/s);
    if (matches) {
      const mime = matches[1].toLowerCase();
      let ext = 'jpg';
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';

      const base64Data = matches[2].replace(/\s+/g, '');
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length > 0) {
        ['jpg', 'png', 'jpeg', 'webp'].forEach(oldExt => {
          const oldFile = path.join(mapelOgDataDir, `og_mapel_${mapelKey}.${oldExt}`);
          if (fs.existsSync(oldFile)) {
            try { fs.unlinkSync(oldFile); } catch (e) {}
          }
        });

        const fileName = `og_mapel_${mapelKey}.${ext}`;
        const filePath = path.join(mapelOgDataDir, fileName);
        try {
          fs.writeFileSync(filePath, buffer);
          const stat = fs.statSync(filePath);
          finalImageUrl = `/data/${fileName}?v=${Math.floor(stat.mtimeMs)}`;
        } catch (e) {
          console.error('Error writing mapel og image file:', e);
        }
      }
    }
  }

  const nowIso = new Date().toISOString();
  const configObj = {
    title: title || `Kuis & Media Interaktif ${mapel}`,
    desc: desc || `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) ${mapel}`,
    imageUrl: finalImageUrl,
    updatedAt: nowIso
  };

  configs[mapelKey] = configObj;
  if (mapel && mapel !== mapelKey) {
    configs[mapel] = configObj;
  }

  saveMapelOgConfigs(configs);

  return res.json({
    success: true,
    message: `Thumbnail & konfigurasi mapel "${mapel || mapelKey}" berhasil disimpan & terekam!`,
    config: configObj
  });
});

app.post(['/api/custom-og-image', '/api/custom-og'], (req, res) => {
  const { imageData, action } = req.body || {};

  if (action === 'reset' || (!imageData && action !== 'save')) {
    customOgImageBuffer = null;
    const pathsToClean = [
      path.join(process.cwd(), 'public', 'custom-og-image.jpg'),
      path.join(process.cwd(), 'public', 'custom-og-image.png'),
      path.join(process.cwd(), 'public', 'custom-og-image.webp'),
      path.join(mapelOgDataDir, 'custom-og-image.jpg')
    ];
    pathsToClean.forEach(p => {
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (e) {}
      }
    });

    const defaultBackup = path.join(process.cwd(), 'public', 'og-image-round-default.jpg');
    const defaultRound = path.join(process.cwd(), 'public', 'og-image-round.jpg');
    if (fs.existsSync(defaultBackup)) {
      try { fs.copyFileSync(defaultBackup, defaultRound); } catch (e) {}
    }

    return res.json({ success: true, message: 'Gambar custom OG berhasil dikembalikan ke default' });
  }

  if (imageData) {
    const matches = imageData.match(/^data:image\/([^;]+);base64,(.+)$/s);
    const base64Str = matches ? matches[2] : imageData;
    const buffer = Buffer.from(base64Str.replace(/\s+/g, ''), 'base64');

    if (buffer.length > 0) {
      customOgImageBuffer = buffer;
      const customJpgPublic = path.join(process.cwd(), 'public', 'custom-og-image.jpg');
      const customJpgData = path.join(mapelOgDataDir, 'custom-og-image.jpg');
      const roundJpgPublic = path.join(process.cwd(), 'public', 'og-image-round.jpg');
      const defaultBackup = path.join(process.cwd(), 'public', 'og-image-round-default.jpg');

      if (!fs.existsSync(defaultBackup) && fs.existsSync(roundJpgPublic)) {
        try { fs.copyFileSync(roundJpgPublic, defaultBackup); } catch (e) {}
      }

      try {
        fs.writeFileSync(customJpgPublic, buffer);
        fs.writeFileSync(customJpgData, buffer);
        fs.writeFileSync(roundJpgPublic, buffer);
      } catch (e) {
        console.error('Error saving custom og image:', e);
      }

      return res.json({
        success: true,
        message: 'Gambar Favicon & OG Custom berhasil disimpan & terekam di server!'
      });
    }
  }

  return res.status(400).json({ success: false, message: 'Data gambar tidak valid' });
});

// Serve direct mapel OG image
app.get('/api/mapel-og-image/:mapelKey', (req, res) => {
  const mapelKey = req.params.mapelKey;
  for (const ext of ['jpg', 'png', 'jpeg', 'webp']) {
    const filePath = path.join(mapelOgDataDir, `og_mapel_${mapelKey}.${ext}`);
    if (fs.existsSync(filePath)) {
      const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : `image/${ext}`;
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(filePath);
    }
  }

  const configs = readMapelOgConfigs();
  const cfg = configs[mapelKey];
  if (cfg && cfg.imageUrl && cfg.imageUrl.startsWith('data:image/')) {
    const matches = cfg.imageUrl.match(/^data:image\/([^;]+);base64,(.+)$/s);
    if (matches) {
      const mime = matches[1];
      const buffer = Buffer.from(matches[2].replace(/\s+/g, ''), 'base64');
      res.setHeader('Content-Type', mime || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    }
  }

  const roundPath = path.join(process.cwd(), 'public', 'og-image-round.jpg');
  if (fs.existsSync(roundPath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    return res.sendFile(roundPath);
  }

  return res.status(404).send('Image not found');
});

// Dynamic OpenGraph SVG Banner Generator Endpoint (1200x630px)
app.get('/api/og-image', (req, res) => {
  const mapel = String(req.query.mapel || 'Modul Ajar KBC');
  const materi = String(req.query.materi || 'Kurikulum Berbasis Cinta');
  const title = String(req.query.title || `Kuis & Media Interaktif ${mapel}`);

  // Subject theme colors
  const mapelLower = mapel.toLowerCase();
  let bg1 = '#065f46'; // Emerald 800
  let bg2 = '#042f2e'; // Teal 950
  let accent = '#f59e0b'; // Amber 500

  if (mapelLower.includes('qur') || mapelLower.includes('akidah')) {
    bg1 = '#047857'; bg2 = '#022c22'; accent = '#fbbf24';
  } else if (mapelLower.includes('fiqih') || mapelLower.includes('fikih')) {
    bg1 = '#0369a1'; bg2 = '#082f49'; accent = '#38bdf8';
  } else if (mapelLower.includes('ski') || mapelLower.includes('sejarah')) {
    bg1 = '#b45309'; bg2 = '#451a03'; accent = '#fcd34d';
  } else if (mapelLower.includes('arab') || mapelLower.includes('bahasa')) {
    bg1 = '#6b21a8'; bg2 = '#3b0764'; accent = '#f472b6';
  } else if (mapelLower.includes('ipas') || mapelLower.includes('sains')) {
    bg1 = '#0d9488'; bg2 = '#115e59'; accent = '#2dd4bf';
  } else if (mapelLower.includes('matematika')) {
    bg1 = '#1d4ed8'; bg2 = '#1e3a8a'; accent = '#60a5fa';
  }

  const safeMapel = mapel.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeMateri = materi.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fef3c7" />
        <stop offset="50%" stop-color="${accent}" />
        <stop offset="100%" stop-color="#f59e0b" />
      </linearGradient>
    </defs>

    <rect width="1200" height="630" fill="url(#bg)" />

    <!-- Geometric Motif Accents -->
    <circle cx="1100" cy="80" r="320" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="3" />
    <circle cx="1100" cy="80" r="220" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2" />
    <circle cx="100" cy="550" r="280" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="2" />

    <!-- Gold Accent Line Header -->
    <rect x="80" y="80" width="120" height="8" rx="4" fill="url(#goldGrad)" />

    <!-- Subject Badge -->
    <rect x="80" y="110" width="340" height="42" rx="21" fill="#ffffff" fill-opacity="0.15" stroke="${accent}" stroke-width="1.5" />
    <text x="100" y="137" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="18" fill="#ffffff" letter-spacing="1">
      📖 MATA PELAJARAN: ${safeMapel.toUpperCase()}
    </text>

    <!-- Main Title -->
    <text x="80" y="230" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff">
      <tspan x="80" dy="0">${safeTitle.substring(0, 45)}</tspan>
      ${safeTitle.length > 45 ? `<tspan x="80" dy="54">${safeTitle.substring(45, 90)}...</tspan>` : ''}
    </text>

    <!-- Materi Subtitle Box -->
    <rect x="80" y="350" width="1040" height="110" rx="20" fill="#000000" fill-opacity="0.25" stroke="#ffffff" stroke-opacity="0.15" />
    <text x="110" y="395" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="22" fill="${accent}">
      📌 Materi: ${safeMateri}
    </text>
    <text x="110" y="432" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="18" fill="#e2e8f0">
      Kuis Interaktif • Flashcard Pembelajaran • Media Digital Panca Cinta
    </text>

    <!-- Footer Identity Banner -->
    <line x1="80" y1="520" x2="1120" y2="520" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1" />
    <circle cx="110" cy="565" r="22" fill="${accent}" />
    <text x="110" y="572" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#000000" text-anchor="middle">💚</text>
    <text x="150" y="560" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#ffffff">
      Modul Ajar Berbasis Cinta (KBC)
    </text>
    <text x="150" y="583" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="14" fill="#94a3b8">
      Disusun oleh: Jaenal Maskun, S.Pd.I. • MI Ma'arif NU 2 Sanggreman
    </text>
  </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.send(svg);
});

// Catch-all for API endpoints to prevent falling through to index.html SPA routing
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.originalUrl}' tidak ditemukan di server.`
  });
});

async function startServer() {
  const injectOgTags = (htmlContent: string, req: express.Request): string => {
    const host = req.get('host') || 'localhost';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const baseUrl = getBaseUrl(req);
    let fullCurrentUrl = `${baseUrl}${req.originalUrl || '/'}`;
    fullCurrentUrl = fullCurrentUrl.replace(/^(https?):\/+([^\/])/i, '$1://$2');
    if (!isLocal && fullCurrentUrl.startsWith('http://')) {
      fullCurrentUrl = fullCurrentUrl.replace(/^http:\/\//i, 'https://');
    }

    const getParam = (k: string): string => {
      const lowerKey = k.toLowerCase();
      for (const [key, val] of Object.entries(req.query || {})) {
        const cleanKey = String(key || '').replace(/^amp;/i, '').toLowerCase();
        if (cleanKey === lowerKey && val !== undefined && val !== null) {
          let strVal = String(val).trim();
          strVal = strVal
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');
          try { strVal = decodeURIComponent(strVal); } catch {}
          try { strVal = decodeURIComponent(strVal.replace(/\+/g, ' ')); } catch {}
          return strVal.trim();
        }
      }
      return '';
    };

    const queryMapel = getParam('mapel');
    const queryModuleId = getParam('moduleId');
    const queryTitle = getParam('title');
    const queryDesc = getParam('desc');
    const queryMateri = getParam('materi');
    const queryV = getParam('v');

    // Check stored mapel configurations
    const configs = readMapelOgConfigs();
    const rawMapel = queryMapel || queryModuleId;
    const isDefaultAppRequest = !rawMapel || ['default', 'app', 'main', 'all', 'none'].includes(rawMapel.toLowerCase().trim());
    const mapelKey = (!isDefaultAppRequest && rawMapel) ? sanitizeMapelKey(rawMapel) : '';
    const storedCfg = !isDefaultAppRequest ? findMapelOgConfig(configs, rawMapel, queryMapel, mapelKey) : null;

    // Determine Title
    let ogTitle = queryTitle;
    if (!ogTitle) {
      if (storedCfg && storedCfg.title) {
        ogTitle = storedCfg.title;
      } else if (queryMapel) {
        ogTitle = `Kuis & Media Interaktif ${queryMapel} - Modul Ajar KBC`;
      } else {
        ogTitle = "Modul Ajar Berbasis Cinta - MI Ma'arif NU 2 Sanggreman (Jaenal Maskun, S.Pd.I.)";
      }
    }

    // Determine Description
    let ogDesc = queryDesc;
    if (!ogDesc) {
      if (storedCfg && storedCfg.desc) {
        ogDesc = storedCfg.desc;
      } else if (queryMateri) {
        ogDesc = `Materi: ${queryMateri}. Kuis interaktif, flashcard, & media pembelajaran Kurikulum Berbasis Cinta (KBC) MI Ma'arif NU 2 Sanggreman.`;
      } else if (queryMapel) {
        ogDesc = `Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) mata pelajaran ${queryMapel}. Kerjakan kuis interaktif, flashcard, & pelajari media digital.`;
      } else {
        ogDesc = "Aplikasi Penyusun Modul Ajar Kurikulum Berbasis Cinta (KBC) Terintegrasi AI Gemini, Bank Materi, Media Digital & Kuis Interaktif. Disusun oleh Jaenal Maskun, S.Pd.I.";
      }
    }

    // Determine Image URL
    let ogImage = '';
    const urlV = queryV ? (parseInt(queryV, 10) || 0) : 0;

    // 1. FIRST PRIORITY: Stored config imageUrl (User uploaded or configured custom thumbnail for this mapel)
    if (storedCfg && storedCfg.imageUrl) {
      const cfgImg = storedCfg.imageUrl.trim();
      const cfgV = storedCfg.updatedAt ? Date.parse(storedCfg.updatedAt) : Date.now();
      const finalV = Math.max(urlV, cfgV);

      if (cfgImg.startsWith('data:image/')) {
        ogImage = `${baseUrl}/api/mapel-og-image/${mapelKey || 'general'}?v=${finalV}`;
      } else {
        let cleanUrl = cfgImg.replace(/([?&])v=[^&]*(&|$)/i, '$1').replace(/[?&]$/, '');
        const isRelative = cleanUrl.startsWith('/');
        const diskPath = isRelative ? path.join(process.cwd(), 'public', cleanUrl) : '';
        if (!isRelative || fs.existsSync(diskPath)) {
          if (isRelative) {
            cleanUrl = `${baseUrl}${cleanUrl}`;
          } else if (!isLocal && cleanUrl.startsWith('http://')) {
            cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
          }
          const connector = cleanUrl.includes('?') ? '&' : '?';
          ogImage = `${cleanUrl}${connector}v=${finalV}`;
        }
      }
    }

    // 2. SECOND PRIORITY: Physical subject image file uploaded on disk for this subject
    if (!ogImage && mapelKey) {
      for (const ext of ['jpg', 'png', 'jpeg', 'webp']) {
        const filePath = path.join(mapelOgDataDir, `og_mapel_${mapelKey}.${ext}`);
        if (fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          const finalV = Math.max(urlV, Math.floor(stat.mtimeMs));
          ogImage = `${baseUrl}/data/og_mapel_${mapelKey}.${ext}?v=${finalV}`;
          break;
        }
      }
    }

    // 3. THIRD PRIORITY: Subject default preset image if mapelKey is present
    const defaultSubjectImages: Record<string, string> = {
      al_qur_an_hadis: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
      al_quran_hadis: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
      quran_hadis: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
      quran: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
      hadis: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
      hadits: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',

      akidah: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
      akhlak: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
      akidah_akhlak: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
      aqidah: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
      aqidah_akhlak: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',

      fiqih: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',
      fikih: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',

      sejarah_kebudayaan_islam_ski: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',
      sejarah_kebudayaan_islam__ski_: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',
      ski: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',
      sejarah: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',

      bahasa_arab: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=630&fit=crop',
      arab: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=630&fit=crop',

      pendidikan_agama_islam: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',
      pendidikan_agama_islam_pai: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',
      pai: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',

      ipas_ipa_ips: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',
      ipas__ipa___ips_: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',
      ipas: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',
      ipa: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',
      ips: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',

      matematika: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&h=630&fit=crop',
      mtk: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&h=630&fit=crop',

      bahasa_indonesia: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=630&fit=crop',

      pendidikan_pancasila: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&h=630&fit=crop',
      pancasila: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&h=630&fit=crop',

      pjok: 'https://images.unsplash.com/photo-1517649763962-0c623266ecf0?w=1200&h=630&fit=crop',
      bahasa_inggris: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&h=630&fit=crop',
      inggris: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&h=630&fit=crop',
      bahasa_jawa: 'https://images.unsplash.com/photo-1528164344705-47542687990d?w=1200&h=630&fit=crop',
      jawa: 'https://images.unsplash.com/photo-1528164344705-47542687990d?w=1200&h=630&fit=crop',
      seni_budaya_prakarya: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=630&fit=crop',
      seni_budaya: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=630&fit=crop',
      seni: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=630&fit=crop'
    };

    if (!ogImage && mapelKey && mapelKey !== 'general') {
      ogImage = defaultSubjectImages[mapelKey] || 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop';
    }

    // 4. FOURTH PRIORITY: Global Custom OG image uploaded by user in Settings or system round badge
    if (!ogImage) {
      const customFilePath = path.join(process.cwd(), 'public', 'custom-og-image.jpg');
      const customJpgData = path.join(mapelOgDataDir, 'custom-og-image.jpg');
      const roundFilePath = path.join(process.cwd(), 'public', 'og-image-round.jpg');

      if (customOgImageBuffer || fs.existsSync(customFilePath)) {
        const mtime = fs.existsSync(customFilePath) ? fs.statSync(customFilePath).mtimeMs : Date.now();
        const finalV = Math.max(urlV, Math.floor(mtime));
        ogImage = `${baseUrl}/custom-og-image.jpg?v=${finalV}`;
      } else if (fs.existsSync(customJpgData)) {
        const stat = fs.statSync(customJpgData);
        const finalV = Math.max(urlV, Math.floor(stat.mtimeMs));
        ogImage = `${baseUrl}/data/custom-og-image.jpg?v=${finalV}`;
      } else if (fs.existsSync(roundFilePath)) {
        const stat = fs.statSync(roundFilePath);
        const finalV = Math.max(urlV, Math.floor(stat.mtimeMs));
        ogImage = `${baseUrl}/og-image-round.jpg?v=${finalV}`;
      } else {
        ogImage = `${baseUrl}/og-image-round.jpg?v=${Date.now()}`;
      }
    }

    let faviconUrl = '';
    const customFilePath = path.join(process.cwd(), 'public', 'custom-og-image.jpg');
    const customJpgData = path.join(mapelOgDataDir, 'custom-og-image.jpg');

    if (customOgImageBuffer || fs.existsSync(customFilePath)) {
      const mtime = fs.existsSync(customFilePath) ? fs.statSync(customFilePath).mtimeMs : Date.now();
      const finalV = Math.max(urlV, Math.floor(mtime));
      faviconUrl = `${baseUrl}/custom-og-image.jpg?v=${finalV}`;
    } else if (fs.existsSync(customJpgData)) {
      const stat = fs.statSync(customJpgData);
      const finalV = Math.max(urlV, Math.floor(stat.mtimeMs));
      faviconUrl = `${baseUrl}/data/custom-og-image.jpg?v=${finalV}`;
    } else {
      const defaultRound = path.join(process.cwd(), 'public', 'og-image-round.jpg');
      const mtime = fs.existsSync(defaultRound) ? fs.statSync(defaultRound).mtimeMs : Date.now();
      const finalV = Math.max(urlV, Math.floor(mtime));
      faviconUrl = `${baseUrl}/og-image-round.jpg?v=${finalV}`;
    }

    if (!isLocal && ogImage.startsWith('http://')) {
      ogImage = ogImage.replace(/^http:\/\//i, 'https://');
    }
    if (!isLocal && faviconUrl.startsWith('http://')) {
      faviconUrl = faviconUrl.replace(/^http:\/\//i, 'https://');
    }

    const sanitizeUrl = (rawUrl: string): string => {
      let cleaned = String(rawUrl || '').trim();
      cleaned = cleaned.replace(/^(https?):\/+([^\/])/i, '$1://$2');
      if (!/^https?:\/\//i.test(cleaned)) {
        cleaned = `https://${cleaned.replace(/^[:\/]+/, '')}`;
      }
      try {
        const u = new URL(cleaned);
        if (u.searchParams.has('mapel')) {
          const rawMapel = u.searchParams.get('mapel') || '';
          if (rawMapel) {
            u.searchParams.set('mapel', sanitizeMapelKey(rawMapel));
          }
        }
        let search = u.search;
        search = search.replace(/'/g, '%27')
                      .replace(/\(/g, '%28')
                      .replace(/\)/g, '%29')
                      .replace(/!/g, '%21')
                      .replace(/\*/g, '%2A');
        u.search = search;
        return u.toString();
      } catch {
        return encodeURI(cleaned)
          .replace(/'/g, '%27')
          .replace(/\(/g, '%28')
          .replace(/\)/g, '%29')
          .replace(/!/g, '%21')
          .replace(/\*/g, '%2A');
      }
    };

    const escapeAttr = (str: string): string => {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const escapeUrlAttr = (str: string): string => {
      let url = String(str || '').replace(/&amp;/g, '&');
      return url
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const safeOgTitle = escapeAttr(ogTitle);
    const safeOgDesc = escapeAttr(ogDesc);
    const absOgImageUrl = escapeUrlAttr(sanitizeUrl(ogImage));
    const absFaviconUrl = escapeUrlAttr(sanitizeUrl(faviconUrl));
    const cleanFullUrl = escapeUrlAttr(sanitizeUrl(fullCurrentUrl));

    let processed = htmlContent;

    // Determine image mime type
    let imgType = 'image/jpeg';
    if (absOgImageUrl.toLowerCase().includes('.png')) {
      imgType = 'image/png';
    } else if (absOgImageUrl.toLowerCase().includes('.webp')) {
      imgType = 'image/webp';
    }

    let faviconType = 'image/jpeg';
    if (absFaviconUrl.toLowerCase().includes('.png')) {
      faviconType = 'image/png';
    } else if (absFaviconUrl.toLowerCase().includes('.webp')) {
      faviconType = 'image/webp';
    }

    const replaceOrInjectMeta = (
      attrName: 'property' | 'name',
      attrVal: string,
      contentVal: string
    ) => {
      const escapedVal = attrVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`<meta\\s+[^>]*${attrName}=["']${escapedVal}["'][^>]*\\/?>`, 'i');
      if (regex.test(processed)) {
        processed = processed.replace(new RegExp(`<meta\\s+[^>]*${attrName}=["']${escapedVal}["'][^>]*\\/?>`, 'gi'), `<meta ${attrName}="${attrVal}" content="${contentVal}" />`);
      } else if (processed.includes('</head>')) {
        processed = processed.replace('</head>', `  <meta ${attrName}="${attrVal}" content="${contentVal}" />\n</head>`);
      }
    };

    // 1. Title replacement
    processed = processed.replace(/<title>.*?<\/title>/gi, `<title>${safeOgTitle}</title>`);
    replaceOrInjectMeta('property', 'og:title', safeOgTitle);
    replaceOrInjectMeta('name', 'twitter:title', safeOgTitle);

    // 2. Description replacement
    replaceOrInjectMeta('name', 'description', safeOgDesc);
    replaceOrInjectMeta('property', 'og:description', safeOgDesc);
    replaceOrInjectMeta('name', 'twitter:description', safeOgDesc);

    // 3. Image URLs & Card replacement
    replaceOrInjectMeta('property', 'og:type', 'website');
    replaceOrInjectMeta('property', 'og:image', absOgImageUrl);
    replaceOrInjectMeta('property', 'og:image:url', absOgImageUrl);
    replaceOrInjectMeta('property', 'og:image:secure_url', absOgImageUrl);
    replaceOrInjectMeta('property', 'og:image:type', imgType);
    replaceOrInjectMeta('property', 'og:image:width', '1200');
    replaceOrInjectMeta('property', 'og:image:height', '630');
    replaceOrInjectMeta('name', 'twitter:image', absOgImageUrl);
    replaceOrInjectMeta('name', 'twitter:image:src', absOgImageUrl);
    replaceOrInjectMeta('property', 'og:url', cleanFullUrl);
    replaceOrInjectMeta('name', 'twitter:card', 'summary_large_image');

    // Dynamic favicon & touch icon replacement (Uses square emblem/logo absFaviconUrl)
    processed = processed.replace(/<link\s+rel=["'](?:shortcut\s+)?icon["'][^>]*\/>/gi, `<link rel="icon" type="${faviconType}" href="${absFaviconUrl}" />`);
    processed = processed.replace(/<link\s+rel=["']apple-touch-icon["'][^>]*\/>/gi, `<link rel="apple-touch-icon" href="${absFaviconUrl}" />`);

    if (processed.includes('rel="canonical"') || processed.includes("rel='canonical'")) {
      processed = processed.replace(/<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/gi, `<link rel="canonical" href="${cleanFullUrl}" />`);
    } else if (processed.includes('</head>')) {
      processed = processed.replace('</head>', `  <link rel="canonical" href="${cleanFullUrl}" />\n</head>`);
    }

    return processed;
  };

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    // Middleware to intercept root HTML requests in dev mode to inject absolute OG URLs
    app.use(async (req, res, next) => {
      const isHtmlRoute = req.method === 'GET' &&
        !req.url.startsWith('/api') &&
        !req.url.startsWith('/@') &&
        !req.url.startsWith('/src') &&
        (!req.url.includes('.') || req.url.endsWith('.html'));

      if (isHtmlRoute) {
        try {
          const indexPath = path.join(process.cwd(), 'index.html');
          if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf-8');
            html = await vite.transformIndexHtml(req.url, html);
            html = injectOgTags(html, req);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(html);
          }
        } catch (e) {
          return next(e);
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      const distIndexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(distIndexPath)) {
        let html = fs.readFileSync(distIndexPath, 'utf-8');
        html = injectOgTags(html, req);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
      res.sendFile(distIndexPath);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server MODUL AJAR BERBASIS CINTA berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();
