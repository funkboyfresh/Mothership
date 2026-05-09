/**
 * PANTHEON-ENGINE.JS
 * Handles data mutation and cost logic for the Void Pantheon.
 */

function investOffering(deityKey, towerId) {
    // [ FIXED ] Added fallback to 0 if the deity is newly added to the save file
    const currentLevel = state.pantheon[deityKey] || 0; 
    
    const isKeystoneNode = (currentLevel + 1) % 6 === 0;
    const isMajorNode = currentLevel === 30;
    
    let cost = 1;
    if (isMajorNode) cost = 50;
    else if (isKeystoneNode) cost = 5;

    if (state.offerings >= cost && currentLevel < 31) {
        state.offerings -= cost;
        // [ FIXED ] Safely increment from the current level
        state.pantheon[deityKey] = currentLevel + 1; 
        
        if (typeof triggerHaptic === 'function') triggerHaptic([50, 100, 50]);
        if (typeof save === 'function') save();
        
        if (typeof renderAscensionTower === 'function') {
            renderAscensionTower(towerId);
        }
        
        const newTotal = state.pantheon[deityKey];
        const sectorIndex = Math.floor((newTotal - 1) / 6); 
        
        if (typeof openConstellation === 'function' && !isMajorNode) {
            openConstellation(deityKey, towerId, Math.min(sectorIndex, 4));
        }

    } else {
        if (typeof showSoftWarning === 'function') {
            showSoftWarning(`THE VOID DEMANDS MORE OFFERINGS. (${cost} REQ)`);
        } else {
            alert(`THE VOID DEMANDS MORE OFFERINGS. (${cost} REQ)`);
        }
    }
}
