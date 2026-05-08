const HORIZONS = ['TRAJECTORY', 'HORIZON', 'IMMINENT'];
const AUTO_PALETTE = ['#00e5ff', '#ffd700', '#ff00ff', '#00ff88', '#ff3366', '#a200ff', '#00ffcc', '#ff9900'];

const defaultSectors = [
    { id: 'sec_career', name: 'CAREER', color: '#00e5ff', seed: {x: 0.3, y: 0.3} },
    { id: 'sec_finance', name: 'FINANCIAL', color: '#ffd700', seed: {x: 0.7, y: 0.3} },
    { id: 'sec_personal', name: 'PERSONAL', color: '#ff00ff', seed: {x: 0.5, y: 0.7} }
];

let state = {
    level: 1, 
    sectorId: null, 
    horizon: null, 
    activeMissionId: null,
    playerLevel: parseInt(localStorage.getItem('playerLevel')) || 1,
        offerings: 0, // [ NEW ] The currency for the Void Pantheon
    energy: parseInt(localStorage.getItem('energy')) || 0,
    hapticsEnabled: localStorage.getItem('hapticsEnabled') !== 'false',
    sectors: JSON.parse(localStorage.getItem('sectors')) || [...defaultSectors],
    missions: JSON.parse(localStorage.getItem('missions')) || {},
    shipPos: { x: 50, y: 50 },
    // [ UPGRADED ] Grants 500 Scrap on a fresh boot
    scrap: localStorage.getItem('scrap') !== null ? parseInt(localStorage.getItem('scrap')) : 500,
    // [ UPGRADED ] The Perfect 10 Module Manifest
    shipParts: JSON.parse(localStorage.getItem('shipParts')) || {
        magnet: 1, reactor: 1, habitat: 1, hull: 1, shields: 1,
        comms: 1, thrusters: 1, sinks: 1, sensors: 1, cells: 1
        offerings: 0,
    pantheon: {
        // Ascension I
        kaelenTor: 0, aethelgard: 0, valerium: 0,
        // Ascension II
        syraxis: 0, ignisKor: 0, morvath: 0,
        // Ascension III
        ragnarath: 0, luminara: 0, xerxes: 0,
        // Keystones (0 = locked, 1 = unlocked)
        keystones: {
            midasDrive: 0, chronosShift: 0, wardensGrace: 0,
            smugglersToll: 0, quantumLoop: 0, apexContract: 0,
            orbitalStrike: 0, veilOfLight: 0, sunEater: 0
        }
    }
};

let editModeId = null;
let defaultHorizonContext = null;
let isHorizonFixed = false;
let tempSubtasks = [];
let editingSectors = [];
