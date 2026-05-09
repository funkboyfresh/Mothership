/**
 * PANTHEON-RENDERER.JS
 * Master visual controller for the Void Pantheon and Ascension Monoliths.
 */

// Renders the Void Pantheon - entry to each of the three skill tree towers.
function renderVoidPantheon() {
    const container = document.getElementById('view-container');
    
    // Kill the secondary "GALAXY" nav bar to let the view stretch to the ceiling
    const navBar = document.getElementById('nav-bar');
    if(navBar) navBar.style.display = 'none';

    // Gravity-Weighted Starfield
    let bgStars = '', midStars = '', fgStars = '';
    for(let i = 0; i < 375; i++) {
        const getStar = (scale) => {
            let size = (Math.random() * 2 * scale) + 'px';
            let left = Math.random() * 100 + '%';
            let verticalBias = Math.pow(Math.random(), 0.45); 
            let top = verticalBias * 100 + '%';
            let dynamicOpacity = 0.2 + (verticalBias * 0.8); 
            let dur = (Math.random() * 5 + 3) + 's';
            
            // Negative delay prevents the initial mass-vanishing
            let del = '-' + (Math.random() * 10) + 's'; 
            
            // [ RESTORED ] Uses your native void-particle movement, but forces it to loop infinitely
            return `<div class="void-particle" style="width:${size}; height:${size}; left:${left}; top:${top}; opacity:${dynamicOpacity}; animation-duration:${dur}; animation-delay:${del}; animation-iteration-count: infinite;"></div>`;
        };
        bgStars += getStar(0.7); 
        midStars += getStar(1.1); 
        fgStars += getStar(1.6); 
    }

    const atmosStyles = `
        <style>
            @keyframes fog-breathe { 0% { opacity: 0.6; transform: scale(1) translateY(0); } 50% { opacity: 0.9; transform: scale(1.05) translateY(-2%); } 100% { opacity: 0.6; transform: scale(1) translateY(0); } }
            @keyframes slow-drift { 0% { transform: translateX(-5%); } 100% { transform: translateX(5%); } }
            
            /* (Removed the heavy pantheon-twinkle box-shadow to restore 60 FPS) */

            .pantheon-starfield-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; }
            .bg-stellar-nursery { position: absolute; top: -20%; left: -10%; width: 120%; height: 110%; background: radial-gradient(ellipse at 50% 30%, rgba(50, 10, 80, 0.5) 0%, transparent 70%), radial-gradient(ellipse at 20% 40%, rgba(10, 50, 80, 0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 40%, rgba(80, 50, 10, 0.4) 0%, transparent 60%); filter: blur(30px); z-index: 1; animation: fog-breathe 23s infinite alternate ease-in-out; }
            .fg-stellar-nursery { position: absolute; top: -25%; left: -10%; width: 120%; height: 115%; opacity: 0.9; background: radial-gradient(circle at 17% 35%, rgba(0,212,255,0.55) 0%, rgba(0,212,255,0.15) 40%, transparent 60%), radial-gradient(circle at 50% 30%, rgba(255,215,0,0.75) 0%, rgba(255,215,0,0.25) 40%, transparent 65%), radial-gradient(circle at 83% 35%, rgba(255,0,255,0.7) 0%, rgba(255,0,255,0.2) 40%, transparent 60%), radial-gradient(circle at 33% 35%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(circle at 67% 35%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(circle at 50% 40%, rgba(255,255,255,0.35) 0%, transparent 60%), radial-gradient(circle at 33% 35%, rgba(0,0,0,0.8) 0%, transparent 45%), radial-gradient(circle at 67% 35%, rgba(0,0,0,0.8) 0%, transparent 45%), radial-gradient(circle at 50% 15%, rgba(0,0,0,0.85) 0%, transparent 55%); filter: blur(30px); mix-blend-mode: hard-light; z-index: 15; pointer-events: none; animation: slow-drift 34s infinite alternate ease-in-out; -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.15) 85%, transparent 100%); mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.15) 85%, transparent 100%); }
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
            
            <div class="pantheon-starfield-container" style="z-index: 0; opacity: 0.6;">
                ${bgStars}
            </div>

            <div class="bg-stellar-nursery"></div>

            <div class="zenith-apex-void">◬</div>

            <div style="display: flex; flex: 1; width: 90%; margin: 0 auto; gap: 10px; align-items: stretch; padding-bottom: 80px;">
                
                <div class="tower-wrapper" onclick="renderAscensionTower(1)" style="--t-color: #00d4ff;">
                    <div class="monolith-spire"></div>
                    <div class="tower-content">
                        <div class="spire-text">GENESIS SPHERE</div>
                        <div class="tower-icon-wrapper">
                            <div class="tower-icon" style="font-size: 3rem;">۞</div> 
                        </div>
                    </div>
                </div>
                
                <div class="tower-wrapper" onclick="renderAscensionTower(2)" style="--t-color: #ffd700;">
                    <div class="monolith-spire"></div>
                    <div class="tower-content">
                        <div class="spire-text">ABYSSAL SYNDICATE</div>
                        <div class="tower-icon-wrapper">
                            <div class="tower-icon" style="font-size: 4.2rem;">⎊</div>
                        </div>
                    </div>
                </div>
                
                <div class="tower-wrapper" onclick="renderAscensionTower(3)" style="--t-color: #ff00ff;">
                    <div class="monolith-spire"></div>
                    <div class="tower-content">
                        <div class="spire-text">CELESTIAL VANGUARD</div>
                        <div class="tower-icon-wrapper">
                            <div class="tower-icon" style="font-size: 3rem;">❖</div>
                        </div>
                    </div>
                </div>

            </div>

            <div class="pantheon-starfield-container" style="z-index: 10; opacity: 0.8;">
                ${midStars}
            </div>

            <div class="fg-stellar-nursery"></div>

            <div class="pantheon-starfield-container" style="z-index: 22;">
                ${fgStars}
            </div>

          <div style="position: absolute; bottom: 20px; width: 100%; color: #fff; font-size: 0.8rem; opacity: 0.6; display: flex; align-items: center; justify-content: center; gap: 10px; z-index: 25; pointer-events: none;">
                OFFERINGS REMAINING: <span style="color: #fff; font-weight: bold; font-size: 1rem;">${state.offerings}</span>
                <button onclick="state.offerings += 5; save(); renderVoidPantheon();" style="background: rgba(255, 255, 255, 0.2); border: 1px solid #fff; color: #fff; font-size: 0.5rem; padding: 2px 6px; cursor: pointer; border-radius: 2px; pointer-events: auto;">[+5 DEV]</button>
            </div>

        </div>
    `;
}

