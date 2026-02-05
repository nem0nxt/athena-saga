// Athena Saga - Main Game Engine (Updated with heartbeat health indicator and audio)

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        
        // Game state
        this.state = 'menu'; // menu, playing, paused, gameover, victory
        this.score = 0;
        this.lastTime = 0;
        
        // Camera
        this.camera = { x: 0, y: 0 };
        
        // Input
        this.keys = {
            left: false,
            right: false,
            up: false,
            jump: false,
            attack: false,
            block: false
        };
        
        // Game objects
        this.player = null;
        this.enemyManager = null;
        this.levelRenderer = null;
        this.powerUps = [];
        
        // Heartbeat animation state
        this.heartbeatTimer = 0;
        this.heartbeatFrame = 0;
        this.heartbeatSpeed = 800; // Normal BPM ~75
        
        // UI elements
        this.healthFill = document.getElementById('health-fill');
        this.scoreValue = document.getElementById('score-value');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.victoryScreen = document.getElementById('victory-screen');
        this.finalScore = document.getElementById('final-score');
        this.victoryScore = document.getElementById('victory-score');
        
        // Screen shake
        this.screenShake = 0;
        
        // Initialize
        this.setupInput();
        this.setupButtons();
        this.setupAudioControls();
        
        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = true;
                    break;
                case 'Space':
                    this.keys.jump = true;
                    e.preventDefault();
                    break;
                case 'KeyZ':
                    this.keys.attack = true;
                    break;
                case 'KeyX':
                    this.keys.block = true;
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = false;
                    break;
                case 'Space':
                    this.keys.jump = false;
                    break;
                case 'KeyZ':
                    this.keys.attack = false;
                    break;
                case 'KeyX':
                    this.keys.block = false;
                    break;
            }
        });
    }
    
    setupButtons() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('victory-btn').addEventListener('click', () => {
            this.startGame();
        });
    }
    
    setupAudioControls() {
        const muteBtn = document.getElementById('mute-btn');
        const musicBtn = document.getElementById('music-btn');
        const sfxBtn = document.getElementById('sfx-btn');
        
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                // Initialize audio on first interaction
                if (window.audioManager) {
                    window.audioManager.init();
                    const muted = window.audioManager.toggleMute();
                    muteBtn.textContent = muted ? '🔇' : '🔊';
                    muteBtn.classList.toggle('muted', muted);
                }
            });
        }
        
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                if (window.audioManager) {
                    window.audioManager.init();
                    const muted = window.audioManager.toggleMusic();
                    musicBtn.textContent = muted ? '🎵' : '🎵';
                    musicBtn.classList.toggle('muted', muted);
                    
                    // Restart music if unmuted and playing
                    if (!muted && this.state === 'playing') {
                        if (this.enemyManager && this.enemyManager.bossActive) {
                            window.audioManager.playBossTheme();
                        } else {
                            window.audioManager.playMainTheme();
                        }
                    }
                }
            });
        }
        
        if (sfxBtn) {
            sfxBtn.addEventListener('click', () => {
                if (window.audioManager) {
                    window.audioManager.init();
                    const muted = window.audioManager.toggleSFX();
                    sfxBtn.textContent = muted ? '💥' : '💥';
                    sfxBtn.classList.toggle('muted', muted);
                    
                    // Stop or start heartbeat
                    if (muted) {
                        window.audioManager.stopHeartbeat();
                    } else if (this.state === 'playing' && this.player) {
                        const healthPercent = this.player.health / this.player.maxHealth;
                        window.audioManager.updateHeartbeatRate(healthPercent);
                    }
                }
            });
        }
    }
    
    startGame() {
        // Initialize audio on game start (user interaction)
        if (window.audioManager) {
            window.audioManager.init();
        }
        
        // Reset game state
        this.state = 'playing';
        this.score = 0;
        this.camera.x = 0;
        this.screenShake = 0;
        this.heartbeatTimer = 0;
        this.heartbeatFrame = 0;
        
        // Hide screens
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.victoryScreen.classList.add('hidden');
        
        // Create player
        this.player = new Player(100, 300);
        
        // Create enemies
        this.enemyManager = new EnemyManager();
        this.enemyManager.spawn(LEVEL_DATA.enemies);
        
        // Create level renderer
        this.levelRenderer = new LevelRenderer(this.ctx, this.camera);
        
        // Create power-ups
        this.powerUps = LEVEL_DATA.powerUps.map(pu => ({
            ...pu,
            active: true,
            width: 32,
            height: 32
        }));
        
        // Start music and heartbeat
        if (window.audioManager) {
            window.audioManager.playMainTheme();
            window.audioManager.startHeartbeat(60);
        }
        
        // Update UI
        this.updateUI();
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent huge jumps
        const dt = Math.min(deltaTime, 50);
        
        if (this.state === 'playing') {
            this.update(dt);
        }
        
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update player
        this.player.update(this.keys, LEVEL_DATA.platforms, deltaTime);
        
        // Update camera
        this.updateCamera();
        
        // Update level decorations
        this.levelRenderer.update(deltaTime);
        
        // Update enemies
        this.enemyManager.update(this.player, LEVEL_DATA.platforms, deltaTime);
        
        // Check player attack hitting enemies
        const points = this.enemyManager.checkPlayerAttack(this.player);
        if (points > 0) {
            this.score += points;
            this.screenShake = 100;
        }
        
        // Check enemy hitting player
        const damage = this.enemyManager.checkPlayerCollision(this.player);
        if (damage > 0 && this.player.takeDamage(damage)) {
            this.screenShake = 150;
        }
        
        // Check power-up collection
        this.checkPowerUps();
        
        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake -= deltaTime;
        }
        
        // Update heartbeat animation
        this.updateHeartbeat(deltaTime);
        
        // Update UI
        this.updateUI();
        
        // Check win/lose conditions
        if (this.player.health <= 0) {
            this.gameOver();
        } else if (this.enemyManager.bossDefeated()) {
            this.victory();
        }
    }
    
    updateCamera() {
        // Follow player
        const targetX = this.player.x - 300;
        
        // Smooth camera
        this.camera.x += (targetX - this.camera.x) * 0.1;
        
        // Clamp camera
        this.camera.x = Math.max(0, Math.min(this.camera.x, LEVEL_DATA.width - this.canvas.width));
    }
    
    checkPowerUps() {
        this.powerUps.forEach(pu => {
            if (!pu.active) return;
            
            // Check collision with player
            if (this.player.x + this.player.width > pu.x &&
                this.player.x < pu.x + pu.width &&
                this.player.y + this.player.height > pu.y &&
                this.player.y < pu.y + pu.height) {
                
                pu.active = false;
                
                if (pu.type === 'health') {
                    this.player.heal(30);
                    this.score += 50;
                } else if (pu.type === 'weapon') {
                    this.player.upgradeWeapon();
                    this.score += 100;
                }
            }
        });
    }
    
    updateHeartbeat(deltaTime) {
        // Calculate heartbeat speed based on health (like Rastan Saga)
        // Low health = faster heartbeat
        const healthPercent = this.player.health / this.player.maxHealth;
        
        if (healthPercent <= 0.25) {
            // Critical! Very fast heartbeat - 250 BPM
            this.heartbeatSpeed = 240;
        } else if (healthPercent <= 0.5) {
            // Low health - fast heartbeat
            this.heartbeatSpeed = 400;
        } else if (healthPercent <= 0.75) {
            // Medium health
            this.heartbeatSpeed = 600;
        } else {
            // Good health - normal heartbeat
            this.heartbeatSpeed = 800;
        }
        
        this.heartbeatTimer += deltaTime;
        
        // 8 frames for heartbeat animation
        // Frames 0-2: systole (contract/pump), 3-7: diastole (relax)
        const frameDuration = this.heartbeatSpeed / 8;
        
        if (this.heartbeatTimer >= frameDuration) {
            this.heartbeatTimer = 0;
            this.heartbeatFrame = (this.heartbeatFrame + 1) % 8;
        }
        
        // Update audio heartbeat rate
        if (window.audioManager) {
            window.audioManager.updateHeartbeatRate(healthPercent);
        }
    }
    
    updateUI() {
        // Health bar
        const healthPercent = Math.max(0, this.player.health / this.player.maxHealth * 100);
        this.healthFill.style.width = healthPercent + '%';
        
        // Change color based on health
        if (healthPercent <= 25) {
            this.healthFill.style.background = 'linear-gradient(to bottom, #ff0000, #880000)';
        } else if (healthPercent <= 50) {
            this.healthFill.style.background = 'linear-gradient(to bottom, #ff8800, #884400)';
        } else {
            this.healthFill.style.background = 'linear-gradient(to bottom, #ff4444, #aa0000)';
        }
        
        // Score
        this.scoreValue.textContent = this.score;
    }
    
    draw() {
        const ctx = this.ctx;
        
        // Apply screen shake
        ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake / 20;
            const shakeY = (Math.random() - 0.5) * this.screenShake / 20;
            ctx.translate(shakeX, shakeY);
        }
        
        if (this.state === 'menu') {
            this.drawMenuBackground();
        } else {
            // Draw level
            this.levelRenderer.drawBackground();
            this.levelRenderer.drawDecorations();
            this.levelRenderer.drawPlatforms();
            this.levelRenderer.drawPowerUps(this.powerUps);
            
            // Draw enemies
            this.enemyManager.draw(ctx, this.camera.x);
            
            // Draw player
            this.player.draw(ctx, this.camera.x);
            
            // Draw heartbeat health indicator (on top of game)
            this.drawHeartbeatHealth();
        }
        
        ctx.restore();
    }
    
    drawHeartbeatHealth() {
        const ctx = this.ctx;
        const healthPercent = this.player.health / this.player.maxHealth;
        
        // RASTAN SAGA STYLE: Single anatomical heart that represents ALL health
        // Position for the single anatomical heart
        const heartX = 15;
        const heartY = 42;
        const heartSize = 56; // Larger single heart
        
        // Get heart sprite frames
        const heartSprites = window.spriteManager && window.spriteManager.sprites.heart;
        
        // Calculate heartbeat scale (Rastan Saga style pulsing)
        const scale = this.getHeartbeatScale();
        
        // Color shift based on health (Rastan Saga: heart gets darker/paler as health drops)
        let colorShift = 1;
        let saturation = 1;
        if (healthPercent <= 0.25) {
            // Critical: heart looks pale/dying, flickers
            colorShift = 0.6 + Math.sin(Date.now() / 80) * 0.2;
            saturation = 0.7;
        } else if (healthPercent <= 0.5) {
            // Low: slightly desaturated
            colorShift = 0.8;
            saturation = 0.85;
        }
        
        ctx.save();
        ctx.translate(heartX + heartSize/2, heartY + heartSize/2);
        ctx.scale(scale, scale);
        
        // Apply color filter for health state
        if (healthPercent <= 0.5) {
            ctx.filter = `saturate(${saturation}) brightness(${colorShift})`;
        }
        
        // Draw the single anatomical heart
        if (heartSprites && heartSprites[this.heartbeatFrame]) {
            ctx.drawImage(heartSprites[this.heartbeatFrame], -heartSize/2, -heartSize/2, heartSize, heartSize);
        } else {
            // Fallback anatomical heart
            this.drawAnatomicalHeartFallback(ctx, -heartSize/2, -heartSize/2, heartSize, healthPercent);
        }
        
        ctx.restore();
        
        // Draw health percentage as a subtle overlay/drain effect
        // The heart "drains" from bottom to top as health decreases
        if (healthPercent < 1) {
            ctx.save();
            const drainHeight = heartSize * (1 - healthPercent);
            const drainY = heartY + heartSize - drainHeight;
            
            // Dark overlay on the "empty" portion
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.rect(heartX, heartY, heartSize, heartSize * (1 - healthPercent));
            ctx.fill();
            ctx.restore();
        }
        
        // RASTAN SAGA STYLE: Health BAR next to heart
        const barX = heartX + heartSize + 10;
        const barY = heartY + 8;
        const barWidth = 120;
        const barHeight = 16;
        
        // Bar background (dark)
        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        // Bar border (golden arcade style)
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        // Health bar fill (gradient from red to dark red)
        const healthWidth = barWidth * healthPercent;
        if (healthWidth > 0) {
            const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
            if (healthPercent > 0.5) {
                gradient.addColorStop(0, '#FF4444');
                gradient.addColorStop(0.5, '#CC0000');
                gradient.addColorStop(1, '#880000');
            } else if (healthPercent > 0.25) {
                gradient.addColorStop(0, '#FF6600');
                gradient.addColorStop(0.5, '#CC4400');
                gradient.addColorStop(1, '#882200');
            } else {
                // Critical - pulsing red
                const pulse = 0.7 + Math.sin(Date.now() / 100) * 0.3;
                gradient.addColorStop(0, `rgba(255, 0, 0, ${pulse})`);
                gradient.addColorStop(0.5, `rgba(180, 0, 0, ${pulse})`);
                gradient.addColorStop(1, `rgba(100, 0, 0, ${pulse})`);
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(barX, barY, healthWidth, barHeight);
            
            // Shine effect on bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(barX, barY, healthWidth, barHeight / 3);
        }
        
        // "LIFE" text above bar (arcade style)
        ctx.save();
        ctx.font = 'bold 10px "Press Start 2P", monospace';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText('LIFE', barX, barY - 6);
        ctx.fillText('LIFE', barX, barY - 6);
        ctx.restore();
        
        // Add pulsing glow effect when health is critical
        if (healthPercent <= 0.25) {
            const glowIntensity = 0.15 + Math.sin(Date.now() / 100) * 0.1;
            ctx.save();
            ctx.globalAlpha = glowIntensity;
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(heartX + heartSize/2, heartY + heartSize/2, heartSize * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Fallback anatomical heart drawing (if sprites fail to load)
    drawAnatomicalHeartFallback(ctx, x, y, size, healthPercent) {
        const px = size / 24; // Pixel size for 24x28 grid
        
        // Rastan Saga style anatomical heart colors
        const mainColor = healthPercent > 0.5 ? '#A52A2A' : (healthPercent > 0.25 ? '#8B2020' : '#6B1515');
        const darkColor = '#4A0A0A';
        const lightColor = healthPercent > 0.5 ? '#C44040' : '#9A3030';
        const aortaColor = '#7A2525';
        
        // Simplified anatomical heart shape
        // Main body
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y + size * 0.9);
        ctx.quadraticCurveTo(x + size * 0.1, y + size * 0.5, x + size * 0.2, y + size * 0.3);
        ctx.quadraticCurveTo(x + size * 0.3, y + size * 0.15, x + size * 0.5, y + size * 0.25);
        ctx.quadraticCurveTo(x + size * 0.7, y + size * 0.15, x + size * 0.8, y + size * 0.3);
        ctx.quadraticCurveTo(x + size * 0.9, y + size * 0.5, x + size * 0.5, y + size * 0.9);
        ctx.fill();
        
        // Aorta (top pipes)
        ctx.fillStyle = aortaColor;
        ctx.fillRect(x + size * 0.35, y + size * 0.05, size * 0.15, size * 0.25);
        ctx.fillRect(x + size * 0.5, y + size * 0.08, size * 0.12, size * 0.2);
        ctx.fillRect(x + size * 0.15, y + size * 0.1, size * 0.1, size * 0.18);
        
        // Left side shadow
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y + size * 0.9);
        ctx.quadraticCurveTo(x + size * 0.15, y + size * 0.55, x + size * 0.22, y + size * 0.35);
        ctx.lineTo(x + size * 0.35, y + size * 0.4);
        ctx.quadraticCurveTo(x + size * 0.25, y + size * 0.55, x + size * 0.5, y + size * 0.85);
        ctx.fill();
        
        // Highlights
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.ellipse(x + size * 0.35, y + size * 0.35, size * 0.08, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + size * 0.65, y + size * 0.35, size * 0.08, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Veins
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.4, y + size * 0.3);
        ctx.lineTo(x + size * 0.45, y + size * 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + size * 0.55, y + size * 0.35);
        ctx.lineTo(x + size * 0.52, y + size * 0.55);
        ctx.stroke();
    }
    
    getHeartbeatScale() {
        // Heartbeat animation curve (like Rastan Saga)
        // Quick pump (systole) then slow relax (diastole)
        const frame = this.heartbeatFrame;
        
        // Systole: frames 0-2 (quick expansion)
        if (frame < 3) {
            return 1 + (frame + 1) * 0.06; // 1.06, 1.12, 1.18
        }
        // Diastole: frames 3-7 (slow contraction)
        else {
            const relaxPhase = frame - 2; // 1-5
            return 1.18 - relaxPhase * 0.036; // gradual return to 1.0
        }
    }
    
    drawMenuBackground() {
        const ctx = this.ctx;
        
        // Animated background
        const time = Date.now() / 1000;
        
        // Gradient sky
        const gradient = ctx.createLinearGradient(0, 0, 0, 480);
        gradient.addColorStop(0, '#0a0520');
        gradient.addColorStop(0.5, '#1a0a2e');
        gradient.addColorStop(1, '#2d1b4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 480);
        
        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 73 + time * 10) % 800;
            const y = (i * 37) % 300;
            const size = (i % 3) + 1;
            ctx.globalAlpha = 0.3 + Math.sin(time + i) * 0.3;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1;
        
        // Temple silhouette
        ctx.fillStyle = '#1a1030';
        
        // Pillars
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(100 + i * 120, 300, 40, 180);
        }
        
        // Roof
        ctx.beginPath();
        ctx.moveTo(60, 300);
        ctx.lineTo(400, 200);
        ctx.lineTo(740, 300);
        ctx.closePath();
        ctx.fill();
        
        // Ground
        ctx.fillStyle = '#0a0510';
        ctx.fillRect(0, 420, 800, 60);
        
        // Draw animated hearts on menu
        this.drawMenuHearts(time);
    }
    
    drawMenuHearts(time) {
        const ctx = this.ctx;
        const heartSprites = window.spriteManager && window.spriteManager.sprites.heart;
        
        // Floating anatomical heart on menu (single, larger, prominent)
        const x = 400;
        const y = 380 + Math.sin(time * 1.5) * 8;
        const scale = 1.2 + Math.sin(time * 3) * 0.08;
        const frame = Math.floor((time * 4) % 8);
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = 0.7;
        
        if (heartSprites && heartSprites[frame]) {
            ctx.drawImage(heartSprites[frame], -32, -32, 64, 64);
        } else {
            this.drawAnatomicalHeartFallback(ctx, -32, -32, 64, 1);
        }
        
        ctx.restore();
    }
    
    gameOver() {
        this.state = 'gameover';
        this.finalScore.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
        
        // Stop music and heartbeat, play game over sound
        if (window.audioManager) {
            window.audioManager.stopHeartbeat();
            window.audioManager.playGameOverSound();
        }
    }
    
    victory() {
        this.state = 'victory';
        this.score += 500; // Victory bonus
        this.victoryScore.textContent = this.score;
        this.victoryScreen.classList.remove('hidden');
        
        // Stop music and heartbeat, play victory jingle
        if (window.audioManager) {
            window.audioManager.stopHeartbeat();
            window.audioManager.playVictoryJingle();
        }
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
