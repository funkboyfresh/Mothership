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
    sectors: JSON.parse(localStorage.getItem('sectors')) || defaultSectors,
    missions: JSON.parse(localStorage.getItem('missions')) || {}
};

let ignitionFlare = false;
let tempSubtasks = []; 
let editModeId = null;
let defaultHorizonContext = 'TRAJECTORY';
let isHorizonFixed = false;
let editingSectors = [];

function updateHUD() {
    document.getElementById('hud-level').innerText = `PILOT LEVEL ${state.playerLevel}`;
    document.getElementById('hud-energy-readout').innerText = `CAPACITOR ${state.energy}%`;
    document.getElementById('hud-capacitor-bar').style.width = `${state.energy}%`;
}

function addEnergy(amount) {
    state.energy += amount;
    if (state.energy < 0) state.energy = 0;
    if (state.energy >= 100) {
        const levelsGained = Math.floor(state.energy / 100);
        state.playerLevel += levelsGained;
        state.energy = state.energy % 100;
        triggerHyperDrive();
    }
    save(); updateHUD();
}

function triggerHyperDrive() {
    const overlay = document.getElementById('level-up-overlay');
    overlay.style.display = 'flex';
    overlay.style.animation = 'none';
    void overlay.offsetWidth;
    overlay.style.animation = 'hyper-flash 1.5s forwards ease-out';
    setTimeout(() => { overlay.style.display = 'none'; }, 1500);
}

function runDatabaseMigration() {
    let migrated = false;
    let newMissions = { ...state.missions };
    const legacyMap = { 'CAREER': 'sec_career', 'FINANCIAL': 'sec_finance', 'PERSONAL': 'sec_personal', 'HEALTH': 'sec_personal' };

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
        
        if (state.missions[s.id]['FAR']) { state.missions[s.id]['TRAJECTORY'] = state.missions[s.id]['FAR']; delete state.missions[s.id]['FAR']; }
        if (state.missions[s.id]['NEAR']) { state.missions[s.id]['HORIZON'] = state.missions[s.id]['NEAR']; delete state.missions[s.id]['NEAR']; }
        if (state.missions[s.id]['NOW']) { state.missions[s.id]['IMMINENT'] = state.missions[s.id]['NOW']; delete state.missions[s.id]['NOW']; }

        HORIZONS.forEach(h => {
            if (!state.missions[s.id][h]) { state.missions[s.id][h] = []; migrated = true; }
            
            state.missions[s.id][h].forEach((m, index, arr) => {
                m.subs = m.subs || []; 
                if (m.x === undefined || m.y === undefined || isNaN(m.x) || isNaN(m.y)) {
                    let coords = getSafeCoordinates(arr.slice(0, index));
                    m.x = coords.x; m.y = coords.y;
                    migrated = true;
                }
                if (m.captured === undefined) m.captured = false;
                if (m.overdue === undefined) m.overdue = false; 
            });
        });
    });
    if (migrated) save();
}

function generateStarfield() {
    const field = document.getElementById('global-starfield');
    field.innerHTML = '';
    for(let i=0; i<250; i++) {
        const p = document.createElement('div');
        p.className = 'void-particle';
        p.style.width = Math.random() * 2 + 'px'; p.style.height = p.style.width;
        p.style.left = Math.random() * 100 + '%'; p.style.top = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 5 + 3) + 's';
        p.style.animationDelay = (Math.random() * 5) + 's';
        field.appendChild(p);
    }
}

function updateAccentColor() {
    const activeSector = state.sectors.find(s => s.id === state.sectorId);
    const hex = activeSector ? activeSector.color : '#00e5ff';
    document.documentElement.style.setProperty('--accent', hex);
    
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){c= [c[0], c[0], c[1], c[1], c[2], c[2]];}
        c= '0x'+c.join('');
        const rgba = 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',0.6)';
        document.documentElement.style.setProperty('--accent-glow', rgba);
    }
}

