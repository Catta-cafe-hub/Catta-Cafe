// CattaHub V.Ultimate (Final Network-Core Edition + Celebration Patch)
// Updated: January 18, 2026 - 12:00 AM
// System: Network-Level Scoring (Bypasses Event Listener issues)

const SERVER_URL = "https://st-cattacafe.casa";
const extensionName = "CattaHub";

// ==========================================
// 🎨 ASSETS & CONFIG
// ==========================================
const CAT_EMOJI = "🐱";
const CUSTOM_ICON_URL = "https://file.garden/aZx9zS2e7UEiSmfr/cat_icon.png";
const DEFAULT_USER_ICON = "https://cdn.discordapp.com/embed/avatars/0.png";
const NOTIFY_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIwAHCxISFRYWGRsfHyIkJCUpKS0wMDI1NTo9PT9CQkZJSU5SUlVYWFxdXV9iYmZoaGlrbG5xcXJ1dXcAAAAATGF2YzU4LjkxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASMH78r7AAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAABAAABAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const INJECTION_TEXT_VISIBLE = "\n\n<!--CattaHub System: Recorded-->";


const RELATIONSHIP_LEVELS = [
    { name: "⚡ ขัดแย้ง", min: -Infinity, max: -1, color: "#FF5252" },
    { name: "⚪ ผิวเผิน", min: 0, max: 499, color: "#B0BEC5" },
    { name: "🔗 เริ่มเกี่ยวข้อง", min: 500, max: 1999, color: "#81C784" },
    { name: "🎗️ ผูกพัน", min: 2000, max: 4999, color: "#66BB6A" },
    { name: "🧱 แน่นแฟ้น", min: 5000, max: 7999, color: "#4DB6AC" },
    { name: "⚓ มั่นคง", min: 8000, max: 9999, color: "#009688" },
    { name: "❤️ อุทิศตน/ลึกซึ้ง", min: 10000, max: 49999, color: "#1E88E5" },
    { name: "💎 นิรันดร์", min: 50000, max: Infinity, color: "#9C27B0" }
];


let authSession = null;
let playSession = null;
let isOnline = false;
let activeCharId = null;
let currentRankAssets = {};

let currentPsyche = { points: 0, level: "Stranger", loaded: false };
let currentSessionID = null;
let isManualReset = false;


let gameHeartbeat = null;
let gameVisualTimer = null;
let rankVisualTimer = null;
let barCheckInterval = null;
let sessionCheckInterval = null;

let originalFetch = window.fetch;
let hiddenPrompt = "";
let currentView = 'dashboard';
let currentSearchQuery = '';
let themeIndex = parseInt(localStorage.getItem('catta_theme')) || 0;
const themes = [
    'theme-warm', 'theme-sweet', 'theme-dante', 'theme-blue',
    'theme-mintdark', 'theme-purpledark', 'theme-pinkdark', 'theme-white',
    'theme-espresso', 'theme-ocean', 'theme-berry' // ✅ 3 ธีมใหม่จากรูป
];

// ✅ [NEW] Load Confetti Library Dynamically (Safe Mode)
try {
    if (!document.getElementById('confetti-script')) {
        const script = document.createElement('script');
        script.id = 'confetti-script';
        script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
        document.head.appendChild(script);
    }
} catch (e) {
    console.warn("CattaHub: Confetti Script blocked by CSP. Safe to ignore.", e);
}


function generateSessionID() {
    return 'CT-SID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function scanForSessionID() {

    if (currentSessionID) return currentSessionID;

    // 2. Chat History Priority
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        const ctx = SillyTavern.getContext();
        if (ctx && ctx.chat && ctx.chat.length > 0) {
            const regex = /<!-- CATTA_SID:(.*?) -->/;
            for (let i = ctx.chat.length - 1; i >= 0; i--) {
                const msg = ctx.chat[i].mes;
                const match = msg.match(regex);
                if (match && match[1]) {
                    console.log("🐱 Found SID in History:", match[1]);
                    return match[1];
                }
            }
        }
    }

    return null;
}

// ฟังก์ชันนี้มีไว้แค่เช็คว่าคะแนนปัจจุบันอยู่เลเวลไหน เพื่อเปลี่ยนสีหลอดบนหน้าจอเท่านั้น
function calculateLevel(points) {
    return RELATIONSHIP_LEVELS.find(l => points >= l.min && points <= l.max) || RELATIONSHIP_LEVELS[1];
}

// 🧠 SCORING BRAIN (กฎการบวกลบคะแนน) ถูกย้ายไปที่เซิร์ฟเวอร์ Python เพื่อความปลอดภัย 100% แล้ว


async function loginToAuth(uid, authToken, isManual = false) {
    $('#catta-msg').text("⏳ Connecting...");
    try {
        const response = await fetch(`${SERVER_URL}/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: uid, token: authToken })
        });
        const data = await response.json();

        if (data.success) {
            authSession = {
                uid: uid,
                token: authToken,
                session_id: data.session_id,
                username: data.username,
                avatar: data.avatar || DEFAULT_USER_ICON,
                rank_remaining: data.rank_remaining || 0,
                rank_title: data.rank_title || "Member"
            };
            localStorage.setItem('catta_uid', uid);
            localStorage.setItem('catta_auth_token', authToken);

            startRankTimer();
            if (data.alert && data.alert.level !== 'none') toastr.warning(data.alert.message);
            else toastr.success(`ยินดีต้อนรับกลับนะครับฮะ นายท่าน, ${data.username}`);

            if (isManual) {
                setTimeout(() => location.reload(), 1500);
            }

            startSessionHeartbeat();

            const savedPlayToken = localStorage.getItem('catta_play_token');
            if (savedPlayToken) verifyTokenSilent(savedPlayToken);
            else renderHubUI();

            setTimeout(syncPsycheFromServer, 1000);

        } else {
            $('#catta-msg').text(data.message).css('color', '#EF5350');
        }
    } catch (e) {
        console.error(e);
        $('#catta-msg').html(`❌ Connection Failed`).css('color', '#EF5350');
    }
}

async function verifyTokenSilent(playToken) {
    try {
        const response = await fetch(`${SERVER_URL}/v1/game/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authSession.token}` },
            body: JSON.stringify({ play_token: playToken })
        });
        const data = await response.json();
        if (data.success) {
            playSession = { token: playToken, type: data.type, remaining: data.remaining_seconds, characters: data.characters };
            localStorage.setItem('catta_play_token', playToken);
        } else {
            localStorage.removeItem('catta_play_token');
        }
    } catch (e) {} finally { renderHubUI(); }
}

async function activatePlayToken(playToken) {
    if (!authSession) return;
    const btn = $('#btn-verify-token');
    btn.prop('disabled', true).html('Checking...');
    try {
        const response = await fetch(`${SERVER_URL}/v1/game/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authSession.token}` },
            body: JSON.stringify({ play_token: playToken })
        });
        const data = await response.json();
        if (data.success) {
            playSession = { token: playToken, type: data.type, remaining: data.remaining_seconds, characters: data.characters };
            localStorage.setItem('catta_play_token', playToken);
            isOnline = false;
            activeCharId = null;
            hiddenPrompt = "";
            stopGameHeartbeat();
            toastr.success(`เชื่อมต่อโทเค่นสำเร็จแล้วฮะ!`);
            currentView = 'game';
            renderHubUI();
        } else {
            toastr.error(data.message);
            localStorage.removeItem('catta_play_token');
        }
    } catch (e) { toastr.error("Connection Error"); } finally { btn.prop('disabled', false).html('ยืนยัน'); }
}


function startSessionHeartbeat() {
    if (sessionCheckInterval) clearInterval(sessionCheckInterval);

    // เช็คทุกๆ 10 วินาที
    sessionCheckInterval = setInterval(async() => {
        if (!authSession) return;

        try {
            const res = await fetch(`${SERVER_URL}/v1/auth/check_session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: authSession.uid,
                    session_id: authSession.session_id
                })
            });
            const data = await res.json();

            if (data.valid === false) {
                console.warn("⚠️ Session Invalid: Logged in somewhere else.");
                alert("⚠️ คุณมีการเข้าสู่ระบบจากอุปกรณ์อื่น!\nSession นี้จะถูกตัดการเชื่อมต่อครับ");
                logout();
            }
        } catch (e) {

        }
    }, 10000);
}

