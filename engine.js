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
    localStorage.setItem('scrap', state.scrap);
    localStorage.setItem('shipParts', JSON.stringify(state.shipParts));
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

/**
 * [ PATCHED ] Counter-Clockwise helper for line intersection math.
 */
function ccw(A, B, C) {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

/**
 * [ PATCHED ] Determines if two mission-link segments cross.
 */
function doLinesIntersect(p1, q1, p2, q2) {
    return ccw(p1, q1, p2) !== ccw(p1, q1, q2) && ccw(p2, q2, p1) !== ccw(p2, q2, q1);
}

function getDistanceToSegment(p, a, b) {
    const l2 = (a.x - b.x)**2 + (a.y - b.y)**2;
    if (l2 === 0) return Math.sqrt((p.x - a.x)**2 + (p.y - a.y)**2);
    let t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2));
    return Math.sqrt((p.x - (a.x + t * (b.x - a.x)))**2 + (p.y - (a.y + t * (b.y - a.y)))**2);
}

function getSafeCoordinates(existingMissions) {
    const activeMissions = (existingMissions || []).filter(m => !m.captured);
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

function generateDefaultMission(sectorName, horizon) {
    let tName = `${horizon} PROTOCOL: ${sectorName.toUpperCase()}`;
    let sub1 = "Establish primary objective", sub2 = "Allocate sector resources", sub3 = "Commence routine tracking";
    
    let sec = sectorName.toUpperCase();
    if (sec.includes('CAREER')) { tName = `${horizon} CAREER MILESTONE`; sub1 = "Audit professional ledger"; sub2 = "Define growth metrics"; sub3 = "Execute networking protocol"; }
    else if (sec.includes('FINANC')) { tName = `${horizon} FISCAL BASELINE`; sub1 = "Audit capital reserves"; sub2 = "Review recurring liabilities"; sub3 = "Project quarterly growth"; }
    else if (sec.includes('PERSONAL')) { tName = `${horizon} VITALITY METRICS`; sub1 = "Assess physical readiness"; sub2 = "Schedule downtime cycle"; sub3 = "Review personal goals"; }

    return { 
        id: Date.now() + Math.floor(Math.random() * 1000), 
        name: tName, 
        subs: [ {t: sub1, c: false}, {t: sub2, c: false}, {t: sub3, c: false} ], 
        x: undefined, y: undefined, dueDate: null, dueTime: null, 
        captured: false, overdue: false, warningLevel: 0,
        encounterId: Math.floor(Math.random() * ENCOUNTER_TYPES.length) 
    };
}

// --- MISSION LOGIC ---

function toggleSubTask(idx) { 
    const m = safelyGetActiveMission(); 
    if (m?.subs[idx]) { 
        m.subs[idx].c = !m.subs[idx].c; 
        if (m.subs[idx].c) { 
            triggerHaptic(30); 
            addEnergy(5); 
            // Award Scrap
            state.scrap += 1; 
        } else { 
            addEnergy(-5); 
            state.scrap = Math.max(0, state.scrap - 1);
        } 
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

function zoomOut() { 
    state.level = Math.max(1, state.level - 1); 
    if (state.level === 1) { 
        state.sectorId = null; 
        state.horizon = null; 
    } 
    render(); 
}

//
function saveTaskModal() {
    const name = document.getElementById('modal-task-name').value.trim(); 
    if (!name) { showSoftWarning("MISSION MUST BE NAMED"); return; }
    
    const h = isHorizonFixed ? defaultHorizonContext : document.getElementById('modal-horizon-select').value;
    const dateStr = document.getElementById('modal-task-date').value;
    const timeStr = document.getElementById('modal-task-time')?.value || null;
    const finalH = getHorizonFromDate(dateStr, h);
    
    const hzMissions = (state.missions[state.sectorId]?.[finalH]) || [];
    const activeCount = hzMissions.filter(m => !m.captured).length;
    
    if (!editModeId && activeCount >= 6) { 
        showSoftWarning("TARGET LIMIT REACHED (6/6).\nCOMPLETE ACTIVE MISSIONS TO OPEN NEW TRAJECTORIES."); 
        return; 
    }

    if (!state.missions[state.sectorId]) {
        state.missions[state.sectorId] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]};
    }

    if (editModeId) {
        HORIZONS.forEach(hz => {
            const idx = state.missions[state.sectorId][hz].findIndex(m => m.id === editModeId);
            if (idx !== -1) {
                const m = state.missions[state.sectorId][hz][idx];
                m.name = name; m.dueDate = dateStr || null; m.dueTime = timeStr;
                m.subs = tempSubtasks.filter(t => t.trim()).map(t => ({t, c: false}));
                if (hz !== finalH) {
                    state.missions[state.sectorId][finalH].push(state.missions[state.sectorId][hz].splice(idx, 1)[0]);
                }
            }
        });
    } else {
        const coords = getSafeCoordinates(hzMissions);
        state.missions[state.sectorId][finalH].push({
            id: Date.now(), name, 
            subs: tempSubtasks.filter(t => t.trim()).map(t => ({t, c: false})),
            x: coords.x, y: coords.y, dueDate: dateStr || null, dueTime: timeStr,
            captured: false, overdue: false, warningLevel: 0,
            encounterId: Math.floor(Math.random() * ENCOUNTER_TYPES.length)
        });
    }
    
    save(); 
    closeTaskModal(); 
    render();
}

function safelyGetActiveMission() {
    if(!state.sectorId || !state.missions[state.sectorId]) return null;
    for (let h of HORIZONS) { 
        const found = state.missions[state.sectorId][h].find(x => x.id === state.activeMissionId); 
        if (found) { state.horizon = h; return found; } 
    }
    return null;
}

/**
 * [ PATCHED ] Determines the visual perspective for Level 4.
 */
function getEncounterViewMode(encounterId) {
    const externalCats = [0, 1, 2, 3, 5, 7, 8, 9, 14, 15, 16, 18, 19]; 
    const categoryIndex = Math.floor(encounterId / 20);
    return externalCats.includes(categoryIndex) ? 'external' : 'internal';
}

function openTaskModal(h, f) { 
    const hzMissions = (state.missions[state.sectorId]?.[h]) || [];
    if (hzMissions.filter(m => !m.captured).length >= 6) { showSoftWarning("TARGET LIMIT REACHED (6/6)"); return; }
    editModeId = null; defaultHorizonContext = h; isHorizonFixed = f;
    document.getElementById('modal-task-name').value = ''; 
    document.getElementById('modal-horizon-select').value = h; 
    document.getElementById('modal-horizon-group').style.display = f ? 'none' : 'block'; 
    tempSubtasks = ['', '', '']; renderModalSubtasks(); 
    document.getElementById('task-modal-overlay').style.display = 'flex'; 
}

function closeTaskModal() { document.getElementById('task-modal-overlay').style.display = 'none'; }

function renderModalSubtasks() {
    const list = document.getElementById('modal-subtasks-list'); 
    if(!list) return; list.innerHTML = '';
    tempSubtasks.forEach((sub, i) => {
        list.insertAdjacentHTML('beforeend', `<div class="subtask-row"><input type="text" class="modal-input" value="${sub}" oninput="tempSubtasks[${i}] = this.value"><button class="subtask-remove-minimal" onclick="tempSubtasks.splice(${i}, 1); renderModalSubtasks();">−</button></div>`);
    });
}

function addModalSubtask() { if (tempSubtasks.length < 10) { tempSubtasks.push(''); renderModalSubtasks(); } }

function togglePilotLog() {
    let logModal = document.getElementById('pilot-log-modal');
    if (!logModal) {
        logModal = document.createElement('div'); logModal.id = 'pilot-log-modal'; logModal.className = 'modal-overlay';
        logModal.onclick = (e) => { if(e.target === logModal) logModal.style.display = 'none'; }; 
        document.body.appendChild(logModal);
    }
    let allLogs = [];
    state.sectors.forEach(s => HORIZONS.forEach(h => (state.missions[s.id]?.[h] || []).forEach(m => { if (m.captured) allLogs.push(m); })));
    allLogs.sort((a, b) => b.completionTimestamp - a.completionTimestamp);
    logModal.innerHTML = `<div class="modal-box"><div class="modal-header">PILOT FLIGHT LOG</div><div class="subtasks-container">${allLogs.map(m => `<div class="log-entry">${m.name} [SECURED]</div>`).join('')}</div><button class="mod-btn" onclick="this.closest('.modal-overlay').style.display='none'">DISMISS</button></div>`;
    logModal.style.display = 'flex';
}
// Add the missing saveTaskModal from our previous turn here too!

// --- DATABASE MIGRATION & INIT ---

//
function runDatabaseMigration() {
    let migrated = false;
    state.sectors.forEach(s => {
        if (!state.missions[s.id]) {
            state.missions[s.id] = {TRAJECTORY:[], HORIZON:[], IMMINENT:[]};
            HORIZONS.forEach(h => {
                state.missions[s.id][h].push(generateDefaultMission(s.name, h));
            });
            migrated = true;
        }
        HORIZONS.forEach(h => {
            if (!state.missions[s.id][h]) { state.missions[s.id][h] = []; migrated = true; }
            
            // [ PATCHED ] Assign coordinates to nodes that are missing them (Premade Nodes)
            state.missions[s.id][h].forEach((m, index, arr) => {
                if (m.x === undefined || isNaN(m.x)) {
                    let coords = getSafeCoordinates(arr.slice(0, index));
                    m.x = coords.x; 
                    m.y = coords.y; 
                    migrated = true;
                }
                if (m.encounterId === undefined) {
                    m.encounterId = Math.floor(Math.random() * ENCOUNTER_TYPES.length);
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

setInterval(render, 60000);

window.addEventListener('resize', () => { 
    if(state.level === 1) render(); 
});

/** [ PATCHED ] Soft Warning event listener for UI stability.*/
window.addEventListener('click', (e) => {
    const toast = document.getElementById('soft-warning-toast');
    if (toast && toast.classList.contains('show')) {
        toast.classList.remove('show');
    }
});
