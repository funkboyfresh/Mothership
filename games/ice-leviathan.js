/**
 * ICE-LEVIATHAN.JS
 * HTML5 Canvas gravity physics peg-breaking simulation.
 */

const iceLeviathan = {
    canvas: null,
    ctx: null,
    loopActive: false,
    rafId: null,
    
    // Core parameters
    ammoPool: 0,
    bonusScrapEarned: 0,
    biome: null,
    isApexEvent: false,
    
    // Rendering Nodes
    playerElement: null,
    viewportElement: null,
    
    // Vectors
    player: { x: 0, y: 50, radius: 30, angle: 0 },
    probes: [],    // Falling balls
    pegs: [],      // Frozen cores
    particles: [], // Exploding shards
    collectibles: [],
    floatingTexts: [],
    
    gravity: 0.22,
    mouse: { x: 0, y: 0 }
};

iceLeviathan.init = function(canvas, ctx, biome, isApex, ammo) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.biome = biome;
    this.isApexEvent = isApex;
    this.ammoPool = ammo * 5; // Overcharged ammunition format
    this.bonusScrapEarned = 0;
    
    this.probes = [];
    this.pegs = [];
    this.particles = [];
    this.collectibles = [];
    this.floatingTexts = [];
    
    this.resizeCanvas();
    this.player.x = this.canvas.width / 2;
    this.mouse.x = this.canvas.width / 2;
    this.mouse.y = this.canvas.height / 2;
    
    // Hydrate Frozen Core Peg Arrays grid matrix boards
    const rows = this.isApexEvent ? 6 : 4;
    const cols = 9;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Stagger alternate column lines organically
            const staggerX = (r % 2 === 0) ? 35 : 0;
            const px = (this.canvas.width / (cols + 1)) * (c + 1) + staggerX;
            const py = 180 + (r * 65);
            
            if (px > 40 && px < this.canvas.width - 40) {
                this.pegs.push({
                    x: px, y: py,
                    radius: Math.random() * 4 + 10,
                    hp: this.isApexEvent ? 2 : 1,
                    maxHp: this.isApexEvent ? 2 : 1
                });
            }
        }
    }
    
    // Affix Modular DOM Starfighter overlay top center
    this.viewportElement = document.getElementById('minigame-viewport');
    if (this.viewportElement) {
        this.playerElement = document.createElement('div');
        this.playerElement.id = 'minigame-player-ship';
        this.playerElement.style.cssText = `
            position: absolute; width: 80px; height: 80px;
            left: 0; top: 0; z-index: 10002; pointer-events: none;
            filter: drop-shadow(0 0 15px ${this.biome.color});
            transform-origin: center center; will-change: transform;
        `;
        if (typeof drawModularShip === 'function' && typeof state !== 'undefined' && state.shipParts) {
            drawModularShip(this.playerElement, state.shipParts);
        } else {
            this.playerElement.innerHTML = `<div style="width:100%; height:100%; background:${this.biome.color}; clip-path:polygon(50% 0%, 0% 100%, 100% 100%);"></div>`;
        }
        this.viewportElement.appendChild(this.playerElement);
    }
    
    this._moveRef = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    };
    this._resizeRef = () => this.resizeCanvas();
    
    this.canvas.addEventListener('mousemove', this._moveRef);
    window.addEventListener('resize', this._resizeRef);
    
    this.loopActive = true;
    this.executeSimulationLoop();
};

iceLeviathan.resizeCanvas = function() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
};

iceLeviathan.executeSimulationLoop = function() {
    if (!this.loopActive) return;
    this.updatePhysics();
    this.drawScene();
    this.rafId = requestAnimationFrame(() => this.executeSimulationLoop());
};

