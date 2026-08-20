<?php
/**
 * API Bridge MySQL untuk Modul Ajar Berbasis Cinta (KBC)
 * File ini siap diunggah ke hosting Plesk / cPanel Anda (di folder httpdocs / public_html).
 */

error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Konfigurasi Database Default untuk Hosting Plesk / cPanel
$host = isset($_REQUEST['host']) && !empty($_REQUEST['host']) ? $_REQUEST['host'] : 'localhost';
$port = isset($_REQUEST['port']) ? intval($_REQUEST['port']) : 3306;
$db_user = isset($_REQUEST['user']) && !empty($_REQUEST['user']) ? $_REQUEST['user'] : 'jaenal_modulajar';
$db_pass = isset($_REQUEST['password']) && $_REQUEST['password'] !== '' ? $_REQUEST['password'] : 'masbagus15';
$db_name = isset($_REQUEST['database']) && !empty($_REQUEST['database']) ? $_REQUEST['database'] : 'jaenal_modulajar';
$table_name = isset($_REQUEST['table_name']) && !empty($_REQUEST['table_name']) ? preg_replace('/[^a-zA-Z0-9_]/', '', $_REQUEST['table_name']) : 'kbc_mi_app_settings';

// Ambil input JSON jika permintaan dikirim lewat POST body
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true) ?: [];

if (!empty($input['config'])) {
    $cfg = $input['config'];
    if (!empty($cfg['host'])) $host = $cfg['host'];
    if (!empty($cfg['port'])) $port = intval($cfg['port']);
    if (!empty($cfg['user'])) $db_user = $cfg['user'];
    if (isset($cfg['password'])) $db_pass = $cfg['password'];
    if (!empty($cfg['database'])) $db_name = $cfg['database'];
    if (!empty($cfg['tableName'])) $table_name = preg_replace('/[^a-zA-Z0-9_]/', '', $cfg['tableName']);
}

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_GET['amp;action']) ? $_GET['amp;action'] : (isset($input['action']) ? $input['action'] : 'test'));

if ((isset($_GET['mapel']) || isset($_GET['amp;mapel'])) && !isset($_GET['action']) && !isset($_GET['amp;action']) && !isset($input['action'])) {
    $action = 'get_mapel_image';
}

// Mapel OG Config File Operations (Works even without active MySQL connection)
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$mapelConfigFile = $dataDir . '/mapel_og_configs.json';

if ($action === 'custom_og_image' || $action === 'custom-og-image' || $action === 'save_custom_og') {
    $imageData = isset($input['imageData']) ? $input['imageData'] : '';
    $subAction = isset($input['action']) ? $input['action'] : '';

    if ($subAction === 'reset' || (empty($imageData) && $subAction !== 'save')) {
        @unlink(__DIR__ . "/custom-og-image.jpg");
        @unlink(__DIR__ . "/custom-og-image.png");
        @unlink(__DIR__ . "/custom-og-image.webp");
        @unlink($dataDir . "/custom-og-image.jpg");

        // Restore original og-image-round.jpg from default backup if exists
        if (file_exists(__DIR__ . "/og-image-round-default.jpg")) {
            @copy(__DIR__ . "/og-image-round-default.jpg", __DIR__ . "/og-image-round.jpg");
        }

        echo json_encode(['success' => true, 'message' => 'Gambar custom OG berhasil dikembalikan ke default']);
        exit();
    }

    if ($imageData) {
        $base64Data = $imageData;
        if (preg_match('/base64,(.+)$/s', $imageData, $matches)) {
            $base64Data = trim($matches[1]);
        }
        $buffer = base64_decode($base64Data);
        if ($buffer && strlen($buffer) > 0) {
            // Backup original og-image-round.jpg if backup doesn't exist yet
            if (!file_exists(__DIR__ . "/og-image-round-default.jpg") && file_exists(__DIR__ . "/og-image-round.jpg")) {
                @copy(__DIR__ . "/og-image-round.jpg", __DIR__ . "/og-image-round-default.jpg");
            }

            $writtenRoot = @file_put_contents(__DIR__ . "/custom-og-image.jpg", $buffer);
            $writtenData = @file_put_contents($dataDir . "/custom-og-image.jpg", $buffer);
            @file_put_contents(__DIR__ . "/og-image-round.jpg", $buffer);

            if ($writtenRoot === false && $writtenData === false) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Gagal menulis berkas custom-og-image.jpg di hosting. Periksa izin folder hosting Anda (chmod 0755 atau 0777).'
                ]);
                exit();
            }

            echo json_encode(['success' => true, 'message' => 'Gambar custom OG berhasil disimpan & diperbarui di hosting']);
            exit();
        } else {
            echo json_encode(['success' => false, 'message' => 'Format data gambar base64 tidak valid atau korup.']);
            exit();
        }
    }

    echo json_encode(['success' => true, 'message' => 'OK']);
    exit();
}