function startRankTimer() {
    if (rankVisualTimer) clearInterval(rankVisualTimer);
    rankVisualTimer = setInterval(() => {
        if (authSession && authSession.rank_remaining > 0) {
            authSession.rank_remaining--;
            if (currentView === 'dashboard') $('#catta-rank-timer').html(`<i class="fa-regular fa-clock"></i> ${formatTime(authSession.rank_remaining)}`);
        }
    }, 1000);
}

function startGameHeartbeat() {
    if (gameHeartbeat) clearInterval(gameHeartbeat);
    gameHeartbeat = setInterval(async() => {
        if (!playSession) return;
        try {
            const res = await fetch(`${SERVER_URL}/v1/game/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ play_token: playSession.token })
            });
            const data = await res.json();
            if (data.status === 'expired') {
                goOffline("เวลาของ Token หมดแล้วครับฮะ 😿");
                playSession.remaining = 0;
            } else { playSession.remaining = data.remaining_seconds; }
            updateGameTimerDisplay();
        } catch (e) {}
    }, 60000);

    if (gameVisualTimer) clearInterval(gameVisualTimer);
    gameVisualTimer = setInterval(() => {
        if (isOnline && playSession && playSession.remaining > 0) {
            playSession.remaining--;
            updateGameTimerDisplay();
        } else if (playSession && playSession.remaining <= 0) goOffline("Token Time Finished");
    }, 1000);
}

function stopGameHeartbeat() {
    if (gameHeartbeat) clearInterval(gameHeartbeat);
    if (gameVisualTimer) clearInterval(gameVisualTimer);
}

function goOffline(reason = "") {
    isOnline = false;
    stopGameHeartbeat();
    renderHubUI();
    if (reason) toastr.warning(reason);
}

async function goOnline(charId) {
    if (!playSession || playSession.remaining <= 0) { toastr.error("Time Expired"); return; }
    try {
        const res = await fetch(`${SERVER_URL}/v1/game/get_content`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${playSession.token}`, 'x-catta-char-id': charId }
        });
        const data = await res.json();
        if (data.success) {

            hiddenPrompt = data.system_prompt || "";

            currentRankAssets = data.rank_assets || {};
            const rankCount = Object.keys(currentRankAssets).length;
            console.log("📦 Loaded Assets:", currentRankAssets);

            activeCharId = charId;
            isOnline = true;

            currentSessionID = null;
            isManualReset = false;

            startGameHeartbeat();
            enableInterceptor();
            renderHubUI();
            toastr.success(`เชื่อมต่อสำเร็จ! (Online)! (Loaded ${rankCount} Rank Images)`);

            setTimeout(syncPsycheFromServer, 500);

        } else { toastr.error(data.error || "Failed"); }
    } catch (e) { toastr.error("Server Error"); }
}

function enableInterceptor() {
    if (window.fetch.isCattaHook) return;
    window.fetch = async function(input, init) {
        let urlStr = (typeof input === 'string') ? input : (input.url || input.toString());

        if (isOnline && hiddenPrompt && (urlStr.includes('/v1/chat/completions') || urlStr.includes('generate'))) {
            if (init && init.method === 'POST' && init.body) {
                try {
                    let body = JSON.parse(init.body);
                    let isReplaced = false;

                    // เช็คในรูปแบบ Array ของ OpenAI / DeepSeek
                    if (body.messages && Array.isArray(body.messages)) {
                        for (let i = 0; i < body.messages.length; i++) {
                            // ถ้าเจอคำว่า Protected by CattaHub ให้สวมทับทันที!
                            if (body.messages[i].content && body.messages[i].content.includes("Protected by CattaHub")) {
                                body.messages[i].content = hiddenPrompt; 
                                isReplaced = true;
                                break;
                            }
                        }
                    }

                    if (isReplaced) {
                        init.body = JSON.stringify(body);
                        console.log("🐱 CattaHub: สลับคำโปรยสำเร็จก่อนส่งไป AI!");
                    } else if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {

                        body.messages[0].content = hiddenPrompt + "\n\n" + body.messages[0].content;
                        init.body = JSON.stringify(body);
                    }
                } catch (e) {
                    console.error("CattaHub Error:", e);
                }
            }
        }

        let response = await originalFetch(input, init);

        if (isOnline && (urlStr.includes('/v1/chat/completions') || urlStr.includes('generate'))) {
            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json") && !contentType.includes("text/event-stream")) {
                try {
                    const cloneForEdit = response.clone();
                    const data = await cloneForEdit.json();
                    let modified = false;
                    let responseText = "";

                    let sid = scanForSessionID();
                    if (!sid && currentSessionID) sid = currentSessionID;
                    if (!sid) {
                        sid = generateSessionID();
                        console.log("🐱 CattaHub (Fetch): Generated New Session ID -> " + sid);
                    }

                    currentSessionID = sid;

                    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                        const ctx = SillyTavern.getContext();
                        if (ctx.characterId) localStorage.setItem(`catta_backup_sid_${ctx.characterId}`, sid);
                    }

                    const FULL_INJECTION = `${INJECTION_TEXT_VISIBLE}\n<!-- CATTA_SID:${sid} -->`;

                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        responseText = data.choices[0].message.content;
                        data.choices[0].message.content += FULL_INJECTION;
                        modified = true;
                    } else if (data.results && data.results[0] && data.results[0].text) {
                        responseText = data.results[0].text;
                        data.results[0].text += FULL_INJECTION;
                        modified = true;
                    }

                    if (responseText && currentPsyche.loaded && currentSessionID) {
                        originalFetch(`${SERVER_URL}/v1/game/process_score`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authSession.token}` },
                                body: JSON.stringify({
                                    session_id: currentSessionID,
                                    char_id: activeCharId,
                                    text: responseText
                                })
                            })
                            .then(res => res.json())
                            .then(data => {
                                if (data.success) {
                                    const oldLevel = currentPsyche.level;
                                    currentPsyche.points = data.new_points;
                                    currentPsyche.level = data.new_level;

                                    if (data.is_rank_up) {
                                        const rankImage = currentRankAssets[data.new_level];
                                        if (rankImage) showRankUpOverlay(data.new_level, rankImage);
                                        else triggerNotification("Relationship Update!", `Level: ${data.new_level}`, `${SERVER_URL}/public/icons/heart.png`);
                                    }
                                    renderPsycheBar(data.score_change);
                                }
                            }).catch(() => {}); 
                    }

                    if (modified) {
                        response = new Response(JSON.stringify(data), {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers
                        });
                    }
                } catch (e) {
                    console.error("CattaHub: Injection Failed in Fetch", e);
                }
            }
        }

        // Log Stats (โค้ดเดิมของคุณ)
        if (isOnline && (urlStr.includes('/v1/chat/completions') || urlStr.includes('generate'))) {
            if (playSession) {
                originalFetch(`${SERVER_URL}/v1/game/log_stat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        play_token: playSession.token,
                        char_id: activeCharId,
                        chat_count: 1
                    })
                }).catch(() => {});
            }
        }

        return response;
    };
    window.fetch.isCattaHook = true;
}