function triggerWarp() {
    const container = document.getElementById('view-container');
    container.classList.remove('warp-transition');
    void container.offsetWidth; 
    container.classList.add('warp-transition');
}

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
            if (!m || m.x === undefined || m.y === undefined || isNaN(m.x) || isNaN(m.y)) continue;
            let dx = m.x - x; let dy = m.y - y;
            if (Math.sqrt(dx*dx + dy*dy) < 18) { safe = false; break; } 
        }
        attempts++;
    } while (!safe && attempts < 50);
    return {x, y};
}

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
                    
                    let targetH = 'TRAJECTORY';
                    if (diffDays <= 7) targetH = 'IMMINENT';
                    else if (diffDays <= 14) targetH = 'HORIZON';
                    
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
        levelReadout.innerText = "WARNING: DECAY DETECTED";
        levelReadout.classList.add('hud-warning');
        energyReadout.classList.add('hud-warning');
    } else {
        levelReadout.innerText = `PILOT LEVEL ${state.playerLevel}`;
        levelReadout.classList.remove('hud-warning');
        energyReadout.classList.remove('hud-warning');
    }
}

function save() { 
    localStorage.setItem('sectors', JSON.stringify(state.sectors));
    localStorage.setItem('missions', JSON.stringify(state.missions)); 
    localStorage.setItem('energy', state.energy);
    localStorage.setItem('playerLevel', state.playerLevel);
}

function safelyGetActiveMission() {
    let targetMission = null; let actualHorizon = state.horizon;
    if(!state.sectorId || !state.missions[state.sectorId]) return null;
    
    for (let h of HORIZONS) {
        if(!state.missions[state.sectorId][h]) continue;
        const found = state.missions[state.sectorId][h].find(x => x.id === state.activeMissionId);
        if (found) { targetMission = found; actualHorizon = h; break; }
    }
    if (targetMission && actualHorizon !== state.horizon) { state.horizon = actualHorizon; }
    return targetMission;
}

