const HORIZONS = ['TRAJECTORY', 'HORIZON', 'IMMINENT'];
const AUTO_PALETTE = ['#00e5ff', '#ffd700', '#ff00ff', '#00ff88', '#ff3366', '#a200ff', '#00ffcc', '#ff9900'];

const defaultSectors = [
    { id: 'sec_career', name: 'CAREER', color: '#00e5ff', seed: {x: 0.3, y: 0.3} },
    { id: 'sec_finance', name: 'FINANCIAL', color: '#ffd700', seed: {x: 0.7, y: 0.3} },
    { id: 'sec_personal', name: 'PERSONAL', color: '#ff00ff', seed: {x: 0.5, y: 0.7} }
];

let state = {
    level: 1, 
    sectorId: null, 
    horizon: null, 
    activeMissionId: null,
    playerLevel: parseInt(localStorage.getItem('playerLevel')) || 1,
    energy: parseInt(localStorage.getItem('energy')) || 0,
    hapticsEnabled: localStorage.getItem('hapticsEnabled') !== 'false',
    sectors: JSON.parse(localStorage.getItem('sectors')) || [...defaultSectors],
    missions: JSON.parse(localStorage.getItem('missions')) || {},
    shipPos: { x: 50, y: 50 } 
};

let editModeId = null;
let defaultHorizonContext = null;
let isHorizonFixed = false;
let tempSubtasks = [];
let editingSectors = [];

if (!state.sectors || state.sectors.length === 0) { 
    state.sectors = [...defaultSectors]; 
}

// --- CORE UTILITIES ---
function triggerHaptic(pattern) {
    if (state.hapticsEnabled && "vibrate" in navigator) { 
        navigator.vibrate(pattern); 
    }
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
    save(); 
    updateHUD();
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

function save() { 
    localStorage.setItem('sectors', JSON.stringify(state.sectors));
    localStorage.setItem('missions', JSON.stringify(state.missions)); 
    localStorage.setItem('energy', state.energy);
    localStorage.setItem('playerLevel', state.playerLevel);
    localStorage.setItem('hapticsEnabled', state.hapticsEnabled);
}

function getCapturedCount(sectorId = null) {
    let count = 0;
    const targets = sectorId ? [state.sectors.find(s => s.id === sectorId)] : state.sectors;
    targets.forEach(s => {
        if (!s || !state.missions[s.id]) return;
        HORIZONS.forEach(h => {
            (state.missions[s.id][h] || []).forEach(m => {
                if (m.captured) count++;
            });
        });
    });
    return count;
}

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

function getSafeCoordinates(existingMissions) {
    const activeWire = (existingMissions || []).slice(-8);
    const count = (existingMissions || []).length;
    const margin = 15;
    const usableSpace = 70;
    
    if (count === 0) {
        let side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = 30 + Math.random()*40; y = 20 + Math.random()*10; } 
        else if (side === 1) { x = 30 + Math.random()*40; y = 70 + Math.random()*10; } 
        else if (side === 2) { x = 20 + Math.random()*10; y = 30 + Math.random()*40; } 
        else { x = 70 + Math.random()*10; y = 30 + Math.random()*40; } 
        return { x, y };
    }

    let bestCandidate = null;
    let bestScore = -Infinity;
    const n0 = existingMissions[0];

    for (let attempts = 0; attempts < 2500; attempts++) {
        let nodePadding = attempts > 1500 ? 10 : 18;
        let wirePadding = attempts > 1500 ? 8 : 16;
        
        let x = margin + (Math.random() * usableSpace);
        let y = margin + (Math.random() * usableSpace);
        const newNode = { x, y };
        let safe = true;

        let minDistToNode = Infinity;
        for (let m of existingMissions) {
            if (!m || isNaN(m.x)) continue;
            let d = Math.sqrt((m.x - x)**2 + (m.y - y)**2);
            if (d < minDistToNode) minDistToNode = d;
            if (d < nodePadding) { safe = false; break; }
        }
        if (!safe) continue;

        let minDistToWire = Infinity;
        if (activeWire.length > 0) {
            const lastNode = activeWire[activeWire.length - 1];

            if (activeWire.length > 1) {
                for (let i = 0; i < activeWire.length - 1; i++) {
                    let d = getDistanceToSegment(newNode, activeWire[i], activeWire[i+1]);
                    if (d < minDistToWire) minDistToWire = d;
                    if (d < wirePadding) { safe = false; break; }
                }
            }
            if (!safe) continue;

            for (let m of existingMissions) {
                if (!m || isNaN(m.x) || m.id === lastNode.id) continue;
                let d = getDistanceToSegment(m, lastNode, newNode);
                if (d < minDistToWire) minDistToWire = d;
                if (d < wirePadding) { safe = false; break; }
            }
            if (!safe) continue;

            if (activeWire.length > 2) {
                for (let i = 0; i < activeWire.length - 2; i++) {
                    if (doLinesIntersect(lastNode, newNode, activeWire[i], activeWire[i+1])) {
                        safe = false; break;
                    }
                }
            }
            if (!safe) continue;
        }

        let score = 0;

        if (count === 1) {
            let distToN0 = Math.sqrt((n0.x - x)**2 + (n0.y - y)**2);
            let distToCenter = Math.sqrt((50 - x)**2 + (50 - y)**2);
            score = distToN0 - (distToCenter * 1.5); 
        } else {
            let clearance = Math.min(minDistToNode, minDistToWire);
            score = clearance;
            
            const lastNode = activeWire[activeWire.length - 1];
            let distToLast = Math.sqrt((lastNode.x - x)**2 + (lastNode.y - y)**2);
            if (distToLast > 45) score -= (distToLast - 45);

            let distToCenter = Math.sqrt((50 - x)**2 + (50 - y)**2);
            score -= (distToCenter * 0.15);
        }

        if (score > bestScore) {
            bestScore = score;
            bestCandidate = newNode;
        }
    }

    return bestCandidate || { x: 45 + (Math.random()*10), y: 45 + (Math.random()*10) };
}

