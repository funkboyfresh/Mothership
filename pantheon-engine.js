
function investOffering(deityKey, towerId) {
    const currentLevel = state.pantheon[deityKey];
    const isKeystoneNode = (currentLevel + 1) % 6 === 0;
    const isMajorNode = currentLevel === 30;
    
    let cost = 1;
    if (isMajorNode) cost = 50;
    else if (isKeystoneNode) cost = 10;

    if (state.offerings >= cost && currentLevel < 31) {
        state.offerings -= cost;
        state.pantheon[deityKey]++;
        
        triggerHaptic(50);
        save();
        
        // Re-render the UI
        renderAscensionTower(towerId);
    } else {
        showSoftWarning("THE VOID DEMANDS MORE OFFERINGS");
    }
}