function render() {
    updateAccentColor();
    processTimeMechanics();
    checkDecayStatus();
    updateHUD();
    
    const container = document.getElementById('view-container');
    const zoomBtn = document.getElementById('zoom-out');
    const bread = document.getElementById('breadcrumb');
    const footer = document.getElementById('control-footer');
    
    triggerWarp();
    container.innerHTML = '';
    
    zoomBtn.style.visibility = state.level > 1 ? 'visible' : 'hidden';
    
    const activeSector = state.sectors.find(s => s.id === state.sectorId);
    const secName = activeSector ? activeSector.name : 'GALAXY';
    bread.innerText = `${secName} ${state.horizon ? '> ' + state.horizon : ''}`;
    
    if (state.level === 1) {
        footer.style.display = 'flex';
        footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openSectorModal()">[ EDIT MAP ]</button>`;
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); 
        svg.id = "voronoi-map"; 
        container.appendChild(svg);
        
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;

        let seeds = state.sectors.map(s => ({x: s.seed.x, y: s.seed.y}));
        seeds = relaxLloyds(seeds, 5);
        seeds.forEach((seed, i) => { state.sectors[i].seed = seed; });

        const mappedSeeds = seeds.map(s => [s.x * w, s.y * h]);
        const delaunay = d3.Delaunay.from(mappedSeeds);
        const voronoi = delaunay.voronoi([0, 0, w, h]);

        state.sectors.forEach((s, i) => {
            if(!state.missions[s.id]) return; 
            const pathData = voronoi.renderCell(i);
            const isOverdue = HORIZONS.some(hz => state.missions[s.id][hz] && state.missions[s.id][hz].some(m => m.overdue && !m.captured));
            
            const cellColor = isOverdue ? 'var(--thrust)' : s.color;
            const fillOpacity = isOverdue ? 0.2 : 0.05;
            
            if (pathData) {
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", pathData);
                path.setAttribute("fill", cellColor);
                path.setAttribute("fill-opacity", fillOpacity);
                path.setAttribute("stroke", cellColor);
                path.setAttribute("stroke-width", "2");
                path.setAttribute("class", "voronoi-cell");
                path.onclick = () => selectSector(s.id);
                svg.appendChild(path);

                const cx = mappedSeeds[i][0]; const cy = mappedSeeds[i][1];
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", cx); text.setAttribute("y", cy);
                text.setAttribute("fill", cellColor); text.setAttribute("class", "voronoi-text");
                text.style.textShadow = `0 0 10px ${cellColor}`;
                text.textContent = s.name;
                svg.appendChild(text);
            }
        });
    } 
    else if (state.level === 2) {
        footer.style.display = 'flex';
        footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openTaskModal('TRAJECTORY', false)">+ INITIALIZE TARGET</button>`;
        
        container.innerHTML = `<div class="view-level-title">LEVEL 2 // ${secName}</div><h1 class="view-main-title">Planetary Map</h1>`;
        const center = document.createElement('div');
        center.style.position = 'relative'; center.style.width = '280px'; center.style.height = '280px';
        center.style.display = 'flex'; center.style.alignItems = 'center'; center.style.justifyContent = 'center'; center.style.marginTop = '20px';
        center.style.background = 'radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%)';
        center.style.borderRadius = '50%';

        const particleSystem = document.createElement('div');
        particleSystem.style.position = 'absolute'; particleSystem.style.width = '100%'; particleSystem.style.height = '100%'; particleSystem.style.pointerEvents = 'none'; particleSystem.style.zIndex = '1';
        for(let i=0; i<120; i++) {
            const p = document.createElement('div'); p.className = 'particle';
            const radius = Math.pow(Math.random(), 2) * 200; 
            const angle = Math.random() * Math.PI * 2;
            const x = 140 + radius * Math.cos(angle); const y = 140 + radius * Math.sin(angle);
            const size = Math.random() * 2 + 1;
            p.style.width = size + 'px'; p.style.height = size + 'px';
            p.style.left = x + 'px'; p.style.top = y + 'px';
            p.style.animationDuration = (Math.random() * 3 + 1.5) + 's';
            p.style.animationDelay = (Math.random() * 2) + 's';
            particleSystem.appendChild(p);
        }
        center.appendChild(particleSystem);
        
        const h_data = [ { id: 'TRAJECTORY', size: 280, speed: 60 }, { id: 'HORIZON', size: 190, speed: 30 }, { id: 'IMMINENT', size: 100, speed: 15 } ];
        
        h_data.forEach(d => {
            let isRingOverdue = state.missions[state.sectorId] && state.missions[state.sectorId][d.id] ? state.missions[state.sectorId][d.id].some(m => m.overdue && !m.captured) : false;
            const wrapper = document.createElement('div');
            wrapper.className = `ring-circle ${isRingOverdue ? 'overdue' : ''}`;
            wrapper.style.width = d.size + 'px'; wrapper.style.height = d.size + 'px';
            wrapper.onclick = (e) => { e.stopPropagation(); state.horizon = d.id; state.level = 3; render(); };
            
            const label = document.createElement('div');
            label.className = 'ring-label'; label.innerText = d.id;
            wrapper.appendChild(label);

            const starField = document.createElement('div');
            starField.style.position = 'absolute'; starField.style.width = '100%'; starField.style.height = '100%';
            starField.style.animation = `orbit-spin ${d.speed}s linear infinite`; starField.style.pointerEvents = 'none';

            const missions = state.missions[state.sectorId] && state.missions[state.sectorId][d.id] ? state.missions[state.sectorId][d.id] : [];
            missions.forEach((m, i) => {
                const angle = (i / missions.length) * Math.PI * 2;
                const radius = d.size / 2;
                const x = radius + radius * Math.cos(angle); const y = radius + radius * Math.sin(angle);
                const dot = document.createElement('div');
                dot.style.position = 'absolute'; dot.style.width = '6px'; dot.style.height = '6px';
                dot.style.backgroundColor = m.overdue && !m.captured ? 'var(--thrust)' : 'var(--accent)';
                dot.style.borderRadius = '50%';
                dot.style.boxShadow = m.overdue && !m.captured ? '0 0 10px var(--thrust)' : '0 0 8px var(--accent-glow)';
                dot.style.left = `calc(${x}px - 3px)`; dot.style.top = `calc(${y}px - 3px)`;
                starField.appendChild(dot);
            });

            wrapper.appendChild(starField);
            center.appendChild(wrapper);
        });
        container.appendChild(center);
    }
    else if (state.level === 3) {
        footer.style.display = 'flex';
        footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openTaskModal('${state.horizon}', true)">+ INITIALIZE TARGET (${state.horizon})</button>`;

        container.innerHTML = `<div class="view-level-title">LEVEL 3 // ${state.horizon}</div><h1 class="view-main-title">Constellation Map</h1>`;
        const missions = state.missions[state.sectorId] && state.missions[state.sectorId][state.horizon] ? state.missions[state.sectorId][state.horizon] : [];
        if (missions.length === 0) {
            container.innerHTML += `<div style="margin-top: 60px; font-size: 0.8rem; color: var(--border); letter-spacing: 2px;">NO ARCHITECTURE DETECTED IN ${state.horizon} ORBIT</div>`;
        } else {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.id = "constellation-svg"; container.appendChild(svg);
            missions.forEach((m, i) => {
                const decayClass = m.overdue && !m.captured ? 'decaying' : '';
                const star = document.createElement('div'); 
                star.className = `star-container ${decayClass}`;
                star.style.left = m.x + '%'; star.style.top = m.y + '%'; 
                star.onclick = () => selectMission(m.id);
                star.innerHTML = `<div class="star-node ${m.captured ? 'captured' : ''} ${decayClass}">${i+1}</div><div class="star-label ${decayClass}">${m.name}</div>${m.captured ? '<div class="captured-banner">TARGET ACQUIRED</div>' : ''}`;
                container.appendChild(star);
                if (i < missions.length - 1) {
                    const next = missions[i+1];
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", m.x + "%"); line.setAttribute("y1", m.y + "%"); line.setAttribute("x2", next.x + "%"); line.setAttribute("y2", next.y + "%");
                    line.setAttribute("stroke", "var(--accent)"); line.setAttribute("stroke-width", "1"); line.setAttribute("stroke-dasharray", "4"); line.style.opacity = "0.5";
                    svg.appendChild(line);
                }
            });
        }
    }
    else if (state.level === 4) {
        footer.style.display = 'none';
        
        try {
            const m = safelyGetActiveMission();
            if (!m) { zoomOut(); return; } 

            const safeSubs = m.subs || [];
            const totalTasks = safeSubs.length;
            const completedTasks = safeSubs.filter(s => s.c).length;
            const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
            const allDone = totalTasks > 0 && completedTasks === totalTasks;
            
            const coreClass = ignitionFlare ? 'flare-active' : '';
            ignitionFlare = false;
            const coreFill = allDone ? 'var(--captured)' : 'var(--bg)';
            const titleColor = m.overdue && !m.captured ? 'var(--thrust)' : 'var(--text)';
            
            let orbHtml = `<div class="target-lock">
                <div class="view-level-title" style="color: ${m.overdue && !m.captured ? 'var(--thrust)' : ''}">LEVEL 4 // ${m.captured ? 'MISSION LOG' : (m.overdue ? 'DECAYING TARGET' : 'ACTIVE TARGET')}</div>
                <h2 style="color:${titleColor}; font-size: 1.2rem; margin-top: 0; margin-bottom: 5px; z-index:20; font-weight:400; text-shadow: 0 0 10px rgba(255,255,255,0.2);">${m.name}</h2>
                ${m.dueDate ? `<div style="font-size: 0.6rem; color: ${m.overdue && !m.captured ? 'var(--thrust)' : 'var(--border)'}; margin-bottom: 10px; z-index:20;">DEADLINE: ${m.dueDate}</div>` : ''}
                
                <div class="progress-wrapper">
                    <div class="progress-bar-container">
                        <div class="progress-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                    <div class="progress-text">${progressPercent}% INTEGRITY</div>
                </div>

                <div class="orbital-system">
                    <svg viewBox="0 0 340 340" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index: 1;">
                        <g stroke="var(--accent)" stroke-width="1.5" fill="none" style="filter: drop-shadow(0 0 5px var(--accent-glow));">
                            <polygon points="170,70 230,220 170,190 110,220" />
                            <polygon points="170,110 200,200 170,180 140,200" fill="rgba(255, 255, 255, 0.05)" />
                            <circle id="ship-core" class="${coreClass}" cx="170" cy="170" r="14" fill="${coreFill}" stroke-width="2" style="transition: fill 0.5s"/>
                            <circle cx="170" cy="170" r="4" fill="var(--accent)"/>
                        </g>
                    `;

            const shipParts = [ {x: 170, y: 70}, {x: 230, y: 220}, {x: 110, y: 220}, {x: 170, y: 190}, {x: 200, y: 200}, {x: 140, y: 200} ];

            if (totalTasks > 0) {
                safeSubs.forEach((s, i) => {
                    const text = s.t || '';
                    const hash = (i * 17) + text.length + (text.charCodeAt(0) || 0);
                    const rand = Math.abs(Math.sin(hash));
                    const radius = 80 + rand * 45;
                    const baseAngle = (i / totalTasks) * Math.PI * 2;
                    const angle = baseAngle + (rand * 0.4 - 0.2);
                    
                    const taskX = 170 + radius * Math.cos(angle);
                    const taskY = 170 + radius * Math.sin(angle);
                    const part = shipParts[i % shipParts.length];
                    const lineColor = s.c ? 'var(--captured)' : 'var(--border)';
                    const dashArray = s.c ? '0' : '4';
                    
                    orbHtml += `<line x1="${taskX}" y1="${taskY}" x2="${part.x}" y2="${part.y}" stroke="${lineColor}" stroke-dasharray="${dashArray}" stroke-width="1.5" style="transition: all 0.3s; filter: drop-shadow(0 0 5px ${s.c ? 'var(--captured)' : 'transparent'});" />`;
                });
            }

            orbHtml += `</svg>`;

            if (totalTasks > 0) {
                safeSubs.forEach((s, i) => {
                    const text = s.t || '';
                    const hash = (i * 17) + text.length + (text.charCodeAt(0) || 0);
                    const rand = Math.abs(Math.sin(hash));
                    const radius = 80 + rand * 45;
                    const baseAngle = (i / totalTasks) * Math.PI * 2;
                    const angle = baseAngle + (rand * 0.4 - 0.2);
                    
                    const taskX = 170 + radius * Math.cos(angle);
                    const taskY = 170 + radius * Math.sin(angle);

                    orbHtml += `
                        <div style="position:absolute; left:${taskX}px; top:${taskY}px; transform:translate(-50%, -50%); z-index:20; cursor:pointer;" onclick="${m.captured ? '' : `toggleSub(${i}, event)`}">
                            <div class="counter-spin orbital-node-box ${s.c ? 'checked' : ''}">
                                <div class="orb-check">${s.c ? '✓' : ''}</div>
                                <div class="orb-text ${s.c ? 'strikethrough' : ''}">${text}</div>
                            </div>
                        </div>`;
                });
            }

            orbHtml += `</div>`; 

            if (allDone && !m.captured) {
                orbHtml += `
                    <div class="hex-modal warp-transition">
                        <div class="hex-container">
                            <div class="hex-shape"></div>
                            <div class="hex-inner">
                                <div class="hex-icon">✓</div>
                            </div>
                        </div>
                        <h2 style="color: var(--captured); letter-spacing: 4px; text-transform: uppercase; margin-bottom: 40px; text-align: center; font-weight: 300; text-shadow: 0 0 15px var(--accent-glow);">Target<br>Secured</h2>
                        <button class="success-btn" onclick="completeMission()">Log Mission & Warp (+25%)</button>
                    </div>`;
            } else if (m.captured) {
                orbHtml += `<div class="captured-banner" style="font-size:1rem; padding: 15px; color: var(--border);">MISSION ARCHIVED</div>`;
            }
            
            orbHtml += `
                <div style="display:flex; justify-content:center; margin-top: auto; padding-bottom: 20px; z-index: 10;">
                    <button class="mod-btn" onclick="openEditModal(${m.id})">EDIT PARAMETERS</button>
                    <button class="mod-btn" onclick="editMissionStatus(${m.id}, event)" style="${m.overdue && !m.captured ? 'color: var(--thrust); border-color: var(--thrust); box-shadow: 0 0 8px rgba(255,42,42,0.4);' : ''}">STATUS</button>
                    <button class="mod-btn" onclick="deleteMission(${m.id}, event)" style="color:#ff2a2a; border-color:#ff2a2a; box-shadow: 0 0 8px rgba(255, 42, 42, 0.4);">DESTROY</button>
                </div>
            </div>`;

            container.innerHTML = orbHtml;
        } catch (err) {
            console.error("Target Render Failure:", err);
            zoomOut(); 
        }
    }
}

