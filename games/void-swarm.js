/**
 * VOID-SWARM.JS
 * Pure Canvas Vector Physics Loop Simulation Module.
 */

const voidSwarm = {
    canvas: null,
    ctx: null,
    loopActive: false,
    rafId: null,
    
    // Runtime Game States
    ammoPool: 0,
    bonusScrapEarned: 0,
    biome: null,
    isApexEvent: false,
    
    // Arrays
    player: { x: 0, y: 0, radius: 18, speed: 8, angle: 0 },
    projectiles: [],
    enemies: [],
    particles: [],
    
    mouse: { x: 0, y: 0 }
};

voidSwarm.init = function(canvas, ctx, biome, isApex, ammo) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.biome = biome;
    this.isApexEvent = isApex;
    this.ammoPool = ammo;
    this.bonusScrapEarned = 0;
    
    this.projectiles = [];
    this.enemies = [];
    this.particles = [];
    
    this.resizeCanvas();
    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height / 2;
    this.mouse.x = this.canvas.width / 2;
    this.mouse.y = this.canvas.height / 2;
    
    // Bind Action Observers
    this._moveRef = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    };
    this._touchRef = (e) => {
        if(e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.touches[0].clientX - rect.left;
            this.mouse.y = e.touches[0].clientY - rect.top;
        }
    };
    this._resizeRef = () => this.resizeCanvas();
    
    this.canvas.addEventListener('mousemove', this._moveRef);
    this.canvas.addEventListener('touchmove', this._touchRef);
    window.addEventListener('resize', this._resizeRef);
    
    // Ignition Animation Sequence
    this.loopActive = true;
    this.executeSimulationLoop();
};

voidSwarm.resizeCanvas = function() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
};

voidSwarm.executeSimulationLoop = function() {
    if (!this.loopActive) return;
    
    this.updatePhysics();
    this.drawScene();
    
    this.rafId = requestAnimationFrame(() => this.executeSimulationLoop());
};

voidSwarm.updatePhysics = function() {
    // 1. Interpolate Player Vector Heading
    let dx = this.mouse.x - this.player.x;
    let dy = this.mouse.y - this.player.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
        this.player.x += (dx / dist) * this.player.speed;
        this.player.y += (dy / dist) * this.player.speed;
        this.player.angle = Math.atan2(dy, dx);
    }
    
    // 2. Automated Weapon Engine Fire Operations
    if (this.ammoPool > 0 && Math.random() < 0.15) {
        this.ammoPool--;
        const hudAmmo = document.getElementById('game-hud-ammo');
        if (hudAmmo) hudAmmo.innerText = this.ammoPool;
        
        this.projectiles.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(this.player.angle) * 13,
            vy: Math.sin(this.player.angle) * 13,
            radius: 3.5
        });
    }
    
    // 3. Handle Enemy Swarm Procedural Spawning Cycles
    let spawnRate = this.isApexEvent ? 0.08 : 0.04;
    if (this.enemies.length < 45 && Math.random() < spawnRate) {
        let edge = Math.floor(Math.random() * 4);
        let sx, sy;
        
        if (edge === 0) { sx = Math.random() * this.canvas.width; sy = -20; }
        else if (edge === 1) { sx = this.canvas.width + 20; sy = Math.random() * this.canvas.height; }
        else if (edge === 2) { sx = Math.random() * this.canvas.width; sy = this.canvas.height + 20; }
        else { sx = -20; sy = Math.random() * this.canvas.height; }
        
        let shape = 'CIRCLE';
        if (this.biome.id === 'CRYSTAL' || this.biome.id === 'FERROUS') shape = 'TRIANGLE';
        if (this.biome.id === 'CYBER' || this.biome.id === 'PLASMA') shape = 'SQUARE';

        this.enemies.push({
            x: sx, y: sy, shape: shape,
            radius: Math.random() * 8 + 12,
            speed: Math.random() * 2 + (this.isApexEvent ? 2.5 : 1.5),
            hp: this.isApexEvent ? 3 : 1
        });
    }
    
    // 4. Process Weapon Vector Adjustments
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        let p = this.projectiles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
            this.projectiles.splice(i, 1);
        }
    }
    
    // 5. Matrix Collision Tracking Algorithms
    for (let i = this.enemies.length - 1; i >= 0; i--) {
        let e = this.enemies[i];
        let edx = this.player.x - e.x;
        let edy = this.player.y - e.y;
        let edist = Math.sqrt(edx * edx + edy * edy);
        
        e.x += (edx / edist) * e.speed;
        e.y += (edy / edist) * e.speed;
        
        for (let j = this.projectiles.length - 1; j >= 0; j--) {
            let p = this.projectiles[j];
            let pdx = p.x - e.x;
            let pdy = p.y - e.y;
            let pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            
            if (pdist < e.radius + p.radius) {
                this.projectiles.splice(j, 1);
                e.hp--;
                
                if (e.hp <= 0) {
                    this.detonateExplosion(e.x, e.y);
                    
                    let reward = Math.round((Math.random() * 4 + 2) * (this.isApexEvent ? 3.0 : 1.0));
                    this.bonusScrapEarned += reward;
                    
                    const hudScrap = document.getElementById('game-hud-scrap');
                    if (hudScrap) hudScrap.innerText = `+${this.bonusScrapEarned} SCRAP`;
                    
                    this.enemies.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    // 6. Fade Floating Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
        let pt = this.particles[i];
        pt.x += pt.vx; pt.y += pt.vy;
        pt.alpha -= 0.03;
        if (pt.alpha <= 0) this.particles.splice(i, 1);
    }
};

voidSwarm.detonateExplosion = function(x, y) {
    for (let i = 0; i < 12; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 4 + 2;
        this.particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 2.5 + 1,
            alpha: 1,
            color: this.biome.color
        });
    }
};

voidSwarm.drawScene = function() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Particle Render Passes
    this.particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    // Plasma Bolt Render Passes
    this.projectiles.forEach(p => {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.biome.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    // Hostile Geometry Render Passes
    this.enemies.forEach(e => {
        ctx.save();
        ctx.strokeStyle = this.biome.color;
        ctx.lineWidth = 2;
        ctx.fillStyle = `${this.biome.color}15`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.biome.color;
        ctx.beginPath();
        
        if (e.shape === 'SQUARE') {
            ctx.rect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
        } else if (e.shape === 'TRIANGLE') {
            ctx.moveTo(e.x, e.y - e.radius);
            ctx.lineTo(e.x + e.radius, e.y + e.radius);
            ctx.lineTo(e.x - e.radius, e.y + e.radius);
            ctx.closePath();
        } else {
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        }
        
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    });
    
    // Starfighter Geometry Render Pass
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.angle);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.biome.color;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-14, -14);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-14, 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

voidSwarm.terminate = function() {
    this.loopActive = false;
    cancelAnimationFrame(this.rafId);
    
    if (this.canvas) {
        this.canvas.removeEventListener('mousemove', this._moveRef);
        this.canvas.removeEventListener('touchmove', this._touchRef);
    }
    window.removeEventListener('resize', this._resizeRef);
};
