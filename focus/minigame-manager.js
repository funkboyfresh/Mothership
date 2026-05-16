/**
 * THE VOID ENCOUNTER ROADMAP (POMODORO BREAK MINIGAMES)
 * -----------------------------------------------------
 * Phase 1: Deep Focus (Idle resource generation - Earns "ENERGY")
 * Phase 2: Abyssal Breach (Active minigame to spend Energy. Wins yield Scrap/Merits)
 * * ==========================================
 * S-TIER: THE DOPAMINE KINGS (Single-thumb, hyper-action)
 * ==========================================
 * 1. Singularity Swell (Hole.io / Katamari) - Play as a micro-black hole. Absorb dust, grow, swallow derelict frigates. Spend Energy to expand gravity pull.
 * 2. Ouroboros Sweep (Snake.io) - Steer a junk-eater worm gathering a massive tail of debris. Spend Energy to magnetic-pull or ghost through walls.
 * 3. The Void Swarm (Bullet Heaven / Vampire Survivors) - Auto-fire, dodge, spend Energy for massive screen-clearing upgrades.
 * 4. Singularity Tether (Physics / Peggle) - Launch gravity bombs into floating ice-asteroids. Pure visual destruction.
 * 5. Supernova Escape (Endless Runner / Jetpack Joyride) - 1-tap boost dodging. Spend Energy to smash through obstacles.
 * 6. Quantum Matrix (Match-3 Combat) - Match nodes to fire lasers/heal. Chain reactions with "Grid Bombs".
 * * ==========================================
 * A-TIER: NATIVELY MOBILE & HIGH ACTION
 * ==========================================
 * 7. Vertical Arcade Hell (Twin Hawk/1942) - Drag to move, auto-shoot. Bullet-hell dodging and EMP bombs.
 * 8. Slipstream Run (Lane Racing) - Swipe left/right to dodge debris in a high-speed 3D tunnel.
 * 9. Singularity Forge (Rhythm/Clicker) - Tap to the beat to forge weapons. Focuses on perfect timing.
 * * ==========================================
 * B-TIER: SLOWER PACING (Good for variety)
 * ==========================================
 * 10. Tactical Draft (Auto-Battler) - Spend 1m drafting a fleet, watch them auto-battle a boss for 4m.
 * 11. Void Harpoon (Fishing/Extraction) - Drop a tether, dodge junk, hook an anomaly, reel it in.
 * 12. Railgun Assassin (Sniper) - Use "Bullet Time" to line up one perfect shot on a fast-moving rogue ship.
 * * ==========================================
 * C-TIER: THE ARCHIVE (Too much cognitive load for a 5-min break)
 * ==========================================
 * 13. Orbital Defense (Tower Defense) - Too much grid management.
 * 14. Dreadnought Artillery (Worms style) - Too much trajectory math.
 * 15. Grid Breach (Hacking Puzzle) - Frustrating if you can't solve it before the timer ends.
 * 16. Tactical Turn-Based (Deckbuilder) - Takes too long to build a satisfying engine.
 * 17. Command Deck (FTL Management) - Stressful UI management (putting out fires, rerouting power).
 */

/**
 * MINIGAME-MANAGER.JS
 * Intercepts focus completions, sets up viewport frameworks, and handles reward distributions.
 */

let minigameManager = {
    isActive: false,
    timer: 30,
    timerInterval: null,
    
    // Unified Session Exchange Metrics
    baseScrapPayload: 0,
    bonusScrapEarned: 0,
    ammoPool: 0,
    biome: null,
    isApexEvent: false
};

