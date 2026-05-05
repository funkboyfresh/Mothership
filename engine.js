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

if (!state.sectors || state.sectors.length === 0) { state.sectors = [...defaultSectors]; }

function triggerHaptic(pattern) {
    if (state.hapticsEnabled && "vibrate" in navigator) { navigator.vibrate(pattern); }
}

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
    void overlay.offsetWidth;
    overlay.style.animation = 'hyper-flash 1.5s forwards ease-out';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}

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
            delete newMissions[key]; migrated = true;
        }
    });
    state.missions = newMissions;
    state.sectors.forEach(s => {
        if (!state.missions[s.id]) { state.missions[s.id] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]}; migrated = true; }
        HORIZONS.forEach(h => {
            if (!state.missions[s.id][h]) { state.missions[s.id][h] = []; migrated = true; }
            state.missions[s.id][h].forEach((m, index, arr) => {
                m.subs = m.subs || []; 
                if (m.x === undefined || isNaN(m.x)) {
                    let coords = getSafeCoordinates(arr.slice(0, index));
                    m.x = coords.x; m.y = coords.y; migrated = true;
                }
            });
        });
    });
    if (migrated) save();
}

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
                area *= 3; if (area !== 0) { points[i] = { x: cx / area, y: cy / area }; }
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
            let dx = m.x - x, dy = m.y - y; if (Math.sqrt(dx*dx + dy*dy) < 18) { safe = false; break; }
        }
        attempts++;
    } while (!safe && attempts < 50);
    return {x, y};
}

function getHorizonFromDate(dateStr, fallbackHorizon) {
    if (!dateStr) return fallbackHorizon || 'TRAJECTORY';
    const today = new Date(); today.setHours(0,0,0,0);
    const dDate = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.ceil((dDate - today) / 86400000);
    if (diffDays <= 7) return 'IMMINENT';
    if (diffDays <= 14) return 'HORIZON';
    return 'TRAJECTORY';
}

function processTimeMechanics() {
    const today = new Date(); today.setHours(0,0,0,0);
    state.sectors.forEach(s => {
        HORIZONS.forEach(h => {
            if(!state.missions[s.id] || !state.missions[s.id][h]) return;
            for (let i = state.missions[s.id][h].length - 1; i >= 0; i--) {
                let m = state.missions[s.id][h][i];
                if (m && m.dueDate && !m.captured) {
                    const dDate = new Date(m.dueDate + 'T00:00:00');
                    const diff = Math.ceil((dDate - today) / 86400000);
                    if (diff < 0 && !m.overdue) addEnergy(-10);
                    m.overdue = diff < 0;
                    let targetH = diff <= 7 ? 'IMMINENT' : (diff <= 14 ? 'HORIZON' : 'TRAJECTORY');
                    if (targetH !== h) { state.missions[s.id][targetH].push(m); state.missions[s.id][h].splice(i, 1); }
                }
            }
        });
    });
}

function checkDecayStatus() {
    let hasDecay = state.sectors.some(s => HORIZONS.some(h => state.missions[s.id]?.[h]?.some(m => m.overdue && !m.captured)));
    const levelReadout = document.getElementById('hud-level');
    const energyReadout = document.getElementById('hud-energy-readout');
    if (hasDecay) {
        if(levelReadout) { levelReadout.innerText = "CRITICAL DECAY"; levelReadout.classList.add('hud-warning'); }
        if(energyReadout) energyReadout.classList.add('hud-warning');
    } else {
        if(levelReadout) { levelReadout.innerText = `PILOT LEVEL ${state.playerLevel}`; levelReadout.classList.remove('hud-warning'); }
        if(energyReadout) energyReadout.classList.remove('hud-warning');
    }
}

function generateStarfield() {
    const field = document.getElementById('global-starfield'); if(!field) return; field.innerHTML = '';
    for(let i=0; i<250; i++) {
        const p = document.createElement('div'); p.className = 'void-particle';
        p.style.width = Math.random() * 2 + 'px'; p.style.height = p.style.width;
        p.style.left = Math.random() * 100 + '%'; p.style.top = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 5 + 3) + 's'; p.style.animationDelay = (Math.random() * 5) + 's';
        field.appendChild(p);
    }
}

