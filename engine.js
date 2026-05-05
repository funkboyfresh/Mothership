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
    missions: JSON.parse(localStorage.getItem('missions')) || {}
};

// --- SYNC ENGINE: Theme updates based on Sector ---
function updateAccentColor() {
    const activeSector = state.sectors.find(s => s.id === state.sectorId);
    const hex = activeSector ? activeSector.color : '#00e5ff';
    document.documentElement.style.setProperty('--accent', hex);
    
    // Generate derived glow
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){c= [c[0], c[0], c[1], c[1], c[2], c[2]];}
        c= '0x'+c.join('');
        const rgba = 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',0.6)';
        document.documentElement.style.setProperty('--accent-glow', rgba);
    }
}

function triggerHaptic(pattern) {
    if (state.hapticsEnabled && "vibrate" in navigator) navigator.vibrate(pattern);
}

function updateHUD() {
    document.getElementById('hud-level').innerText = `PILOT LEVEL ${state.playerLevel}`;
    document.getElementById('hud-energy-readout').innerText = `CAPACITOR ${state.energy}%`;
    document.getElementById('hud-capacitor-bar').style.width = `${state.energy}%`;
}

function addEnergy(amount) {
    state.energy += amount;
    if (state.energy < 0) state.energy = 0;
    if (state.energy >= 100) {
        state.playerLevel += Math.floor(state.energy / 100);
        state.energy = state.energy % 100;
        triggerHyperDrive();
        triggerHaptic([100, 50, 100, 50, 200]);
    }
    save(); updateHUD();
}

function triggerHyperDrive() {
    const overlay = document.getElementById('level-up-overlay');
    if(!overlay) return;
    overlay.style.display = 'flex'; overlay.style.animation = 'none';
    void overlay.offsetWidth; overlay.style.animation = 'hyper-flash 1.5s forwards ease-out';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}

function save() { 
    localStorage.setItem('sectors', JSON.stringify(state.sectors));
    localStorage.setItem('missions', JSON.stringify(state.missions)); 
    localStorage.setItem('energy', state.energy);
    localStorage.setItem('playerLevel', state.playerLevel);
    localStorage.setItem('hapticsEnabled', state.hapticsEnabled);
}

// --- MATH & SPATIAL ---
function relaxLloyds(seeds, iterations) {
    let points = seeds.map(p => ({x: p.x, y: p.y}));
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
                area *= 3; if (area !== 0) points[i] = { x: cx / area, y: cy / area };
            }
        }
    }
    return points;
}

function getSafeCoordinates(existing) {
    let x, y, safe, attempts = 0;
    do {
        x = 15 + Math.random() * 70; y = 25 + Math.random() * 50; safe = true;
        for (let m of existing) {
            if (!m || isNaN(m.x)) continue;
            if (Math.sqrt(Math.pow(m.x - x, 2) + Math.pow(m.y - y, 2)) < 18) { safe = false; break; }
        }
        attempts++;
    } while (!safe && attempts < 50);
    return {x, y};
}