async function syncPsycheFromServer() {
    if (!authSession) return;

    let sid = scanForSessionID();

    if (sid) {
        console.log(`🔄 Syncing... Found SID: ${sid}`);
        currentSessionID = sid;
    } else if (currentSessionID) {
        sid = currentSessionID;
        console.log(`ℹ️ Using Memory SID: ${sid}`);
    }

    if (!sid) {
        const ctx = (typeof SillyTavern !== 'undefined') ? SillyTavern.getContext() : null;
        if (!ctx || !ctx.chat || ctx.chat.length === 0) {
            console.log("⏳ Chat not fully loaded. Skipping Sync.");
            return;
        }

        console.log("🧹 Confirmed New/Empty Session. Resetting UI.");
        currentPsyche = { points: 0, level: "Stranger", loaded: true };
        renderPsycheBar();
        return;
    }

    try {
        const res = await fetch(`${SERVER_URL}/v1/game/psyche/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sid })
        });
        const data = await res.json();

        console.log("📡 Server Response:", data);

        if (data.success && data.data) {
            console.log(`✅ Synced Score: ${data.data.points}`);
            currentPsyche = { points: data.data.points, level: data.data.level, loaded: true };
            renderPsycheBar();
        }
    } catch (e) {
        console.error("❌ Sync Error:", e);
    }
}

async function savePsycheToServer(points, level) {
    if (!currentSessionID) return;

    // 🛡️ ULTRA SAFE GUARD:
    if (!currentPsyche.loaded && !isManualReset) {
        console.warn("🛑 BLOCKED: Attempted to save before Sync finished.");
        return;
    }

    try {
        await fetch(`${SERVER_URL}/v1/game/psyche/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: currentSessionID,
                points: points,
                level: level
            })
        });
        if (isManualReset) isManualReset = false;

    } catch (e) { console.error("Psyche Save Error", e); }
}

function resetRelationship() {
    if (!confirm("⚠️ ต้องการล้างค่าความสัมพันธ์ของห้องนี้ใช่ไหม? (เริ่มจีบใหม่)")) return;

    isManualReset = true;
    currentSessionID = null;
    currentPsyche = { points: 0, level: "Stranger", loaded: true };
    renderPsycheBar();
    toastr.success("ล้างค่าความสัมพันธ์และเริ่มต้นใหม่แล้วนะครับฮะ! (Relationship Reset!)");
}

function renderPsycheBar(lastChange = 0) {

    const barKey = `${extensionName}:bar_visible`;
    const barVal = localStorage.getItem(barKey);
    const isVisible = barVal === null ? true : (barVal === 'true');

    if (!activeCharId || !isVisible) {
        $('#catta-psyche-bar').remove();
        return;
    }

    let charName = "Unknown";
    if (playSession && playSession.characters) {
        const char = playSession.characters.find(c => c.id === activeCharId);
        if (char) charName = char.name;
    }

    const levelObj = calculateLevel(currentPsyche.points);
    const currentIdx = RELATIONSHIP_LEVELS.indexOf(levelObj);
    const nextLevel = RELATIONSHIP_LEVELS[currentIdx + 1];

    let nextStatusText = "Max Level";
    let barWidth = 100;

    if (nextLevel) {
        const range = nextLevel.min - levelObj.min;
        const current = currentPsyche.points - levelObj.min;
        barWidth = Math.max(0, Math.min(100, (current / range) * 100));
        const pointsNeeded = nextLevel.min - currentPsyche.points;
        nextStatusText = `${pointsNeeded} to ${nextLevel.name}`;
    }

    const changeColor = lastChange > 0 ? "#69F0AE" : (lastChange < 0 ? "#FF8A80" : "rgba(255,255,255,0.7)");
    const changeText = lastChange > 0 ? `+${lastChange}` : `${lastChange}`;
    const currentTheme = themes[themeIndex];

    const html = `
    <div id="catta-psyche-bar" class="${currentTheme}" style="
        font-family: 'Segoe UI', Tahoma, sans-serif;
        background: var(--catta-header-bg); 
        color: #FFF;
        padding: 8px 15px; 
        width: 95%;
        max-width: 600px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.3);
        backdrop-filter: blur(5px);
        box-sizing: border-box;
        position: fixed; 
        top: 36px; 
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        pointer-events: none;
        transition: all 0.3s ease;
    ">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 4px;">
            <span style="font-weight:bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                ${charName} 
                <span style="font-weight:normal; opacity:0.9; color:${levelObj.color}; background:rgba(255,255,255,0.2); padding:0 4px; border-radius:4px;">
                    ${levelObj.name}
                </span>
            </span>
            <div>
                <span style="color: ${changeColor}; font-weight: bold; margin-right: 5px; opacity: ${lastChange===0?0:1}; transition: opacity 0.5s; text-shadow: 0 1px 1px rgba(0,0,0,0.5);">
                    (${changeText})
                </span>
                <span style="font-family: monospace; font-weight:bold;">${currentPsyche.points.toLocaleString()}</span>
            </div>
        </div>
        <div style="background-color: rgba(255,255,255,0.25); border-radius: 6px; height: 6px; overflow:hidden; position:relative;">
            <div style="background-color: ${levelObj.color}; width: ${barWidth}%; height: 100%; border-radius: 6px; transition: width 0.5s ease; box-shadow: 0 0 5px ${levelObj.color};"></div>
        </div>
        <div style="text-align:right; font-size:10px; color:rgba(255,255,255,0.8); margin-top:2px;">${nextStatusText}</div>
    </div>
    `;

    if ($('#catta-psyche-bar').length) {
        $('#catta-psyche-bar').replaceWith(html);
    } else {
        $('body').append(html);
    }
}

