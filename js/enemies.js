// Enemies for Athena Saga (Updated with pixel art sprites)

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.facing = -1;
        this.velX = 0;
        this.velY = 0;
        this.health = 30;
        this.maxHealth = 30;
        this.damage = 15;
        this.points = 100;
        this.invulnerable = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.attackCooldown = 0;
        this.state = 'idle';
        this.particles = [];
        
        // Sprite animation
        this.spriteFrame = 0;
        this.spriteTimer = 0;
        
        // Type-specific properties
        this.setupType();
    }
    
    setupType() {
        switch (this.type) {
            case 'skeleton':
                this.width = 32;
                this.height = 48;
                this.health = 30;
                this.maxHealth = 30;
                this.speed = 1.5;
                this.damage = 15;
                this.points = 100;
                this.patrolRange = 100;
                this.startX = this.x;
                break;
                
            case 'harpy':
                this.width = 40;
                this.height = 36;
                this.health = 25;
                this.maxHealth = 25;
                this.speed = 2;
                this.damage = 12;
                this.points = 150;
                this.flyHeight = this.y;
                this.flyPhase = Math.random() * Math.PI * 2;
                break;
                
            case 'cyclops':
                this.width = 80;
                this.height = 96;
                this.health = 200;
                this.maxHealth = 200;
                this.speed = 1;
                this.damage = 30;
                this.points = 1000;
                this.isBoss = true;
                this.attackPattern = 0;
                this.stompCooldown = 0;
                break;
        }
    }
    
    update(player, platforms, deltaTime) {
        if (!this.active) return;
        
        // Cooldowns
        if (this.invulnerable > 0) this.invulnerable -= deltaTime;
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.stompCooldown > 0) this.stompCooldown -= deltaTime;
        
        // Animation
        this.animTimer += deltaTime;
        if (this.animTimer > 150) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        // Sprite animation
        this.spriteTimer += deltaTime;
        if (this.spriteTimer > 120) {
            this.spriteTimer = 0;
            this.spriteFrame = (this.spriteFrame + 1) % 4;
        }
        
        // Type-specific behavior
        switch (this.type) {
            case 'skeleton':
                this.updateSkeleton(player, platforms, deltaTime);
                break;
            case 'harpy':
                this.updateHarpy(player, deltaTime);
                break;
            case 'cyclops':
                this.updateCyclops(player, platforms, deltaTime);
                break;
        }
        
        // Update particles
        this.updateParticles(deltaTime);
    }
    
    updateSkeleton(player, platforms, deltaTime) {
        const distToPlayer = player.x - this.x;
        
        // Face player if close
        if (Math.abs(distToPlayer) < 200) {
            this.facing = distToPlayer > 0 ? 1 : -1;
            this.state = 'chase';
            this.velX = this.facing * this.speed;
        } else {
            // Patrol
            this.state = 'patrol';
            if (this.x <= this.startX - this.patrolRange) {
                this.facing = 1;
            } else if (this.x >= this.startX + this.patrolRange) {
                this.facing = -1;
            }
            this.velX = this.facing * this.speed * 0.5;
        }
        
        // Apply gravity
        this.velY += 0.5;
        if (this.velY > 10) this.velY = 10;
        
        // Apply velocity
        this.x += this.velX;
        this.y += this.velY;
        
        // Platform collision
        platforms.forEach(platform => {
            if (this.checkPlatformCollision(platform)) {
                this.y = platform.y - this.height;
                this.velY = 0;
            }
        });
    }
    
    updateHarpy(player, deltaTime) {
        const distToPlayer = Math.abs(player.x - this.x);
        const dirToPlayer = player.x > this.x ? 1 : -1;
        
        this.facing = dirToPlayer;
        this.flyPhase += deltaTime * 0.005;
        
        // Swoop attack pattern
        if (distToPlayer < 250 && this.attackCooldown <= 0) {
            this.state = 'attack';
            this.velX = dirToPlayer * this.speed * 2;
            this.velY = 3;
            this.attackCooldown = 2000;
        } else {
            this.state = 'fly';
            // Sinusoidal flight
            this.y = this.flyHeight + Math.sin(this.flyPhase) * 30;
            this.velX = dirToPlayer * this.speed * 0.5;
        }
        
        // Apply horizontal movement
        this.x += this.velX;
        
        // Return to fly height after swoop
        if (this.state === 'attack' && this.y > this.flyHeight + 50) {
            this.velY = -2;
        }
        if (this.state === 'attack') {
            this.y += this.velY;
        }
        
        // Bounds
        if (this.y < 50) this.y = 50;
        if (this.y > 350) {
            this.y = 350;
            this.state = 'fly';
        }
    }
    
    updateCyclops(player, platforms, deltaTime) {
        const distToPlayer = player.x - this.x;
        const absDistance = Math.abs(distToPlayer);
        
        this.facing = distToPlayer > 0 ? 1 : -1;
        
        // Boss patterns
        if (absDistance < 400) {
            if (absDistance > 100) {
                // Chase player
                this.state = 'walk';
                this.velX = this.facing * this.speed;
            } else {
                // Close enough to attack
                this.velX = 0;
                if (this.attackCooldown <= 0) {
                    this.attackPattern = (this.attackPattern + 1) % 3;
                    
                    if (this.attackPattern === 0 || this.attackPattern === 1) {
                        // Swing attack
                        this.state = 'attack';
                        this.attackCooldown = 1500;
                        
                        // Play boss attack sound
                        if (window.audioManager) {
                            window.audioManager.playBossAttack();
                        }
                    } else {
                        // Stomp attack
                        this.state = 'stomp';
                        this.attackCooldown = 2000;
                        this.stompCooldown = 500;
                        
                        // Play boss roar/stomp sound
                        if (window.audioManager) {
                            window.audioManager.playBossRoar();
                        }
                    }
                } else {
                    this.state = 'idle';
                }
            }
        } else {
            this.state = 'idle';
            this.velX = 0;
        }
        
        // Apply gravity
        this.velY += 0.5;
        if (this.velY > 10) this.velY = 10;
        
        // Apply velocity
        this.x += this.velX;
        this.y += this.velY;
        
        // Platform collision
        platforms.forEach(platform => {
            if (this.checkPlatformCollision(platform)) {
                this.y = platform.y - this.height;
                this.velY = 0;
            }
        });
        
        // Stay in boss arena
        if (this.x < 2550) this.x = 2550;
        if (this.x > 3100) this.x = 3100;
    }
    
    checkPlatformCollision(platform) {
        const bottom = this.y + this.height;
        return this.x + this.width > platform.x &&
               this.x < platform.x + platform.width &&
               bottom > platform.y &&
               bottom < platform.y + platform.height + 10 &&
               this.velY >= 0;
    }
    
    takeDamage(amount, knockbackDir) {
        if (this.invulnerable > 0) return false;
        
        this.health -= amount;
        this.invulnerable = 200;
        
        // Knockback (less for boss)
        const knockbackMult = this.isBoss ? 0.3 : 1;
        this.velX = knockbackDir * 5 * knockbackMult;
        if (!this.isBoss || this.type !== 'harpy') {
            this.velY = -3 * knockbackMult;
        }
        
        // Hit particles
        this.addHitParticles();
        
        // Play enemy hit sound
        if (window.audioManager) {
            window.audioManager.playEnemyHit();
        }
        
        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }
    
    die() {
        this.active = false;
        this.addDeathParticles();
        
        // Play enemy death sound
        if (window.audioManager) {
            window.audioManager.playEnemyDeath();
        }
    }
    
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    getAttackHitbox() {
        if (this.state !== 'attack' && this.state !== 'stomp') return null;
        
        if (this.type === 'cyclops') {
            if (this.state === 'stomp' && this.stompCooldown < 200) {
                // Wide stomp area
                return {
                    x: this.x - 30,
                    y: this.y + this.height - 20,
                    width: this.width + 60,
                    height: 30
                };
            } else if (this.state === 'attack') {
                // Club swing
                return {
                    x: this.facing === 1 ? this.x + this.width : this.x - 50,
                    y: this.y + 20,
                    width: 50,
                    height: 60
                };
            }
        }
        
        return null;
    }
    
    addHitParticles() {
        const colors = {
            skeleton: '#e8e8e8',
            harpy: '#8844aa',
            cyclops: '#884422'
        };
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                velX: (Math.random() - 0.5) * 8,
                velY: (Math.random() - 0.5) * 8 - 2,
                life: 300,
                color: colors[this.type] || '#ffffff',
                size: 4 + Math.random() * 4
            });
        }
    }
    
    addDeathParticles() {
        const colors = {
            skeleton: ['#e8e8e8', '#cccccc', '#888888'],
            harpy: ['#8844aa', '#aa66cc', '#6622aa'],
            cyclops: ['#884422', '#aa6644', '#cc8866']
        };
        const cols = colors[this.type] || ['#ffffff'];
        
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                velX: (Math.random() - 0.5) * 10,
                velY: (Math.random() - 0.5) * 10 - 5,
                life: 600,
                color: cols[Math.floor(Math.random() * cols.length)],
                size: 6 + Math.random() * 6
            });
        }
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(p => {
            p.x += p.velX;
            p.y += p.velY;
            p.velY += 0.2;
            p.life -= deltaTime;
            p.size *= 0.97;
            return p.life > 0;
        });
    }
    
    draw(ctx, cameraX) {
        // Draw particles even if inactive
        this.drawParticles(ctx, cameraX);
        
        if (!this.active) return;
        
        const screenX = this.x - cameraX;
        const screenY = this.y;
        
        // Skip if off screen
        if (screenX + this.width < -50 || screenX > 850) return;
        
        // Damage flash
        if (this.invulnerable > 0) {
            ctx.globalAlpha = 0.7;
        }
        
        ctx.save();
        
        // Try to use sprite system
        const sprites = window.spriteManager && window.spriteManager.sprites[this.type];
        let spriteDrawn = false;
        
        if (sprites) {
            let spriteState = this.state;
            
            // Map states to available sprite states
            if (this.type === 'skeleton') {
                spriteState = (this.state === 'chase' || this.state === 'patrol') ? 'walk' : 'idle';
            } else if (this.type === 'harpy') {
                spriteState = this.state === 'attack' ? 'attack' : 'fly';
            } else if (this.type === 'cyclops') {
                if (this.state === 'stomp') spriteState = 'stomp';
                else if (this.state === 'attack') spriteState = 'attack';
                else if (this.state === 'walk') spriteState = 'walk';
                else spriteState = 'idle';
            }
            
            if (sprites[spriteState]) {
                const frames = sprites[spriteState];
                const frame = frames[this.spriteFrame % frames.length];
                
                if (frame) {
                    spriteDrawn = true;
                    const spriteWidth = frame.width;
                    const spriteHeight = frame.height;
                    const offsetX = (spriteWidth - this.width) / 2;
                    const offsetY = spriteHeight - this.height;
                    
                    if (this.facing === -1) {
                        ctx.translate(screenX + this.width / 2, screenY - offsetY);
                        ctx.scale(-1, 1);
                        ctx.drawImage(frame, -spriteWidth / 2, 0);
                    } else {
                        ctx.drawImage(frame, screenX - offsetX, screenY - offsetY);
                    }
                }
            }
        }
        
        // Fallback to old drawing if sprites not available
        if (!spriteDrawn) {
            if (this.facing === -1) {
                ctx.translate(screenX + this.width, screenY);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(screenX, screenY);
            }
            
            switch (this.type) {
                case 'skeleton':
                    this.drawSkeletonFallback(ctx);
                    break;
                case 'harpy':
                    this.drawHarpyFallback(ctx);
                    break;
                case 'cyclops':
                    this.drawCyclopsFallback(ctx);
                    break;
            }
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;
        
        // Boss health bar
        if (this.isBoss && this.health > 0) {
            this.drawBossHealthBar(ctx, cameraX);
        }
    }
    
    drawSkeletonFallback(ctx) {
        // RASTAN SAGA STYLE - Detailed skeleton warrior
        const walk = this.state === 'chase' || this.state === 'patrol' 
            ? Math.sin(this.animFrame * Math.PI / 2) * 4 : 0;
        const attack = this.state === 'attack' ? this.animFrame * 3 : 0;
        
        // === SKULL ===
        ctx.fillStyle = '#E8E8D0'; // Bone color
        // Main skull
        ctx.fillRect(8, 0, 18, 16);
        // Jaw
        ctx.fillStyle = '#D8D8C0';
        ctx.fillRect(10, 14, 14, 6);
        
        // Eye sockets (glowing red)
        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(10, 4, 6, 6);
        ctx.fillRect(18, 4, 6, 6);
        // Glowing eyes
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(11, 5, 4, 4);
        ctx.fillRect(19, 5, 4, 4);
        // Eye glow effect
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(9, 3, 8, 8);
        ctx.fillRect(17, 3, 8, 8);
        
        // Nose hole
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(15, 10, 4, 4);
        
        // Teeth
        ctx.fillStyle = '#F0F0E0';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(11 + i * 3, 16, 2, 3);
        }
        
        // === SPINE & RIBCAGE ===
        ctx.fillStyle = '#E8E8D0';
        // Spine
        ctx.fillRect(15, 20, 4, 18);
        // Ribs
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = '#D8D8C0';
            ctx.fillRect(6, 22 + i * 4, 22, 3);
            // Rib shadow
            ctx.fillStyle = '#C8C8B0';
            ctx.fillRect(6, 24 + i * 4, 22, 1);
        }
        
        // Pelvis
        ctx.fillStyle = '#E8E8D0';
        ctx.fillRect(8, 36, 18, 6);
        
        // === ARM BONES ===
        ctx.fillStyle = '#D8D8C0';
        // Left arm (shield arm)
        ctx.fillRect(0, 22, 6, 4);
        ctx.fillRect(-2, 26, 4, 14);
        // Right arm (sword arm)
        ctx.fillRect(28, 22, 6, 4);
        ctx.fillRect(30 + attack, 26, 4, 14);
        
        // === LEG BONES ===
        ctx.fillStyle = '#E8E8D0';
        // Left leg
        ctx.fillRect(8 - walk, 42, 6, 16);
        ctx.fillRect(6 - walk, 56, 8, 4);
        // Right leg
        ctx.fillRect(20 + walk, 42, 6, 16);
        ctx.fillRect(18 + walk, 56, 8, 4);
        
        // === RUSTY SWORD ===
        ctx.fillStyle = '#8B4513'; // Handle
        ctx.fillRect(32 + attack, 38, 4, 12);
        ctx.fillStyle = '#A0A0A0'; // Blade
        ctx.fillRect(33 + attack, 18, 3, 22);
        ctx.fillStyle = '#C0C0C0'; // Blade highlight
        ctx.fillRect(34 + attack, 20, 1, 18);
        // Rust spots
        ctx.fillStyle = '#8B4500';
        ctx.fillRect(33 + attack, 24, 2, 2);
        ctx.fillRect(34 + attack, 32, 2, 2);
        
        // === TATTERED CLOTH ===
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(10, 20, 14, 4);
        // Hanging cloth
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(12, 24, 4, 8 + Math.sin(Date.now() / 200) * 2);
        ctx.fillRect(18, 24, 4, 6 + Math.sin(Date.now() / 180) * 2);
    }
    
    drawHarpyFallback(ctx) {
        // RASTAN SAGA STYLE - Menacing harpy with detailed wings
        const wingFlap = Math.sin(this.animFrame * Math.PI / 2) * 18;
        const bodyBob = Math.sin(this.animFrame * Math.PI) * 2;
        
        // === FEATHERED WINGS ===
        // Left wing
        ctx.fillStyle = '#5a2a6a';
        ctx.beginPath();
        ctx.moveTo(10, 18 + bodyBob);
        ctx.lineTo(-20, 4 - wingFlap);
        ctx.lineTo(-25, 10 - wingFlap);
        ctx.lineTo(-18, 20 - wingFlap * 0.5);
        ctx.lineTo(-8, 26);
        ctx.closePath();
        ctx.fill();
        
        // Left wing feathers
        ctx.fillStyle = '#4a1a5a';
        ctx.fillRect(-22, 6 - wingFlap, 4, 12);
        ctx.fillRect(-16, 8 - wingFlap, 4, 10);
        ctx.fillRect(-10, 10 - wingFlap * 0.7, 4, 10);
        
        // Right wing
        ctx.fillStyle = '#5a2a6a';
        ctx.beginPath();
        ctx.moveTo(30, 18 + bodyBob);
        ctx.lineTo(60, 4 - wingFlap);
        ctx.lineTo(65, 10 - wingFlap);
        ctx.lineTo(58, 20 - wingFlap * 0.5);
        ctx.lineTo(48, 26);
        ctx.closePath();
        ctx.fill();
        
        // Right wing feathers
        ctx.fillStyle = '#4a1a5a';
        ctx.fillRect(58, 6 - wingFlap, 4, 12);
        ctx.fillRect(52, 8 - wingFlap, 4, 10);
        ctx.fillRect(46, 10 - wingFlap * 0.7, 4, 10);
        
        // === BODY ===
        ctx.fillStyle = '#DDB8A0';
        // Torso
        ctx.fillRect(14, 12 + bodyBob, 14, 18);
        
        // === TALONED LEGS ===
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(14, 28 + bodyBob, 4, 10);
        ctx.fillRect(24, 28 + bodyBob, 4, 10);
        // Talons
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(12, 36 + bodyBob, 8, 3);
        ctx.fillRect(22, 36 + bodyBob, 8, 3);
        // Sharp claws
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(10, 38 + bodyBob, 3, 2);
        ctx.fillRect(16, 38 + bodyBob, 3, 2);
        ctx.fillRect(20, 38 + bodyBob, 3, 2);
        ctx.fillRect(26, 38 + bodyBob, 3, 2);
        
        // === HEAD ===
        ctx.fillStyle = '#DDB8A0';
        ctx.fillRect(15, 0 + bodyBob, 12, 14);
        
        // Wild hair
        ctx.fillStyle = '#2a1a2a';
        ctx.fillRect(13, -4 + bodyBob, 16, 6);
        ctx.fillRect(10, -2 + bodyBob, 6, 8);
        ctx.fillRect(26, -2 + bodyBob, 6, 8);
        // Hair strands flowing
        ctx.fillRect(8, 0 + bodyBob + Math.sin(Date.now() / 150) * 2, 4, 10);
        ctx.fillRect(30, 0 + bodyBob + Math.sin(Date.now() / 180) * 2, 4, 10);
        
        // Menacing yellow eyes
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(16, 4 + bodyBob, 4, 5);
        ctx.fillRect(22, 4 + bodyBob, 4, 5);
        // Pupils
        ctx.fillStyle = '#000000';
        ctx.fillRect(17, 5 + bodyBob, 2, 3);
        ctx.fillRect(23, 5 + bodyBob, 2, 3);
        
        // Angry mouth
        ctx.fillStyle = '#800000';
        ctx.fillRect(17, 10 + bodyBob, 8, 3);
        // Fangs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(18, 10 + bodyBob, 2, 4);
        ctx.fillRect(22, 10 + bodyBob, 2, 4);
        
        // === FEATHERED SHOULDERS ===
        ctx.fillStyle = '#5a2a6a';
        ctx.fillRect(8, 12 + bodyBob, 8, 6);
        ctx.fillRect(26, 12 + bodyBob, 8, 6);
    }
    
    drawCyclopsFallback(ctx) {
        // RASTAN SAGA STYLE - Massive detailed Cyclops boss
        const walk = this.state === 'walk' ? Math.sin(this.animFrame * Math.PI / 2) * 6 : 0;
        const stomp = this.state === 'stomp' ? Math.abs(Math.sin(this.animFrame * Math.PI)) * 8 : 0;
        const attack = this.state === 'attack' ? this.animFrame * 4 : 0;
        
        // === MASSIVE LEGS ===
        ctx.fillStyle = '#6B4423'; // Dark skin
        // Left leg
        ctx.fillRect(10 - walk, 65, 22, 31);
        // Right leg
        ctx.fillRect(48 + walk, 65 - stomp, 22, 31 + stomp);
        
        // Leg muscles/shadows
        ctx.fillStyle = '#5A3318';
        ctx.fillRect(14 - walk, 70, 6, 20);
        ctx.fillRect(52 + walk, 70 - stomp, 6, 20);
        
        // Feet
        ctx.fillStyle = '#4A2A10';
        ctx.fillRect(5 - walk, 92, 30, 8);
        ctx.fillRect(43 + walk, 92, 30, 8);
        // Toes
        ctx.fillStyle = '#3A1A08';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(8 - walk + i * 7, 96, 5, 4);
            ctx.fillRect(46 + walk + i * 7, 96, 5, 4);
        }
        
        // === LOINCLOTH ===
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(8, 55, 64, 15);
        ctx.fillStyle = '#6B3503';
        // Cloth folds
        ctx.fillRect(20, 65, 8, 10);
        ctx.fillRect(36, 65, 8, 10);
        ctx.fillRect(52, 65, 8, 8);
        
        // === MASSIVE TORSO ===
        ctx.fillStyle = '#7B5433';
        ctx.fillRect(5, 25, 70, 35);
        
        // Chest muscles
        ctx.fillStyle = '#8B6443';
        ctx.fillRect(12, 30, 25, 15);
        ctx.fillRect(42, 30, 25, 15);
        
        // Belly
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(20, 45, 40, 15);
        
        // Chest hair (dark patches)
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(30, 35, 20, 8);
        
        // === MASSIVE ARMS ===
        ctx.fillStyle = '#7B5433';
        // Left arm
        ctx.fillRect(-10, 28, 20, 14);
        ctx.fillRect(-15, 40, 18, 30);
        // Right arm (club arm) - animated
        ctx.fillRect(70, 28 - attack, 20, 14);
        ctx.fillRect(72 + attack, 40 - attack * 2, 18, 30);
        
        // Fists
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(-18, 68, 22, 16);
        ctx.fillRect(70 + attack, 68 - attack * 2, 22, 16);
        
        // === HEAD ===
        ctx.fillStyle = '#8B6443';
        ctx.fillRect(15, -5, 50, 35);
        
        // Face features
        ctx.fillStyle = '#6B4423';
        // Brow ridge
        ctx.fillRect(18, 2, 44, 8);
        
        // === THE SINGLE EYE ===
        // Eye socket
        ctx.fillStyle = '#1a0a0a';
        ctx.beginPath();
        ctx.arc(40, 14, 14, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyeball
        ctx.fillStyle = '#FFFFCC';
        ctx.beginPath();
        ctx.arc(40, 14, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Iris
        ctx.fillStyle = '#AA0000';
        ctx.beginPath();
        ctx.arc(40, 14, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupil
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(40, 14, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(36, 10, 3, 3);
        
        // Angry eyebrow
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(25, -2, 30, 6);
        
        // Nose
        ctx.fillStyle = '#7B5433';
        ctx.fillRect(35, 22, 10, 8);
        ctx.fillStyle = '#5B3413';
        ctx.fillRect(37, 28, 3, 2);
        ctx.fillRect(40, 28, 3, 2);
        
        // Mouth (angry grimace)
        ctx.fillStyle = '#2a0a0a';
        ctx.fillRect(28, 32, 24, 6);
        // Teeth/tusks
        ctx.fillStyle = '#F0F0D0';
        ctx.fillRect(30, 32, 4, 5);
        ctx.fillRect(36, 32, 3, 4);
        ctx.fillRect(41, 32, 3, 4);
        ctx.fillRect(46, 32, 4, 5);
        
        // === CLUB WEAPON ===
        ctx.fillStyle = '#4a3020';
        // Handle
        ctx.fillRect(88 + attack * 2, 50 - attack * 2, 12, 40);
        // Club head
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(82 + attack * 2, 30 - attack * 2, 24, 25);
        // Spikes on club
        ctx.fillStyle = '#808080';
        ctx.fillRect(80 + attack * 2, 35 - attack * 2, 6, 6);
        ctx.fillRect(100 + attack * 2, 35 - attack * 2, 6, 6);
        ctx.fillRect(90 + attack * 2, 28 - attack * 2, 6, 6);
        ctx.fillRect(90 + attack * 2, 50 - attack * 2, 6, 6);
        
        // === RAGE EFFECT when low health ===
        if (this.health < this.maxHealth * 0.3) {
            ctx.fillStyle = 'rgba(255, 0, 0, ' + (0.2 + Math.sin(Date.now() / 100) * 0.1) + ')';
            ctx.fillRect(0, -10, 80, 110);
        }
    }
    
    drawBossHealthBar(ctx, cameraX) {
        const barWidth = 200;
        const barHeight = 16;
        const x = 300; // Centered
        const y = 450;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.3 ? '#cc4444' : '#ff0000';
        ctx.fillRect(x + 2, y + 2, (barWidth - 4) * healthPercent, barHeight - 4);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('CYCLOPS', x, y - 5);
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

// Enemy manager
class EnemyManager {
    constructor() {
        this.enemies = [];
        this.bossActive = false;
        this.bossTriggered = false;
    }
    
    spawn(enemyData) {
        this.enemies = enemyData.map(e => new Enemy(e.x, e.y, e.type));
        this.bossActive = false;
        this.bossTriggered = false;
    }
    
    update(player, platforms, deltaTime) {
        this.enemies.forEach(enemy => {
            enemy.update(player, platforms, deltaTime);
        });
        
        // Check if player entered boss area
        const boss = this.enemies.find(e => e.isBoss && e.active);
        if (boss && !this.bossTriggered && Math.abs(player.x - boss.x) < 400) {
            this.bossTriggered = true;
            this.bossActive = true;
            
            // Switch to boss music
            if (window.audioManager) {
                window.audioManager.playBossTheme();
                window.audioManager.playBossRoar();
            }
        }
        
        // Check if boss was defeated
        if (this.bossActive && (!boss || !boss.active)) {
            this.bossActive = false;
        }
    }
    
    draw(ctx, cameraX) {
        this.enemies.forEach(enemy => {
            enemy.draw(ctx, cameraX);
        });
    }
    
    checkPlayerCollision(player) {
        let damage = 0;
        
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            const hitbox = enemy.getHitbox();
            
            // Player touching enemy
            if (this.boxCollision(player, hitbox)) {
                if (!player.blocking) {
                    damage = Math.max(damage, enemy.damage);
                }
            }
            
            // Boss attack hitbox
            const attackBox = enemy.getAttackHitbox();
            if (attackBox && this.boxCollision(player, attackBox)) {
                damage = Math.max(damage, enemy.damage);
            }
        });
        
        return damage;
    }
    
    checkPlayerAttack(player) {
        if (!player.attackBox.active) return 0;
        
        let points = 0;
        const attackDamage = 10 + (player.weaponLevel - 1) * 5;
        const knockbackDir = player.facing;
        
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            const hitbox = enemy.getHitbox();
            
            if (this.boxCollision(player.attackBox, hitbox)) {
                const killed = enemy.takeDamage(attackDamage, knockbackDir);
                if (killed) {
                    points += enemy.points;
                }
            }
        });
        
        return points;
    }
    
    boxCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    allDefeated() {
        return this.enemies.filter(e => e.active).length === 0;
    }
    
    bossDefeated() {
        const boss = this.enemies.find(e => e.isBoss);
        return boss && !boss.active;
    }
}
