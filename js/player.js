// Athena - Player Character (Rastan Saga style large sprite)

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 64;
        this.velX = 0;
        this.velY = 0;
        
        // Physics
        this.speed = 4;
        this.jumpForce = -15;
        this.gravity = 0.6;
        this.friction = 0.85;
        
        // State
        this.health = 100;
        this.maxHealth = 100;
        this.facing = 1; // 1 = right, -1 = left
        this.grounded = false;
        this.jumping = false;
        this.attacking = false;
        this.blocking = false;
        this.attackCooldown = 0;
        this.blockCooldown = 0;
        this.invulnerable = 0;
        this.weaponLevel = 1;
        
        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.state = 'idle'; // idle, run, jump, attack, block, hurt
        
        // Sprite animation
        this.spriteFrame = 0;
        this.spriteTimer = 0;
        
        // Attack hitbox (larger for bigger sprite)
        this.attackBox = { x: 0, y: 0, width: 70, height: 48, active: false };
        
        // Effects
        this.particles = [];
    }
    
    update(keys, platforms, deltaTime) {
        // Update cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.blockCooldown > 0) this.blockCooldown -= deltaTime;
        if (this.invulnerable > 0) this.invulnerable -= deltaTime;
        
        // Movement input
        if (!this.attacking && !this.blocking) {
            if (keys.left) {
                this.velX = -this.speed;
                this.facing = -1;
            } else if (keys.right) {
                this.velX = this.speed;
                this.facing = 1;
            } else {
                this.velX *= this.friction;
            }
            
            // Jump
            if ((keys.up || keys.jump) && this.grounded && !this.jumping) {
                this.velY = this.jumpForce;
                this.grounded = false;
                this.jumping = true;
                this.addJumpParticles();
                
                // Play jump sound
                if (window.audioManager) {
                    window.audioManager.playJump();
                }
            }
        }
        
        // Reset jump flag when key released
        if (!keys.up && !keys.jump) {
            this.jumping = false;
        }
        
        // Attack
        if (keys.attack && !this.attacking && this.attackCooldown <= 0 && !this.blocking) {
            this.startAttack();
        }
        
        // Block
        this.blocking = keys.block && this.grounded && !this.attacking;
        if (this.blocking) {
            this.velX = 0;
        }
        
        // Apply gravity
        this.velY += this.gravity;
        if (this.velY > 15) this.velY = 15; // Terminal velocity
        
        // Apply velocity
        this.x += this.velX;
        this.y += this.velY;
        
        // Platform collision
        this.grounded = false;
        platforms.forEach(platform => {
            if (this.checkPlatformCollision(platform)) {
                // Landing
                if (this.velY > 0) {
                    this.y = platform.y - this.height;
                    this.velY = 0;
                    this.grounded = true;
                    if (Math.abs(this.velX) > 1) {
                        this.addLandParticles();
                        // Play landing sound
                        if (window.audioManager) {
                            window.audioManager.playLanding();
                        }
                    }
                }
            }
        });
        
        // World boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > LEVEL_DATA.width - this.width) this.x = LEVEL_DATA.width - this.width;
        
        // Update attack box position
        this.updateAttackBox();
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update sprite animation
        this.updateSpriteAnimation(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update state
        this.updateState();
    }
    
    checkPlatformCollision(platform) {
        const playerBottom = this.y + this.height;
        const wasAbove = this.y + this.height - this.velY <= platform.y + 5;
        
        return this.x + this.width > platform.x &&
               this.x < platform.x + platform.width &&
               playerBottom > platform.y &&
               playerBottom < platform.y + platform.height + 10 &&
               this.velY >= 0 &&
               wasAbove;
    }
    
    startAttack() {
        this.attacking = true;
        this.attackCooldown = 400;
        this.attackBox.active = true;
        this.animFrame = 0;
        this.spriteFrame = 0;
        this.addAttackParticles();
        
        // Play spear attack sound
        if (window.audioManager) {
            window.audioManager.playSpearAttack();
        }
        
        // Attack duration
        setTimeout(() => {
            this.attacking = false;
            this.attackBox.active = false;
        }, 200);
    }
    
    updateAttackBox() {
        const spearReach = 50 + (this.weaponLevel - 1) * 10;
        if (this.facing === 1) {
            this.attackBox.x = this.x + this.width;
            this.attackBox.width = spearReach;
        } else {
            this.attackBox.x = this.x - spearReach;
            this.attackBox.width = spearReach;
        }
        this.attackBox.y = this.y + 10;
        this.attackBox.height = 30;
    }
    
    updateState() {
        if (this.attacking) {
            this.state = 'attack';
        } else if (this.blocking) {
            this.state = 'block';
        } else if (!this.grounded) {
            this.state = 'jump';
        } else if (Math.abs(this.velX) > 0.5) {
            this.state = 'run';
        } else {
            this.state = 'idle';
        }
    }
    
    updateAnimation(deltaTime) {
        this.animTimer += deltaTime;
        
        let frameSpeed = 150;
        if (this.state === 'run') frameSpeed = 100;
        if (this.state === 'attack') frameSpeed = 50;
        
        if (this.animTimer >= frameSpeed) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }
    
    updateSpriteAnimation(deltaTime) {
        this.spriteTimer += deltaTime;
        
        let frameSpeed = 150;
        let maxFrames = 4;
        
        switch (this.state) {
            case 'idle':
                frameSpeed = 200;
                maxFrames = 4;
                break;
            case 'run':
                frameSpeed = 80;
                maxFrames = 6;
                break;
            case 'attack':
                frameSpeed = 50;
                maxFrames = 4;
                break;
            case 'jump':
                frameSpeed = 200;
                maxFrames = 2;
                break;
            case 'block':
                frameSpeed = 200;
                maxFrames = 1;
                break;
        }
        
        if (this.spriteTimer >= frameSpeed) {
            this.spriteTimer = 0;
            this.spriteFrame = (this.spriteFrame + 1) % maxFrames;
        }
    }
    
    takeDamage(amount) {
        if (this.invulnerable > 0) return false;
        if (this.blocking) {
            // Reduced damage when blocking
            amount = Math.floor(amount * 0.2);
            this.addBlockParticles();
            
            // Play shield block sound
            if (window.audioManager) {
                window.audioManager.playShieldBlock();
            }
        } else {
            // Play player damage sound
            if (window.audioManager) {
                window.audioManager.playPlayerDamage();
            }
        }
        
        this.health -= amount;
        this.invulnerable = 1000; // 1 second invulnerability
        
        // Knockback
        this.velX = -this.facing * 8;
        this.velY = -5;
        
        this.addHurtParticles();
        
        return true;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.addHealParticles();
        
        // Play power-up sound for healing
        if (window.audioManager) {
            window.audioManager.playPowerUp();
        }
    }
    
    upgradeWeapon() {
        this.weaponLevel = Math.min(3, this.weaponLevel + 1);
        this.addPowerUpParticles();
        
        // Play power-up sound
        if (window.audioManager) {
            window.audioManager.playPowerUp();
        }
    }
    
    // Particle effects
    addJumpParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                y: this.y + this.height,
                velX: (Math.random() - 0.5) * 3,
                velY: Math.random() * 2,
                life: 300,
                color: '#aaaaaa',
                size: 4 + Math.random() * 3
            });
        }
    }
    
    addLandParticles() {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 30,
                y: this.y + this.height,
                velX: (Math.random() - 0.5) * 4,
                velY: -Math.random() * 2,
                life: 200,
                color: '#8b7355',
                size: 3 + Math.random() * 2
            });
        }
    }
    
    addAttackParticles() {
        const startX = this.facing === 1 ? this.x + this.width : this.x;
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: startX + this.facing * i * 8,
                y: this.y + 20 + (Math.random() - 0.5) * 20,
                velX: this.facing * (3 + Math.random() * 5),
                velY: (Math.random() - 0.5) * 2,
                life: 150,
                color: this.weaponLevel >= 2 ? '#ffd700' : '#ffffff',
                size: 3 + Math.random() * 2
            });
        }
    }
    
    addBlockParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.x + (this.facing === 1 ? 0 : this.width),
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 30,
                velX: -this.facing * (2 + Math.random() * 4),
                velY: (Math.random() - 0.5) * 3,
                life: 200,
                color: '#4488ff',
                size: 4 + Math.random() * 3
            });
        }
    }
    
    addHurtParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                velX: (Math.random() - 0.5) * 8,
                velY: (Math.random() - 0.5) * 8,
                life: 400,
                color: '#ff4444',
                size: 4 + Math.random() * 4
            });
        }
    }
    
    addHealParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height,
                velX: (Math.random() - 0.5) * 4,
                velY: -2 - Math.random() * 4,
                life: 600,
                color: '#44ff44',
                size: 4 + Math.random() * 3
            });
        }
    }
    
    addPowerUpParticles() {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                velX: Math.cos(angle) * 5,
                velY: Math.sin(angle) * 5,
                life: 500,
                color: '#ffd700',
                size: 5 + Math.random() * 3
            });
        }
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(p => {
            p.x += p.velX;
            p.y += p.velY;
            p.velY += 0.1; // Gravity
            p.life -= deltaTime;
            p.size *= 0.98;
            return p.life > 0 && p.size > 0.5;
        });
    }
    
    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        const screenY = this.y;
        
        // Draw particles first (behind player)
        this.drawParticles(ctx, cameraX);
        
        // Invulnerability flash
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 50) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.save();
        
        // Get sprite from sprite manager
        const sprites = window.spriteManager && window.spriteManager.sprites.athena;
        
        if (sprites && sprites[this.state]) {
            const frames = sprites[this.state];
            const frame = frames[this.spriteFrame % frames.length];
            
            if (frame) {
                // Calculate position for centered sprite
                const spriteWidth = frame.width;
                const spriteHeight = frame.height;
                const offsetX = (spriteWidth - this.width) / 2;
                const offsetY = spriteHeight - this.height - 8;
                
                if (this.facing === -1) {
                    ctx.translate(screenX + this.width / 2, screenY - offsetY);
                    ctx.scale(-1, 1);
                    ctx.drawImage(frame, -spriteWidth / 2, 0);
                } else {
                    ctx.drawImage(frame, screenX - offsetX, screenY - offsetY);
                }
            }
        } else {
            // Fallback to old drawing method
            if (this.facing === -1) {
                ctx.translate(screenX + this.width, screenY);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(screenX, screenY);
            }
            this.drawAthenaFallback(ctx);
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;
    }
    
    drawAthenaFallback(ctx) {
        // RASTAN SAGA AUTHENTIC STYLE (1987 Arcade)
        // Female warrior version - same palette and style as original Rastan
        const bounce = this.state === 'run' ? Math.sin(this.animFrame * Math.PI / 2) * 2 : 0;
        const runFrame = this.state === 'run' ? this.animFrame % 4 : 0;
        const attackFrame = this.state === 'attack' ? this.spriteFrame : 0;
        
        // Rastan authentic color palette
        const SKIN = '#D4A574';      // Rastan skin tone
        const SKIN_SHADOW = '#B8956A';
        const SKIN_DARK = '#8B6914';
        const HAIR = '#4A3728';       // Dark brown hair
        const HAIR_LIGHT = '#6B5344';
        const LOINCLOTH = '#1E90FF';  // Blue loincloth like Rastan
        const LOINCLOTH_DARK = '#0066CC';
        const METAL = '#C0C0C0';
        const METAL_SHINE = '#FFFFFF';
        const METAL_DARK = '#808080';
        const LEATHER = '#8B4513';
        const LEATHER_DARK = '#5D2E0C';
        
        // === LEGS (Rastan muscular style) ===
        // Left leg
        ctx.fillStyle = SKIN;
        ctx.fillRect(12, 46 - bounce, 8, 18);
        ctx.fillStyle = SKIN_SHADOW;
        ctx.fillRect(12, 50 - bounce, 3, 12);
        
        // Right leg
        ctx.fillStyle = SKIN;
        ctx.fillRect(26, 46 - bounce, 8, 18);
        ctx.fillStyle = SKIN_SHADOW;
        ctx.fillRect(26, 50 - bounce, 3, 12);
        
        // Boots (Rastan style - brown leather)
        ctx.fillStyle = LEATHER;
        ctx.fillRect(10, 60 - bounce, 12, 8);
        ctx.fillRect(24, 60 - bounce, 12, 8);
        ctx.fillStyle = LEATHER_DARK;
        ctx.fillRect(10, 64 - bounce, 12, 4);
        ctx.fillRect(24, 64 - bounce, 12, 4);
        
        // === BLUE LOINCLOTH (Rastan signature) ===
        ctx.fillStyle = LOINCLOTH;
        ctx.fillRect(10, 40 - bounce, 26, 10);
        // Front flap
        ctx.fillRect(16, 48 - bounce, 14, 8);
        ctx.fillStyle = LOINCLOTH_DARK;
        ctx.fillRect(18, 50 - bounce, 10, 5);
        // Belt
        ctx.fillStyle = LEATHER;
        ctx.fillRect(10, 38 - bounce, 26, 4);
        ctx.fillStyle = METAL;
        ctx.fillRect(20, 38 - bounce, 6, 4); // Buckle
        
        // === TORSO (muscular Rastan style) ===
        ctx.fillStyle = SKIN;
        ctx.fillRect(12, 20 - bounce, 22, 20);
        // Muscle definition
        ctx.fillStyle = SKIN_SHADOW;
        ctx.fillRect(16, 24 - bounce, 2, 12);
        ctx.fillRect(28, 24 - bounce, 2, 12);
        // Chest (feminine but muscular)
        ctx.fillStyle = SKIN;
        ctx.fillRect(14, 22 - bounce, 8, 6);
        ctx.fillRect(24, 22 - bounce, 8, 6);
        
        // Bikini top (blue to match loincloth - Rastan palette)
        ctx.fillStyle = LOINCLOTH;
        ctx.fillRect(14, 22 - bounce, 8, 5);
        ctx.fillRect(24, 22 - bounce, 8, 5);
        ctx.fillStyle = LOINCLOTH_DARK;
        ctx.fillRect(16, 23 - bounce, 4, 3);
        ctx.fillRect(26, 23 - bounce, 4, 3);
        
        // === ARMS (Rastan muscular) ===
        ctx.fillStyle = SKIN;
        // Left arm
        ctx.fillRect(4, 20 - bounce, 8, 6);
        ctx.fillRect(2, 26 - bounce, 8, 18);
        ctx.fillStyle = SKIN_SHADOW;
        ctx.fillRect(4, 28 - bounce, 3, 14);
        
        // Right arm (sword arm)
        ctx.fillStyle = SKIN;
        if (this.state === 'attack') {
            // Arm extended for attack
            ctx.fillRect(34, 18 - bounce - attackFrame * 2, 8, 6);
            ctx.fillRect(36, 10 - bounce - attackFrame * 4, 8, 14);
        } else {
            ctx.fillRect(34, 20 - bounce, 8, 6);
            ctx.fillRect(36, 26 - bounce, 8, 18);
        }
        
        // Arm bands (Rastan style metal)
        ctx.fillStyle = METAL;
        ctx.fillRect(2, 26 - bounce, 8, 3);
        ctx.fillRect(2, 40 - bounce, 8, 3);
        if (this.state === 'attack') {
            ctx.fillRect(36, 10 - bounce - attackFrame * 4, 8, 3);
        } else {
            ctx.fillRect(36, 26 - bounce, 8, 3);
            ctx.fillRect(36, 40 - bounce, 8, 3);
        }
        
        // === HEAD ===
        ctx.fillStyle = SKIN;
        ctx.fillRect(14, 4 - bounce, 18, 16);
        
        // Eyes (Rastan style - simple)
        ctx.fillStyle = '#000000';
        ctx.fillRect(17, 10 - bounce, 3, 3);
        ctx.fillRect(26, 10 - bounce, 3, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(17, 10 - bounce, 1, 1);
        ctx.fillRect(26, 10 - bounce, 1, 1);
        
        // Nose & mouth (minimal like Rastan)
        ctx.fillStyle = SKIN_SHADOW;
        ctx.fillRect(22, 12 - bounce, 2, 4);
        ctx.fillStyle = SKIN_DARK;
        ctx.fillRect(20, 16 - bounce, 6, 2);
        
        // === HAIR (Long flowing - Rastan style brown) ===
        ctx.fillStyle = HAIR;
        // Top hair
        ctx.fillRect(12, 0 - bounce, 22, 8);
        // Side hair
        ctx.fillRect(10, 4 - bounce, 6, 16);
        ctx.fillRect(30, 4 - bounce, 6, 16);
        // Back hair (long flowing)
        ctx.fillRect(8, 18 - bounce, 8, 28 + Math.sin(Date.now() / 200) * 2);
        ctx.fillRect(32, 18 - bounce, 6, 24 + Math.sin(Date.now() / 180) * 2);
        // Hair highlights
        ctx.fillStyle = HAIR_LIGHT;
        ctx.fillRect(14, 2 - bounce, 4, 4);
        ctx.fillRect(26, 2 - bounce, 4, 4);
        ctx.fillRect(10, 20 - bounce, 3, 10);
        
        // Headband (Rastan style)
        ctx.fillStyle = LOINCLOTH;
        ctx.fillRect(10, 6 - bounce, 26, 3);
        
        // === SWORD (Rastan's signature large sword) ===
        if (this.state === 'attack') {
            // Sword swinging down
            const swingAngle = attackFrame * 20;
            ctx.fillStyle = METAL;
            // Blade (large Rastan sword)
            ctx.fillRect(40, -20 - bounce + attackFrame * 8, 6, 40);
            ctx.fillStyle = METAL_SHINE;
            ctx.fillRect(41, -18 - bounce + attackFrame * 8, 2, 36);
            ctx.fillStyle = METAL_DARK;
            ctx.fillRect(44, -16 - bounce + attackFrame * 8, 2, 32);
            // Hilt
            ctx.fillStyle = LEATHER;
            ctx.fillRect(38, 18 - bounce + attackFrame * 8, 10, 6);
            ctx.fillStyle = METAL;
            ctx.fillRect(36, 16 - bounce + attackFrame * 8, 14, 3);
        } else {
            // Sword at rest (over shoulder - Rastan pose)
            ctx.fillStyle = METAL;
            ctx.fillRect(38, -30 - bounce, 6, 44);
            ctx.fillStyle = METAL_SHINE;
            ctx.fillRect(39, -28 - bounce, 2, 40);
            ctx.fillStyle = METAL_DARK;
            ctx.fillRect(42, -26 - bounce, 2, 36);
            // Hilt
            ctx.fillStyle = LEATHER;
            ctx.fillRect(36, 12 - bounce, 10, 6);
            ctx.fillStyle = METAL;
            ctx.fillRect(34, 10 - bounce, 14, 3);
            
            // Weapon glow for upgrades
            if (this.weaponLevel >= 2) {
                ctx.fillStyle = this.weaponLevel >= 3 ? '#FF4400' : '#FFAA00';
                ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 100) * 0.2;
                ctx.fillRect(36, -32 - bounce, 10, 48);
                ctx.globalAlpha = 1;
            }
        }
        
        // === SHIELD (on back when not blocking) ===
        if (this.blocking) {
            // Shield in front
            ctx.fillStyle = METAL;
            ctx.beginPath();
            ctx.arc(0, 32 - bounce, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = METAL_DARK;
            ctx.beginPath();
            ctx.arc(0, 32 - bounce, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = LOINCLOTH;
            ctx.beginPath();
            ctx.arc(0, 32 - bounce, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Small round shield visible on arm
            ctx.fillStyle = METAL_DARK;
            ctx.beginPath();
            ctx.arc(0, 34 - bounce, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawParticles(ctx, cameraX) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life / 400;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - cameraX - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        ctx.globalAlpha = 1;
    }
}
