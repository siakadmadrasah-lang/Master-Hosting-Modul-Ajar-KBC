<?php
/**
 * Index Entry Point for Plesk / cPanel Hosting with Dynamic Open Graph Resolution
 * Automatically injects absolute Open Graph URLs so WhatsApp, Facebook, Telegram, and Twitter
 * display the Open Graph badge image (og-image-round.jpg) perfectly when links are shared.
 */

// Determine Protocol & Host Base URL
$rawHost = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost');
$host = preg_replace('/^https?:\/*/', '', $rawHost);
$host = rtrim($host, '/');
if (empty($host)) {
    $host = 'localhost';
}

$isLocal = ($host === 'localhost' || $host === '127.0.0.1' || strpos($host, '192.168.') === 0);

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') 
    || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
    || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
    || (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] === 'on')
    || (isset($_SERVER['HTTP_CF_VISITOR']) && strpos($_SERVER['HTTP_CF_VISITOR'], 'https') !== false);

// FOR PUBLIC DOMAINS, ALWAYS FORCE HTTPS FOR BASEURL AND OG IMAGE
$protocol = (!$isLocal || $isHttps) ? 'https://' : 'http://';

$scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? $_SERVER['PHP_SELF'] ?? ''), '/\\');
if ($scriptDir === '/' || $scriptDir === '\\') {
    $scriptDir = '';
}
$baseUrl = $protocol . $host . $scriptDir;
$requestUri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
if (strpos($requestUri, '/') !== 0) {
    $requestUri = '/' . $requestUri;
}

$indexPath = __DIR__ . '/index.html';