function openSectorModal() {
    editingSectors = JSON.parse(JSON.stringify(state.sectors)); 
    renderSectorEditList();
    document.getElementById('sector-modal-overlay').style.display = 'flex';
}
function closeSectorModal() { document.getElementById('sector-modal-overlay').style.display = 'none'; }

function renderSectorEditList() {
    const list = document.getElementById('sector-edit-list');
    list.innerHTML = '';
    editingSectors.forEach((s, i) => {
        const row = document.createElement('div');
        row.className = 'subtask-row';
        row.innerHTML = `
            <input type="color" value="${s.color}" onchange="updateEditSector(${i}, 'color', this.value)" style="width: 40px; flex-shrink: 0;">
            <input type="text" class="modal-input" placeholder="Sector Designation" value="${s.name}" oninput="updateEditSector(${i}, 'name', this.value)">
            <button class="subtask-remove" onclick="removeEditSector(${i})">-</button>
        `;
        list.appendChild(row);
    });
}

function updateEditSector(i, key, val) { editingSectors[i][key] = val; }

function removeEditSector(i) {
    if (confirm("WARNING: Destroying a sector deletes all missions within it. Proceed?")) {
        editingSectors.splice(i, 1);
        renderSectorEditList();
    }
}

function addNewSector() {
    const newColor = AUTO_PALETTE[Math.floor(Math.random() * AUTO_PALETTE.length)];
    editingSectors.push({
        id: 'sec_' + Date.now(), name: 'NEW SECTOR', color: newColor,
        seed: { x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8 }
    });
    renderSectorEditList();
}