function safelyGetActiveMission() {
    if(!state.sectorId || !state.missions[state.sectorId]) return null;
    for (let h of HORIZONS) {
        const found = state.missions[state.sectorId][h].find(x => x.id === state.activeMissionId);
        if (found) { state.horizon = h; return found; }
    }
    return null;
}

function render() {
    document.getElementById('app').classList.remove('critical-mode'); // Clears alert state globally
    updateHUD(); processTimeMechanics(); checkDecayStatus();
    const container = document.getElementById('view-container');
    const zoomBtn = document.getElementById('zoom-out');
    const bread = document.getElementById('breadcrumb');
    const footer = document.getElementById('control-footer');
    if(!container) return; 
    container.innerHTML = '';
    
    if(zoomBtn) zoomBtn.style.visibility = state.level > 1 ? 'visible' : 'hidden';
    
    const activeSector = state.sectors.find(s => s.id === state.sectorId);

    // Lock in the base color
    const currentAccent = activeSector ? activeSector.color : '#00e5ff';
    document.documentElement.style.setProperty('--accent', currentAccent);
    
    // Auto-generate the glow by attaching a 60% alpha channel ('99') to the hex code
    document.documentElement.style.setProperty('--accent-glow', currentAccent + '99');

    if(bread) bread.innerText = `${activeSector ? activeSector.name : 'GALAXY'} ${state.horizon ? '> ' + state.horizon : ''}`;
    
    switch(state.level) {
        case 1: renderLevel1(container, footer); break;
        case 2: renderLevel2(container, footer, activeSector); break;
        case 3: renderLevel3(container, footer); break;
        case 4: renderLevel4(container, footer); break;
    }
}

function renderLevel1(container, footer) {
    if(footer) { footer.style.display = 'flex'; footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openSectorModal()">[ EDIT MAP ]</button>`; }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.id = "voronoi-map"; container.appendChild(svg);
    const w = container.clientWidth || window.innerWidth, h = container.clientHeight || window.innerHeight;
    let seeds = relaxLloyds(state.sectors.map(s => s.seed), 10);
    const voronoi = d3.Delaunay.from(seeds.map(s => [s.x * w, s.y * h])).voronoi([0, 0, w, h]);
    
    state.sectors.forEach((s, i) => {
        const pathData = voronoi.renderCell(i); if(!pathData) return;
        const overdue = state.missions[s.id] && HORIZONS.some(hz => state.missions[s.id][hz]?.some(m => m.overdue && !m.captured));
        const color = overdue ? 'var(--thrust)' : s.color;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData); path.setAttribute("fill", color); path.setAttribute("fill-opacity", overdue ? 0.2 : 0.05);
        path.setAttribute("stroke", color); path.setAttribute("stroke-width", "2"); 
        path.setAttribute("class", `voronoi-cell ${overdue ? 'overdue-sector' : ''}`);
        path.onclick = () => { state.sectorId = s.id; state.level = 2; render(); }; svg.appendChild(path);
        
        const cx = seeds[i].x * w, cy = seeds[i].y * h;
        const rings = [ { id: 'IMMINENT', r: 12, s: 10 }, { id: 'HORIZON', r: 20, s: 20 }, { id: 'TRAJECTORY', r: 28, s: 40 } ];
        
        rings.forEach(ring => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r", ring.r);
            circle.setAttribute("fill", "none"); circle.setAttribute("stroke", color);
            circle.setAttribute("stroke-width", "0.5"); circle.setAttribute("opacity", "0.4");
            circle.style.pointerEvents = "none";
            svg.appendChild(circle);

            const missions = state.missions[s.id]?.[ring.id] || [];
            if (missions.length > 0) {
                // NEW: Animated group for orbital rotation
                const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
                group.style.transformOrigin = `${cx}px ${cy}px`;
                group.style.animation = `orbit-spin ${ring.s}s linear infinite`;
                
                missions.forEach((m, idx) => {
                    if (m.captured) return;
                    const angle = (idx / missions.length) * Math.PI * 2;
                    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    dot.setAttribute("cx", cx + ring.r * Math.cos(angle)); 
                    dot.setAttribute("cy", cy + ring.r * Math.sin(angle)); 
                    dot.setAttribute("r", "1.5");
                    dot.setAttribute("fill", m.overdue ? 'var(--thrust)' : color);
                    dot.style.pointerEvents = "none";
                    group.appendChild(dot);
                });
                svg.appendChild(group);
            }
        });
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", cx); text.setAttribute("y", cy + 45);
        text.setAttribute("fill", color); text.setAttribute("class", "voronoi-text");
        text.style.textShadow = `0 0 10px ${color}`; 
        text.textContent = s.name;
        svg.appendChild(text);
    });
}

