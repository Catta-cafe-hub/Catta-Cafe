// CattaHub Loader (Auto-Start Final)
(function() {
    // ลิงก์ VPS ของคุณ
    const CORE_SCRIPT_URL = "https://st-cattacafe.casa/public/catta-core.js"; 

    console.log("🐱 CattaHub: Connecting to VPS...");

    const script = document.createElement('script');
    script.id = 'catta-core-script';
    // เติม Date.now() ป้องกัน Cache
    script.src = CORE_SCRIPT_URL + "?v=" + Date.now();
    
    script.onload = () => {
        console.log("✅ CattaHub Core Loaded!");
        // สั่งให้ปุ่มทำงานทันที! ไม่ต้องรอคนกด
        setTimeout(() => {
            if (typeof mountCattaHub === 'function') {
                mountCattaHub(); 
            }
        }, 500); 
    };

    script.onerror = () => console.error("❌ Failed to load CattaHub. Check VPS.");

    document.head.appendChild(script);
})();
