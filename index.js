// CattaHub Loader (Auto-Start Final)
(function() {
    // ⚠️ 1. แก้ชื่อไฟล์ตรงนี้ให้ตรงกับบน VPS (เติม -v2)
    const CORE_SCRIPT_URL = "https://st-cattacafe.casa/public/catta-core-v2.js"; 

    console.log("🐱 CattaHub V.2: Connecting to VPS...");

    const script = document.createElement('script');
    
    // ⚠️ 2. แก้ ID ตรงนี้เป็น v2 (เพื่อให้ Browser รู้ว่าเป็นคนละตัวกับอันเก่า)
    script.id = 'catta-core-v2-script';
    
    // เติม Date.now() ป้องกัน Cache (ดีแล้วครับ เก็บไว้)
    script.src = CORE_SCRIPT_URL + "?v=" + Date.now();
    
    script.onload = () => {
        console.log("✅ CattaHub Core V.2 Loaded!");
        // สั่งให้ปุ่มทำงานทันที! ไม่ต้องรอคนกด
        setTimeout(() => {
            if (typeof mountCattaHub === 'function') {
                mountCattaHub(); 
            }
        }, 500); 
    };

    script.onerror = () => console.error("❌ Failed to load CattaHub V.2 Check VPS.");

    document.head.appendChild(script);
})();
