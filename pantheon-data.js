// [ MASTER BUILD ] The Void Pantheon Lore Dictionary
const PANTHEON_DATA = {
    1: { 
        name: "GENESIS SPHERE", color: "#00d4ff", 
        deities: [
            {
                k:'kaelenTor', n:'Kaelen-Tor', title: 'The Star-Forge', icon: '◉',
                starBuff: "Micro-Forge: Permanently increases baseline Scrap yield by +0.5% per star activated.",
                sectors: [
                    { id: 1, name: "Ignition Core", keystone: "Spark of Genesis", isBranch: false, coords: [{x:50,y:90,r:1,t:1}, {x:30,y:70,r:2,t:0}, {x:50,y:50,r:2,t:1}, {x:70,y:40,r:3,t:0}, {x:50,y:30,r:3,t:1}, {x:30,y:20,r:4,t:1}, {x:70,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "MAGNETISM: +2% Base Yields" },
                    { id: 2, name: "Pulsar Hammer", keystone: "Rhythmic Strike", isBranch: false, coords: [{x:20,y:80,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:80,y:60,r:3,t:1}, {x:50,y:40,r:4,t:1}, {x:20,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "TEMPERING: Forge failure rate -5%" },
                    { id: 3, name: "The Great Split", keystone: "Thermal Expansion", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "SPLIT DYNAMICS: Advanced Forging Mechanics."
                    },
                    { id: 4, name: "Anvil Peak", keystone: "Structural Reinforcement", isBranch: true, 
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "REINFORCEMENT: Scrap payout +5%" 
                    },
                    { id: 5, name: "Solar Crucible", keystone: "Heart of the Star", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:20,y:70,r:2,t:1}, {x:20,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:50,y:30,r:4,t:1}, {x:50,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:80,y:70,r:2,t:1}, {x:80,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "FORGE-MASTER: +1% Critical Craft chance" 
                    }
                ],
                major: { n: "THE MIDAS DRIVE", cost: 50, desc: "Convert 10% of lifetime Energy into a massive one-time Scrap payout." }
            },
            {
                k:'aethelgard', n:'Aethelgard', title: 'The Weaver of Eons', icon: '✷',
                starBuff: "Temporal Shard: Mission warning alerts trigger 5 minutes earlier per star activated.",
                sectors: [
                    { id: 1, name: "Temporal Pulse", keystone: "First Breath", isBranch: false, coords: [{x:10,y:50,r:1,t:1}, {x:30,y:50,r:2,t:1}, {x:40,y:20,r:3,t:0}, {x:50,y:80,r:3,t:1}, {x:60,y:50,r:4,t:0}, {x:80,y:50,r:4,t:1}, {x:90,y:50,r:5,t:1}, {x:95,y:50,r:6,t:2}], perk: "VELOCITY: +1% Scrap on fast clears" },
                    { id: 2, name: "The Hourglass", keystone: "Falling Sands", isBranch: false, coords: [{x:25,y:20,r:1,t:1}, {x:75,y:20,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:25,y:80,r:4,t:1}, {x:75,y:80,r:5,t:1}, {x:50,y:85,r:6,t:2}], perk: "SAND-SHIFT: Warning alerts +2h" },
                    { id: 3, name: "Timeline Fork", keystone: "The Choice", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "CHRONO-SPLIT: Target timers -10% slower"
                    },
                    { id: 4, name: "The Pendulum", keystone: "Momentum Swing", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "MOMENTUM: Consecutive tasks grant +1% Energy" 
                    },
                    { id: 5, name: "Infinity Knot", keystone: "Eternal Loop", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:20,y:70,r:2,t:1}, {x:20,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:50,y:30,r:4,t:1}, {x:50,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:80,y:70,r:2,t:1}, {x:80,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "ETERNAL LOOP: Targets have 5% chance to auto-respawn" 
                    }
                ],
                major: { n: "CHRONOS SHIFT", cost: 50, desc: "Instantly advance Pilot Level by 1 without filling Capacitor." }
            },
            {
                k:'valerium', n:'Valerium', title: 'The Aegis Warden', icon: '⎔',
                starBuff: "Plating Fragment: Reduces the Energy penalty of Overdue tasks by 0.2 points per star.",
                sectors: [
                    { id: 1, name: "Bulwark Base", keystone: "Iron Will", isBranch: false, coords: [{x:50,y:90,r:1,t:1}, {x:30,y:70,r:2,t:0}, {x:50,y:50,r:2,t:1}, {x:70,y:40,r:3,t:0}, {x:50,y:30,r:3,t:1}, {x:30,y:20,r:4,t:1}, {x:70,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "PLATING: -1 Overdue Penalty" },
                    { id: 2, name: "Aegis Wall", keystone: "Deflection Grid", isBranch: false, coords: [{x:20,y:80,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:80,y:60,r:3,t:1}, {x:50,y:40,r:4,t:1}, {x:20,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "DEFLECTION: 5% lower Energy loss" },
                    { id: 3, name: "Shield Specialization", keystone: "Kinetic Absorption", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "SHIELD MATRIX: Kinetic mechanics."
                    },
                    { id: 4, name: "Phalanx Array", keystone: "Vanguard Formation", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "GUARD: Shield Sub-Routines +10% strength" 
                    },
                    { id: 5, name: "Bastion Peak", keystone: "Immortal Warden", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:20,y:70,r:2,t:1}, {x:20,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:50,y:30,r:4,t:1}, {x:50,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:80,y:70,r:2,t:1}, {x:80,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "IMMORTAL WARDEN: Energy never drops below 1" 
                    }
                ],
                major: { n: "WARDEN'S GRACE", cost: 50, desc: "Auto-generate Sub-Routine Shields on Decaying tasks." }
            }
        ] 
    },
    2: { 
        name: "THE ABYSSAL SYNDICATE", color: "#ffd700", 
        deities: [
            {
                k:'syraxis', n:'Syraxis', title: 'The Shadow-Walker', icon: '◯',
                starBuff: "Shadow Step: Offline generation rate increased by +0.5% per star.",
                sectors: [
                    { id: 1, name: "Shadow Blade", keystone: "First Strike", isBranch: false, coords: [{x:50,y:90,r:1,t:1}, {x:30,y:70,r:2,t:0}, {x:50,y:50,r:2,t:1}, {x:70,y:40,r:3,t:0}, {x:50,y:30,r:3,t:1}, {x:30,y:20,r:4,t:1}, {x:70,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "UNDERWORLD: +2% Market Rate" },
                    { id: 2, name: "Veil of Mist", keystone: "Smoke Screen", isBranch: false, coords: [{x:20,y:80,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:80,y:60,r:3,t:1}, {x:50,y:40,r:4,t:1}, {x:20,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "CLOAK: Hidden bounty payouts +5%" },
                    { id: 3, name: "The Silent Fork", keystone: "Assassin's Path", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:45,y:40,r:4,t:0}, {x:35,y:30,r:4,t:1}, {x:25,y:20,r:5,t:1}, {x:15,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:55,y:40,r:4,t:0}, {x:65,y:30,r:4,t:1}, {x:75,y:20,r:5,t:1}, {x:85,y:10,r:6,t:2}]
                        ], perk: "Mission travel cost -1 Energy"
                    },
                    { id: 4, name: "The Eclipse", keystone: "Total Darkness", isBranch: true, 
                        paths: [
                            [{x:50,y:80,r:1,t:1}, {x:30,y:75,r:2,t:0}, {x:20,y:50,r:2,t:1}, {x:30,y:25,r:3,t:0}, {x:50,y:20,r:3,t:1}, {x:40,y:35,r:4,t:1}, {x:45,y:45,r:5,t:1}, {x:50,y:50,r:6,t:2}],
                            [{x:50,y:80,r:1,t:1}, {x:70,y:75,r:2,t:0}, {x:80,y:50,r:2,t:1}, {x:70,y:25,r:3,t:0}, {x:50,y:20,r:3,t:1}, {x:60,y:35,r:4,t:1}, {x:55,y:45,r:5,t:1}, {x:50,y:50,r:6,t:2}]
                        ], perk: "VOID-SIGHT: Rare encounters +2%" 
                    },
                    { id: 5, name: "Void Cloak", keystone: "Phantom Drive", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:20,y:70,r:2,t:1}, {x:20,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:50,y:30,r:4,t:1}, {x:50,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:80,y:70,r:2,t:1}, {x:80,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "PHANTOM DRIVE: +10% Offline generation" 
                    }
                ],
                major: { n: "THE SMUGGLER'S TOLL", cost: 50, desc: "Hires a phantom-operative to drip-feed Scrap while offline." }
            },
            {
                k:'ignisKor', n:'Ignis-Kor', title: 'The Reality Shaper', icon: '▵',
                starBuff: "Quantum Fluctuation: Buff durations extended by +2 minutes per star.",
                sectors: [
                    { id: 1, name: "Primary Cube", keystone: "Base Reality", isBranch: false, coords: [{x:50,y:90,r:1,t:1}, {x:30,y:70,r:2,t:0}, {x:50,y:50,r:2,t:1}, {x:70,y:40,r:3,t:0}, {x:50,y:30,r:3,t:1}, {x:30,y:20,r:4,t:1}, {x:70,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "STABILITY: Buffs last +15m" },
                    { id: 2, name: "Prism Lens", keystone: "Refraction Index", isBranch: false, coords: [{x:20,y:80,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:80,y:60,r:3,t:1}, {x:50,y:40,r:4,t:1}, {x:20,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "REFRACTION: Buff strength +2%" },
                    { id: 3, name: "Reality Matrix", keystone: "The Paradigm Shift", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "Buff cost -25% Energy"
                    },
                    { id: 4, name: "Tesseract Frame", keystone: "Folded Space", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "FOLDED SPACE: Cargo capacity +10%" 
                    },
                    { id: 5, name: "The Singularity", keystone: "Event Horizon", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:20,y:70,r:2,t:1}, {x:20,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:50,y:30,r:4,t:1}, {x:50,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:80,y:70,r:2,t:1}, {x:80,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "TRUE SHAPER: 5% chance buffs never expire" 
                    }
                ],
                major: { n: "QUANTUM LOOP", cost: 50, desc: "33% chance the universe loops when crafting, refunding all Scrap." }
            },
            {
                k:'morvath', n:'Morvath', title: 'The Void Hunter', icon: '◈',
                starBuff: "Blood Trail: Bounty rewards increased by +0.5% per star.",
                sectors: [
                    { id: 1, name: "Hunter's Mark", keystone: "The Quarry", isBranch: false, coords: [{x:50,y:90,r:1,t:1}, {x:30,y:70,r:2,t:0}, {x:50,y:50,r:2,t:1}, {x:70,y:40,r:3,t:0}, {x:50,y:30,r:3,t:1}, {x:30,y:20,r:4,t:1}, {x:70,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "BLOOD-MONEY: Bounties +2%" },
                    { id: 2, name: "Jagged Talon", keystone: "Deep Wound", isBranch: false, coords: [{x:20,y:80,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:80,y:60,r:3,t:1}, {x:50,y:40,r:4,t:1}, {x:20,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "TRACKER: Rare spawns +1%" },
                    { id: 3, name: "The Stalk", keystone: "Predator's Patience", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "Bounty timers +4h"
                    },
                    { id: 4, name: "Stellar Sight", keystone: "True Vision", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "PREDATOR: Critical bounty chance +3%" 
                    },
                    { id: 5, name: "Apex Strike", keystone: "Killing Blow", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:20,y:70,r:2,t:1}, {x:20,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:50,y:30,r:4,t:1}, {x:50,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:80,y:70,r:2,t:1}, {x:80,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "OBLITERATION: Bonus Scrap on all kills" 
                    }
                ],
                major: { n: "THE APEX CONTRACT", cost: 50, desc: "Completing a Bounty grants an 'Obliteration Token' to wipe a task." }
            }
        ] 
    },
    3: { 
        name: "THE CELESTIAL VANGUARD", color: "#ff00ff", 
        deities: [
            {
                k:'ragnarath', n:'Ragnarath', title: 'The Dread-Caller', icon: '◇',
                starBuff: "Kinetic Force: Boss damage increased by +0.5% per star.",
                sectors: [
                    { id: 1, name: "Impact Crater", keystone: "Meteor Strike", isBranch: false, coords: [{x:20,y:20,r:1,t:1}, {x:20,y:50,r:2,t:0}, {x:30,y:80,r:2,t:1}, {x:50,y:90,r:3,t:1}, {x:70,y:80,r:4,t:1}, {x:80,y:50,r:5,t:0}, {x:80,y:20,r:5,t:1}, {x:50,y:50,r:6,t:2}], perk: "KINETIC: +2% Boss Damage" },
                    { id: 2, name: "Shattered Spine", keystone: "Brutal Force", isBranch: false, coords: [{x:20,y:80,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:80,y:60,r:3,t:1}, {x:50,y:40,r:4,t:1}, {x:20,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "RAGE: Energy loss adds +1% Damage" },
                    { id: 3, name: "Dread Torrent", keystone: "Unstoppable Momentum", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "Boss Scrap payout +15%"
                    },
                    { id: 4, name: "Spiked Maw", keystone: "Devouring Jaws", isBranch: true, 
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "HARVEST: Boss kills grant +5 Offering" 
                    },
                    { id: 5, name: "Apocalypse Gate", keystone: "The End Times", isBranch: true,
                        paths: [
                            [{x:20,y:90,r:1,t:1}, {x:20,y:70,r:2,t:1}, {x:20,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:15,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:25,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:50,y:75,r:2,t:1}, {x:50,y:60,r:3,t:1}, {x:50,y:45,r:4,t:1}, {x:50,y:35,r:5,t:1}, {x:50,y:25,r:6,t:2}],
                            [{x:80,y:90,r:1,t:1}, {x:80,y:70,r:2,t:1}, {x:80,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:15,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:25,r:6,t:2}]
                        ], perk: "DREAD-LORD: Orbital Strike cooldown -24h" 
                    }
                ],
                major: { n: "THE ORBITAL STRIKE", cost: 50, desc: "Once a week, instantly obliterate a Boss Target." }
            },
            {
                k:'luminara', n:'Luminara', title: 'The Cosmic Veil', icon: '✕',
                starBuff: "Ion Shielding: Hostile encounter energy drain reduced by 0.5% per star.",
                sectors: [
                    { id: 1, name: "Soft Halo", keystone: "Gentle Light", isBranch: false, coords: [{x:50,y:90,r:1,t:1}, {x:30,y:70,r:2,t:0}, {x:50,y:50,r:2,t:1}, {x:70,y:40,r:3,t:0}, {x:50,y:30,r:3,t:1}, {x:30,y:20,r:4,t:1}, {x:70,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "RESISTANCE: Ion drain -2%" },
                    { id: 2, name: "Solar Flare", keystone: "Blinding Flash", isBranch: false, coords: [{x:20,y:80,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:80,y:60,r:3,t:1}, {x:50,y:40,r:4,t:1}, {x:20,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "RADIANCE: Encounter rewards +5%" },
                    { id: 3, name: "Glow Prism", keystone: "Light Refraction", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "Encounter Scrap +15%"
                    },
                    { id: 4, name: "Stellar Ribbon", keystone: "Cosmic Flow", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "WAVE-FORM: Fast travel cost -5% Scrap" 
                    },
                    { id: 5, name: "Cosmic Crown", keystone: "Queen of Stars", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:20,y:70,r:2,t:1}, {x:20,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:50,y:30,r:4,t:1}, {x:50,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:80,y:70,r:2,t:1}, {x:80,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "VEIL-BORN: 10% chance to dodge encounters" 
                    }
                ],
                major: { n: "THE VEIL OF LIGHT", cost: 50, desc: "Damage has a 33% chance to be converted into Bonus Energy." }
            },
            {
                k:'xerxes', n:'Xerxes', title: 'The Harvester of Suns', icon: '⛶',
                starBuff: "Gravitational Pull: Rare encounter spawn chance increased by 0.5% per star.",
                sectors: [
                    { id: 1, name: "Siphon Root", keystone: "Deep Drain", isBranch: false, coords: [{x:20,y:10,r:1,t:1}, {x:80,y:10,r:2,t:1}, {x:50,y:30,r:3,t:0}, {x:30,y:50,r:3,t:1}, {x:70,y:60,r:4,t:1}, {x:45,y:80,r:5,t:1}, {x:50,y:95,r:6,t:2}], perk: "DETECTION: Rare spawns +2%" },
                    { id: 2, name: "Hungry Maw", keystone: "Endless Appetite", isBranch: false, coords: [{x:20,y:80,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:80,y:60,r:3,t:1}, {x:50,y:40,r:4,t:1}, {x:20,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}], perk: "SIPHON: Secure rewards +5%" },
                    { id: 3, name: "The Web", keystone: "Sticky Trap", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "Rare Encounter Scrap +25%"
                    },
                    { id: 4, name: "Funnel Core", keystone: "Singularity Point", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:40,y:70,r:2,t:1}, {x:30,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:20,r:5,t:0}, {x:45,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:60,y:70,r:2,t:1}, {x:70,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:20,r:5,t:0}, {x:55,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "GRAVITY: Magnetism pull range +20%" 
                    },
                    { id: 5, name: "Solar Scythe", keystone: "The Harvest", isBranch: true,
                        paths: [
                            [{x:50,y:90,r:1,t:1}, {x:20,y:70,r:2,t:1}, {x:20,y:50,r:3,t:1}, {x:20,y:30,r:4,t:1}, {x:35,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:50,y:70,r:2,t:1}, {x:50,y:50,r:3,t:1}, {x:50,y:30,r:4,t:1}, {x:50,y:20,r:5,t:1}, {x:50,y:10,r:6,t:2}],
                            [{x:50,y:90,r:1,t:1}, {x:80,y:70,r:2,t:1}, {x:80,y:50,r:3,t:1}, {x:80,y:30,r:4,t:1}, {x:65,y:15,r:5,t:1}, {x:50,y:10,r:6,t:2}]
                        ], perk: "SUN-EATER: Fully clear Sector for permanent +25% boost" 
                    }
                ],
                major: { n: "THE SUN-EATER", cost: 50, desc: "Fully clearing a Sector permanently boosts that Sector's rewards." }
            }
        ] 
    }
};
