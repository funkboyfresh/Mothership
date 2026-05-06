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
    // 1. BUG FIX: Filter out captured missions so they don't clog the grid
    const activeMissions = (existingMissions || []).filter(m => !m.captured);
    const activeWire = activeMissions.slice(-8);
    const count = activeMissions.length;
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
    const n0 = activeMissions[0]; // Gravity centers on active wire, not dead stars

    for (let attempts = 0; attempts < 2500; attempts++) {
        let nodePadding = attempts > 1500 ? 10 : 18;
        let wirePadding = attempts > 1500 ? 8 : 16;
        
        let x = margin + (Math.random() * usableSpace);
        let y = margin + (Math.random() * usableSpace);
        const newNode = { x, y };
        let safe = true;

        // 2. FEATURE: Angular Variance Check (5 Degree Minimum)
        if (activeWire.length >= 2) {
            const lastNode = activeWire[activeWire.length - 1];
            const prevNode = activeWire[activeWire.length - 2];
            
            // Calculate vectors using arctangent
            const anglePrev = Math.atan2(lastNode.y - prevNode.y, lastNode.x - prevNode.x);
            const angleNew = Math.atan2(newNode.y - lastNode.y, newNode.x - lastNode.x);
            
            let diff = Math.abs(angleNew - anglePrev) * (180 / Math.PI);
            if (diff > 180) diff = 360 - diff;
            
            // Reject if less than 5 degrees variance, or if it perfectly backtracks (175+)
            if (diff < 5 || diff > 175) { 
                safe = false; 
                continue; 
            }
        }

        let minDistToNode = Infinity;
        // Only check collision against active missions
        for (let m of activeMissions) {
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

            for (let m of activeMissions) {
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

// --- TIME MECHANICS (SAFELY REBUILT) ---
function getHorizonFromDate(dateStr, fallbackHorizon) {
    if (!dateStr) return fallbackHorizon || 'TRAJECTORY';
    const today = new Date(); today.setHours(0,0,0,0);
    
    // FIXED: WebKit Safe Date Parsing
    let d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) {
        d = new Date(dateStr.replace(/-/g, '/') + ' 00:00:00');
    }
    
    const diffDays = Math.ceil((d - today) / 86400000);
    return diffDays <= 7 ? 'IMMINENT' : (diffDays <= 14 ? 'HORIZON' : 'TRAJECTORY');
}

function processTimeMechanics() {
    const now = new Date();

    state.sectors.forEach(s => {
        HORIZONS.forEach(h => {
            if(!state.missions[s.id] || !state.missions[s.id][h]) return;
            for (let i = state.missions[s.id][h].length - 1; i >= 0; i--) {
                let m = state.missions[s.id][h][i];
                
                if (m && !m.captured) {
                    if (m.dueDate) {
                        // FIXED: Enforce accurate seconds for WebKit/Safari parsing
                        let t = m.dueTime || "23:59:59";
                        if (t.split(':').length === 2) t += ":00"; 
                        
                        let deadline = new Date(`${m.dueDate}T${t}`);
                        if (isNaN(deadline.getTime())) {
                            deadline = new Date(`${m.dueDate.replace(/-/g, '/')} ${t}`);
                        }

                        const diffHrs = (deadline - now) / (1000 * 60 * 60);
                        const diffDays = Math.ceil(diffHrs / 24);

                        if (diffHrs < 0 && !m.overdue) {
                            addEnergy(-10); // Deduct penalty only once when crossing threshold
                        }
                        
                        m.overdue = diffHrs < 0; 
                        m.warningLevel = 0;

                        if (!m.overdue) {
                            if (diffHrs <= 24) m.warningLevel = 24;
                            else if (diffHrs <= 48) m.warningLevel = 48;
                        }

                        // Shift Horizons if necessary
                        let targetH = diffDays <= 7 ? 'IMMINENT' : (diffDays <= 14 ? 'HORIZON' : 'TRAJECTORY');
                        if (targetH !== h) { 
                            state.missions[s.id][targetH].push(m); 
                            state.missions[s.id][h].splice(i, 1); 
                        }
                    } else {
                        // FIXED: Clear warnings if user deletes a previously assigned date
                        m.overdue = false;
                        m.warningLevel = 0;
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
    
    // Engine cleanly evaluates time logic before drawing the screen
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
                completedMissions.push(...state.missions[s.id][h].filter(m => m.captured));
            }
        });
        completedMissions.sort((a,b) => a.completionTimestamp - b.completionTimestamp);
        completedMissions = completedMissions.slice(-100);

        completedMissions.forEach((m, idx) => {
            const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            const px = cx + (Math.random() - 0.5) * (w * 0.7); 
            const py = cy + (Math.random() - 0.5) * (h * 0.7);
            particle.setAttribute("cx", px);
            particle.setAttribute("cy", py);
            particle.setAttribute("r", "2.25");
            
            let pColor = s.color;
            if (m.overdue) pColor = 'var(--thrust)';
            else if (m.warningLevel === 24) pColor = '#ff9900';
            else if (m.warningLevel === 48) pColor = '#ffd700';
            
            particle.setAttribute("fill", pColor);
            particle.setAttribute("opacity", "0.6");
            
            const animX = document.createElementNS("http://www.w3.org/2000/svg", "animate");
            animX.setAttribute("attributeName", "cx");
            animX.setAttribute("values", `${px}; ${px + (Math.random()-0.5)*40}; ${px}`);
            animX.setAttribute("dur", `${15 + Math.random()*20}s`);
            animX.setAttribute("repeatCount", "indefinite");

            const animY = document.createElementNS("http://www.w3.org/2000/svg", "animate");
            animY.setAttribute("attributeName", "cy");
            animY.setAttribute("values", `${py}; ${py + (Math.random()-0.5)*40}; ${py}`);
            animY.setAttribute("dur", `${15 + Math.random()*20}s`);
            animY.setAttribute("repeatCount", "indefinite");

            particle.appendChild(animX);
            particle.appendChild(animY);
            floatGroup.appendChild(particle);
        });
        
        const rings = [ { id: 'IMMINENT', r: 12, s: 10 }, { id: 'HORIZON', r: 20, s: 20 }, { id: 'TRAJECTORY', r: 28, s: 40 } ];
        
        rings.forEach(ring => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", cx); 
            circle.setAttribute("cy", cy); 
            circle.setAttribute("r", ring.r);
            circle.setAttribute("fill", "none"); 
            circle.setAttribute("stroke", color); 
            circle.setAttribute("stroke-width", "0.5"); 
            circle.setAttribute("opacity", "0.4");
            svg.appendChild(circle);
            
            const missions = (state.missions[s.id]?.[ring.id] || []).filter(m => !m.captured);
            if (missions.length > 0) {
                const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
                group.style.transformOrigin = `${cx}px ${cy}px`;
                group.style.animation = `orbit-spin ${ring.s}s linear infinite`;
                
                missions.forEach((m, idx) => {
                    const angle = (idx / missions.length) * Math.PI * 2;
                    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    dot.setAttribute("cx", cx + ring.r * Math.cos(angle)); 
                    dot.setAttribute("cy", cy + ring.r * Math.sin(angle)); 
                    dot.setAttribute("r", "1.5");
                    
                    let dotColor = color; 
                    if (m.overdue) dotColor = 'var(--thrust)';
                    else if (m.warningLevel === 24) dotColor = '#ff9900';
                    else if (m.warningLevel === 48) dotColor = '#ffd700';

                    dot.setAttribute("fill", dotColor); 
                    group.appendChild(dot);
                });
                svg.appendChild(group);
            }
        });
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", cx); 
        text.setAttribute("y", cy + 45); 
        text.setAttribute("fill", color); 
        text.setAttribute("class", "voronoi-text");
        text.textContent = s.name; 
        svg.appendChild(text);

        const sectorCaptured = getCapturedCount(s.id);
        const subText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        subText.setAttribute("x", cx); 
        subText.setAttribute("y", cy + 62); 
        subText.setAttribute("fill", color); 
        subText.style.pointerEvents = "none";
        subText.style.fontSize = "0.5rem";
        subText.style.letterSpacing = "2px";
        subText.style.opacity = "0.7";
        subText.style.textShadow = `0 0 8px ${color}`; 
        subText.setAttribute("text-anchor", "middle");
        subText.textContent = `[ ${sectorCaptured} SECURED ]`; 
        svg.appendChild(subText);
    });
}

function renderLevel2(container, footer, activeSector) {
    if(footer) { 
        footer.style.display = 'flex'; 
        footer.innerHTML = `<button class="zoom-btn" style="font-size: 0.8rem; padding: 10px 20px;" onclick="openTaskModal('TRAJECTORY', false)">+ INITIALIZE TARGET</button>`; 
    }
    
    const sectorCaptured = getCapturedCount(state.sectorId);
    const sectorTracker = document.createElement('div');
    sectorTracker.style.cssText = 'position: absolute; top: 20px; right: 20px; text-align: right; color: var(--text); font-size: 0.7rem; letter-spacing: 1px; z-index: 10; pointer-events: none;';
    sectorTracker.innerHTML = `
        <div style="opacity: 0.5; font-size: 0.5rem; text-transform: uppercase;">SECTOR SECURED</div>
        <div style="font-size: 1.2rem; font-weight: bold; color: var(--accent); text-shadow: 0 0 10px var(--accent-glow);">${sectorCaptured} <span style="font-size: 0.8rem;">★</span></div>`;
    container.appendChild(sectorTracker);

    const header = document.createElement('div');
    header.innerHTML = `<div class="view-level-title">LEVEL 2 // <span id="sector-title-safe"></span></div><h1 class="view-main-title">Planetary Map</h1>`;
    container.appendChild(header);
    
    document.getElementById('sector-title-safe').textContent = activeSector.name;
    
    const center = document.createElement('div'); 
    center.className = 'warp-transition';
    center.style.cssText = 'position:relative; width:280px; height:280px; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%); border-radius:50%;';
    
    const gravityWell = document.createElement('div');
    gravityWell.style.cssText = 'position:absolute; width:100%; height:100%; pointer-events:none; border-radius:50%;';
    for (let i = 0; i < 225; i++) {
        const p = document.createElement('div');
        const r = 30 + (Math.random() * 145);
        const angle = Math.random() * Math.PI * 2;
        const x = 140 + r * Math.cos(angle);
        const y = 140 + r * Math.sin(angle);
        const size = Math.random() * 1.5 + 0.5;
        p.style.cssText = `position:absolute; width:${size}px; height:${size}px; background:#fff; border-radius:50%; opacity:${Math.random() * 0.4 + 0.1}; left:${x}px; top:${y}px; animation: orbit-spin ${40 + Math.random() * 80}s linear infinite;`;
        gravityWell.appendChild(p);
    }
    center.appendChild(gravityWell);
    
    const textSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    textSvg.style.cssText = 'position:absolute; width:100%; height:100%; pointer-events:none; z-index:20;';
    textSvg.setAttribute("viewBox", "0 0 280 280");
    textSvg.innerHTML = `<defs><path id="path-horizon" d="M 67.5,140 A 72.5,72.5 0 0,1 212.5,140" /><path id="path-trajectory" d="M 22.5,140 A 117.5,117.5 0 0,1 257.5,140" /></defs>`;
    center.appendChild(textSvg);
    
    const views = [ 
        { id: 'TRAJECTORY', size: 280, speed: 60 }, 
        { id: 'HORIZON', size: 190, speed: 30 }, 
        { id: 'IMMINENT', size: 100, speed: 15 } 
    ];
    
    views.forEach(d => {
        const overdue = state.missions[state.sectorId]?.[d.id]?.some(m => m.overdue && !m.captured);
        const wrapper = document.createElement('div'); 
        wrapper.className = `ring-circle ${overdue ? 'overdue' : ''}`;
        wrapper.style.width = d.size + 'px'; 
        wrapper.style.height = d.size + 'px';
        
        wrapper.onclick = (e) => { 
            e.stopPropagation(); 
            state.horizon = d.id; 
            state.level = 3; 
            render(); 
        };
        
        if (d.id === 'IMMINENT') {
            const label = document.createElement('div'); 
            label.className = 'ring-label';
            label.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#ffffff; font-size: 0.7rem; font-weight: bold; letter-spacing: 2px;';
            label.innerText = d.id; 
            wrapper.appendChild(label);
        } else {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("fill", "#ffffff"); 
            text.style.cssText = 'font-size: 0.7rem; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;';
            const tp = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
            tp.setAttribute("href", `#path-${d.id.toLowerCase()}`); 
            tp.setAttribute("startOffset", "50%"); 
            tp.setAttribute("text-anchor", "middle"); 
            tp.setAttribute("dominant-baseline", "middle");
            tp.textContent = d.id; 
            text.appendChild(tp); 
            textSvg.appendChild(text);
        }
        
        const starField = document.createElement('div'); 
        starField.style.cssText = `position:absolute; width:100%; height:100%; animation: orbit-spin ${d.speed}s linear infinite; pointer-events:none;`;
        
        const missions = (state.missions[state.sectorId]?.[d.id] || []).filter(m => !m.captured);
        missions.forEach((m, i) => {
            const angle = (i / missions.length) * Math.PI * 2;
            const r = d.size/2;
            const dot = document.createElement('div'); 
            
            let dotColor = activeSector.color; 
            if (m.overdue) dotColor = 'var(--thrust)';
            else if (m.warningLevel === 24) dotColor = '#ff9900';
            else if (m.warningLevel === 48) dotColor = '#ffd700';

            dot.style.cssText = `position:absolute; width:6px; height:6px; border-radius:50%; background:${dotColor}; left:calc(${r + r * Math.cos(angle)}px - 3px); top:calc(${r + r * Math.sin(angle)}px - 3px); box-shadow: 0 0 8px ${dotColor};`;
            starField.appendChild(dot);
        });
        
        wrapper.appendChild(starField); 
        center.appendChild(wrapper);
    });
    container.appendChild(center);
}

function renderLevel3(container, footer) {
    if(footer) { 
        footer.style.display = 'flex'; 
        footer.innerHTML = `<button class="zoom-btn" style="flex:1; font-size: 0.8rem;" onclick="openTaskModal('${state.horizon}', true)">+ INITIALIZE TARGET (${state.horizon})</button>
            <button class="zoom-btn" style="width: 85px; margin-left: 10px; font-size: 0.8rem;" onclick="togglePilotLog()"><span style="font-size: 1.6rem; line-height: 0;">^</span> LOG</button>`; 
    }
    
    const missions = state.missions[state.sectorId]?.[state.horizon] || [];
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); 
    svg.id = "constellation-svg"; 
    container.appendChild(svg);
    
    const activeSector = state.sectors.find(s => s.id === state.sectorId);
    const accentColor = activeSector ? activeSector.color : '#00e5ff';

    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    
    const activePool = missions.filter(m => !m.captured);
    const capturedPool = missions.filter(m => m.captured && (now - (m.completionTimestamp || 0) < oneWeekMs));
    
    const wireActive = activePool.slice(0, 6);
    const wireCaptured = capturedPool.slice(-2);
    const wireTasks = [...wireCaptured, ...wireActive];
    
    const debrisMissions = missions.filter(m => m.captured && !wireTasks.includes(m)).slice(-20);

    const header = document.createElement('div');
    header.style.cssText = 'position: absolute; bottom: 20px; text-align: center; width: 100%; pointer-events: none;';
    header.innerHTML = `<div class="view-level-title">LEVEL 3 // ${state.horizon}</div><h1 class="view-main-title" style="margin-bottom:0;">Constellation Map</h1>`;
    container.appendChild(header);

    if (wireActive.length > 0) {
        const priorityContainer = document.createElement('div');
        priorityContainer.className = 'priority-dropdown-container';
        priorityContainer.style.cssText = 'position: absolute; top: 12px; z-index: 100; left: 20px;'; 
        
        priorityContainer.innerHTML = `
            <button class="priority-toggle-btn" onclick="this.nextElementSibling.classList.toggle('show')">
                MISSION PRIORITIES (${wireActive.length}/6) <span>v</span>
            </button>
            <div class="priority-list">
                ${wireActive.map((m, i) => {
                    const isDecaying = m.overdue && !m.captured;
                    return `<div class="priority-item ${i === 0 ? 'mission-critical-active' : ''}" 
                         style="${i === 0 ? `--sector-color: ${isDecaying ? 'rgba(255, 42, 42, 0.2)' : accentColor + '22'}; --sector-border: ${isDecaying ? 'var(--thrust)' : accentColor};` : ''}">
                        <span class="p-num">${missions.indexOf(m) + 1}</span>
                        <span class="p-status" style="color: ${isDecaying ? 'var(--thrust)' : ''}">${i === 0 ? (isDecaying ? '[ CRITICAL DECAY ]' : '[ MISSION CRITICAL ]') : ''}</span>
                        <span class="p-text">${m.name}</span>
                    </div>`
                }).join('')}
            </div>`;
        container.appendChild(priorityContainer);
    }

    if (wireTasks.length > 1) {
        for (let i = 0; i < wireTasks.length - 1; i++) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", wireTasks[i].x + "%"); 
            line.setAttribute("y1", wireTasks[i].y + "%");
            line.setAttribute("x2", wireTasks[i+1].x + "%"); 
            line.setAttribute("y2", wireTasks[i+1].y + "%");
            line.setAttribute("stroke", "var(--accent)"); 
            line.setAttribute("stroke-width", "1.5"); 
            line.setAttribute("stroke-dasharray", "5,5"); 
            line.setAttribute("opacity", "0.8");
            svg.appendChild(line);
        }
    }
    
    [...debrisMissions, ...wireTasks].forEach((m) => {
        const star = document.createElement('div');
        const isDebris = debrisMissions.includes(m);
        const isCapOnWire = wireCaptured.includes(m);
        const isDecay = m.overdue;
        
        let warnClass = ''; 
        if (isDecay && !m.captured) warnClass = 'decaying'; 
        else if (m.warningLevel === 24) warnClass = 'warning-24'; 
        else if (m.warningLevel === 48) warnClass = 'warning-48';

        star.className = `star-container ${isDebris ? 'debris-node' : ''} ${warnClass} warp-transition`;
        
        if (isDebris && !m.scale) { 
            m.driftX = (Math.random()-0.5)*8; 
            m.driftY = (Math.random()-0.5)*8; 
            m.scale = 0.3 + (Math.random()*0.4); 
        }
        
        star.style.left = (m.x + (m.driftX || 0)) + '%'; 
        star.style.top = (m.y + (m.driftY || 0)) + '%';
        
        if (!m.captured) { 
            star.onclick = () => { state.activeMissionId = m.id; state.level = 4; render(); }; 
            star.style.cursor = 'pointer'; 
        } else { 
            star.style.pointerEvents = 'none'; 
        }

        const node = document.createElement('div'); 
        node.className = `star-node ${m.captured ? 'captured' : ''}`;
        
        if (isDebris) { 
            let warningFill = accentColor; 
            if (isDecay) warningFill = 'var(--thrust)'; 
            else if (m.warningLevel === 24) warningFill = '#ff9900'; 
            else if (m.warningLevel === 48) warningFill = '#ffd700';

            node.style.transform = `scale(${m.scale})`; 
            node.style.opacity = '0.35'; 
            node.style.backgroundColor = warningFill;
            node.style.borderColor = accentColor;
            node.style.borderWidth = '1px';
            node.style.borderStyle = 'solid';
            node.style.boxShadow = 'none'; 
        } else if (isCapOnWire) {
            let warningFill = accentColor; 
            if (isDecay) warningFill = 'var(--thrust)'; 
            else if (m.warningLevel === 24) warningFill = '#ff9900'; 
            else if (m.warningLevel === 48) warningFill = '#ffd700';
            
            node.style.opacity = '1.0'; 
            node.style.backgroundColor = warningFill; 
            node.style.borderColor = accentColor; 
            node.style.borderWidth = '2px';
            node.style.borderStyle = 'solid';
            node.style.color = '#ffffff'; 
            node.style.textShadow = '0px 0px 3px rgba(0,0,0,0.8)';
            node.style.boxShadow = `0 0 10px ${warningFill}99`; 
            node.textContent = missions.indexOf(m) + 1;
        } else {
            const isCrit = m.id === wireActive[0]?.id;
            const op = isCrit ? 1.0 : 0.8;
            const hex = Math.floor(op * 255).toString(16).padStart(2, '0');
            
            let bColor = accentColor;
            let gColor = accentColor + hex;
            
            if (isDecay) { 
                bColor = 'var(--thrust)'; 
                gColor = 'rgba(255, 42, 42, 0.6)'; 
            } else if (m.warningLevel === 24) { 
                bColor = '#ff9900'; 
                gColor = 'rgba(255, 153, 0, 0.6)'; 
            } else if (m.warningLevel === 48) { 
                bColor = '#ffd700'; 
                gColor = 'rgba(255, 215, 0, 0.6)'; 
            }
            
            node.style.boxShadow = `0 0 ${isCrit ? 20 : 15}px ${gColor}`; 
            node.style.borderColor = bColor; 
            node.style.filter = `brightness(${isCrit ? 1.15 : 1.0})`; 
            if (isCrit) node.style.borderWidth = '3px'; 
            node.textContent = missions.indexOf(m) + 1;
        }

        const label = document.createElement('div'); 
        label.className = 'star-label'; 
        label.style.display = isDebris ? 'none' : 'block'; 
        label.style.opacity = isCapOnWire ? '0.45' : '1'; 
        label.textContent = m.name; 
        
        star.appendChild(node); 
        star.appendChild(label); 
        container.appendChild(star);
    });
}

function renderLevel4(container, footer) {
    if(footer) footer.style.display = 'none';
    const m = safelyGetActiveMission(); 
    if (!m) { zoomOut(); return; }
    
    const comp = m.subs.filter(s => s.c).length;
    const prog = m.subs.length ? Math.round((comp / m.subs.length) * 100) : 0;
    const allDone = m.subs.length > 0 && comp === m.subs.length;
    
    const lock = document.createElement('div');
    const isDecay = m.overdue && !m.captured; 
    
    if (isDecay) document.getElementById('app').classList.add('critical-mode');
    
    lock.className = `target-lock warp-transition ${isDecay ? 'critical' : ''}`; 
    lock.innerHTML = `<div class="view-level-title">LEVEL 4 // ${m.captured ? 'ARCHIVE' : 'ACTIVE'}</div><h2 style="color: ${isDecay ? 'var(--thrust)' : 'var(--text)'}">${m.name}</h2>`;
    
    const activeSector = state.sectors.find(s => s.id === state.sectorId);
    const accentColor = activeSector ? activeSector.color : 'var(--accent)';
    
    if (m.subs.length > 0) {
        const pCont = document.createElement('div'); 
        pCont.className = 'priority-dropdown-container'; 
        let critIdx = m.subs.findIndex(s => !s.c); 
        if (critIdx === -1) critIdx = 0; 
        
        pCont.innerHTML = `
            <button class="priority-toggle-btn" onclick="this.nextElementSibling.classList.toggle('show')">MISSION PRIORITIES <span>v</span></button>
            <div class="priority-list">
                ${m.subs.map((s, i) => `
                    <div class="priority-item ${i === critIdx && !s.c ? 'mission-critical-active' : ''} ${s.c ? 'task-captured' : ''}" 
                         style="${i === critIdx && !s.c ? `--sector-color: ${accentColor}22; --sector-border: ${accentColor};` : ''}">
                        <span class="p-num">${i + 1}</span>
                        <span class="p-text">${s.t}</span>
                    </div>`).join('')}
            </div>`; 
        lock.appendChild(pCont);
    }
    
    lock.insertAdjacentHTML('beforeend', `<div class="progress-wrapper"><div class="progress-bar-container"><div class="progress-fill" style="width: ${prog}%;"></div></div><div class="progress-text">${prog}% INTEGRITY</div></div>`);
    
    const orbSys = document.createElement('div'); 
    orbSys.className = 'orbital-system'; 
    orbSys.innerHTML = `<svg viewBox="0 0 340 340" style="position:absolute; width:100%; height:100%;"><circle cx="170" cy="170" r="14" fill="${allDone ? 'var(--captured)' : 'var(--bg)'}" stroke="var(--accent)" stroke-width="2"/></svg>`;
    
    m.subs.forEach((s, i) => {
        const angle = (i / m.subs.length) * Math.PI * 2;
        const x = 170 + 100 * Math.cos(angle);
        const y = 170 + 100 * Math.sin(angle);
        const subNode = document.createElement('div'); 
        subNode.style.cssText = `position:absolute; left:${x}px; top:${y}px; transform:translate(-50%, -50%); cursor:pointer;`;
        
        if (!m.captured) subNode.onclick = () => toggleSubTask(i);
        
        const box = document.createElement('div'); 
        box.className = `orbital-node-box ${s.c ? 'checked' : ''}`; 
        box.innerHTML = `<div class="orb-check">${s.c ? '✓' : ''}</div><div class="orb-text">${s.t}</div>`; 
        
        subNode.appendChild(box); 
        orbSys.appendChild(subNode);
    });
    
    lock.appendChild(orbSys);
    
    const btnWrap = document.createElement('div'); 
    btnWrap.style.cssText = 'display:flex; gap:10px; margin-top: auto; margin-bottom: 20px;';
    btnWrap.innerHTML = `
        <button class="mod-btn" onclick="openEditModal(${m.id})">EDIT</button>
        <button class="mod-btn" onclick="deleteMission(${m.id})" style="color:var(--thrust)">DESTROY</button>`;
    lock.appendChild(btnWrap); 
    
    if (allDone && !m.captured) {
        const modal = document.createElement('div'); 
        modal.className = 'hex-modal warp-transition'; 
        modal.innerHTML = `<h2 style="color: var(--captured)">TARGET SECURED</h2><button class="success-btn" onclick="completeMission()">LOG MISSION & WARP</button>`; 
        lock.appendChild(modal);
    }
    
    container.appendChild(lock);
}

// --- MISSION MODAL & INTERACTION ---
function moveMission(direction) {
    const m = safelyGetActiveMission(); 
    if (!m) return;
    const missions = state.missions[state.sectorId][state.horizon];
    const index = missions.findIndex(x => x.id === m.id);
    const newIdx = index + direction;
    if (newIdx >= 0 && newIdx < missions.length) { 
        missions.splice(index, 1); 
        missions.splice(newIdx, 0, m); 
        save(); 
        render(); 
    }
}

function openTaskModal(h, f) { 
    // --- NEW: Block access at the door if at mission limit ---
    const hzMissions = (state.missions[state.sectorId]?.[h]) ? state.missions[state.sectorId][h] : [];
    const activeCount = hzMissions.filter(m => !m.captured).length;
    
    if (activeCount >= 6) {
        showSoftWarning("TARGET LIMIT REACHED (6/6).\nCOMPLETE ACTIVE MISSIONS TO OPEN NEW TRAJECTORIES.");
        return; 
    }
    // ---------------------------------------------------------

    editModeId = null; 
    defaultHorizonContext = h; 
    isHorizonFixed = f; 
    document.getElementById('modal-task-name').value = ''; 
    document.getElementById('modal-task-date').value = '';
    
    const timeIn = document.getElementById('modal-task-time'); 
    if(timeIn) timeIn.value = '';

    document.getElementById('modal-horizon-select').value = h; 
    document.getElementById('modal-horizon-group').style.display = f ? 'none' : 'block'; 
    tempSubtasks = ['', '', '']; 
    renderModalSubtasks(); 
    document.getElementById('task-modal-overlay').style.display = 'flex'; 
}

function renderModalSubtasks() {
    const list = document.getElementById('modal-subtasks-list'); 
    if(!list) return; 
    list.innerHTML = '';
    tempSubtasks.forEach((sub, i) => {
        const row = document.createElement('div'); 
        row.className = 'subtask-row';
        row.innerHTML = `
            <input type="text" class="modal-input" value="${sub}" placeholder="optional - enter sub routine" oninput="tempSubtasks[${i}] = this.value" style="background:transparent; border-color:rgba(255,255,255,0.1);">
            <button class="subtask-remove-minimal" onclick="tempSubtasks.splice(${i}, 1); renderModalSubtasks();">−</button>`; 
        list.appendChild(row);
    });
}

function addModalSubtask() { 
    if (tempSubtasks.length < 10) { 
        tempSubtasks.push(''); 
        renderModalSubtasks(); 
    } 
}

function closeTaskModal() { 
    const overlay = document.getElementById('task-modal-overlay'); 
    if (overlay) overlay.style.display = 'none'; 
}

function saveTaskModal() {
    const name = document.getElementById('modal-task-name').value.trim(); 
    if (!name) { alert("Mission must be named"); return; }
    
    const h = isHorizonFixed ? defaultHorizonContext : document.getElementById('modal-horizon-select').value;
    const hzMissions = (state.missions[state.sectorId]?.[h]) ? state.missions[state.sectorId][h] : [];
    const activeCount = hzMissions.filter(m => !m.captured).length;
    
    // --- UPDATED: Replaced rigid alert with soft warning ---
    if (!editModeId && activeCount >= 6) { 
        showSoftWarning("TARGET LIMIT REACHED (6/6).\nCOMPLETE ACTIVE MISSIONS TO OPEN NEW TRAJECTORIES."); 
        return; 
    }
    
    const dateStr = document.getElementById('modal-task-date').value;
    const timeStr = document.getElementById('modal-task-time')?.value || null;
    const finalH = getHorizonFromDate(dateStr, h);
    
    if (!state.missions[state.sectorId]) {
        state.missions[state.sectorId] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]};
    }

    if (editModeId) {
        let eIdx = -1, eHz = null; 
        HORIZONS.forEach(hz => { 
            const idx = state.missions[state.sectorId][hz].findIndex(m => m.id === editModeId); 
            if (idx !== -1) { eIdx = idx; eHz = hz; } 
        });
        if (eIdx !== -1) {
            if (eHz === finalH) { 
                const m = state.missions[state.sectorId][finalH][eIdx]; 
                m.name = name; 
                m.dueDate = dateStr || null; 
                m.dueTime = timeStr; 
                m.subs = tempSubtasks.filter(t => t.trim()).map(t => ({t, c:false})); 
            } else { 
                state.missions[state.sectorId][eHz].splice(eIdx, 1); 
                const coords = getSafeCoordinates(state.missions[state.sectorId][finalH] || []); 
                state.missions[state.sectorId][finalH].push({ 
                    id: editModeId, name, 
                    subs: tempSubtasks.filter(t => t.trim()).map(t => ({t, c:false})), 
                    x: coords.x, y: coords.y, dueDate: dateStr || null, dueTime: timeStr 
                }); 
            }
        }
    } else { 
        const coords = getSafeCoordinates(hzMissions); 
        state.missions[state.sectorId][finalH].push({ 
            id: Date.now(), name, 
            subs: tempSubtasks.filter(t => t.trim()).map(t => ({t, c:false})), 
            x: coords.x, y: coords.y, dueDate: dateStr || null, dueTime: timeStr 
        }); 
    }
    
    save(); 
    closeTaskModal(); 
    render();
}