if (file_exists($indexPath)) {
    $html = file_get_contents($indexPath);

    // Helper function to extract query parameters safely supporting both 'key', 'amp;key', and raw REQUEST_URI
    function get_og_query_param($key, $default = '') {
        if (isset($_GET[$key]) && $_GET[$key] !== '') {
            return trim($_GET[$key]);
        }
        $ampKey = 'amp;' . $key;
        if (isset($_GET[$ampKey]) && $_GET[$ampKey] !== '') {
            return trim($_GET[$ampKey]);
        }
        if (isset($_SERVER['REQUEST_URI'])) {
            $uri = $_SERVER['REQUEST_URI'];
            if (preg_match('/[?&](?:amp;)?' . preg_quote($key, '/') . '=([^&]*)/i', $uri, $m)) {
                return trim(urldecode($m[1]));
            }
        }
        return $default;
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

    $queryMapel = get_og_query_param('mapel');
    $queryModuleId = get_og_query_param('moduleId');
    $queryTitle = get_og_query_param('title');
    $queryDesc = get_og_query_param('desc');
    $queryMateri = get_og_query_param('materi');

    $extractedMapel = '';
    if ($queryModuleId && preg_match('/auto-modul-(.+?)(?:-[0-9]{10,})?$/i', $queryModuleId, $mM)) {
        $extractedMapel = $mM[1];
    }

    $rawMapel = !empty($queryMapel) ? $queryMapel : (!empty($extractedMapel) ? $extractedMapel : $queryModuleId);
    $mapelKey = canonicalize_mapel_key_php($rawMapel);

    $mapelDisplayNames = [
        'akidah_akhlak' => 'Akidah Akhlak',
        'akidah' => 'Akidah Akhlak',
        'akhlak' => 'Akidah Akhlak',
        'fiqih' => 'Fiqih',
        'fikih' => 'Fiqih',
        'al_qur_an_hadis' => "Al-Qur'an Hadis",
        'quran_hadis' => "Al-Qur'an Hadis",
        'sejarah_kebudayaan_islam_ski' => 'Sejarah Kebudayaan Islam (SKI)',
        'ski' => 'Sejarah Kebudayaan Islam (SKI)',
        'bahasa_arab' => 'Bahasa Arab',
        'pendidikan_agama_islam' => 'Pendidikan Agama Islam',
        'pai' => 'Pendidikan Agama Islam',
        'ipas_ipa_ips' => 'IPAS (IPA & IPS)',
        'ipas' => 'IPAS (IPA & IPS)',
        'matematika' => 'Matematika',
        'mtk' => 'Matematika',
        'bahasa_indonesia' => 'Bahasa Indonesia',
        'pendidikan_pancasila' => 'Pendidikan Pancasila',
        'pancasila' => 'Pendidikan Pancasila',
        'pjok' => 'PJOK (Pendidikan Jasmani, Olahraga, & Kesehatan)',
        'penjas' => 'PJOK (Pendidikan Jasmani, Olahraga, & Kesehatan)',
        'penjaskes' => 'PJOK (Pendidikan Jasmani, Olahraga, & Kesehatan)',
        'olahraga' => 'PJOK (Pendidikan Jasmani, Olahraga, & Kesehatan)',
        'bahasa_inggris' => 'Bahasa Inggris',
        'inggris' => 'Bahasa Inggris',
        'bahasa_jawa' => 'Bahasa Jawa',
        'jawa' => 'Bahasa Jawa',
        'seni_budaya' => 'Seni Budaya & Prakarya',
        'seni' => 'Seni Budaya & Prakarya',
        'prakarya' => 'Seni Budaya & Prakarya',
        'p5_ppra' => 'Proyek P5 / PPRA',
        'p5' => 'Proyek P5 / PPRA'
    ];

    $queryMapelDisplayName = $queryMapel;
    if ($mapelKey && isset($mapelDisplayNames[$mapelKey])) {
        $queryMapelDisplayName = $mapelDisplayNames[$mapelKey];
    } else if ($rawMapel) {
        $cleanRaw = str_replace(['auto-modul-', '-178', '_'], [' ', '', ' '], $rawMapel);
        $cleanRaw = ucwords(trim(preg_replace('/[0-9]+$/', '', $cleanRaw)));
        if ($cleanRaw) $queryMapelDisplayName = $cleanRaw;
    }

    // Read stored mapel configurations
    $mapelConfigFile = __DIR__ . '/data/mapel_og_configs.json';
    $storedCfg = null;
    if (file_exists($mapelConfigFile)) {
        $json = @file_get_contents($mapelConfigFile);
        if ($json) {
            $configs = json_decode($json, true);
            if (is_array($configs)) {
                $storedCfg = find_mapel_og_config($configs, $rawMapel, $queryMapel, $mapelKey);
            }
        }
    }

    $ogTitle = $queryTitle;
    if (!$ogTitle) {
        if ($storedCfg && !empty($storedCfg['title'])) {
            $ogTitle = $storedCfg['title'];
        } else if ($queryMapelDisplayName) {
            $ogTitle = "Kuis & Media Interaktif {$queryMapelDisplayName} - Modul Ajar KBC";
        } else {
            $ogTitle = "Modul Ajar Berbasis Cinta - MI Ma'arif NU 2 Sanggreman (Jaenal Maskun, S.Pd.I.)";
        }
    }

    $ogDesc = $queryDesc;
    if (!$ogDesc) {
        if ($storedCfg && !empty($storedCfg['desc'])) {
            $ogDesc = $storedCfg['desc'];
        } else if ($queryMateri) {
            $ogDesc = "Materi: {$queryMateri}. Kuis interaktif, flashcard, & media pembelajaran Kurikulum Berbasis Cinta (KBC) MI Ma'arif NU 2 Sanggreman.";
        } else if ($queryMapelDisplayName) {
            $ogDesc = "Aplikasi Modul Ajar Kurikulum Berbasis Cinta (KBC) mata pelajaran {$queryMapelDisplayName}. Kerjakan kuis interaktif, flashcard, & pelajari media digital.";
        } else {
            $ogDesc = "Aplikasi Penyusun Modul Ajar Kurikulum Berbasis Cinta (KBC) Terintegrasi AI Gemini, Bank Materi, Media Digital & Kuis Interaktif. Disusun oleh Jaenal Maskun, S.Pd.I.";
        }
    }

    $defaultSubjectImages = [
        'akidah' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'akhlak' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'akidah_akhlak' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'aqidah' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'aqidah_akhlak' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=630&fit=crop',
        'fiqih' => 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',
        'fikih' => 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',
        'al_qur_an_hadis' => 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
        'quran_hadis' => 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
        'quran' => 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
        'hadis' => 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&h=630&fit=crop',
        'sejarah_kebudayaan_islam_ski' => 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',
        'sejarah_kebudayaan_islam__ski_' => 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',
        'ski' => 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',
        'sejarah' => 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&h=630&fit=crop',
        'bahasa_arab' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=630&fit=crop',
        'arab' => 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=630&fit=crop',
        'pendidikan_agama_islam' => 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',
        'pai' => 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop',
        'ke_nu_an' => '/data/og_mapel_ke_nu_an.jpg',
        'ke_nu' => '/data/og_mapel_ke_nu_an.jpg',
        'aswaja' => '/data/og_mapel_ke_nu_an.jpg',
        'nu' => '/data/og_mapel_ke_nu_an.jpg',
        'nahdlatul_ulama' => '/data/og_mapel_ke_nu_an.jpg',
        'kemuhammadiyahan' => '/data/og_mapel_ke_nu_an.jpg',
        'ipas_ipa_ips' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',
        'ipas__ipa___ips_' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',
        'ipas' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',
        'ipa' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',
        'ips' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=630&fit=crop',
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

    $ogImage = '';
    $dataDir = __DIR__ . '/data';
    $rawUrlV = (int)get_og_query_param('v', 0);
    $urlVMs = ($rawUrlV > 0 && $rawUrlV < 10000000000) ? $rawUrlV * 1000 : $rawUrlV;

    // Check physical image file on disk
    $physicalImgPath = null;
    $physicalMtimeMs = 0;
    if ($mapelKey) {
        foreach (['jpg', 'png', 'jpeg', 'webp'] as $ext) {
            $imgPath = "{$dataDir}/og_mapel_{$mapelKey}.{$ext}";
            if (file_exists($imgPath)) {
                $physicalImgPath = $imgPath;
                $physicalMtimeMs = filemtime($imgPath) * 1000;
                break;
            }
        }
    }

    $cfgVMs = 0;
    if ($storedCfg && !empty($storedCfg['updatedAt'])) {
        $st = strtotime($storedCfg['updatedAt']);
        if ($st > 0) $cfgVMs = $st * 1000;
    }

    // 1. FIRST PRIORITY: Stored custom thumbnail in mapel_og_configs.json (User's custom uploaded thumbnail or URL)
    if ($storedCfg && !empty($storedCfg['imageUrl'])) {
        $cfgImg = trim($storedCfg['imageUrl']);
        $finalV = max($urlVMs, $cfgVMs);
        if ($finalV <= 0) $finalV = time() * 1000;

        if (strpos($cfgImg, 'data:image/') === 0) {
            $ogImage = $baseUrl . "/api.php?action=get_mapel_image&mapel=" . urlencode($mapelKey ? $mapelKey : 'general') . "&v=" . $finalV;
        } else {
            $cleanUrl = preg_replace('/([?&])v=[^&]*(&|$)/i', '$1', $cfgImg);
            $cleanUrl = rtrim($cleanUrl, '?&');
            $isRelative = (strpos($cleanUrl, '/') === 0);
            if (!$isRelative || file_exists(__DIR__ . $cleanUrl)) {
                if ($isRelative) {
                    $cleanUrl = $baseUrl . $cleanUrl;
                } else if (!$isLocal && strpos($cleanUrl, 'http://') === 0) {
                    $cleanUrl = preg_replace('/^http:\/\//i', 'https://', $cleanUrl);
                }
                $connector = (strpos($cleanUrl, '?') !== false) ? '&' : '?';
                $ogImage = $cleanUrl . "{$connector}v={$finalV}";
            }
        }
    }

    // 2. SECOND PRIORITY: Physical image file on disk for this subject
    if (empty($ogImage) && $physicalImgPath) {
        $ext = pathinfo($physicalImgPath, PATHINFO_EXTENSION);
        $finalV = max($urlVMs, $physicalMtimeMs, $cfgVMs);
        if ($finalV <= 0) $finalV = time() * 1000;
        $ogImage = $baseUrl . "/data/og_mapel_{$mapelKey}.{$ext}?v=" . $finalV;
    }

    // 2. THIRD PRIORITY: Subject default preset image if mapelKey is present
    if (empty($ogImage) && $mapelKey && $mapelKey !== 'general') {
        if (isset($defaultSubjectImages[$mapelKey])) {
            $ogImage = $defaultSubjectImages[$mapelKey];
        } else {
            $ogImage = 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1200&h=630&fit=crop';
        }
    }

    // 3. FOURTH PRIORITY: Global Custom OG image uploaded by user in Settings or system round badge
    if (empty($ogImage)) {
        if (file_exists(__DIR__ . '/custom-og-image.jpg')) {
            $mtimeMs = filemtime(__DIR__ . '/custom-og-image.jpg') * 1000;
            $finalV = max($urlVMs, $mtimeMs);
            $ogImage = $baseUrl . '/custom-og-image.jpg?v=' . $finalV;
        } else if (file_exists("{$dataDir}/custom-og-image.jpg")) {
            $mtimeMs = filemtime("{$dataDir}/custom-og-image.jpg") * 1000;
            $finalV = max($urlVMs, $mtimeMs);
            $ogImage = $baseUrl . '/data/custom-og-image.jpg?v=' . $finalV;
        } else if (file_exists(__DIR__ . '/og-image-round.jpg')) {
            $mtimeMs = filemtime(__DIR__ . '/og-image-round.jpg') * 1000;
            $finalV = max($urlVMs, $mtimeMs);
            $ogImage = $baseUrl . '/og-image-round.jpg?v=' . $finalV;
        } else {
            $ogImage = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=630&fit=crop';
        }
    }

    // Always determine square emblem/logo for Favicons
    $faviconUrl = '';
    if (file_exists(__DIR__ . '/custom-og-image.jpg')) {
        $mtimeMs = filemtime(__DIR__ . '/custom-og-image.jpg') * 1000;
        $faviconUrl = $baseUrl . '/custom-og-image.jpg?v=' . max($urlVMs, $mtimeMs);
    } else if (file_exists("{$dataDir}/custom-og-image.jpg")) {
        $mtimeMs = filemtime("{$dataDir}/custom-og-image.jpg") * 1000;
        $faviconUrl = $baseUrl . '/data/custom-og-image.jpg?v=' . max($urlVMs, $mtimeMs);
    } else {
        $mtime = file_exists(__DIR__ . '/og-image-round.jpg') ? filemtime(__DIR__ . '/og-image-round.jpg') * 1000 : time() * 1000;
        $faviconUrl = $baseUrl . '/og-image-round.jpg?v=' . max($urlVMs, $mtime);
    }

    // Always ensure ogImage & faviconUrl are HTTPS for non-local domains
    if (!$isLocal && strpos($ogImage, 'http://') === 0) {
        $ogImage = preg_replace('/^http:\/\//i', 'https://', $ogImage);
    }
    if (!$isLocal && strpos($faviconUrl, 'http://') === 0) {
        $faviconUrl = preg_replace('/^http:\/\//i', 'https://', $faviconUrl);
    }

    $rawFullCurrentUrl = $baseUrl . $requestUri;
    if (!$isLocal && strpos($rawFullCurrentUrl, 'http://') === 0) {
        $rawFullCurrentUrl = preg_replace('/^http:\/\//i', 'https://', $rawFullCurrentUrl);
    }

    // Helper function to sanitize and encode URLs for strict RFC 3986 compliance (Open Graph crawlers)
    function sanitize_og_url($url) {
        if (empty($url)) return '';
        $url = trim($url);

        // Fix typos like https:/domain.com, http:/domain.com, https///domain.com -> https://domain.com
        $url = preg_replace('/^(https?):\/+([^\/])/i', '$1://$2', $url);
        if (!preg_match('/^https?:\/\//i', $url)) {
            $url = 'https://' . ltrim($url, ':/');
        }

        // Replace literal spaces with %20 before calling parse_url, so parse_url doesn't fail on raw parameters
        $urlForParse = str_replace(' ', '%20', $url);

        $parts = @parse_url($urlForParse);
        if (!$parts || empty($parts['host'])) {
            $safeUrl = str_replace(
                [' ', '(', ')', "'", '"', '<', '>'],
                ['%20', '%28', '%29', '%27', '%22', '%3C', '%3E'],
                $url
            );
            return preg_replace('/^(https?):\/+([^\/])/i', '$1://$2', $safeUrl);
        }
        
        $scheme = (!empty($parts['scheme']) && strtolower($parts['scheme']) === 'http') ? 'http' : 'https';
        $host = $parts['host'];
        $port = !empty($parts['port']) ? ':' . $parts['port'] : '';
        $path = !empty($parts['path']) ? $parts['path'] : '';
        
        $pathSegments = explode('/', $path);
        $encodedSegments = array_map(function($seg) {
            return rawurlencode(rawurldecode($seg));
        }, $pathSegments);
        $cleanPath = implode('/', $encodedSegments);

        $queryStr = '';
        if (isset($parts['query']) && strlen($parts['query']) > 0) {
            parse_str($parts['query'], $queryParams);
            $cleanParams = [];
            foreach ($queryParams as $k => $v) {
                $cleanKey = preg_replace('/^amp;/i', '', $k);
                if ($cleanKey === 'mapel' && !empty($v)) {
                    $cleanParams['mapel'] = canonicalize_mapel_key_php($v);
                } else {
                    $cleanParams[$cleanKey] = $v;
                }
            }
            $queryStr = '?' . http_build_query($cleanParams, '', '&', PHP_QUERY_RFC3986);
            $queryStr = str_replace(
                ["'", '(', ')', '!', '*'],
                ['%27', '%28', '%29', '%21', '%2A'],
                $queryStr
            );
        }

        $res = "{$scheme}://{$host}{$port}{$cleanPath}{$queryStr}";
        return preg_replace('/^(https?):\/+([^\/])/i', '$1://$2', $res);
    }

    function escape_url_attr($url) {
        if (empty($url)) return '';
        $url = str_replace('&amp;', '&', $url);
        return str_replace(['&', '"', '<', '>'], ['&amp;', '&quot;', '&lt;', '&gt;'], $url);
    }

    $cleanOgImage = sanitize_og_url($ogImage);
    $cleanFavicon = sanitize_og_url($faviconUrl);
    $cleanFullUrl = sanitize_og_url($rawFullCurrentUrl);

    $safeOgImage = escape_url_attr($cleanOgImage);
    $safeFavicon = escape_url_attr($cleanFavicon);
    $safeFullUrl = escape_url_attr($cleanFullUrl);
    $safeTitle = htmlspecialchars($ogTitle, ENT_QUOTES, 'UTF-8');
    $safeDesc = htmlspecialchars($ogDesc, ENT_QUOTES, 'UTF-8');

    // Determine image mime type
    $imgType = 'image/jpeg';
    if (preg_match('/\.png$/i', strtok($cleanOgImage, '?'))) {
        $imgType = 'image/png';
    } else if (preg_match('/\.webp$/i', strtok($cleanOgImage, '?'))) {
        $imgType = 'image/webp';
    }

    $faviconType = 'image/jpeg';
    if (preg_match('/\.png$/i', strtok($cleanFavicon, '?'))) {
        $faviconType = 'image/png';
    } else if (preg_match('/\.webp$/i', strtok($cleanFavicon, '?'))) {
        $faviconType = 'image/webp';
    }

    // Helper function to replace or inject meta tags cleanly regardless of existing tag format or order
    function replace_or_inject_meta(&$html, $attrName, $attrVal, $contentVal) {
        $escapedAttrVal = preg_quote($attrVal, '/');
        $pattern = '/<meta\s+[^>]*' . $attrName . '=["\']' . $escapedAttrVal . '["\'][^>]*\/?>/i';
        $newTag = '<meta ' . $attrName . '="' . $attrVal . '" content="' . $contentVal . '" />';
        if (preg_match($pattern, $html)) {
            $html = preg_replace($pattern, $newTag, $html);
        } else if (strpos($html, '</head>') !== false) {
            $html = str_replace('</head>', '  ' . $newTag . "\n</head>", $html);
        }
    }

    // 1. Title replacement
    $html = preg_replace('/<title>.*?<\/title>/i', "<title>{$safeTitle}</title>", $html);
    replace_or_inject_meta($html, 'property', 'og:title', $safeTitle);
    replace_or_inject_meta($html, 'name', 'twitter:title', $safeTitle);

    // 2. Description replacement
    replace_or_inject_meta($html, 'name', 'description', $safeDesc);
    replace_or_inject_meta($html, 'property', 'og:description', $safeDesc);
    replace_or_inject_meta($html, 'name', 'twitter:description', $safeDesc);

    // 3. Image & Card replacement
    replace_or_inject_meta($html, 'property', 'og:type', 'website');
    replace_or_inject_meta($html, 'property', 'og:image', $safeOgImage);
    replace_or_inject_meta($html, 'property', 'og:image:url', $safeOgImage);
    replace_or_inject_meta($html, 'property', 'og:image:secure_url', $safeOgImage);
    replace_or_inject_meta($html, 'property', 'og:image:type', $imgType);
    replace_or_inject_meta($html, 'property', 'og:image:width', '1200');
    replace_or_inject_meta($html, 'property', 'og:image:height', '630');
    replace_or_inject_meta($html, 'name', 'twitter:image', $safeOgImage);
    replace_or_inject_meta($html, 'name', 'twitter:image:src', $safeOgImage);
    replace_or_inject_meta($html, 'name', 'twitter:card', 'summary_large_image');

    // 4. Favicon & Touch Icons replacement (Uses $safeFavicon square icon)
    $html = preg_replace('/<link\s+rel=["\'](?:shortcut\s+)?icon["\'][^>]*\/?>/i', '<link rel="icon" type="' . $faviconType . '" href="' . $safeFavicon . '" />', $html);
    $html = preg_replace('/<link\s+rel=["\']apple-touch-icon["\'][^>]*\/?>/i', '<link rel="apple-touch-icon" href="' . $safeFavicon . '" />', $html);

    // 5. Canonical & og:url replacement
    replace_or_inject_meta($html, 'property', 'og:url', $safeFullUrl);

    if (preg_match('/<link\s+rel=["\']canonical["\']\s+href=["\'].*?["\']\s*\/?>/i', $html)) {
        $html = preg_replace('/<link\s+rel=["\']canonical["\']\s+href=["\'].*?["\']\s*\/?>/i', '<link rel="canonical" href="' . $safeFullUrl . '" />', $html);
    } else if (strpos($html, '</head>') !== false) {
        $html = str_replace('</head>', '  <link rel="canonical" href="' . $safeFullUrl . '" />' . "\n</head>", $html);
    }

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
    echo $html;
    exit();
}

http_response_code(404);
echo "Aplikasi Modul Ajar Berbasis Cinta (KBC): File index.html tidak ditemukan.";
