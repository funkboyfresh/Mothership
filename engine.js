const HORIZONS = ['TRAJECTORY', 'HORIZON', 'IMMINENT'];
const AUTO_PALETTE = ['#00e5ff', '#ffd700', '#ff00ff', '#00ff88', '#ff3366', '#a200ff', '#00ffcc', '#ff9900'];

let defaultSectors = [
    { id: 'sec_career', name: 'CAREER', color: '#00e5ff', seed: {x: 0.3, y: 0.3} },
    { id: 'sec_finance', name: 'FINANCIAL', color: '#ffd700', seed: {x: 0.7, y: 0.3} },
    { id: 'sec_personal', name: 'PERSONAL', color: '#ff00ff', seed: {x: 0.5, y: 0.7} }
];

let state = {
    level: 1, sectorId: null, horizon: null, activeMissionId: null,
    playerLevel: parseInt(localStorage.getItem('playerLevel')) || 1,
    energy: parseInt(localStorage.getItem('energy')) || 0,
    hapticsEnabled: localStorage.getItem('hapticsEnabled') !== 'false',
    sectors: JSON.parse(localStorage.getItem('sectors')) || defaultSectors,
    missions: JSON.parse(localStorage.getItem('missions')) || {}
};

let ignitionFlare = false;
let tempSubtasks = []; 
let editModeId = null;
let defaultHorizonContext = 'TRAJECTORY';
let isHorizonFixed = false;
let editingSectors = [];