// --- RENDERING ---
function render() {
    updateAccentColor();
    updateHUD();
    const container = document.getElementById('view-container');
    const zoomBtn = document.getElementById('zoom-out');
    const bread = document.getElementById('breadcrumb');
    const footer = document.getElementById('control-footer');
    if(!container) return; container.innerHTML = '';
    
    zoomBtn.style.visibility = state.level > 1 ? 'visible' : 'hidden';
    const activeSector = state.sectors.find(s => s.id === state.sectorId);
    bread.innerText = `${activeSector ? activeSector.name : 'GALAXY'} ${state.horizon ? '> ' + state.horizon : ''}`;
    
    if (state.level === 1) {
        footer.style.display = 'flex';
        footer.innerHTML = `<button class="zoom-btn" style="padding: 10px 20px" onclick="openSectorModal()">[ EDIT MAP ]</button>`;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); 
        svg.id = "voronoi-map"; container.appendChild(svg);
        const w = container.clientWidth || window.innerWidth, h = container.clientHeight || window.innerHeight;
        let seeds = relaxLloyds(state.sectors.map(s => s.seed), 10);
        const voronoi = d3.Delaunay.from(seeds.map(s => [s.x * w, s.y * h])).voronoi([0, 0, w, h]);
        state.sectors.forEach((s, i) => {
            const pathData = voronoi.renderCell(i); if(!pathData) return;
            const overdue = state.missions[s.id] && HORIZONS.some(hz => state.missions[s.id][hz]?.some(m => m.overdue && !m.captured));
            const color = overdue ? 'var(--thrust)' : s.color;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathData); path.setAttribute("fill", color); path.setAttribute("fill-opacity", overdue ? 0.2 : 0.05);
            path.setAttribute("stroke", color); path.setAttribute("stroke-width", "2"); path.setAttribute("class", "voronoi-cell");
            path.onclick = () => { state.sectorId = s.id; state.level = 2; triggerHaptic(15); render(); }; svg.appendChild(path);
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", seeds[i].x * w); text.setAttribute("y", seeds[i].y * h);
            text.setAttribute("fill", color); text.setAttribute("class", "voronoi-text");
            text.style.textShadow = `0 0 10px ${color}`; text.textContent = s.name; svg.appendChild(text);
        });
    } 
    else if (state.level === 2) {
        footer.style.display = 'flex';
        footer.innerHTML = `<button class="zoom-btn" onclick="openTaskModal('TRAJECTORY', false)">+ INITIALIZE TARGET</button>`;
        container.innerHTML = `<div class="view-level-title">LEVEL 2 // ${activeSector.name}</div><h1 class="view-main-title">Planetary Map</h1>`;
        const center = document.createElement('div'); center.className = 'warp-transition';
        center.style.cssText = 'position:relative; width:280px; height:280px; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%); border-radius:50%;';
        [ { id: 'TRAJECTORY', size: 280, speed: 60 }, { id: 'HORIZON', size: 190, speed: 30 }, { id: 'IMMINENT', size: 100, speed: 15 } ].forEach(d => {
            const overdue = state.missions[state.sectorId]?.[d.id]?.some(m => m.overdue && !m.captured);
            const wrapper = document.createElement('div'); wrapper.className = `ring-circle ${overdue ? 'overdue' : ''}`;
            wrapper.style.width = d.size + 'px'; wrapper.style.height = d.size + 'px';
            wrapper.onclick = (e) => { e.stopPropagation(); state.horizon = d.id; state.level = 3; triggerHaptic(15); render(); };
            const label = document.createElement('div'); label.className = 'ring-label'; label.innerText = d.id; wrapper.appendChild(label);
            const starField = document.createElement('div'); starField.style.cssText = `position:absolute; width:100%; height:100%; animation: orbit-spin ${d.speed}s linear infinite; pointer-events:none;`;
            const missions = state.missions[state.sectorId]?.[d.id] || [];
            missions.forEach((m, i) => {
                const angle = (i / missions.length) * Math.PI * 2, r = d.size/2;
                const dot = document.createElement('div'); dot.style.cssText = `position:absolute; width:6px; height:6px; border-radius:50%; background:${m.overdue && !m.captured ? 'var(--thrust)' : 'var(--accent)'}; left:calc(${r + r * Math.cos(angle)}px - 3px); top:calc(${r + r * Math.sin(angle)}px - 3px); box-shadow: 0 0 5px var(--accent);`;
                starField.appendChild(dot);
            });
            wrapper.appendChild(starField); center.appendChild(wrapper);
        });
        container.appendChild(center);
    }
    else if (state.level === 3) {
        footer.style.display = 'flex';
        footer.innerHTML = `<button class="zoom-btn" onclick="openTaskModal('${state.horizon}', true)">+ INITIALIZE TARGET (${state.horizon})</button>`;
        container.innerHTML = `<div class="view-level-title">LEVEL 3 // ${state.horizon}</div><h1 class="view-main-title">Constellation Map</h1>`;
        const missions = state.missions[state.sectorId]?.[state.horizon] || [];
        if (missions.length > 0) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.id = "constellation-svg"; container.appendChild(svg);
            missions.forEach((m, i) => {
                const star = document.createElement('div'); star.className = `star-container ${m.overdue && !m.captured ? 'decaying' : ''} warp-transition`;
                star.style.cssText = `left:${m.x}%; top:${m.y}%;`;
                star.onclick = () => { state.activeMissionId = m.id; state.level = 4; triggerHaptic(15); render(); };
                star.innerHTML = `<div class="star-node ${m.captured ? 'captured' : ''}" style="border-color: var(--accent);">${i+1}</div><div class="star-label">${m.name}</div>`;
                container.appendChild(star);
            });
        }
    }
    else if (state.level === 4) {
        footer.style.display = 'none'; const m = safelyGetActiveMission();
        if (!m) { zoomOut(); return; }
        const completed = m.subs.filter(s => s.c).length, progress = m.subs.length ? Math.round((completed / m.subs.length) * 100) : 0, allDone = m.subs.length > 0 && completed === m.subs.length;
        let orbHtml = `<div class="target-lock warp-transition"><div class="view-level-title">LEVEL 4 // ${m.captured ? 'ARCHIVE' : 'ACTIVE'}</div><h2 style="color:${m.overdue && !m.captured ? 'var(--thrust)' : 'var(--text)'}">${m.name}</h2><div class="progress-wrapper"><div class="progress-fill" style="width: ${progress}%;"></div><div class="progress-text">${progress}% INTEGRITY</div></div><div class="orbital-system"><svg viewBox="0 0 340 340" style="position:absolute; width:100%; height:100%;"><circle cx="170" cy="170" r="14" fill="${allDone ? 'var(--captured)' : 'var(--bg)'}" stroke="var(--accent)" stroke-width="2"/>`;
        
        m.subs.forEach((s, i) => {
            const angle = (i / m.subs.length) * Math.PI * 2, x = 170 + 110 * Math.cos(angle), y = 170 + 110 * Math.sin(angle);
            orbHtml += `<line x1="170" y1="170" x2="${x}" y2="${y}" stroke="${s.c ? 'var(--accent)' : 'var(--border)'}" stroke-dasharray="4" stroke-width="1" />`;
        });
        orbHtml += `</svg>`;

        m.subs.forEach((s, i) => {
            const angle = (i / m.subs.length) * Math.PI * 2, x = 170 + 110 * Math.cos(angle), y = 170 + 110 * Math.sin(angle);
            orbHtml += `<div style="position:absolute; left:${x}px; top:${y}px; transform:translate(-50%, -50%); cursor:pointer;" onclick="${m.captured ? '' : `toggleSubTask(${i})`}"><div class="orbital-node-box ${s.c ? 'checked' : ''}"><div class="orb-check">${s.c ? '✓' : ''}</div><div class="orb-text">${s.t}</div></div></div>`;
        });
        orbHtml += `</div><div class="modal-actions" style="margin-top:auto"><button class="mod-btn" onclick="openEditModal(${m.id})">EDIT</button><button class="mod-btn" onclick="deleteMission(${m.id})" style="color:var(--thrust); border-color:var(--thrust)">DESTROY</button></div></div>`;
        if (allDone && !m.captured) orbHtml += `<div class="hex-modal warp-transition"><h2 style="color: var(--captured)">TARGET SECURED</h2><button class="success-btn" onclick="completeMission()">LOG MISSION & WARP</button></div>`;
        container.innerHTML = orbHtml;
    }
}