function zoomOut() { 
    state.level = Math.max(1, state.level - 1); 
    if (state.level === 1) { state.sectorId = null; state.horizon = null; } 
    render(); 
}

function toggleSubTask(idx) { 
    const m = safelyGetActiveMission(); 
    if (m?.subs[idx]) { 
        m.subs[idx].c = !m.subs[idx].c; 
        if (m.subs[idx].c) { triggerHaptic(30); addEnergy(5); } 
        else { addEnergy(-5); } 
        save(); 
        render(); 
    } 
}

function completeMission() { 
    const m = safelyGetActiveMission(); 
    if (m) { 
        m.captured = true; 
        m.completionTimestamp = Date.now(); 
        addEnergy(25); 
        triggerHaptic([50, 30, 50]); 
        save(); 
        state.level = 3; 
        render(); 
    } 
}

function deleteMission(id) { 
    if(confirm("Destroy?")) { 
        HORIZONS.forEach(h => { 
            if(state.missions[state.sectorId]?.[h]) {
                state.missions[state.sectorId][h] = state.missions[state.sectorId][h].filter(m => m.id !== id); 
            }
        }); 
        save(); 
        state.level = 3; 
        render(); 
    } 
}

// --- SECTOR & SYSTEM CONFIG ---
function openSectorModal() { 
    editingSectors = JSON.parse(JSON.stringify(state.sectors)); 
    renderSectorEditList(); 
    document.getElementById('sector-modal-overlay').style.display = 'flex'; 
}

