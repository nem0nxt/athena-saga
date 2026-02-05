// Athena Saga - Main Game Engine

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
    
    startGame() {
        // Reset game state
        this.state = 'playing';
        this.score = 0;
        this.camera.x = 0;
        this.screenShake = 0;
        
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
        }
        
        ctx.restore();
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
    }
    
    gameOver() {
        this.state = 'gameover';
        this.finalScore.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }
    
    victory() {
        this.state = 'victory';
        this.score += 500; // Victory bonus
        this.victoryScore.textContent = this.score;
        this.victoryScreen.classList.remove('hidden');
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
