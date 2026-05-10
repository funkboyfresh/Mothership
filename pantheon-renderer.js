/**
 * PANTHEON-RENDERER.JS
 * Master visual controller for the Void Pantheon and Ascension Monoliths.
 */

function renderVoidPantheon() {
    window.isViewingPantheon = true; // Global UI Lock

    const container = document.getElementById('view-container');
    const navBar = document.getElementById('nav-bar');
    if(navBar) navBar.style.display = 'none';

    let bgStars = '', midStars = '', fgStars = '';
    for(let i = 0; i < 200; i++) {
        const getStar = (scale) => {
            let size = (Math.random() * 2 * scale) + 'px';
            let left = Math.random() * 100 + '%';
            let verticalBias = Math.pow(Math.random(), 0.45); 
            let top = verticalBias * 100 + '%';
            let dynamicOpacity = 0.2 + (verticalBias * 0.8); 
            let dur = (Math.random() * 5 + 3) + 's';
            let del = '-' + (Math.random() * 10) + 's'; 
            return `<div class="void-particle" style="width:${size}; height:${size}; left:${left}; top:${top}; opacity:${dynamicOpacity}; animation-duration:${dur}; animation-delay:${del}; animation-iteration-count: infinite; transform: translateZ(0); will-change: opacity, transform;"></div>`;
        };
        bgStars += getStar(0.7); midStars += getStar(1.1); fgStars += getStar(1.6); 
    }

    const atmosStyles = `
        <style>
            @keyframes fog-breathe { 0% { opacity: 0.6; transform: scale(1) translateY(0); } 50% { opacity: 0.9; transform: scale(1.05) translateY(-2%); } 100% { opacity: 0.6; transform: scale(1) translateY(0); } }
            @keyframes slow-drift { 0% { transform: translateX(-5%); } 100% { transform: translateX(5%); } }
            .pantheon-starfield-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; }
            .bg-stellar-nursery { position: absolute; top: -20%; left: -10%; width: 120%; height: 110%; background: radial-gradient(ellipse at 50% 30%, rgba(50, 10, 80, 0.5) 0%, transparent 70%), radial-gradient(ellipse at 20% 40%, rgba(10, 50, 80, 0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 40%, rgba(80, 50, 10, 0.4) 0%, transparent 60%); filter: blur(30px); z-index: 1; animation: fog-breathe 23s infinite alternate ease-in-out; transform: translateZ(0); will-change: transform, opacity; }
            .fg-stellar-nursery { position: absolute; top: -25%; left: -10%; width: 120%; height: 115%; opacity: 0.9; background: radial-gradient(circle at 17% 35%, rgba(0,212,255,0.55) 0%, rgba(0,212,255,0.15) 40%, transparent 60%), radial-gradient(circle at 50% 30%, rgba(255,215,0,0.75) 0%, rgba(255,215,0,0.25) 40%, transparent 65%), radial-gradient(circle at 83% 35%, rgba(255,0,255,0.7) 0%, rgba(255,0,255,0.2) 40%, transparent 60%), radial-gradient(circle at 33% 35%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(circle at 67% 35%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(circle at 50% 40%, rgba(255,255,255,0.35) 0%, transparent 60%), radial-gradient(circle at 33% 35%, rgba(0,0,0,0.8) 0%, transparent 45%), radial-gradient(circle at 67% 35%, rgba(0,0,0,0.8) 0%, transparent 45%), radial-gradient(circle at 50% 15%, rgba(0,0,0,0.85) 0%, transparent 55%); filter: blur(30px); mix-blend-mode: hard-light; z-index: 15; pointer-events: none; animation: slow-drift 34s infinite alternate ease-in-out; -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.15) 85%, transparent 100%); mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.15) 85%, transparent 100%); transform: translateZ(0); will-change: transform; }
            .zenith-apex-void { position: absolute; top: 26%; left: 50%; transform: translate(-50%, -125%); font-size: 8rem; color: #000; z-index: 16; pointer-events: none; text-shadow: 0 0 30px rgba(255,255,255,0.1); }
            .tower-wrapper { flex: 1; position: relative; cursor: pointer; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
            .monolith-spire { position: absolute; bottom: -5vh; left: 0; width: 100%; height: calc(82% + 5vh); border-style: solid; border-width: 0 1px 0 1px; border-image: linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, var(--t-color) 15%, #000 80%) 1; background: linear-gradient(to bottom, var(--t-color) 0%, #000000 70%); box-shadow: 0 0 25px -5px var(--t-color); transition: filter 0.3s; z-index: 5; -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%); mask-image: linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%); }
            .tower-wrapper:hover .monolith-spire { filter: brightness(1.3) drop-shadow(0 0 10px var(--t-color)); }
            .tower-content { position: relative; z-index: 20; padding-bottom: 10px; display: flex; flex-direction: column; align-items: center; pointer-events: none; transform: translateY(5vh); }
            .spire-text { height: 380px; display: flex; align-items: flex-end; color: var(--t-color); writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 4px; font-weight: bold; font-size: 1.1rem; text-shadow: 0 0 15px var(--t-color); white-space: nowrap; }
            .tower-icon-wrapper { height: 80px; display: flex; align-items: center; justify-content: center; margin-top: 15px; }
            .tower-icon { color: #fff; text-shadow: 0 0 10px #fff, 0 0 30px var(--t-color), 0 0 60px var(--t-color); }
        </style>
    `;

    container.innerHTML = atmosStyles + `
        <div class="target-lock warp-transition" style="justify-content: flex-start; padding: 0; background: #010003; height: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden;">
            <div class="pantheon-starfield-container" style="z-index: 0; opacity: 0.6;">${bgStars}</div>
            <div class="bg-stellar-nursery"></div>
            <div class="zenith-apex-void">◬</div>
            <div style="display: flex; flex: 1; width: 90%; margin: 0 auto; gap: 10px; align-items: stretch; padding-bottom: 80px;">
                <div class="tower-wrapper" onclick="renderAscensionTower(1)" style="--t-color: #00d4ff;"><div class="monolith-spire"></div><div class="tower-content"><div class="spire-text">GENESIS SPHERE</div><div class="tower-icon-wrapper"><div class="tower-icon" style="font-size: 3rem;">۞</div></div></div></div>
                <div class="tower-wrapper" onclick="renderAscensionTower(2)" style="--t-color: #ffd700;"><div class="monolith-spire"></div><div class="tower-content"><div class="spire-text">ABYSSAL SYNDICATE</div><div class="tower-icon-wrapper"><div class="tower-icon" style="font-size: 4.2rem;">⎊</div></div></div></div>
                <div class="tower-wrapper" onclick="renderAscensionTower(3)" style="--t-color: #ff00ff;"><div class="monolith-spire"></div><div class="tower-content"><div class="spire-text">CELESTIAL VANGUARD</div><div class="tower-icon-wrapper"><div class="tower-icon" style="font-size: 3rem;">❖</div></div></div></div>
            </div>
            <div class="pantheon-starfield-container" style="z-index: 10; opacity: 0.8;">${midStars}</div>
            <div class="fg-stellar-nursery"></div>
            <div class="pantheon-starfield-container" style="z-index: 22;">${fgStars}</div>
            
            <div style="position: absolute; bottom: 20px; width: 100%; color: #fff; font-size: 0.8rem; opacity: 0.6; display: flex; align-items: center; justify-content: center; gap: 10px; z-index: 25; pointer-events: auto;">
                OFFERINGS REMAINING: <span style="color: #fff; font-weight: bold; font-size: 1rem;">${state.offerings}</span>
                <button onclick="state.offerings += 500; save(); renderVoidPantheon();" style="background: rgba(255, 255, 255, 0.2); border: 1px solid #fff; color: #fff; font-size: 0.5rem; padding: 2px 6px; cursor: pointer; border-radius: 2px;">[+500 DEV]</button>
            </div>
        </div>
    `;
}

