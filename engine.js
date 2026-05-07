/**
 * ENGINE.JS
 * The ship's central processing unit. 
 * Handles data, mechanics, and system state.
 */

// --- CORE UTILITIES ---

function triggerHaptic(pattern) {
    if (state.hapticsEnabled && "vibrate" in navigator) { 
        navigator.vibrate(pattern); 
    }
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
    const activeMissions = (existingMissions || []).filter(m => !m.captured);
    const activeWire = activeMissions.slice(-8);
    const margin = 15;
    const usableSpace = 70;
    
    if (activeMissions.length === 0) {
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

    for (let attempts = 0; attempts < 1000; attempts++) {
        let x = margin + (Math.random() * usableSpace);
        let y = margin + (Math.random() * usableSpace);
        const newNode = { x, y };
        let safe = true;

        for (let m of activeMissions) {
            let d = Math.sqrt((m.x - x)**2 + (m.y - y)**2);
            if (d < 15) { safe = false; break; }
        }
        if (!safe) continue;

        let score = Math.random() * 100; 
        if (score > bestScore) {
            bestScore = score;
            bestCandidate = newNode;
        }
    }
    return bestCandidate || { x: 50, y: 50 };
}

// --- TIME MECHANICS ---

function getHorizonFromDate(dateStr, fallbackHorizon) {
    if (!dateStr) return fallbackHorizon || 'TRAJECTORY';
    const today = new Date(); today.setHours(0,0,0,0);
    let d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) d = new Date(dateStr.replace(/-/g, '/') + ' 00:00:00');
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
                if (m && !m.captured && m.dueDate) {
                    let t = m.dueTime || "23:59:59";
                    let deadline = new Date(`${m.dueDate}T${t}`);
                    const diffHrs = (deadline - now) / (1000 * 60 * 60);
                    const diffDays = Math.ceil(diffHrs / 24);
                    if (diffHrs < 0 && !m.overdue) addEnergy(-10);
                    m.overdue = diffHrs < 0; 
                    m.warningLevel = diffHrs <= 24 ? 24 : (diffHrs <= 48 ? 48 : 0);
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
    if (levelR) {
        levelR.innerText = hasDecay ? "CRITICAL DECAY" : `PILOT LEVEL ${state.playerLevel}`;
        levelR.className = hasDecay ? "hud-level-text hud-warning" : "hud-level-text";
    }
}

// --- MISSION LOGIC ---

function toggleSubTask(idx) { 
    const m = safelyGetActiveMission(); 
    if (m?.subs[idx]) { 
        m.subs[idx].c = !m.subs[idx].c; 
        if (m.subs[idx].c) { triggerHaptic(30); addEnergy(5); } 
        else addEnergy(-5); 
        save(); render(); 
    } 
}

function completeMission() { 
    const m = safelyGetActiveMission(); 
    if (m) { 
        m.captured = true; 
        m.completionTimestamp = Date.now(); 
        addEnergy(25); 
        triggerHaptic([50, 30, 50]); 
        save(); state.level = 3; render(); 
    } 
}

function deleteMission(id) { 
    if(confirm("Destroy?")) { 
        HORIZONS.forEach(h => { 
            if(state.missions[state.sectorId]?.[h]) {
                state.missions[state.sectorId][h] = state.missions[state.sectorId][h].filter(m => m.id !== id); 
            }
        }); 
        save(); state.level = 3; render(); 
    } 
}

function safelyGetActiveMission() {
    if(!state.sectorId || !state.missions[state.sectorId]) return null;
    for (let h of HORIZONS) { 
        const found = state.missions[state.sectorId][h].find(x => x.id === state.activeMissionId); 
        if (found) { state.horizon = h; return found; } 
    }
    return null;
}

// --- DATABASE MIGRATION & INIT ---

function runDatabaseMigration() {
    state.sectors.forEach(s => {
        if (!state.missions[s.id]) state.missions[s.id] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]};
        HORIZONS.forEach(h => {
            if (!state.missions[s.id][h]) state.missions[s.id][h] = [];
            state.missions[s.id][h].forEach(m => {
                if (m.encounterId === undefined) m.encounterId = Math.floor(Math.random() * ENCOUNTER_TYPES.length);
            });
        });
    });
    save();
}

runDatabaseMigration(); 
generateStarfield(); 
render();
setInterval(render, 60000);
window.addEventListener('resize', () => { if(state.level === 1) render(); });
