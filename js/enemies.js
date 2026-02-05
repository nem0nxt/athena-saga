// Enemies for Athena Saga

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
                    } else {
                        // Stomp attack
                        this.state = 'stomp';
                        this.attackCooldown = 2000;
                        this.stompCooldown = 500;
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
        
        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }
    
    die() {
        this.active = false;
        this.addDeathParticles();
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
        
        if (this.facing === -1) {
            ctx.translate(screenX + this.width, screenY);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(screenX, screenY);
        }
        
        switch (this.type) {
            case 'skeleton':
                this.drawSkeleton(ctx);
                break;
            case 'harpy':
                this.drawHarpy(ctx);
                break;
            case 'cyclops':
                this.drawCyclops(ctx);
                break;
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;
        
        // Boss health bar
        if (this.isBoss && this.health > 0) {
            this.drawBossHealthBar(ctx, cameraX);
        }
    }
    
    drawSkeleton(ctx) {
        const walk = this.state === 'chase' || this.state === 'patrol' 
            ? Math.sin(this.animFrame * Math.PI / 2) * 3 : 0;
        
        // Skull
        ctx.fillStyle = '#e8e8d0';
        ctx.fillRect(8, 0, 16, 16);
        
        // Eye sockets
        ctx.fillStyle = '#2a0a0a';
        ctx.fillRect(10, 4, 5, 6);
        ctx.fillRect(17, 4, 5, 6);
        
        // Evil red glow in eyes
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(11, 5, 3, 4);
        ctx.fillRect(18, 5, 3, 4);
        
        // Jaw
        ctx.fillStyle = '#d8d8c0';
        ctx.fillRect(10, 12, 12, 6);
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(12, 14, 8, 2);
        
        // Spine
        ctx.fillStyle = '#e8e8d0';
        ctx.fillRect(14, 18, 4, 14);
        
        // Ribs
        ctx.fillStyle = '#d8d8c0';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(6, 20 + i * 3, 20, 2);
        }
        
        // Pelvis
        ctx.fillStyle = '#e8e8d0';
        ctx.fillRect(8, 32, 16, 6);
        
        // Arms
        ctx.fillStyle = '#d8d8c0';
        // Left arm
        ctx.fillRect(2, 20, 4, 12);
        // Right arm (holding sword)
        ctx.fillRect(26, 18, 4, 14);
        
        // Rusty sword
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(28, 14, 4, 6); // Hilt
        ctx.fillStyle = '#888888';
        ctx.fillRect(29, 0, 2, 16); // Blade
        
        // Legs
        ctx.fillStyle = '#d8d8c0';
        ctx.fillRect(8 - walk, 38, 4, 10);
        ctx.fillRect(20 + walk, 38, 4, 10);
        
        // Feet
        ctx.fillStyle = '#c8c8b0';
        ctx.fillRect(6 - walk, 46, 8, 4);
        ctx.fillRect(18 + walk, 46, 8, 4);
    }
    
    drawHarpy(ctx) {
        const wingFlap = Math.sin(this.animFrame * Math.PI / 2) * 15;
        
        // Wings (behind body)
        ctx.fillStyle = '#6a3a8a';
        // Left wing
        ctx.beginPath();
        ctx.moveTo(8, 18);
        ctx.lineTo(-15, 8 - wingFlap);
        ctx.lineTo(-10, 24);
        ctx.closePath();
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(32, 18);
        ctx.lineTo(55, 8 - wingFlap);
        ctx.lineTo(50, 24);
        ctx.closePath();
        ctx.fill();
        
        // Wing feathers
        ctx.fillStyle = '#8a4aaa';
        ctx.beginPath();
        ctx.moveTo(8, 16);
        ctx.lineTo(-12, 4 - wingFlap);
        ctx.lineTo(-8, 18);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(32, 16);
        ctx.lineTo(52, 4 - wingFlap);
        ctx.lineTo(48, 18);
        ctx.closePath();
        ctx.fill();
        
        // Body
        ctx.fillStyle = '#ddb8a0';
        ctx.fillRect(12, 12, 16, 18);
        
        // Feathered chest
        ctx.fillStyle = '#8a4aaa';
        ctx.fillRect(10, 16, 20, 6);
        
        // Head
        ctx.fillStyle = '#ddb8a0';
        ctx.fillRect(14, 0, 12, 12);
        
        // Wild hair
        ctx.fillStyle = '#4a2a6a';
        ctx.fillRect(12, 0, 16, 6);
        ctx.fillRect(10, 2, 4, 8);
        ctx.fillRect(26, 2, 4, 8);
        
        // Evil eyes
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(16, 4, 4, 4);
        ctx.fillRect(22, 4, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(17, 5, 2, 2);
        ctx.fillRect(23, 5, 2, 2);
        
        // Beak/mouth
        ctx.fillStyle = '#ff6644';
        ctx.fillRect(18, 8, 4, 3);
        
        // Talons
        ctx.fillStyle = '#4a4a4a';
        const talonSwing = this.state === 'attack' ? 10 : 0;
        ctx.fillRect(14, 30 + talonSwing, 4, 8);
        ctx.fillRect(22, 30 + talonSwing, 4, 8);
        
        // Claws
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(12, 36 + talonSwing, 8, 3);
        ctx.fillRect(20, 36 + talonSwing, 8, 3);
    }
    
    drawCyclops(ctx) {
        const walk = this.state === 'walk' ? Math.sin(this.animFrame * Math.PI / 2) * 5 : 0;
        const isAttacking = this.state === 'attack' || this.state === 'stomp';
        
        // Legs
        ctx.fillStyle = '#885533';
        ctx.fillRect(15 - walk, 70, 18, 26);
        ctx.fillRect(47 + walk, 70, 18, 26);
        
        // Feet
        ctx.fillStyle = '#775522';
        ctx.fillRect(10 - walk, 90, 28, 8);
        ctx.fillRect(42 + walk, 90, 28, 8);
        
        // Body
        ctx.fillStyle = '#996644';
        ctx.fillRect(10, 30, 60, 45);
        
        // Chest details
        ctx.fillStyle = '#aa7755';
        ctx.fillRect(20, 40, 40, 20);
        
        // Belly
        ctx.fillStyle = '#bb8866';
        ctx.fillRect(25, 55, 30, 15);
        
        // Belt/loincloth
        ctx.fillStyle = '#554422';
        ctx.fillRect(15, 68, 50, 8);
        ctx.fillStyle = '#443311';
        ctx.fillRect(25, 68, 30, 12);
        
        // Left arm
        ctx.fillStyle = '#996644';
        ctx.fillRect(0, 35, 14, 35);
        
        // Right arm (holding club)
        if (isAttacking) {
            // Arm raised
            ctx.fillRect(66, 20, 14, 35);
            // Club
            ctx.fillStyle = '#4a3520';
            ctx.fillRect(72, -10, 12, 40);
            ctx.fillStyle = '#3a2510';
            ctx.fillRect(70, -15, 16, 10);
        } else {
            ctx.fillRect(66, 40, 14, 35);
            // Club at rest
            ctx.fillStyle = '#4a3520';
            ctx.fillRect(70, 50, 12, 50);
            ctx.fillStyle = '#3a2510';
            ctx.fillRect(68, 45, 16, 10);
        }
        
        // Head
        ctx.fillStyle = '#aa7755';
        ctx.fillRect(20, 0, 40, 35);
        
        // Single eye
        ctx.fillStyle = '#ffffcc';
        ctx.fillRect(30, 10, 20, 16);
        
        // Pupil
        const eyeX = this.facing === 1 ? 38 : 34;
        ctx.fillStyle = '#aa0000';
        ctx.fillRect(eyeX, 14, 8, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(eyeX + 2, 16, 4, 4);
        
        // Angry eyebrow
        ctx.fillStyle = '#664422';
        ctx.fillRect(28, 6, 24, 6);
        
        // Mouth
        ctx.fillStyle = '#442211';
        ctx.fillRect(30, 26, 20, 6);
        
        // Teeth
        ctx.fillStyle = '#ddddaa';
        ctx.fillRect(32, 26, 4, 4);
        ctx.fillRect(38, 26, 4, 4);
        ctx.fillRect(44, 26, 4, 4);
        
        // Ears
        ctx.fillStyle = '#885533';
        ctx.fillRect(16, 12, 6, 12);
        ctx.fillRect(58, 12, 6, 12);
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
    }
    
    spawn(enemyData) {
        this.enemies = enemyData.map(e => new Enemy(e.x, e.y, e.type));
    }
    
    update(player, platforms, deltaTime) {
        this.enemies.forEach(enemy => {
            enemy.update(player, platforms, deltaTime);
        });
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