function showRankUpOverlay(levelName, imageUrl) {
    const audio = new Audio(NOTIFY_SOUND);
    audio.volume = 0.6;
    audio.play().catch(() => {});

    // Trigger Confetti
    if (window.confetti) {
        var duration = 3000;
        var end = Date.now() + duration;
        (function frame() {
            window.confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
            window.confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }

    const html = `
    <div id="catta-rank-overlay" style="
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.85); z-index: 999999;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        animation: fadeIn 0.5s ease;
    ">
        <style>@keyframes fadeIn { from { opacity:0; } to { opacity:1; } } @keyframes popUp { from { transform:scale(0.8); } to { transform:scale(1); } }</style>
        
        <h1 style="color: #FFD700; font-family: 'Segoe UI', sans-serif; text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); font-size: 1.5rem; margin-bottom: 20px; animation: popUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            🎉 RELATIONSHIP LEVEL UP! 🎉
        </h1>
        <h2 style="color: #FFF; font-family: monospace; margin-top: 0; margin-bottom: 30px; font-size: 1rem; letter-spacing: 2px;">
            Current Level: <span style="color: #4CAF50;">${levelName}</span>
        </h2>
        
        <div style="position: relative; max-width: 90%; max-height: 70vh;">
            <img src="${imageUrl}" style="
                max-width: 100%; max-height: 70vh; 
                border-radius: 15px; 
                box-shadow: 0 0 50px rgba(255,255,255,0.2);
                border: 3px solid #FFF;
                animation: popUp 0.6s ease;
            " onerror="this.src='${DEFAULT_USER_ICON}'"> <!-- ✅ เพิ่ม onerror กันรูปแตก -->
        </div>

        <button onclick="$('#catta-rank-overlay').fadeOut(300, function(){ $(this).remove(); })" style="
            margin-top: 30px;
            padding: 12px 40px;
            font-size: 1.2rem;
            background: #FFF; color: #000;
            border: none; border-radius: 50px;
            cursor: pointer; font-weight: bold;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            Close / ปิด
        </button>
    </div>
    `;
    $('body').append(html);
}

function triggerNotification(title, message, imgUrl) {
    const notifyId = `catta-notify-${Date.now()}`;
    const html = `
    <div id="${notifyId}" class="catta-notification" style="
        position: fixed; top: 20px; right: -350px; width: 300px;
        background: rgba(33, 33, 33, 0.95); border-radius: 12px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.5); z-index: 99999;
        display: flex; padding: 12px; align-items: center; gap: 12px;
        border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);
        font-family: 'Segoe UI', Tahoma, sans-serif; transition: right 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    ">
        <div style="width: 45px; height: 45px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2px solid #FF5722;">
            <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='${DEFAULT_USER_ICON}'">
        </div>
        <div style="flex-grow: 1;">
            <div style="font-size: 13px; font-weight: bold; color: #FFF; margin-bottom: 2px;">${title}</div>
            <div style="font-size: 12px; color: #CCC; line-height: 1.3;">${message}</div>
        </div>
    </div>
    `;

    $('body').append(html);
    setTimeout(() => { $(`#${notifyId}`).css('right', '20px'); }, 100);
    setTimeout(() => {
        $(`#${notifyId}`).css('right', '-350px');
        setTimeout(() => $(`#${notifyId}`).remove(), 600);
    }, 6000);
}

function updateFloatIcon() {
    const $btn = $('#catta-float-btn');
    if ($btn.length === 0) return;

    if (activeCharId && playSession && playSession.characters) {
        const char = playSession.characters.find(c => c.id === activeCharId);
        if (char) {
            $btn.html(`<img src="${char.avatar}" style="width:100%; height:100%; object-fit:cover; pointer-events:none;" referrerpolicy="no-referrer" draggable="false">`);
            return;
        }
    }
    $btn.html(`<div style="width:100%; height:100%; background:white; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:35px; pointer-events:none; user-select:none; cursor:pointer;">
        ${CUSTOM_ICON_URL ? `<img src="${CUSTOM_ICON_URL}" style="width:100%; height:100%; object-fit:cover; pointer-events:none;">` : CAT_EMOJI}
    </div>`);
}

function toggleTheme() {
    themeIndex = (themeIndex + 1) % themes.length;
    renderHubUI();
}

function getRankInfo() {
    if (authSession && authSession.rank_title) {
        let color = "#66BB6A";
        if (authSession.rank_title.toUpperCase().includes('VIP')) color = "#FFD700";
        return { title: authSession.rank_title, color: color };
    }
    return { title: "Member Cat", color: "#66BB6A" };
}

function formatTime(seconds) {
    if (!seconds || seconds <= 0) return "00:00:00";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return (d > 0 ? `${d}d ` : '') + `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function updateGameTimerDisplay() {
    const timeStr = playSession ? formatTime(playSession.remaining) : "--:--:--";
    $('#catta-token-timer').html(timeStr);

    const $toggle = $('#catta-toggle-btn');
    if (isOnline) {
        $toggle.addClass('active');
        $('#catta-toggle-icon').removeClass('fa-power-off').addClass('fa-bolt');
    } else {
        $toggle.removeClass('active');
        $('#catta-toggle-icon').addClass('fa-power-off').removeClass('fa-bolt');
    }
}

function renderLoginUI() {
    updateFloatIcon();

    window.cattaTriggerLogin = function() {

        const $popup = $('#catta-popup');
        const u = $popup.find('#catta-uid').val();
        const t = $popup.find('#catta-auth').val();

        console.log("Overlay Login:", u); // เช็คค่า

        if (u && t) {
            loginToAuth(u.trim(), t.trim(), true);
        } else {
            if (window.toastr) toastr.warning("Please enter UID and Token");
        }
    };

    const themeClass = themes[themeIndex];
    const html = `
        <div class="catta-wrapper ${themeClass}">
        <div class="catta-header">
                <span>🔐 Catta Login</span>
                <div class="catta-header-actions">
                    <button class="catta-icon-btn" onclick="$('#theme-tray-login').slideToggle(150)" title="เลือกสี"><i class="fa-solid fa-palette"></i></button>
                    <button class="catta-icon-btn" onclick="$('#catta-popup').animate({opacity:0}, 150, function(){ $(this).hide(); })"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <!-- ถาดเลือกสี (ซ่อนอยู่) -->
            <div id="theme-tray-login" style="display:none; background:rgba(0,0,0,0.08); padding:10px; border-bottom:1px solid rgba(0,0,0,0.1);">
                <div style="font-size:10px; font-weight:bold; margin-bottom:6px; opacity:0.7; text-align:center;">🎨 เลือกจานสีที่คุณชอบ</div>
                <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                    <div class="theme-dot" style="background:#F57C00;" onclick="window.setTheme(0)" title="Warm"></div>
                    <div class="theme-dot" style="background:#F06292;" onclick="window.setTheme(1)" title="Sweet"></div>
                    <div class="theme-dot" style="background:#000000;" onclick="window.setTheme(2)" title="Dante"></div>
                    <div class="theme-dot" style="background:#2196F3;" onclick="window.setTheme(3)" title="Blue"></div>
                    <div class="theme-dot" style="background:#00BFA5;" onclick="window.setTheme(4)" title="Mint"></div>
                    <div class="theme-dot" style="background:#4B0082;" onclick="window.setTheme(5)" title="Purple"></div>
                    <div class="theme-dot" style="background:#800040;" onclick="window.setTheme(6)" title="Pink"></div>
                    <div class="theme-dot" style="background:#FFFFFF; border:2px solid #CCC;" onclick="window.setTheme(7)" title="White"></div>
                    <div class="theme-dot" style="background:#4D3A2F;" onclick="window.setTheme(8)" title="Espresso"></div>
                    <div class="theme-dot" style="background:#4AB4D5;" onclick="window.setTheme(9)" title="Ocean"></div>
                    <div class="theme-dot" style="background:#EA3E70;" onclick="window.setTheme(10)" title="Berry"></div>
                </div>
            </div>
            <div class="catta-body centered">
                <div style="margin-bottom:15px; position:relative;">
                    <div class="catta-logo-bg"></div>
                    <div style="background:#FFF; border-radius:50%; width:80px; height:80px; display:flex; justify-content:center; align-items:center; font-size:40px; overflow:hidden;">
                        ${CUSTOM_ICON_URL ? `<img src="${CUSTOM_ICON_URL}" style="width:100%; height:100%; object-fit:cover; pointer-events:none;">` : CAT_EMOJI}
                    </div>
                </div>
                <div class="catta-label">Discord UID</div>
                
                <!-- ✅ กลับมาใช้ ID เดิม ตามที่คุณต้องการ -->
                <input type="text" id="catta-uid" class="catta-input" value="${localStorage.getItem('catta_uid')||''}" onkeydown="if(event.key === 'Enter') window.cattaTriggerLogin()">
                
                <div class="catta-label">Token</div>
                
                <!-- ✅ กลับมาใช้ ID เดิม -->
                <input type="password" id="catta-auth" class="catta-input" onkeydown="if(event.key === 'Enter') window.cattaTriggerLogin()">
                
                <button id="btn-login" class="catta-main-btn" onclick="window.cattaTriggerLogin()" style="cursor: pointer; pointer-events: auto; z-index: 999999;">Login</button>
                
                <div id="catta-msg" style="margin-top:5px; font-size:11px; min-height:15px;"></div>
            </div>
        </div>
    `;
    $('#catta-popup').html(html);
}

function renderHubUI() {
    updateFloatIcon();
    if (!authSession) return renderLoginUI();
    const themeClass = themes[themeIndex];
    const rank = getRankInfo();

    const barKey = `${extensionName}:bar_visible`;
    const barVal = localStorage.getItem(barKey);
    const isBarVisible = barVal === null ? true : (barVal === 'true');

    let contentHtml = '';
    if (currentView === 'dashboard') {
        contentHtml = `
            <div class="catta-body">
                <div class="catta-profile-card">
                    <img src="${authSession.avatar}" class="profile-pic" referrerpolicy="no-referrer" onerror="this.src='${DEFAULT_USER_ICON}'">
                    <div class="profile-info">
                        <div class="profile-name">${authSession.username}</div>
                        <div class="profile-rank" style="color:${rank.color}">
                            <i class="fa-solid fa-crown"></i> ${rank.title}
                        </div>
                        <div id="catta-rank-timer" style="font-size:11px; margin-top:3px; opacity:0.7; font-family:monospace;">
                            <i class="fa-regular fa-clock"></i> ${formatTime(authSession.rank_remaining)}
                        </div>
                    </div>
                </div>

                <div class="catta-divider"></div>

                <!-- ✅ ส่วนตั้งค่า (เพิ่มใหม่ตรงนี้) -->
                <div class="catta-label">⚙️ Settings</div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.2); padding:8px; border-radius:8px; margin-bottom:10px;">
                    <div style="font-size:12px; font-weight:bold;">Show Relationship Bar</div>
                    <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
                        <input type="checkbox" id="dash-bar-toggle" ${isBarVisible ? 'checked' : ''} style="opacity:0; width:0; height:0;">
                        <span class="slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#ccc; transition:.4s; border-radius:34px;"></span>
                        <style>
                            .slider:before { position:absolute; content:""; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; }
                            input:checked + .slider { background-color: var(--catta-accent); }
                            input:checked + .slider:before { transform: translateX(14px); }
                        </style>
                    </label>
                </div>

                <div class="catta-label">🎫 Play Token</div>
                <div class="catta-input-group">
                    <input type="text" id="play-token-input" class="catta-input" placeholder="CODE-..." value="${playSession?playSession.token:''}">
                    <button id="btn-verify-token" class="catta-small-btn">Confirm</button>
                </div>
                ${playSession ? `<div style="margin-top:15px; text-align:center;"><button class="catta-main-btn" onclick="window.switchView('game')">Go to Game <i class="fa-solid fa-play"></i></button></div>` : ''}
                <div class="catta-spacer"></div>
                <button class="catta-outline-btn" onclick="window.logout()">Logout</button>
            </div>
        `;
    } else if (currentView === 'game') {

        let charListHtml = '';
        if (playSession && playSession.characters.length > 0) {
            const grouped = {};
            playSession.characters.forEach(c => {
                if(!grouped[c.creator]) grouped[c.creator] = [];
                grouped[c.creator].push(c);
            });
            for (const [creator, chars] of Object.entries(grouped)) {
                chars.forEach(char => {
                    const isActive = activeCharId === char.id;
                    const statusClass = isActive ? (isOnline ? 'status-online' : 'status-selected') : '';
                    charListHtml += `
                        <div class="catta-char-row ${statusClass}" onclick="window.selectChar('${char.id}')">
                            <img src="${char.avatar}" class="char-img" referrerpolicy="no-referrer" onerror="this.src='${DEFAULT_USER_ICON}'">
                            <div class="char-info">
                                <div class="char-name">${char.name}</div>
                                <div class="char-desc" style="font-size:9px;">${creator}</div>
                            </div>
                            ${isActive ? '<i class="fa-solid fa-paw" style="color:var(--catta-accent);"></i>' : ''}
                        </div>
                    `;
                });
            }
        } else {
            charListHtml = `<div class="catta-empty">No Characters</div>`;
        }
        contentHtml = `
            <div class="catta-game-header">
                <div class="creator-label">PLAY TOKEN REMAINING</div>
                <div id="catta-token-timer" class="timer-big">${formatTime(playSession.remaining)}</div>
            </div>
            <div class="catta-control-panel">
                <span id="catta-status-text" style="font-size:12px; font-weight:bold; opacity:0.8;">${isOnline?'นายท่านเชื่อมต่อกับตัวละครแล้วนะฮะ!(Online)':'กด 1 ครั้งเพื่อเริ่ม/ยกเลิกการเชื่อมต่อ!(Play!/Paused!)'}</span>
                <div class="catta-toggle-wrapper" id="catta-toggle-btn">
                    <div class="catta-toggle-circle"><i id="catta-toggle-icon" class="fa-solid fa-power-off"></i></div>
                </div>
            </div>
            
            <div style="padding:10px; text-align:center;">
                <button onclick="window.resetRelationship()" style="background:#444; color:#fff; border:none; padding:5px 10px; border-radius:5px; font-size:11px; cursor:pointer; width:100%;">
                    <i class="fa-solid fa-rotate-right"></i> Reset Relationship (Start New)
                </button>
            </div>

<!-- กล่องค้นหา -->
            <div style="padding:0 10px 10px 10px;">
                <input type="text" id="catta-char-search" class="catta-input" placeholder="🔍 ค้นหาชื่อบอท หรือชื่อคนสร้าง..." style="margin-bottom: 0; border-radius: 50px; text-align: center;" value="${currentSearchQuery}" onkeyup="window.updateCharSearch(this.value)">
            </div>

            <div class="catta-scroll-area">${charListHtml}</div>
        `;
    }

    const html = `
        <div class="catta-wrapper ${themeClass}">
            <div class="catta-header">
                <div style="display:flex; align-items:center; gap:5px;">
                    ${currentView === 'game' ? 
                      `<button class="catta-icon-btn" onclick="window.switchView('dashboard')"><i class="fa-solid fa-chevron-left"></i></button>` : 
                      `<span style="font-size:18px; display:inline-flex; align-items:center;">${CUSTOM_ICON_URL ? `<img src="${CUSTOM_ICON_URL}" style="height:22px; width:22px; object-fit:cover; border-radius:50%;">` : CAT_EMOJI}</span>`
                    }
                    <span>${currentView === 'game' ? 'Character Select' : 'Catta Café'}</span>
                </div>
                <div class="catta-header-actions">
                    <button class="catta-icon-btn" onclick="$('#theme-tray-hub').slideToggle(150)" title="เลือกสี"><i class="fa-solid fa-palette"></i></button>
                    <button class="catta-icon-btn" onclick="$('#catta-popup').animate({opacity:0}, 150, function(){ $(this).hide(); })"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <!-- ถาดเลือกสี (ซ่อนอยู่) -->
            <div id="theme-tray-hub" style="display:none; background:rgba(0,0,0,0.08); padding:10px; border-bottom:1px solid rgba(0,0,0,0.1);">
                <div style="font-size:10px; font-weight:bold; margin-bottom:6px; opacity:0.7; text-align:center;">🎨 เลือกจานสีที่คุณชอบ</div>
                <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                    <div class="theme-dot" style="background:#F57C00;" onclick="window.setTheme(0)" title="Warm"></div>
                    <div class="theme-dot" style="background:#F06292;" onclick="window.setTheme(1)" title="Sweet"></div>
                    <div class="theme-dot" style="background:#000000;" onclick="window.setTheme(2)" title="Dante"></div>
                    <div class="theme-dot" style="background:#2196F3;" onclick="window.setTheme(3)" title="Blue"></div>
                    <div class="theme-dot" style="background:#00BFA5;" onclick="window.setTheme(4)" title="Mint"></div>
                    <div class="theme-dot" style="background:#4B0082;" onclick="window.setTheme(5)" title="Purple"></div>
                    <div class="theme-dot" style="background:#800040;" onclick="window.setTheme(6)" title="Pink"></div>
                    <div class="theme-dot" style="background:#FFFFFF; border:2px solid #CCC;" onclick="window.setTheme(7)" title="White"></div>
                    <div class="theme-dot" style="background:#4D3A2F;" onclick="window.setTheme(8)" title="Espresso"></div>
                    <div class="theme-dot" style="background:#4AB4D5;" onclick="window.setTheme(9)" title="Ocean"></div>
                    <div class="theme-dot" style="background:#EA3E70;" onclick="window.setTheme(10)" title="Berry"></div>
                </div>
            </div>
            ${contentHtml}
        </div>
    `;
    $('#catta-popup').html(html);

    $('#btn-verify-token').on('click', () => {
        const t = $('#play-token-input').val().trim();
        if(t) activatePlayToken(t);
    });

    $('#dash-bar-toggle').on('change', function() {
        const isChecked = $(this).is(':checked');
        localStorage.setItem(`${extensionName}:bar_visible`, String(isChecked));
        renderPsycheBar(); 

        $(`#${extensionName}-bar-toggle`).prop('checked', isChecked);
    });

    $(document).off('click', '#catta-toggle-btn').on('click', '#catta-toggle-btn', function() {
        if(isOnline) goOffline("นายท่านถอนการเชื่อมต่อกับตัวละครแล้วฮะ!");
        else {
            if(activeCharId) goOnline(activeCharId);
            else toastr.warning("Select character first");
        }
    });

    window.updateCharSearch = (val) => {
        currentSearchQuery = val;
        const q = val.toLowerCase();
        $('.catta-char-row').each(function(){
            $(this).text().toLowerCase().includes(q) ? $(this).show() : $(this).hide();
        });
    };

    if (currentView === 'game' && currentSearchQuery) {
        window.updateCharSearch(currentSearchQuery);
    }

    window.switchView = (v) => { 
        currentView = v; 
        if(v === 'dashboard') currentSearchQuery = ''; 
        renderHubUI(); 
    };

    window.selectChar = (id) => {
        if (isOnline) { toastr.warning("Pause first"); return; }
        activeCharId = id;
        renderHubUI(); 
        syncPsycheFromServer();
    };

    window.setTheme = (index) => {
        const oldTheme = themes[themeIndex];
        themeIndex = index;
        const newTheme = themes[themeIndex];

        $('.catta-wrapper').removeClass(oldTheme).addClass(newTheme);

        localStorage.setItem('catta_theme', themeIndex);

        $('#theme-tray-login, #theme-tray-hub').slideUp(150);
    };

    window.logout = logout;
    window.resetRelationship = resetRelationship;
}