function triggerMinigameEncounter(duration, multiplier, isApex, energy, scrap) {
    exitCryoMode(); // Close focus screen
    
    // 1. Hydrate Manager Exchange Parameters
    minigameManager.isActive = true;
    minigameManager.timer = 30;
    minigameManager.ammoPool = energy || 100;
    minigameManager.baseScrapPayload = scrap || 0;
    minigameManager.bonusScrapEarned = 0;
    minigameManager.isApexEvent = isApex;
    minigameManager.biome = (typeof focusState !== 'undefined' && focusState.currentBiome) ? focusState.currentBiome : { id: 'VOID', color: '#a200ff', bg: 'radial-gradient(circle at bottom, #1a0033 0%, #000000 80%)' };
    
    // 2. Generate Screen Viewport Layer Scaffold
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'minigame-viewport';
    canvasContainer.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: ${minigameManager.biome.bg};
        z-index: 10000; overflow: hidden; display: flex; flex-direction: column;
        user-select: none; -webkit-user-select: none;
    `;
    
    canvasContainer.innerHTML = `
        <div style="position: absolute; top: 20px; left: 20px; right: 20px; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; z-index: 10005; font-family: monospace;">
            <div>
                <div style="color: ${minigameManager.biome.color}; font-size: 0.65rem; letter-spacing: 2px; text-transform: uppercase;">
                    ${minigameManager.isApexEvent ? 'APEX EVENT CRITICAL' : 'ENCOUNTER ACTIVE'} // BIOME: ${minigameManager.biome.id}
                </div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #fff; margin-top: 5px; text-shadow: 0 0 10px ${minigameManager.biome.color};">
                    VOID SWARM RESISTANCE
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 0.55rem; color: #888; letter-spacing: 1px;">EXTRACTION TIMELINE</div>
                <div id="game-clock" style="font-size: 2.5rem; font-weight: bold; color: #fff; text-shadow: 0 0 15px #ff3366;">30s</div>
            </div>
        </div>

        <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; display: flex; justify-content: space-between; align-items: center; pointer-events: none; z-index: 10005; font-family: monospace; background: rgba(0,0,0,0.6); padding: 12px 20px; border-radius: 4px; border: 1px solid ${minigameManager.biome.color}33;">
            <div style="display: flex; gap: 30px;">
                <div>
                    <span style="font-size: 0.6rem; color: #aaa; display:block;">ENERGY AMMO</span>
                    <span id="game-hud-ammo" style="font-size: 1.2rem; font-weight: bold; color: var(--accent); text-shadow: 0 0 5px var(--accent-glow);">${minigameManager.ammoPool}</span>
                </div>
                <div>
                    <span style="font-size: 0.6rem; color: #aaa; display:block;">CARGO RETRIEVED</span>
                    <span id="game-hud-scrap" style="font-size: 1.2rem; font-weight: bold; color: var(--captured); text-shadow: 0 0 5px var(--captured);">+0 SCRAP</span>
                </div>
            </div>
            <div style="font-size: 0.6rem; color: #666; letter-spacing: 1px;">GUIDE STARFIGHTER VIA CURSOR POSITION // AUTO-WEAPON DISCHARGE</div>
        </div>

        <canvas id="minigame-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
    `;
    
    document.body.appendChild(canvasContainer);
    
    // 3. Extract Canvas Elements and initialize the specified simulation script module
    const canvas = document.getElementById('minigame-canvas');
    const ctx = canvas.getContext('2d');
    
    if (typeof voidSwarm !== 'undefined') {
        voidSwarm.init(canvas, ctx, minigameManager.biome, minigameManager.isApexEvent, minigameManager.ammoPool);
    }
    
    // 4. Fire Manager Timing Intervals
    minigameManager.timerInterval = setInterval(() => {
        minigameManager.timer--;
        
        const clockEl = document.getElementById('game-clock');
        if (clockEl) clockEl.innerText = `${minigameManager.timer}s`;
        
        if (minigameManager.timer <= 0) {
            wrapUpActiveEncounter();
        }
    }, 1000);
}

function wrapUpActiveEncounter() {
    minigameManager.isActive = false;
    clearInterval(minigameManager.timerInterval);
    
    // Extract residual data caches directly out of the simulation loop
    if (typeof voidSwarm !== 'undefined') {
        voidSwarm.terminate();
        minigameManager.bonusScrapEarned = voidSwarm.bonusScrapEarned;
        minigameManager.ammoPool = voidSwarm.ammoPool;
    }
    
    // Reconcile and add yields directly to global profile state banks
    const totalScrapSecured = minigameManager.baseScrapPayload + minigameManager.bonusScrapEarned;
    if (typeof state !== 'undefined') {
        state.scrap += minigameManager.baseScrapPayload + minigameManager.bonusScrapEarned;
        if (typeof addEnergy === 'function') {
            addEnergy(minigameManager.ammoPool);
        } else {
            state.energy += minigameManager.ammoPool;
        }
    }
    
    if (typeof save === 'function') save();
    if (typeof updateHUD === 'function') updateHUD();
    
    // Display payload summary modal
    const summary = document.createElement('div');
    summary.className = 'modal-overlay warp-transition';
    summary.style.cssText = `display: flex; z-index: 10010; font-family: monospace; background: rgba(0,0,3,0.9);`;
    
    summary.innerHTML = `
        <div class="modal-content" style="border: 1px solid ${minigameManager.biome.color}; background: #000; padding: 30px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 0 40px ${minigameManager.biome.color}33;">
            <div style="color: ${minigameManager.biome.color}; font-size: 0.7rem; letter-spacing: 3px; font-weight: bold; margin-bottom: 5px;">EXTRACTION COMPLETE</div>
            <h2 class="view-main-title" style="font-size: 1.4rem; color: #fff; margin-bottom: 20px;">MISSION RESULTS</h2>
            
            <div class="terminal-console" style="text-align: left; padding: 15px; border-color: ${minigameManager.biome.color}44; background: rgba(0,0,0,0.4); margin-bottom: 25px; line-height: 1.6; font-size: 0.75rem; color: #ccc;">
                <div>> BIOME STATUS: <span style="color:${minigameManager.biome.color}; font-weight:bold;">${minigameManager.biome.id} RECLAIMED</span></div>
                <div>> BASE HARVEST EXTRACTION: <span style="color:#fff;">+${minigameManager.baseScrapPayload} SCRAP</span></div>
                <div>> COMBAT ENGAGEMENT BONUS: <span style="color:var(--captured);">+${minigameManager.bonusScrapEarned} SCRAP</span></div>
                <div style="border-top: 1px dashed #444; margin: 8px 0; padding-top: 8px;">> TOTAL RESISTED PAYLOAD: <span style="color:var(--captured); font-weight:bold;">+${totalScrapSecured} SCRAP</span></div>
                <div>> RETAINED SHIELD ENERGY: <span style="color:var(--accent); font-weight:bold;">+${minigameManager.ammoPool} ENERGY</span></div>
            </div>
            
            <button type="button" class="success-btn" onclick="teardownMinigameOverlay(this)" style="width: 100%; padding: 12px; background: ${minigameManager.biome.color}; color: #000; font-weight: bold; border: none; font-size: 0.85rem; letter-spacing: 2px; box-shadow: 0 0 15px ${minigameManager.biome.color}; cursor: pointer; border-radius: 2px;">RETURN TO BRIDGE</button>
        </div>
    `;
    document.body.appendChild(summary);
}

function teardownMinigameOverlay(btn) {
    btn.closest('.modal-overlay').remove();
    const viewport = document.getElementById('minigame-viewport');
    if (viewport) viewport.remove();
    
    if (typeof state !== 'undefined') state.level = 1; 
    if (typeof render === 'function') render();
}