function saveSectorModal() {
    if (editingSectors.length < 1) { alert("Must have at least 1 active sector."); return; }
    const newIds = editingSectors.map(s => s.id);
    Object.keys(state.missions).forEach(id => {
        if (!newIds.includes(id)) delete state.missions[id];
    });
    editingSectors.forEach(s => {
        if (!state.missions[s.id]) { state.missions[s.id] = { 'TRAJECTORY': [], 'HORIZON': [], 'IMMINENT': [] }; }
    });
    state.sectors = editingSectors;
    save(); closeSectorModal(); render();
}

function openTaskModal(horizonContext = null, isFixed = false) {
    editModeId = null; defaultHorizonContext = horizonContext || 'TRAJECTORY'; isHorizonFixed = isFixed;
    document.getElementById('modal-task-name').value = '';
    document.getElementById('modal-task-date').value = '';
    document.getElementById('modal-header-text').innerText = 'TARGET INITIALIZATION';
    document.getElementById('modal-save-btn').innerText = 'LOCK TARGET';
    document.getElementById('modal-horizon-select').value = defaultHorizonContext;
    document.getElementById('modal-horizon-group').style.display = isFixed ? 'none' : 'block';
    tempSubtasks = ['', '', '']; renderModalSubtasks();
    document.getElementById('task-modal-overlay').style.display = 'flex';
}

