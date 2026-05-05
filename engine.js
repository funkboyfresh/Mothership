const HORIZONS = ['TRAJECTORY', 'HORIZON', 'IMMINENT'];
const AUTO_PALETTE = ['#00e5ff', '#ffd700', '#ff00ff', '#00ff88', '#ff3366', '#a200ff', '#00ffcc', '#ff9900'];

const defaultSectors = [
    { id: 'sec_career', name: 'CAREER', color: '#00e5ff', seed: {x: 0.3, y: 0.3} },
    { id: 'sec_finance', name: 'FINANCIAL', color: '#ffd700', seed: {x: 0.7, y: 0.3} },
    { id: 'sec_personal', name: 'PERSONAL', color: '#ff00ff', seed: {x: 0.5, y: 0.7} }
];

let state = {
    level: 1, sectorId: null, horizon: null, activeMissionId: null,
    playerLevel: parseInt(localStorage.getItem('playerLevel')) || 1,
    energy: parseInt(localStorage.getItem('energy')) || 0,
    hapticsEnabled: localStorage.getItem('hapticsEnabled') !== 'false',
    sectors: JSON.parse(localStorage.getItem('sectors')) || [...defaultSectors],
    missions: JSON.parse(localStorage.getItem('missions')) || {},
    shipPos: { x: 50, y: 50 } 
};

let editModeId = null, defaultHorizonContext = null, isHorizonFixed = false, tempSubtasks = [], editingSectors = [];

if (!state.sectors || state.sectors.length === 0) { state.sectors = [...defaultSectors]; }

// --- NAVIGATION & SPATIAL GEOMETRY ---
function doLinesIntersect(p1, q1, p2, q2) {
    const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    return ccw(p1, p2, q2) !== ccw(q1, p2, q2) && ccw(p1, q1, p2) !== ccw(p1, q1, q2);
}

function getDistanceToSegment(p, a, b) {
    const l2 = (a.x - b.x)**2 + (a.y - b.y)**2;
    if (l2 === 0) return Math.sqrt((p.x - a.x)**2 + (p.y - a.y)**2);
    let t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2));
    return Math.sqrt((p.x - (a.x + t * (b.x - a.x)))**2 + (p.y - (a.y + t * (b.y - a.y)))**2);
}

const SECTORS = [
    { id: 0, x: [0, 1], y: [0, 2] }, { id: 1, x: [0, 1], y: [3, 5] },
    { id: 2, x: [2, 3], y: [0, 2] }, { id: 3, x: [2, 3], y: [3, 5] },
    { id: 4, x: [4, 5], y: [0, 2] }, { id: 5, x: [4, 5], y: [3, 5] }
];

function getSafeCoordinates(existingMissions) {
    const count = (existingMissions || []).length, activeWire = (existingMissions || []).slice(-8);
    const margin = 15, usableSpace = 70, wirePadding = 15; 
    let x, y, safe, attempts = 0;
    do {
        let gridX, gridY;
        if (count === 0) {
            const corners = [SECTORS[0], SECTORS[1], SECTORS[4], SECTORS[5]], s = corners[Math.floor(Math.random() * corners.length)];
            gridX = s.x[0] + Math.floor(Math.random() * (s.x[1] - s.x[0] + 1)); gridY = s.y[0] + Math.floor(Math.random() * (s.y[1] - s.y[0] + 1));
        } else if (count === 1) {
            const startNode = existingMissions[0], startSector = SECTORS.find(s => (startNode.x >= margin + (s.x[0] * 14) - 5) && (startNode.x <= margin + (s.x[1] * 14) + 5));
            const otherSectors = SECTORS.filter(s => s !== startSector), s = otherSectors[Math.floor(Math.random() * otherSectors.length)];
            gridX = s.x[0] + Math.floor(Math.random() * (s.x[1] - s.x[0] + 1)); gridY = s.y[0] + Math.floor(Math.random() * (s.y[1] - s.y[0] + 1));
        } else { gridX = Math.floor(Math.random() * 6); gridY = Math.floor(Math.random() * 6); }
        x = margin + (gridX * (usableSpace / 5)) + (Math.random() * 6 - 3); y = margin + (gridY * (usableSpace / 5)) + (Math.random() * 6 - 3);
        safe = true; const newNode = { x, y };
        for (let m of (existingMissions || [])) { if (m && !isNaN(m.x) && Math.sqrt((m.x - x)**2 + (m.y - y)**2) < 16) { safe = false; break; } }
        if (!safe) { attempts++; continue; }
        if (activeWire.length > 1) { for (let i = 0; i < activeWire.length - 1; i++) { if (getDistanceToSegment(newNode, activeWire[i], activeWire[i+1]) < wirePadding) { safe = false; break; } } }
        if (!safe) { attempts++; continue; }
        if (activeWire.length > 0) {
            const last = activeWire[activeWire.length - 1];
            for (let i = 0; i < activeWire.length - 1; i++) { if (doLinesIntersect(last, newNode, activeWire[i], activeWire[i+1])) { safe = false; break; } }
            if (safe && activeWire.length > 2) { for (let i = 0; i < activeWire.length - 2; i++) { if (getDistanceToSegment(newNode, activeWire[i], activeWire[i+1]) < 18) { safe = false; break; } } }
        }
        attempts++;
    } while (!safe && attempts < 600);
    return { x, y };
}