// --- MODALS & CONTROLS ---
function handleBackdropClick(e, type) { if (e.target.classList.contains('modal-overlay')) { if(type === 'task') closeTaskModal(); else if(type === 'sector') closeSectorModal(); else if(type === 'settings') closeSettingsModal(false); } }
function openSettingsModal() { document.getElementById('settings-haptics-toggle').checked = state.hapticsEnabled; document.getElementById('settings-modal-overlay').style.display = 'flex'; }
function closeSettingsModal(saveChanges) { if(saveChanges) state.hapticsEnabled = document.getElementById('settings-haptics-toggle').checked; save(); document.getElementById('settings-modal-overlay').style.display = 'none'; }
function openSectorModal() { editingSectors = JSON.parse(JSON.stringify(state.sectors)); renderSectorEditList(); document.getElementById('sector-modal-overlay').style.display = 'flex'; }
function closeSectorModal() { document.getElementById('sector-modal-overlay').style.display = 'none'; }
function renderSectorEditList() {
    const list = document.getElementById('sector-edit-list'), addBtn = document.getElementById('sector-add-btn');
    list.innerHTML = '';
    editingSectors.forEach((s, i) => {
        const row = document.createElement('div'); row.className = 'subtask-row';
        row.innerHTML = `<input type="color" value="${s.color}" onchange="editingSectors[${i}].color = this.value"><input type="text" class="modal-input" value="${s.name}" oninput="editingSectors[${i}].name = this.value"><button class="subtask-remove" onclick="editingSectors.splice(${i}, 1); renderSectorEditList();">-</button>`;
        list.appendChild(row);
    });
    addBtn.style.display = editingSectors.length >= 9 ? 'none' : 'block';
}
function addNewSector() { if (editingSectors.length < 9) { editingSectors.push({ id: 'sec_' + Date.now(), name: 'NEW SECTOR', color: AUTO_PALETTE[editingSectors.length % AUTO_PALETTE.length], seed: { x: Math.random(), y: Math.random() } }); renderSectorEditList(); } }
function saveSectorModal() { state.sectors = JSON.parse(JSON.stringify(editingSectors)); save(); closeSectorModal(); render(); }
function openTaskModal(h, f) { editModeId = null; defaultHorizonContext = h; isHorizonFixed = f; document.getElementById('modal-horizon-select').value = h; document.getElementById('modal-horizon-group').style.display = f ? 'none' : 'block'; document.getElementById('modal-task-name').value = ''; document.getElementById('modal-task-date').value = ''; tempSubtasks = ['', '', '']; renderModalSubtasks(); document.getElementById('task-modal-overlay').style.display = 'flex'; }
function renderModalSubtasks() { const list = document.getElementById('modal-subtasks-list'); list.innerHTML = ''; tempSubtasks.forEach((sub, i) => { const row = document.createElement('div'); row.className = 'subtask-row'; row.innerHTML = `<input type="text" class="modal-input" value="${sub}" oninput="tempSubtasks[${i}] = this.value"><button class="subtask-remove" onclick="tempSubtasks.splice(${i}, 1); renderModalSubtasks();">-</button>`; list.appendChild(row); }); }
function addModalSubtask() { if (tempSubtasks.length < 10) { tempSubtasks.push(''); renderModalSubtasks(); } }
function closeTaskModal() { document.getElementById('task-modal-overlay').style.display = 'none'; }
function saveTaskModal() {
    const name = document.getElementById('modal-task-name').value.trim(); if (!name) return;
    const dateStr = document.getElementById('modal-task-date').value;
    const h = isHorizonFixed ? defaultHorizonContext : document.getElementById('modal-horizon-select').value;
    if (!state.missions[state.sectorId]) state.missions[state.sectorId] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]};
    const coords = getSafeCoordinates(state.missions[state.sectorId][h] || []);
    state.missions[state.sectorId][h].push({ id: Date.now(), name, subs: tempSubtasks.filter(t => t.trim()).map(t => ({t, c:false})), x: coords.x, y: coords.y, dueDate: dateStr || null });
    save(); closeTaskModal(); render();
}
function openEditModal(id) {
    editModeId = id; let targetMission = null, targetHorizon = null;
    HORIZONS.forEach(h => { const found = state.missions[state.sectorId]?.[h]?.find(m => m.id === id); if (found) { targetMission = found; targetHorizon = h; } });
    if (!targetMission) return;
    document.getElementById('modal-task-name').value = targetMission.name; document.getElementById('modal-task-date').value = targetMission.dueDate || '';
    tempSubtasks = targetMission.subs.map(s => s.t); renderModalSubtasks(); document.getElementById('task-modal-overlay').style.display = 'flex';
}
function toggleSubTask(index) {
    const m = safelyGetActiveMission();
    if (m && m.subs[index]) { m.subs[index].c = !m.subs[index].c; if (m.subs[index].c) { triggerHaptic(30); addEnergy(5); } else { addEnergy(-5); } save(); render(); }
}
function completeMission() { const m = safelyGetActiveMission(); if (m) { m.captured = true; addEnergy(25); triggerHaptic([50, 30, 50]); save(); state.level = 3; render(); } }
function deleteMission(id) { if(confirm("Destroy?")) { HORIZONS.forEach(h => { if(state.missions[state.sectorId]?.[h]) state.missions[state.sectorId][h] = state.missions[state.sectorId][h].filter(m => m.id !== id); }); save(); state.level = 3; render(); } }
function zoomOut() { state.level = Math.max(1, state.level - 1); if (state.level === 1) { state.sectorId = null; state.horizon = null; } render(); }

// --- BOOT ---
function generateStarfield() {
    const field = document.getElementById('global-starfield'); if(!field) return; field.innerHTML = '';
    for(let i=0; i<150; i++) {
        const p = document.createElement('div'); p.className = 'void-particle';
        p.style.cssText = `width:${Math.random()*2}px; height:${Math.random()*2}px; left:${Math.random()*100}%; top:${Math.random()*100}%; animation: void-drift ${Math.random()*5+3}s linear infinite alternate;`;
        field.appendChild(p);
    }
}
render(); generateStarfield();
window.addEventListener('resize', () => { if(state.level === 1) render(); });