function renderAscensionTower(towerId) {
    const data = PANTHEON_DATA[towerId];
    const container = document.getElementById('view-container');
    const factionIcons = { 1: '۞', 2: '⎊', 3: '❖' };
    const factionIcon = factionIcons[towerId] || '◬';
    const zenithSize = towerId === 1 ? '6.8rem' : '8rem';

    let html = `
        <style>
            .zenith-apex-tower { position: absolute; top: 28%; left: 50%; transform: translate(-50%, -125%); font-size: ${zenithSize}; color: #000; z-index: 16; pointer-events: none; text-shadow: 0 0 40px ${data.color}, 0 0 80px ${data.color}88, 0 0 120px ${data.color}44; }
            .tower-wrapper { flex: 1; position: relative; display: flex; flex-direction: column; z-index: 20; padding-top: 30vh; }
            .monolith-spire-internal { position: absolute; bottom: -20vh; left: 0; width: 100%; border-style: solid; border-width: 0 1px 0 1px; border-image: linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, var(--t-color) 15%, #000 80%) 1; background: linear-gradient(to bottom, var(--t-color) 0%, #000000 70%); box-shadow: 0 0 25px -5px var(--t-color); transition: height 0.5s ease, filter 0.3s; z-index: 5; -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%); mask-image: linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%); }
            .keystone-icon { font-size: 3.5rem; transition: all 0.5s ease; }
            .minor-keystone-node { width: 14px; height: 14px; border-radius: 50%; cursor: pointer; transition: all 0.3s ease; }
            .minor-keystone-node:hover { transform: scale(1.3); }
        </style>

        <div class="target-lock warp-transition" style="justify-content: flex-start; padding: 0; background: #010003; height: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden;">
            <button class="subtask-remove-minimal" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; color: ${data.color}; z-index: 100; cursor: pointer;" onclick="renderVoidPantheon()">×</button>
            <div class="zenith-apex-tower">${factionIcon}</div>
            <div style="display: flex; flex: 1; width: 90%; margin: 0 auto; gap: 10px; align-items: stretch;">
                
                ${data.deities.map(d => {
                    const progress = state.pantheon[d.k] || 0; 
                    const currentSector = Math.floor(progress / 6);
                    const spireHeight = 60 + (progress / 30) * 22; 
                    const isMaxed = progress >= 30;

                    return `
                        <div class="tower-wrapper" style="--t-color: ${data.color};">
                            <div class="monolith-spire-internal" style="height: ${spireHeight}%;"></div>
                            <div style="display: flex; flex-direction: column; height: 100%; width: 100%; z-index: 20;">
                                
                                <div style="text-align: center; margin-bottom: 10px;">
                                    <div class="keystone-icon" 
                                         onclick="openOfferingModal('${d.k}', ${towerId}, 'MAJOR', ${progress === 30})" 
                                         style="cursor: ${progress === 30 ? 'pointer' : 'default'}; color: ${isMaxed ? data.color : '#fff'}; text-shadow: ${isMaxed ? `0 0 25px ${data.color}` : '0 0 10px #fff'};">
                                         ${d.icon}
                                    </div>
                                </div>

                                <div style="flex: 1; position: relative; display: flex; flex-direction: column-reverse; justify-content: space-between; align-items: center; padding: 15px 0;">
                                    <div style="position: absolute; width: 2px; height: 100%; background: #333; z-index: 1;"></div>
                                    <div style="position: absolute; bottom: 0; width: 2px; height: ${(progress / 30) * 100}%; background: ${data.color}; box-shadow: 0 0 10px ${data.color}; z-index: 2; transition: height 0.5s ease;"></div>
                                    
                                    ${[0, 1, 2, 3, 4].map(i => {
                                        const isCompleted = progress >= (i + 1) * 6;
                                        const isActive = currentSector === i;
                                        const nodeColor = isCompleted || isActive ? data.color : '#444';
                                        const bg = isCompleted ? data.color : '#000';
                                        const glow = isCompleted || isActive ? `box-shadow: 0 0 15px ${data.color};` : '';
                                        
                                        return `
                                            <div class="minor-keystone-node" 
                                                 onclick="openConstellation('${d.k}', ${towerId}, ${i})"
                                                 style="position: relative; z-index: 30; border: 2px solid ${nodeColor}; background: ${bg}; ${glow}">
                                            </div>
                                        `;
                                    }).join('')}
                                </div>

                                <div style="text-align: center; margin-top: 15px; margin-bottom: 50px;">
                                    <div style="color: ${data.color}; font-weight: bold; letter-spacing: 2px; font-size: 0.75rem; text-shadow: 0 0 10px ${data.color}; margin-bottom: 4px;">
                                        ${d.n.toUpperCase()}
                                    </div>
                                    <div style="color: #fff; font-size: 0.6rem; opacity: 0.5; font-family: monospace; letter-spacing: 1px;">
                                        LVL ${progress}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div style="position: absolute; bottom: 20px; width: 100%; color: #fff; font-size: 0.8rem; opacity: 0.6; display: flex; align-items: center; justify-content: center; gap: 10px; z-index: 25; pointer-events: none;">
                AVAILABLE OFFERINGS: <span style="color: #fff; font-weight: bold; font-size: 1rem;">${state.offerings}</span>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

function openOfferingModal(deityKey, towerId, nodeIndex, isNext) {
    const totalLevel = state.pantheon[deityKey] || 0; 
    const tower = PANTHEON_DATA[towerId];
    const deity = tower.deities.find(d => d.k === deityKey);
    const sector = deity.sectors[Math.floor(totalLevel / 6)] || deity.sectors[4];
    
    const isKeystone = nodeIndex === 6; 
    const isMajor = nodeIndex === 'MAJOR';
    
    let cost = 1;
    let typeText = `MINOR STAR // NODE 0${nodeIndex}`;
    let buffName = `Star of ${deity.n}`;
    let buffDesc = deity.starBuff;

    if (isMajor) {
        cost = 50; typeText = "MAJOR KEYSTONE"; buffName = deity.major.n; buffDesc = deity.major.desc;
    } else if (isKeystone) {
        cost = 5; typeText = "MINOR KEYSTONE"; buffName = sector.keystone; buffDesc = sector.perk;
    }

    let actionsHtml = '';
    
    if (isNext && state.offerings >= cost) {
        actionsHtml = `<div style="margin-top: 20px; font-size: 0.65rem; color: #fff; opacity: 0.8; text-align: center; letter-spacing: 1px;">REQUIRES ${cost} OFFERING${cost > 1 ? 'S' : ''}</div><div style="display: flex; gap: 10px; margin-top: 15px;"><button class="mod-btn" style="flex: 1; border-color: #555; color: #888; letter-spacing: 2px;" onclick="this.closest('.modal-overlay').remove()">[ RENOUNCE ]</button><button class="success-btn" style="flex: 1; background: ${tower.color}; color: #000; box-shadow: 0 0 15px ${tower.color}; font-weight: bold; letter-spacing: 2px;" onclick="this.closest('.modal-overlay').remove(); investOffering('${deityKey}', ${towerId});">[ SACRIFICE ]</button></div>`;
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
    const totalLevel = state.pantheon[deityKey] || 0; 
    
    let nodesLit = 0;
    if (totalLevel >= (sectorIndex + 1) * 6) nodesLit = 6; 
    else if (totalLevel >= sectorIndex * 6) nodesLit = totalLevel % 6; 
    
    let completionHtml = '';
    if (nodesLit === 5 && Math.floor(totalLevel / 6) === sectorIndex) {
        completionHtml = `<button class="success-btn" style="width: 100%; margin-bottom: 10px; background: ${tower.color}; color: #000; font-weight: bold;" onclick="openOfferingModal('${deityKey}', ${towerId}, 6, true)">[ UNLOCK MINOR KEYSTONE ]</button>`;
    }

    const pathsToRender = sector.isBranch ? [sector.paths[0].coords, sector.paths[1].coords] : [sector.coords];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay warp-transition';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-box" style="width: 95%; max-width: 500px; height: 80vh; border-color: ${tower.color}; display: flex; flex-direction: column;">
            <div class="modal-header">${deity.n.toUpperCase()} // ${sector.name.toUpperCase()}</div>
            
            <div style="flex: 1; position: relative; background: #000; margin: 10px 0; border: 1px solid #222; overflow: hidden;">
                <svg id="constellation-svg-${deityKey}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></svg>
                
                ${pathsToRender.map(coordsArray => coordsArray.map((c, i) => {
                    const isLit = nodesLit > i;
                    const isNext = (nodesLit === i) && (Math.floor(totalLevel / 6) === sectorIndex);
                    const nodeColor = isLit ? tower.color : '#444';
                    const bg = isLit ? tower.color : '#000';
                    const shadow = isLit || isNext ? `box-shadow: 0 0 15px ${tower.color};` : '';
                    const cursor = isNext || isLit ? 'pointer' : 'not-allowed';
                    
                    return `
                    <div class="star-node" 
                         style="position: absolute; left: ${c.x}%; top: ${c.y}%; transform: translate(-50%, -50%); border: 2px solid ${nodeColor}; background: ${bg}; width: 18px; height: 18px; border-radius: 50%; pointer-events: auto; cursor: ${cursor}; ${shadow} z-index: 10;"
                         onclick="openOfferingModal('${deityKey}', ${towerId}, ${i+1}, ${isNext})">
                    </div>
                    `;
                }).join('')).join('')}
            </div>
            
            <div class="modal-actions" style="flex-direction: column; gap: 0;">
                ${completionHtml}
                <button class="mod-btn" style="width: 100%;" onclick="this.closest('.modal-overlay').remove()">[ DISENGAGE ]</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const svg = document.getElementById(`constellation-svg-${deityKey}`);
    renderSectorConstellation(svg, pathsToRender, tower.color, nodesLit);
}

function renderSectorConstellation(svg, pathsToRender, color, nodesLit) {
    if (!svg || !pathsToRender) return;
    svg.innerHTML = ''; 
    
    pathsToRender.forEach(coords => {
        coords.forEach((coord, i) => {
            if (i < coords.length - 1) {
                const next = coords[i + 1];
                const baseLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                baseLine.setAttribute("x1", `${coord.x}%`); 
                baseLine.setAttribute("y1", `${coord.y}%`); 
                baseLine.setAttribute("x2", `${next.x}%`); 
                baseLine.setAttribute("y2", `${next.y}%`); 
                baseLine.setAttribute("stroke", "#333"); 
                baseLine.setAttribute("stroke-width", "2");
                svg.appendChild(baseLine);

                if (nodesLit > i + 1) {
                    const activeLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    activeLine.setAttribute("x1", `${coord.x}%`); 
                    activeLine.setAttribute("y1", `${coord.y}%`); 
                    activeLine.setAttribute("x2", `${next.x}%`); 
                    activeLine.setAttribute("y2", `${next.y}%`); 
                    activeLine.setAttribute("stroke", color); 
                    activeLine.setAttribute("stroke-width", "3"); 
                    activeLine.style.filter = `drop-shadow(0 0 8px ${color})`;
                    svg.appendChild(activeLine);
                }
            }
        });
    });
}
