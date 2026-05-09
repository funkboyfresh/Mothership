/**
 * PANTHEON-ENGINE.JS
 * Handles data mutation and cost logic for the Void Pantheon.
 */

function investOffering(deityKey, towerId) {
    const currentLevel = state.pantheon[deityKey];
    const isKeystoneNode = (currentLevel + 1) % 6 === 0;
    const isMajorNode = currentLevel === 30;
    
    // Your custom pricing structure
    let cost = 1;
    if (isMajorNode) cost = 50;
    else if (isKeystoneNode) cost = 10;

    if (state.offerings >= cost && currentLevel < 31) {
        state.offerings -= cost;
        state.pantheon[deityKey]++;
        
        if (typeof triggerHaptic === 'function') triggerHaptic([50, 100, 50]);
        save();
        
        // 1. Force the main tower spire in the background to update immediately
        if (typeof renderAscensionTower === 'function') {
            renderAscensionTower(towerId);
        }
        
        // 2. Determine which sector map the player was just looking at
        const newTotal = state.pantheon[deityKey];
        const sectorIndex = Math.floor((newTotal - 1) / 6); 
        
        // 3. Instantly redraw the constellation modal so the node lights up right before your eyes
        if (typeof openConstellation === 'function') {
            openConstellation(deityKey, towerId, sectorIndex);
        }

    } else {
        if (typeof showSoftWarning === 'function') {
            showSoftWarning(`THE VOID DEMANDS MORE OFFERINGS. (${cost} REQ)`);
        } else {
            alert(`THE VOID DEMANDS MORE OFFERINGS. (${cost} REQ)`);
        }
    }
}
