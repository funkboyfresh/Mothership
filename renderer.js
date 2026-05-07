/** * RENDERER.JS
 * Handles all visual output and bridge aesthetics.
 */

// --- HUD & GLOBAL EFFECTS ---

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

function updateHUD() {
    const levelEl = document.getElementById('hud-level');
    const energyEl = document.getElementById('hud-energy-readout');
    const barEl = document.getElementById('hud-capacitor-bar');
    
    if(levelEl) levelEl.innerText = `PILOT LEVEL ${state.playerLevel}`;
    if(energyEl) energyEl.innerText = `CAPACITOR ${state.energy}%`;
    if(barEl) barEl.style.width = `${state.energy}%`;
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

// --- SPATIAL MATH FOR RENDERER ---

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

// --- MAIN RENDER LOOP ---

// [ FIXED ] Added the function name back!
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
        case 5: renderHangar(container); break;
    }
}

// --- SECTOR MAP (L1) ---

function renderLevel1(container, footer) {
    if(footer) { 
        footer.style.display = 'flex'; 
        footer.innerHTML = `
            <button class="zoom-btn" onclick="openSectorModal()">[ SECTORS ]</button>
            <button class="zoom-btn" style="margin-left:10px; border-color: var(--captured); color: var(--captured);" onclick="state.level = 5; render();">[ HANGAR ]</button>
        `; // [ FIXED ] Restored the render() call!
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
        
        // [ FIXED ] Restored the render() call!
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
            
            const rSize = 2.25 * (1 + (Math.random() * 2));
            particle.setAttribute("r", rSize.toString());
            
            let pColor = s.color;
            if (m.overdue) pColor = '#ff2a2a';
            else if (m.warningLevel === 24) pColor = '#ff9900';
            else if (m.warningLevel === 48) pColor = '#ffd700';
            
            particle.setAttribute("fill", pColor);
            particle.setAttribute("opacity", "0.6");
            
            const speedMultiplier = 1 + Math.random(); 
            const durX = (15 + Math.random() * 20) / speedMultiplier;
            const durY = (15 + Math.random() * 20) / speedMultiplier;

            const animX = document.createElementNS("http://www.w3.org/2000/svg", "animate");
            animX.setAttribute("attributeName", "cx");
            animX.setAttribute("values", `${px}; ${px + (Math.random()-0.5)*60}; ${px}`);
            animX.setAttribute("dur", `${durX}s`);
            animX.setAttribute("repeatCount", "indefinite");

            const animY = document.createElementNS("http://www.w3.org/2000/svg", "animate");
            animY.setAttribute("attributeName", "cy");
            animY.setAttribute("values", `${py}; ${py + (Math.random()-0.5)*60}; ${py}`);
            animY.setAttribute("dur", `${durY}s`);
            animY.setAttribute("repeatCount", "indefinite");

            particle.appendChild(animX);
            particle.appendChild(animY);
            floatGroup.appendChild(particle);
        });
        
        const rings = [ { id: 'IMMINENT', r: 12, s: 10 }, { id: 'HORIZON', r: 20, s: 20 }, { id: 'TRAJECTORY', r: 28, s: 40 } ];
        
        rings.forEach(ring => {
            const ringOffset = Math.random() * Math.PI * 2; 

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
                    const angle = ringOffset + (idx / missions.length) * Math.PI * 2;
                    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    dot.setAttribute("cx", cx + ring.r * Math.cos(angle)); 
                    dot.setAttribute("cy", cy + ring.r * Math.sin(angle)); 
                    dot.setAttribute("r", "1.5");
                    
                    let dotColor = color; 
                    if (m.overdue) dotColor = '#ff2a2a';
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

// --- PLANETARY MAP (L2) ---

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
    
    const debrisField = document.createElement('div');
    debrisField.style.cssText = 'position:absolute; width:100%; height:100%; pointer-events:none; z-index: 15;';
    
    let completedMissions = [];
    HORIZONS.forEach(h => {
        if (state.missions[state.sectorId] && state.missions[state.sectorId][h]) {
            completedMissions.push(...state.missions[state.sectorId][h].filter(m => m.captured));
        }
    });
    completedMissions.sort((a,b) => a.completionTimestamp - b.completionTimestamp);
    completedMissions = completedMissions.slice(-100);

    completedMissions.forEach((m) => {
        const particle = document.createElement('div');
        const r = 40 + Math.random() * 100; 
        const angle = Math.random() * Math.PI * 2;
        const px = 140 + r * Math.cos(angle); 
        const py = 140 + r * Math.sin(angle);
        
        let pColor = activeSector.color;
        if (m.overdue) { pColor = '#ff2a2a'; }
        else if (m.warningLevel === 24) { pColor = '#ff9900'; }
        else if (m.warningLevel === 48) { pColor = '#ffd700'; }
        
        let bColor = pColor;
        const size = 4 * (1 + (Math.random() * 2));
        
        particle.style.cssText = `position:absolute; width:${size}px; height:${size}px; border-radius:50%; background:${pColor}; border:1px solid ${bColor}; opacity:0.6; left:${px}px; top:${py}px;`;
        particle.className = 'debris-node'; 
        particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
        particle.style.setProperty('--dy', `${(Math.random() - 0.5) * 60}px`);

        const speedMultiplier = 1 + Math.random();
        const floatDur = (10 + Math.random() * 13.3) / speedMultiplier;
        particle.style.setProperty('--float-dur', `${floatDur}s`);
        
        debrisField.appendChild(particle);
    });
    
    gravityWell.appendChild(debrisField);
    center.appendChild(gravityWell);

    const textSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    textSvg.style.cssText = 'position:absolute; width:100%; height:100%; pointer-events:none; z-index:20;';
    textSvg.setAttribute("viewBox", "0 0 280 280");
    textSvg.innerHTML = `<defs><path id="path-horizon" d="M 67.5,140 A 72.5,72.5 0 0,1 212.5,140" /><path id="path-trajectory" d="M 22.5,140 A 117.5,117.5 0 0,1 257.5,140" /></defs>`;
    center.appendChild(textSvg);
    
    const views = [ 
        { id: 'TRAJECTORY', size: 280, speed: 60, op: 0.5, glowMult: 0.5 }, 
        { id: 'HORIZON', size: 190, speed: 30, op: 0.75, glowMult: 0.75 },  
        { id: 'IMMINENT', size: 100, speed: 15, op: 1.0, glowMult: 1.5 } 
    ];
    
    views.forEach(d => {
        const overdue = state.missions[state.sectorId]?.[d.id]?.some(m => m.overdue && !m.captured);
        const wrapper = document.createElement('div'); 
        wrapper.className = `ring-circle ${overdue ? 'overdue' : ''}`;
        wrapper.style.width = d.size + 'px'; 
        wrapper.style.height = d.size + 'px';
        
        wrapper.style.opacity = overdue ? 1 : d.op;
        if (!overdue) {
            const spread = 20 * d.glowMult;
            wrapper.style.boxShadow = `0 0 ${spread}px var(--accent-glow) inset, 0 0 ${spread}px var(--accent-glow)`;
        }
        
        // [ FIXED ] Restored the render() call!
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
        starField.style.cssText = `position:absolute; width:100%; height:100%; animation: orbit-spin ${d.speed}s linear infinite; pointer-events:none; z-index: 25;`;
        
        const missions = (state.missions[state.sectorId]?.[d.id] || []).filter(m => !m.captured);
        const ringOffset = Math.random() * Math.PI * 2;
        
        missions.forEach((m, i) => {
            const angle = ringOffset + (i / missions.length) * Math.PI * 2;
            const r = d.size/2;
            const dot = document.createElement('div'); 
            
            let dotColor = activeSector.color; 
            if (m.overdue) dotColor = '#ff2a2a';
            else if (m.warningLevel === 24) dotColor = '#ff9900';
            else if (m.warningLevel === 48) dotColor = '#ffd700';

            dot.style.cssText = `position:absolute; width:16px; height:16px; border-radius:50%; background:${dotColor}; left:calc(${140 + r * Math.cos(angle)}px - 8px); top:calc(${140 + r * Math.sin(angle)}px - 8px); box-shadow: 0 0 12px ${dotColor};`;
            starField.appendChild(dot);
        });
        
        center.appendChild(wrapper); 
        center.appendChild(starField);
    });
    container.appendChild(center);
}

// --- CONSTELLATION MAP (L3) ---

function renderLevel3(container, footer) {
    if(footer) { 
        footer.style.display = 'flex'; 
        footer.innerHTML = `<button class="zoom-btn" style="flex:1; font-size: 0.8rem;" onclick="openTaskModal('${state.horizon}', true)">+ INITIALIZE TARGET (${state.horizon})</button>
            <button class="zoom-btn" style="width: 85px; margin-left: 10px; font-size: 0.8rem;" onclick="togglePilotLog()"><span style="font-size: 1.6rem; line-height: 0;">^</span> LOG</button>`; 
    }
    
    const missions = state.missions[state.sectorId]?.[state.horizon] || [];
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); 
    svg.id = "constellation-svg"; 
    
    svg.setAttribute("viewBox", "0 0 100 100"); 
    svg.setAttribute("preserveAspectRatio", "none"); 
    container.appendChild(svg);
    
    const activeSector = state.sectors.find(s => s.id === state.sectorId);
    const accentColor = activeSector ? activeSector.color : '#00e5ff';

    const allActive = missions.filter(m => !m.captured);
    const wireActive = allActive.slice(0, 6);
    const firstActiveIdx = wireActive.length > 0 ? missions.indexOf(wireActive[0]) : missions.length;
    const lastActiveIdx = wireActive.length > 0 ? missions.indexOf(wireActive[wireActive.length - 1]) : -1;
    
    let wireTasks = [];
    let preCaptured = [];
    
    for (let i = firstActiveIdx - 1; i >= 0; i--) {
        let m = missions[i];
        if (m.captured) {
            preCaptured.unshift(m);
            if (preCaptured.length >= 2) break;
        }
    }
    wireTasks.push(...preCaptured);
    
    for (let i = firstActiveIdx; i <= lastActiveIdx; i++) {
        wireTasks.push(missions[i]);
    }
    
    const debrisMissions = missions.filter(m => m.captured && !wireTasks.includes(m)).slice(-20);

    const renderSet = [...debrisMissions, ...wireTasks];
    renderSet.forEach(m => {
        if (m.driftX === undefined) {
            m.driftX = (Math.random()-0.5) * 8; 
            m.driftY = (Math.random()-0.5) * 8; 
            m.scale = 0.3 + (Math.random() * 0.4);
        }
    });

    if (wireTasks.length > 1) {
        for (let i = 0; i < wireTasks.length - 1; i++) {
            const m1 = wireTasks[i];
            const m2 = wireTasks[i+1];
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", m1.x + m1.driftX); 
            line.setAttribute("y1", m1.y + m1.driftY);
            line.setAttribute("x2", m2.x + m2.driftX); 
            line.setAttribute("y2", m2.y + m2.driftY);
            line.setAttribute("stroke", "var(--accent)"); 
            line.setAttribute("stroke-width", "0.5"); 
            line.setAttribute("stroke-dasharray", "1,1"); 
            line.setAttribute("opacity", "0.8");
            svg.appendChild(line);
        }
    }
    
    renderSet.forEach((m) => {
        const star = document.createElement('div');
        const isDebris = debrisMissions.includes(m);
        const isCapOnWire = preCaptured.includes(m); 
        const isDecay = m.overdue && !m.captured;
        
        let warnClass = ''; 
        if (!m.captured) {
            if (isDecay) warnClass = 'decaying'; 
            else if (m.warningLevel === 24) warnClass = 'warning-24'; 
            else if (m.warningLevel === 48) warnClass = 'warning-48';
        }

        star.className = `star-container ${isDebris ? 'debris-node' : 'warp-transition'} ${warnClass}`;
        star.style.left = (m.x + m.driftX) + '%'; 
        star.style.top = (m.y + m.driftY) + '%';
        
        if (isDebris) {
            star.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
            star.style.setProperty('--dy', `${(Math.random() - 0.5) * 60}px`);
            star.style.setProperty('--float-dur', `${15 + Math.random() * 15}s`);
        }

        if (!m.captured) { 
            // [ FIXED ] Restored the render() call!
            star.onclick = () => { state.activeMissionId = m.id; state.level = 4; render(); }; 
            star.style.cursor = 'pointer'; 
        } else { 
            star.style.pointerEvents = 'none'; 
        }

        const node = document.createElement('div'); 
        node.className = `star-node`; 
        
        let borderColor = accentColor;
        let bgFill = 'var(--bg)';
        let textColor = '#ffffff';
        let borderWidth = '2px';

        if (m.captured) {
            textColor = 'var(--bg)';
            if (m.overdue) bgFill = '#ff2a2a'; 
            else if (m.warningLevel === 24) bgFill = '#ff9900'; 
            else if (m.warningLevel === 48) bgFill = '#ffd700';
            else bgFill = accentColor;
            borderColor = bgFill; 
            if (isDebris) {
                borderWidth = '1px';
                node.style.transform = `scale(${m.scale})`;
                node.style.opacity = '0.22'; 
                textColor = 'transparent';
            }
        } else {
            const isCrit = m.id === wireActive[0]?.id;
            if (isDecay) { borderColor = '#ff2a2a'; textColor = '#ff2a2a'; } 
            else if (m.warningLevel === 24) borderColor = '#ff9900'; 
            else if (m.warningLevel === 48) borderColor = '#ffd700';
            if (isCrit) borderWidth = '3px';
        }

        node.style.borderColor = borderColor;
        node.style.backgroundColor = bgFill;
        node.style.color = textColor;
        node.style.borderWidth = borderWidth;
        node.style.borderStyle = 'solid';
        if (!isDebris) node.textContent = missions.indexOf(m) + 1;

        const label = document.createElement('div'); 
        label.className = 'star-label'; 
        label.style.display = isDebris ? 'none' : 'block'; 
        label.style.opacity = isCapOnWire ? '0.45' : '1'; 
        label.textContent = m.name; 
        
        star.appendChild(node); 
        star.appendChild(label); 
        container.appendChild(star);
    });

    const header = document.createElement('div');
    header.style.cssText = 'position: absolute; bottom: 20px; text-align: center; width: 100%; pointer-events: none;';
    header.innerHTML = `<div class="view-level-title">LEVEL 3 // ${state.horizon}</div><h1 class="view-main-title" style="margin-bottom:0;">Constellation Map</h1>`;
    container.appendChild(header);

    const priorityContainer = document.createElement('div');
    priorityContainer.className = 'priority-dropdown-container';
    priorityContainer.style.cssText = 'position: absolute; top: 12px; z-index: 100; left: 20px;'; 
    
    if (wireActive.length > 0) {
        priorityContainer.innerHTML = `
            <button class="priority-toggle-btn" onclick="this.nextElementSibling.classList.toggle('show')">
                MISSION PRIORITIES (${wireActive.length}/6) <span>v</span>
            </button>
            <div class="priority-list">
                ${wireActive.map((m, i) => {
                    const isDecaying = m.overdue && !m.captured;
                    const isCrit = i === 0;
                    let itemStyle = isDecaying ? `--sector-color: rgba(255, 42, 42, 0.3); --sector-border: #ff2a2a; animation: priority-flash-red 1.5s infinite;` : 
                                   (m.warningLevel === 24 ? `--sector-color: rgba(255, 153, 0, 0.3); --sector-border: #ff9900;` : 
                                   (m.warningLevel === 48 ? `--sector-color: rgba(255, 215, 0, 0.3); --sector-border: #ffd700;` : 
                                   (isCrit ? `--sector-color: ${accentColor}22; --sector-border: ${accentColor};` : '')));
                    const statusText = isDecaying ? '[ CRITICAL DECAY ]' : (m.warningLevel === 24 ? '[ WARNING: 24H ]' : (m.warningLevel === 48 ? '[ WARNING: 48H ]' : (isCrit ? '[ MISSION CRITICAL ]' : '')));
                    
                    return `<div class="priority-item ${isCrit || isDecaying || m.warningLevel ? 'mission-critical-active' : ''}" 
                         style="${itemStyle}" onclick="state.activeMissionId = ${m.id}; state.level = 4; render();">
                        <span class="p-num">${missions.indexOf(m) + 1}</span>
                        <span class="p-status">${statusText}</span>
                        <span class="p-text">${m.name}</span>
                    </div>`
                }).join('')}
            </div>`;
    } else {
        priorityContainer.innerHTML = `<button class="priority-toggle-btn" style="pointer-events: none;">MISSION PRIORITIES (0/6)</button>`;
    }
    container.appendChild(priorityContainer);
}

// --- SHIP VIEW (L4 - TARGET LOCK) ---

function renderLevel4(container, footer) {
    if(footer) footer.style.display = 'none';
    const m = safelyGetActiveMission(); 
    if (!m) { zoomOut(); return; }

    const isDecay = m.overdue && !m.captured;
    if (isDecay) document.getElementById('app').classList.add('critical-mode');

    const viewMode = getEncounterViewMode(m.encounterId);
    const encounterName = ENCOUNTER_TYPES[m.encounterId] || "Unknown Phenomenon";

    const comp = m.subs.filter(s => s.c).length;
    const prog = m.subs.length ? Math.round((comp / m.subs.length) * 100) : 0;

    const bridge = document.createElement('div');
    bridge.className = `target-lock warp-transition ${isDecay ? 'critical' : ''}`;
    
    bridge.innerHTML = `
        <div class="view-level-title">LEVEL 4 // BRIDGE COMMAND</div>
        <h2 style="color: ${isDecay ? 'var(--thrust)' : 'var(--text)'}; margin-bottom: 5px;">${m.name}</h2>
        <div style="font-size: 0.6rem; letter-spacing: 2px; opacity: 0.6; margin-bottom: 20px;">
            [ ENCOUNTER: ${encounterName.toUpperCase()} ]
        </div>
    `;

    // --- [ UPGRADED STAGE ] ---
    const stage = document.createElement('div');
    stage.className = `ship-view-stage view-${viewMode} ${isDecay ? 'status-danger' : ''}`;
    
    const streamL = document.createElement('div');
    streamL.className = 'data-stream-left';
    streamL.innerHTML = `<div class="stream-content">${(Math.random().toString(16) + '<br>').repeat(50)}</div>`;
    
    const streamR = document.createElement('div');
    streamR.className = 'data-stream-right';
    streamR.innerHTML = `<div class="stream-content">${('SCAN_FIX: ' + Math.random().toFixed(4) + '<br>').repeat(50)}</div>`;
    
    stage.appendChild(streamL);
    stage.appendChild(streamR);

    const heroUnit = document.createElement('div');
    heroUnit.className = 'ship-hero-unit engine-glow';
    
    if (viewMode === 'external') {
        drawModularShip(heroUnit, state.shipParts); 
    } else {
        heroUnit.innerHTML = `
            <svg width="180" height="120" viewBox="0 0 150 100">
                <rect x="5" y="5" width="140" height="90" fill="none" stroke="var(--accent)" stroke-width="0.5" opacity="0.3" stroke-dasharray="2,2"/>
                <circle cx="75" cy="50" r="35" fill="none" stroke="var(--accent)" stroke-width="1" opacity="0.5"/>
                <line x1="75" y1="15" x2="75" y2="85" stroke="var(--accent)" stroke-width="0.5" opacity="0.2"/>
                <line x1="40" y1="50" x2="110" y2="50" stroke="var(--accent)" stroke-width="0.5" opacity="0.2"/>
                <path d="M75 50 L75 15" stroke="var(--accent)" stroke-width="2">
                    <animateTransform attributeName="transform" type="rotate" from="0 75 50" to="360 75 50" dur="4s" repeatCount="indefinite" />
                </path>
                <path class="cockpit-gauge" d="M10 80 L10 20" stroke="var(--thrust)" stroke-width="4" style="--gauge-val: ${100 - state.energy}"/>
                <path class="cockpit-gauge" d="M140 80 L140 20" stroke="var(--captured)" stroke-width="4" style="--gauge-val: ${prog}"/>
            </svg>`;
    }
    
    stage.appendChild(heroUnit);
    bridge.appendChild(stage);

    // Component HUD (Declared only once)
    const partStatus = document.createElement('div');
    partStatus.style.cssText = 'display:flex; gap:8px; margin-bottom:10px; opacity:0.8;';
    partStatus.innerHTML = Object.keys(state.shipParts).map(p => 
        `<div style="font-size:0.45rem; border:1px solid var(--accent); padding:2px 4px;">${p[0].toUpperCase()}:${state.shipParts[p]}</div>`
    ).join('');
    bridge.appendChild(partStatus);
    
    bridge.insertAdjacentHTML('beforeend', `
        <div class="progress-wrapper" style="margin-top: 15px;">
            <div class="progress-bar-container">
                <div class="progress-fill" style="width: ${prog}%;"></div>
            </div>
            <div class="progress-text">${prog}% OPERATIONAL</div>
        </div>
    `);

    const terminal = document.createElement('div');
    terminal.className = 'terminal-console';
    
    terminal.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:0.5rem; opacity:0.5; margin-bottom:10px; letter-spacing:1px;">
            <span>SYSTEM_DIAGNOSTIC: ACTIVE</span>
            <span>SCRAP_RESERVES: ${state.scrap}</span>
        </div>
    `;

    m.subs.forEach((s, i) => {
        const node = document.createElement('div');
        node.className = `system-node ${s.c ? 'resolved' : ''}`;
        
        node.innerHTML = `
            <div class="node-status-light"></div>
            <span style="flex:1; font-family:'Courier New', monospace; font-size:0.75rem;">${s.t.toUpperCase()}</span>
            <div class="pulse-line"></div>
        `;
        
        if (!m.captured) {
            node.onclick = () => {
                const pulse = node.querySelector('.pulse-line');
                pulse.classList.add('active-pulse');
                setTimeout(() => { triggerHaptic(20); toggleSubTask(i); }, 150);
            };
        }
        terminal.appendChild(node);
    });
    
    bridge.appendChild(terminal);

    const btnWrap = document.createElement('div'); 
    btnWrap.style.cssText = 'display:flex; gap:10px; margin-top: auto; padding: 20px 0;';
    btnWrap.innerHTML = `
        <button class="mod-btn" onclick="openEditModal(${m.id})">RECONFIGURE</button>
        <button class="mod-btn" onclick="deleteMission(${m.id})" style="color:var(--thrust)">ABORT</button>
    `;
    bridge.appendChild(btnWrap); 

    if (prog === 100 && !m.captured) {
        const modal = document.createElement('div'); 
        modal.className = 'hex-modal warp-transition'; 
        modal.innerHTML = `<h2 style="color: var(--captured)">OBJECTIVE SECURED</h2>
                          <button class="success-btn" onclick="completeMission()">LOG DATA & DISENGAGE</button>`; 
        bridge.appendChild(modal);
    }

    container.appendChild(bridge);
}

