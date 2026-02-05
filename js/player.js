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
        // GOLDEN AXE STYLE - Amazon warrior goddess (blonde Tyris Flare style)
        const bounce = this.state === 'run' ? Math.sin(this.animFrame * Math.PI / 2) * 3 : 0;
        const attackOffset = this.state === 'attack' ? this.spriteFrame * 4 : 0;
        const breathe = Math.sin(Date.now() / 400) * 1;
        
        // === BLONDE FLOWING HAIR ===
        ctx.fillStyle = '#FFD700'; // Golden blonde
        // Hair back (flowing behind)
        ctx.fillRect(6, -4 - bounce, 36, 28);
        // Hair flowing down back
        ctx.fillRect(4, 20 - bounce, 12, 30 + Math.sin(Date.now() / 200) * 3);
        ctx.fillRect(32, 20 - bounce, 10, 25 + Math.sin(Date.now() / 180) * 3);
        // Hair highlights
        ctx.fillStyle = '#FFEC8B';
        ctx.fillRect(10, 0 - bounce, 6, 20);
        ctx.fillRect(28, 2 - bounce, 6, 18);
        
        // === LEGS (toned warrior legs) ===
        ctx.fillStyle = '#F4C7A0'; // Skin tone
        // Left leg
        ctx.fillRect(10, 44 - bounce, 10, 20);
        // Right leg  
        ctx.fillRect(26, 42 - bounce, 10, 22);
        
        // Leg definition/muscles
        ctx.fillStyle = '#E0B090';
        ctx.fillRect(12, 48 - bounce, 3, 12);
        ctx.fillRect(28, 46 - bounce, 3, 14);
        
        // Boots (warrior sandals)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(8, 62 - bounce, 14, 6);
        ctx.fillRect(24, 62 - bounce, 14, 6);
        // Boot straps
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(10, 54 - bounce, 10, 2);
        ctx.fillRect(10, 58 - bounce, 10, 2);
        ctx.fillRect(26, 52 - bounce, 10, 2);
        ctx.fillRect(26, 56 - bounce, 10, 2);
        
        // === BIKINI BOTTOM (golden) ===
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(10, 38 - bounce, 26, 10);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(12, 40 - bounce, 22, 6);
        // Belt decoration
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(20, 38 - bounce, 8, 3);
        
        // === TONED MIDRIFF ===
        ctx.fillStyle = '#F4C7A0';
        ctx.fillRect(12, 26 - bounce + breathe, 22, 14);
        // Abs definition
        ctx.fillStyle = '#E0B090';
        ctx.fillRect(18, 28 - bounce + breathe, 2, 10);
        ctx.fillRect(24, 28 - bounce + breathe, 2, 10);
        ctx.fillRect(14, 32 - bounce + breathe, 18, 1);
        ctx.fillRect(14, 36 - bounce + breathe, 18, 1);
        
        // === BIKINI TOP (golden) ===
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(10, 18 - bounce + breathe, 26, 10);
        ctx.fillStyle = '#FFD700';
        // Left cup
        ctx.fillRect(12, 20 - bounce + breathe, 10, 7);
        // Right cup
        ctx.fillRect(24, 20 - bounce + breathe, 10, 7);
        // Strap
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(22, 18 - bounce + breathe, 2, 10);
        
        // === ARMS ===
        ctx.fillStyle = '#F4C7A0';
        // Left arm (shield arm)
        ctx.fillRect(2, 18 - bounce, 10, 6);
        ctx.fillRect(0, 24 - bounce, 10, 20);
        // Right arm (weapon arm)
        if (this.state === 'attack') {
            ctx.fillRect(34 + attackOffset, 16 - bounce, 12, 6);
            ctx.fillRect(40 + attackOffset, 20 - bounce, 10, 20);
        } else {
            ctx.fillRect(34, 18 - bounce, 10, 6);
            ctx.fillRect(36, 24 - bounce, 10, 20);
        }
        
        // Arm bands (golden)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, 24 - bounce, 10, 3);
        ctx.fillRect(0, 38 - bounce, 10, 3);
        if (this.state === 'attack') {
            ctx.fillRect(40 + attackOffset, 20 - bounce, 10, 3);
            ctx.fillRect(40 + attackOffset, 34 - bounce, 10, 3);
        } else {
            ctx.fillRect(36, 24 - bounce, 10, 3);
            ctx.fillRect(36, 38 - bounce, 10, 3);
        }
        
        // === FACE ===
        ctx.fillStyle = '#F4C7A0';
        ctx.fillRect(14, 2 - bounce, 18, 18);
        
        // Eyes (blue warrior eyes)
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(16, 8 - bounce, 5, 4);
        ctx.fillRect(25, 8 - bounce, 5, 4);
        // Pupils
        ctx.fillStyle = '#000080';
        ctx.fillRect(18, 9 - bounce, 2, 2);
        ctx.fillRect(27, 9 - bounce, 2, 2);
        // Eye whites
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(16, 8 - bounce, 2, 2);
        ctx.fillRect(25, 8 - bounce, 2, 2);
        
        // Eyebrows (determined look)
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(15, 6 - bounce, 6, 2);
        ctx.fillRect(25, 6 - bounce, 6, 2);
        
        // Nose
        ctx.fillStyle = '#E8B090';
        ctx.fillRect(21, 10 - bounce, 4, 5);
        
        // Lips (red)
        ctx.fillStyle = '#CC6666';
        ctx.fillRect(19, 16 - bounce, 8, 2);
        
        // === TIARA/HEADBAND (golden with gem) ===
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(12, 0 - bounce, 22, 4);
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(14, 1 - bounce, 18, 2);
        // Center gem (blue sapphire - Athena's wisdom)
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(20, 0 - bounce, 6, 4);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(21, 1 - bounce, 2, 2);
        
        // === SHIELD (round Greek aspis with owl) ===
        if (this.blocking) {
            // Shield raised in front
            ctx.fillStyle = '#CD7F32';
            ctx.beginPath();
            ctx.arc(-6, 30 - bounce, 20, 0, Math.PI * 2);
            ctx.fill();
            // Shield inner
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(-6, 30 - bounce, 16, 0, Math.PI * 2);
            ctx.fill();
            // Owl emblem
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(-6, 30 - bounce, 8, 0, Math.PI * 2);
            ctx.fill();
            // Owl eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(-10, 28 - bounce, 3, 3);
            ctx.fillRect(-2, 28 - bounce, 3, 3);
        } else {
            // Shield at side
            ctx.fillStyle = '#CD7F32';
            ctx.beginPath();
            ctx.arc(-4, 34 - bounce, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(-4, 34 - bounce, 12, 0, Math.PI * 2);
            ctx.fill();
            // Owl emblem (simplified)
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-8, 30 - bounce, 8, 8);
        }
        
        // === SPEAR (Greek dory) ===
        ctx.fillStyle = '#8B4513'; // Wood shaft
        if (this.state === 'attack') {
            // Thrusting spear
            ctx.fillRect(48, 22 - bounce, 44 + attackOffset * 3, 4);
            // Spear tip (leaf-shaped)
            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(92 + attackOffset * 3, 18 - bounce);
            ctx.lineTo(104 + attackOffset * 3, 24 - bounce);
            ctx.lineTo(92 + attackOffset * 3, 30 - bounce);
            ctx.closePath();
            ctx.fill();
            // Tip shine
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(94 + attackOffset * 3, 22 - bounce, 4, 2);
        } else {
            // Spear held upright
            ctx.fillRect(44, -30 - bounce, 4, 74);
            // Spear tip (leaf-shaped)
            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(40, -30 - bounce);
            ctx.lineTo(46, -46 - bounce);
            ctx.lineTo(52, -30 - bounce);
            ctx.closePath();
            ctx.fill();
            // Spear butt
            ctx.fillStyle = '#B8860B';
            ctx.fillRect(43, 40 - bounce, 6, 6);
            
            // Weapon level glow
            if (this.weaponLevel >= 2) {
                ctx.fillStyle = this.weaponLevel >= 3 ? '#FF6600' : '#FFD700';
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
                ctx.beginPath();
                ctx.arc(46, -38 - bounce, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
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
