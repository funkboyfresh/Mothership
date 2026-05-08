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
    
    let maxEnergy = typeof getMaxEnergy === 'function' ? getMaxEnergy() : 100;
    let title = typeof getFleetTitle === 'function' ? getFleetTitle(state.playerLevel).toUpperCase() : 'PILOT';
    
    if(levelEl && !document.getElementById('app').classList.contains('critical-mode')) {
        levelEl.innerText = `${title} // LEVEL ${state.playerLevel}`;
    }
    if(energyEl) energyEl.innerText = `CAPACITOR ${state.energy} / ${maxEnergy}`;
    if(barEl) barEl.style.width = `${(state.energy / maxEnergy) * 100}%`; 
    
    if(levelEl) {
        let title = typeof getFleetTitle === 'function' ? getFleetTitle(state.playerLevel).toUpperCase() : 'PILOT';
        levelEl.innerText = `${title} // LEVEL ${state.playerLevel}`;
        levelEl.style.cursor = 'pointer'; // Make it look clickable
        levelEl.onclick = openPilotDossier; // Link to the new UI
        
        // Add a pulsing glow if you have unspent Offerings
        if (state.offerings > 0) {
            levelEl.style.textShadow = '0 0 15px var(--accent), 0 0 5px #fff';
            levelEl.classList.add('pulse-animation');
        } else {
            levelEl.style.textShadow = 'none';
            levelEl.classList.remove('pulse-animation');
        }
    }
}

function openPilotDossier() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay warp-transition';
    modal.innerHTML = `
        <div class="modal-content" style="border-color: var(--accent); background: rgba(0,0,5,0.95);">
            <div class="view-level-title" style="color: var(--accent);">PILOT IDENTIFICATION // DOSSIER</div>
            <h2 class="view-main-title">${getFleetTitle(state.playerLevel).toUpperCase()}</h2>
            
            <div class="terminal-console" style="text-align: left; margin: 20px 0;">
                <p> > PILOT LEVEL: <span style="color: var(--accent);">${state.playerLevel}</span></p>
                <p> > VOID OFFERINGS: <span style="color: #a200ff; text-shadow: 0 0 10px #a200ff;">${state.offerings}</span></p>
                <p> > SHIP CLASS: <span style="color: var(--captured);">DREADNOUGHT</span></p>
                <hr style="border: 0; border-top: 1px dotted var(--accent); opacity: 0.3;">
                <p style="font-size: 0.7rem; opacity: 0.6;">TRAVEL TO THE [ OUTERWORLDS ] TO PRESENT YOUR OFFERINGS AT THE VOID PANTHEON.</p>
            </div>
            
            <button class="action-btn" onclick="this.parentElement.parentElement.remove()" style="width: 100%;">[ RETURN TO BRIDGE ]</button>
        </div>
    `;
    document.body.appendChild(modal);
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
// [ PATCHED ] Hides the Zoom Out button when in the Hangar (Level 5)
    if(!container) return; 
    container.innerHTML = ''; 
    
    // [ UPGRADED ] Dynamic Top-Left Navigation
    if(zoomBtn) {
        if (state.level === 1) {
            zoomBtn.style.visibility = 'visible';
            zoomBtn.innerText = '[ CARTOGRAPHY ]';
            zoomBtn.onclick = openSectorModal;
        } else if (state.level > 1 && state.level < 5) {
            zoomBtn.style.visibility = 'visible';
            zoomBtn.innerText = '[ ZOOM OUT ]';
            zoomBtn.onclick = zoomOut;
        } else {
            zoomBtn.style.visibility = 'hidden';
        }
    }

    const activeSector = state.sectors.find(s => s.id === state.sectorId);
    const currentAccent = activeSector ? activeSector.color : '#00e5ff';
    
    document.documentElement.style.setProperty('--accent', currentAccent); 
    document.documentElement.style.setProperty('--accent-glow', currentAccent + '99');
    
    if(bread) bread.innerText = `${activeSector ? activeSector.name : 'GALAXY'} ${state.horizon ? '> ' + state.horizon : ''}`;
    
        // [ UPGRADED ] Dynamic Global Navigation Bar
    if (footer && [1, 5, 6, 7].includes(state.level)) {
        footer.style.display = 'flex';
        footer.innerHTML = `
            <button class="zoom-btn" onclick="state.level = 1; render();" style="flex:1; border-color: var(--accent); color: var(--accent); opacity: ${state.level === 1 ? '1' : '0.5'};">[ MAP ]</button>
            <button class="zoom-btn" onclick="state.level = 5; render();" style="flex:1; border-color: var(--captured); color: var(--captured); opacity: ${state.level === 5 ? '1' : '0.5'};">[ HANGAR ]</button>
            <button class="zoom-btn" onclick="state.level = 6; render();" style="flex:1; border-color: #ff9900; color: #ff9900; opacity: ${state.level === 6 ? '1' : '0.5'};">[ NEXUS ]</button>
            <button class="zoom-btn" onclick="state.level = 7; render();" style="flex:1; border-color: #a200ff; color: #a200ff; opacity: ${state.level === 7 ? '1' : '0.5'};">[ OUTERWORLDS ]</button>
        `;
    }

    
    switch(state.level) {
        case 1: renderLevel1(container, footer); break;
        case 2: renderLevel2(container, footer, activeSector); break;
        case 3: renderLevel3(container, footer); break;
        case 4: renderLevel4(container, footer); break;
        case 5: renderHangar(container); break;
        case 6: renderNexus(container); break;
        case 7: renderOuterworlds(container); break;
    }

}

