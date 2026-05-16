/**
 * POMODORO-ENGINE.JS
 * Handles the Cryo-Stasis (Focus) Timer, Planetary Campaigns, and Resource Harvesting.
 */

const PLANET_BIOMES = [
    // The Original 4
    { id: 'MAGMA', color: '#ff3366', bg: 'radial-gradient(circle at bottom, #3a0008 0%, #000000 80%)' },
    { id: 'ICE', color: '#00e5ff', bg: 'radial-gradient(circle at bottom, #001a22 0%, #000000 80%)' },
    { id: 'CYBER', color: '#00ff88', bg: 'radial-gradient(circle at bottom, #002211 0%, #000000 80%)' },
    { id: 'VOID', color: '#a200ff', bg: 'radial-gradient(circle at bottom, #1a0033 0%, #000000 80%)' },
    
    // The Expanded 10
    { id: 'TOXIC', color: '#ccff00', bg: 'radial-gradient(circle at bottom, #1a3300 0%, #000000 80%)' },     // Acid oceans / Corrosive
    { id: 'CRYSTAL', color: '#ff66cc', bg: 'radial-gradient(circle at bottom, #330033 0%, #000000 80%)' },   // Fractal glass / Prismatic
    { id: 'DUNE', color: '#ffaa00', bg: 'radial-gradient(circle at bottom, #331a00 0%, #000000 80%)' },      // Desert / Sandworm territory
    { id: 'ABYSSAL', color: '#0066ff', bg: 'radial-gradient(circle at bottom, #000a33 0%, #000000 80%)' },   // Deep water / High pressure
    { id: 'SPORE', color: '#b266ff', bg: 'radial-gradient(circle at bottom, #1a0033 0%, #000000 80%)' },     // Fungal overgrowth / Bioluminescent
    { id: 'FERROUS', color: '#cc5500', bg: 'radial-gradient(circle at bottom, #330a00 0%, #000000 80%)' },   // Rust / Metallic scrap world
    { id: 'FALLOUT', color: '#bfff00', bg: 'radial-gradient(circle at bottom, #1a2200 0%, #000000 80%)' },   // Irradiated / Nuclear wasteland
    { id: 'ECLIPSE', color: '#e0e0e0', bg: 'radial-gradient(circle at bottom, #111111 0%, #000000 80%)' },   // Shadow world / Monochrome
    { id: 'PLASMA', color: '#7700ff', bg: 'radial-gradient(circle at bottom, #110033 0%, #000000 80%)' },    // Electrical storms / Volatile
    { id: 'CHRONOS', color: '#ffe55c', bg: 'radial-gradient(circle at bottom, #332b00 0%, #000000 80%)' }    // Golden age / Temporal ruins
];

let focusState = {
    isActive: false,
    timerInterval: null,
    timeRemaining: 0,
    sessionTotalDuration: 0,
    sessionMultiplier: 1.0,
    
    // Absolute Time Tracking & Accumulation Bounds
    targetStartTime: 0,
    targetEndTime: 0,
    
    // Selection Tracking for the Modal
    selectedDuration: 90,
    selectedMultiplier: 2.0,
    
    // Hardened Tracking for Precise Drip Deposits
    dripScrapDeposited: 0,
    
    // Campaign Persistence
    campaignProgress: parseInt(localStorage.getItem('campaignProgress')) || 0, // Out of 90
    currentBiome: JSON.parse(localStorage.getItem('currentBiome')) || PLANET_BIOMES[Math.floor(Math.random() * PLANET_BIOMES.length)],
    
    // Live Session Earnings (Volatile counters)
    sessionEnergy: 0,
    sessionScrap: 0
};

// --- UI HELPERS ---
function selectCryoTimer(minutes, multiplier, btnElement) {
    focusState.selectedDuration = minutes;
    focusState.selectedMultiplier = multiplier;
    
    const buttons = document.querySelectorAll('.timer-select-btn');
    buttons.forEach(btn => {
        btn.style.borderColor = '#555';
        btn.style.color = '#fff';
        btn.style.boxShadow = 'none';
    });
    
    btnElement.style.borderColor = focusState.currentBiome.color;
    btnElement.style.color = focusState.currentBiome.color;
    btnElement.style.boxShadow = `inset 0 0 10px ${focusState.currentBiome.color}33`;
}

// --- INITIALIZATION ---