// --- UTILITY: HAPTICS ---
function triggerHaptic(pattern) {
    if (state.hapticsEnabled && "vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}

// --- UTILITY: ENERGY ---
function updateHUD() {
    const levelEl = document.getElementById('hud-level');
    const energyEl = document.getElementById('hud-energy-readout');
    const barEl = document.getElementById('hud-capacitor-bar');
    
    if(levelEl) levelEl.innerText = `PILOT LEVEL ${state.playerLevel}`;
    if(energyEl) energyEl.innerText = `CAPACITOR ${state.energy}%`;
    if(barEl) barEl.style.width = `${state.energy}%`;
}

function addEnergy(amount) {
    state.energy += amount;
    if (state.energy < 0) state.energy = 0;
    if (state.energy >= 100) {
        const levelsGained = Math.floor(state.energy / 100);
        state.playerLevel += levelsGained;
        state.energy = state.energy % 100;
        triggerHyperDrive();
        triggerHaptic([100, 50, 100, 50, 200]);
    }
    save(); updateHUD();
}

function triggerHyperDrive() {
    const overlay = document.getElementById('level-up-overlay');
    if(!overlay) return;
    overlay.style.display = 'flex';
    overlay.style.animation = 'none';
    void overlay.offsetWidth;
    overlay.style.animation = 'hyper-flash 1.5s forwards ease-out';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}

// --- DATA: STORAGE & MIGRATION ---
function save() { 
    localStorage.setItem('sectors', JSON.stringify(state.sectors));
    localStorage.setItem('missions', JSON.stringify(state.missions)); 
    localStorage.setItem('energy', state.energy);
    localStorage.setItem('playerLevel', state.playerLevel);
    localStorage.setItem('hapticsEnabled', state.hapticsEnabled);
}

function runDatabaseMigration() {
    let migrated = false;
    let newMissions = { ...state.missions };
    const legacyMap = { 'CAREER': 'sec_career', 'FINANCIAL': 'sec_finance', 'PERSONAL': 'sec_personal' };

    Object.keys(newMissions).forEach(key => {
        if (!key.startsWith('sec_')) {
            const newId = legacyMap[key];
            if (newId) {
                if (!newMissions[newId]) newMissions[newId] = {};
                Object.keys(newMissions[key]).forEach(h => {
                    if (!newMissions[newId][h]) newMissions[newId][h] = [];
                    newMissions[newId][h] = newMissions[newId][h].concat(newMissions[key][h]);
                });
            }
            delete newMissions[key];
            migrated = true;
        }
    });
    state.missions = newMissions;

    state.sectors.forEach(s => {
        if (!state.missions[s.id]) { state.missions[s.id] = {}; migrated = true; }
        HORIZONS.forEach(h => {
            if (!state.missions[s.id][h]) { state.missions[s.id][h] = []; migrated = true; }
            state.missions[s.id][h].forEach((m, index, arr) => {
                m.subs = m.subs || []; 
                if (m.x === undefined || m.y === undefined || isNaN(m.x) || isNaN(m.y)) {
                    let coords = getSafeCoordinates(arr.slice(0, index));
                    m.x = coords.x; m.y = coords.y; migrated = true;
                }
            });
        });
    });
    if (migrated) save();
}

// --- CORE MATH: VORONOI & SPATIAL ---
function relaxLloyds(seeds, iterations) {
    let points = [...seeds];
    for(let k=0; k<iterations; k++) {
        const delaunay = d3.Delaunay.from(points, p => p.x, p => p.y);
        const voronoi = delaunay.voronoi([0, 0, 1, 1]);
        for (let i = 0; i < points.length; i++) {
            const polygon = voronoi.cellPolygon(i);
            if (polygon) {
                let cx = 0, cy = 0, area = 0;
                for (let j = 0, len = polygon.length; j < len - 1; j++) {
                    const [x0, y0] = polygon[j]; const [x1, y1] = polygon[j + 1];
                    const a = x0 * y1 - x1 * y0; area += a; cx += (x0 + x1) * a; cy += (y0 + y1) * a;
                }
                area *= 3; if (area !== 0) { points[i] = { x: cx / area, y: cy / area }; }
            }
        }
    }
    return points;
}

function getSafeCoordinates(existingMissions) {
    let x, y, safe; let attempts = 0;
    if(!existingMissions) return {x: 45, y: 45}; 
    do {
        x = Math.floor(Math.random() * 70) + 15;
        y = Math.floor(Math.random() * 50) + 25;
        safe = true;
        for (let m of existingMissions) {
            if (!m || m.x === undefined || isNaN(m.x)) continue;
            let dx = m.x - x; let dy = m.y - y;
            if (Math.sqrt(dx*dx + dy*dy) < 18) { safe = false; break; } 
        }
        attempts++;
    } while (!safe && attempts < 50);
    return {x, y};
}

// --- TEMPORAL ENGINE ---
function getHorizonFromDate(dateStr, fallbackHorizon) {
    if (!dateStr) return fallbackHorizon || 'TRAJECTORY';
    const today = new Date(); today.setHours(0,0,0,0);
    const dDate = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.ceil((dDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'IMMINENT';
    if (diffDays <= 14) return 'HORIZON';
    return 'TRAJECTORY';
}

function processTimeMechanics() {
    const today = new Date(); today.setHours(0,0,0,0);
    state.sectors.forEach(s => {
        if(!state.missions[s.id]) return; 
        HORIZONS.forEach(h => {
            if(!state.missions[s.id][h]) return;
            for (let i = state.missions[s.id][h].length - 1; i >= 0; i--) {
                let m = state.missions[s.id][h][i];
                if (m && m.dueDate && !m.captured) {
                    const dDate = new Date(m.dueDate + 'T00:00:00');
                    const diffDays = Math.ceil((dDate - today) / (1000 * 60 * 60 * 24));
                    const isNowOverdue = diffDays < 0;
                    if (isNowOverdue && !m.overdue) { addEnergy(-10); }
                    m.overdue = isNowOverdue;
                    let targetH = diffDays <= 7 ? 'IMMINENT' : (diffDays <= 14 ? 'HORIZON' : 'TRAJECTORY');
                    if (targetH !== h) {
                        state.missions[s.id][targetH].push(m);
                        state.missions[s.id][h].splice(i, 1);
                    }
                }
            }
        });
    });
    save();
}

function checkDecayStatus() {
    let hasDecay = false;
    state.sectors.forEach(s => {
        if(!state.missions[s.id]) return;
        HORIZONS.forEach(h => {
            if(state.missions[s.id][h]) {
                state.missions[s.id][h].forEach(m => {
                    if (m && m.overdue && !m.captured) hasDecay = true;
                });
            }
        });
    });
    const levelReadout = document.getElementById('hud-level');
    const energyReadout = document.getElementById('hud-energy-readout');
    if (hasDecay) {
        if(levelReadout) { levelReadout.innerText = "WARNING: DECAY DETECTED"; levelReadout.classList.add('hud-warning'); }
        if(energyReadout) energyReadout.classList.add('hud-warning');
    } else {
        if(levelReadout) { levelReadout.innerText = `PILOT LEVEL ${state.playerLevel}`; levelReadout.classList.remove('hud-warning'); }
        if(energyReadout) energyReadout.classList.remove('hud-warning');
    }
}

// --- RENDER ENGINE ---
function safelyGetActiveMission() {
    if(!state.sectorId || !state.missions[state.sectorId]) return null;
    for (let h of HORIZONS) {
        const found = state.missions[state.sectorId][h].find(x => x.id === state.activeMissionId);
        if (found) { state.horizon = h; return found; }
    }
    return null;
}

function render() {
    updateHUD(); processTimeMechanics(); checkDecayStatus();
    const container = document.getElementById('view-container');
    const zoomBtn = document.getElementById('zoom-out');
    const bread = document.getElementById('breadcrumb');
    const footer = document.getElementById('control-footer');
    if(!container) return;
    
    container.innerHTML = '';
    if(zoomBtn) zoomBtn.style.visibility = state.level > 1 ? 'visible' : 'hidden';
    
    const activeSector = state.sectors.find(s => s.id === state.sectorId);
    const secName = activeSector ? activeSector.name : 'GALAXY';
    if(bread) bread.innerText = `${secName} ${state.horizon ? '> ' + state.horizon : ''}`;
    
    if (state.level === 1) {
        if(footer) {
            footer.style.display = 'flex';
            footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openSectorModal()">[ EDIT MAP ]</button>`;
        }
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); 
        svg.id = "voronoi-map"; container.appendChild(svg);
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        
        let seeds = state.sectors.map(s => ({x: s.seed.x, y: s.seed.y}));
        if(seeds.length > 0) {
            seeds = relaxLloyds(seeds, 10);
            const delaunay = d3.Delaunay.from(seeds.map(s => [s.x * w, s.y * h]));
            const voronoi = delaunay.voronoi([0, 0, w, h]);
            
            state.sectors.forEach((s, i) => {
                const pathData = voronoi.renderCell(i);
                if(!pathData) return;
                
                const isOverdue = state.missions[s.id] && HORIZONS.some(hz => state.missions[s.id][hz] && state.missions[s.id][hz].some(m => m.overdue && !m.captured));
                
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", pathData);
                path.setAttribute("fill", isOverdue ? 'var(--thrust)' : s.color);
                path.setAttribute("fill-opacity", isOverdue ? 0.2 : 0.05);
                path.setAttribute("stroke", isOverdue ? 'var(--thrust)' : s.color);
                path.setAttribute("stroke-width", "2"); path.setAttribute("class", "voronoi-cell");
                path.onclick = () => selectSector(s.id); svg.appendChild(path);
                
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", seeds[i].x * w); text.setAttribute("y", seeds[i].y * h);
                text.setAttribute("fill", isOverdue ? 'var(--thrust)' : s.color); text.setAttribute("class", "voronoi-text");
                text.style.textShadow = `0 0 10px ${isOverdue ? 'var(--thrust)' : s.color}`;
                text.textContent = s.name; svg.appendChild(text);
            });
        }
    } 
    else if (state.level === 2) {
        if(footer) {
            footer.style.display = 'flex';
            footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openTaskModal('TRAJECTORY', false)">+ INITIALIZE TARGET</button>`;
        }
        container.innerHTML = `<div class="view-level-title">LEVEL 2 // ${secName}</div><h1 class="view-main-title">Planetary Map</h1>`;
        const center = document.createElement('div');
        center.className = 'warp-transition';
        center.style.position = 'relative'; center.style.width = '280px'; center.style.height = '280px';
        center.style.display = 'flex'; center.style.alignItems = 'center'; center.style.justifyContent = 'center';
        center.style.background = 'radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%)'; center.style.borderRadius = '50%';
        
        [ { id: 'TRAJECTORY', size: 280, speed: 60 }, { id: 'HORIZON', size: 190, speed: 30 }, { id: 'IMMINENT', size: 100, speed: 15 } ].forEach(d => {
            let isRingOverdue = state.missions[state.sectorId] && state.missions[state.sectorId][d.id] ? state.missions[state.sectorId][d.id].some(m => m.overdue && !m.captured) : false;
            const wrapper = document.createElement('div');
            wrapper.className = `ring-circle ${isRingOverdue ? 'overdue' : ''}`;
            wrapper.style.width = d.size + 'px'; wrapper.style.height = d.size + 'px';
            wrapper.onclick = (e) => { e.stopPropagation(); state.horizon = d.id; state.level = 3; triggerHaptic(15); render(); };
            const label = document.createElement('div'); label.className = 'ring-label'; label.innerText = d.id; wrapper.appendChild(label);
            const starField = document.createElement('div');
            starField.style.position = 'absolute'; starField.style.width = '100%'; starField.style.height = '100%';
            starField.style.animation = `orbit-spin ${d.speed}s linear infinite`; starField.style.pointerEvents = 'none';
            const missions = state.missions[state.sectorId] && state.missions[state.sectorId][d.id] ? state.missions[state.sectorId][d.id] : [];
            missions.forEach((m, i) => {
                const angle = (i / missions.length) * Math.PI * 2;
                const x = (d.size/2) + (d.size/2) * Math.cos(angle); const y = (d.size/2) + (d.size/2) * Math.sin(angle);
                const dot = document.createElement('div');
                dot.style.position = 'absolute'; dot.style.width = '6px'; dot.style.height = '6px';
                dot.style.backgroundColor = m.overdue && !m.captured ? 'var(--thrust)' : 'var(--accent)';
                dot.style.borderRadius = '50%'; dot.style.left = `calc(${x}px - 3px)`; dot.style.top = `calc(${y}px - 3px)`;
                starField.appendChild(dot);
            });
            wrapper.appendChild(starField); center.appendChild(wrapper);
        });
        container.appendChild(center);
    }
    else if (state.level === 3) {
        if(footer) {
            footer.style.display = 'flex';
            footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openTaskModal('${state.horizon}', true)">+ INITIALIZE TARGET (${state.horizon})</button>`;
        }
        container.innerHTML = `<div class="view-level-title">LEVEL 3 // ${state.horizon}</div><h1 class="view-main-title">Constellation Map</h1>`;
        const missions = state.missions[state.sectorId][state.horizon] || [];
        if (missions.length > 0) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.id = "constellation-svg"; container.appendChild(svg);
            missions.forEach((m, i) => {
                const decay = m.overdue && !m.captured;
                const star = document.createElement('div'); 
                star.className = `star-container ${decay ? 'decaying' : ''} warp-transition`;
                star.style.left = m.x + '%'; star.style.top = m.y + '%'; 
                star.onclick = () => selectMission(m.id);
                star.innerHTML = `<div class="star-node ${m.captured ? 'captured' : ''}">${i+1}</div><div class="star-label">${m.name}</div>`;
                container.appendChild(star);
            });
        }
    }
    else if (state.level === 4) {
        if(footer) footer.style.display = 'none';
        const m = safelyGetActiveMission();
        if (!m) { zoomOut(); return; }
        const safeSubs = m.subs || [];
        const completed = safeSubs.filter(s => s.c).length;
        const progress = safeSubs.length ? Math.round((completed / safeSubs.length) * 100) : 0;
        const allDone = safeSubs.length > 0 && completed === safeSubs.length;
        let orbHtml = `<div class="target-lock warp-transition">
            <div class="view-level-title">LEVEL 4 // ${m.captured ? 'ARCHIVE' : 'ACTIVE'}</div>
            <h2 style="color:${m.overdue && !m.captured ? 'var(--thrust)' : 'var(--text)'}">${m.name}</h2>
            <div class="progress-wrapper"><div class="progress-bar-container"><div class="progress-fill" style="width: ${progress}%;"></div></div><div class="progress-text">${progress}% INTEGRITY</div></div>
            <div class="orbital-system"><svg viewBox="0 0 340 340" style="position:absolute; width:100%; height:100%;"><circle cx="170" cy="170" r="14" fill="${allDone ? 'var(--captured)' : 'var(--bg)'}" stroke="var(--accent)" stroke-width="2"/></svg>`;
        safeSubs.forEach((s, i) => {
            const angle = (i / safeSubs.length) * Math.PI * 2;
            const x = 170 + 100 * Math.cos(angle); const y = 170 + 100 * Math.sin(angle);
            orbHtml += `<div style="position:absolute; left:${x}px; top:${y}px; transform:translate(-50%, -50%); cursor:pointer;" onclick="${m.captured ? '' : `toggleSub(${i}, event)`}"><div class="orbital-node-box ${s.c ? 'checked' : ''}"><div class="orb-check">${s.c ? '✓' : ''}</div><div class="orb-text">${s.t}</div></div></div>`;
        });
        orbHtml += `</div><div style="display:flex; gap:10px; margin-top: auto;"><button class="mod-btn" onclick="openEditModal(${m.id})">EDIT</button><button class="mod-btn" onclick="deleteMission(${m.id}, event)" style="color:var(--thrust)">DESTROY</button></div></div>`;
        if (allDone && !m.captured) {
            orbHtml += `<div class="hex-modal warp-transition"><h2 style="color: var(--captured)">TARGET SECURED</h2><button class="success-btn" onclick="completeMission()">LOG MISSION & WARP</button></div>`;
        }
        container.innerHTML = orbHtml;
    }
}

// --- SECTOR MAP CONFIG ---
function openSectorModal() { editingSectors = JSON.parse(JSON.stringify(state.sectors)); renderSectorEditList(); document.getElementById('sector-modal-overlay').style.display = 'flex'; }
function closeSectorModal() { document.getElementById('sector-modal-overlay').style.display = 'none'; }
function renderSectorEditList() {
    const list = document.getElementById('sector-edit-list');
    const addBtn = document.getElementById('sector-add-btn');
    if(!list) return;
    list.innerHTML = '';
    editingSectors.forEach((s, i) => {
        const row = document.createElement('div'); row.className = 'subtask-row';
        row.innerHTML = `<input type="color" value="${s.color}" onchange="editingSectors[${i}].color = this.value"><input type="text" class="modal-input" value="${s.name}" oninput="editingSectors[${i}].name = this.value"><button class="subtask-remove" onclick="editingSectors.splice(${i}, 1); renderSectorEditList();">-</button>`;
        list.appendChild(row);
    });
    if(addBtn) addBtn.style.display = editingSectors.length >= 9 ? 'none' : 'block';
}
function addNewSector() { if (editingSectors.length < 9) { editingSectors.push({ id: 'sec_' + Date.now(), name: 'NEW SECTOR', color: AUTO_PALETTE[editingSectors.length % AUTO_PALETTE.length], seed: { x: Math.random(), y: Math.random() } }); renderSectorEditList(); } }
function saveSectorModal() {
    if (editingSectors.length < 1) { alert("Must have at least 1 active sector."); return; }
    editingSectors.forEach(s => {
        if (!state.missions[s.id]) { state.missions[s.id] = { 'TRAJECTORY': [], 'HORIZON': [], 'IMMINENT': [] }; }
    });
    state.sectors = JSON.parse(JSON.stringify(editingSectors));
    save(); closeSectorModal(); render();
}

// --- TASK INITIALIZATION ---
function openTaskModal(h, f) { editModeId = null; defaultHorizonContext = h; isHorizonFixed = f; document.getElementById('modal-horizon-select').value = h; document.getElementById('modal-horizon-group').style.display = f ? 'none' : 'block'; tempSubtasks = ['', '', '']; renderModalSubtasks(); document.getElementById('task-modal-overlay').style.display = 'flex'; }
function renderModalSubtasks() { const list = document.getElementById('modal-subtasks-list'); if(!list) return; list.innerHTML = ''; tempSubtasks.forEach((sub, i) => { const row = document.createElement('div'); row.className = 'subtask-row'; row.innerHTML = `<input type="text" class="modal-input" value="${sub}" oninput="tempSubtasks[${i}] = this.value"><button class="subtask-remove" onclick="tempSubtasks.splice(${i}, 1); renderModalSubtasks();">-</button>`; list.appendChild(row); }); }
function addModalSubtask() { if (tempSubtasks.length < 10) { tempSubtasks.push(''); renderModalSubtasks(); } }
function closeTaskModal() { document.getElementById('task-modal-overlay').style.display = 'none'; }
function saveTaskModal() {
    const name = document.getElementById('modal-task-name').value.trim();
    if (!name) return;
    const dateStr = document.getElementById('modal-task-date').value;
    const h = isHorizonFixed ? defaultHorizonContext : document.getElementById('modal-horizon-select').value;
    const finalH = getHorizonFromDate(dateStr, h);
    if (!state.missions[state.sectorId]) state.missions[state.sectorId] = { TRAJECTORY:[], HORIZON:[], IMMINENT:[] };
    const coords = getSafeCoordinates(state.missions[state.sectorId][finalH]);
    state.missions[state.sectorId][finalH].push({ id: Date.now(), name, subs: tempSubtasks.filter(t => t.trim()).map(t => ({t, c:false})), x: coords.x, y: coords.y, dueDate: dateStr || null });
    save(); closeTaskModal(); render();
}

// --- SETTINGS ---
function openSettingsModal() { document.getElementById('settings-haptics-toggle').checked = state.hapticsEnabled; document.getElementById('settings-modal-overlay').style.display = 'flex'; }
function closeSettingsModal() { state.hapticsEnabled = document.getElementById('settings-haptics-toggle').checked; save(); document.getElementById('settings-modal-overlay').style.display = 'none'; }

// --- NAV & INTERACTION ---
function selectSector(id) { state.sectorId = id; state.level = 2; triggerHaptic(15); render(); }
function selectMission(id) { state.activeMissionId = id; state.level = 4; triggerHaptic(15); render(); }
function toggleSub(index, e) {
    const m = safelyGetActiveMission();
    if (m && m.subs[index]) {
        m.subs[index].c = !m.subs[index].c;
        if (m.subs[index].c) { triggerHaptic(30); addEnergy(5); } else { addEnergy(-5); }
        save(); render();
    }
}
function completeMission() {
    const m = safelyGetActiveMission();
    if (m) { m.captured = true; addEnergy(25); triggerHaptic([50, 30, 50]); save(); state.level = 3; render(); }
}
function deleteMission(id, e) { if(confirm("Destroy?")) { HORIZONS.forEach(h => { if(state.missions[state.sectorId][h]) state.missions[state.sectorId][h] = state.missions[state.sectorId][h].filter(m => m.id !== id); }); save(); state.level = 3; render(); } }
function zoomOut() { state.level = Math.max(1, state.level - 1); if (state.level === 1) state.sectorId = null; render(); }

// BOOT
runDatabaseMigration(); generateStarfield(); render();
window.addEventListener('resize', () => { if(state.level === 1) render(); });