// --- CORE UTILITIES ---
function triggerHaptic(p) { if (state.hapticsEnabled && "vibrate" in navigator) navigator.vibrate(p); }
function updateHUD() {
    const l = document.getElementById('hud-level'), e = document.getElementById('hud-energy-readout'), b = document.getElementById('hud-capacitor-bar');
    if(l) l.innerText = `PILOT LEVEL ${state.playerLevel}`; if(e) e.innerText = `CAPACITOR ${state.energy}%`; if(b) b.style.width = `${state.energy}%`;
}
function addEnergy(a) { state.energy += a; if (state.energy < 0) state.energy = 0; if (state.energy >= 100) { state.playerLevel += Math.floor(state.energy/100); state.energy %= 100; triggerHyperDrive(); triggerHaptic([100,50,100,50,200]); } save(); updateHUD(); }
function triggerHyperDrive() { const o = document.getElementById('level-up-overlay'); if(!o) return; o.style.display = 'flex'; void o.offsetWidth; o.style.animation = 'hyper-flash 1.5s forwards ease-out'; setTimeout(() => { o.style.display = 'none'; }, 1500); }
function save() { localStorage.setItem('sectors', JSON.stringify(state.sectors)); localStorage.setItem('missions', JSON.stringify(state.missions)); localStorage.setItem('energy', state.energy); localStorage.setItem('playerLevel', state.playerLevel); localStorage.setItem('hapticsEnabled', state.hapticsEnabled); }

// --- TIME MECHANICS ---
function getHorizonFromDate(d, fallback) { if (!d) return fallback || 'TRAJECTORY'; const today = new Date(); today.setHours(0,0,0,0); const diff = Math.ceil((new Date(d + 'T00:00:00') - today) / 86400000); return diff <= 7 ? 'IMMINENT' : (diff <= 14 ? 'HORIZON' : 'TRAJECTORY'); }
function processTimeMechanics() {
    const now = new Date();
    state.sectors.forEach(s => { HORIZONS.forEach(h => { if(!state.missions[s.id]?.[h]) return;
            for (let i = state.missions[s.id][h].length - 1; i >= 0; i--) {
                let m = state.missions[s.id][h][i]; if (m?.dueDate && !m.captured) {
                    const deadline = new Date(m.dueDate + 'T23:59:59'), diffHrs = (deadline - now) / (1000 * 60 * 60);
                    if (diffHrs < 0 && !m.overdue) addEnergy(-10); m.overdue = diffHrs < 0; m.warningLevel = 0;
                    if (!m.overdue) { if (diffHrs <= 24) m.warningLevel = 24; else if (diffHrs <= 48) m.warningLevel = 48; }
                    let targetH = Math.ceil(diffHrs / 24) <= 7 ? 'IMMINENT' : (Math.ceil(diffHrs / 24) <= 14 ? 'HORIZON' : 'TRAJECTORY');
                    if (targetH !== h) { state.missions[s.id][targetH].push(m); state.missions[s.id][h].splice(i, 1); }
                }
            }
        });
    });
}
function checkDecayStatus() {
    let dcy = state.sectors.some(s => HORIZONS.some(h => state.missions[s.id]?.[h]?.some(m => m.overdue && !m.captured)));
    const l = document.getElementById('hud-level'), e = document.getElementById('hud-energy-readout');
    if (dcy) { if(l) l.innerText = "CRITICAL DECAY"; if(l) l.classList.add('hud-warning'); if(e) e.classList.add('hud-warning'); }
    else { if(l) l.innerText = `PILOT LEVEL ${state.playerLevel}`; if(l) l.classList.remove('hud-warning'); if(e) e.classList.remove('hud-warning'); }
}

// --- RENDER SYSTEM ---
function safelyGetActiveMission() { if(!state.sectorId || !state.missions[state.sectorId]) return null; for (let h of HORIZONS) { const f = state.missions[state.sectorId][h].find(x => x.id === state.activeMissionId); if (f) { state.horizon = h; return f; } } return null; }
function render() {
    document.getElementById('app').classList.remove('critical-mode'); updateHUD(); processTimeMechanics(); checkDecayStatus();
    const c = document.getElementById('view-container'), z = document.getElementById('zoom-out'), b = document.getElementById('breadcrumb'), f = document.getElementById('control-footer');
    if(!c) return; c.innerHTML = ''; if(z) z.style.visibility = state.level > 1 ? 'visible' : 'hidden';
    const s = state.sectors.find(s => s.id === state.sectorId), acc = s ? s.color : '#00e5ff';
    document.documentElement.style.setProperty('--accent', acc); document.documentElement.style.setProperty('--accent-glow', acc + '99');
    if(b) b.innerText = `${s ? s.name : 'GALAXY'} ${state.horizon ? '> ' + state.horizon : ''}`;
    switch(state.level) { case 1: renderLevel1(c, f); break; case 2: renderLevel2(c, f, s); break; case 3: renderLevel3(c, f); break; case 4: renderLevel4(c, f); break; }
}

