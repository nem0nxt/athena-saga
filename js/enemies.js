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
        const walk = this.state === 'chase' || this.state === 'patrol' 
            ? Math.sin(this.animFrame * Math.PI / 2) * 3 : 0;
        
        ctx.fillStyle = '#e8e8d0';
        ctx.fillRect(8, 0, 16, 16);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(11, 5, 3, 4);
        ctx.fillRect(18, 5, 3, 4);
        ctx.fillRect(14, 18, 4, 14);
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = '#d8d8c0';
            ctx.fillRect(6, 20 + i * 3, 20, 2);
        }
        ctx.fillRect(8 - walk, 38, 4, 10);
        ctx.fillRect(20 + walk, 38, 4, 10);
    }
    
    drawHarpyFallback(ctx) {
        const wingFlap = Math.sin(this.animFrame * Math.PI / 2) * 15;
        
        ctx.fillStyle = '#6a3a8a';
        ctx.beginPath();
        ctx.moveTo(8, 18);
        ctx.lineTo(-15, 8 - wingFlap);
        ctx.lineTo(-10, 24);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(32, 18);
        ctx.lineTo(55, 8 - wingFlap);
        ctx.lineTo(50, 24);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ddb8a0';
        ctx.fillRect(12, 12, 16, 18);
        ctx.fillRect(14, 0, 12, 12);
        
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(16, 4, 4, 4);
        ctx.fillRect(22, 4, 4, 4);
    }
    
    drawCyclopsFallback(ctx) {
        const walk = this.state === 'walk' ? Math.sin(this.animFrame * Math.PI / 2) * 5 : 0;
        
        ctx.fillStyle = '#885533';
        ctx.fillRect(15 - walk, 70, 18, 26);
        ctx.fillRect(47 + walk, 70, 18, 26);
        
        ctx.fillStyle = '#996644';
        ctx.fillRect(10, 30, 60, 45);
        
        ctx.fillStyle = '#aa7755';
        ctx.fillRect(20, 0, 40, 35);
        
        ctx.fillStyle = '#ffffcc';
        ctx.fillRect(30, 10, 20, 16);
        ctx.fillStyle = '#aa0000';
        ctx.fillRect(36, 14, 8, 8);
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
