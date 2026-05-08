
// [ UPGRADED ] The Void Pantheon Lore Dictionary
const PANTHEON_DATA = {
    1: { 
        name: "GENESIS SPHERE", color: "#00d4ff", 
        deities: [
            {
                k:'kaelenTor', n:'Kaelen-Tor', title: 'The Star-Forge', icon: '◉',
                sectors: [
                    { 
                        id: 1, name: "Ignition Core", 
                        // A Square-Forge constellation
                        coords: [{x:30,y:30}, {x:70,y:30}, {x:70,y:70}, {x:30,y:70}, {x:50,y:50}],
                        perk: "MAGNETISM: +2% Base Yields"
                    },
                    { 
                        id: 2, name: "Pulsar Hammer", 
                        // A T-shape anvil constellation
                        coords: [{x:20,y:20}, {x:50,y:20}, {x:80,y:20}, {x:50,y:50}, {x:50,y:80}],
                        perk: "TEMPERING: Forge failure rate -5%"
                    },
                    { 
                        id: 3, name: "The Great Split", isBranch: true,
                        // Branching paths: Alpha (Efficiency) or Omega (Power)
                        paths: [
                            { id: 1, n: "Alpha: Cold-Forging", perk: "Offerings cost -10% Scrap", coords: [{x:20,y:50}, {x:40,y:40}, {x:60,y:40}, {x:80,y:50}, {x:50,y:20}] },
                            { id: 2, n: "Omega: Over-Heating", perk: "Bonus Yields +10%", coords: [{x:20,y:50}, {x:40,y:60}, {x:60,y:60}, {x:80,y:50}, {x:50,y:80}] }
                        ]
                    }
                ],
                major: { n: "THE MIDAS DRIVE", cost: 50, desc: "Convert 10% of lifetime Energy into a one-time Scrap payout." }
            }
            {k:'aethelgard', n:'Aethelgard', title: 'The Weaver of Eons', icon: '✷', 
             minor: "TEMPORAL VELOCITY: Grants +5% bonus Scrap for targets secured before their 24h warning per Offering.", 
             major: "CHRONOS SHIFT: Once per week, instantly advance your Pilot Level by 1 without filling the Capacitor." },
            {k:'valerium', n:'Valerium', title: 'The Aegis Warden', icon: '⎔', 
             minor: "AEGIS PLATING: Reduces the Energy penalty of Overdue tasks by 1 point per Offering.", 
             major: "WARDEN'S GRACE: Automatically generates a Sub-Routine Shield on Decaying tasks, restoring lost penalty Energy upon first action." }
        ] 
    },
    2: { 
        name: "THE ABYSSAL SYNDICATE", color: "#ffd700", // Updated to Gold/Yellow
        deities: [
            // Deconstructed Aetherial Eye (⎊)
            {k:'syraxis', n:'Syraxis', title: 'The Shadow-Walker', icon: '◯', 
             minor: "UNDERWORLD CONNECTIONS: Black Market exchange rates improve by 4% per Offering.", 
             major: "THE SMUGGLER'S TOLL: Hires a permanent, phantom-operative that slowly generates a drip-feed of Scrap while offline." },
            {k:'ignisKor', n:'Ignis-Kor', title: 'The Reality Shaper', icon: '▵', 
             minor: "EXTENDED VOLATILITY: Temporary Forge buffs last 1 hour longer per Offering.", 
             major: "QUANTUM LOOP: 33% chance the universe loops when crafting, refunding the entire Scrap cost immediately." },
            {k:'morvath', n:'Morvath', title: 'The Void Hunter', icon: '◈', 
             minor: "BLOOD MONEY: Daily Bounty payouts increased by +5% per Offering.", 
             major: "THE APEX CONTRACT: Completing a Daily Bounty guarantees an 'Obliteration Token' to wipe one Critical task without penalty." }
        ] 
    },
    3: { 
        name: "THE CELESTIAL VANGUARD", color: "#ff00ff", // Updated to Magenta
        deities: [
            // Deconstructed Oblivion Cascade (❖)
            {k:'ragnarath', n:'Ragnarath', title: 'The Dread-Caller', icon: '◇', 
             minor: "KINETIC PIERCING: Increases kinetic damage to Boss Target shields per Offering.", 
             major: "THE ORBITAL STRIKE: Once a week, instantly obliterate a Boss Target without completing its sub-routines." },
            {k:'luminara', n:'Luminara', title: 'The Cosmic Veil', icon: '✕', 
             minor: "ION RESISTANCE: Reduces Energy drain from hostile Encounters per Offering.", 
             major: "THE VEIL OF LIGHT: Taking damage from an Encounter has a 33% chance to be absorbed and converted into Bonus Energy." },
            {k:'xerxes', n:'Xerxes', title: 'The Harvester of Suns', icon: '⸬', 
             minor: "ANOMALY DETECTION: Rare encounters spawn more frequently per Offering.", 
             major: "THE SUN-EATER: Fully clearing a Sector permanently boosts that Sector's baseline rewards by 25%." }
        ] 
    }
};