function renderLevel2(container, footer, activeSector) {
    if(footer) { footer.style.display = 'flex'; footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openTaskModal('TRAJECTORY', false)">+ INITIALIZE TARGET</button>`; }
    
    const header = document.createElement('div');
    header.innerHTML = `<div class="view-level-title">LEVEL 2 // <span id="sector-title-safe"></span></div><h1 class="view-main-title">Planetary Map</h1>`;
    container.appendChild(header);
    document.getElementById('sector-title-safe').textContent = activeSector.name;

    const center = document.createElement('div'); center.className = 'warp-transition';
    center.style.cssText = 'position:relative; width:280px; height:280px; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%); border-radius:50%;';
    
    // Particle Density Starfield
    const gravityWell = document.createElement('div');
    gravityWell.style.cssText = 'position:absolute; width:100%; height:100%; pointer-events:none; border-radius:50%;';
    const innerMin = 30, outerMax = 140 + (140 * 0.25);
    for (let i = 0; i < 225; i++) {
        const p = document.createElement('div');
        const r = innerMin + (Math.random() * (outerMax - innerMin));
        const angle = Math.random() * Math.PI * 2;
        const x = 140 + r * Math.cos(angle), y = 140 + r * Math.sin(angle), size = Math.random() * 1.5 + 0.5;
        p.style.cssText = `position:absolute; width:${size}px; height:${size}px; background:#fff; border-radius:50%; opacity:${Math.random() * 0.4 + 0.1}; left:${x}px; top:${y}px; animation: orbit-spin ${40 + Math.random() * 80}s linear infinite;`;
        gravityWell.appendChild(p);
    }
    center.appendChild(gravityWell);

    // --- NEW: SVG Overlay for Curved Text Paths ---
    const textSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    textSvg.style.cssText = 'position:absolute; width:100%; height:100%; pointer-events:none; z-index:20;';
    textSvg.setAttribute("viewBox", "0 0 280 280");

    // Define the paths for the text to follow (Middle and Outer rings)
    textSvg.innerHTML = `
        <defs>
            <path id="path-horizon" d="M 45,140 A 95,95 0 0,1 235,140" />
            <path id="path-trajectory" d="M 0,140 A 140,140 0 0,1 280,140" />
        </defs>
    `;
    center.appendChild(textSvg);

    [ { id: 'TRAJECTORY', size: 280, speed: 60 }, { id: 'HORIZON', size: 190, speed: 30 }, { id: 'IMMINENT', size: 100, speed: 15 } ].forEach(d => {
        const overdue = state.missions[state.sectorId]?.[d.id]?.some(m => m.overdue && !m.captured);
        const wrapper = document.createElement('div'); wrapper.className = `ring-circle ${overdue ? 'overdue' : ''}`;
        wrapper.style.width = d.size + 'px'; wrapper.style.height = d.size + 'px';
        wrapper.onclick = (e) => { e.stopPropagation(); state.horizon = d.id; state.level = 3; render(); };
        
        // Handle Labels
        if (d.id === 'IMMINENT') {
            // Centered in the middle of the smallest circle
            const label = document.createElement('div');
            label.className = 'ring-label';
            label.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); margin:0;';
            label.innerText = d.id;
            wrapper.appendChild(label);
        } else {
            // Curved text paths for Horizon and Trajectory
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("fill", overdue ? "var(--thrust)" : "var(--accent)");
            text.style.cssText = 'font-size: 0.6rem; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;';
            
            const tp = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
            tp.setAttribute("href", `#path-${d.id.toLowerCase()}`);
            tp.setAttribute("startOffset", "50%");
            tp.setAttribute("text-anchor", "middle");
            tp.setAttribute("dominant-baseline", "hanging"); // Places text underneath the arch
            tp.textContent = d.id;
            
            text.appendChild(tp);
            textSvg.appendChild(text);
        }

        const starField = document.createElement('div'); starField.style.cssText = `position:absolute; width:100%; height:100%; animation: orbit-spin ${d.speed}s linear infinite; pointer-events:none;`;
        const missions = state.missions[state.sectorId]?.[d.id] || [];
        missions.forEach((m, i) => {
            const angle = (i / missions.length) * Math.PI * 2, r = d.size/2;
            const dot = document.createElement('div'); 
            dot.style.cssText = `position:absolute; width:6px; height:6px; border-radius:50%; background:${m.overdue && !m.captured ? 'var(--thrust)' : 'var(--accent)'}; left:calc(${r + r * Math.cos(angle)}px - 3px); top:calc(${r + r * Math.sin(angle)}px - 3px); box-shadow: 0 0 8px ${m.overdue && !m.captured ? 'var(--thrust)' : 'var(--accent)'};`;
            starField.appendChild(dot);
        });
        wrapper.appendChild(starField); center.appendChild(wrapper);
    });
    container.appendChild(center);
}
function renderLevel3(container, footer) {
    if(footer) { footer.style.display = 'flex'; footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openTaskModal('${state.horizon}', true)">+ INITIALIZE TARGET (${state.horizon})</button>`; }
    
    const header = document.createElement('div');
    header.innerHTML = `<div class="view-level-title">LEVEL 3 // ${state.horizon}</div><h1 class="view-main-title">Constellation Map</h1>`;
    container.appendChild(header);

    const missions = state.missions[state.sectorId]?.[state.horizon] || [];
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.id = "constellation-svg"; container.appendChild(svg);
    
    if (missions.length > 1) {
        for (let i = 0; i < missions.length - 1; i++) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", missions[i].x + "%"); line.setAttribute("y1", missions[i].y + "%");
            line.setAttribute("x2", missions[i+1].x + "%"); line.setAttribute("y2", missions[i+1].y + "%");
            line.setAttribute("stroke", "var(--accent)"); line.setAttribute("stroke-width", "1"); line.setAttribute("stroke-dasharray", "5,5"); line.setAttribute("opacity", "0.4"); svg.appendChild(line);
        }
    }
    
    missions.forEach((m, i) => {
        const star = document.createElement('div'); 
        const isOverdue = m.overdue && !m.captured;
        star.className = `star-container ${isOverdue ? 'decaying' : ''} warp-transition`;
        star.style.left = m.x + '%'; star.style.top = m.y + '%';
        star.onclick = () => { state.activeMissionId = m.id; state.level = 4; render(); };
        
        const node = document.createElement('div');
        node.className = `star-node ${m.captured ? 'captured' : ''}`;
        node.textContent = i + 1;
        
        const label = document.createElement('div');
        label.className = 'star-label';
        label.textContent = m.name; // Sanitized via textContent

        star.appendChild(node);
        star.appendChild(label);
        container.appendChild(star);
    });
}