function renderLevel1(container, footer) {
    if(footer) { footer.style.display = 'flex'; footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openSectorModal()">[ EDIT SECTORS ]</button>`; }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.id = "voronoi-map"; container.appendChild(svg);
    const w = container.clientWidth, h = container.clientHeight, seeds = state.sectors.map(s => s.seed);
    const voronoi = d3.Delaunay.from(seeds.map(s => [s.x * w, s.y * h])).voronoi([0, 0, w, h]);
    state.sectors.forEach((s, i) => {
        const d = voronoi.renderCell(i); if(!d) return;
        const ovr = state.missions[s.id] && HORIZONS.some(hz => state.missions[s.id][hz]?.some(m => m.overdue && !m.captured)), col = ovr ? 'var(--thrust)' : s.color;
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", d); p.setAttribute("fill", col); p.setAttribute("fill-opacity", ovr ? 0.2 : 0.05); p.setAttribute("stroke", col); p.setAttribute("stroke-width", "2"); 
        p.setAttribute("class", `voronoi-cell ${ovr ? 'overdue-sector' : ''}`); p.onclick = () => { state.sectorId = s.id; state.level = 2; render(); }; svg.appendChild(p);
        const cx = seeds[i].x * w, cy = seeds[i].y * h;
        [ { id: 'IMMINENT', r: 12, s: 10 }, { id: 'HORIZON', r: 20, s: 20 }, { id: 'TRAJECTORY', r: 28, s: 40 } ].forEach(ring => {
            const circ = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circ.setAttribute("cx", cx); circ.setAttribute("cy", cy); circ.setAttribute("r", ring.r); circ.setAttribute("fill", "none"); circ.setAttribute("stroke", col); circ.setAttribute("stroke-width", "0.5"); circ.setAttribute("opacity", "0.4"); circ.style.pointerEvents = "none"; svg.appendChild(circ);
            const ms = (state.missions[s.id]?.[ring.id] || []).filter(m => !m.captured);
            if (ms.length > 0) {
                const g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.style.transformOrigin = `${cx}px ${cy}px`; g.style.animation = `orbit-spin ${ring.s}s linear infinite`;
                ms.forEach((m, idx) => {
                    const ang = (idx / ms.length) * Math.PI * 2, dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    dot.setAttribute("cx", cx + ring.r * Math.cos(ang)); dot.setAttribute("cy", cy + ring.r * Math.sin(ang)); dot.setAttribute("r", "1.5"); dot.setAttribute("fill", m.overdue ? 'var(--thrust)' : col); g.appendChild(dot);
                }); svg.appendChild(g);
            }
        });
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text"); txt.setAttribute("x", cx); txt.setAttribute("y", cy + 45); txt.setAttribute("fill", col); txt.setAttribute("class", "voronoi-text"); txt.style.textShadow = `0 0 10px ${col}`; txt.textContent = s.name; svg.appendChild(txt);
    });
}

function renderLevel2(container, footer, activeSector) {
    if(footer) { footer.style.display = 'flex'; footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openTaskModal('TRAJECTORY', false)">+ INITIALIZE TARGET</button>`; }
    const h = document.createElement('div'); h.innerHTML = `<div class="view-level-title">LEVEL 2 // <span id="sector-title-safe"></span></div><h1 class="view-main-title">Planetary Map</h1>`;
    container.appendChild(h); document.getElementById('sector-title-safe').textContent = activeSector.name;
    const ctr = document.createElement('div'); ctr.className = 'warp-transition'; ctr.style.cssText = 'position:relative; width:280px; height:280px; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%); border-radius:50%;';
    const gw = document.createElement('div'); gw.style.cssText = 'position:absolute; width:100%; height:100%; pointer-events:none; border-radius:50%;';
    for (let i = 0; i < 225; i++) {
        const r = 30 + (Math.random() * 145), ang = Math.random() * Math.PI * 2, x = 140 + r * Math.cos(ang), y = 140 + r * Math.sin(ang), sz = Math.random() * 1.5 + 0.5, p = document.createElement('div');
        p.style.cssText = `position:absolute; width:${sz}px; height:${sz}px; background:#fff; border-radius:50%; opacity:${Math.random() * 0.4 + 0.1}; left:${x}px; top:${y}px; animation: orbit-spin ${40 + Math.random() * 80}s linear infinite;`; gw.appendChild(p);
    }
    ctr.appendChild(gw);
    const ts = document.createElementNS("http://www.w3.org/2000/svg", "svg"); ts.style.cssText = 'position:absolute; width:100%; height:100%; pointer-events:none; z-index:20;'; ts.setAttribute("viewBox", "0 0 280 280");
    ts.innerHTML = `<defs><path id="path-horizon" d="M 67.5,140 A 72.5,72.5 0 0,1 212.5,140" /><path id="path-trajectory" d="M 22.5,140 A 117.5,117.5 0 0,1 257.5,140" /></defs>`; ctr.appendChild(ts);
    [ { id: 'TRAJECTORY', size: 280, speed: 60 }, { id: 'HORIZON', size: 190, speed: 30 }, { id: 'IMMINENT', size: 100, speed: 15 } ].forEach(d => {
        const ovr = state.missions[state.sectorId]?.[d.id]?.some(m => m.overdue && !m.captured), wrp = document.createElement('div'); wrp.className = `ring-circle ${ovr ? 'overdue' : ''}`;
        wrp.style.width = d.size + 'px'; wrp.style.height = d.size + 'px'; wrp.onclick = (e) => { e.stopPropagation(); state.horizon = d.id; state.level = 3; render(); };
        if (d.id === 'IMMINENT') { const lb = document.createElement('div'); lb.className = 'ring-label'; lb.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#ffffff; font-size: 0.7rem; font-weight: bold; letter-spacing: 2px;'; lb.innerText = d.id; wrp.appendChild(lb); }
        else {
            const txt = document.createElementNS("http://www.w3.org/2000/svg", "text"); txt.setAttribute("fill", "#ffffff"); txt.style.cssText = 'font-size: 0.7rem; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;';
            const tp = document.createElementNS("http://www.w3.org/2000/svg", "textPath"); tp.setAttribute("href", `#path-${d.id.toLowerCase()}`); tp.setAttribute("startOffset", "50%"); tp.setAttribute("text-anchor", "middle"); tp.setAttribute("dominant-baseline", "middle"); tp.textContent = d.id; txt.appendChild(tp); ts.appendChild(txt);
        }
        const sf = document.createElement('div'); sf.style.cssText = `position:absolute; width:100%; height:100%; animation: orbit-spin ${d.speed}s linear infinite; pointer-events:none;`;
        const ms = (state.missions[state.sectorId]?.[d.id] || []).filter(m => !m.captured);
        ms.forEach((m, i) => {
            const ang = (i / ms.length) * Math.PI * 2, r = d.size/2, dt = document.createElement('div'), isD = m.overdue && !m.captured, col = isD ? 'var(--thrust)' : 'var(--accent)';
            dt.style.cssText = `position:absolute; width:6px; height:6px; border-radius:50%; background:${col}; left:calc(${r + r * Math.cos(ang)}px - 3px); top:calc(${r + r * Math.sin(ang)}px - 3px); box-shadow: 0 0 8px ${col};`; sf.appendChild(dt);
        }); wrp.appendChild(sf); ctr.appendChild(wrp);
    }); container.appendChild(ctr);
}

function renderLevel3(container, footer) {
    if(footer) { footer.style.display = 'flex'; footer.innerHTML = `<button class="zoom-btn" style="flex:1; font-size: 0.8rem;" onclick="openTaskModal('${state.horizon}', true)">+ INITIALIZE TARGET (${state.horizon})</button><button class="zoom-btn" style="width: 85px; margin-left: 10px; font-size: 0.8rem;" onclick="togglePilotLog()"><span style="font-size: 1.6rem; line-height: 0;">^</span> LOG</button>`; }
    const missions = state.missions[state.sectorId]?.[state.horizon] || [], svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.id = "constellation-svg"; container.appendChild(svg);
    const s = state.sectors.find(s => s.id === state.sectorId), acc = s ? s.color : '#00e5ff', now = Date.now(), oneW = 7 * 24 * 60 * 60 * 1000;
    const aPool = missions.filter(m => !m.captured), cPool = missions.filter(m => m.captured && (now - (m.completionTimestamp || 0) < oneW));
    const wActive = aPool.slice(0, 6), wCap = cPool.slice(-2), wTasks = [...wCap, ...wActive];
    const debris = missions.filter(m => m.captured && !wTasks.includes(m)).slice(-20);
    const hdr = document.createElement('div'); hdr.style.cssText = 'position: absolute; bottom: 20px; text-align: center; width: 100%; pointer-events: none;';
    hdr.innerHTML = `<div class="view-level-title">LEVEL 3 // ${state.horizon}</div><h1 class="view-main-title" style="margin-bottom:0;">Constellation Map</h1>`; container.appendChild(hdr);
    if (wActive.length > 0) {
        const pc = document.createElement('div'); pc.className = 'priority-dropdown-container'; pc.style.cssText = 'position: absolute; top: 12px; z-index: 100; left: 20px;'; 
        pc.innerHTML = `<button class="priority-toggle-btn" onclick="this.nextElementSibling.classList.toggle('show')">MISSION PRIORITIES (${wActive.length}/6) <span>v</span></button>
            <div class="priority-list">${wActive.map((m, i) => { const isD = m.overdue && !m.captured;
                return `<div class="priority-item ${i === 0 ? 'mission-critical-active' : ''}" style="${i === 0 ? `--sector-color: ${isD ? 'rgba(255, 42, 42, 0.2)' : acc + '22'}; --sector-border: ${isD ? 'var(--thrust)' : acc};` : ''}">
                <span class="p-num">${missions.indexOf(m) + 1}</span><span class="p-status" style="color: ${isD ? 'var(--thrust)' : ''}">${i === 0 ? (isD ? '[ CRITICAL DECAY ]' : '[ MISSION CRITICAL ]') : ''}</span><span class="p-text">${m.name}</span></div>`}).join('')}</div>`; container.appendChild(pc);
    }
    if (wTasks.length > 1) {
        for (let i = 0; i < wTasks.length - 1; i++) {
            const l = document.createElementNS("http://www.w3.org/2000/svg", "line"); l.setAttribute("x1", wTasks[i].x + "%"); l.setAttribute("y1", wTasks[i].y + "%"); l.setAttribute("x2", wTasks[i+1].x + "%"); l.setAttribute("y2", wTasks[i+1].y + "%"); l.setAttribute("stroke", "var(--accent)"); l.setAttribute("stroke-width", "1.5"); l.setAttribute("stroke-dasharray", "5,5"); l.setAttribute("opacity", "0.45"); svg.appendChild(l);
        }
    }
    [...debris, ...wTasks].forEach((m) => {
        const st = document.createElement('div'), isDeb = debris.includes(m), isCw = wCap.includes(m), isOvr = m.overdue;
        let wc = ''; if (isOvr && !m.captured) wc = 'decaying'; else if (m.warningLevel === 24) wc = 'warning-24'; else if (m.warningLevel === 48) wc = 'warning-48';
        st.className = `star-container ${isDeb ? 'debris-node' : ''} ${wc} warp-transition`;
        if (isDeb && !m.scale) { m.driftX = (Math.random()-0.5)*8; m.driftY = (Math.random()-0.5)*8; m.scale = 0.3 + (Math.random()*0.4); }
        st.style.left = (m.x + (m.driftX || 0)) + '%'; st.style.top = (m.y + (m.driftY || 0)) + '%';
        if (!m.captured) { st.onclick = () => { state.activeMissionId = m.id; state.level = 4; render(); }; st.style.cursor = 'pointer'; } else { st.style.pointerEvents = 'none'; }
        const n = document.createElement('div'); n.className = `star-node ${m.captured ? 'captured' : ''}`;
        if (isDeb) { n.style.transform = `scale(${m.scale})`; n.style.opacity = '0.45'; n.style.boxShadow = 'none'; }
        else if (isCw) {
            let f = acc; if (isOvr) f = 'var(--thrust)'; else if (m.warningLevel === 24) f = '#ff9900'; else if (m.warningLevel === 48) f = '#ffd700';
            n.style.opacity = '0.55'; n.style.background = f; n.style.borderColor = acc; n.style.color = '#ffffff'; n.style.boxShadow = `0 0 5px ${f}66`; n.textContent = missions.indexOf(m) + 1;
        } else {
            const isC = m.id === wActive[0]?.id, op = isC ? 1.0 : 0.8, hex = Math.floor(op * 255).toString(16).padStart(2, '0');
            let bc = acc, gc = acc + hex; if (isOvr) { bc = 'var(--thrust)'; gc = 'rgba(255, 42, 42, 0.6)'; } else if (m.warningLevel === 24) { bc = '#ff9900'; gc = 'rgba(255, 153, 0, 0.6)'; } else if (m.warningLevel === 48) { bc = '#ffd700'; gc = 'rgba(255, 215, 0, 0.6)'; }
            n.style.boxShadow = `0 0 ${isC ? 20 : 15}px ${gc}`; n.style.borderColor = bc; n.style.filter = `brightness(${isC ? 1.15 : 1.0})`; if (isC) n.style.borderWidth = '3px'; n.textContent = missions.indexOf(m) + 1;
        }
        const lb = document.createElement('div'); lb.className = 'star-label'; lb.style.display = isDeb ? 'none' : 'block'; lb.style.opacity = isCw ? '0.45' : '1'; lb.textContent = m.name; st.appendChild(n); st.appendChild(lb); container.appendChild(st);
    });
}

function renderLevel4(container, footer) {
    if(footer) footer.style.display = 'none';
    const m = safelyGetActiveMission(); if (!m) { zoomOut(); return; }
    const comp = m.subs.filter(s => s.c).length, pr = m.subs.length ? Math.round((comp / m.subs.length) * 100) : 0, ad = m.subs.length > 0 && comp === m.subs.length;
    const lk = document.createElement('div'), isD = m.overdue && !m.captured; if (isD) document.getElementById('app').classList.add('critical-mode');
    lk.className = `target-lock warp-transition ${isD ? 'critical' : ''}`; lk.innerHTML = `<div class="view-level-title">LEVEL 4 // ${m.captured ? 'ARCHIVE' : 'ACTIVE'}</div><h2 style="color: ${isD ? 'var(--thrust)' : 'var(--text)'}">${m.name}</h2>`;
    const s = state.sectors.find(s => s.id === state.sectorId), acc = s ? s.color : 'var(--accent)';
    if (m.subs.length > 0) {
        const pc = document.createElement('div'); pc.className = 'priority-dropdown-container'; let ci = m.subs.findIndex(s => !s.c); if (ci === -1) ci = 0; 
        pc.innerHTML = `<button class="priority-toggle-btn" onclick="this.nextElementSibling.classList.toggle('show')">MISSION PRIORITIES <span>v</span></button>
            <div class="priority-list">${m.subs.map((s, i) => `<div class="priority-item ${i === ci && !s.c ? 'mission-critical-active' : ''} ${s.c ? 'task-captured' : ''}" style="${i === ci && !s.c ? `--sector-color: ${acc}22; --sector-border: ${acc};` : ''}">
                <span class="p-num">${i + 1}</span><span class="p-text">${s.t}</span></div>`).join('')}</div>`; lk.appendChild(pc);
    }
    lk.insertAdjacentHTML('beforeend', `<div class="progress-wrapper"><div class="progress-bar-container"><div class="progress-fill" style="width: ${pr}%;"></div></div><div class="progress-text">${pr}% INTEGRITY</div></div>`);
    const os = document.createElement('div'); os.className = 'orbital-system'; os.innerHTML = `<svg viewBox="0 0 340 340" style="position:absolute; width:100%; height:100%;"><circle cx="170" cy="170" r="14" fill="${ad ? 'var(--captured)' : 'var(--bg)'}" stroke="var(--accent)" stroke-width="2"/></svg>`;
    m.subs.forEach((s, i) => {
        const ang = (i / m.subs.length) * Math.PI * 2, x = 170 + 100 * Math.cos(ang), y = 170 + 100 * Math.sin(ang), sn = document.createElement('div'); sn.style.cssText = `position:absolute; left:${x}px; top:${y}px; transform:translate(-50%, -50%); cursor:pointer;`;
        if (!m.captured) sn.onclick = () => toggleSubTask(i);
        const bx = document.createElement('div'); bx.className = `orbital-node-box ${s.c ? 'checked' : ''}`; bx.innerHTML = `<div class="orb-check">${s.c ? '✓' : ''}</div><div class="orb-text">${s.t}</div>`; sn.appendChild(bx); os.appendChild(sn);
    });
    lk.appendChild(os);
    const bw = document.createElement('div'); bw.style.cssText = 'display:flex; gap:10px; margin-top: auto; margin-bottom: 20px;';
    bw.innerHTML = `<button class="mod-btn" onclick="openEditModal(${m.id})">EDIT</button><button class="mod-btn" onclick="deleteMission(${m.id})" style="color:var(--thrust)">DESTROY</button>`;
    lk.appendChild(bw); if (ad && !m.captured) {
        const mdl = document.createElement('div'); mdl.className = 'hex-modal warp-transition'; mdl.innerHTML = `<h2 style="color: var(--captured)">TARGET SECURED</h2><button class="success-btn" onclick="completeMission()">LOG MISSION & WARP</button>`; lk.appendChild(mdl);
    }
    container.appendChild(lk);
}

// --- MISSION MODAL & INTERACTION ---
function moveMission(dir) { const m = safelyGetActiveMission(); if (!m) return; const ms = state.missions[state.sectorId][state.horizon], i = ms.findIndex(x => x.id === m.id), ni = i + dir; if (ni >= 0 && ni < ms.length) { ms.splice(i, 1); ms.splice(ni, 0, m); save(); render(); } }
function openTaskModal(h, f) { editModeId = null; defaultHorizonContext = h; isHorizonFixed = f; document.getElementById('modal-task-name').value = ''; document.getElementById('modal-task-date').value = ''; document.getElementById('modal-horizon-select').value = h; document.getElementById('modal-horizon-group').style.display = f ? 'none' : 'block'; tempSubtasks = ['', '', '']; renderModalSubtasks(); document.getElementById('task-modal-overlay').style.display = 'flex'; }
function renderModalSubtasks() { const l = document.getElementById('modal-subtasks-list'); if(!l) return; l.innerHTML = ''; tempSubtasks.forEach((s, i) => { const r = document.createElement('div'); r.className = 'subtask-row'; r.innerHTML = `<input type="text" class="modal-input" value="${s}" oninput="tempSubtasks[${i}] = this.value" style="background:transparent; border-color:rgba(255,255,255,0.1);"><button class="subtask-remove-minimal" onclick="tempSubtasks.splice(${i}, 1); renderModalSubtasks();">−</button>`; l.appendChild(r); }); }
function addModalSubtask() { if (tempSubtasks.length < 10) { tempSubtasks.push(''); renderModalSubtasks(); } }
function closeTaskModal() { const o = document.getElementById('task-modal-overlay'); if (o) o.style.display = 'none'; }
function saveTaskModal() {
    const n = document.getElementById('modal-task-name').value.trim(); if (!n) { alert("Mission must be named"); return; }
    const h = isHorizonFixed ? defaultHorizonContext : document.getElementById('modal-horizon-select').value;
    const hms = (state.missions[state.sectorId]?.[h]) ? state.missions[state.sectorId][h] : [], ac = hms.filter(m => !m.captured).length;
    if (!editModeId && ac >= 6) { alert("Horizon full. Complete an active target first."); return; }
    const ds = document.getElementById('modal-task-date').value, fh = getHorizonFromDate(ds, h);
    if (!state.missions[state.sectorId]) state.missions[state.sectorId] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]};
    if (editModeId) {
        let ei = -1, eh = null; HORIZONS.forEach(hz => { const idx = state.missions[state.sectorId][hz].findIndex(m => m.id === editModeId); if (idx !== -1) { ei = idx; eh = hz; } });
        if (ei !== -1) {
            if (eh === fh) { const m = state.missions[state.sectorId][fh][ei]; m.name = n; m.dueDate = ds || null; m.subs = tempSubtasks.filter(t => t.trim()).map(t => ({t, c:false})); }
            else { state.missions[state.sectorId][eh].splice(ei, 1); const crd = getSafeCoordinates(state.missions[state.sectorId][fh] || []); state.missions[state.sectorId][fh].push({ id: editModeId, name: n, subs: tempSubtasks.filter(t => t.trim()).map(t => ({t, c:false})), x: crd.x, y: crd.y, dueDate: ds || null }); }
        }
    } else { const crd = getSafeCoordinates(hms); state.missions[state.sectorId][fh].push({ id: Date.now(), name: n, subs: tempSubtasks.filter(t => t.trim()).map(t => ({t, c:false})), x: crd.x, y: crd.y, dueDate: ds || null }); }
    save(); closeTaskModal(); render();
}

function zoomOut() { state.level = Math.max(1, state.level - 1); if (state.level === 1) { state.sectorId = null; state.horizon = null; } render(); }
function toggleSubTask(idx) { const m = safelyGetActiveMission(); if (m?.subs[idx]) { m.subs[idx].c = !m.subs[idx].c; if (m.subs[idx].c) { triggerHaptic(30); addEnergy(5); } else { addEnergy(-5); } save(); render(); } }
function completeMission() { const m = safelyGetActiveMission(); if (m) { m.captured = true; m.completionTimestamp = Date.now(); addEnergy(25); triggerHaptic([50, 30, 50]); save(); state.level = 3; render(); } }
function deleteMission(id) { if(confirm("Destroy?")) { HORIZONS.forEach(h => { if(state.missions[state.sectorId]?.[h]) state.missions[state.sectorId][h] = state.missions[state.sectorId][h].filter(m => m.id !== id); }); save(); state.level = 3; render(); } }

// --- SECTOR & SYSTEM CONFIG ---
function openSectorModal() { editingSectors = JSON.parse(JSON.stringify(state.sectors)); renderSectorEditList(); document.getElementById('sector-modal-overlay').style.display = 'flex'; }
function closeSectorModal() { document.getElementById('sector-modal-overlay').style.display = 'none'; }
function renderSectorEditList() {
    const l = document.getElementById('sector-edit-list'), ab = document.getElementById('sector-add-btn'); if(!l) return; l.innerHTML = '';
    editingSectors.forEach((s, i) => {
        const r = document.createElement('div'); r.className = 'subtask-row'; r.style.marginBottom = '12px';
        const cg = `<div style="position: relative; width: 24px; height: 36px; flex-shrink: 0; cursor: pointer; border: 1px solid ${s.color}; border-radius: 2px; box-shadow: 0 0 10px ${s.color}66, inset 0 0 5px ${s.color}33; background: rgba(0,0,0,0.5);"><input type="color" value="${s.color}" onchange="editingSectors[${i}].color = this.value; renderSectorEditList();" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"><div style="position: absolute; top: 4px; bottom: 4px; left: 4px; right: 4px; background: ${s.color}; box-shadow: 0 0 8px ${s.color}; border-radius: 1px;"></div></div>`;
        r.innerHTML = `${cg}<input type="text" class="modal-input" value="${s.name}" oninput="editingSectors[${i}].name = this.value" style="flex: 1; height: 36px;"><button class="mod-btn" onclick="resetSectorMissions('${s.id}')" style="height: 36px; font-size: 0.5rem; color: var(--thrust); border-color: var(--thrust);">RESET</button><button class="subtask-remove-minimal" onclick="editingSectors.splice(${i}, 1); renderSectorEditList();" style="height: 36px; width: 36px; margin: 0;">−</button>`; l.appendChild(r);
    }); if(ab) ab.style.display = editingSectors.length >= 9 ? 'none' : 'block';
}
function resetSectorMissions(sid) { if(confirm("Wipe sector missions?")) { state.missions[sid] = { TRAJECTORY: [], HORIZON: [], IMMINENT: [] }; save(); render(); } }
function factoryReset() { if(confirm("TERMINAL ACTION: Wipe all pilot data, sectors, and logs?")) { localStorage.clear(); location.reload(); } }
function addNewSector() { if (editingSectors.length < 9) { editingSectors.push({ id: 'sec_' + Date.now(), name: 'NEW SECTOR', color: AUTO_PALETTE[editingSectors.length % AUTO_PALETTE.length], seed: { x: Math.random(), y: Math.random() } }); renderSectorEditList(); } }
function saveSectorModal() { editingSectors.forEach(s => { if (!state.missions[s.id]) state.missions[s.id] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]}; }); state.sectors = JSON.parse(JSON.stringify(editingSectors)); save(); closeSectorModal(); render(); }
function openSettingsModal() { document.getElementById('settings-haptics-toggle').checked = state.hapticsEnabled; document.getElementById('settings-modal-overlay').style.display = 'flex'; }
function closeSettingsModal() { state.hapticsEnabled = document.getElementById('settings-haptics-toggle').checked; save(); document.getElementById('settings-modal-overlay').style.display = 'none'; }
function openEditModal(id) { editModeId = id; let t = null; HORIZONS.forEach(h => { const f = state.missions[state.sectorId]?.[h]?.find(m => m.id === id); if (f) t = f; }); if (!t) return; document.getElementById('modal-task-name').value = t.name; document.getElementById('modal-task-date').value = t.dueDate || ''; tempSubtasks = t.subs.map(s => s.t); if(tempSubtasks.length === 0) tempSubtasks = ['']; renderModalSubtasks(); document.getElementById('task-modal-overlay').style.display = 'flex'; }