// --- GLOBAL MAIN NAVIGATION ---

function renderMainMenuFooter(footer) {
    if (!footer) return;
    footer.style.display = 'flex';
    footer.innerHTML = '';

    // The 4 Core Hubs
    const navs = [
        { id: 'SECTORS', level: 1, color: 'var(--accent)' },
        { id: 'HANGAR', level: 5, color: 'var(--captured)' },
        { id: 'OUTPOST', level: 6, color: '#ff9900' },
        { id: 'OUTERWORLDS', level: 7, color: '#a200ff' }
    ];

    navs.forEach(nav => {
        const isActive = state.level === nav.level;
        const btn = document.createElement('button');
        btn.className = `zoom-btn`;
        btn.innerText = `[ ${nav.id} ]`;
        
        // Base styling for all 4 buttons
        btn.style.flex = '1';
        btn.style.padding = '10px 0';
        btn.style.fontSize = '0.65rem';
        btn.style.borderColor = nav.color;
        btn.style.color = nav.color;
        btn.style.transition = 'all 0.3s';
        
        if (isActive) {
            // Active State: 100% Brightness, Glow, Unclickable
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'none';
            btn.style.background = `rgba(255, 255, 255, 0.05)`; // Slight tint
            btn.style.boxShadow = `0 0 15px ${nav.color}66, inset 0 0 10px ${nav.color}33`; 
        } else {
            // Inactive State: 30% Less Bright (0.7 opacity), Clickable
            btn.style.opacity = '0.7';
            btn.style.cursor = 'pointer';
            btn.onclick = () => { 
                if (nav.level === 6 || nav.level === 7) {
                    showSoftWarning(`[ ${nav.id} ] IS CURRENTLY UNDER CONSTRUCTION`);
                } else {
                    state.level = nav.level; 
                    render(); 
                }
            };
        }
        
        footer.appendChild(btn);
    });
}


// --- SECTOR MAP (L1) ---