function logout() {
    if (sessionCheckInterval) clearInterval(sessionCheckInterval);

    authSession = null;
    playSession = null;
    isOnline = false;
    hiddenPrompt = "";
    currentSessionID = null;
    isManualReset = false;
    currentRankAssets = {};
    currentSearchQuery = ''; // ✅ ล้างคำค้นหาเมื่อ Logout
    localStorage.removeItem('catta_auth_token');
    localStorage.removeItem('catta_play_token');
    stopGameHeartbeat();
    if (rankVisualTimer) clearInterval(rankVisualTimer);
    renderLoginUI();
    $('#catta-psyche-bar').remove();
    location.reload(); 
}


function mountCattaHub() {
    if (document.getElementById('catta-float-btn')) return;

    const floatBtn = document.createElement('div');
    floatBtn.id = "catta-float-btn";
    floatBtn.title = "Open CattaHub";
    floatBtn.setAttribute('draggable', 'false');
    floatBtn.ondragstart = function() { return false; }; 
    
    const popup = $(`<div id="catta-popup" style="display:none;"></div>`);
    $('body').append(floatBtn).append(popup);

    const btn = floatBtn; 
    btn.style.top = '120px'; btn.style.left = '20px';

    function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

    let isDragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0, pressStartTime = 0;

    function onPointerDown(e) {

        if (e.type === 'touchstart' && e.cancelable) {
            e.preventDefault(); 
        }

        if(e.stopPropagation) e.stopPropagation();
        isDragging = false;
        pressStartTime = Date.now();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX; startY = clientY;
        const rect = btn.getBoundingClientRect();
        startLeft = rect.left; startTop = rect.top;

        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchend', onPointerUp);


        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchend', onPointerUp);
    }

    function onPointerMove(e) {

        if (e.touches && e.touches.length > 1) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - startX; const dy = clientY - startY;
        
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            isDragging = true;
            if(e.cancelable && e.preventDefault) e.preventDefault(); 
            const vw = window.innerWidth; const vh = window.innerHeight;
            const w = 60; const h = 60;
            const nextLeft = clamp(startLeft + dx, 5, vw - w - 5);
            const nextTop = clamp(startTop + dy, 5, vh - h - 5);
            btn.style.left = `${nextLeft}px`; btn.style.top = `${nextTop}px`;
        }
    }

    function onPointerUp(e) {
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchend', onPointerUp);
        
        const pressDuration = Date.now() - pressStartTime;
        if (!isDragging && pressDuration < 500) {
            const $pop = $('#catta-popup');
            if ($pop.is(':visible')) $pop.animate({opacity: 0}, 150, function(){ $(this).hide(); });
            else {
                const rect = btn.getBoundingClientRect();
                let top = rect.top; let left = rect.left + 70;
                if (left + 320 > window.innerWidth) left = rect.left - 320; 
                if (top + 500 > window.innerHeight) top = window.innerHeight - 500;
                if (top < 10) top = 10; if (left < 0) left = 10;
                $pop.css({top: top, left: left, display: 'flex', opacity: 0}).animate({ opacity: 1 }, 200);
            }
        }
    }

    window.addEventListener('resize', () => {
        const rect = btn.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const w = 60; const h = 60;
        
        let newLeft = rect.left;
        let newTop = rect.top;
        
        if (rect.left > vw - w - 5) newLeft = vw - w - 5;
        if (rect.left < 5) newLeft = 5;
        
        if (rect.top > vh - h - 5) newTop = vh - h - 5;
        if (rect.top < 5) newTop = 5;
        
        if (newLeft !== rect.left || newTop !== rect.top) {
            btn.style.left = `${newLeft}px`;
            btn.style.top = `${newTop}px`;
        }
    });

    btn.addEventListener('mousedown', onPointerDown);
    btn.addEventListener('touchstart', onPointerDown, { passive: false });

    renderLoginUI(); 
    const savedUid = localStorage.getItem('catta_uid');
    const savedAuth = localStorage.getItem('catta_auth_token');
    if (savedUid && savedAuth) loginToAuth(savedUid, savedAuth);
}

