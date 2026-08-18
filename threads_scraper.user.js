// ==UserScript==
// @name         Threads Full Post Scraper (DOM)
// @namespace    https://threads.com/
// @version      4.5.0
// @description  Scrape a Threads user's posts + replies via DOM parsing. Zero setup, no ad blocker issues. v4.5: "Author threads" mode recovers every sub-post of a thread (main + subs) from the page JSON.
// @author       You
// @match        https://www.threads.net/@*
// @match        https://www.threads.com/@*
// @match        https://threads.net/@*
// @match        https://threads.com/@*
// @icon         https://www.threads.net/favicon.ico
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ==================== CONFIG ====================
    const CONFIG = {
        scrollDelay: 1800,
        maxNoNew: 12,
    };

    // ==================== STYLES ====================
    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        #ts-panel {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 99999;
            background: #09090b;
            border: 1px solid #27272a;
            border-radius: 16px;
            padding: 20px;
            color: #fafafa;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 13px;
            min-width: 320px;
            max-width: 360px;
            box-shadow: 0 24px 48px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
            backdrop-filter: blur(12px);
            max-height: calc(100vh - 32px);
            overflow-y: auto;
        }
        #ts-panel::-webkit-scrollbar { width: 6px; }
        #ts-panel::-webkit-scrollbar-track { background: transparent; }
        #ts-panel::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 6px; }

        #ts-panel .ts-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #27272a;
        }

        #ts-panel .ts-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #fafafa;
            letter-spacing: -0.01em;
        }

        #ts-panel .ts-badge {
            font-size: 10px;
            font-weight: 500;
            padding: 2px 6px;
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 6px;
            color: #a1a1aa;
        }

        #ts-panel .close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: transparent;
            border: 1px solid #27272a;
            border-radius: 8px;
            color: #71717a;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        #ts-panel .close-btn:hover {
            background: #27272a;
            color: #fafafa;
            border-color: #3f3f46;
        }

        #ts-panel .ts-section {
            margin-bottom: 14px;
        }

        #ts-panel .ts-label {
            display: block;
            margin-bottom: 6px;
            color: #a1a1aa;
            font-size: 12px;
            font-weight: 500;
        }

        #ts-panel .ts-input {
            width: 100%;
            padding: 8px 12px;
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 8px;
            color: #fafafa;
            font-size: 13px;
            font-family: inherit;
            box-sizing: border-box;
            transition: border-color 0.15s ease;
            outline: none;
        }
        #ts-panel .ts-input:focus {
            border-color: #3f3f46;
        }

        #ts-panel .ts-switch {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 10px;
            margin-bottom: 14px;
            cursor: pointer;
            user-select: none;
        }
        #ts-panel .ts-switch:hover {
            border-color: #3f3f46;
        }
        #ts-panel .ts-switch-label {
            font-size: 13px;
            color: #e4e4e7;
            font-weight: 500;
        }
        #ts-panel .ts-toggle {
            position: relative;
            width: 36px;
            height: 20px;
            background: #27272a;
            border-radius: 10px;
            transition: background 0.2s ease;
            cursor: pointer;
        }
        #ts-panel .ts-toggle.active {
            background: #fafafa;
        }
        #ts-panel .ts-toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px;
            height: 16px;
            background: #71717a;
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        #ts-panel .ts-toggle.active::after {
            left: 18px;
            background: #09090b;
        }

        #ts-panel .ts-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 14px;
        }

        #ts-panel .ts-row {
            display: flex;
            gap: 8px;
        }
        #ts-panel .ts-row .btn-go { flex: 3; }
        #ts-panel .ts-row .btn-stop { flex: 1; }

        #ts-panel .ts-spinner {
            width: 14px;
            height: 14px;
            border: 2px solid rgba(9,9,11,0.25);
            border-top-color: #09090b;
            border-radius: 50%;
            animation: ts-spin 0.7s linear infinite;
            display: inline-block;
        }
        @keyframes ts-spin { to { transform: rotate(360deg); } }

        #ts-panel .ts-dl-menu {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 8px;
            padding: 8px;
            background: #0c0c0e;
            border: 1px solid #27272a;
            border-radius: 10px;
        }
        #ts-panel .btn-dl-main::after {
            content: '▾';
            font-size: 11px;
            margin-left: 2px;
            transition: transform 0.15s ease;
        }
        #ts-panel .btn-dl-main.open::after { transform: rotate(180deg); }

        #ts-panel .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 10px 16px;
            border: none;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 500;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.15s ease;
            outline: none;
        }
        #ts-panel .btn:hover:not(:disabled) { transform: translateY(-1px); }
        #ts-panel .btn:active:not(:disabled) { transform: translateY(0); }
        #ts-panel .btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

        #ts-panel .btn-go { background: #fafafa; color: #09090b; font-weight: 600; }
        #ts-panel .btn-go:hover:not(:disabled) { background: #e4e4e7; }

        #ts-panel .btn-stop { background: #dc2626; color: #fff; }
        #ts-panel .btn-stop:hover:not(:disabled) { background: #b91c1c; }

        #ts-panel .btn-dl { background: #18181b; color: #fafafa; border: 1px solid #27272a; }
        #ts-panel .btn-dl:hover:not(:disabled) { background: #27272a; border-color: #3f3f46; }

        #ts-panel .btn-csv { background: #18181b; color: #fafafa; border: 1px solid #27272a; }
        #ts-panel .btn-csv:hover:not(:disabled) { background: #27272a; border-color: #3f3f46; }

        #ts-panel .ts-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 14px;
        }
        #ts-panel .ts-stat {
            padding: 10px 12px;
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 10px;
        }
        #ts-panel .ts-stat-value {
            font-size: 18px;
            font-weight: 600;
            color: #fafafa;
            letter-spacing: -0.02em;
        }
        #ts-panel .ts-stat-label {
            font-size: 11px;
            color: #71717a;
            margin-top: 2px;
        }

        #ts-panel .ts-log {
            padding: 10px 12px;
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 10px;
            font-size: 11px;
            line-height: 1.7;
            max-height: 140px;
            overflow-y: auto;
            color: #a1a1aa;
            font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
        }
        #ts-panel .ts-log::-webkit-scrollbar { width: 4px; }
        #ts-panel .ts-log::-webkit-scrollbar-track { background: transparent; }
        #ts-panel .ts-log::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
        #ts-panel .ts-log .log-entry { padding: 2px 0; border-bottom: 1px solid #1f1f23; }
        #ts-panel .ts-log .log-entry:last-child { border-bottom: none; }
        #ts-panel .ts-log .log-time { color: #52525b; }
    `);

    // ==================== STATE ====================
    let isRunning = false;
    let shouldStop = false;
    let collectedPosts = new Map();

    // ==================== UI ====================
    function createPanel() {
        if (document.getElementById('ts-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'ts-panel';
        panel.innerHTML = `
            <div class="ts-header">
                <div class="ts-title">
                    <span>Threads Scraper</span>
                    <span class="ts-badge">v4.5</span>
                </div>
                <button class="close-btn" id="ts-x">✕</button>
            </div>

            <div class="ts-section">
                <label class="ts-label">Scroll delay (ms)</label>
                <input type="number" class="ts-input" id="ts-delay" value="${CONFIG.scrollDelay}" min="500" step="100">
            </div>

            <div class="ts-switch" id="ts-switch-replies">
                <span class="ts-switch-label">Include replies tab</span>
                <div class="ts-toggle active" id="ts-toggle-replies"></div>
            </div>

            <div class="ts-switch" id="ts-switch-authorthreads">
                <span class="ts-switch-label">Author threads (full sub-posts)</span>
                <div class="ts-toggle" id="ts-toggle-authorthreads"></div>
            </div>

            <div class="ts-switch" id="ts-switch-deep">
                <span class="ts-switch-label">Deep mode (scrape comments)</span>
                <div class="ts-toggle" id="ts-toggle-deep"></div>
            </div>

            <div class="ts-stats" id="ts-stats" style="display:none;">
                <div class="ts-stat">
                    <div class="ts-stat-value" id="ts-count-posts">0</div>
                    <div class="ts-stat-label">Posts</div>
                </div>
                <div class="ts-stat">
                    <div class="ts-stat-value" id="ts-count-text">0</div>
                    <div class="ts-stat-label">With text</div>
                </div>
            </div>

            <div class="ts-actions">
                <div class="ts-row">
                    <button class="btn btn-go" id="ts-go">
                        <span class="ts-spinner" id="ts-spin" style="display:none;"></span>
                        <svg id="ts-go-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                        <span id="ts-go-label">Start Scraping</span>
                    </button>
                    <button class="btn btn-stop" id="ts-stop" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                        Stop
                    </button>
                </div>
                <button class="btn btn-dl-main" id="ts-dl-main" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Download
                </button>
                <div class="ts-dl-menu" id="ts-dl-menu" style="display:none;">
                    <button class="btn btn-dl" id="ts-dl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/></svg>
                        JSON
                    </button>
                    <button class="btn btn-csv" id="ts-csv">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/></svg>
                        CSV
                    </button>
                    <button class="btn btn-csv" id="ts-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                        Markdown
                    </button>
                </div>
            </div>

            <div class="ts-log" id="ts-log">
                <div class="log-entry"><span class="log-time">ready</span> — Open any Threads profile and click Start</div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('ts-x').onclick = () => panel.remove();
        document.getElementById('ts-go').onclick = startScraping;
        document.getElementById('ts-stop').onclick = () => { shouldStop = true; };
        document.getElementById('ts-dl').onclick = downloadJSON;
        document.getElementById('ts-csv').onclick = downloadCSV;
        document.getElementById('ts-md').onclick = downloadMarkdown;

        // Download button reveals the format options.
        const dlMain = document.getElementById('ts-dl-main');
        const dlMenu = document.getElementById('ts-dl-menu');
        dlMain.onclick = () => {
            const open = dlMenu.style.display === 'none';
            dlMenu.style.display = open ? 'flex' : 'none';
            dlMain.classList.toggle('open', open);
        };

        const toggle = document.getElementById('ts-toggle-replies');
        document.getElementById('ts-switch-replies').onclick = () => {
            toggle.classList.toggle('active');
        };

        const toggleAuthor = document.getElementById('ts-toggle-authorthreads');
        document.getElementById('ts-switch-authorthreads').onclick = () => {
            toggleAuthor.classList.toggle('active');
        };

        const toggleDeep = document.getElementById('ts-toggle-deep');
        document.getElementById('ts-switch-deep').onclick = () => {
            toggleDeep.classList.toggle('active');
        };
    }

    function log(msg) {
        const el = document.getElementById('ts-log');
        if (el) {
            const t = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            el.innerHTML = `<div class="log-entry"><span class="log-time">${t}</span> ${msg}</div>` + el.innerHTML;
        }
        const statsEl = document.getElementById('ts-stats');
        if (statsEl) statsEl.style.display = 'grid';
        const countEl = document.getElementById('ts-count-posts');
        if (countEl) countEl.textContent = collectedPosts.size;
        const textEl = document.getElementById('ts-count-text');
        if (textEl) textEl.textContent = Array.from(collectedPosts.values()).filter(p => p.text).length;
        console.log('[TS]', msg);
    }

    function setBtns(state) {
        const go = document.getElementById('ts-go');
        const stop = document.getElementById('ts-stop');
        const dlMain = document.getElementById('ts-dl-main');
        const spin = document.getElementById('ts-spin');
        const goIcon = document.getElementById('ts-go-icon');
        const goLabel = document.getElementById('ts-go-label');
        const hasData = collectedPosts.size > 0;
        const busy = state === 'run' || state === 'enhance';

        // Spinner + label while working.
        if (spin) spin.style.display = busy ? 'inline-block' : 'none';
        if (goIcon) goIcon.style.display = busy ? 'none' : 'inline-block';
        if (goLabel) goLabel.textContent = busy ? 'Scraping…' : 'Start Scraping';

        if (state === 'run') {
            // Actively scrolling the timeline: nothing to download yet.
            go.disabled = true; stop.disabled = false; if (dlMain) dlMain.disabled = true;
        } else if (state === 'enhance') {
            // Timeline captured; a slower pass (threads/comments) is still running.
            // Let the user download now or stop early.
            go.disabled = true; stop.disabled = false; if (dlMain) dlMain.disabled = !hasData;
        } else {
            go.disabled = false; stop.disabled = true; if (dlMain) dlMain.disabled = !hasData;
        }
    }

    // ==================== DOM EXTRACTION ====================
    function extractPostsFromDOM() {
        const posts = [];
        const postLinks = document.querySelectorAll('a[href*="/post/"]');
        const seenCodes = new Set();

        for (const link of postLinks) {
            const href = link.getAttribute('href');
            const match = href.match(/\/post\/([A-Za-z0-9_-]+)/);
            if (!match) continue;

            const code = match[1];
            if (seenCodes.has(code)) continue;
            seenCodes.add(code);

            // Find post container by walking up the DOM tree
            let container = null;
            let el = link;
            for (let i = 0; i < 12; i++) {
                if (!el.parentElement) break;
                el = el.parentElement;
                // A good container has text elements AND is reasonably large
                if (el.querySelector('span[dir="auto"], div[dir="auto"]') && el.offsetHeight > 60) {
                    container = el;
                }
                // Stop at data-pressable-container
                if (el.hasAttribute('data-pressable-container')) {
                    container = el;
                    break;
                }
            }
            if (!container) continue;

            // === TEXT EXTRACTION ===
            // Get ALL text nodes from span/div with dir="auto"
            let text = '';
            const textEls = container.querySelectorAll('span[dir="auto"], div[dir="auto"]');
            const candidates = [];

            for (const tel of textEls) {
                const t = (tel.innerText || tel.textContent || '').trim();
                if (t.length < 3) continue;

                // Skip elements inside profile/username links
                const parentLink = tel.closest('a');
                if (parentLink) {
                    const linkHref = parentLink.getAttribute('href') || '';
                    // Allow if it's the post link itself, skip if it's a profile link
                    if (linkHref.includes('/@') && !linkHref.includes('/post/')) continue;
                }

                // Skip timestamps (1h, 2d, 3w, 5m, etc)
                if (/^\d+[smhdw]$/.test(t)) continue;
                // Skip button labels
                if (['Ikuti', 'Follow', 'Diikuti', 'Following', 'Lainnya', 'More'].includes(t)) continue;
                // Skip very short single words that are likely UI elements
                if (t.length < 10 && !t.includes(' ')) continue;

                candidates.push(t);
            }

            // The post text is typically the longest candidate
            // But also concatenate if there are multiple meaningful blocks (threaded text)
            if (candidates.length === 1) {
                text = candidates[0];
            } else if (candidates.length > 1) {
                // Take the longest one — usually the main post body
                text = candidates.reduce((a, b) => a.length >= b.length ? a : b, '');
            }

            // === TIME ===
            let timeText = '';
            const timeEl = container.querySelector('time');
            if (timeEl) {
                timeText = timeEl.getAttribute('datetime') || timeEl.textContent || '';
            }

            // === LIKE COUNT ===
            let likeCount = 0;
            // Method 1: aria-label on buttons/links
            const ariaEls = container.querySelectorAll('[aria-label]');
            for (const ael of ariaEls) {
                const label = (ael.getAttribute('aria-label') || '').toLowerCase();
                if (label.includes('suka') || label.includes('like') || label.includes('heart')) {
                    const m = label.match(/(\d[\d.,]*)/);
                    if (m) { likeCount = parseInt(m[1].replace(/[.,]/g, '')); break; }
                }
            }
            // Method 2: look for number near heart/like SVG
            if (likeCount === 0) {
                const svgs = container.querySelectorAll('svg[aria-label*="Suka"], svg[aria-label*="Like"], svg[aria-label*="suka"], svg[aria-label*="like"]');
                for (const svg of svgs) {
                    const parent = svg.closest('[role="button"]') || svg.parentElement?.parentElement;
                    if (parent) {
                        const numText = parent.textContent.trim();
                        const m = numText.match(/^(\d[\d.,]*)/);
                        if (m) { likeCount = parseInt(m[1].replace(/[.,]/g, '')); break; }
                    }
                }
            }

            // === USERNAME ===
            const userMatch = href.match(/\/@([^/]+)\/post\//);
            const username = userMatch ? userMatch[1] : '';

            // === IMAGES ===
            const images = [];
            const imgs = container.querySelectorAll('img');
            for (const img of imgs) {
                const src = img.src || '';
                if (!src) continue;
                // Skip profile pics (small, 150x150)
                if (src.includes('150x150') || src.includes('s150x150')) continue;
                if (img.width > 0 && img.width < 50) continue;
                if (img.height > 0 && img.height < 50) continue;
                // Skip if alt text suggests profile pic
                const alt = (img.alt || '').toLowerCase();
                if (alt.includes('profil') || alt.includes('profile pic')) continue;
                // Must be from CDN
                if (src.includes('cdninstagram') || src.includes('scontent')) {
                    images.push(src);
                }
            }

            // === VIDEO ===
            const hasVideo = container.querySelector('video') !== null ||
                             container.querySelector('[aria-label*="video"], [aria-label*="Video"]') !== null;

            posts.push({
                code,
                text,
                username,
                time: timeText,
                like_count: likeCount,
                images: [...new Set(images)],
                has_video: hasVideo,
                url: `https://${window.location.hostname}/@${username}/post/${code}`,
            });
        }

        return posts;
    }

    // ==================== SCROLL LOGIC ====================
    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    async function scrollAndWait(delay) {
        const prev = document.body.scrollHeight;

        // Scroll 70% of viewport — keeps posts visible longer for text extraction
        window.scrollBy(0, window.innerHeight * 0.6);
        await sleep(delay);

        if (document.body.scrollHeight > prev) return true;

        // Try full scroll to bottom
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(1500);
        return document.body.scrollHeight > prev;
    }

    // ==================== MAIN SCRAPING ====================
    async function startScraping() {
        if (isRunning) return;
        isRunning = true;
        shouldStop = false;
        collectedPosts.clear();
        setBtns('run');

        const delay = parseInt(document.getElementById('ts-delay').value) || CONFIG.scrollDelay;
        const includeReplies = document.getElementById('ts-toggle-replies').classList.contains('active');
        const authorThreads = document.getElementById('ts-toggle-authorthreads').classList.contains('active');
        const deepMode = document.getElementById('ts-toggle-deep').classList.contains('active');

        log('🚀 Starting...');

        window.scrollTo(0, 0);
        await sleep(1000);

        // Phase 1: Posts tab
        log('📝 Scraping posts...');
        await scrapeCurrentTab(delay);

        // Phase 2: Replies tab
        if (includeReplies && !shouldStop) {
            log('💬 Switching to Replies...');
            const repliesTab = findRepliesTab();
            if (repliesTab) {
                repliesTab.click();
                await sleep(2000);
                window.scrollTo(0, 0);
                await sleep(1000);
                const before = collectedPosts.size;
                await scrapeCurrentTab(delay);
                log(`💬 Replies: +${collectedPosts.size - before}`);
                const threadsTab = findThreadsTab();
                if (threadsTab) threadsTab.click();
            } else {
                log('⚠️ Replies tab not found');
            }
        }

        // Timeline is done. Surface the download buttons NOW so the basic scrape
        // is available immediately, even while the slower passes below run.
        if ((authorThreads || deepMode) && !shouldStop) {
            setBtns('enhance');
        }

        // Phase 3: Author threads — recover full multi-part threads (main + all sub-posts)
        if (authorThreads && !shouldStop) {
            log(`🧵 Author threads: scanning ${collectedPosts.size} posts (you can download now or stop early)...`);
            await scrapeAuthorThreads(delay);
        }

        // Phase 4: Deep mode — open each post and scrape comments
        if (deepMode && !shouldStop) {
            log('🔍 Deep mode: scraping comments...');
            await scrapeDeepComments(delay);
        }

        if (shouldStop) log('⏹ Stopped');
        isRunning = false;
        setBtns('done');

        const withText = Array.from(collectedPosts.values()).filter(p => p.text).length;
        log(`✅ Done: ${collectedPosts.size} posts (${withText} with text)`);
    }

    async function scrapeCurrentTab(delay) {
        let noNewCount = 0;
        let scrollCount = 0;

        while (!shouldStop) {
            scrollCount++;
            const prevCount = collectedPosts.size;

            // Extract & merge
            const posts = extractPostsFromDOM();
            for (const p of posts) {
                if (!p.code) continue;
                const existing = collectedPosts.get(p.code);
                if (!existing) {
                    collectedPosts.set(p.code, p);
                } else {
                    if (p.text && !existing.text) existing.text = p.text;
                    if (p.like_count && !existing.like_count) existing.like_count = p.like_count;
                    if (p.time && !existing.time) existing.time = p.time;
                    if (p.images.length && !existing.images.length) existing.images = p.images;
                    if (p.has_video && !existing.has_video) existing.has_video = p.has_video;
                }
            }

            const newCount = collectedPosts.size - prevCount;
            if (scrollCount % 3 === 0 || newCount > 0) {
                log(`#${scrollCount} +${newCount} → ${collectedPosts.size}`);
            }

            const grew = await scrollAndWait(delay);

            if (newCount === 0) {
                noNewCount++;
                if (noNewCount >= CONFIG.maxNoNew) {
                    // Final extraction
                    const final = extractPostsFromDOM();
                    for (const p of final) {
                        if (!p.code) continue;
                        const ex = collectedPosts.get(p.code);
                        if (!ex) collectedPosts.set(p.code, p);
                        else { if (p.text && !ex.text) ex.text = p.text; }
                    }
                    log(`🏁 Complete: ${collectedPosts.size} posts`);
                    break;
                }
            } else {
                noNewCount = 0;
            }

            if (!grew && noNewCount >= 5) {
                log(`🏁 End of feed: ${collectedPosts.size}`);
                break;
            }
        }
    }

    function findRepliesTab() {
        const tabs = document.querySelectorAll('[role="tab"]');
        for (const tab of tabs) {
            const t = tab.textContent.toLowerCase();
            if (t.includes('replies') || t.includes('balasan')) return tab;
        }
        const els = document.querySelectorAll('div, span');
        for (const el of els) {
            if (el.children.length > 3) continue;
            const t = el.textContent.trim().toLowerCase();
            if ((t === 'replies' || t === 'balasan') && el.offsetParent) return el;
        }
        return null;
    }

    function findThreadsTab() {
        const tabs = document.querySelectorAll('[role="tab"]');
        for (const tab of tabs) {
            const t = tab.textContent.toLowerCase();
            if (t.includes('thread')) return tab;
        }
        const els = document.querySelectorAll('div, span');
        for (const el of els) {
            if (el.children.length > 3) continue;
            const t = el.textContent.trim().toLowerCase();
            if ((t === 'threads' || t === 'thread') && el.offsetParent) return el;
        }
        return null;
    }

    // ==================== AUTHOR THREADS ====================
    // For every collected post, fetch its page JSON and pull the FULL thread:
    // the author's own main post + all continuation sub-posts, in order.
    // A single fetch of any part returns the whole thread, so parts already
    // recovered are skipped. Non-thread single posts are left untouched.
    async function scrapeAuthorThreads(delay) {
        const pathMatch = window.location.pathname.match(/^\/@([^/]+)/);
        const creator = pathMatch ? pathMatch[1] : '';
        if (!creator) { log('⚠️ Cannot detect profile username'); return; }

        const posts = Array.from(collectedPosts.values());
        const doneCodes = new Set();
        let threadsFound = 0;
        let subPostsAdded = 0;
        let checked = 0;

        for (const post of posts) {
            if (shouldStop) break;
            if (!post.code || doneCodes.has(post.code)) continue;
            checked++;

            let parts = [];
            try {
                parts = await fetchAuthorThread(post.url || post.code, creator);
            } catch (e) {
                parts = [];
            }

            // Mark every recovered part so we do not refetch the same thread.
            for (const p of parts) if (p.code) doneCodes.add(p.code);

            if (parts.length > 1) {
                threadsFound++;
                // Attach the full thread to its ROOT (earliest) part.
                const root = parts[0];
                const rootEntry = collectedPosts.get(root.code) || {
                    code: root.code,
                    username: creator,
                    text: root.text || '',
                    time: root.time || '',
                    like_count: 0,
                    images: [],
                    has_video: false,
                    url: root.url,
                };
                if (!rootEntry.text && root.text) rootEntry.text = root.text;
                rootEntry.is_thread = true;
                rootEntry.thread_count = parts.length;
                rootEntry.thread_parts = parts.map((p, i) => ({
                    index: i + 1,
                    code: p.code,
                    text: p.text,
                    time: p.time,
                    url: p.url,
                }));
                collectedPosts.set(root.code, rootEntry);
                subPostsAdded += parts.length - 1;

                // Tag the other parts so they are not treated as standalone posts.
                for (let i = 1; i < parts.length; i++) {
                    const part = parts[i];
                    const partEntry = collectedPosts.get(part.code);
                    if (partEntry) {
                        partEntry.part_of_thread = root.code;
                        partEntry.thread_index = i + 1;
                    }
                }

                log(`🧵 ${threadsFound}: ${root.code} → ${parts.length} parts`);
            }

            if (checked % 10 === 0) log(`🧵 checked ${checked}/${posts.length}...`);
            await sleep(Math.max(600, delay) + Math.random() * 600);
        }

        log(`🧵 Author threads done: ${threadsFound} threads, +${subPostsAdded} sub-posts recovered`);
    }

    // Fetch one post page and return the author's own posts in the thread,
    // deduped by code and sorted oldest-first (main post is index 0).
    async function fetchAuthorThread(urlOrCode, creator) {
        const url = urlOrCode.startsWith('http')
            ? urlOrCode
            : `https://${window.location.hostname}/@${creator}/post/${urlOrCode}`;
        const creatorLower = (creator || '').toLowerCase();
        const byCode = new Map();

        const resp = await fetch(url, {
            headers: { 'Accept': 'text/html' },
            credentials: 'include',
        });
        if (!resp.ok) return [];

        const html = await resp.text();
        const scriptRegex = /<script[^>]*type="application\/json"[^>]*data-sjs[^>]*>([\s\S]*?)<\/script>/g;
        let match;

        while ((match = scriptRegex.exec(html)) !== null) {
            const content = match[1];
            if (!content.includes('thread_items')) continue;

            let data;
            try { data = JSON.parse(content); } catch (e) { continue; }

            const threadItems = findNestedKey(data, 'thread_items');
            for (const items of threadItems) {
                if (!Array.isArray(items)) continue;
                for (const item of items) {
                    const post = item?.post;
                    if (!post) continue;
                    const username = (post.user?.username || '').toLowerCase();
                    if (username !== creatorLower) continue; // author's own posts only
                    const code = post.code || '';
                    if (!code) continue;
                    if (!byCode.has(code)) {
                        byCode.set(code, {
                            code,
                            text: post.caption?.text || '',
                            time: post.taken_at ? new Date(post.taken_at * 1000).toISOString() : '',
                            taken_at: post.taken_at || 0,
                            username: post.user?.username || creator,
                            url: `https://${window.location.hostname}/@${post.user?.username || creator}/post/${code}`,
                        });
                    }
                }
            }
        }

        const arr = Array.from(byCode.values());
        arr.sort((a, b) => (a.taken_at || 0) - (b.taken_at || 0));
        return arr;
    }

    // ==================== DEEP MODE ====================
    async function scrapeDeepComments(delay) {
        const posts = Array.from(collectedPosts.values());
        const total = posts.length;
        let completed = 0;
        let totalConversations = 0;

        // Get the profile username (the creator)
        const pathMatch = window.location.pathname.match(/^\/@([^/]+)/);
        const creatorUsername = pathMatch ? pathMatch[1] : '';

        if (!creatorUsername) {
            log('⚠️ Cannot detect creator username');
            return;
        }

        for (const post of posts) {
            if (shouldStop) break;
            completed++;
            log(`🔍 Deep ${completed}/${total}: ${post.code}`);

            try {
                const allComments = await fetchPostComments(post.url || post.code);

                // Filter: only keep conversations where creator replied
                const conversations = filterCreatorConversations(allComments, creatorUsername);

                if (conversations.length > 0) {
                    post.conversations = conversations;
                    totalConversations += conversations.length;
                }
            } catch (e) {
                // skip failed posts
            }

            await sleep(delay);
        }

        log(`🔍 Deep done: ${totalConversations} conversations (creator replied)`);
    }

    function filterCreatorConversations(comments, creatorUsername) {
        /**
         * Only keep comments that are part of a conversation
         * where the creator actually replied.
         *
         * Returns array of conversation objects:
         * { user_comment: {...}, creator_reply: {...} }
         */
        const conversations = [];
        const creatorLower = creatorUsername.toLowerCase();

        // Find all creator replies
        const creatorReplies = comments.filter(c => c.username.toLowerCase() === creatorLower);

        if (creatorReplies.length === 0) return conversations;

        // For each non-creator comment, check if creator replied after it
        const otherComments = comments.filter(c => c.username.toLowerCase() !== creatorLower);

        for (const userComment of otherComments) {
            // Find creator reply that came after this comment
            const reply = creatorReplies.find(cr =>
                cr.published_on && userComment.published_on &&
                cr.published_on > userComment.published_on
            );

            if (reply) {
                conversations.push({
                    user_comment: {
                        text: userComment.text,
                        username: userComment.username,
                        time: userComment.published_on,
                    },
                    creator_reply: {
                        text: reply.text,
                        username: reply.username,
                        time: reply.published_on,
                    },
                });
            }
        }

        // Also include creator self-replies (creator replying to own post for context)
        // These are usually pinned comments or additional info
        if (otherComments.length === 0 && creatorReplies.length > 0) {
            for (const cr of creatorReplies) {
                conversations.push({
                    user_comment: null,
                    creator_reply: {
                        text: cr.text,
                        username: cr.username,
                        time: cr.published_on,
                    },
                });
            }
        }

        return conversations;
    }

    async function fetchPostComments(urlOrCode) {
        const url = urlOrCode.startsWith('http') ? urlOrCode : `https://${window.location.hostname}/t/${urlOrCode}/`;
        const comments = [];

        try {
            const resp = await fetch(url, {
                headers: { 'Accept': 'text/html' },
                credentials: 'include',
            });
            if (!resp.ok) return comments;

            const html = await resp.text();

            // Extract from hidden JSON script tags
            const scriptRegex = /<script[^>]*type="application\/json"[^>]*data-sjs[^>]*>([\s\S]*?)<\/script>/g;
            let match;

            while ((match = scriptRegex.exec(html)) !== null) {
                const content = match[1];
                if (!content.includes('thread_items')) continue;

                try {
                    const data = JSON.parse(content);
                    const threadItems = findNestedKey(data, 'thread_items');

                    for (const items of threadItems) {
                        if (!Array.isArray(items) || items.length < 2) continue;
                        // First item = original post, rest = comments
                        for (let i = 1; i < items.length; i++) {
                            const item = items[i];
                            const post = item?.post;
                            if (!post) continue;

                            comments.push({
                                text: post.caption?.text || '',
                                username: post.user?.username || '',
                                published_on: post.taken_at || null,
                                like_count: post.like_count || 0,
                                code: post.code || '',
                            });
                        }
                    }
                } catch (e) {
                    // skip parse errors
                }
            }
        } catch (e) {
            // fetch failed
        }

        return comments;
    }

    function findNestedKey(obj, key) {
        const results = [];
        function search(o) {
            if (!o || typeof o !== 'object') return;
            if (Array.isArray(o)) { for (const item of o) search(item); return; }
            for (const [k, v] of Object.entries(o)) {
                if (k === key) results.push(v);
                else search(v);
            }
        }
        search(obj);
        return results;
    }

    // ==================== DOWNLOAD JSON ====================
    function downloadJSON() {
        const posts = Array.from(collectedPosts.values());
        const pathMatch = window.location.pathname.match(/^\/@([^/]+)/);
        const username = pathMatch ? pathMatch[1] : 'unknown';

        const totalComments = posts.reduce((sum, p) => sum + (p.conversations?.length || 0), 0);
        const totalThreads = posts.filter(p => p.is_thread).length;
        const totalSubPosts = posts.reduce((sum, p) => sum + (p.thread_parts ? p.thread_parts.length - 1 : 0), 0);

        const result = {
            username,
            url: window.location.href,
            total: posts.length,
            total_with_text: posts.filter(p => p.text).length,
            total_threads: totalThreads,
            total_sub_posts: totalSubPosts,
            total_conversations: totalComments,
            scraped_at: new Date().toISOString(),
            posts,
        };

        const json = JSON.stringify(result, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const filename = `${username}_posts_${new Date().toISOString().slice(0, 10)}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`💾 ${filename}`);
    }

    // ==================== DOWNLOAD CSV ====================
    function downloadCSV() {
        const posts = Array.from(collectedPosts.values());
        const pathMatch = window.location.pathname.match(/^\/@([^/]+)/);
        const username = pathMatch ? pathMatch[1] : 'unknown';

        // CSV header
        const headers = ['code', 'username', 'text', 'time', 'like_count', 'has_video', 'images', 'url'];
        const rows = posts.map(p => [
            p.code,
            p.username,
            `"${(p.text || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            p.time,
            p.like_count,
            p.has_video,
            p.images.length,
            p.url,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `${username}_posts_${new Date().toISOString().slice(0, 10)}.csv`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`📊 ${filename}`);
    }

    // ==================== DOWNLOAD MARKDOWN ====================
    function downloadMarkdown() {
        const posts = Array.from(collectedPosts.values());
        const pathMatch = window.location.pathname.match(/^\/@([^/]+)/);
        const username = pathMatch ? pathMatch[1] : 'unknown';

        let md = `# @${username} — Threads Archive\n\n`;
        md += `> Scraped on ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
        md += `> Total: ${posts.length} posts\n\n`;
        md += `---\n\n`;

        for (const post of posts) {
            // Skip parts that belong to a thread — rendered under their root.
            if (post.part_of_thread) continue;

            // Post header
            const date = post.time ? new Date(post.time).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
            md += `## ${date}${post.is_thread ? ` — 🧵 Thread (${post.thread_count} parts)` : ''}\n\n`;

            // Post text — a thread renders all its numbered parts (main + sub-posts)
            if (post.is_thread && post.thread_parts && post.thread_parts.length > 0) {
                for (const part of post.thread_parts) {
                    md += `**${part.index}.** ${part.text || '*(no text)*'}\n\n`;
                }
            } else if (post.text) {
                md += `${post.text}\n\n`;
            } else {
                md += `*(no text — image/video only)*\n\n`;
            }

            // Media
            if (post.images && post.images.length > 0) {
                md += `📷 ${post.images.length} image(s)\n\n`;
            }
            if (post.has_video) {
                md += `🎬 Video\n\n`;
            }

            // Likes
            if (post.like_count > 0) {
                md += `❤️ ${post.like_count} likes\n\n`;
            }

            // Conversations (deep mode)
            if (post.conversations && post.conversations.length > 0) {
                md += `### 💬 Conversations\n\n`;
                for (const convo of post.conversations) {
                    if (convo.user_comment) {
                        md += `> **@${convo.user_comment.username}:** ${convo.user_comment.text}\n\n`;
                    }
                    if (convo.creator_reply) {
                        md += `> **@${convo.creator_reply.username} (creator):** ${convo.creator_reply.text}\n\n`;
                    }
                    md += `\n`;
                }
            }

            // Link
            md += `🔗 [Open post](${post.url})\n\n`;
            md += `---\n\n`;
        }

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `${username}_posts_${new Date().toISOString().slice(0, 10)}.md`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`📝 ${filename}`);
    }

    // ==================== SINGLE POST MODE ====================
    function isSinglePostPage() {
        return /\/@[^/]+\/post\/[A-Za-z0-9_-]+/.test(window.location.pathname) ||
               /\/t\/[A-Za-z0-9_-]+/.test(window.location.pathname);
    }

    function createSinglePostPanel() {
        if (document.getElementById('ts-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'ts-panel';
        panel.innerHTML = `
            <div class="ts-header">
                <div class="ts-title">
                    <span>Threads Scraper</span>
                    <span class="ts-badge">post</span>
                </div>
                <button class="close-btn" id="ts-x">✕</button>
            </div>

            <p style="color:#a1a1aa; margin:0 0 14px; font-size:12px; line-height:1.5;">
                Scrape all comments from this single post — answered or not.
            </p>

            <div class="ts-switch" id="ts-switch-replies">
                <span class="ts-switch-label">Ambil balasan (nested)</span>
                <div class="ts-toggle" id="ts-toggle-nested"></div>
            </div>

            <div class="ts-section" id="ts-threshold-section" style="display:none;">
                <label class="ts-label">Minimal balasan (skip jika kurang)</label>
                <input type="number" class="ts-input" id="ts-reply-threshold" value="1" min="1" step="1">
            </div>

            <div class="ts-stats" id="ts-stats" style="display:none;">
                <div class="ts-stat">
                    <div class="ts-stat-value" id="ts-count-posts">0</div>
                    <div class="ts-stat-label">Comments</div>
                </div>
                <div class="ts-stat">
                    <div class="ts-stat-value" id="ts-count-text">0</div>
                    <div class="ts-stat-label">Replies</div>
                </div>
            </div>

            <div class="ts-actions">
                <button class="btn btn-go" id="ts-go-single">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Scrape All Comments
                </button>
                <button class="btn btn-stop" id="ts-stop-single" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                    Stop
                </button>
                <button class="btn btn-dl" id="ts-dl" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    JSON
                </button>
                <button class="btn btn-csv" id="ts-md" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                    Markdown
                </button>
            </div>

            <div class="ts-log" id="ts-log">
                <div class="log-entry"><span class="log-time">ready</span> — Click to scrape all comments</div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('ts-x').onclick = () => panel.remove();
        document.getElementById('ts-go-single').onclick = scrapeSinglePost;
        document.getElementById('ts-stop-single').onclick = () => { shouldStop = true; };
        document.getElementById('ts-dl').onclick = downloadSingleJSON;
        document.getElementById('ts-md').onclick = downloadSingleMarkdown;

        const toggleNested = document.getElementById('ts-toggle-nested');
        const thresholdSection = document.getElementById('ts-threshold-section');
        document.getElementById('ts-switch-replies').onclick = () => {
            toggleNested.classList.toggle('active');
            thresholdSection.style.display = toggleNested.classList.contains('active') ? 'block' : 'none';
        };
    }

    let singlePostData = null;

    async function scrapeSinglePost() {
        const btn = document.getElementById('ts-go-single');
        const stopBtn = document.getElementById('ts-stop-single');
        btn.disabled = true;
        stopBtn.disabled = false;
        shouldStop = false;

        const includeReplies = document.getElementById('ts-toggle-nested').classList.contains('active');
        const replyThreshold = parseInt(document.getElementById('ts-reply-threshold')?.value) || 1;

        log('🔍 Scraping comments...');

        // Step 1: Extract from page hidden JSON (initial comments — high quality)
        const comments = [];
        const jsonTexts = new Set(); // Track text from JSON for dedup
        const scripts = document.querySelectorAll('script[type="application/json"][data-sjs]');

        for (const script of scripts) {
            const text = script.textContent;
            if (!text || !text.includes('thread_items')) continue;

            try {
                const data = JSON.parse(text);
                const threadItems = findNestedKey(data, 'thread_items');

                for (const items of threadItems) {
                    if (!Array.isArray(items)) continue;
                    for (const item of items) {
                        const post = item?.post;
                        if (!post) continue;

                        const commentText = post.caption?.text || '';
                        const commentUsername = post.user?.username || '';

                        // Skip entries without username or text
                        if (!commentUsername && !commentText) continue;

                        comments.push({
                            text: commentText,
                            username: commentUsername,
                            user_pic: post.user?.profile_pic_url || '',
                            published_on: post.taken_at || null,
                            like_count: post.like_count || 0,
                            code: post.code || '',
                            is_verified: post.user?.is_verified || false,
                            reply_count: post.text_post_app_info?.direct_reply_count
                                || post.direct_reply_count
                                || post.comment_count
                                || 0,
                            replies: [],
                        });

                        // Track for dedup
                        if (commentText) jsonTexts.add(commentText);
                    }
                }
            } catch (e) {}
        }

        // Step 2: Also extract from visible DOM (scroll to load more)
        log('📜 Scrolling for more comments...');
        let prevCount = comments.length;
        let noNew = 0;

        for (let i = 0; i < 30 && noNew < 5 && !shouldStop; i++) {
            window.scrollBy(0, window.innerHeight * 0.6);
            await sleep(1500);

            // Extract from DOM
            const domComments = extractCommentsFromDOM();
            for (const dc of domComments) {
                if (!dc.text || !dc.username) continue;

                // Normalize whitespace for comparison
                const dcNorm = dc.text.replace(/\s+/g, ' ').trim();

                // Dedup: exact match (with whitespace normalization)
                const exactMatch = comments.find(c =>
                    c.username === dc.username &&
                    c.text.replace(/\s+/g, ' ').trim() === dcNorm
                );
                if (exactMatch) continue;

                // Dedup: check if DOM text is a substring of an existing JSON comment
                let isFragment = false;
                for (const jsonText of jsonTexts) {
                    const jsonNorm = jsonText.replace(/\s+/g, ' ').trim();
                    if (jsonNorm.includes(dcNorm) || dcNorm.includes(jsonNorm)) {
                        isFragment = true;
                        break;
                    }
                }
                if (isFragment) continue;

                // Dedup: check if this text already exists from same user (partial overlap)
                const sameUserMatch = comments.find(c => {
                    if (c.username !== dc.username) return false;
                    const cNorm = c.text.replace(/\s+/g, ' ').trim();
                    return cNorm.includes(dcNorm) ||
                           dcNorm.includes(cNorm) ||
                           (dcNorm.length > 30 && cNorm.startsWith(dcNorm.substring(0, 30)));
                });
                if (sameUserMatch) {
                    if (dc.text.length > sameUserMatch.text.length) {
                        sameUserMatch.text = dc.text;
                    }
                    continue;
                }

                dc.replies = [];
                dc.reply_count = 0;
                comments.push(dc);
            }

            if (comments.length === prevCount) {
                noNew++;
            } else {
                noNew = 0;
                prevCount = comments.length;
            }
        }

        // Step 3: Final cleanup — remove invalid entries
        const cleanedComments = comments.filter(c => {
            if (!c.username) return false;
            if (!c.text || c.text.trim().length < 2) return false;
            return true;
        });

        // Separate original post from comments
        const originalPost = cleanedComments.length > 0 ? cleanedComments[0] : null;
        const allComments = cleanedComments.slice(1);

        log(`📝 ${allComments.length} comments found`);

        // Step 4: Fetch nested replies if enabled
        let totalReplies = 0;
        if (includeReplies && !shouldStop) {
            const commentsWithReplies = allComments.filter(c => c.code && c.reply_count >= replyThreshold);
            log(`💬 Fetching replies for ${commentsWithReplies.length} comments...`);

            for (let i = 0; i < commentsWithReplies.length && !shouldStop; i++) {
                const comment = commentsWithReplies[i];
                const username = comment.username;
                const code = comment.code;

                log(`💬 ${i + 1}/${commentsWithReplies.length}: @${username} (${comment.reply_count} replies)`);

                try {
                    const replies = await fetchCommentReplies(username, code);
                    if (replies.length > 0) {
                        comment.replies = replies;
                        totalReplies += replies.length;
                    }
                } catch (e) {
                    // skip failed fetches
                }

                // Delay between requests to avoid rate limiting
                await sleep(1500 + Math.random() * 1000);
            }

            // Step 5: Remove level-1 comments that are actually replies to other comments
            // (they show up in DOM as separate comments but are nested replies)
            const replyCodes = new Set();
            for (const c of allComments) {
                if (c.replies && c.replies.length > 0) {
                    for (const r of c.replies) {
                        if (r.code) replyCodes.add(r.code);
                    }
                }
            }

            // Filter out comments whose code matches a reply code
            const filteredComments = allComments.filter(c => {
                if (!c.code) return true; // keep DOM-only comments
                return !replyCodes.has(c.code);
            });

            const removed = allComments.length - filteredComments.length;
            if (removed > 0) {
                log(`🧹 Removed ${removed} duplicate reply-comments`);
            }

            // Replace allComments reference
            allComments.length = 0;
            allComments.push(...filteredComments);

            log(`💬 Total replies fetched: ${totalReplies}`);
        }

        singlePostData = {
            url: window.location.href,
            original_post: originalPost,
            comments: allComments,
            total_comments: allComments.length,
            total_replies: totalReplies,
            scraped_at: new Date().toISOString(),
        };

        // Update stats
        const statsEl = document.getElementById('ts-stats');
        if (statsEl) statsEl.style.display = 'grid';
        const countEl = document.getElementById('ts-count-posts');
        if (countEl) countEl.textContent = allComments.length;
        const textEl = document.getElementById('ts-count-text');
        if (textEl) textEl.textContent = totalReplies;

        if (shouldStop) log('⏹ Stopped');
        log(`✅ Done: ${allComments.length} comments, ${totalReplies} replies`);

        btn.disabled = false;
        stopBtn.disabled = true;
        document.getElementById('ts-dl').disabled = false;
        document.getElementById('ts-md').disabled = false;
    }

    async function fetchCommentReplies(username, code) {
        const url = `https://${window.location.hostname}/@${username}/post/${code}`;
        const replies = [];

        try {
            const resp = await fetch(url, {
                headers: { 'Accept': 'text/html' },
                credentials: 'include',
            });
            if (!resp.ok) return replies;

            const html = await resp.text();

            const scriptRegex = /<script[^>]*type="application\/json"[^>]*data-sjs[^>]*>([\s\S]*?)<\/script>/g;
            let match;

            while ((match = scriptRegex.exec(html)) !== null) {
                const content = match[1];
                if (!content.includes('thread_items')) continue;

                try {
                    const data = JSON.parse(content);
                    const threadItems = findNestedKey(data, 'thread_items');

                    for (const items of threadItems) {
                        if (!Array.isArray(items) || items.length < 2) continue;
                        // First item = the comment itself, rest = replies to it
                        for (let i = 1; i < items.length; i++) {
                            const item = items[i];
                            const post = item?.post;
                            if (!post) continue;

                            const replyText = post.caption?.text || '';
                            const replyUsername = post.user?.username || '';
                            if (!replyUsername && !replyText) continue;

                            // Skip if this is the same as the parent comment (dedup)
                            if (post.code === code) continue;

                            // Skip duplicate replies within this fetch
                            const isDup = replies.find(r =>
                                r.username === replyUsername &&
                                r.text === replyText
                            );
                            if (isDup) continue;

                            replies.push({
                                text: replyText,
                                username: replyUsername,
                                published_on: post.taken_at || null,
                                like_count: post.like_count || 0,
                                code: post.code || '',
                            });
                        }
                    }
                } catch (e) {}
            }
        } catch (e) {}

        return replies;
    }

    function extractCommentsFromDOM() {
        const comments = [];
        const seen = new Set();

        // === BLACKLISTS ===
        const UI_BLACKLIST = new Set([
            'untuk anda', 'utas baru', 'aktivitas', 'profil', 'insight',
            'tersimpan', 'mengikuti', 'postingan hantu', 'tampilkan lebih banyak',
            'lebih banyak', 'populer', 'lihat aktivitas', 'pembuat', 'tandai spoiler',
            'ikuti', 'follow', 'diikuti', 'following', 'lainnya', 'more', 'balas',
            'suka', 'like', 'bagikan', 'share', 'kirim', 'send', 'simpan', 'save',
            'laporkan', 'report', 'blokir', 'block', 'salin tautan', 'copy link',
            'sembunyikan', 'hide', 'hapus', 'delete', 'edit', 'pin', 'sematkan',
            'terjemahkan', 'translate', 'for you', 'new thread', 'activity',
            'profile', 'saved', 'search', 'cari', 'higgsfield',
        ]);

        // Patterns that indicate non-comment text
        const SKIP_PATTERNS = [
            /^\d+[smhdw]$/,                          // "5m", "2h", "3d"
            /^\d+\s*(hari|jam|menit|detik|minggu|bulan|tahun)$/i, // "3 hari", "44 menit"
            /^\d+\s*(hour|minute|second|day|week|month|year)s?\s*ago$/i, // "3 days ago"
            /^\d[\d.,]*\s*(rb|ribu|jt|juta|k|m|b)?\s*(tayangan|views?|likes?|suka|balasan|replies?)$/i, // "14,7 rb tayangan"
            /^(youtube|instagram|twitter|tiktok|facebook|threads)\.(com|net|org)/i, // link previews
            /^https?:\/\//i,                         // URLs
            /^@[a-zA-Z0-9._]+$/,                     // @mentions alone
            /^[a-zA-Z0-9._]{3,30}$/,                 // bare usernames (no spaces, short)
            /^(youtube|ig|fb|tt)\.com\/@/i,          // channel links
            /^.*\.\.\.$/, // truncated link previews like "youtube.com/@pasa…" — actually check below
            /^Beberapa balasan sudah disembunyikan/i,
            /^Lihat semua$/i,
            /^Balas ke .+\.\.\.$/i,                  // "Balas ke nouraa_za..."
        ];

        // Find actual comment containers — look for the main content area
        // Threads uses a specific structure: each comment is in a pressable container
        const containers = document.querySelectorAll('[data-pressable-container]');

        for (const container of containers) {
            // Skip if this container is inside navigation/sidebar
            if (container.closest('nav, [role="navigation"], [role="banner"], [role="complementary"]')) continue;

            // Find username from this container
            let username = '';
            const profileLinks = container.querySelectorAll('a[href*="/@"]');
            for (const link of profileLinks) {
                const href = link.getAttribute('href') || '';
                // Skip post links, only get profile links
                if (href.includes('/post/')) continue;
                const m = href.match(/\/@([^/]+)/);
                if (m) { username = m[1]; break; }
            }

            // Get text elements within this container
            const textEls = container.querySelectorAll('span[dir="auto"], div[dir="auto"]');
            const textParts = [];

            for (const el of textEls) {
                const text = (el.innerText || el.textContent || '').trim();
                if (!text || text.length < 2) continue;

                // Skip if inside a nested pressable container (child comment)
                const closestContainer = el.closest('[data-pressable-container]');
                if (closestContainer !== container) continue;

                const textLower = text.toLowerCase();

                // Skip blacklisted UI text
                if (UI_BLACKLIST.has(textLower)) continue;

                // Skip pattern matches
                let skip = false;
                for (const pattern of SKIP_PATTERNS) {
                    if (pattern.test(text)) { skip = true; break; }
                }
                if (skip) continue;

                // Skip if text is just the username (display name or handle)
                if (username && (textLower === username.toLowerCase() || text === username)) continue;

                // Skip very short text that looks like a username (no spaces, alphanumeric + dots/underscores)
                if (text.length < 25 && /^[a-zA-Z0-9._]+$/.test(text)) continue;

                // Skip link preview titles (usually short, inside link elements)
                const parentLink = el.closest('a');
                if (parentLink) {
                    const linkHref = parentLink.getAttribute('href') || '';
                    if (linkHref.includes('/@') && !linkHref.includes('/post/')) continue; // profile link
                    // If it's an external link preview, skip short text
                    if (linkHref.startsWith('http') && text.length < 40 && !text.includes(' ')) continue;
                    // Skip link card titles — short text inside external links (e.g. "Suci Viarani", "Ahmad Hartaji")
                    if (linkHref.startsWith('http') && !linkHref.includes('threads.net') && !linkHref.includes('threads.com') && text.length < 50) continue;
                }

                // Skip text that looks like a link preview card title
                // (appears right after a URL in the same container, typically a channel/page name)
                const parentEl = el.parentElement;
                if (parentEl) {
                    // Check if this element is inside a link preview card (div with specific structure)
                    const cardParent = el.closest('[role="link"], [data-link-preview], a[href^="http"]');
                    if (cardParent) {
                        const cardHref = cardParent.getAttribute('href') || '';
                        if (cardHref && !cardHref.includes('threads.net') && !cardHref.includes('threads.com')) continue;
                    }
                }

                // Skip "Terjemahkan" suffix — it's a translate button
                const cleanText = text.replace(/\s*Terjemahkan\s*$/i, '').trim();
                if (!cleanText) continue;

                textParts.push(cleanText);
            }

            // Merge text parts into a single comment (handles multi-paragraph)
            if (textParts.length === 0) continue;

            // Post-process: remove trailing link preview titles
            // These are typically short capitalized names at the end (channel/page names)
            while (textParts.length > 1) {
                const lastPart = textParts[textParts.length - 1];
                // Link preview title pattern: short (< 30 chars), title-cased or all caps,
                // no common sentence endings, looks like a name/brand
                const isLikelyTitle = lastPart.length < 35 &&
                    !lastPart.includes('😭') && !lastPart.includes('😅') && !lastPart.includes('🤭') &&
                    /^[A-Z\u00C0-\u024F]/.test(lastPart) &&
                    !lastPart.endsWith('.') && !lastPart.endsWith('!') && !lastPart.endsWith('?') &&
                    !lastPart.includes(' aku ') && !lastPart.includes(' saya ') &&
                    !lastPart.includes(' kak') && !lastPart.includes(' ka ') &&
                    // Looks like a proper name (2-4 words, each capitalized)
                    /^([A-Z][a-zA-Z0-9]*[\s]?){1,4}$/.test(lastPart);
                if (isLikelyTitle) {
                    textParts.pop();
                } else {
                    break;
                }
            }

            const fullText = textParts.join('\n').trim();

            if (!fullText || fullText.length < 3) continue;
            if (seen.has(fullText)) continue;

            // Final validation: must have username OR be substantial text
            if (!username && fullText.length < 15) continue;

            seen.add(fullText);
            comments.push({ text: fullText, username, published_on: null, like_count: 0 });
        }

        return comments;
    }

    function downloadSingleJSON() {
        if (!singlePostData) return;
        const json = JSON.stringify(singlePostData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const code = window.location.pathname.match(/\/post\/([^/]+)/) || window.location.pathname.match(/\/t\/([^/]+)/);
        const postCode = code ? code[1] : 'post';
        const postUsername = singlePostData.original_post?.username || 'unknown';
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `${postUsername}_${postCode}_comments_${dateStr}.json`;

        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`💾 ${filename}`);
    }

    function downloadSingleMarkdown() {
        if (!singlePostData) return;
        const { original_post, comments } = singlePostData;

        let md = `# Thread Discussion\n\n`;
        md += `> Scraped on ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
        md += `> ${comments.length} comments`;
        if (singlePostData.total_replies) md += `, ${singlePostData.total_replies} replies`;
        md += `\n\n`;

        if (original_post) {
            md += `## Original Post by @${original_post.username}\n\n`;
            md += `${original_post.text || '*(media only)*'}\n\n`;
            if (original_post.like_count) md += `❤️ ${original_post.like_count} likes\n\n`;
            md += `---\n\n`;
        }

        // Only include comments with valid username and text
        const validComments = comments.filter(c => c.username && c.text && c.text.trim().length > 0);

        md += `## Comments (${validComments.length})\n\n`;

        for (const c of validComments) {
            md += `**@${c.username}**`;
            if (c.published_on) {
                const date = new Date(c.published_on * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                md += ` · ${date}`;
            }
            md += `\n`;
            md += `${c.text}\n`;
            if (c.like_count) md += `❤️ ${c.like_count}`;
            md += `\n`;

            // Render nested replies
            if (c.replies && c.replies.length > 0) {
                md += `\n`;
                for (const r of c.replies) {
                    if (!r.username || !r.text) continue;
                    md += `> **@${r.username}**`;
                    if (r.published_on) {
                        const rDate = new Date(r.published_on * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                        md += ` · ${rDate}`;
                    }
                    md += `\n`;
                    // Indent reply text with blockquote
                    const replyLines = r.text.split('\n');
                    for (const line of replyLines) {
                        md += `> ${line}\n`;
                    }
                    if (r.like_count) md += `> ❤️ ${r.like_count}\n`;
                    md += `>\n`;
                }
            }

            md += `\n---\n\n`;
        }

        md += `\n🔗 [Open thread](${singlePostData.url})\n`;

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const code = window.location.pathname.match(/\/post\/([^/]+)/) || window.location.pathname.match(/\/t\/([^/]+)/);
        const postCode = code ? code[1] : 'post';
        const postUsername = singlePostData.original_post?.username || 'unknown';
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `${postUsername}_${postCode}_comments_${dateStr}.md`;

        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`📝 ${filename}`);
    }

    // ==================== INIT ====================
    function init() {
        if (isSinglePostPage()) {
            createSinglePostPanel();
        } else {
            createPanel();
        }
    }

    setTimeout(init, 2000);
})();
