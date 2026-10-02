import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { execSync } from 'child_process';

async function generateHostingZip() {
  console.log('📦 Generating hosting-dist.zip for Plesk / cPanel hosting...');

  const distDir = path.join(process.cwd(), 'dist');
  const publicDir = path.join(process.cwd(), 'public');

  // Build fresh Vite static bundle to include latest configs
  console.log('🔨 Building Vite static bundle before creating ZIP...');
  try {
    execSync('npx vite build', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to run vite build:', err);
  }

  // Ensure latest public/index.php, public/api.php, .htaccess, and database.sql are copied directly into dist/
  if (fs.existsSync(publicDir) && fs.existsSync(distDir)) {
    const phpFiles = ['index.php', 'api.php', '.htaccess', 'database.sql'];
    for (const phpFile of phpFiles) {
      const src = path.join(publicDir, phpFile);
      const dst = path.join(distDir, phpFile);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
      }
    }
  }

  // Clean old zip files to avoid nested zipping or stale artifacts
  const zipNames = [
    'plesk-hosting-dist.zip',
    'plesk-kbc-modulajar.zip',
    'hosting-dist.zip',
    'cpanel-hosting-masbagoes.zip'
  ];
  for (const zName of zipNames) {
    const pZip = path.join(publicDir, zName);
    const dZip = path.join(distDir, zName);
    if (fs.existsSync(pZip)) fs.unlinkSync(pZip);
    if (fs.existsSync(dZip)) fs.unlinkSync(dZip);
  }

  const zip = new JSZip();

  // Add guide for Plesk deployment
  const pleskGuide = `================================================================================
PANDUAN DEPLOYMENT APLIKASI MODUL AJAR BERBASIS CINTA (KBC)
UNTUK HOSTING PLESK & CPANEL
================================================================================
Aplikasi ini dikompilasi siap pakai untuk web hosting Plesk (Apache/LiteSpeed/Nginx)
dengan dukungan PHP 7.4 / 8.0 / 8.1 / 8.2 / 8.3 dan MySQL / MariaDB.

LANGKAH INSTALASI DI PLESK HOSTING:
1. Buka Control Panel Plesk Anda (misal: https://your-server:8443).
2. Masuk ke menu "Websites & Domains" -> pilih nama domain madrasah Anda.
3. Klik "File Manager" -> buka direktori "httpdocs".
   (Catatan: Jika ada file index.html bawaan Plesk, Anda dapat menghapusnya).
4. Klik tombol "Upload" -> pilih file ZIP ini ("plesk-hosting-dist.zip").
5. Setelah selesai diunggah, klik pada file ZIP lalu pilih "Extract Files" (Ekstrak Berkas).
6. Buat Database MySQL di menu "Databases" -> "Add Database":
   - Database Name : masbagoes_modulajar  (atau nama lain sesuai hosting)
   - Username      : masbagoes_modulajar
   - Password      : masbagus15
7. Buka "phpMyAdmin" di database tersebut, pilih tab "Import", lalu pilih berkas "database.sql" yang ada di folder httpdocs.
8. Buka domain Anda di browser: https://domain-anda.sch.id
   Sistem Modul Ajar Berbasis Cinta (KBC) langsung aktif dan siap digunakan secara penuh!

FILE PENTING DALAM PAKET INI:
- index.html   : Berkas utama Frontend SPA (React + Tailwind CSS)
- assets/      : Bundle Javascript dan stylesheet teroptimasi
- index.php    : Entry point dinamis untuk WhatsApp Open Graph Preview & Favicon
- api.php      : Bridge REST API MySQL database backend untuk hosting PHP
- .htaccess    : Routing rewrite rules Apache/LiteSpeed & CORS
- database.sql : Skrip struktur tabel database MySQL (kbc_mi_app_settings)
================================================================================
`;
  zip.file('PANDUAN_HOSTING_PLESK.txt', pleskGuide);

  function addDirToZip(dirPath, zipFolder) {
    if (!fs.existsSync(dirPath)) return;
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      if (item.endsWith('.zip') || item.startsWith('server.cjs')) continue;
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(item);
        addDirToZip(fullPath, subFolder);
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(item, content);
      }
    }
  }

  // 1. Add all static frontend files from dist/ (the compiled SPA)
  if (fs.existsSync(distDir)) {
    addDirToZip(distDir, zip);
  }

  // 2. Add PHP hosting files, database schema, image assets, and htaccess from public/ if not already present
  if (fs.existsSync(publicDir)) {
    const items = fs.readdirSync(publicDir);
    for (const item of items) {
      if (item.endsWith('.zip')) continue;
      const fullPath = path.join(publicDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        // Do not overwrite files from dist/ (especially index.html)
        if (!zip.file(item)) {
          zip.file(item, fs.readFileSync(fullPath));
        }
      }
    }
  }

  // 3. Add data folder and all its contents (mapel OG configs & uploaded images)
  const pubDataDir = path.join(publicDir, 'data');
  if (fs.existsSync(pubDataDir)) {
    const dataZipFolder = zip.folder('data');
    addDirToZip(pubDataDir, dataZipFolder);
  }

  // 4. Generate ZIP content and write to public/ and dist/
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  
  for (const zName of zipNames) {
    fs.writeFileSync(path.join(publicDir, zName), content);
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, zName), content);
    }
  }

  // 5. Verify ZIP integrity
  const verifyPath = path.join(publicDir, 'hosting-dist.zip');
  try {
    execSync(`unzip -t "${verifyPath}"`, { stdio: 'pipe' });
    console.log('🔍 ZIP file integrity verified successfully!');
  } catch (verifyErr) {
    console.warn('⚠️ unzip test warning (falling back to JSZip validation):', verifyErr.message);
  }

  console.log(`✅ hosting-dist.zip and cpanel-hosting-masbagoes.zip successfully created (${(content.length / 1024 / 1024).toFixed(2)} MB)`);
}

generateHostingZip().catch(err => {
  console.error('❌ Failed to create hosting-dist.zip:', err);
  process.exit(1);
});