function unmountCattaHub() {
    $('#catta-float-btn').remove();
    $('#catta-popup').remove();
    $('#catta-psyche-bar').remove();
    if(barCheckInterval) clearInterval(barCheckInterval);
}

function forceExternalMediaAllowed() {
    if (typeof user_settings !== 'undefined') {
        if (user_settings.allow_external_media !== true) {
            user_settings.allow_external_media = true;
        }
    }
}

function loadCattaHubSettings() {
    const enabledKey = `${extensionName}:enabled`;
    const storedVal = localStorage.getItem(enabledKey);
    const enabled = storedVal === null ? true : (storedVal === 'true');

    const barKey = `${extensionName}:bar_visible`;
    const barVal = localStorage.getItem(barKey);
    const barVisible = barVal === null ? true : (barVal === 'true');

    // 🌟 แก้ตรงนี้: ย้ายคำสั่งเรียกน้องแคตต้า (mountCattaHub) ขึ้นมาไว้ข้างบนสุด!
    // ถึงหน้าตั้งค่าของ SillyTavern จะยังโหลดไม่เสร็จ น้องแคตต้าก็จะโผล่มาแน่นอน
    if (enabled) {
        setTimeout(mountCattaHub, 1000);
        setInterval(forceExternalMediaAllowed, 2000);
        if(barCheckInterval) clearInterval(barCheckInterval);
        barCheckInterval = setInterval(renderPsycheBar, 3000);
    }

    const extSettings = $('#extensions_settings');
    // ถ้าหน้าตั้งค่ายังไม่มา ให้หยุดทำปุ่มตั้งค่า (แต่น้องแคตต้าด้านบนทำงานไปแล้ว!)
    if (extSettings.length === 0) return; 

    $('.catta-hub-settings').remove();

    const settingsHtml = `
    <div class="catta-hub-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Catta Café Hub (Ultimate)</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                
                <!-- Main Toggle -->
                <div class="catta-settings-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px; margin-bottom:5px;">
                    <div class="inline-drawer-text">Enable Overlay System</div>
                    <label class="checkbox_label" for="${extensionName}-enabled" style="margin:0;">
                        <input id="${extensionName}-enabled" type="checkbox" ${enabled ? 'checked' : ''}>
                        <span class="checkbox_box"></span>
                    </label>
                </div>

                <!-- Relationship Bar Toggle -->
                <div class="catta-settings-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                    <div class="inline-drawer-text" title="ซ่อนหลอดคะแนน แต่ยังเก็บแต้มปกติ">Show Relationship Bar</div>
                    <label class="checkbox_label" for="${extensionName}-bar-toggle" style="margin:0;">
                        <input id="${extensionName}-bar-toggle" type="checkbox" ${barVisible ? 'checked' : ''}>
                        <span class="checkbox_box"></span>
                    </label>
                </div>

            </div>
        </div>
    </div>
    `;

    extSettings.append(settingsHtml);
    const $root = $('.catta-hub-settings');
    
    $root.find('.inline-drawer-toggle').on('click', function () {
        $(this).toggleClass('open');
        $root.find('.inline-drawer-icon').toggleClass('down up');
        $root.find('.inline-drawer-content').toggleClass('open');
    });

    $root.find(`#${extensionName}-enabled`).on('change', function () {
        const isEnabled = this.checked;
        localStorage.setItem(enabledKey, String(isEnabled));
        if (isEnabled) { mountCattaHub(); } else { unmountCattaHub(); }
    });

$root.find(`#${extensionName}-bar-toggle`).on('change', function () {
        const isVisible = this.checked;
        localStorage.setItem(barKey, String(isVisible));
        renderPsycheBar();
    });
}