function renderLevel4(container, footer) {
    if(footer) footer.style.display = 'none';
    const m = safelyGetActiveMission(); if (!m) { zoomOut(); return; }
    const completed = m.subs.filter(s => s.c).length;
    const progress = m.subs.length ? Math.round((completed / m.subs.length) * 100) : 0;
    const allDone = m.subs.length > 0 && completed === m.subs.length;
    
    const lock = document.createElement('div');
    const isCritical = m.overdue && !m.captured;
    
    // Deploys the global vignette if the task is critical
    if (isCritical) {
        document.getElementById('app').classList.add('critical-mode');
    }

    lock.className = `target-lock warp-transition ${isCritical ? 'critical' : ''}`;
    
    const titleWrap = document.createElement('div');
    titleWrap.className = 'view-level-title';
    titleWrap.textContent = `LEVEL 4 // ${m.captured ? 'ARCHIVE' : 'ACTIVE'}`;
    lock.appendChild(titleWrap);
    
    const title = document.createElement('h2');
    title.style.color = m.overdue && !m.captured ? 'var(--thrust)' : 'var(--text)';
    title.textContent = m.name; // Sanitized via textContent
    lock.appendChild(title);
    
    lock.insertAdjacentHTML('beforeend', `<div class="progress-wrapper"><div class="progress-bar-container"><div class="progress-fill" style="width: ${progress}%;"></div></div><div class="progress-text">${progress}% INTEGRITY</div></div>`);
    
    const orbSys = document.createElement('div');
    orbSys.className = 'orbital-system';
    orbSys.innerHTML = `<svg viewBox="0 0 340 340" style="position:absolute; width:100%; height:100%;"><circle cx="170" cy="170" r="14" fill="${allDone ? 'var(--captured)' : 'var(--bg)'}" stroke="var(--accent)" stroke-width="2"/></svg>`;
    
    m.subs.forEach((s, i) => {
        const angle = (i / m.subs.length) * Math.PI * 2, x = 170 + 100 * Math.cos(angle), y = 170 + 100 * Math.sin(angle);
        const subNode = document.createElement('div');
        subNode.style.cssText = `position:absolute; left:${x}px; top:${y}px; transform:translate(-50%, -50%); cursor:pointer;`;
        if (!m.captured) subNode.onclick = () => toggleSubTask(i);
        
        const box = document.createElement('div');
        box.className = `orbital-node-box ${s.c ? 'checked' : ''}`;
        
        const check = document.createElement('div');
        check.className = 'orb-check';
        check.textContent = s.c ? '✓' : '';
        
        const text = document.createElement('div');
        text.className = 'orb-text';
        text.textContent = s.t; // Sanitized via textContent
        
        box.appendChild(check);
        box.appendChild(text);
        subNode.appendChild(box);
        orbSys.appendChild(subNode);
    });
    
    lock.appendChild(orbSys);
    
    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex; gap:10px; margin-top: auto;';
    btnWrap.innerHTML = `<button class="mod-btn" onclick="openEditModal(${m.id})">EDIT</button><button class="mod-btn" onclick="deleteMission(${m.id})" style="color:var(--thrust)">DESTROY</button>`;
    lock.appendChild(btnWrap);
    
    if (allDone && !m.captured) {
        const modal = document.createElement('div');
        modal.className = 'hex-modal warp-transition';
        modal.innerHTML = `<h2 style="color: var(--captured)">TARGET SECURED</h2><button class="success-btn" onclick="completeMission()">LOG MISSION & WARP</button>`;
        lock.appendChild(modal);
    }
    
    container.appendChild(lock);
}