// --- TIME MECHANICS ---
function getHorizonFromDate(dateStr, fallbackHorizon) {
    if (!dateStr) return fallbackHorizon || 'TRAJECTORY';
    const today = new Date(); today.setHours(0,0,0,0);
    const diffDays = Math.ceil((new Date(dateStr + 'T00:00:00') - today) / 86400000);
    return diffDays <= 7 ? 'IMMINENT' : (diffDays <= 14 ? 'HORIZON' : 'TRAJECTORY');
}

function processTimeMechanics() {
    const now = new Date();
    state.sectors.forEach(s => {
        HORIZONS.forEach(h => {
            if(!state.missions[s.id] || !state.missions[s.id][h]) return;
            for (let i = state.missions[s.id][h].length - 1; i >= 0; i--) {
                let m = state.missions[s.id][h][i];
                if (m && m.dueDate && !m.captured) {
                    const deadline = new Date(m.dueDate + 'T23:59:59');
                    const diffHrs = (deadline - now) / (1000 * 60 * 60);
                    const diffDays = Math.ceil(diffHrs / 24);

                    if (diffHrs < 0 && !m.overdue) addEnergy(-10);
                    
                    m.overdue = diffHrs < 0; 
                    m.warningLevel = 0;

                    if (!m.overdue) {
                        if (diffHrs <= 24) m.warningLevel = 24;
                        else if (diffHrs <= 48) m.warningLevel = 48;
                    }

                    let targetH = diffDays <= 7 ? 'IMMINENT' : (diffDays <= 14 ? 'HORIZON' : 'TRAJECTORY');
                    if (targetH !== h) { 
                        state.missions[s.id][targetH].push(m); 
                        state.missions[s.id][h].splice(i, 1); 
                    }
                }
            }
        });
    });
}

function checkDecayStatus() {
    let hasDecay = state.sectors.some(s => HORIZONS.some(h => state.missions[s.id]?.[h]?.some(m => m.overdue && !m.captured)));
    const levelR = document.getElementById('hud-level');
    const energyR = document.getElementById('hud-energy-readout');
    
    if (hasDecay) {
        if(levelR) { levelR.innerText = "CRITICAL DECAY"; levelR.classList.add('hud-warning'); }
        if(energyR) energyR.classList.add('hud-warning');
    } else {
        if(levelR) { levelR.innerText = `PILOT LEVEL ${state.playerLevel}`; levelR.classList.remove('hud-warning'); }
        if(energyR) energyR.classList.remove('hud-warning');
    }
}

// --- RENDER SYSTEM ---
function safelyGetActiveMission() {
    if(!state.sectorId || !state.missions[state.sectorId]) return null;
    for (let h of HORIZONS) { 
        const found = state.missions[state.sectorId][h].find(x => x.id === state.activeMissionId); 
        if (found) { state.horizon = h; return found; } 
    }
    return null;
}

