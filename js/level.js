// Level Data and Platforms for Athena Saga

const LEVEL_DATA = {
    // Level dimensions
    width: 3200,
    height: 480,
    
    // Background layers for parallax
    backgrounds: [
        { color: '#1a0a2e', speed: 0 },      // Sky gradient base
        { color: '#2d1b4e', speed: 0.2 },    // Far mountains
        { color: '#4a2c6a', speed: 0.5 }     // Near hills
    ],
    
    // Ground level
    groundY: 400,
    
    // Platforms: { x, y, width, height, type }
    platforms: [
        // Ground sections
        { x: 0, y: 400, width: 600, height: 80, type: 'ground' },
        { x: 700, y: 400, width: 400, height: 80, type: 'ground' },
        { x: 1200, y: 400, width: 500, height: 80, type: 'ground' },
        { x: 1800, y: 400, width: 600, height: 80, type: 'ground' },
        { x: 2500, y: 400, width: 700, height: 80, type: 'ground' },
        
        // Elevated platforms
        { x: 200, y: 300, width: 150, height: 24, type: 'platform' },
        { x: 450, y: 250, width: 120, height: 24, type: 'platform' },
        { x: 800, y: 280, width: 180, height: 24, type: 'platform' },
        { x: 1050, y: 320, width: 100, height: 24, type: 'platform' },
        { x: 1300, y: 250, width: 160, height: 24, type: 'platform' },
        { x: 1550, y: 300, width: 140, height: 24, type: 'platform' },
        { x: 1900, y: 280, width: 200, height: 24, type: 'platform' },
        { x: 2200, y: 320, width: 150, height: 24, type: 'platform' },
        
        // Temple pillars (decorative platforms)
        { x: 2600, y: 300, width: 60, height: 100, type: 'pillar' },
        { x: 2750, y: 300, width: 60, height: 100, type: 'pillar' },
        { x: 2900, y: 300, width: 60, height: 100, type: 'pillar' },
    ],
    
    // Decorative elements
    decorations: [
        // Pillars in background
        { x: 100, y: 320, type: 'pillar_bg' },
        { x: 350, y: 320, type: 'pillar_bg' },
        { x: 900, y: 320, type: 'pillar_bg' },
        { x: 1400, y: 320, type: 'pillar_bg' },
        { x: 1700, y: 320, type: 'pillar_bg' },
        
        // Greek temple entrance at end
        { x: 2700, y: 200, type: 'temple_roof' },
        
        // Torches
        { x: 150, y: 340, type: 'torch' },
        { x: 500, y: 340, type: 'torch' },
        { x: 1000, y: 340, type: 'torch' },
        { x: 1500, y: 340, type: 'torch' },
        { x: 2000, y: 340, type: 'torch' },
        
        // Urns
        { x: 250, y: 370, type: 'urn' },
        { x: 750, y: 370, type: 'urn' },
        { x: 1250, y: 370, type: 'urn' },
    ],
    
    // Power-ups: { x, y, type }
    powerUps: [
        { x: 300, y: 260, type: 'health' },
        { x: 850, y: 240, type: 'weapon' },
        { x: 1350, y: 210, type: 'health' },
        { x: 1950, y: 240, type: 'weapon' },
        { x: 2250, y: 280, type: 'health' },
    ],
    
    // Enemy spawn points: { x, y, type }
    enemies: [
        { x: 400, y: 360, type: 'skeleton' },
        { x: 600, y: 200, type: 'harpy' },
        { x: 900, y: 360, type: 'skeleton' },
        { x: 1100, y: 360, type: 'skeleton' },
        { x: 1300, y: 180, type: 'harpy' },
        { x: 1600, y: 360, type: 'skeleton' },
        { x: 1800, y: 200, type: 'harpy' },
        { x: 2000, y: 360, type: 'skeleton' },
        { x: 2100, y: 360, type: 'skeleton' },
        { x: 2300, y: 180, type: 'harpy' },
        { x: 2800, y: 320, type: 'cyclops' }  // BOSS
    ]
};

// Level renderer
class LevelRenderer {
    constructor(ctx, camera) {
        this.ctx = ctx;
        this.camera = camera;
        this.torchFrame = 0;
        this.torchTimer = 0;
    }
    
    update(deltaTime) {
        this.torchTimer += deltaTime;
        if (this.torchTimer > 100) {
            this.torchFrame = (this.torchFrame + 1) % 4;
            this.torchTimer = 0;
        }
    }
    