$('body').append(`
<style>
    .theme-warm { --catta-bg: #FFF8E1; --catta-bg-sec: #FFECB3; --catta-text: #5D4037; --catta-accent: #FF6F00; --catta-header-bg: #F57C00; --catta-status-online: #43A047; --catta-toggle-off: #BDBDBD; }
    .theme-sweet { --catta-bg: #FFF0F5; --catta-bg-sec: #F8BBD0; --catta-text: #880E4F; --catta-accent: #EC407A; --catta-header-bg: #F06292; --catta-status-online: #00897B; --catta-toggle-off: #CFD8DC; }
    .theme-dante { --catta-bg: #212121; --catta-bg-sec: #333333; --catta-text: #EEEEEE; --catta-accent: #D32F2F; --catta-header-bg: #000000; --catta-status-online: #C62828; --catta-toggle-off: #616161; }
    .theme-blue { --catta-bg: #E3F2FD; --catta-bg-sec: #BBDEFB; --catta-text: #0D47A1; --catta-accent: #1976D2; --catta-header-bg: #2196F3; --catta-status-online: #43A047; --catta-toggle-off: #BDBDBD; }
    .theme-mintdark { --catta-bg: #121212; --catta-bg-sec: #1E1E1E; --catta-text: #A7FFEB; --catta-accent: #1DE9B6; --catta-header-bg: #00BFA5; --catta-status-online: #00E676; --catta-toggle-off: #424242; }
    .theme-purpledark { --catta-bg: #12001C; --catta-bg-sec: #230036; --catta-text: #E0B3FF; --catta-accent: #9D00FF; --catta-header-bg: #4B0082; --catta-status-online: #00E676; --catta-toggle-off: #424242; }
    .theme-pinkdark { --catta-bg: #1C000D; --catta-bg-sec: #2E0016; --catta-text: #FFB3D9; --catta-accent: #FF007F; --catta-header-bg: #800040; --catta-status-online: #00E676; --catta-toggle-off: #424242; }
    .theme-white { --catta-bg: #FFFFFF; --catta-bg-sec: #F5F5F5; --catta-text: #333333; --catta-accent: #9E9E9E; --catta-header-bg: #E0E0E0; --catta-status-online: #43A047; --catta-toggle-off: #BDBDBD; }
    .theme-espresso { --catta-bg: #D4CDA4; --catta-bg-sec: #9B8164; --catta-text: #4D3A2F; --catta-accent: #AD422C; --catta-header-bg: #4D3A2F; --catta-status-online: #557A46; --catta-toggle-off: #9B8164; }
    .theme-ocean { --catta-bg: #C1D7E8; --catta-bg-sec: #90C2C2; --catta-text: #2C3E50; --catta-accent: #FF8A25; --catta-header-bg: #4AB4D5; --catta-status-online: #8BA96A; --catta-toggle-off: #90C2C2; }
    .theme-berry { --catta-bg: #FFF0F5; --catta-bg-sec: #F8BBD0; --catta-text: #4A154B; --catta-accent: #FFD447; --catta-header-bg: #EA3E70; --catta-status-online: #557A46; --catta-toggle-off: #BE415A; }

    .theme-dot {
        width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
        border: 2px solid rgba(255,255,255,0.6); box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: transform 0.2s; flex-shrink: 0;
    }
    .theme-dot:hover { transform: scale(1.3); border-color: #FFF; }

    #catta-float-btn { 
        position: fixed; top: 120px; left: 20px; width: 60px; height: 60px; 
        border-radius: 50%; /* Removed box-shadow */
        cursor: pointer; z-index: 2147483647; overflow:hidden; background: transparent; border: none;
        touch-action: none; user-select: none; -webkit-user-drag: none;
    }
    #catta-float-btn:active { transform: scale(0.95); }

    #catta-popup {
        position: fixed; width: 300px; max-height: 85vh; 
        z-index: 2147483647; 
        font-family: 'Segoe UI', Tahoma, sans-serif;
        border-radius: 16px; overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        display: none; flex-direction: column;
        backdrop-filter: blur(5px);
    }
    .catta-wrapper {
        background: var(--catta-bg); color: var(--catta-text);
        display: flex; flex-direction: column; height: 100%;
        border: 1px solid rgba(0,0,0,0.1);
    }
    .catta-header {
        background: var(--catta-header-bg); color: #FFF;
        padding: 10px 15px; display: flex; justify-content: space-between; align-items: center;
        font-weight: bold; font-size: 14px; flex-shrink: 0;
    }
    .catta-icon-btn {
        background: rgba(255,255,255,0.2); border: none; color: #FFF;
        width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
        display:flex; justify-content:center; align-items:center; margin-left: 5px;
    }
    .catta-body { padding: 15px; display: flex; flex-direction: column; overflow-y: auto; }
    .catta-body.centered { align-items: center; text-align: center; }

    .catta-input {
        width: 100%; padding: 8px 10px; margin-bottom: 10px; font-size: 13px;
        border: 1px solid rgba(0,0,0,0.1); border-radius: 8px;
        background: rgba(255,255,255,0.8); color: #333; box-sizing: border-box;
    }
    .catta-input-group { display: flex; gap: 5px; width: 100%; }

    .catta-main-btn {
        width: 100%; padding: 10px; border: none; border-radius: 8px;
        background: var(--catta-accent); color: #FFF;
        font-weight: bold; cursor: pointer; margin-top: 5px; font-size: 13px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .catta-small-btn {
        background: var(--catta-header-bg); color: #FFF; border: none;
        border-radius: 6px; padding: 0 12px; cursor: pointer; font-weight: bold; font-size: 12px; white-space: nowrap;
    }
    .catta-outline-btn {
        background: transparent; border: 1px solid var(--catta-text);
        color: var(--catta-text); padding: 5px; border-radius: 6px;
        cursor: pointer; font-size: 11px; width: 100%; opacity: 0.6;
    }
    .catta-label { font-size: 11px; font-weight: bold; opacity: 0.8; margin-bottom: 3px; align-self: flex-start; text-transform:uppercase; letter-spacing: 0.5px;}
    .catta-divider { height: 1px; background: rgba(0,0,0,0.1); width: 100%; margin: 12px 0; }
    .catta-spacer { flex-grow: 1; min-height: 10px; }

    .catta-profile-card { display: flex; align-items: center; gap: 12px; width: 100%; background: rgba(255,255,255,0.3); padding: 8px; border-radius: 10px; }
    .profile-pic { width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--catta-accent); object-fit: cover; }
    .profile-info { flex-grow: 1; }
    .profile-name { font-size: 15px; font-weight: bold; }
    .profile-rank { font-size: 11px; font-weight: bold; opacity: 0.9; }

    .catta-game-header { text-align: center; padding: 10px; background: var(--catta-bg-sec); flex-shrink: 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
    .creator-label { font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; }
    .timer-big { font-size: 24px; font-family: 'Courier New', monospace; font-weight: bold; color: var(--catta-accent); text-shadow: 1px 1px 0 rgba(255,255,255,0.5); }
    
    .catta-control-panel { 
        display: flex; justify-content: space-between; align-items: center; padding: 10px 15px;
        background: rgba(255,255,255,0.2); border-bottom: 1px solid rgba(0,0,0,0.05); flex-shrink: 0;
    }

    /* NEUMORPHIC TOGGLE */
    .catta-toggle-wrapper {
        position: relative; width: 54px; height: 28px;
        background: var(--catta-toggle-off); 
        border-radius: 20px;
        cursor: pointer;
        box-shadow: inset 1px 1px 3px rgba(0,0,0,0.2), inset -1px -1px 3px rgba(255,255,255,0.5);
        transition: all 0.3s ease;
    }
    .catta-toggle-circle {
        position: absolute; top: 3px; left: 3px;
        width: 22px; height: 22px;
        background: white;
        border-radius: 50%;
        box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        display: flex; justify-content: center; align-items: center;
    }
    .catta-toggle-circle i { font-size: 12px; color: #999; transition: 0.3s; }
    .catta-toggle-wrapper.active { background: var(--catta-status-online); }
    .catta-toggle-wrapper.active .catta-toggle-circle { transform: translateX(26px); }
    .catta-toggle-wrapper.active .catta-toggle-circle i { color: var(--catta-status-online); }

    .catta-scroll-area { max-height: 220px; overflow-y: auto; padding: 5px; background: rgba(0,0,0,0.02); flex-grow: 1; }
    .catta-char-row {
        display: flex; align-items: center; padding: 8px 10px; border-bottom: 1px solid rgba(0,0,0,0.05);
        cursor: pointer; border-radius: 6px; margin-bottom: 2px;
    }
    .catta-char-row:hover { background: rgba(255,255,255,0.5); }
    .catta-char-row.status-selected { background: var(--catta-bg-sec); border-left: 3px solid var(--catta-accent); }
    .catta-char-row.status-online { background: rgba(76, 175, 80, 0.1); border-left: 3px solid var(--catta-status-online); }
    
    .char-img {
        width: 45px; height: 45px;
        border-radius: 50%;
        object-fit: cover;
        margin-right: 10px;
        flex-shrink: 0;
        border: 1px solid rgba(0,0,0,0.1);
    }

    .catta-logo-bg {
        position: absolute; width: 100px; height: 100px; 
        background: var(--catta-accent); opacity: 0.2; 
        border-radius: 50%; top: -10px; left: 50%; transform: translateX(-50%); filter: blur(10px);
    }
</style>
`);

jQuery(async () => {
    loadCattaHubSettings(); 
    console.log(`🐱 ${extensionName} Ultimate Loaded.`);
    
    // Backup Event Listener (เผื่อไว้ แต่ไม่ใช้เป็นหลักแล้ว)
    if (window.eventSource && window.event_types) {
        window.eventSource.on(window.event_types.CHAT_CHANGED, () => {
            setTimeout(() => {
                syncPsycheFromServer();
                renderPsycheBar();
            }, 500); 
        });
    }
    setTimeout(() => renderPsycheBar(), 2000);
});
