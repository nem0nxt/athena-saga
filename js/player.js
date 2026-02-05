// Athena - Player Character (Updated with pixel art sprites)

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 56;
        this.velX = 0;
        this.velY = 0;
        
        // Physics
        this.speed = 4;
        this.jumpForce = -14;
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
        
        // Attack hitbox
        this.attackBox = { x: 0, y: 0, width: 60, height: 40, active: false };
        
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
    }
    
    upgradeWeapon() {
        this.weaponLevel = Math.min(3, this.weaponLevel + 1);
        this.addPowerUpParticles();
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
        // Simplified fallback rendering
        const bounce = this.state === 'run' ? Math.sin(this.animFrame * Math.PI / 2) * 2 : 0;
        
        // Body
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(12, 24 - bounce, 16, 24);
        
        // Armor
        ctx.fillStyle = '#cd7f32';
        ctx.fillRect(12, 20 - bounce, 16, 12);
        
        // Head
        ctx.fillStyle = '#f4c7a5';
        ctx.fillRect(14, 4 - bounce, 12, 14);
        
        // Helmet
        ctx.fillStyle = '#cd7f32';
        ctx.fillRect(10, 0 - bounce, 20, 6);
        
        // Plume
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(16, -8 - bounce, 8, 10);
        
        // Legs
        ctx.fillStyle = '#f4c7a5';
        ctx.fillRect(12, 46 - bounce, 6, 10);
        ctx.fillRect(22, 46 - bounce, 6, 10);
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