if ($action === 'get_mapel_og') {
    $configs = [];
    if (file_exists($mapelConfigFile)) {
        $json = @file_get_contents($mapelConfigFile);
        if ($json) {
            $configs = json_decode($json, true) ?: [];
        }
    }
    echo json_encode(['success' => true, 'configs' => $configs]);
    exit();
}

function canonicalize_mapel_key_php($mapel) {
    if (!$mapel) return '';
    $str = trim($mapel);
    if (in_array(strtolower($str), ['default', 'app', 'main', 'all', 'none', 'general'])) return '';
    $str = html_entity_decode($str, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $str = urldecode($str);
    $str = urldecode($str);
    $key = strtolower(preg_replace('/[^a-z0-9]/', '_', $str));
    $key = trim(preg_replace('/_+/', '_', $key), '_');
    if (!$key || in_array($key, ['default', 'app', 'main', 'all', 'none', 'general'])) return '';

    $aliases = [
        'quran_hadis' => 'al_qur_an_hadis',
        'quran' => 'al_qur_an_hadis',
        'hadis' => 'al_qur_an_hadis',
        'hadits' => 'al_qur_an_hadis',
        'al_quran_hadis' => 'al_qur_an_hadis',
        'al_qur_an_hadis' => 'al_qur_an_hadis',

        'akidah' => 'akidah_akhlak',
        'akhlak' => 'akidah_akhlak',
        'aqidah' => 'akidah_akhlak',
        'aqidah_akhlak' => 'akidah_akhlak',
        'akidah_akhlak' => 'akidah_akhlak',

        'fikih' => 'fiqih',
        'fiqih' => 'fiqih',

        'ski' => 'sejarah_kebudayaan_islam_ski',
        'sejarah_kebudayaan_islam' => 'sejarah_kebudayaan_islam_ski',
        'sejarah_kebudayaan_islam_ski' => 'sejarah_kebudayaan_islam_ski',

        'arab' => 'bahasa_arab',
        'bahasa_arab' => 'bahasa_arab',

        'pancasila' => 'pendidikan_pancasila',
        'ppkn' => 'pendidikan_pancasila',
        'pkn' => 'pendidikan_pancasila',
        'pendidikan_pancasila' => 'pendidikan_pancasila',

        'indonesia' => 'bahasa_indonesia',
        'bahasa_indonesia' => 'bahasa_indonesia',

        'mtk' => 'matematika',
        'math' => 'matematika',
        'matematika' => 'matematika',

        'ipa' => 'ipas',
        'ips' => 'ipas',
        'ipas' => 'ipas',
        'ipas_ipa_ips' => 'ipas',
        'sains' => 'ipas',

        'inggris' => 'bahasa_inggris',
        'english' => 'bahasa_inggris',
        'bahasa_inggris' => 'bahasa_inggris',
        'b_inggris' => 'bahasa_inggris',

        'jawa' => 'bahasa_jawa',
        'bahasa_jawa' => 'bahasa_jawa',

        'penjas' => 'pjok',
        'penjaskes' => 'pjok',
        'olahraga' => 'pjok',
        'jasmani' => 'pjok',
        'pendidikan_jasmani' => 'pjok',
        'penjasorkes' => 'pjok',
        'pjok' => 'pjok',

        'seni' => 'seni_budaya',
        'prakarya' => 'seni_budaya',
        'sbk' => 'seni_budaya',
        'sbdp' => 'seni_budaya',
        'seni_budaya' => 'seni_budaya',
        'seni_rupa' => 'seni_budaya',
        'seni_musik' => 'seni_budaya',
        'seni_tari' => 'seni_budaya',
        'seni_teater' => 'seni_budaya',

        'p5' => 'p5_ppra',
        'ppra' => 'p5_ppra',
        'proyek' => 'p5_ppra',
        'p5_ppra' => 'p5_ppra',

        'ke_nu_an' => 'ke_nu_an',
        'aswaja' => 'aswaja',

        'pai' => 'pendidikan_agama_islam',
        'pendidikan_agama_islam' => 'pendidikan_agama_islam'
    ];

    if (isset($aliases[$key])) {
        return $aliases[$key];
    }

    return $key;
}

if (!function_exists('find_mapel_og_config')) {
    function find_mapel_og_config($configs, $rawMapel = '', $queryMapel = '', $mapelKey = '') {
        if (empty($configs) || !is_array($configs)) return null;

        $extracted = '';
        if ($rawMapel && preg_match('/auto-modul-(.+?)(?:-[0-9]{10,})?$/i', $rawMapel, $m)) {
            $extracted = $m[1];
        }

        $candidates = array_unique(array_filter([
            $mapelKey,
            $queryMapel,
            $rawMapel,
            $extracted,
            canonicalize_mapel_key_php($extracted),
            str_replace(['_', '-'], ' ', $rawMapel),
            str_replace(['_', '-'], ' ', $extracted),
            trim(strtolower($rawMapel)),
            trim(strtolower($queryMapel))
        ]));

        // 1. Direct exact key match
        foreach ($candidates as $cand) {
            if (isset($configs[$cand]) && !empty($configs[$cand])) return $configs[$cand];
        }

        // 2. Canonicalized key match
        foreach ($configs as $k => $v) {
            $ck = canonicalize_mapel_key_php($k);
            foreach ($candidates as $cand) {
                $candCk = canonicalize_mapel_key_php($cand);
                if ($ck && $candCk && $ck === $candCk) {
                    return $v;
                }
                if (strtolower(trim($k)) === strtolower(trim($cand))) {
                    return $v;
                }
            }
        }

        return null;
    }
}

if ($action === 'get_mapel_image') {
    $mapel = isset($_GET['mapel']) ? trim($_GET['mapel']) : (isset($_GET['amp;mapel']) ? trim($_GET['amp;mapel']) : 'general');
    $mapelKey = canonicalize_mapel_key_php($mapel);

    foreach (['jpg', 'png', 'jpeg', 'webp'] as $ext) {
        $filePath = "{$dataDir}/og_mapel_{$mapelKey}.{$ext}";
        if (file_exists($filePath)) {
            $mime = ($ext === 'jpg' || $ext === 'jpeg') ? 'image/jpeg' : "image/{$ext}";
            header("Content-Type: {$mime}");
            header("Cache-Control: public, max-age=60, s-maxage=60, must-revalidate");
            readfile($filePath);
            exit();
        }
    }

    $configs = [];
    if (file_exists($mapelConfigFile)) {
        $json = @file_get_contents($mapelConfigFile);
        if ($json) $configs = json_decode($json, true) ?: [];
    }

    $cfg = find_mapel_og_config($configs, $mapel, $mapel, $mapelKey);

    if ($cfg && !empty($cfg['imageUrl'])) {
        $url = trim($cfg['imageUrl']);
        if (strpos($url, 'data:image/') === 0) {
            $commaPos = strpos($url, ',');
            if ($commaPos !== false) {
                $headerPart = substr($url, 0, $commaPos);
                $rawBase64 = substr($url, $commaPos + 1);
                $mime = 'image/jpeg';
                if (preg_match('/data:(image\/[a-zA-Z0-9\+\-\.]+);/i', $headerPart, $mMime)) {
                    $mime = $mMime[1];
                }
                header("Content-Type: {$mime}");
                header("Cache-Control: public, max-age=86400, s-maxage=86400, must-revalidate");
                echo base64_decode(preg_replace('/\s+/', '', $rawBase64));
                exit();
            }
        } else if (strpos($url, 'http://') === 0 || strpos($url, 'https://') === 0) {
            $imgData = @file_get_contents($url);
            if ($imgData && strlen($imgData) > 100) {
                header("Content-Type: image/jpeg");
                header("Cache-Control: public, max-age=86400");
                echo $imgData;
                exit();
            } else {
                header("Location: {$url}");
                exit();
            }
        } else if (strpos($url, '/') === 0) {
            $cleanRel = preg_replace('/\?.*$/', '', $url);
            $localRel = __DIR__ . $cleanRel;
            if (file_exists($localRel)) {
                header("Content-Type: " . (strpos($cleanRel, '.png') !== false ? 'image/png' : 'image/jpeg'));
                header("Cache-Control: public, max-age=86400");
                readfile($localRel);
                exit();
            }
        }
    }

    $defaultSubjectImages = [
        'al_qur_an_hadis' => 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
        'al_quran_hadis' => 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
        'quran_hadis' => 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
        'quran' => 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
        'hadis' => 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
        'hadits' => 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',

        'akidah' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'akhlak' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'akidah_akhlak' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'aqidah' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'aqidah_akhlak' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',

        'fiqih' => 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',
        'fikih' => 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',

        'sejarah_kebudayaan_islam_ski' => 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',
        'sejarah_kebudayaan_islam__ski_' => 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',
        'ski' => 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',
        'sejarah' => 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',

        'bahasa_arab' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=630&fit=crop',
        'arab' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=630&fit=crop',

        'pendidikan_agama_islam' => 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',
        'pai' => 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',

        'ke_nu_an' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'ke_nu' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'aswaja' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'nu' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'nahdlatul_ulama' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'kemuhammadiyahan' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',

        'ipas_ipa_ips' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',
        'ipas' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',

        'matematika' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&h=630&fit=crop',
        'mtk' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&h=630&fit=crop',

        'bahasa_indonesia' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=630&fit=crop',

        'pendidikan_pancasila' => 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&h=630&fit=crop',
        'pancasila' => 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&h=630&fit=crop',

        'pjok' => 'https://images.unsplash.com/photo-1517649763962-0c623266ecf0?w=1200&h=630&fit=crop',
        'penjas' => 'https://images.unsplash.com/photo-1517649763962-0c623266ecf0?w=1200&h=630&fit=crop',
        'penjaskes' => 'https://images.unsplash.com/photo-1517649763962-0c623266ecf0?w=1200&h=630&fit=crop',
        'olahraga' => 'https://images.unsplash.com/photo-1517649763962-0c623266ecf0?w=1200&h=630&fit=crop',

        'bahasa_inggris' => 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&h=630&fit=crop',
        'inggris' => 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&h=630&fit=crop',

        'bahasa_jawa' => 'https://images.unsplash.com/photo-1528164344705-47542687990d?w=1200&h=630&fit=crop',
        'jawa' => 'https://images.unsplash.com/photo-1528164344705-47542687990d?w=1200&h=630&fit=crop',

        'seni_budaya' => 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=630&fit=crop',
        'seni' => 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=630&fit=crop',
        'prakarya' => 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=630&fit=crop',

        'p5_ppra' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop',
        'p5' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop'
    ];

    if ($mapelKey && $mapelKey !== 'general') {
        $presetUrl = isset($defaultSubjectImages[$mapelKey]) ? $defaultSubjectImages[$mapelKey] : 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop';
        $imgData = @file_get_contents($presetUrl);
        if ($imgData && strlen($imgData) > 100) {
            header("Content-Type: image/jpeg");
            header("Cache-Control: public, max-age=86400");
            echo $imgData;
            exit();
        } else {
            header("Location: {$presetUrl}");
            exit();
        }
    }

    // Fallback to custom global OG image or round emblem
    $customImg = file_exists(__DIR__ . '/custom-og-image.jpg') ? __DIR__ . '/custom-og-image.jpg' : (file_exists("{$dataDir}/custom-og-image.jpg") ? "{$dataDir}/custom-og-image.jpg" : (file_exists(__DIR__ . '/og-image-round.jpg') ? __DIR__ . '/og-image-round.jpg' : ''));
    if ($customImg) {
        header("Content-Type: image/jpeg");
        header("Cache-Control: public, max-age=60");
        readfile($customImg);
        exit();
    }

    $defaultRound = __DIR__ . '/og-image-round.jpg';
    if (file_exists($defaultRound)) {
        header("Content-Type: image/jpeg");
        header("Cache-Control: public, max-age=86400");
        readfile($defaultRound);
        exit();
    }
}

if ($action === 'save_mapel_og') {
    $mapel = isset($input['mapel']) ? trim($input['mapel']) : '';
    $inputKey = isset($input['mapelKey']) ? trim($input['mapelKey']) : '';
    $mapelKey = canonicalize_mapel_key_php($inputKey ?: $mapel);
    if (!$mapelKey && $mapel) {
        $mapelKey = canonicalize_mapel_key_php($mapel);
    }
    if (!$mapelKey) {
        $mapelKey = strtolower(preg_replace('/[^a-z0-9]/i', '_', $mapel ?: $inputKey));
        $mapelKey = trim(preg_replace('/_+/', '_', $mapelKey), '_');
    }
    if (!$mapelKey) {
        echo json_encode(['success' => false, 'message' => 'Mapel / mapelKey required']);
        exit();
    }

    $configs = [];
    if (file_exists($mapelConfigFile)) {
        $json = @file_get_contents($mapelConfigFile);
        if ($json) {
            $configs = json_decode($json, true) ?: [];
        }
    }

    $imageUrl = isset($input['imageUrl']) ? $input['imageUrl'] : '';
    $finalImageUrl = $imageUrl;

    if ($imageUrl && strpos($imageUrl, 'data:image/') === 0) {
        if (preg_match('/^data:image\/([^;]+);base64,(.+)$/s', $imageUrl, $matches)) {
            $mime = strtolower($matches[1]);
            $ext = 'jpg';
            if (strpos($mime, 'png') !== false) $ext = 'png';
            else if (strpos($mime, 'webp') !== false) $ext = 'webp';
            else if (strpos($mime, 'gif') !== false) $ext = 'gif';
            else if (strpos($mime, 'svg') !== false) $ext = 'svg';

            $base64Data = preg_replace('/\s+/', '', $matches[2]);
            $buffer = base64_decode($base64Data);

            if ($buffer && strlen($buffer) > 0) {
                // Unlink any old subject image files to avoid extension conflicts
                foreach (['jpg', 'png', 'jpeg', 'webp', 'svg', 'gif'] as $oldExt) {
                    $oldFile = "{$dataDir}/og_mapel_{$mapelKey}.{$oldExt}";
                    if (file_exists($oldFile)) {
                        @unlink($oldFile);
                    }
                }

                $fileName = "og_mapel_{$mapelKey}.{$ext}";
                $filePath = "{$dataDir}/{$fileName}";
                @file_put_contents($filePath, $buffer);
                $mtime = file_exists($filePath) ? filemtime($filePath) : time();
                $finalImageUrl = "/data/{$fileName}?v={$mtime}";
            }
        }
    } else if ($finalImageUrl && (strpos($finalImageUrl, 'http://') === 0 || strpos($finalImageUrl, 'https://') === 0)) {
        if (strpos($finalImageUrl, 'http://') === 0) {
            $finalImageUrl = preg_replace('/^http:\/\//i', 'https://', $finalImageUrl);
        }
        // Unlink old physical files on disk so index.php won't use stale physical image
        foreach (['jpg', 'png', 'jpeg', 'webp', 'svg', 'gif'] as $oldExt) {
            $oldFile = "{$dataDir}/og_mapel_{$mapelKey}.{$oldExt}";
            if (file_exists($oldFile)) {
                @unlink($oldFile);
            }
        }
    }

    $newCfg = [
        'title' => (!empty($input['title']) && trim($input['title']) !== '') ? trim($input['title']) : (isset($configs[$mapelKey]['title']) ? $configs[$mapelKey]['title'] : "Kuis & Media Interaktif {$mapel}"),
        'desc' => (!empty($input['desc']) && trim($input['desc']) !== '') ? trim($input['desc']) : (isset($configs[$mapelKey]['desc']) ? $configs[$mapelKey]['desc'] : "Modul Ajar Kurikulum Berbasis Cinta (KBC) {$mapel}"),
        'imageUrl' => $finalImageUrl ? $finalImageUrl : (isset($configs[$mapelKey]['imageUrl']) ? $configs[$mapelKey]['imageUrl'] : ''),
        'updatedAt' => date('c')
    ];

    $configs[$mapelKey] = $newCfg;
    if ($mapel && $mapel !== $mapelKey) {
        $configs[$mapel] = $newCfg;
    }

    $aliasGroups = [
        'ke_nu_an' => ['ke_nu_an', 'ke_nu', 'Ke-NU-an'],
        'aswaja' => ['aswaja', 'Aswaja'],

        'al_qur_an_hadis' => ['quran_hadis', 'al_qur_an_hadis', 'quran', 'hadis', 'hadits', 'al_quran_hadis'],
        'quran_hadis' => ['quran_hadis', 'al_qur_an_hadis', 'quran', 'hadis', 'hadits', 'al_quran_hadis'],

        'akidah_akhlak' => ['akidah_akhlak', 'akidah', 'akhlak', 'aqidah', 'aqidah_akhlak'],
        'akidah' => ['akidah_akhlak', 'akidah', 'akhlak', 'aqidah', 'aqidah_akhlak'],

        'fiqih' => ['fiqih', 'fikih'],
        'fikih' => ['fiqih', 'fikih'],

        'sejarah_kebudayaan_islam_ski' => ['sejarah_kebudayaan_islam_ski', 'ski', 'sejarah', 'sejarah_kebudayaan_islam'],
        'ski' => ['sejarah_kebudayaan_islam_ski', 'ski', 'sejarah', 'sejarah_kebudayaan_islam'],

        'bahasa_arab' => ['bahasa_arab', 'arab'],
        'arab' => ['bahasa_arab', 'arab'],

        'ipas' => ['ipas', 'ipa', 'ips', 'ipas_ipa_ips', 'ipas__ipa___ips_'],
        'matematika' => ['matematika', 'mtk'],
        'pendidikan_pancasila' => ['pendidikan_pancasila', 'pancasila', 'ppkn', 'pkn'],
        'bahasa_indonesia' => ['bahasa_indonesia', 'indonesia'],
        'pjok' => ['pjok', 'penjas', 'penjaskes', 'olahraga', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
        'penjas' => ['pjok', 'penjas', 'penjaskes', 'olahraga', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
        'penjaskes' => ['pjok', 'penjas', 'penjaskes', 'olahraga', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
        'olahraga' => ['pjok', 'penjas', 'penjaskes', 'olahraga', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
        'jasmani' => ['pjok', 'penjas', 'penjaskes', 'olahraga', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
        'pendidikan_jasmani' => ['pjok', 'penjas', 'penjaskes', 'olahraga', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
        'PJOK' => ['pjok', 'penjas', 'penjaskes', 'olahraga', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],
        'Pendidikan Jasmani' => ['pjok', 'penjas', 'penjaskes', 'olahraga', 'jasmani', 'pendidikan_jasmani', 'PJOK', 'Pendidikan Jasmani', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'Penjasorkes'],

        'bahasa_inggris' => ['bahasa_inggris', 'inggris', 'english', 'Bahasa Inggris', 'English', 'b_inggris'],
        'inggris' => ['bahasa_inggris', 'inggris', 'english', 'Bahasa Inggris', 'English', 'b_inggris'],
        'english' => ['bahasa_inggris', 'inggris', 'english', 'Bahasa Inggris', 'English', 'b_inggris'],
        'Bahasa Inggris' => ['bahasa_inggris', 'inggris', 'english', 'Bahasa Inggris', 'English', 'b_inggris'],
        'bahasa_jawa' => ['bahasa_jawa', 'jawa'],

        'seni_budaya' => ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
        'seni' => ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
        'prakarya' => ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
        'sbk' => ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
        'sbdp' => ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
        'Seni Budaya' => ['seni_budaya', 'seni', 'prakarya', 'sbk', 'sbdp', 'Seni Budaya', 'Seni Budaya & Prakarya', 'Seni Budaya dan Prakarya'],
        'p5_ppra' => ['p5_ppra', 'p5', 'ppra', 'proyek']
    ];

    if (isset($aliasGroups[$mapelKey])) {
        foreach ($aliasGroups[$mapelKey] as $alias) {
            $configs[$alias] = $newCfg;
        }
    }

    @file_put_contents($mapelConfigFile, json_encode($configs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    echo json_encode(['success' => true, 'config' => $newCfg]);
    exit();
}

if (empty($db_user) || empty($db_name)) {
    echo json_encode([
        'success' => false,
        'message' => 'Parameter database (user & database) belum diisi.'
    ]);
    exit();
}

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$db_name};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10
    ]);

    // Otomatis buat tabel jika belum ada
    $createTableSql = "CREATE TABLE IF NOT EXISTS `{$table_name}` (
        `madrasah_id` VARCHAR(255) NOT NULL PRIMARY KEY,
        `data` LONGTEXT NOT NULL,
        `updated_at` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($createTableSql);

    if ($action === 'diagnose' || $action === 'select1') {
        $startTime = microtime(true);
        $stmt = $pdo->query('SELECT 1 AS alive, NOW() AS server_time');
        $row = $stmt->fetch();
        $latencyMs = round((microtime(true) - $startTime) * 1000, 2);

        echo json_encode([
            'success' => true,
            'code' => 'SUCCESS',
            'latencyMs' => $latencyMs,
            'queryResult' => $row,
            'title' => 'Diagnosis PHP Bridge Berhasil (SELECT 1 OK)',
            'message' => "Koneksi PDO PHP lokal di hosting '{$host}:{$port}' berjalan sukses!",
            'phpVersion' => PHP_VERSION,
            'database' => $db_name,
            'table' => $table_name
        ]);
        exit();
    }

    if ($action === 'test') {
        echo json_encode([
            'success' => true,
            'message' => "Koneksi PHP & MySQL Hosting Plesk berhasil! Tabel '{$table_name}' siap digunakan."
        ]);
        exit();
    }

    if ($action === 'push') {
        $payloadData = isset($input['data']) ? $input['data'] : [];
        $madrasahId = !empty($payloadData['madrasahId']) ? $payloadData['madrasahId'] : 'default-madrasah';
        $jsonStr = json_encode($payloadData, JSON_UNESCAPED_UNICODE);

        $stmt = $pdo->prepare("INSERT INTO `{$table_name}` (`madrasah_id`, `data`, `updated_at`) 
            VALUES (:madrasah_id, :data, NOW()) 
            ON DUPLICATE KEY UPDATE `data` = VALUES(`data`), `updated_at` = NOW()");
        $stmt->execute([
            ':madrasah_id' => $madrasahId,
            ':data' => $jsonStr
        ]);

        echo json_encode([
            'success' => true,
            'message' => "Data Madrasah ('{$madrasahId}') berhasil diunggah ke database MySQL Hosting!"
        ]);
        exit();
    }

    if ($action === 'pull') {
        $madrasahId = !empty($input['madrasahId']) ? $input['madrasahId'] : (isset($_GET['madrasahId']) ? $_GET['madrasahId'] : 'default-madrasah');
        $stmt = $pdo->prepare("SELECT `data` FROM `{$table_name}` WHERE `madrasah_id` = :madrasah_id LIMIT 1");
        $stmt->execute([':madrasah_id' => $madrasahId]);
        $row = $stmt->fetch();

        if (!$row) {
            echo json_encode([
                'success' => false,
                'message' => "Data tidak ditemukan di database MySQL untuk Madrasah ID: '{$madrasahId}'."
            ]);
            exit();
        }

        $decodedData = json_decode($row['data'], true);
        echo json_encode([
            'success' => true,
            'data' => $decodedData
        ]);
        exit();
    }

    echo json_encode(['success' => false, 'message' => 'Aksi tidak dikenali. Aksi yang tersedia: test, push, pull, diagnose.']);
} catch (Throwable $e) {
    http_response_code(200);
    echo json_encode([
        'success' => false,
        'message' => 'Error MySQL Hosting (PHP Bridge): ' . $e->getMessage()
    ]);
}