function openCryoSetupModal() {
    if (!focusState.currentBiome || !focusState.currentBiome.color) {
        focusState.currentBiome = PLANET_BIOMES[Math.floor(Math.random() * PLANET_BIOMES.length)];
    }

    focusState.selectedDuration = 90;
    focusState.selectedMultiplier = 2.0;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay warp-transition';
    modal.style.display = 'flex';
    
    const progressPct = (focusState.campaignProgress / 90) * 100;
    
    modal.innerHTML = `
        <div class="modal-content" style="border: 1px solid ${focusState.currentBiome.color}; background: rgba(0,0,5,0.95); padding: 25px; width: 90%; max-width: 400px; box-shadow: 0 0 40px rgba(0,0,0,0.8), inset 0 0 20px ${focusState.currentBiome.color}22; border-radius: 4px;">
            <div class="view-level-title" style="color: ${focusState.currentBiome.color}; text-shadow: 0 0 10px ${focusState.currentBiome.color}; margin-top: 0;">CRYO-STASIS // PLANETARY DESCENT</div>
            <h2 class="view-main-title" style="margin-bottom: 5px;">BIOME: ${focusState.currentBiome.id}</h2>
            
            <div class="progress-wrapper" style="width: 100%; margin: 15px 0; border-color: ${focusState.currentBiome.color};">
                <div class="progress-bar-container">
                    <div class="progress-fill" style="width: ${progressPct}%; background: ${focusState.currentBiome.color}; box-shadow: 0 0 10px ${focusState.currentBiome.color};"></div>
                </div>
                <div class="progress-text" style="color: ${focusState.currentBiome.color};">${focusState.campaignProgress} / 90 MIN TO APEX EVENT</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
                <button type="button" class="mod-btn timer-select-btn" onclick="selectCryoTimer(15, 1.0, this)" style="padding: 15px; border-color: #555; color: #fff; transition: all 0.3s;">
                    <div style="font-size: 1.2rem; font-weight: bold;">15 MIN</div>
                    <div style="font-size: 0.55rem; opacity: 0.6; margin-top: 4px;">1.0x REWARDS</div>
                </button>
                <button type="button" class="mod-btn timer-select-btn" onclick="selectCryoTimer(30, 1.25, this)" style="padding: 15px; border-color: #555; color: #fff; transition: all 0.3s;">
                    <div style="font-size: 1.2rem; font-weight: bold;">30 MIN</div>
                    <div style="font-size: 0.55rem; opacity: 0.6; margin-top: 4px;">1.25x REWARDS</div>
                </button>
                <button type="button" class="mod-btn timer-select-btn" onclick="selectCryoTimer(60, 1.6, this)" style="padding: 15px; border-color: #555; color: #fff; transition: all 0.3s;">
                    <div style="font-size: 1.2rem; font-weight: bold;">60 MIN</div>
                    <div style="font-size: 0.55rem; opacity: 0.6; margin-top: 4px;">1.6x REWARDS</div>
                </button>
                <button type="button" class="mod-btn timer-select-btn" onclick="selectCryoTimer(90, 2.0, this)" style="padding: 15px; border-color: ${focusState.currentBiome.color}; color: ${focusState.currentBiome.color}; box-shadow: inset 0 0 10px ${focusState.currentBiome.color}33; transition: all 0.3s;">
                    <div style="font-size: 1.2rem; font-weight: bold;">90 MIN</div>
                    <div style="font-size: 0.55rem; opacity: 0.6; margin-top: 4px;">2.0x REWARDS</div>
                </button>
            </div>
            
            <div style="margin-top: 25px; display: flex; flex-direction: column; gap: 10px;">
                <button type="button" class="success-btn" onclick="launchCryoStasis(focusState.selectedDuration, focusState.selectedMultiplier, this)" style="width: 100%; padding: 12px; background: ${focusState.currentBiome.color}; color: #000; font-weight: bold; font-size: 0.9rem; letter-spacing: 2px; border: none; box-shadow: 0 0 15px ${focusState.currentBiome.color}; border-radius: 2px; cursor: pointer;">INITIATE DESCENT</button>
                <button type="button" class="action-btn" onclick="this.closest('.modal-overlay').remove()" style="width: 100%; padding: 10px; background: transparent; border: 1px solid #555; color: #888; border-radius: 2px; font-size: 0.7rem; letter-spacing: 1px;">[ ABORT SEQUENCE ]</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// --- CORE ENGINE ---

function launchCryoStasis(minutes, multiplier, btnElement) {
    if (btnElement && btnElement.closest('.modal-overlay')) {
        btnElement.closest('.modal-overlay').remove();
    }
    
    focusState.isActive = true;
    focusState.sessionTotalDuration = minutes;
    focusState.sessionMultiplier = multiplier;
    
    const now = Date.now();
    focusState.targetStartTime = now;
    
    // --- [ FAST TESTING SPEED CONFIG ] ---
    // 1 minute selection = 1 real second on the clock
    focusState.targetEndTime = now + (minutes * 1 * 1000); 
    focusState.timeRemaining = minutes * 1;  
    // -------------------------------------
    
    focusState.dripScrapDeposited = 0;
    focusState.sessionEnergy = 0;
    focusState.sessionScrap = 0;
    
    renderCryoUI();
    
    focusState.timerInterval = setInterval(cryoTick, 1000);
}

function cryoTick() {
    const now = Date.now();
    
    // 1. Calculate precise timeline metrics
    const remainingMs = focusState.targetEndTime - now;
    focusState.timeRemaining = Math.max(0, Math.ceil(remainingMs / 1000));
    
    const currentTickTime = Math.min(now, focusState.targetEndTime);
    const totalDurationMs = focusState.targetEndTime - focusState.targetStartTime;
    const elapsedMs = Math.max(0, currentTickTime - focusState.targetStartTime);
    
    const progressRatio = totalDurationMs > 0 ? Math.min(1, elapsedMs / totalDurationMs) : 0;
    
    // 2. Compute Absolute Total Projected Payouts for this Campaign Session
    let energyPerUnit = 10 * focusState.sessionMultiplier;
    let scrapPerUnit = 5 * focusState.sessionMultiplier;
    
    if (state && state.pantheon && state.pantheon['tower_1_ascension']) { 
        scrapPerUnit = Math.floor(scrapPerUnit * 1.25); 
    }
    
    const totalSessionEnergy = energyPerUnit * focusState.sessionTotalDuration;
    const totalSessionScrap = scrapPerUnit * focusState.sessionTotalDuration;
    
    // Split absolute values into clean 20% Drip and 80% Vault targets
    const absoluteDripTarget = Math.floor(totalSessionScrap * 0.2);
    const absoluteVaultTarget = totalSessionScrap - absoluteDripTarget;
    
    // 3. Absolute Real-Time Drip Payout Calculation
    const currentExpectedDrip = Math.floor(absoluteDripTarget * progressRatio);
    const dripToUnload = currentExpectedDrip - focusState.dripScrapDeposited;
    
    if (dripToUnload > 0) {
        state.scrap += dripToUnload;
        focusState.dripScrapDeposited += dripToUnload;
        
        if (typeof save === 'function') save();
        if (typeof updateHUD === 'function') updateHUD();
    }
    
    // 4. Smoothly Scale Live HUD Vault Quantities
    focusState.sessionEnergy = Math.floor(totalSessionEnergy * progressRatio);
    focusState.sessionScrap = Math.floor(absoluteVaultTarget * progressRatio);
    
    updateCryoReadout();
    
    // 5. Update Clock Display
    const mins = Math.floor(focusState.timeRemaining / 60);
    const secs = focusState.timeRemaining % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    const clockEl = document.getElementById('cryo-clock');
    if (clockEl) clockEl.innerText = timeStr;
    
    // 6. Timer Complete Execution Hook
    if (focusState.timeRemaining <= 0) {
        clearInterval(focusState.timerInterval);
        focusState.isActive = false;
        
        focusState.campaignProgress += focusState.sessionTotalDuration;
        
        let isApexEvent = false;
        if (focusState.campaignProgress >= 90) {
            isApexEvent = true;
            focusState.campaignProgress = 0; 
            focusState.currentBiome = PLANET_BIOMES[Math.floor(Math.random() * PLANET_BIOMES.length)]; 
        }
        
        localStorage.setItem('campaignProgress', focusState.campaignProgress);
        localStorage.setItem('currentBiome', JSON.stringify(focusState.currentBiome));
        
        // Lock values to maximum targets for exact handover integrity
        focusState.sessionEnergy = totalSessionEnergy;
        focusState.sessionScrap = absoluteVaultTarget;
        
        if (typeof triggerMinigameEncounter === 'function') {
            triggerMinigameEncounter(focusState.sessionTotalDuration, focusState.sessionMultiplier, isApexEvent, focusState.sessionEnergy, focusState.sessionScrap);
        } else {
            // Unload remaining 80% cargo vault directly if minigame manager isn't linked
            state.scrap += focusState.sessionScrap;
            
            if (typeof addEnergy === 'function') {
                addEnergy(focusState.sessionEnergy);
            } else {
                state.energy += focusState.sessionEnergy;
            }
            
            if (typeof save === 'function') save();
            if (typeof updateHUD === 'function') updateHUD();
            
            alert(`CRYO-STASIS COMPLETE // PAYLOAD MANIFEST\n\n` +
                  `> Energy Banked: +${focusState.sessionEnergy} EN\n` +
                  `> Hangar Banked (80% Vault): +${focusState.sessionScrap} SCR\n` +
                  `> In-Flight Drip (20% Feed): +${focusState.dripScrapDeposited} SCR\n\n` +
                  `All assets securely logged to primary systems.`);
            exitCryoMode();
        }
    }
}

function updateCryoReadout() {
    const readout = document.getElementById('cryo-readout');
    if (readout) {
        readout.innerHTML = `
            <span style="color: var(--accent); text-shadow: 0 0 5px var(--accent-glow);">ENERGY: ${focusState.sessionEnergy}</span>
            <span style="color: var(--captured); text-shadow: 0 0 5px var(--captured);">SCRAP: ${focusState.sessionScrap}</span>
        `;
    }
}

function abortCryoStasis() {
    if(confirm("INITIATE EMERGENCY THAW?\n\nYou will wake up early. All Energy and Scrap gathered this session will be lost.")) {
        clearInterval(focusState.timerInterval);
        focusState.isActive = false;
        exitCryoMode();
    }
}

function exitCryoMode() {
    const container = document.getElementById('cryo-mode-container');
    if (container) container.remove();
}