function closeSectorModal() { 
    document.getElementById('sector-modal-overlay').style.display = 'none'; 
}

function renderSectorEditList() {
    const list = document.getElementById('sector-edit-list');
    const addBtn = document.getElementById('sector-add-btn'); 
    if(!list) return; 
    list.innerHTML = '';
    
    editingSectors.forEach((s, i) => {
        const row = document.createElement('div'); 
        row.className = 'subtask-row'; 
        row.style.marginBottom = '12px';
        const colorGraphic = `
            <div style="position: relative; width: 24px; height: 36px; flex-shrink: 0; cursor: pointer; border: 1px solid ${s.color}; border-radius: 2px; box-shadow: 0 0 10px ${s.color}66, inset 0 0 5px ${s.color}33; background: rgba(0,0,0,0.5);">
                <input type="color" value="${s.color}" onchange="editingSectors[${i}].color = this.value; renderSectorEditList();" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                <div style="position: absolute; top: 4px; bottom: 4px; left: 4px; right: 4px; background: ${s.color}; box-shadow: 0 0 8px ${s.color}; border-radius: 1px;"></div>
            </div>`;
        row.innerHTML = `
            ${colorGraphic}
            <input type="text" class="modal-input" value="${s.name}" oninput="editingSectors[${i}].name = this.value" style="flex: 1; height: 36px;">
            <button class="mod-btn" onclick="resetSectorMissions('${s.id}')" style="height: 36px; font-size: 0.5rem; color: var(--thrust); border-color: var(--thrust);">RESET</button>
            <button class="subtask-remove-minimal" onclick="editingSectors.splice(${i}, 1); renderSectorEditList();" style="height: 36px; width: 36px; margin: 0;">−</button>`; 
        list.appendChild(row);
    }); 
    
    if(addBtn) addBtn.style.display = editingSectors.length >= 9 ? 'none' : 'block';
}

