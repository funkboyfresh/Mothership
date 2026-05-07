//
const HORIZONS = ['TRAJECTORY', 'HORIZON', 'IMMINENT'];
const AUTO_PALETTE = ['#00e5ff', '#ffd700', '#ff00ff', '#00ff88', '#ff3366', '#a200ff', '#00ffcc', '#ff9900'];
// ... (rest of constants and state object)
let editModeId = null;
let defaultHorizonContext = null;
let isHorizonFixed = false;
let tempSubtasks = [];
let editingSectors = [];