function renderAscensionTower(towerId) {
    const data = PANTHEON_DATA[towerId];
    const container = document.getElementById('view-container');
    
    let zenithSize = '8rem';
    if (towerId === 1) zenithSize = '5.4rem'; 
    if (towerId === 3) zenithSize = '5.8rem'; 

    let zenithTop = '33%'; 
    if (towerId === 2) zenithTop = '38%'; 
    if (towerId === 3) zenithTop = '35%'; 

    const checkMajor = (dKey) => {
        let u = state.pantheon[dKey] || [];
        if (typeof u === 'number') u = migratePantheonSave(dKey, towerId, u);
        return u.includes('MAJOR') ? data.color : '#000';
    };

    const d0 = checkMajor(data.deities[0].k);
    const d1 = checkMajor(data.deities[1].k);
    const d2 = checkMajor(data.deities[2].k);

    let factionSvg = '';
    const strokeFmt = `fill="none" stroke-width="5" stroke-linejoin="round"`;
    
    if (towerId === 1) {
        // GENESIS SPHERE: Intersecting Squares, Octagon, Inner Circle
        factionSvg = `
        <svg viewBox="0 0 100 100" style="width: 1em; height: 1em; overflow: visible;">
            <path d="M 37.5 20 L 50 7.5 L 62.5 20 L 80 20 L 80 37.5 L 92.5 50 L 80 62.5 L 80 80 L 62.5 80 L 50 92.5 L 37.5 80 L 20 80 L 20 62.5 L 7.5 50 L 20 37.5 L 20 20 Z" stroke="${d1}" ${strokeFmt}/>
            <polygon points="37.5,20 62.5,20 80,37.5 80,62.5 62.5,80 37.5,80 20,62.5 20,37.5" stroke="${d2}" ${strokeFmt}/>
            <circle cx="50" cy="50" r="10" stroke="${d0}" ${strokeFmt}/>
        </svg>`;
    } else if (towerId === 2) {
        // ABYSSAL SYNDICATE: Outer Circle, Inverted Triangle, The Predator's Eye (Vertical Slit)
        factionSvg = `
        <svg viewBox="0 0 100 100" style="width: 1em; height: 1em; overflow: visible;">
            <circle cx="50" cy="50" r="42" stroke="${d0}" ${strokeFmt}/>
            <polygon points="50,85 15,25 85,25" stroke="${d1}" ${strokeFmt}/>
            <polygon points="50,25 60,48 50,75 40,48" stroke="${d2}" ${strokeFmt}/>
        </svg>`;
    } else if (towerId === 3) {
        // CELESTIAL VANGUARD: Rounded Square, Intersecting Cross, Center Diamond
        factionSvg = `
        <svg viewBox="0 0 100 100" style="width: 1em; height: 1em; overflow: visible;">
            <rect x="15" y="15" width="70" height="70" rx="8" stroke="${d2}" ${strokeFmt}/>
            <polygon points="20,20 30,20 50,40 70,20 80,20 80,30 60,50 80,70 80,80 70,80 50,60 30,80 20,80 20,70 40,50 20,30" stroke="${d1}" ${strokeFmt}/>
            <polygon points="50,35 65,50 50,65 35,50" stroke="${d0}" ${strokeFmt}/>
        </svg>`;
    }

    let html = `
        <style>
            .zenith-apex-tower { 
                position: absolute; top: ${zenithTop}; left: 50%; transform: translate(-50%, -125%); 
                font-size: ${zenithSize}; z-index: 16; pointer-events: none; 
                filter: drop-shadow(0 0 15px ${data.color}) drop-shadow(0 0 40px ${data.color}88); 
                transition: filter 0.8s ease;
            }
            .tower-wrapper { flex: 1; position: relative; display: flex; flex-direction: column; z-index: 20; padding-top: 30vh; }
            
            .monolith-spire-internal { 
                position: absolute; bottom: -20vh; left: 0; width: 100%; 
                border-style: solid; border-width: 0 1px 0 1px; 
                border-image: linear-gradient(to bottom, transparent 0%, var(--t-color) 100%) 1; 
                background: linear-gradient(to bottom, transparent 0%, var(--t-color) 100%); 
                opacity: 0.7; 
                box-shadow: 0 0 25px -5px var(--t-color); 
                transition: height 0.5s ease, filter 0.3s; z-index: 5; 
                -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 30%); 
                mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 30%); 
            }
            
            .keystone-icon { font-size: 3.5rem; transition

function openOfferingModal(deityKey, towerId, sectorIndex, pathIndex, nodeIndex, isNext) {
    const tower = PANTHEON_DATA[towerId];
    const deity = tower.deities.find(d => d.k === deityKey);
    
    const isMajor = sectorIndex === 'MAJOR';
    let sector, path, targetNode, isKeystone = false;
    
    let cost = 1;
    let typeText = "MINOR STAR";
    let buffName = `Star of ${deity.n}`;
    let buffDesc = deity.starBuff;

    if (isMajor) {
        cost = 50; typeText = "MAJOR KEYSTONE"; buffName = deity.major.n; buffDesc = deity.major.desc;
    } else {
        sector = deity.sectors[sectorIndex];
        const paths = sector.isBranch ? sector.paths : [{coords: sector.coords}];
        path = paths[pathIndex];
        targetNode = path.coords[nodeIndex];
        isKeystone = targetNode.t === 2;

        if (isKeystone) {
            cost = 5; typeText = "MINOR KEYSTONE"; buffName = sector.keystone; buffDesc = sector.perk;
        } else if (sector.isBranch) {
            buffName = path.n; buffDesc = path.p; typeText = `BRANCH STAR // PATH 0${pathIndex + 1}`;
        }
    }

    let actionsHtml = '';
    const secArg = isMajor ? "'MAJOR'" : sectorIndex;

    if (isNext && state.offerings >= cost) {
        actionsHtml = `<div style="margin-top: 20px; font-size: 0.65rem; color: #fff; opacity: 0.8; text-align: center; letter-spacing: 1px;">REQUIRES ${cost} OFFERING${cost > 1 ? 'S' : ''}</div><div style="display: flex; gap: 10px; margin-top: 15px;"><button class="mod-btn" style="flex: 1; border-color: #555; color: #888; letter-spacing: 2px;" onclick="this.closest('.modal-overlay').remove()">[ RENOUNCE ]</button><button class="success-btn" style="flex: 1; background: ${tower.color}; color: #000; box-shadow: 0 0 15px ${tower.color}; font-weight: bold; letter-spacing: 2px;" onclick="this.closest('.modal-overlay').remove(); investOffering('${deityKey}', ${towerId}, ${secArg}, ${pathIndex}, ${nodeIndex});">[ SACRIFICE ]</button></div>`;
    } else if (isNext && state.offerings < cost) {
        actionsHtml = `<div style="margin-top: 20px; font-size: 0.65rem; color: #ff3366; text-align: center; letter-spacing: 1px; text-shadow: 0 0 10px #ff3366;">INSUFFICIENT TRIBUTE (REQUIRES ${cost})</div><div style="margin-top: 15px; text-align: center;"><button class="mod-btn" style="width: 100%; border-color: #555; color: #888;" onclick="this.closest('.modal-overlay').remove()">[ WITHDRAW ]</button></div>`;
    } else {
         actionsHtml = `<div style="margin-top: 20px; text-align: center;"><button class="mod-btn" style="width: 100%; border-color: ${tower.color}; color: ${tower.color};" onclick="this.closest('.modal-overlay').remove()">[ CLOSE COMMUNION ]</button></div>`;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay warp-transition';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="border: 1px solid ${tower.color}; background: rgba(0,0,5,0.95); padding: 25px; width: 90%; max-width: 380px; box-shadow: 0 0 40px rgba(0,0,0,0.8), inset 0 0 20px ${tower.color}22; border-radius: 4px; display: flex; flex-direction: column;">
            <div class="view-level-title" style="color: ${tower.color}; text-shadow: 0 0 10px ${tower.color}; margin-top: 0;">${typeText}</div>
            <h2 class="view-main-title" style="margin-bottom: 5px; font-size: 1.1rem;">${buffName.toUpperCase()}</h2>
            <div class="terminal-console" style="text-align: left; margin: 15px 0 0 0; padding: 15px; border-color: ${tower.color}; background: rgba(0,0,0,0.6); box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                <p style="font-size: 0.75rem; line-height: 1.6; color: #e0e0e0; margin: 0;">${buffDesc}</p>
            </div>
            ${actionsHtml}
        </div>
    `;
    document.body.appendChild(modal);
}

function openConstellation(deityKey, towerId, sectorIndex) {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

    const tower = PANTHEON_DATA[towerId];
    const deity = tower.deities.find(d => d.k === deityKey);
    const sector = deity.sectors[sectorIndex];
    
    let unlocked = state.pantheon[deityKey] || [];
    if (typeof unlocked === 'number') unlocked = migratePantheonSave(deityKey, towerId, unlocked);
    
    let isSectorActive = false;
    if (sectorIndex === 0) {
        isSectorActive = true;
    } else {
        const prevSec = deity.sectors[sectorIndex - 1];
        const prevPaths = prevSec.isBranch ? prevSec.paths : [{coords: prevSec.coords}];
        const prevK = prevPaths[0].coords[prevPaths[0].coords.length - 1];
        if (unlocked.includes(`s${sectorIndex - 1}_x${prevK.x}_y${prevK.y}`)) isSectorActive = true;
    }

    const pathsToRender = sector.isBranch ? sector.paths : [{coords: sector.coords}];

    let starsHtml = pathsToRender.map((pathObj, pIdx) => {
        
        let firstUnlitClickableIndex = -1;
        for (let i = 0; i < pathObj.coords.length; i++) {
            const c = pathObj.coords[i];
            const nId = `s${sectorIndex}_x${c.x}_y${c.y}`;
            if (!unlocked.includes(nId) && c.t !== 0) {
                firstUnlitClickableIndex = i;
                break;
            }
        }

        return pathObj.coords.map((c, nIdx) => {
            const nId = `s${sectorIndex}_x${c.x}_y${c.y}`;
            const isLit = unlocked.includes(nId);
            
            const isNext = !isLit && isSectorActive && (firstUnlitClickableIndex !== -1) && (nIdx <= firstUnlitClickableIndex);

            const isWaypoint = c.t === 0;
            const isKeystone = c.t === 2;
            
            const nodeColor = isLit ? tower.color : '#444';
            let bg = isLit ? tower.color : '#000';
            
            const size = isWaypoint ? 14 : (isKeystone ? 28 : 18);
            const borderStr = isWaypoint ? 'none' : '2px solid ' + (isNext ? tower.color : nodeColor);
            
            let shadowStr = "";

            if (isWaypoint) {
                if (isLit) {
                    bg = tower.color;
                } else if (isNext) {
                    bg = '#1a1a1a'; 
                    shadowStr = "box-shadow: inset 0 0 6px rgba(0,0,0,0.6), 0 0 8px " + tower.color + ";"; 
                } else {
                    bg = '#111'; 
                }
            } else {
                if (isLit) {
                    shadowStr = "box-shadow: 0 0 " + (isKeystone ? "25px " : "15px ") + tower.color + ";";
                } else if (isNext) {
                    shadowStr = "box-shadow: 0 0 " + (isKeystone ? "35px" : "25px") + " " + tower.color + ", 0 0 " + (isKeystone ? "15px" : "10px") + " " + tower.color + ";";
                }
            }

            const cursor = (!isWaypoint && (isLit || isNext)) ? 'pointer' : (isWaypoint ? 'default' : 'not-allowed');
            const pointerEvents = isWaypoint ? 'none' : 'auto';
            const zIdx = isWaypoint ? 5 : (isKeystone ? 15 : 10);
            
            const iconColor = isLit ? '#000' : (isNext ? tower.color : nodeColor);
            const iconHtml = isKeystone ? '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 16px; color: ' + iconColor + ';">' + deity.icon + '</div>' : '';
            const onClickStr = (!isWaypoint && (isLit || isNext)) ? `onclick="openOfferingModal('${deityKey}', ${towerId}, ${sectorIndex}, ${pIdx}, ${nIdx}, ${isNext})"` : '';
            
            return '<div class="star-node" style="position: absolute; left: ' + c.x + '%; top: ' + c.y + '%; transform: translate(-50%, -50%); border: ' + borderStr + '; background: ' + bg + '; width: ' + size + 'px; height: ' + size + 'px; border-radius: 50%; opacity: 1; pointer-events: ' + pointerEvents + '; cursor: ' + cursor + '; ' + shadowStr + ' z-index: ' + zIdx + '; transition: all 0.3s ease;" ' + onClickStr + '>' + iconHtml + '</div>';
        }).join('');
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay warp-transition';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-box" style="width: 95%; max-width: 500px; height: 80vh; border-color: ${tower.color}; display: flex; flex-direction: column;">
            <div class="modal-header">${deity.n.toUpperCase()} // ${sector.name.toUpperCase()}</div>
            <div style="flex: 1; position: relative; background: #000; margin: 10px 0; border: 1px solid #222; overflow: hidden;">
                <svg id="constellation-svg-${deityKey}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></svg>
                ${starsHtml}
            </div>
            <div class="modal-actions" style="flex-direction: column; gap: 0;">
                <button class="mod-btn" style="width: 100%;" onclick="this.closest('.modal-overlay').remove()">[ DISENGAGE ]</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const svg = document.getElementById(`constellation-svg-${deityKey}`);
    renderSectorConstellation(svg, pathsToRender, tower.color, unlocked, sectorIndex, isSectorActive);
}

function renderSectorConstellation(svg, pathsToRender, color, unlocked, sectorIndex, isSectorActive) {
    if (!svg || !pathsToRender) return;
    svg.innerHTML = ''; 
    
    pathsToRender.forEach(pathObj => {
        let firstUnlitClickableIndex = -1;
        for (let j = 0; j < pathObj.coords.length; j++) {
            const c = pathObj.coords[j];
            const nId = `s${sectorIndex}_x${c.x}_y${c.y}`;
            if (!unlocked.includes(nId) && c.t !== 0) {
                firstUnlitClickableIndex = j;
                break;
            }
        }

        pathObj.coords.forEach((coord, i) => {
            if (i < pathObj.coords.length - 1) {
                const next = pathObj.coords[i + 1];
                const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                baseLine.setAttribute("x1", `${coord.x}%`); baseLine.setAttribute("y1", `${coord.y}%`); baseLine.setAttribute("x2", `${next.x}%`); baseLine.setAttribute("y2", `${next.y}%`); 
                baseLine.setAttribute("stroke", "#333"); baseLine.setAttribute("stroke-width", "2");
                svg.appendChild(baseLine);

                const nextId = `s${sectorIndex}_x${next.x}_y${next.y}`;
                const coordId = `s${sectorIndex}_x${coord.x}_y${coord.y}`;

                if (unlocked.includes(nextId)) {
                    const activeLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    activeLine.setAttribute("x1", `${coord.x}%`); activeLine.setAttribute("y1", `${coord.y}%`); activeLine.setAttribute("x2", `${next.x}%`); activeLine.setAttribute("y2", `${next.y}%`); 
                    activeLine.setAttribute("stroke", color); activeLine.setAttribute("stroke-width", "3"); 
                    activeLine.style.filter = `drop-shadow(0 0 8px ${color})`;
                    svg.appendChild(activeLine);
                } else if (isSectorActive && firstUnlitClickableIndex !== -1 && (i + 1) <= firstUnlitClickableIndex) {
                    const pendingLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    pendingLine.setAttribute("x1", `${coord.x}%`); pendingLine.setAttribute("y1", `${coord.y}%`); pendingLine.setAttribute("x2", `${next.x}%`); pendingLine.setAttribute("y2", `${next.y}%`); 
                    pendingLine.setAttribute("stroke", color); pendingLine.setAttribute("stroke-width", "2"); 
                    pendingLine.style.opacity = "0.5"; pendingLine.style.filter = `drop-shadow(0 0 5px ${color})`;
                    svg.appendChild(pendingLine);
                }
            }
        });
    });
}
