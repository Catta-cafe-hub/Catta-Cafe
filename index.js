// CattaHub Loader (Auto-Start Final)
(function() {
    const CORE_SCRIPT_URL = "https://st-cattacafe.casa/public/catta-core-v2.js"; 

    console.log("🐱 CattaHub V.2: Connecting to VPS...");

    const script = document.createElement('script');
    script.id = 'catta-core-v2-script';
    script.src = CORE_SCRIPT_URL + "?v=" + Date.now(); // กัน Cache
    
    script.onload = () => {
        console.log("✅ CattaHub Core V.2 Loaded Successfully!");
        // ปล่อยให้ Core Script รันตัวเองผ่าน loadCattaHubSettings() ที่อยู่ท้ายไฟล์ V.2
    };

    script.onerror = () => {
        console.error("❌ Failed to load CattaHub V.2. Check your VPS connection or Cloudflare settings.");
    };

    document.head.appendChild(script);
})();
