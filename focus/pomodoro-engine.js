/**
 * POMODORO-ENGINE.JS
 * Handles the Planetary Campaign, Focus Timers, and Passive Resource Generation.
 */

const PLANET_BIOMES = [
    { id: 'MAGMA', color: '#ff3366', bg: 'radial-gradient(circle at bottom, #3a0008 0%, #000000 80%)' },
    { id: 'ICE', color: '#00e5ff', bg: 'radial-gradient(circle at bottom, #001a22 0%, #000000 80%)' },
    { id: 'CYBER', color: '#00ff88', bg: 'radial-gradient(circle at bottom, #002211 0%, #000000 80%)' },
    { id: 'VOID', color: '#a200ff', bg: 'radial-gradient(circle at bottom, #1a0033 0%, #000000 80%)' }
];

let focusState = {
    isActive: false,
    timerInterval: null,
    timeRemaining: 0,
    sessionTotalDuration: 0,
    sessionMultiplier: 1.0,
    
    // Campaign Persistence
    campaignProgress: parseInt(localStorage.getItem('campaignProgress')) || 0, // Out of 90
    currentBiome: JSON.parse(localStorage.getItem('currentBiome')) || PLANET_BIOMES[Math.floor(Math.random() * PLANET_BIOMES.length)],
    
    // Session Earnings (Volatile)
    sessionEnergy: 0,
    sessionScrap: 0
};

// --- INITIALIZATION ---

function openFocusSetupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay warp-transition';
    modal.style.display = 'flex';
    
    const progressPct = (focusState.campaignProgress / 90) * 100;
    
    modal.innerHTML = `
        <div class="modal-content" style="border: 1px solid ${focusState.currentBiome.color}; background: rgba(0,0,5,0.95); padding: 25px; width: 90%; max-width: 400px; border-radius: 4px;">
            <div class="view-level-title" style="color: ${focusState.currentBiome.color}; text-shadow: 0 0 10px ${focusState.currentBiome.color};">PLANETARY DESCENT</div>
            <h2 class="view-main-title">BIOME: ${focusState.currentBiome.id}</h2>
            
            <div class="progress-wrapper" style="width: 100%; margin: 15px 0; border-color: ${focusState.currentBiome.color};">
                <div class="progress-bar-container">
                    <div class="progress-fill" style="width: ${progressPct}%; background: ${focusState.currentBiome.color}; box-shadow: 0 0 10px ${focusState.currentBiome.color};"></div>
                </div>
                <div class="progress-text" style="color: ${focusState.currentBiome.color};">${focusState.campaignProgress} / 90 MINUTES TO APEX EVENT</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
                <button class="mod-btn" onclick="launchFocus(15, 1.0, this)" style="padding: 15px; border-color: #555; color: #fff;">
                    <div style="font-size: 1.2rem; font-weight: bold;">15 MIN</div>
                    <div style="font-size: 0.55rem; opacity: 0.6;">1.0x REWARDS</div>
                </button>
                <button class="mod-btn" onclick="launchFocus(30, 1.25, this)" style="padding: 15px; border-color: #555; color: #fff;">
                    <div style="font-size: 1.2rem; font-weight: bold;">30 MIN</div>
                    <div style="font-size: 0.55rem; opacity: 0.6;">1.25x REWARDS</div>
                </button>
                <button class="mod-btn" onclick="launchFocus(60, 1.6, this)" style="padding: 15px; border-color: #555; color: #fff;">
                    <div style="font-size: 1.2rem; font-weight: bold;">60 MIN</div>
                    <div style="font-size: 0.55rem; opacity: 0.6;">1.6x REWARDS</div>
                </button>
                <button class="mod-btn" onclick="launchFocus(90, 2.0, this)" style="padding: 15px; border-color: ${focusState.currentBiome.color}; color: ${focusState.currentBiome.color}; box-shadow: inset 0 0 10px ${focusState.currentBiome.color}33;">
                    <div style="font-size: 1.2rem; font-weight: bold;">90 MIN</div>
                    <div style="font-size: 0.55rem; opacity: 0.6;">2.0x REWARDS</div>
                </button>
            </div>
            
            <button class="action-btn" onclick="this.closest('.modal-overlay').remove()" style="width: 100%; margin-top: 15px; padding: 10px; background: transparent; border: 1px solid #555; color: #888;">[ ABORT ]</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// --- CORE ENGINE ---

function launchFocus(minutes, multiplier, btnElement) {
    // Close modal
    btnElement.closest('.modal-overlay').remove();
    
    // Set State
    focusState.isActive = true;
    focusState.sessionTotalDuration = minutes;
    focusState.timeRemaining = minutes * 60; // In seconds
    focusState.sessionMultiplier = multiplier;
    focusState.sessionEnergy = 0;
    focusState.sessionScrap = 0;
    
    // Trigger Atmospheric Entry UI
    renderFocusUI();
    
    // Start Loop
    focusState.timerInterval = setInterval(focusTick, 1000);
}

function focusTick() {
    focusState.timeRemaining--;
    
    // Passive Resource Generation (Every 60 seconds)
    if (focusState.timeRemaining % 60 === 0) {
        // Base generation
        let tickEnergy = 10;
        let tickScrap = 5;
        
        // Apply Genesis Sphere Pantheon Buffs (Tower 1) if active
        // (Assuming checking state.pantheon directly or via a helper)
        if (state.pantheon['tower_1_ascension']) {
            tickScrap = Math.floor(tickScrap * 1.25);
        }
        
        focusState.sessionEnergy += tickEnergy;
        focusState.sessionScrap += tickScrap;
        
        updateFocusReadout();
    }
    
    // Update Clock UI
    const mins = Math.floor(focusState.timeRemaining / 60);
    const secs = focusState.timeRemaining % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    const clockEl = document.getElementById('focus-clock');
    if (clockEl) clockEl.innerText = timeStr;
    
    // Timer Complete!
    if (focusState.timeRemaining <= 0) {
        clearInterval(focusState.timerInterval);
        focusState.isActive = false;
        
        // Advance Campaign
        focusState.campaignProgress += focusState.sessionTotalDuration;
        
        let isApex = false;
        if (focusState.campaignProgress >= 90) {
            isApex = true;
            focusState.campaignProgress = 0; // Reset for next planetary descent
            // Roll new biome for next time
            focusState.currentBiome = PLANET_BIOMES[Math.floor(Math.random() * PLANET_BIOMES.length)];
        }
        
        localStorage.setItem('campaignProgress', focusState.campaignProgress);
        localStorage.setItem('currentBiome', JSON.stringify(focusState.currentBiome));
        
        // Trigger Minigame Manager (To be built next)
        if (typeof triggerMinigameEncounter === 'function') {
            triggerMinigameEncounter(focusState.sessionTotalDuration, focusState.sessionMultiplier, isApex, focusState.sessionEnergy);
        } else {
            alert(`Timer Complete! Earned ${focusState.sessionEnergy} Energy. (Minigame Manager Not Linked Yet)`);
            exitFocusMode();
        }
    }
}

// --- UI RENDERER ---

function renderFocusUI() {
    const app = document.getElementById('app');
    
    const focusContainer = document.createElement('div');
    focusContainer.id = 'focus-mode-container';
    focusContainer.className = 'warp-transition';
    focusContainer.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
        background: ${focusState.currentBiome.bg}; 
        z-index: 500; display: flex; flex-direction: column; align-items: center; justify-content: center;
        overflow: hidden;
    `;
    
    // The Parallax Planetary Surface (Scrolls down)
    const surface = document.createElement('div');
    surface.style.cssText = `
        position: absolute; top: -100%; left: 0; width: 100%; height: 200%;
        background-image: linear-gradient(transparent 50%, ${focusState.currentBiome.color}22 50%);
        background-size: 100% 40px;
        animation: surface-scroll 2s linear infinite;
        z-index: 1;
    `;
    
    // Inject the CSS animation dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes surface-scroll {
            0% { transform: translateY(0); }
            100% { transform: translateY(40px); }
        }
        .focus-hud { z-index: 10; position: relative; text-align: center; }
    `;
    focusContainer.appendChild(style);
    
    focusContainer.appendChild(surface);
    
    // The Hero Ship (Uses your modular SVG logic)
    const shipWrapper = document.createElement('div');
    shipWrapper.style.cssText = `position: absolute; bottom: 20%; width: 120px; height: 120px; z-index: 5; filter: drop-shadow(0 0 15px ${focusState.currentBiome.color});`;
    if (typeof drawModularShip === 'function') {
        drawModularShip(shipWrapper, state.shipParts);
    }
    focusContainer.appendChild(shipWrapper);
    
    // The HUD
    focusContainer.insertAdjacentHTML('beforeend', `
        <div class="focus-hud">
            <div style="font-size: 0.7rem; letter-spacing: 3px; color: ${focusState.currentBiome.color}; margin-bottom: 10px;">DEEP FOCUS ENGAGED</div>
            <div id="focus-clock" style="font-size: 4rem; font-weight: bold; font-family: monospace; color: #fff; text-shadow: 0 0 20px ${focusState.currentBiome.color};">
                ${focusState.sessionTotalDuration.toString().padStart(2, '0')}:00
            </div>
            <div id="focus-readout" style="margin-top: 20px; font-size: 0.8rem; color: #aaa; display: flex; gap: 20px; justify-content: center;">
                <span>ENERGY: 0</span>
                <span>SCRAP: 0</span>
            </div>
            
            <button onclick="abortFocus()" style="margin-top: 40px; background: transparent; border: 1px solid #555; color: #888; padding: 8px 16px; font-size: 0.6rem; letter-spacing: 2px; border-radius: 2px; cursor: pointer;">[ ABORT MISSION ]</button>
        </div>
    `);
    
    app.appendChild(focusContainer);
}

function updateFocusReadout() {
    const readout = document.getElementById('focus-readout');
    if (readout) {
        readout.innerHTML = `
            <span style="color: var(--accent);">ENERGY BANKED: ${focusState.sessionEnergy}</span>
            <span style="color: var(--captured);">SCRAP BANKED: ${focusState.sessionScrap}</span>
        `;
    }
}

function abortFocus() {
    if(confirm("ABORT DESCENT? All banked Energy and Scrap will be lost.")) {
        clearInterval(focusState.timerInterval);
        focusState.isActive = false;
        exitFocusMode();
    }
}

function exitFocusMode() {
    const container = document.getElementById('focus-mode-container');
    if (container) container.remove();
}