function openEditModal(id) {
    editModeId = id; let targetMission = null; let targetHorizon = null;
    if (!state.sectorId || !state.missions[state.sectorId]) return;

    HORIZONS.forEach(h => {
        if(!state.missions[state.sectorId][h]) return;
        const found = state.missions[state.sectorId][h].find(m => m.id === id);
        if (found) { targetMission = found; targetHorizon = h; }
    });
    if (!targetMission) return;
    
    defaultHorizonContext = targetHorizon; isHorizonFixed = true; 
    document.getElementById('modal-task-name').value = targetMission.name;
    document.getElementById('modal-task-date').value = targetMission.dueDate || '';
    document.getElementById('modal-header-text').innerText = 'MODIFY TARGET PARAMETERS';
    document.getElementById('modal-save-btn').innerText = 'UPDATE TARGET';
    document.getElementById('modal-horizon-select').value = defaultHorizonContext;
    document.getElementById('modal-horizon-group').style.display = 'none';
    
    const safeSubs = targetMission.subs || [];
    tempSubtasks = safeSubs.map(s => s.t);
    if(tempSubtasks.length === 0) tempSubtasks = [''];
    renderModalSubtasks();
    document.getElementById('task-modal-overlay').style.display = 'flex';
}

function closeTaskModal() { document.getElementById('task-modal-overlay').style.display = 'none'; }