function openTaskModal(h, f) { 
    editModeId = null; defaultHorizonContext = h; isHorizonFixed = f; 
    document.getElementById('modal-task-name').value = ''; 
    document.getElementById('modal-task-date').value = '';
    document.getElementById('modal-horizon-select').value = h; 
    document.getElementById('modal-horizon-group').style.display = f ? 'none' : 'block'; 
    tempSubtasks = ['', '', '']; renderModalSubtasks();
    document.getElementById('task-modal-overlay').style.display = 'flex'; 
}

function renderModalSubtasks() {
    const list = document.getElementById('modal-subtasks-list'); if(!list) return; list.innerHTML = '';
    tempSubtasks.forEach((sub, i) => {
        const row = document.createElement('div'); row.className = 'subtask-row';
        row.innerHTML = `<input type="text" class="modal-input" value="${sub}" oninput="tempSubtasks[${i}] = this.value"><button class="subtask-remove" onclick="tempSubtasks.splice(${i}, 1); renderModalSubtasks();">-</button>`;
        list.appendChild(row);
    });
}

function addModalSubtask() { if (tempSubtasks.length < 10) { tempSubtasks.push(''); renderModalSubtasks(); } }
function closeTaskModal() { document.getElementById('task-modal-overlay').style.display = 'none'; }