function generateStarfield() {
    const field = document.getElementById('global-starfield'); 
    if(!field) return; 
    field.innerHTML = '';
    for(let i=0; i<250; i++) {
        const p = document.createElement('div'); 
        p.className = 'void-particle'; 
        p.style.width = Math.random() * 2 + 'px'; 
        p.style.height = p.style.width;
        p.style.left = Math.random() * 100 + '%'; 
        p.style.top = Math.random() * 100 + '%'; 
        p.style.animationDuration = (Math.random() * 5 + 3) + 's'; 
        p.style.animationDelay = (Math.random() * 5) + 's';
        field.appendChild(p);
    }
}

function render() {
    document.getElementById('app').classList.remove('critical-mode'); 
    updateHUD(); 
    processTimeMechanics(); 
    checkDecayStatus();
    
    const container = document.getElementById('view-container');
    const zoomBtn = document.getElementById('zoom-out');
    const bread = document.getElementById('breadcrumb');
    const footer = document.getElementById('control-footer');
    
    if(!container) return; 
    container.innerHTML = ''; 
    if(zoomBtn) zoomBtn.style.visibility = state.level > 1 ? 'visible' : 'hidden';
    
    const activeSector = state.sectors.find(s => s.id === state.sectorId);
    const currentAccent = activeSector ? activeSector.color : '#00e5ff';
    
    document.documentElement.style.setProperty('--accent', currentAccent); 
    document.documentElement.style.setProperty('--accent-glow', currentAccent + '99');
    
    if(bread) bread.innerText = `${activeSector ? activeSector.name : 'GALAXY'} ${state.horizon ? '> ' + state.horizon : ''}`;
    
    switch(state.level) {
        case 1: renderLevel1(container, footer); break;
        case 2: renderLevel2(container, footer, activeSector); break;
        case 3: renderLevel3(container, footer); break;
        case 4: renderLevel4(container, footer); break;
    }
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
                    const a = x0 * y1 - x1 * y0; 
                    area += a; cx += (x0 + x1) * a; cy += (y0 + y1) * a;
                }
                area *= 3; 
                if (area !== 0) { points[i] = { x: cx / area, y: cy / area }; }
            }
        }
    }
    return points;
}

function renderLevel1(container, footer) {
    if(footer) { 
        footer.style.display = 'flex'; 
        footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openSectorModal()">[ EDIT SECTORS ]</button>`; 
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); 
    svg.id = "voronoi-map"; 
    container.appendChild(svg);
    
    const w = Math.max(container.clientWidth, 100);
    const h = Math.max(container.clientHeight, 100);
    
    let seeds = relaxLloyds(state.sectors.map(s => s.seed), 10);
    const voronoi = d3.Delaunay.from(seeds.map(s => [s.x * w, s.y * h])).voronoi([0, 0, w, h]);
    
    state.sectors.forEach((s, i) => {
        const pathData = voronoi.renderCell(i); 
        if(!pathData) return;
        
        const overdue = state.missions[s.id] && HORIZONS.some(hz => state.missions[s.id][hz]?.some(m => m.overdue && !m.captured));
        const color = overdue ? 'var(--thrust)' : s.color;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData); 
        path.setAttribute("fill", color); 
        path.setAttribute("fill-opacity", overdue ? 0.2 : 0.05);
        path.setAttribute("stroke", color); 
        path.setAttribute("stroke-width", "2"); 
        path.setAttribute("class", `voronoi-cell ${overdue ? 'overdue-sector' : ''}`);
        
        path.onclick = () => { state.sectorId = s.id; state.level = 2; render(); }; 
        svg.appendChild(path);
        
        const cx = seeds[i].x * w;
        const cy = seeds[i].y * h;
        
        // --- NEW: FLOATING ARCHIVAL TASKS (CONTAINED WITHIN SECTOR) ---
        const defs = svg.querySelector('defs') || document.createElementNS("http://www.w3.org/2000/svg", "defs");
        if (!svg.querySelector('defs')) svg.insertBefore(defs, svg.firstChild);
        
        const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        clipPath.id = `clip-${s.id}`;
        const clipPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        clipPathEl.setAttribute("d", pathData);
        clipPath.appendChild(clipPathEl);
        defs.appendChild(clipPath);

        const floatGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        floatGroup.setAttribute("clip-path", `url(#clip-${s.id})`);
        svg.appendChild(floatGroup);

        let completedMissions = [];
        HORIZONS.forEach(h => {
            if (state.missions[s.id] && state.missions[s.id][h]) {
                completedMissions.push(...