function renderModalSubtasks() {
    const list = document.getElementById('modal-subtasks-list');
    const addBtn = document.getElementById('modal-add-btn');
    list.innerHTML = '';
    tempSubtasks.forEach((sub, i) => {
        const row = document.createElement('div'); row.className = 'subtask-row';
        row.innerHTML = `<input type="text" class="modal-input" placeholder="Sub-routine definition..." value="${sub}" oninput="updateTempSubtask(${i}, this.value)"><button class="subtask-remove" onclick="removeModalSubtask(${i})">-</button>`;
        list.appendChild(row);
    });
    if (tempSubtasks.length >= 10) { addBtn.classList.add('disabled'); addBtn.innerText = "MAXIMUM REACHED"; } 
    else { addBtn.classList.remove('disabled'); addBtn.innerText = "+"; }
}

function updateTempSubtask(index, val) { tempSubtasks[index] = val; }
function removeModalSubtask(index) { tempSubtasks.splice(index, 1); renderModalSubtasks(); }
function addModalSubtask() { if (tempSubtasks.length < 10) { tempSubtasks.push(''); renderModalSubtasks(); } }

function saveTaskModal() {
    try {
        const name = document.getElementById('modal-task-name').value.trim();
        const dateStr = document.getElementById('modal-task-date').value;
        if (!name) { alert("Target designation required."); return; }

        if (!state.sectorId) { alert("SYSTEM ERROR: No active sector ID."); return; }
        if (!state.missions[state.sectorId]) state.missions[state.sectorId] = { 'TRAJECTORY': [], 'HORIZON': [], 'IMMINENT': [] };

        let validSubs = []; let oldMission = null; let oldHorizon = null;
        if (editModeId) {
            HORIZONS.forEach(h => {
                if(!state.missions[state.sectorId][h]) state.missions[state.sectorId][h] = [];
                const found = state.missions[state.sectorId][h].find(m => m.id === editModeId);
                if (found) { oldMission = found; oldHorizon = h; }
            });
        }

        tempSubtasks.forEach(t => {
            let text = t ? t.trim() : "";
            if(text !== "") {
                let isChecked = false;
                if (oldMission) { let existing = (oldMission.subs || []).find(s => s.t === text); if (existing) isChecked = existing.c; }
                validSubs.push({t: text, c: isChecked});
            }
        });
        
        const selectedHorizon = isHorizonFixed ? defaultHorizonContext : document.getElementById('modal-horizon-select').value;
        const targetHorizon = getHorizonFromDate(dateStr, selectedHorizon);

        if (!state.missions[state.sectorId][targetHorizon]) state.missions[state.sectorId][targetHorizon] = [];

        if (editModeId && oldMission) {
            state.missions[state.sectorId][oldHorizon] = state.missions[state.sectorId][oldHorizon].filter(m => m.id !== editModeId);
            oldMission.name = name; oldMission.dueDate = dateStr || null; oldMission.subs = validSubs;
            if (oldHorizon !== targetHorizon) {
                const coords = getSafeCoordinates(state.missions[state.sectorId][targetHorizon]);
                oldMission.x = coords.x; oldMission.y = coords.y;
            }
            state.missions[state.sectorId][targetHorizon].push(oldMission);
        } else {
            const coords = getSafeCoordinates(state.missions[state.sectorId][targetHorizon]);
            state.missions[state.sectorId][targetHorizon].push({ 
                id: Date.now(), name: name, subs: validSubs, x: coords.x, y: coords.y, captured: false, overdue: false, dueDate: dateStr || null
            });
        }
        
        save(); closeTaskModal(); processTimeMechanics(); 
        if (state.level === 4) { state.horizon = targetHorizon; }
        render();
    } catch (err) {
        alert("CRITICAL SAVE FAILURE: " + err.message);
        console.error(err);
    }
}