function resetSectorMissions(sid) { 
    if(confirm("Wipe sector missions?")) { 
        state.missions[sid] = { TRAJECTORY: [], HORIZON: [], IMMINENT: [] }; 
        save(); 
        render(); 
    } 
}

function factoryReset() { 
    if(confirm("TERMINAL ACTION: Wipe all pilot data, sectors, and logs?")) { 
        localStorage.clear(); 
        location.reload(); 
    } 
}

function addNewSector() { 
    if (editingSectors.length < 9) { 
        editingSectors.push({ 
            id: 'sec_' + Date.now(), 
            name: 'NEW SECTOR', 
            color: AUTO_PALETTE[editingSectors.length % AUTO_PALETTE.length], 
            seed: { x: Math.random(), y: Math.random() } 
        }); 
        renderSectorEditList(); 
    } 
}

function saveSectorModal() { 
    editingSectors.forEach(s => { 
        if (!state.missions[s.id]) state.missions[s.id] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]}; 
    }); 
    state.sectors = JSON.parse(JSON.stringify(editingSectors)); 
    save(); 
    closeSectorModal(); 
    render(); 
}

function openSettingsModal() { 
    document.getElementById('settings-haptics-toggle').checked = state.hapticsEnabled; 
    document.getElementById('settings-modal-overlay').style.display = 'flex'; 
}