function togglePilotLog() {
    let lm = document.getElementById('pilot-log-modal'); if (!lm) { lm = document.createElement('div'); lm.id = 'pilot-log-modal'; lm.className = 'modal-overlay'; lm.onclick = (e) => { if(e.target === lm) lm.style.display = 'none'; }; document.body.appendChild(lm); }
    let al = []; state.sectors.forEach(s => { HORIZONS.forEach(h => { (state.missions[s.id]?.[h] || []).forEach(m => { if (m.captured && m.completionTimestamp) { al.push({...m, sectorName: s.name, sectorColor: s.color}); } }); }); });
    al.sort((a, b) => b.completionTimestamp - a.completionTimestamp); const dl = al.slice(0, 50);
    const lc = dl.length > 0 ? dl.map(m => { const d = new Date(m.completionTimestamp); return `<div class="log-entry" style="font-size: 0.65rem; padding: 8px; border-bottom: 1px solid var(--border); line-height: 1.4; border-left: 2px solid ${m.sectorColor}; background: ${m.sectorColor}05;"><span style="color:${m.sectorColor}; font-weight: bold;">'Pilot'</span> completed <span style="color:#fff">'${m.name}'</span> in <span style="opacity:0.7">${m.sectorName}</span> on <span style="opacity:0.7">${d.toLocaleDateString()}</span> at <span style="opacity:0.7">${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>`; }).join('') : '<div style="padding: 40px 20px; text-align: center; opacity: 0.5; font-size: 0.7rem; letter-spacing: 1px;">NO MISSIONS COMPLETED</div>';
    lm.innerHTML = `<div class="modal-box" style="max-width: 450px;"><div class="modal-header">PILOT FLIGHT LOG [LAST 50]</div><div class="subtasks-container" style="max-height: 60vh;">${lc}</div><button class="mod-btn" style="width:100%; margin-top:10px;" onclick="document.getElementById('pilot-log-modal').style.display='none'">DISMISS</button></div>`; lm.style.display = 'flex';
}

function runDatabaseMigration() {
    let mig = false, nM = { ...state.missions }, lM = { 'CAREER': 'sec_career', 'FINANCIAL': 'sec_finance', 'PERSONAL': 'sec_personal' };
    Object.keys(nM).forEach(k => { if (!k.startsWith('sec_')) { let nId = lM[k]; if (nId) { if (!nM[nId]) nM[nId] = {}; HORIZONS.forEach(h => { if (nM[k][h]) nM[nId][h] = (nM[nId][h] || []).concat(nM[k][h]); }); } delete nM[k]; mig = true; } });
    state.missions = nM; state.sectors.forEach(s => { if (!state.missions[s.id]) { state.missions[s.id] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]}; mig = true; } }); if (mig) save();
}

// --- INITIALIZATION ---
runDatabaseMigration(); generateStarfield(); render();
window.addEventListener('resize', () => { if(state.level === 1) render(); });
