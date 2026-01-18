// CattaHub Loader (Auto-Start Version)
(function() {
    const CORE_SCRIPT_URL = "https://st-cattacafe.casa/public/catta-core.js"; 

    console.log("🐱 CattaHub: Loading Core from VPS...");

    const script = document.createElement('script');
    script.id = 'catta-core-script';
    script.src = CORE_SCRIPT_URL + "?v=" + Date.now();
    
    script.onload = () => {
        console.log("✅ CattaHub Core Loaded!");
        
        // 🛠️ เพิ่มตรงนี้: สั่งให้ทำงานทันที ไม่ต้องรอกดเปิดในเมนู
        setTimeout(() => {
            if (typeof mountCattaHub === 'function') {
                console.log("🐱 Force Mounting CattaHub...");
                mountCattaHub(); // สั่งสร้างปุ่มแมวทันที
            }
        }, 2000); // รอ 2 วิให้เว็บโหลดเสร็จ
    };

    script.onerror = () => console.error("❌ Failed to load CattaHub Core. Check VPS Server.");

    document.head.appendChild(script);
})();
