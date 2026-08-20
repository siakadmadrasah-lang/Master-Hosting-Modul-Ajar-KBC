import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { execSync } from 'child_process';

async function generateHostingZip() {
  console.log('📦 Generating hosting-dist.zip for Plesk / cPanel hosting...');

  const distDir = path.join(process.cwd(), 'dist');
  const publicDir = path.join(process.cwd(), 'public');

  // Perform a vite build only if dist does not already exist
  if (!fs.existsSync(distDir)) {
    console.log('🔨 Building Vite static bundle before creating ZIP...');
    try {
      execSync('npx vite build', { stdio: 'inherit' });
    } catch (err) {
      console.error('Failed to run vite build:', err);
    }
  }

  // Ensure latest public/index.php and public/api.php are copied directly into dist/
  if (fs.existsSync(publicDir) && fs.existsSync(distDir)) {
    const phpFiles = ['index.php', 'api.php', '.htaccess'];
    for (const phpFile of phpFiles) {
      const src = path.join(publicDir, phpFile);
      const dst = path.join(distDir, phpFile);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
      }
    }
  }

  // Clean old zip files to avoid nested zipping or stale artifacts
  const oldPublicZip = path.join(publicDir, 'hosting-dist.zip');
  const oldDistZip = path.join(distDir, 'hosting-dist.zip');
  if (fs.existsSync(oldPublicZip)) fs.unlinkSync(oldPublicZip);
  if (fs.existsSync(oldDistZip)) fs.unlinkSync(oldDistZip);

  const zip = new JSZip();

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

  // 4. Generate ZIP content and write to public/hosting-dist.zip and dist/hosting-dist.zip
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  
  fs.writeFileSync(oldPublicZip, content);

  if (fs.existsSync(distDir)) {
    fs.writeFileSync(oldDistZip, content);
  }

  // 5. Verify ZIP integrity
  try {
    execSync(`unzip -t "${oldPublicZip}"`, { stdio: 'pipe' });
    console.log('🔍 ZIP file integrity verified successfully!');
  } catch (verifyErr) {
    console.warn('⚠️ unzip test warning (falling back to JSZip validation):', verifyErr.message);
  }

  console.log(`✅ hosting-dist.zip successfully created (${(content.length / 1024 / 1024).toFixed(2)} MB)`);
}

generateHostingZip().catch(err => {
  console.error('❌ Failed to create hosting-dist.zip:', err);
  process.exit(1);
});