// [ FIXED ] Added name and proper render() call!
function renderHangar(container) {
    container.innerHTML = `
        <div class="target-lock warp-transition">
            <div class="view-level-title">DRY DOCK // SHIPYARD</div>
            <h1 class="view-main-title">Hangar Bay</h1>
            
            <div class="ship-view-stage" style="height: 150px; margin-bottom: 20px;">
                <div id="hangar-ship-preview"></div>
            </div>

            <div class="terminal-console" style="max-height: 300px; overflow-y: auto;">
                <div style="display:flex; justify-content:space-between; font-size:0.5rem; opacity:0.5; margin-bottom:10px;">
                    <span>MODULAR_FRIGATE_ASSEMBLY</span>
                    <span>SCRAP: ${state.scrap}</span>
                </div>
                ${Object.keys(state.shipParts).map(part => {
                    const level = state.shipParts[part];
                    const cost = level * 15;
                    return `
                        <div class="system-node" onclick="upgradeShipPart('${part}')">
                            <div class="node-status-light" style="background: var(--accent)"></div>
                            <div style="flex:1; text-align:left;">
                                <div style="font-size:0.7rem; font-weight:bold;">${part.toUpperCase()}</div>
                                <div style="font-size:0.5rem; opacity:0.6;">LEVEL ${level} // UPGRADE: ${cost} SCRAP</div>
                            </div>
                            <span style="font-size:0.8rem;">+</span>
                        </div>
                    `;
                }).join('')}
            </div>

            <button class="mod-btn" style="margin-top: 20px;" onclick="state.level = 1; render();">RETURN TO BRIDGE</button>
        </div>
    `;
    
    const preview = document.getElementById('hangar-ship-preview');
    if (preview) drawModularShip(preview, state.shipParts);
}
