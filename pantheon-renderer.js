
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
            let del = (Math.random() * 5) + 's';
            
            return `<div class="void-particle" style="width:${size}; height:${size}; left:${left}; top:${top}; opacity:${dynamicOpacity}; animation-duration:${dur}; animation-delay:${del};"></div>`;
        };
        bgStars += getStar(0.7); 
        midStars += getStar(1.1); 
        fgStars += getStar(1.6); 
    }

    const atmosStyles = `
        <style>
            @keyframes fog-breathe {
                0% { opacity: 0.6; transform: scale(1) translateY(0); }
                50% { opacity: 0.9; transform: scale(1.05) translateY(-2%); }
                100% { opacity: 0.6; transform: scale(1) translateY(0); }
            }
            @keyframes slow-drift {
                0% { transform: translateX(-5%); }
                100% { transform: translateX(5%); }
            }

            .pantheon-starfield-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; overflow: hidden;
            }

            .bg-stellar-nursery {
                position: absolute; top: -20%; left: -10%; width: 120%; height: 110%;
                background: 
                    radial-gradient(ellipse at 50% 30%, rgba(50, 10, 80, 0.5) 0%, transparent 70%),
                    radial-gradient(ellipse at 20% 40%, rgba(10, 50, 80, 0.4) 0%, transparent 60%),
                    radial-gradient(ellipse at 80% 40%, rgba(80, 50, 10, 0.4) 0%, transparent 60%);
                filter: blur(30px);
                z-index: 1;
                animation: fog-breathe 23s infinite alternate ease-in-out;
            }

            .fg-stellar-nursery {
                position: absolute;
                top: -25%; left: -10%; 
                width: 120%; 
                height: 115%; 
                opacity: 0.9; 
                background: 
                    radial-gradient(circle at 17% 35%, rgba(0,212,255,0.55) 0%, rgba(0,212,255,0.15) 40%, transparent 60%),
                    radial-gradient(circle at 50% 30%, rgba(255,215,0,0.75) 0%, rgba(255,215,0,0.25) 40%, transparent 65%),
                    radial-gradient(circle at 83% 35%, rgba(255,0,255,0.7) 0%, rgba(255,0,255,0.2) 40%, transparent 60%),
                    radial-gradient(circle at 33% 35%, rgba(255,255,255,0.5) 0%, transparent 50%),
                    radial-gradient(circle at 67% 35%, rgba(255,255,255,0.5) 0%, transparent 50%),
                    radial-gradient(circle at 50% 40%, rgba(255,255,255,0.35) 0%, transparent 60%),
                    radial-gradient(circle at 33% 35%, rgba(0,0,0,0.8) 0%, transparent 45%),
                    radial-gradient(circle at 67% 35%, rgba(0,0,0,0.8) 0%, transparent 45%),
                    radial-gradient(circle at 50% 15%, rgba(0,0,0,0.85) 0%, transparent 55%);
                filter: blur(30px); 
                mix-blend-mode: hard-light; 
                z-index: 15;
                pointer-events: none;
                animation: slow-drift 34s infinite alternate ease-in-out;
                -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.15) 85%, transparent 100%);
                mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.15) 85%, transparent 100%);
            }

            /* [ UPDATED ] Shifted down by 5% (from 18% to 23%) */
            .zenith-apex-void {
                position: absolute;
                top: 26%; 
                left: 50%;
                transform: translate(-50%, -125%); 
                font-size: 8rem;
                color: #000; 
                z-index: 16; 
                pointer-events: none;
                text-shadow: 0 0 30px rgba(255,255,255,0.1);
            }

            .tower-wrapper {
                flex: 1;
                position: relative;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                align-items: center;
            }

            /* [ UPDATED ] Anchored to -5vh to sink it 5% deeper, adding 5vh to height so it doesn't shrink */
            .monolith-spire {
                position: absolute;
                bottom: -5vh; left: 0; 
                width: 100%; 
                height: calc(82% + 5vh); 
                border-style: solid;
                border-width: 0 1px 0 1px; 
                border-image: linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, var(--t-color) 15%, #000 80%) 1;
                background: linear-gradient(to bottom, var(--t-color) 0%, #000000 70%);
                box-shadow: 0 0 25px -5px var(--t-color); 
                transition: filter 0.3s;
                z-index: 5; 
                -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%);
                mask-image: linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%);
            }
            .tower-wrapper:hover .monolith-spire { 
                filter: brightness(1.3) drop-shadow(0 0 10px var(--t-color)); 
            }

            /* [ UPDATED ] Pushed text and icons down by 5vh to match the new floor drop */
            .tower-content {
                position: relative;
                z-index: 20; 
                padding-bottom: 10px; 
                display: flex;
                flex-direction: column;
                align-items: center;
                pointer-events: none;
                transform: translateY(5vh);
            }

            .spire-text {
                height: 380px; 
                display: flex;
                align-items: flex-end;
                color: var(--t-color); 
                writing-mode: vertical-rl; 
                transform: rotate(180deg);
                letter-spacing: 4px; 
                font-weight: bold; 
                font-size: 1.1rem; 
                text-shadow: 0 0 15px var(--t-color);
                white-space: nowrap; 
            }

            .tower-icon-wrapper {
                height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-top: 15px;
            }

            .tower-icon {
                color: #fff;
                text-shadow: 0 0 10px #fff, 0 0 30px var(--t-color), 0 0 60px var(--t-color);
            }
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

// Renders the Ascension tower - each individual skill tree sector.

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
        
        // [ UPGRADED ] The Keystone Node now dynamically pulls \${d.icon} instead of the hardcoded ◈
        html += `
            <div onclick="openOfferingModal('${d.k}', ${towerId}, 6, false)" style="width: 35px; height: 35px; border: 2px solid ${data.color}; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: ${isKeystoneUnlocked ? data.color : '#000'}; box-shadow: 0 0 10px ${isKeystoneUnlocked ? data.color : 'transparent'}; margin-bottom: 5px; cursor: pointer;">
                <span style="color: ${isKeystoneUnlocked ? '#000' : data.color}; font-size: 1.2rem;">${d.icon}</span>
            </div>
            <div style="font-size: 0.55rem; color: ${data.color}; margin-bottom: 15px; font-weight: bold; text-align: center; height: 15px;">${d.n.toUpperCase()}</div>
        `;

        // 2. The 5 Minor Nodes
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