function renderLevel1(container, footer) {

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

// --- MODULAR SHIP CONSTRUCTION ---

function drawModularShip(targetElement, parts) {
    // Fallback logic in case localStorage is holding onto an older 6-part save
    const p = parts || {};
    
    targetElement.innerHTML = `
        <svg viewBox="0 0 100 100" class="ship-hero-unit">
            ${renderShieldComponent(p.shields || 1)}
            ${renderCommsComponent(p.comms || 1)}
            ${renderSinksComponent(p.sinks || 1)}
            ${renderThrusterComponent(p.thrusters || 1)}
            ${renderHabitatComponent(p.habitat || 1)}
            ${renderHullComponent(p.hull || 1)}
            ${renderCellsComponent(p.cells || 1)}
            ${renderReactorComponent(p.reactor || 1)}
            ${renderSensorComponent(p.sensors || 1)}
            ${renderMagnetComponent(p.magnet || 1)}
        </svg>
    `;
}

// 1. Titanium Hull
function renderHullComponent(level) {
    const w = 15 + (level * 2);
    let path = `<path d="M50 15 L${50+w} 85 L50 70 L${50-w} 85 Z" fill="none" stroke="var(--accent)" stroke-width="2"/>`;
    if (level >= 3) path += `<path d="M40 40 L60 40 M35 60 L65 60" stroke="var(--accent)" stroke-width="1" opacity="0.5"/>`;
    if (level >= 5) path += `<path d="M50 15 L${50+w+5} 90 L50 75 L${50-w-5} 90 Z" fill="none" stroke="var(--accent)" stroke-width="0.5" stroke-dasharray="2,1"/>`;
    return path;
}

// 2. Chrono-Thrusters
function renderThrusterComponent(level) {
    let flares = `<path d="M42 75 L50 95 L58 75" fill="none" stroke="var(--thrust)" stroke-width="1.5" class="engine-flare"/>`;
    if (level >= 3) flares += `<path d="M30 70 L35 85 L40 70 M60 70 L65 85 L70 70" fill="none" stroke="var(--thrust)" stroke-width="1" class="engine-flare" style="animation-delay: 0.05s"/>`;
    if (level >= 5) flares += `<path d="M50 70 L50 100" stroke="var(--thrust)" stroke-width="3" opacity="0.4" class="engine-flare"/>`;
    return flares;
}

// 3. Reactor Core
function renderReactorComponent(level) {
    const size = 3 + level;
    return `<circle cx="50" cy="55" r="${size}" fill="none" stroke="var(--accent)" stroke-width="1.5" class="engine-glow">
        <animate attributeName="r" values="${size};${size+2};${size}" dur="2s" repeatCount="indefinite" />
    </circle>`;
}

// 4. Aegis Shields
function renderShieldComponent(level) {
    if (level < 2) return '';
    const opacity = Math.min(0.1 + (level * 0.05), 0.4);
    return `<circle cx="50" cy="50" r="45" fill="var(--accent)" fill-opacity="${opacity}" stroke="var(--accent)" stroke-width="0.5" stroke-dasharray="4,2" opacity="0.6"/>`;
}

// 5. Omni-Sensors
function renderSensorComponent(level) {
    if (level < 2) return '';
    let sensors = `<path d="M30 40 L20 30 M70 40 L80 30" stroke="var(--accent)" stroke-width="1"/>`;
    if (level >= 4) sensors += `<circle cx="20" cy="30" r="2" fill="var(--accent)"/><circle cx="80" cy="30" r="2" fill="var(--accent)"/>`;
    return sensors;
}

// 6. Scrap-Magnet
function renderMagnetComponent(level) {
    if (level < 2) return '';
    return `<path d="M40 85 Q50 100 60 85" fill="none" stroke="var(--captured)" stroke-width="${level}" opacity="0.5" stroke-linecap="round"/>`;
}

// 7. Cryo-Habitat (NEW)
function renderHabitatComponent(level) {
    if (level < 2) return '';
    let hab = `<rect x="35" y="45" width="30" height="10" rx="2" fill="none" stroke="var(--accent)" stroke-width="1" opacity="0.8"/>`;
    if (level >= 3) hab += `<circle cx="40" cy="50" r="2" fill="var(--captured)"/><circle cx="60" cy="50" r="2" fill="var(--captured)"/>`;
    if (level >= 5) hab += `<path d="M25 50 A 25 25 0 0 1 75 50" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="2,4"/>`;
    return hab;
}

// 8. Quantum Comm-Array (NEW)
function renderCommsComponent(level) {
    if (level < 2) return '';
    let comms = `<line x1="50" y1="15" x2="50" y2="5" stroke="var(--accent)" stroke-width="1.5"/>`;
    if (level >= 3) comms += `<line x1="45" y1="10" x2="55" y2="10" stroke="var(--accent)" stroke-width="1"/><circle cx="50" cy="5" r="1.5" fill="var(--captured)"/>`;
    if (level >= 5) comms += `<path d="M40 5 Q50 -5 60 5" fill="none" stroke="var(--accent)" stroke-width="0.5" opacity="0.6"/>`;
    return comms;
}

// 9. Thermal Sink Array (NEW)
function renderSinksComponent(level) {
    if (level < 2) return '';
    let sinks = `<path d="M35 65 L25 60 M65 65 L75 60" stroke="var(--accent)" stroke-width="1" opacity="0.6"/>`;
    if (level >= 3) sinks += `<path d="M35 70 L20 65 M65 70 L80 65" stroke="var(--accent)" stroke-width="1" opacity="0.8"/>`;
    if (level >= 5) sinks += `<path d="M35 75 L15 70 M65 75 L85 70" stroke="var(--thrust)" stroke-width="1" opacity="0.7"/>`;
    return sinks;
}

// 10. Dark-Matter Cells (NEW)
function renderCellsComponent(level) {
    if (level < 2) return '';
    let cells = `<circle cx="45" cy="65" r="2" fill="var(--captured)" opacity="0.5"/><circle cx="55" cy="65" r="2" fill="var(--captured)" opacity="0.5"/>`;
    if (level >= 3) cells = `<circle cx="45" cy="65" r="3" fill="var(--captured)" opacity="0.8"/><circle cx="55" cy="65" r="3" fill="var(--captured)" opacity="0.8"/>`;
    if (level >= 5) cells += `<circle cx="40" cy="72" r="2.5" fill="var(--captured)"/><circle cx="60" cy="72" r="2.5" fill="var(--captured)"/>`;
    return cells;
}

// --- SHIPYARD HANGAR UI ---

// --- SHIPYARD HANGAR UI ---

function renderHangar(container) {
    container.innerHTML = `
        <div class="target-lock warp-transition" style="justify-content: flex-start; padding-top: 20px; position: relative;">
            
            <button class="subtask-remove-minimal" style="position: absolute; top: 10px; right: 10px; font-size: 1.5rem; color: var(--accent); text-shadow: 0 0 10px var(--accent-glow);" onclick="state.level = 1; render();">×</button>
            
            <div class="view-level-title" style="margin-top:0;">DRY DOCK // SHIPYARD</div>
            
            <h1 class="view-main-title" onclick="state.scrap += 500; save(); render();" style="cursor: pointer;" title="Click for Test Scrap">Hangar Bay</h1>
            
            <div class="ship-view-stage" style="height: 160px; margin-bottom: 15px;">
                <div id="hangar-ship-preview"></div>
            </div>

            <div class="terminal-console" style="width: 95%; max-width: 500px; padding: 15px 10px; overflow: hidden;">
                <div style="display:flex; justify-content:space-between; font-size:0.5rem; opacity:0.5; margin-bottom:12px; padding: 0 5px;">
                    <span>MODULAR_FRIGATE_ASSEMBLY</span>
                    <span style="color: var(--captured); opacity: 1; font-weight: bold; font-size: 0.6rem;">SCRAP: ${state.scrap}</span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">
                ${Object.keys(state.shipParts).map(part => {
                    const level = state.shipParts[part];
                    const cost = level * 15;
                    return `
                        <div class="system-node" onclick="upgradeShipPart('${part}')" style="margin:0; padding: 10px 2px; flex-direction:column; gap:6px; text-align:center; border-radius:4px; height: 100%; box-sizing: border-box;">
                            <div style="font-size:0.45rem; font-weight:bold; color:var(--accent); letter-spacing:1px; width:100%; overflow:hidden; text-overflow:ellipsis;">${part.toUpperCase()}</div>
                            <div style="font-size:0.65rem; font-family: monospace;">L${level}</div>
                            <div style="font-size:0.45rem; opacity:0.6;">${cost} SCR</div>
                            <div style="margin-top:auto; width:80%; background:var(--accent); color:var(--bg); font-weight:bold; font-size:0.6rem; padding:4px 0; border-radius:2px; box-shadow: 0 0 5px var(--accent-glow);">+</div>
                        </div>
                    `;
                }).join('')}
                </div>
            </div>
        </div>
    `;
    
    const preview = document.getElementById('hangar-ship-preview');
    if (preview) drawModularShip(preview, state.shipParts);
}

// --- INTERNAL HUB (L6) ---
function renderNexus(container) {
    container.innerHTML = `
        <div class="target-lock warp-transition" style="justify-content: flex-start; padding-top: 20px; position: relative;">
            <button class="subtask-remove-minimal" style="position: absolute; top: 10px; right: 10px; font-size: 1.5rem; color: #ff9900; text-shadow: 0 0 10px rgba(255, 153, 0, 0.5);" onclick="state.level = 1; render();">×</button>
            <div class="view-level-title" style="margin-top:0; color: #ff9900; text-shadow: 0 0 8px rgba(255, 153, 0, 0.5);">INTERNAL HUB // QUARTERS</div>
            <h1 class="view-main-title">The Nexus</h1>
            
            <div class="terminal-console" style="width: 95%; max-width: 500px; padding: 30px 10px; text-align: center; border-color: #ff9900; box-shadow: inset 0 0 15px rgba(255, 153, 0, 0.05);">
                <div style="color: #ff9900; font-weight: bold; margin-bottom: 15px; letter-spacing: 2px;">[ FACILITY UNDER CONSTRUCTION ]</div>
                <div style="font-size: 0.7rem; opacity: 0.7; line-height: 1.5;">The Cryo-Chamber, Comm Array, and Archives will be installed here in a future update.</div>
            </div>
        </div>
    `;
}

// --- EXTERNAL HUB (L7) ---
function renderOuterworlds(container) {
    container.innerHTML = `
        <div class="target-lock warp-transition" style="justify-content: flex-start; padding-top: 20px; position: relative;">
            <button class="subtask-remove-minimal" style="position: absolute; top: 10px; right: 10px; font-size: 1.5rem; color: #a200ff;" onclick="state.level = 1; render();">×</button>
            <div class="view-level-title" style="color: #a200ff;">EXTERNAL HUB // THE FRINGE</div>
            <h1 class="view-main-title">The Outerworlds</h1>
            
    <div class="terminal-console" style="width: 90%; margin-bottom: 15px; border-color: #a200ff; cursor: pointer;" onclick="renderVoidPantheon()">
    <div style="color: #a200ff; font-weight: bold; letter-spacing: 3px;">[ THE VOID PANTHEON ]</div>
    <div style="font-size: 0.6rem; opacity: 0.7;">ENTER THE SACRED VOID</div>
</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 90%;">
                <div class="terminal-console" style="opacity: 0.5; border-color: #777;">[ BLACK MARKET ]</div>
                <div class="terminal-console" style="opacity: 0.5; border-color: #777;">[ THE FORGE ]</div>
            </div>
        </div>
    `;
}

function renderVoidPantheon() {
    const container = document.getElementById('view-container');
    
    // [ UPGRADED ] Volumetric Aurora Borealis & Fog Physics
    const atmosStyles = `
        <style>
            @keyframes aurora-wave {
                0% { transform: rotate(-5deg) scaleY(1) translateY(0); opacity: 0.4; }
                50% { transform: rotate(2deg) scaleY(1.3) translateY(-30px); opacity: 0.8; }
                100% { transform: rotate(-2deg) scaleY(0.9) translateY(10px); opacity: 0.3; }
            }
            @keyframes dark-gas-drift {
                0% { transform: translateX(-10%) translateY(0) scale(1); }
                100% { transform: translateX(10%) translateY(-5%) scale(1.2); }
            }
            @keyframes star-pierce {
                0% { opacity: 0.5; filter: brightness(1); transform: scale(0.9); }
                100% { opacity: 1; filter: brightness(1.5); transform: scale(1.1); box-shadow: 0 0 20px #fff; }
            }

            /* 1. THE FOG TANK (Extreme Blur melts shapes into fluid gas) */
            .gas-tank {
                position: absolute;
                top: -15%; left: -20%; width: 140%; height: 75%;
                z-index: 0;
                pointer-events: none;
                overflow: hidden;
                filter: blur(40px); /* This is the magic that creates fluid gas */
            }

            /* 2. THE DEEP FOG (Ambient dark matter) */
            .fog-base {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(ellipse at center, rgba(15, 5, 25, 0.95) 0%, transparent 80%);
            }

            /* 3. AURORA RIBBONS (Squashed ellipses acting as glowing gas arcs) */
            .aurora-ribbon {
                position: absolute;
                border-radius: 50%;
                mix-blend-mode: screen;
            }
            .aurora-1 {
                top: 15%; left: 5%; width: 130%; height: 25%;
                background: radial-gradient(ellipse at center, rgba(0, 212, 255, 0.7) 0%, transparent 70%);
                animation: aurora-wave 14s infinite alternate ease-in-out;
            }
            .aurora-2 {
                top: 25%; left: -10%; width: 150%; height: 20%;
                background: radial-gradient(ellipse at center, rgba(162, 0, 255, 0.6) 0%, transparent 70%);
                animation: aurora-wave 18s infinite alternate-reverse ease-in-out;
            }
            .aurora-3 {
                top: 10%; left: 20%; width: 110%; height: 30%;
                background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.5) 0%, transparent 70%);
                animation: aurora-wave 22s infinite alternate ease-in-out;
            }

            /* 4. OCCLUSION CLOUDS (Pitch black gas drifting in front of the aurora to create depth) */
            .dark-gas {
                position: absolute;
                border-radius: 50%;
                background: #000;
                mix-blend-mode: multiply;
                opacity: 0.85;
            }
            .dg-1 { top: 10%; left: 15%; width: 40%; height: 50%; animation: dark-gas-drift 25s infinite alternate ease-in-out; }
            .dg-2 { top: 25%; left: 55%; width: 50%; height: 40%; animation: dark-gas-drift 30s infinite alternate-reverse ease-in-out; }

            /* 5. STAR HALOS (Diffused glows burning inside the heavy fog) */
            .star-halo {
                position: absolute;
                border-radius: 50%;
                mix-blend-mode: color-dodge;
            }
            .halo-1 { top: 35%; left: 25%; width: 20%; height: 25%; background: radial-gradient(circle, rgba(0, 212, 255, 0.9) 0%, transparent 50%); animation: star-pierce 4s infinite alternate; }
            .halo-2 { top: 40%; left: 50%; width: 25%; height: 30%; background: radial-gradient(circle, rgba(162, 0, 255, 0.9) 0%, transparent 50%); animation: star-pierce 5s infinite alternate-reverse; }
            .halo-3 { top: 30%; left: 75%; width: 20%; height: 25%; background: radial-gradient(circle, rgba(255, 215, 0, 0.9) 0%, transparent 50%); animation: star-pierce 6s infinite alternate; }
            
            /* 6. SHARP STARS (Tiny, unblurred 5% pinpricks sitting outside the fog tank) */
            .sharp-stars-container {
                position: absolute;
                top: -5%; left: 0; width: 100%; height: 60%;
                z-index: 1;
                pointer-events: none;
                overflow: hidden;
            }
            .tiny-star {
                position: absolute;
                background: #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 15px #fff, 0 0 30px #fff;
                animation: star-pierce 3s infinite alternate;
                transform: translate(-50%, -50%);
            }
            .ts-1 { top: 38%; left: 25%; width: 4px; height: 4px; }
            .ts-2 { top: 43%; left: 50%; width: 6px; height: 6px; animation-delay: 1s; }
            .ts-3 { top: 33%; left: 75%; width: 4px; height: 4px; animation-delay: 2s; }
            
            /* TOWER ARCHITECTURE */
            .monolith-spire {
                flex: 1;
                position: relative;
                border-style: solid;
                border-width: 1px 1px 0 1px;
                border-image: linear-gradient(to bottom, rgba(255,255,255,0.02) 5%, rgba(255,255,255,0.1) 30%, var(--t-color) 80%, var(--t-color) 100%) 1;
                background: linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.5) 70%, transparent 100%);
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                padding-bottom: 20px;
                transition: filter 0.3s;
                z-index: 10;
            }
            .monolith-spire:hover {
                filter: brightness(1.3) drop-shadow(0 0 10px var(--t-color));
            }
            .apex-icon {
                position: absolute;
                top: 10%; left: 50%; transform: translateX(-50%);
                font-size: 2.2rem; color: #fff;
                text-shadow: 0 0 10px #fff, 0 0 30px var(--t-color), 0 0 60px var(--t-color);
                z-index: 10; pointer-events: none;
            }
            .spire-text {
                color: var(--t-color); writing-mode: vertical-rl; transform: rotate(180deg);
                letter-spacing: 4px; font-weight: bold; font-size: 0.85rem;
                text-shadow: 0 0 15px var(--t-color); z-index: 10; pointer-events: none;
                margin-bottom: 15px;
            }
        </style>
    `;

    container.innerHTML = atmosStyles + `
        <div class="target-lock warp-transition" style="justify-content: flex-start; padding: 20px 0; background: #010003; height: 100%; display: flex; flex-direction: column; position: relative;">
            
            <div class="gas-tank">
                <div class="fog-base"></div>
                
                <div class="aurora-ribbon aurora-1"></div>
                <div class="aurora-ribbon aurora-2"></div>
                <div class="aurora-ribbon aurora-3"></div>
                
                <div class="dark-gas dg-1"></div>
                <div class="dark-gas dg-2"></div>

                <div class="star-halo halo-1"></div>
                <div class="star-halo halo-2"></div>
                <div class="star-halo halo-3"></div>
            </div>

            <div class="sharp-stars-container">
                <div class="tiny-star ts-1"></div>
                <div class="tiny-star ts-2"></div>
                <div class="tiny-star ts-3"></div>
            </div>

            <button class="subtask-remove-minimal" style="position: absolute; top: 10px; right: 20px; font-size: 2rem; color: #a200ff; z-index: 20;" onclick="state.level = 7; render();">×</button>

            <div class="view-level-title" style="color: #a200ff; letter-spacing: 5px; margin-bottom: 5px; z-index: 20;">THE VOID PANTHEON</div>
            <div style="color: #fff; font-size: 0.8rem; margin-bottom: 30px; opacity: 0.6; display: flex; align-items: center; justify-content: center; gap: 10px; z-index: 20;">
                OFFERINGS REMAINING: <span style="color: #a200ff; font-weight: bold; font-size: 1rem;">${state.offerings}</span>
                <button onclick="state.offerings += 5; save(); renderVoidPantheon();" style="background: rgba(162, 0, 255, 0.2); border: 1px solid #a200ff; color: #a200ff; font-size: 0.5rem; padding: 2px 6px; cursor: pointer; border-radius: 2px;">[+5 DEV]</button>
            </div>

            <div style="display: flex; flex: 1; width: 90%; margin: 0 auto; gap: 10px; align-items: stretch; padding-bottom: 40px; z-index: 10;">
                
                <div onclick="renderAscensionTower(1)" class="monolith-spire" style="--t-color: #00d4ff;">
                    <div class="apex-icon">◬</div>
                    <div class="spire-text">THE GENESIS SPHERE</div>
                </div>
                
                <div onclick="renderAscensionTower(2)" class="monolith-spire" style="--t-color: #a200ff;">
                    <div class="apex-icon">◬</div>
                    <div class="spire-text">THE ABYSSAL SYNDICATE</div>
                </div>
                
                <div onclick="renderAscensionTower(3)" class="monolith-spire" style="--t-color: #ffd700;">
                    <div class="apex-icon">◬</div>
                    <div class="spire-text">CELESTIAL VANGUARD</div>
                </div>

            </div>
        </div>
    `;
}


// [ UPGRADED ] The Void Pantheon Lore Dictionary
const PANTHEON_DATA = {
    1: { 
        name: "THE GENESIS SPHERE", color: "#00d4ff", 
        deities: [
            {k:'kaelenTor', n:'Kaelen-Tor', title: 'The Star-Forge', 
             minor: "CELESTIAL MAGNETISM: Increases base Scrap and Energy yields by +2% per Offering.", 
             major: "THE MIDAS DRIVE: Securing a Level 4 Target converts 10% of your total lifetime Energy into a massive, one-time Scrap payout." },
            {k:'aethelgard', n:'Aethelgard', title: 'The Weaver of Eons', 
             minor: "TEMPORAL VELOCITY: Grants +5% bonus Scrap for targets secured before their 24h warning per Offering.", 
             major: "CHRONOS SHIFT: Once per week, instantly advance your Pilot Level by 1 without filling the Capacitor." },
            {k:'valerium', n:'Valerium', title: 'The Aegis Warden', 
             minor: "AEGIS PLATING: Reduces the Energy penalty of Overdue tasks by 1 point per Offering.", 
             major: "WARDEN'S GRACE: Automatically generates a Sub-Routine Shield on Decaying tasks, restoring lost penalty Energy upon first action." }
        ] 
    },
    2: { 
        name: "THE ABYSSAL SYNDICATE", color: "#a200ff", 
        deities: [
            {k:'syraxis', n:'Syraxis', title: 'The Shadow-Walker', 
             minor: "UNDERWORLD CONNECTIONS: Black Market exchange rates improve by 4% per Offering.", 
             major: "THE SMUGGLER'S TOLL: Hires a permanent, phantom-operative that slowly generates a drip-feed of Scrap while offline." },
            {k:'ignisKor', n:'Ignis-Kor', title: 'The Reality Shaper', 
             minor: "EXTENDED VOLATILITY: Temporary Forge buffs last 1 hour longer per Offering.", 
             major: "QUANTUM LOOP: 33% chance the universe loops when crafting, refunding the entire Scrap cost immediately." },
            {k:'morvath', n:'Morvath', title: 'The Void Hunter', 
             minor: "BLOOD MONEY: Daily Bounty payouts increased by +5% per Offering.", 
             major: "THE APEX CONTRACT: Completing a Daily Bounty guarantees an 'Obliteration Token' to wipe one Critical task without penalty." }
        ] 
    },
    3: { 
        name: "THE CELESTIAL VANGUARD", color: "#ffd700", 
        deities: [
            {k:'ragnarath', n:'Ragnarath', title: 'The Dread-Caller', 
             minor: "KINETIC PIERCING: Increases kinetic damage to Boss Target shields per Offering.", 
             major: "THE ORBITAL STRIKE: Once a week, instantly obliterate a Boss Target without completing its sub-routines." },
            {k:'luminara', n:'Luminara', title: 'The Cosmic Veil', 
             minor: "ION RESISTANCE: Reduces Energy drain from hostile Encounters per Offering.", 
             major: "THE VEIL OF LIGHT: Taking damage from an Encounter has a 33% chance to be absorbed and converted into Bonus Energy." },
            {k:'xerxes', n:'Xerxes', title: 'The Harvester of Suns', 
             minor: "ANOMALY DETECTION: Rare encounters spawn more frequently per Offering.", 
             major: "THE SUN-EATER: Fully clearing a Sector permanently boosts that Sector's baseline rewards by 25%." }
        ] 
    }
};

function renderAscensionTower(towerId) {
    const data = PANTHEON_DATA[towerId];
    const container = document.getElementById('view-container');
    
    // Check if all 3 deities in this tower are maxed (Level 5)
    const isAscended = data.deities.every(d => state.pantheon[d.k] >= 5);

    let html = `
        <div class="target-lock warp-transition" style="justify-content: flex-start; padding: 20px 0; background: radial-gradient(circle at center, #0a0015 0%, #000 100%); overflow-y: auto;">
            <button class="subtask-remove-minimal" style="position: fixed; top: 10px; right: 20px; font-size: 2rem; color: ${data.color}; z-index: 100;" onclick="renderVoidPantheon()">×</button>
            <div class="view-level-title" style="color: ${data.color}; letter-spacing: 5px; margin-bottom: 20px;">${data.name}</div>
            
            <div style="color: #fff; font-size: 0.8rem; margin-bottom: 20px; opacity: 0.6; display: flex; gap: 10px; align-items: center; justify-content: center;">
                OFFERINGS: <span style="color: ${data.color}; font-weight: bold;">${state.offerings}</span>
                <button onclick="state.offerings += 5; save(); renderAscensionTower(${towerId});" style="background: transparent; border: 1px solid ${data.color}; color: ${data.color}; font-size: 0.5rem; padding: 2px 6px; cursor: pointer;">[+5 DEV]</button>
            </div>
    `;

    // THE ASCENSION APEX (Top Node)
    html += `
        <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 30px; position: relative; z-index: 10;">
            <div style="width: 50px; height: 50px; border: 2px solid ${data.color}; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; background: ${isAscended ? data.color : 'rgba(0,0,0,0.8)'}; box-shadow: 0 0 20px ${isAscended ? data.color : 'transparent'};">
                <div style="transform: rotate(-45deg); font-size: 1.2rem; color: ${isAscended ? '#000' : data.color}; text-shadow: none;">◬</div>
            </div>
            <div style="font-size: 0.6rem; color: ${data.color}; margin-top: 15px; letter-spacing: 2px; font-weight: bold; background: #000; padding: 2px 5px;">ASCENSION APEX</div>
        </div>
    `;

    // THE 3 BRANCHING TRACKS
    html += `<div style="display: flex; justify-content: space-around; width: 95%; margin: 0 auto; position: relative;">`;
    
    // Background connecting lines
    html += `
        <svg style="position: absolute; top: -65px; left: 0; width: 100%; height: calc(100% + 65px); pointer-events: none; z-index: 0;">
            <line x1="50%" y1="25" x2="16.6%" y2="80" stroke="${data.color}" stroke-width="1" opacity="0.3" stroke-dasharray="4 4" />
            <line x1="50%" y1="25" x2="50%" y2="80" stroke="${data.color}" stroke-width="1" opacity="0.3" stroke-dasharray="4 4" />
            <line x1="50%" y1="25" x2="83.3%" y2="80" stroke="${data.color}" stroke-width="1" opacity="0.3" stroke-dasharray="4 4" />
        </svg>
    `;

    // Render each Deity's path
    data.deities.forEach(d => {
        const level = state.pantheon[d.k];
        const isKeystoneUnlocked = level >= 5;
        
        html += `<div style="display: flex; flex-direction: column; align-items: center; width: 30%; z-index: 1;">`;
        
        // 1. The Keystone Node (Fully assembled with click logic)
        html += `
            <div onclick="openOfferingModal('${d.k}', ${towerId}, 6, false)" style="width: 35px; height: 35px; border: 2px solid ${data.color}; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: ${isKeystoneUnlocked ? data.color : '#000'}; box-shadow: 0 0 10px ${isKeystoneUnlocked ? data.color : 'transparent'}; margin-bottom: 5px; cursor: pointer;">
                <span style="color: ${isKeystoneUnlocked ? '#000' : data.color}; font-size: 1rem;">◈</span>
            </div>
            <div style="font-size: 0.55rem; color: ${data.color}; margin-bottom: 15px; font-weight: bold; text-align: center; height: 15px;">${d.n.toUpperCase()}</div>
        `;

        // 2. The 5 Minor Nodes (Fully assembled with click logic)
        html += `<div style="display: flex; flex-direction: column-reverse; gap: 15px; align-items: center; position: relative; padding-bottom: 20px;">`;
        
        // Vertical track line connecting the nodes
        html += `<div style="position: absolute; width: 2px; height: 100%; background: ${data.color}; opacity: 0.2; z-index: -1;"></div>`;

        for(let i = 1; i <= 5; i++) {
            const isActive = level >= i;
            const isNext = level === (i - 1);
            
            let bg = isActive ? data.color : '#000';
            let cursor = (isActive || isNext) ? 'cursor: pointer;' : 'cursor: default;';
            let pulse = (isNext && state.offerings > 0) ? `animation: pulse-glow 1.5s infinite; box-shadow: 0 0 10px ${data.color};` : '';
            let opacity = (isActive || isNext) ? '1' : '0.3';
            
            let clickAction = (isActive || isNext) ? `openOfferingModal('${d.k}', ${towerId}, ${i}, ${isNext})` : '';
            
            html += `
                <div onclick="${clickAction}" 
                     style="width: 16px; height: 16px; border-radius: 50%; border: 2px solid ${data.color}; background: ${bg}; ${cursor} ${pulse} opacity: ${opacity}; display: flex; align-items: center; justify-content: center; z-index: 1; transition: all 0.3s;">
                </div>
            `;
        }
        
        html += `</div>`; // Close node column
        html += `</div>`; // Close deity track
    });

    html += `</div>`; // Close the 3-track flex container
    html += `</div>`; // Close main container
    
    container.innerHTML = html;
}



function openOfferingModal(deityKey, towerId, nodeIndex, isNext) {
    const tower = PANTHEON_DATA[towerId];
    const deity = tower.deities.find(d => d.k === deityKey);
    const isKeystone = nodeIndex === 6; 
    
    const title = isKeystone ? "MAJOR KEYSTONE" : `MINOR STAR // NODE 0${nodeIndex}`;
    const buffDesc = isKeystone ? deity.major : deity.minor;
    
    let actionsHtml = '';
    
    if (isNext && state.offerings > 0) {
        // Ready to level up
        actionsHtml = `
            <div style="margin-top: 20px; font-size: 0.65rem; color: #fff; opacity: 0.8; text-align: center; letter-spacing: 1px;">THE VOID DEMANDS TRIBUTE. DO YOU PROCEED?</div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="mod-btn" style="flex: 1; border-color: #555; color: #888; letter-spacing: 2px;" onclick="this.closest('.modal-overlay').remove()">[ RENOUNCE ]</button>
                <button class="success-btn" style="flex: 1; background: ${tower.color}; color: #000; box-shadow: 0 0 15px ${tower.color}; font-weight: bold; letter-spacing: 2px;" onclick="this.closest('.modal-overlay').remove(); investOffering('${deityKey}', ${towerId});">[ SACRIFICE ]</button>
            </div>
        `;
    } else if (isNext && state.offerings <= 0) {
        // Broke
        actionsHtml = `
            <div style="margin-top: 20px; font-size: 0.65rem; color: var(--thrust); text-align: center; letter-spacing: 1px; text-shadow: 0 0 10px var(--thrust-glow);">INSUFFICIENT OFFERINGS. THE VOID REMAINS SILENT.</div>
            <div style="margin-top: 15px; text-align: center;">
                <button class="mod-btn" style="width: 100%; border-color: #555; color: #888;" onclick="this.closest('.modal-overlay').remove()">[ WITHDRAW ]</button>
            </div>
        `;
    } else {
        // Just reading unlocked lore
         actionsHtml = `
            <div style="margin-top: 20px; text-align: center;">
                <button class="mod-btn" style="width: 100%; border-color: ${tower.color}; color: ${tower.color};" onclick="this.closest('.modal-overlay').remove()">[ CLOSE COMMUNION ]</button>
            </div>
        `;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay warp-transition';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="border: 1px solid ${tower.color}; background: rgba(0,0,5,0.95); padding: 25px; width: 90%; max-width: 380px; box-shadow: 0 0 40px rgba(0,0,0,0.8), inset 0 0 20px ${tower.color}22; border-radius: 4px; display: flex; flex-direction: column;">
            <div class="view-level-title" style="color: ${tower.color}; text-shadow: 0 0 10px ${tower.color}; margin-top: 0;">${deity.n.toUpperCase()} // ${deity.title.toUpperCase()}</div>
            <h2 class="view-main-title" style="margin-bottom: 15px; font-size: 1.1rem;">${title}</h2>
            
            <div class="terminal-console" style="text-align: left; margin: 0; padding: 15px; border-color: ${tower.color}; background: rgba(0,0,0,0.6); box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                <p style="font-size: 0.75rem; line-height: 1.6; color: #e0e0e0; margin: 0;">${buffDesc}</p>
            </div>
            
            ${actionsHtml}
        </div>
    `;
    document.body.appendChild(modal);
}