function closeSettingsModal() { 
    state.hapticsEnabled = document.getElementById('settings-haptics-toggle').checked; 
    save(); 
    document.getElementById('settings-modal-overlay').style.display = 'none'; 
}

function openEditModal(id) {
    editModeId = id; 
    let target = null; 
    HORIZONS.forEach(h => { 
        const found = state.missions[state.sectorId]?.[h]?.find(m => m.id === id); 
        if (found) target = found; 
    });
    
    if (!target) return; 
    
    document.getElementById('modal-task-name').value = target.name; 
    document.getElementById('modal-task-date').value = target.dueDate || '';
    
    const timeIn = document.getElementById('modal-task-time'); 
    if(timeIn) timeIn.value = target.dueTime || '';
    
    tempSubtasks = target.subs.map(s => s.t); 
    if(tempSubtasks.length === 0) tempSubtasks = ['']; 
    
    renderModalSubtasks(); 
    document.getElementById('task-modal-overlay').style.display = 'flex';
}

function togglePilotLog() {
    let logModal = document.getElementById('pilot-log-modal');
    if (!logModal) {
        logModal = document.createElement('div'); 
        logModal.id = 'pilot-log-modal'; 
        logModal.className = 'modal-overlay';
        logModal.onclick = (e) => { if(e.target === logModal) logModal.style.display = 'none'; }; 
        document.body.appendChild(logModal);
    }
    
    let allLogs = [];
    state.sectors.forEach(s => { 
        HORIZONS.forEach(h => { 
            (state.missions[s.id]?.[h] || []).forEach(m => { 
                if (m.captured && m.completionTimestamp) { 
                    allLogs.push({...m, sectorName: s.name, sectorColor: s.color}); 
                } 
            }); 
        }); 
    });
    
    allLogs.sort((a, b) => b.completionTimestamp - a.completionTimestamp);
    const displayLogs = allLogs.slice(0, 50);
    
    const logContent = displayLogs.length > 0 ? displayLogs.map(m => {
            const d = new Date(m.completionTimestamp);
            return `<div class="log-entry" style="font-size: 0.65rem; padding: 8px; border-bottom: 1px solid var(--border); line-height: 1.4; border-left: 2px solid ${m.sectorColor}; background: ${m.sectorColor}05;"><span style="color:${m.sectorColor}; font-weight: bold;">'Pilot'</span> completed <span style="color:#fff">'${m.name}'</span> in <span style="opacity:0.7">${m.sectorName}</span> on <span style="opacity:0.7">${d.toLocaleDateString()}</span> at <span style="opacity:0.7">${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>`;
        }).join('') : '<div style="padding: 40px 20px; text-align: center; opacity: 0.5; font-size: 0.7rem; letter-spacing: 1px;">NO MISSIONS HAVE BEEN COMPLETED</div>';
        
    logModal.innerHTML = `<div class="modal-box" style="max-width: 450px;"><div class="modal-header">PILOT FLIGHT LOG [LAST 50]</div><div class="subtasks-container" style="max-height: 60vh;">${logContent}</div><button class="mod-btn" style="width:100%; margin-top:10px;" onclick="document.getElementById('pilot-log-modal').style.display='none'">DISMISS</button></div>`;
    logModal.style.display = 'flex';
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
        if (!state.missions[s.id]) { 
            state.missions[s.id] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]}; 
            migrated = true; 
        }
        HORIZONS.forEach(h => {
            if (!state.missions[s.id][h]) { 
                state.missions[s.id][h] = []; 
                migrated = true; 
            }
            state.missions[s.id][h].forEach((m, index, arr) => {
                m.subs = m.subs || []; 
                if (m.x === undefined || isNaN(m.x)) {
                    let coords = getSafeCoordinates(arr.slice(0, index));
                    m.x = coords.x; 
                    m.y = coords.y; 
                    migrated = true;
                }
            });
        });
    });
    if (migrated) save();
}

// --- SYSTEM INITIALIZATION ---
runDatabaseMigration(); 
generateStarfield(); 
render();

// FIXED: Global Temporal Pulse (Every 60 Seconds)
setInterval(() => {
    render(); 
}, 60000);

// Handle responsive resizing
window.addEventListener('resize', () => { 
    if(state.level === 1) render(); 
});
// --- SOFT WARNING SYSTEM ---
let warningTimeout;
function showSoftWarning(message) {
    let toast = document.getElementById('soft-warning-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'soft-warning-toast';
        toast.className = 'soft-warning';
        document.body.appendChild(toast);
    }
    toast.innerText = message;

    // Small delay ensures the opening click doesn't immediately dismiss it
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    clearTimeout(warningTimeout);
    warningTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Dismiss the warning if the pilot clicks anywhere on the screen
window.addEventListener('click', (e) => {
    const toast = document.getElementById('soft-warning-toast');
    if (toast && toast.classList.contains('show')) {
        toast.classList.remove('show');
    }
});