iceLeviathan.updatePhysics = function() {
    // 1. Point Launcher Rail tracking cursor coordinates
    let dx = this.mouse.x - this.player.x;
    let dy = this.mouse.y - this.player.y;
    this.player.angle = Math.atan2(dy, dx);
    
    if (this.playerElement) {
        const ox = this.player.x - 40;
        const oy = this.player.y - 40;
        // Face down vector adjustments (+90 deg)
        const rot = this.player.angle * (180 / Math.PI) - 90;
        this.playerElement.style.transform = `translate3d(${ox}px, ${oy}px, 0) rotate(${rot}deg)`;
    }
    
    // 2. Automated launcher cycles (fires gravity probes down aiming line)
    if (this.ammoPool > 0 && this.probes.length < 5 && Math.random() < 0.05) {
        this.ammoPool--;
        const hudAmmo = document.getElementById('game-hud-ammo');
        if (hudAmmo) hudAmmo.innerText = this.ammoPool;
        
        this.probes.push({
            x: this.player.x + Math.cos(this.player.angle) * 45,
            y: this.player.y + Math.sin(this.player.angle) * 45,
            vx: Math.cos(this.player.angle) * 9,
            vy: Math.sin(this.player.angle) * 9,
            radius: 7
        });
    }
    
    // 3. Simulating Probe Physics (Gravitational pulls & Peg Elastic bounces)
    for (let i = this.probes.length - 1; i >= 0; i--) {
        let p = this.probes[i];
        p.vy += this.gravity; // Accelerate downward
        p.x += p.vx; p.y += p.vy;
        
        // Wall boundaries bounces
        if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.85; }
        if (p.x > this.canvas.width - p.radius) { p.x = this.canvas.width - p.radius; p.vx *= -0.85; }
        
        // Remove if fallen past screen lower edge thresholds
        if (p.y > this.canvas.height + 20) {
            this.probes.splice(i, 1);
            continue;
        }
        
        // Elastic collision grid inspection passes
        for (let j = this.pegs.length - 1; j >= 0; j--) {
            let peg = this.pegs[j];
            let pdx = p.x - peg.x;
            let pdy = p.y - peg.y;
            let pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            
            if (pdist < p.radius + peg.radius) {
                // Compute reflection vector deflection angles
                let nx = pdx / pdist;
                let ny = pdy / pdist;
                
                // Reposition sphere outside intersection boundaries
                p.x = peg.x + nx * (p.radius + peg.radius);
                p.y = peg.y + ny * (p.radius + peg.radius);
                
                // Reflect velocity arrays
                let dotProduct = p.vx * nx + p.vy * ny;
                p.vx = (p.vx - 2 * dotProduct * nx) * 0.8;
                p.vy = (p.vy - 2 * dotProduct * ny) * 0.8;
                
                peg.hp--;
                
                // Shatter freezing nodes on depletion thresholds
                if (peg.hp <= 0) {
                    this.triggerPegExplosion(peg.x, peg.y);
                    
                    // Spawn drift fragments
                    this.collectibles.push({
                        x: peg.x, y: peg.y,
                        vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 4,
                        value: Math.round((Math.random() * 5 + 4) * (this.isApexEvent ? 3.0 : 1.0))
                    });
                    
                    this.pegs.splice(j, 1);
                }
                break;
            }
        }
    }
    
    // 4. Magnet Attraction Collection Matrices (Pulls back to ship at top center)
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
        let c = this.collectibles[i];
        c.x += c.vx; c.y += c.vy;
        c.vx *= 0.96; c.vy *= 0.96;
        
        let cdx = this.player.x - c.x;
        let cdy = this.player.y - c.y;
        let cdist = Math.sqrt(cdx * cdx + cdy * cdy);
        
        // Magnet field holds total vertical reach
        if (cdist < 400) {
            let pull = (400 - cdist) / 14;
            c.x += (cdx / cdist) * pull;
            c.y += (cdy / cdist) * pull;
        }
        
        if (cdist < 45) {
            this.bonusScrapEarned += c.value;
            this.floatingTexts.push({ x: c.x, y: c.y, text: `+${c.value}`, alpha: 1 });
            
            const hudScrap = document.getElementById('game-hud-scrap');
            if (hudScrap) hudScrap.innerText = `+${this.bonusScrapEarned} SCRAP`;
            
            this.collectibles.splice(i, 1);
        }
    }
    
    // Fade counters
    for (let i = this.particles.length - 1; i >= 0; i--) {
        let pt = this.particles[i];
        pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1; // Float downward with drift
        pt.alpha -= 0.03;
        if (pt.alpha <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        let t = this.floatingTexts[i];
        t.y -= 0.7; t.alpha -= 0.02;
        if (t.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
};

iceLeviathan.triggerPegExplosion = function(x, y) {
    for (let i = 0; i < 14; i++) {
        let a = Math.random() * Math.PI * 2;
        let s = Math.random() * 4 + 1;
        this.particles.push({
            x: x, y: y,
            vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            radius: Math.random() * 2 + 1, alpha: 1,
            color: this.biome.color
        });
    }
};

iceLeviathan.drawScene = function() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 1. Aiming Matrix Ray Guidelines
    ctx.save();
    ctx.strokeStyle = `${this.biome.color}22`;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(this.player.x, this.player.y);
    ctx.lineTo(this.player.x + Math.cos(this.player.angle) * 300, this.player.y + Math.sin(this.player.angle) * 300);
    ctx.stroke();
    ctx.restore();
    
    // 2. Frozen Core Crystals (Pegs)
    this.pegs.forEach(peg => {
        ctx.save();
        ctx.strokeStyle = this.biome.color;
        ctx.lineWidth = 2;
        ctx.fillStyle = peg.hp > 1 ? `${this.biome.color}44` : `${this.biome.color}15`;
        ctx.shadowBlur = 8; ctx.shadowColor = this.biome.color;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.restore();
    });
    
    // 3. Gravity Probes
    this.probes.forEach(p => {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10; ctx.shadowColor = this.biome.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    // 4. Fragment Diamonds
    this.collectibles.forEach(c => {
        ctx.save();
        ctx.fillStyle = 'var(--captured)';
        ctx.beginPath();
        ctx.rect(c.x - 3, c.y - 3, 6, 6);
        ctx.fill();
        ctx.restore();
    });
    
    // 5. Dust shards
    this.particles.forEach(pt => {
        ctx.save(); ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
    
    // 6. Text indicator overlays
    this.floatingTexts.forEach(t => {
        ctx.save(); ctx.globalAlpha = t.alpha;
        ctx.fillStyle = 'var(--captured)';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    });
};

iceLeviathan.terminate = function() {
    this.loopActive = false;
    cancelAnimationFrame(this.rafId);
    this.ammoPool = Math.ceil(this.ammoPool / 5);
    if (this.playerElement) { this.playerElement.remove(); this.playerElement = null; }
    if (this.canvas) this.canvas.removeEventListener('mousemove', this._moveRef);
    window.removeEventListener('resize', this._resizeRef);
};