function openEditModal(id) {
    editModeId = id; let targetMission = null; let targetHorizon = null;
    if (!state.sectorId || !state.missions[state.sectorId]) return;
    HORIZONS.forEach(h => {
        const found = state.missions[state.sectorId][h].find(m => m.id === id);
        if (found) { targetMission = found; targetHorizon = h; }
    });
    if (!targetMission) return;
    defaultHorizonContext = targetHorizon; isHorizonFixed = true; 
    document.getElementById('modal-task-name').value = targetMission.name;
    document.getElementById('modal-task-date').value = targetMission.dueDate || '';
    document.getElementById('modal-header-text').innerText = 'MODIFY TARGET PARAMETERS';
    document.getElementById('modal-horizon-select').value = defaultHorizonContext;
    document.getElementById('modal-horizon-group').style.display = 'none';
    tempSubtasks = targetMission.subs.map(s => s.t);
    if(tempSubtasks.length === 0) tempSubtasks = ['']; renderModalSubtasks();
    document.getElementById('task-modal-overlay').style.display = 'flex';
}

function saveTaskModal() {
    const name = document.getElementById('modal-task-name').value.trim(); if (!name) return;
    const dateStr = document.getElementById('modal-task-date').value;
    const h = isHorizonFixed ? defaultHorizonContext : document.getElementById('modal-horizon-select').value;
    const finalH = getHorizonFromDate(dateStr, h);
    if (!state.missions[state.sectorId]) state.missions[state.sectorId] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]};
    const coords = getSafeCoordinates(state.missions[state.sectorId][finalH] || []);
    if (editModeId) {
        HORIZONS.forEach(hz => { if(state.missions[state.sectorId][hz]) state.missions[state.sectorId][hz] = state.missions[state.sectorId][hz].filter(m => m.id !== editModeId); });
    }
    state.missions[state.sectorId][finalH].push({ id: editModeId || Date.now(), name, subs: tempSubtasks.filter(t => t.trim()).map(t => ({t, c:false})), x: coords.x, y: coords.y, dueDate: dateStr || null });
    save(); closeTaskModal(); render();
}

function zoomOut() { state.level = Math.max(1, state.level - 1); if (state.level === 1) { state.sectorId = null; state.horizon = null; } render(); }

function toggleSubTask(index) {
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

function deleteMission(id) { if(confirm("Destroy?")) { HORIZONS.forEach(h => { if(state.missions[state.sectorId]?.[h]) state.missions[state.sectorId][h] = state.missions[state.sectorId][h].filter(m => m.id !== id); }); save(); state.level = 3; render(); } }

function openSectorModal() { editingSectors = JSON.parse(JSON.stringify(state.sectors)); renderSectorEditList(); document.getElementById('sector-modal-overlay').style.display = 'flex'; }
function closeSectorModal() { document.getElementById('sector-modal-overlay').style.display = 'none'; }
function renderSectorEditList() {
    const list = document.getElementById('sector-edit-list'), addBtn = document.getElementById('sector-add-btn');
    if(!list) return; list.innerHTML = '';
    editingSectors.forEach((s, i) => {
        const row = document.createElement('div'); row.className = 'subtask-row';
        row.innerHTML = `<input type="color" value="${s.color}" onchange="editingSectors[${i}].color = this.value"><input type="text" class="modal-input" value="${s.name}" oninput="editingSectors[${i}].name = this.value"><button class="subtask-remove" onclick="editingSectors.splice(${i}, 1); renderSectorEditList();">-</button>`;
        list.appendChild(row);
    });
    if(addBtn) addBtn.style.display = editingSectors.length >= 9 ? 'none' : 'block';
}
function addNewSector() { if (editingSectors.length < 9) { editingSectors.push({ id: 'sec_' + Date.now(), name: 'NEW SECTOR', color: AUTO_PALETTE[editingSectors.length % AUTO_PALETTE.length], seed: { x: Math.random(), y: Math.random() } }); renderSectorEditList(); } }
function saveSectorModal() {
    editingSectors.forEach(s => { if (!state.missions[s.id]) state.missions[s.id] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]}; });
    state.sectors = JSON.parse(JSON.stringify(editingSectors)); save(); closeSectorModal(); render();
}

function openSettingsModal() { document.getElementById('settings-haptics-toggle').checked = state.hapticsEnabled; document.getElementById('settings-modal-overlay').style.display = 'flex'; }
function closeSettingsModal() { state.hapticsEnabled = document.getElementById('settings-haptics-toggle').checked; save(); document.getElementById('settings-modal-overlay').style.display = 'none'; }

runDatabaseMigration(); generateStarfield(); render();
window.addEventListener('resize', () => { if(state.level === 1) render(); });