    drawBackground() {
        const ctx = this.ctx;
        const cameraX = this.camera.x;
        
        // Gradient sky
        const gradient = ctx.createLinearGradient(0, 0, 0, 480);
        gradient.addColorStop(0, '#0a0520');
        gradient.addColorStop(0.5, '#1a0a2e');
        gradient.addColorStop(1, '#2d1b4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 480);
        
        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73 + cameraX * 0.05) % 800;
            const y = (i * 37) % 200;
            const size = (i % 3) + 1;
            ctx.globalAlpha = 0.3 + (Math.sin(Date.now() / 1000 + i) + 1) * 0.3;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1;
        
        // Moon
        ctx.fillStyle = '#fffacd';
        ctx.beginPath();
        ctx.arc(650 - cameraX * 0.02, 60, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Distant mountains
        ctx.fillStyle = '#1a1030';
        for (let i = 0; i < 10; i++) {
            const x = i * 200 - (cameraX * 0.1) % 200;
            this.drawMountain(x, 250, 150, 150);
        }
        
        // Closer hills
        ctx.fillStyle = '#2a1840';
        for (let i = 0; i < 15; i++) {
            const x = i * 150 - (cameraX * 0.3) % 150;
            this.drawMountain(x, 320, 100, 80);
        }
    }
    
    drawMountain(x, baseY, width, height) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x + width / 2, baseY - height);
        ctx.lineTo(x + width, baseY);
        ctx.closePath();
        ctx.fill();
    }
    
    drawPlatforms() {
        const ctx = this.ctx;
        const cameraX = this.camera.x;
        
        LEVEL_DATA.platforms.forEach(platform => {
            const screenX = platform.x - cameraX;
            
            // Skip if off screen
            if (screenX + platform.width < 0 || screenX > 800) return;
            
            if (platform.type === 'ground') {
                // Ground with stone texture
                ctx.fillStyle = '#4a3728';
                ctx.fillRect(screenX, platform.y, platform.width, platform.height);
                
                // Stone pattern
                ctx.fillStyle = '#5a4738';
                for (let i = 0; i < platform.width; i += 40) {
                    ctx.fillRect(screenX + i, platform.y, 38, 20);
                }
                ctx.fillStyle = '#6a5748';
                for (let i = 20; i < platform.width; i += 40) {
                    ctx.fillRect(screenX + i, platform.y + 22, 38, 18);
                }
                
                // Top edge
                ctx.fillStyle = '#7a6758';
                ctx.fillRect(screenX, platform.y, platform.width, 4);
                
                // Grass on top
                ctx.fillStyle = '#2d5a1e';
                for (let i = 0; i < platform.width; i += 8) {
                    const grassHeight = 4 + Math.sin(i * 0.5) * 2;
                    ctx.fillRect(screenX + i, platform.y - grassHeight, 6, grassHeight);
                }
            } else if (platform.type === 'platform') {
                // Floating stone platform
                ctx.fillStyle = '#5a4a3a';
                ctx.fillRect(screenX, platform.y, platform.width, platform.height);
                
                // Highlight
                ctx.fillStyle = '#7a6a5a';
                ctx.fillRect(screenX, platform.y, platform.width, 4);
                
                // Shadow
                ctx.fillStyle = '#3a2a1a';
                ctx.fillRect(screenX, platform.y + platform.height - 4, platform.width, 4);
                
                // Column supports
                ctx.fillStyle = '#4a3a2a';
                ctx.fillRect(screenX + 5, platform.y + platform.height, 8, 6);
                ctx.fillRect(screenX + platform.width - 13, platform.y + platform.height, 8, 6);
            } else if (platform.type === 'pillar') {
                // Temple pillar
                this.drawPillar(screenX, platform.y, platform.width, platform.height);
            }
        });
    }
    
    drawPillar(x, y, width, height) {
        const ctx = this.ctx;
        
        // Main column
        ctx.fillStyle = '#d4c4a8';
        ctx.fillRect(x + 8, y, width - 16, height);
        
        // Fluting (grooves)
        ctx.fillStyle = '#c4b498';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 12 + i * 12, y, 4, height);
        }
        
        // Capital (top)
        ctx.fillStyle = '#e4d4b8';
        ctx.fillRect(x, y, width, 12);
        ctx.fillRect(x + 4, y + 12, width - 8, 8);
        
        // Base
        ctx.fillStyle = '#e4d4b8';
        ctx.fillRect(x, y + height - 8, width, 8);
        ctx.fillRect(x + 4, y + height - 16, width - 8, 8);
    }
    
    drawDecorations() {
        const ctx = this.ctx;
        const cameraX = this.camera.x;
        
        LEVEL_DATA.decorations.forEach(deco => {
            const screenX = deco.x - cameraX;
            
            if (screenX < -100 || screenX > 900) return;
            
            switch (deco.type) {
                case 'pillar_bg':
                    ctx.globalAlpha = 0.4;
                    this.drawPillar(screenX, deco.y, 40, 80);
                    ctx.globalAlpha = 1;
                    break;
                    
                case 'temple_roof':
                    this.drawTempleRoof(screenX, deco.y);
                    break;
                    
                case 'torch':
                    this.drawTorch(screenX, deco.y);
                    break;
                    
                case 'urn':
                    this.drawUrn(screenX, deco.y);
                    break;
            }
        });
    }
    
    drawTempleRoof(x, y) {
        const ctx = this.ctx;
        
        // Triangular pediment
        ctx.fillStyle = '#d4c4a8';
        ctx.beginPath();
        ctx.moveTo(x - 50, y + 100);
        ctx.lineTo(x + 150, y);
        ctx.lineTo(x + 350, y + 100);
        ctx.closePath();
        ctx.fill();
        
        // Roof outline
        ctx.strokeStyle = '#a49478';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Architrave
        ctx.fillStyle = '#c4b498';
        ctx.fillRect(x - 50, y + 100, 400, 20);
    }
    
    drawTorch(x, y) {
        const ctx = this.ctx;
        
        // Holder
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(x, y + 20, 8, 40);
        
        // Torch top
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(x - 4, y + 10, 16, 14);
        
        // Flame (animated)
        const flameHeight = 20 + this.torchFrame * 3;
        const flameWidth = 12 + this.torchFrame * 2;
        
        // Outer glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.ellipse(x + 4, y, flameWidth + 8, flameHeight + 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main flame
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 5, flameWidth / 2, flameHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner flame
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 8, flameWidth / 3, flameHeight / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = '#ffff88';
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 10, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawUrn(x, y) {
        const ctx = this.ctx;
        
        // Base
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x, y + 25, 30, 5);
        
        // Body
        ctx.fillStyle = '#a0522d';
        ctx.beginPath();
        ctx.ellipse(x + 15, y + 15, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Neck
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + 8, y - 5, 14, 10);
        
        // Rim
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(x + 5, y - 8, 20, 5);
        
        // Decorative band
        ctx.fillStyle = '#daa520';
        ctx.fillRect(x + 2, y + 10, 26, 3);
    }
    
    drawPowerUps(powerUps) {
        const ctx = this.ctx;
        const cameraX = this.camera.x;
        
        powerUps.forEach(pu => {
            if (!pu.active) return;
            
            const screenX = pu.x - cameraX;
            if (screenX < -50 || screenX > 850) return;
            
            const bobY = pu.y + Math.sin(Date.now() / 200) * 5;
            
            // Glow effect
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 150) * 0.2;
            ctx.fillStyle = pu.type === 'health' ? '#ff0000' : '#00ffff';
            ctx.beginPath();
            ctx.arc(screenX + 16, bobY + 16, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            if (pu.type === 'health') {
                // Health orb (red heart)
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.moveTo(screenX + 16, bobY + 24);
                ctx.bezierCurveTo(screenX + 16, bobY + 20, screenX + 8, bobY + 8, screenX + 16, bobY + 16);
                ctx.bezierCurveTo(screenX + 24, bobY + 8, screenX + 16, bobY + 20, screenX + 16, bobY + 24);
                ctx.fill();
                
                // Simple heart shape
                ctx.fillStyle = '#ff6666';
                ctx.beginPath();
                ctx.arc(screenX + 11, bobY + 12, 6, 0, Math.PI * 2);
                ctx.arc(screenX + 21, bobY + 12, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.moveTo(screenX + 5, bobY + 14);
                ctx.lineTo(screenX + 16, bobY + 28);
                ctx.lineTo(screenX + 27, bobY + 14);
                ctx.fill();
            } else {
                // Weapon upgrade (golden spear tip)
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(screenX + 16, bobY);
                ctx.lineTo(screenX + 24, bobY + 20);
                ctx.lineTo(screenX + 16, bobY + 16);
                ctx.lineTo(screenX + 8, bobY + 20);
                ctx.closePath();
                ctx.fill();
                
                // Shaft
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(screenX + 14, bobY + 16, 4, 16);
                
                // Sparkle
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(screenX + 12, bobY + 4, 2, 2);
                ctx.fillRect(screenX + 20, bobY + 8, 2, 2);
            }
        });
    }
}
