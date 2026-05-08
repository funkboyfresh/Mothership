// [ MASTER BUILD ] The Void Pantheon Lore Dictionary
const PANTHEON_DATA = {
    1: { 
        name: "GENESIS SPHERE", color: "#00d4ff", 
        deities: [
            {
                k:'kaelenTor', n:'Kaelen-Tor', title: 'The Star-Forge', icon: '◉',
                sectors: [
                    { id: 1, name: "Ignition Core", coords: [{x:30,y:30}, {x:70,y:30}, {x:70,y:70}, {x:30,y:70}, {x:50,y:50}], perk: "MAGNETISM: +2% Base Yields" },
                    { id: 2, name: "Pulsar Hammer", coords: [{x:20,y:20}, {x:50,y:20}, {x:80,y:20}, {x:50,y:50}, {x:50,y:80}], perk: "TEMPERING: Forge failure rate -5%" },
                    { id: 3, name: "The Great Split", isBranch: true,
                        paths: [
                            { id: 1, n: "Alpha: Cold-Forging", perk: "Offerings cost -10% Scrap", coords: [{x:20,y:50}, {x:40,y:40}, {x:60,y:40}, {x:80,y:50}, {x:50,y:20}] },
                            { id: 2, n: "Omega: Over-Heating", perk: "Bonus Yields +10%", coords: [{x:20,y:50}, {x:40,y:60}, {x:60,y:60}, {x:80,y:50}, {x:50,y:80}] }
                        ]
                    },
                    { id: 4, name: "Anvil Peak", coords: [{x:20,y:80}, {x:40,y:60}, {x:60,y:60}, {x:80,y:80}, {x:50,y:40}], perk: "REINFORCEMENT: Scrap payout +5%" },
                    { id: 5, name: "Solar Crucible", coords: [{x:50,y:10}, {x:20,y:40}, {x:80,y:40}, {x:30,y:80}, {x:70,y:80}], perk: "FORGE-MASTER: +1% Critical Craft chance" }
                ],
                major: { n: "THE MIDAS DRIVE", cost: 50, desc: "Convert 10% of lifetime Energy into a massive Scrap payout." }
            },
            {
                k:'aethelgard', n:'Aethelgard', title: 'The Weaver of Eons', icon: '✷',
                sectors: [
                    { id: 1, name: "Temporal Pulse", coords: [{x:50,y:20}, {x:80,y:50}, {x:50,y:80}, {x:20,y:50}, {x:50,y:20}], perk: "VELOCITY: +1% Scrap on fast clears" },
                    { id: 2, name: "The Hourglass", coords: [{x:30,y:20}, {x:70,y:20}, {x:50,y:50}, {x:30,y:80}, {x:70,y:80}], perk: "SAND-SHIFT: Warning alerts +2h" },
                    { id: 3, name: "Timeline Fork", isBranch: true,
                        paths: [
                            { id: 1, n: "Alpha: Dilated Time", perk: "Target timers -10% slower", coords: [{x:50,y:20}, {x:30,y:40}, {x:30,y:60}, {x:50,y:80}, {x:50,y:50}] },
                            { id: 2, n: "Omega: Accelerated Eons", perk: "Energy generation +5%", coords: [{x:50,y:20}, {x:70,y:40}, {x:70,y:60}, {x:50,y:80}, {x:50,y:50}] }
                        ]
                    },
                    { id: 4, name: "The Pendulum", coords: [{x:20,y:40}, {x:50,y:20}, {x:80,y:40}, {x:50,y:60}, {x:50,y:90}], perk: "MOMENTUM: Consecutive tasks grant +1% Energy" },
                    { id: 5, name: "Infinity Knot", coords: [{x:40,y:30}, {x:60,y:30}, {x:60,y:70}, {x:40,y:70}, {x:50,y:50}], perk: "ETERNAL LOOP: Targets have 5% chance to auto-respawn" }
                ],
                major: { n: "CHRONOS SHIFT", cost: 50, desc: "Instantly advance Pilot Level by 1 without filling Capacitor." }
            },
            {
                k:'valerium', n:'Valerium', title: 'The Aegis Warden', icon: '⎔',
                sectors: [
                    { id: 1, name: "Bulwark Base", coords: [{x:20,y:30}, {x:50,y:30}, {x:80,y:30}, {x:65,y:70}, {x:35,y:70}], perk: "PLATING: -1 Overdue Penalty" },
                    { id: 2, name: "Aegis Wall", coords: [{x:10,y:50}, {x:30,y:50}, {x:50,y:50}, {x:70,y:50}, {x:90,y:50}], perk: "DEFLECTION: 5% lower Energy loss" },
                    { id: 3, name: "Shield Specialization", isBranch: true,
                        paths: [
                            { id: 1, n: "Alpha: Reflective Guard", perk: "Penalties returned as 5% Scrap", coords: [{x:20,y:20}, {x:80,y:20}, {x:50,y:40}, {x:20,y:60}, {x:80,y:60}] },
                            { id: 2, n: "Omega: Kinetic Sink", perk: "Penalty Energy cap increased", coords: [{x:50,y:10}, {x:30,y:40}, {x:70,y:40}, {x:30,y:70}, {x:70,y:70}] }
                        ]
                    },
                    { id: 4, name: "Phalanx Array", coords: [{x:30,y:20}, {x:70,y:20}, {x:80,y:50}, {x:70,y:80}, {x:30,y:80}], perk: "GUARD: Shield Sub-Routines +10% strength" },
                    { id: 5, name: "Bastion Peak", coords: [{x:50,y:10}, {x:20,y:40}, {x:80,y:40}, {x:50,y:60}, {x:50,y:90}], perk: "IMMORTAL WARDEN: Energy never drops below 1" }
                ],
                major: { n: "WARDEN'S GRACE", cost: 50, desc: "Auto-generate Sub-Routine Shields on Decaying tasks." }
            }
        ] 
    },
    2: { 
        name: "ABYSSAL SYNDICATE", color: "#ffd700", 
        deities: [
            {
                k:'syraxis', n:'Syraxis', title: 'The Shadow-Walker', icon: '◯',
                sectors: [
                    { id: 1, name: "Shadow Blade", coords: [{x:20,y:80}, {x:40,y:60}, {x:60,y:40}, {x:80,y:20}, {x:50,y:50}], perk: "UNDERWORLD: +2% Market Rate" },
                    { id: 2, name: "Veil of Mist", coords: [{x:20,y:20}, {x:30,y:30}, {x:50,y:40}, {x:70,y:30}, {x:80,y:20}], perk: "CLOAK: Hidden bounty payouts +5%" },
                    { id: 3, name: "The Silent Fork", isBranch: true,
                        paths: [
                            { id: 1, n: "Alpha: Shadow Step", perk: "Mission travel cost -1 Energy", coords: [{x:10,y:50}, {x:30,y:30}, {x:50,y:10}, {x:70,y:30}, {x:90,y:50}] },
                            { id: 2, n: "Omega: Lethal Strike", perk: "Scrap crit multiplier +0.5x", coords: [{x:10,y:50}, {x:30,y:70}, {x:50,y:90}, {x:70,y:70}, {x:90,y:50}] }
                        ]
                    },
                    { id: 4, name: "The Eclipse", coords: [{x:50,y:10}, {x:30,y:30}, {x:20,y:50}, {x:30,y:70}, {x:50,y:90}], perk: "VOID-SIGHT: Rare encounters +2%" },
                    { id: 5, name: "Void Cloak", coords: [{x:20,y:20}, {x:80,y:20}, {x:80,y:80}, {x:20,y:80}, {x:50,y:20}], perk: "PHANTOM DRIVE: +10% Offline generation" }
                ],
                major: { n: "THE SMUGGLER'S TOLL", cost: 50, desc: "Hires a phantom-operative to drip-feed Scrap while offline." }
            },
            {
                k:'ignisKor', n:'Ignis-Kor', title: 'The Reality Shaper', icon: '▵',
                sectors: [
                    { id: 1, name: "Primary Cube", coords: [{x:30,y:30}, {x:70,y:30}, {x:70,y:70}, {x:30,y:70}, {x:30,y:30}], perk: "STABILITY: Buffs last +15m" },
                    { id: 2, name: "Prism Lens", coords: [{x:50,y:20}, {x:20,y:80}, {x:80,y:80}, {x:50,y:50}, {x:50,y:20}], perk: "REFRACTION: Buff strength +2%" },
                    { id: 3, name: "Reality Matrix", isBranch: true,
                        paths: [
                            { id: 1, n: "Alpha: Logic Loop", perk: "Buff cost -25% Energy", coords: [{x:10,y:10}, {x:90,y:10}, {x:90,y:90}, {x:10,y:90}, {x:50,y:50}] },
                            { id: 2, n: "Omega: Chaos Theory", perk: "Buff strength +10% (Variable)", coords: [{x:20,y:50}, {x:50,y:20}, {x:80,y:50}, {x:50,y:80}, {x:50,y:50}] }
                        ]
                    },
                    { id: 4, name: "Tesseract Frame", coords: [{x:25,y:25}, {x:75,y:25}, {x:75,y:75}, {x:25,y:75}, {x:40,y:40}], perk: "FOLDED SPACE: Cargo capacity +10%" },
                    { id: 5, name: "The Singularity", coords: [{x:50,y:10}, {x:10,y:50}, {x:50,y:90}, {x:90,y:50}, {x:50,y:50}], perk: "TRUE SHAPER: 5% chance buffs never expire" }
                ],
                major: { n: "QUANTUM LOOP", cost: 50, desc: "33% chance the universe loops when crafting, refunding all Scrap." }
            },
            {
                k:'morvath', n:'Morvath', title: 'The Void Hunter', icon: '◈',
                sectors: [
                    { id: 1, name: "Hunter's Mark", coords: [{x:50,y:10}, {x:50,y:90}, {x:10,y:50}, {x:90,y:50}, {x:50,y:50}], perk: "BLOOD-MONEY: Bounties +2%" },
                    { id: 2, name: "Jagged Talon", coords: [{x:20,y:20}, {x:40,y:40}, {x:20,y:50}, {x:40,y:60}, {x:20,y:80}], perk: "TRACKER: Rare spawns +1%" },
                    { id: 3, name: "The Stalk", isBranch: true,
                        paths: [
                            { id: 1, n: "Alpha: Trapper", perk: "Bounty timers +4h", coords: [{x:10,y:10}, {x:30,y:10}, {x:20,y:40}, {x:10,y:70}, {x:30,y:70}] },
                            { id: 2, n: "Omega: Slayer", perk: "Bounty payout +10%", coords: [{x:70,y:10}, {x:90,y:10}, {x:80,y:40}, {x:70,y:70}, {x:90,y:70}] }
                        ]
                    },
                    { id: 4, name: "Stellar Sight", coords: [{x:20,y:50}, {x:40,y:30}, {x:60,y:30}, {x:80,y:50}, {x:50,y:50}], perk: "PREDATOR: Critical bounty chance +3%" },
                    { id: 5, name: "Apex Strike", coords: [{x:50,y:20}, {x:30,y:40}, {x:70,y:40}, {x:50,y:80}, {x:50,y:50}], perk: "OBLITERATION: Bonus Scrap on all kills" }
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
                sectors: [
                    { id: 1, name: "Impact Crater", coords: [{x:40,y:40}, {x:60,y:40}, {x:60,y:60}, {x:40,y:60}, {x:50,y:10}], perk: "KINETIC: +2% Boss Damage" },
                    { id: 2, name: "Shattered Spine", coords: [{x:10,y:90}, {x:30,y:70}, {x:50,y:80}, {x:70,y:60}, {x:90,y:70}], perk: "RAGE: Energy loss adds +1% Damage" },
                    { id: 3, name: "Dread Torrent", isBranch: true,
                        paths: [
                            { id: 1, n: "Alpha: Fearful Presence", perk: "Boss timers +2h", coords: [{x:20,y:20}, {x:40,y:10}, {x:50,y:30}, {x:60,y:10}, {x:80,y:20}] },
                            { id: 2, n: "Omega: Total Ruin", perk: "Boss Scrap payout +15%", coords: [{x:20,y:80}, {x:40,y:90}, {x:50,y:70}, {x:60,y:90}, {x:80,y:80}] }
                        ]
                    },
                    { id: 4, name: "Spiked Maw", coords: [{x:30,y:30}, {x:40,y:20}, {x:50,y:30}, {x:60,y:20}, {x:70,y:30}], perk: "HARVEST: Boss kills grant +5 Offering" },
                    { id: 5, name: "Apocalypse Gate", coords: [{x:50,y:10}, {x:10,y:50}, {x:90,y:50}, {x:50,y:90}, {x:50,y:10}], perk: "DREAD-LORD: Orbital Strike cooldown -24h" }
                ],
                major: { n: "THE ORBITAL STRIKE", cost: 50, desc: "Once a week, instantly obliterate a Boss Target." }
            },
            {
                k:'luminara', n:'Luminara', title: 'The Cosmic Veil', icon: '✕',
                sectors: [
                    { id: 1, name: "Soft Halo", coords: [{x:50,y:30}, {x:70,y:50}, {x:50,y:70}, {x:30,y:50}, {x:50,y:30}], perk: "RESISTANCE: Ion drain -2%" },
                    { id: 2, name: "Solar Flare", coords: [{x:50,y:50}, {x:50,y:10}, {x:90,y:50}, {x:50,y:90}, {x:10,y:50}], perk: "RADIANCE: Encounter rewards +5%" },
                    { id: 3, name: "Glow Prism", isBranch: true,
                        paths: [
                            { id: 1, n: "Alpha: Healing Light", perk: "Encounter Energy loss -25%", coords: [{x:30,y:30}, {x:50,y:10}, {x:70,y:30}, {x:50,y:50}, {x:50,y:80}] },
                            { id: 2, n: "Omega: Searing Veil", perk: "Encounter Scrap +15%", coords: [{x:30,y:70}, {x:50,y:90}, {x:70,y:70}, {x:50,y:50}, {x:50,y:20}] }
                        ]
                    },
                    { id: 4, name: "Stellar Ribbon", coords: [{x:10,y:10}, {x:30,y:20}, {x:70,y:80}, {x:90,y:90}, {x:50,y:50}], perk: "WAVE-FORM: Fast travel cost -5% Scrap" },
                    { id: 5, name: "Cosmic Crown", coords: [{x:20,y:40}, {x:40,y:20}, {x:60,y:20}, {x:80,y:40}, {x:50,y:60}], perk: "VEIL-BORN: 10% chance to dodge encounters" }
                ],
                major: { n: "THE VEIL OF LIGHT", cost: 50, desc: "Damage has a 33% chance to be converted into Bonus Energy." }
            },
            {
                k:'xerxes', n:'Xerxes', title: 'The Harvester of Suns', icon: '⸬',
                sectors: [
                    { id: 1, name: "Siphon Root", coords: [{x:50,y:90}, {x:50,y:60}, {x:20,y:40}, {x:80,y:40}, {x:50,y:50}], perk: "DETECTION: Rare spawns +2%" },
                    { id: 2, name: "Hungry Maw", coords: [{x:50,y:50}, {x:30,y:20}, {x:70,y:20}, {x:30,y:80}, {x:70,y:80}], perk: "SIPHON: Secure rewards +5%" },
                    { id: 3, name: "The Web", isBranch: true,
                        paths: [
                            { id: 1, n: "Alpha: Silk Weaver", perk: "Rare Encounter timers +6h", coords: [{x:10,y:30}, {x:30,y:10}, {x:50,y:30}, {x:70,y:10}, {x:90,y:30}] },
                            { id: 2, n: "Omega: Venom Gland", perk: "Rare Encounter Scrap +25%", coords: [{x:10,y:70}, {x:30,y:90}, {x:50,y:70}, {x:70,y:90}, {x:90,y:70}] }
                        ]
                    },
                    { id: 4, name: "Funnel Core", coords: [{x:10,y:10}, {x:90,y:10}, {x:50,y:90}, {x:30,y:40}, {x:70,y:40}], perk: "GRAVITY: Magnetism pull range +20%" },
                    { id: 5, name: "Solar Scythe", coords: [{x:10,y:50}, {x:50,y:10}, {x:90,y:50}, {x:50,y:60}, {x:50,y:90}], perk: "SUN-EATER: Fully clear Sector for permanent +25% boost" }
                ],
                major: { n: "THE SUN-EATER", cost: 50, desc: "Fully clearing a Sector permanently boosts that Sector's rewards." }
            }
        ] 
    }
};