function selectSector(id) { state.sectorId = id; state.level = 2; render(); }
function selectMission(id) { state.activeMissionId = id; state.level = 4; render(); }

function toggleSub(index, e) {
    e.stopPropagation();
    const m = safelyGetActiveMission(); if(!m) return;
    const safeSubs = m.subs || [];
    if(safeSubs[index]) {
        safeSubs[index].c = !safeSubs[index].c;
        if(safeSubs[index].c) {
            ignitionFlare = true;
            addEnergy(5); 
        } else {
            addEnergy(-5); 
        }
    }
    save(); render();
}

function completeMission() {
    const m = safelyGetActiveMission(); if(!m) return;
    m.captured = true; m.overdue = false; 
    addEnergy(25); 
    save(); state.level = 3; state.activeMissionId = null; render();
}

function editMissionStatus(id, e) {
    if(e) e.stopPropagation();
    let m = null;
    if(!state.sectorId || !state.missions[state.sectorId]) return;
    for (let h of HORIZONS) { 
        if(!state.missions[state.sectorId][h]) continue;
        const found = state.missions[state.sectorId][h].find(x => x.id === id); 
        if(found) m = found; 
    }
    if(!m) return;

    const decayToggle = confirm("WARNING: Toggle Orbital Decay / Overdue Status?");
    if (decayToggle) {
        m.overdue = !m.overdue;
        if (m.overdue) addEnergy(-10); 
    }
    if (!decayToggle) { const res = prompt("Rename Mission:", m.name); if(res) m.name = res; }
    save(); render();
}

function deleteMission(id, e) {
    if(e) e.stopPropagation();
    if(confirm("Destroy this target permanently?")) {
        if(!state.sectorId || !state.missions[state.sectorId]) return;
        HORIZONS.forEach(h => {
            if(state.missions[state.sectorId][h]) {
                state.missions[state.sectorId][h] = state.missions[state.sectorId][h].filter(m => m.id !== id);
            }
        });
        save(); state.level = 3; state.activeMissionId = null; render();
    }
}

function zoomOut() { 
    if (state.level === 4) { state.activeMissionId = null; state.level = 3; }
    else if (state.level === 3) { state.level = 2; state.horizon = null; } 
    else if (state.level === 2) { state.level = 1; state.sectorId = null; }
    render(); 
}

// BOOT SEQUENCE
runDatabaseMigration(); 
generateStarfield();
window.addEventListener('resize', () => { if(state.level === 1) render(); });
render();
