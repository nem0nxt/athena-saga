// Athena Saga - Pixel Art Sprite System
// Authentic 16-bit era graphics with programmatic pixel art

class SpriteManager {
    constructor() {
        this.sprites = {};
        this.init();
    }
    
    init() {
        // Create off-screen canvases for all sprites
        this.createAthenaSprites();
        this.createSkeletonSprites();
        this.createHarpySprites();
        this.createCyclopsSprites();
        this.createEnvironmentSprites();
        this.createHeartSprites();
    }
    
    // ==========================================
    // ATHENA SPRITES - Detailed 16-bit goddess warrior
    // ==========================================
    createAthenaSprites() {
        const frames = {
            idle: [],
            run: [],
            jump: [],
            attack: [],
            block: []
        };
        
        // Idle animation (4 frames with breathing)
        for (let i = 0; i < 4; i++) {
            frames.idle.push(this.createAthenaFrame('idle', i));
        }
        
        // Run animation (6 frames)
        for (let i = 0; i < 6; i++) {
            frames.run.push(this.createAthenaFrame('run', i));
        }
        
        // Jump (2 frames: rising, falling)
        frames.jump.push(this.createAthenaFrame('jump', 0));
        frames.jump.push(this.createAthenaFrame('jump', 1));
        
        // Attack (4 frames)
        for (let i = 0; i < 4; i++) {
            frames.attack.push(this.createAthenaFrame('attack', i));
        }
        
        // Block (1 frame)
        frames.block.push(this.createAthenaFrame('block', 0));
        
        this.sprites.athena = frames;
    }
    
    createAthenaFrame(state, frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 72;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Color palette - authentic 16-bit
        const colors = {
            skin: '#F4C7A5',
            skinDark: '#D4A785',
            skinLight: '#FFE4CC',
            hair: '#2A1A0A',
            hairHighlight: '#4A3A2A',
            armorGold: '#DAA520',
            armorBronze: '#CD7F32',
            armorDark: '#8B5A2B',
            armorLight: '#FFD700',
            chiton: '#F5F5DC',
            chitonShade: '#E8E4C9',
            chitonDark: '#D4D0B5',
            plume: '#CC2222',
            plumeLight: '#FF4444',
            plumeDark: '#880000',
            sandal: '#8B4513',
            sandalDark: '#5D3512',
            eye: '#4A90D9',
            eyeDark: '#2A70B9',
            shieldCenter: '#FFD700',
            spear: '#C0C0C0',
            spearGold: '#FFD700'
        };
        
        // Calculate animation offsets
        let breatheOffset = 0;
        let legOffset = 0;
        let armOffset = 0;
        let bodyTilt = 0;
        
        switch(state) {
            case 'idle':
                breatheOffset = Math.sin(frame * Math.PI / 2) * 1;
                break;
            case 'run':
                legOffset = Math.sin(frame * Math.PI / 3) * 8;
                bodyTilt = Math.sin(frame * Math.PI / 3) * 2;
                armOffset = Math.cos(frame * Math.PI / 3) * 6;
                break;
            case 'jump':
                bodyTilt = frame === 0 ? -2 : 2;
                legOffset = frame === 0 ? -4 : 4;
                break;
            case 'attack':
                armOffset = frame * 12;
                break;
        }
        
        // ===== DRAW ATHENA =====
        ctx.save();
        ctx.translate(32, 36);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-16, 30, 32, 4);
        
        // ===== LEGS =====
        this.drawAthenaLegs(ctx, colors, state, legOffset, frame);
        
        // ===== BODY (Chiton + Armor) =====
        this.drawAthenaBody(ctx, colors, state, breatheOffset, bodyTilt);
        
        // ===== ARMS & WEAPONS =====
        if (state === 'block') {
            this.drawAthenaBlockPose(ctx, colors);
        } else if (state === 'attack') {
            this.drawAthenaAttackPose(ctx, colors, frame);
        } else {
            this.drawAthenaIdlePose(ctx, colors, state, armOffset);
        }
        
        // ===== HEAD (Helmet with plume) =====
        this.drawAthenaHead(ctx, colors, state, breatheOffset, frame);
        
        ctx.restore();
        
        return canvas;
    }
    
    drawAthenaLegs(ctx, colors, state, legOffset, frame) {
        // Left leg
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-10 - legOffset/2, 14, 8, 14);
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-10 - legOffset/2, 14, 2, 14);
        
        // Left sandal
        ctx.fillStyle = colors.sandal;
        ctx.fillRect(-12 - legOffset/2, 26, 12, 6);
        ctx.fillStyle = colors.sandalDark;
        ctx.fillRect(-12 - legOffset/2, 30, 12, 2);
        // Sandal straps
        ctx.fillStyle = colors.sandal;
        ctx.fillRect(-10 - legOffset/2, 18, 2, 8);
        
        // Right leg
        ctx.fillStyle = colors.skin;
        ctx.fillRect(2 + legOffset/2, 14, 8, 14);
        ctx.fillStyle = colors.skinLight;
        ctx.fillRect(8 + legOffset/2, 14, 2, 14);
        
        // Right sandal
        ctx.fillStyle = colors.sandal;
        ctx.fillRect(0 + legOffset/2, 26, 12, 6);
        ctx.fillStyle = colors.sandalDark;
        ctx.fillRect(0 + legOffset/2, 30, 12, 2);
        // Sandal straps
        ctx.fillStyle = colors.sandal;
        ctx.fillRect(8 + legOffset/2, 18, 2, 8);
        
        // Chiton skirt (over legs)
        ctx.fillStyle = colors.chiton;
        ctx.fillRect(-14, 8, 28, 12);
        ctx.fillStyle = colors.chitonShade;
        ctx.fillRect(-14, 8, 4, 12);
        ctx.fillRect(10, 8, 4, 12);
        // Skirt folds
        ctx.fillStyle = colors.chitonDark;
        ctx.fillRect(-6, 10, 2, 10);
        ctx.fillRect(4, 10, 2, 10);
    }
    
    drawAthenaBody(ctx, colors, state, breatheOffset, bodyTilt) {
        // Chiton body
        ctx.fillStyle = colors.chiton;
        ctx.fillRect(-12, -8 - breatheOffset, 24, 18);
        
        // Chiton folds
        ctx.fillStyle = colors.chitonShade;
        ctx.fillRect(-10, -6 - breatheOffset, 3, 14);
        ctx.fillRect(7, -6 - breatheOffset, 3, 14);
        
        // Golden belt
        ctx.fillStyle = colors.armorDark;
        ctx.fillRect(-14, 6 - breatheOffset, 28, 6);
        ctx.fillStyle = colors.armorGold;
        ctx.fillRect(-12, 7 - breatheOffset, 24, 4);
        ctx.fillStyle = colors.armorLight;
        ctx.fillRect(-4, 7 - breatheOffset, 8, 4); // Belt buckle
        
        // Breastplate (bronze cuirass)
        ctx.fillStyle = colors.armorBronze;
        ctx.fillRect(-10, -12 - breatheOffset, 20, 12);
        ctx.fillStyle = colors.armorGold;
        ctx.fillRect(-8, -10 - breatheOffset, 16, 8);
        ctx.fillStyle = colors.armorLight;
        ctx.fillRect(-6, -10 - breatheOffset, 4, 6); // Highlight
        
        // Shoulder pauldrons
        ctx.fillStyle = colors.armorBronze;
        ctx.fillRect(-18, -14 - breatheOffset, 12, 8);
        ctx.fillRect(6, -14 - breatheOffset, 12, 8);
        ctx.fillStyle = colors.armorGold;
        ctx.fillRect(-16, -12 - breatheOffset, 8, 4);
        ctx.fillRect(8, -12 - breatheOffset, 8, 4);
        ctx.fillStyle = colors.armorLight;
        ctx.fillRect(-14, -12 - breatheOffset, 2, 2);
        ctx.fillRect(14, -12 - breatheOffset, 2, 2);
    }
    
    drawAthenaHead(ctx, colors, state, breatheOffset, frame) {
        // Neck
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-4, -18 - breatheOffset, 8, 6);
        
        // Face
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-8, -32 - breatheOffset, 16, 16);
        ctx.fillStyle = colors.skinLight;
        ctx.fillRect(-6, -30 - breatheOffset, 4, 8);
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(2, -28 - breatheOffset, 6, 10);
        
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-6, -28 - breatheOffset, 5, 4);
        ctx.fillRect(1, -28 - breatheOffset, 5, 4);
        ctx.fillStyle = colors.eye;
        ctx.fillRect(-5, -27 - breatheOffset, 3, 3);
        ctx.fillRect(2, -27 - breatheOffset, 3, 3);
        ctx.fillStyle = colors.eyeDark;
        ctx.fillRect(-4, -26 - breatheOffset, 2, 2);
        ctx.fillRect(3, -26 - breatheOffset, 2, 2);
        
        // Nose and mouth
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-1, -24 - breatheOffset, 2, 4);
        ctx.fillStyle = '#CC6666';
        ctx.fillRect(-2, -20 - breatheOffset, 4, 2);
        
        // Hair visible at sides
        ctx.fillStyle = colors.hair;
        ctx.fillRect(-10, -30 - breatheOffset, 4, 12);
        ctx.fillRect(6, -30 - breatheOffset, 4, 12);
        
        // Corinthian Helmet
        ctx.fillStyle = colors.armorBronze;
        ctx.fillRect(-10, -40 - breatheOffset, 20, 12);
        ctx.fillRect(-12, -36 - breatheOffset, 24, 8);
        ctx.fillStyle = colors.armorGold;
        ctx.fillRect(-8, -38 - breatheOffset, 16, 8);
        ctx.fillStyle = colors.armorLight;
        ctx.fillRect(-6, -38 - breatheOffset, 4, 4);
        
        // Helmet cheek guards
        ctx.fillStyle = colors.armorBronze;
        ctx.fillRect(-12, -30 - breatheOffset, 4, 10);
        ctx.fillRect(8, -30 - breatheOffset, 4, 10);
        
        // Nose guard
        ctx.fillStyle = colors.armorGold;
        ctx.fillRect(-2, -32 - breatheOffset, 4, 8);
        
        // Red Plume (flowing)
        const plumeWave = Math.sin(frame * Math.PI / 2) * 2;
        ctx.fillStyle = colors.plumeDark;
        for (let i = 0; i < 10; i++) {
            const py = -44 - breatheOffset - i * 0.3 + plumeWave * (i / 10);
            ctx.fillRect(-3 + i, py, 6, 8 + i);
        }
        ctx.fillStyle = colors.plume;
        for (let i = 0; i < 8; i++) {
            const py = -43 - breatheOffset - i * 0.3 + plumeWave * (i / 10);
            ctx.fillRect(-2 + i, py, 5, 6 + i);
        }
        ctx.fillStyle = colors.plumeLight;
        for (let i = 0; i < 6; i++) {
            const py = -42 - breatheOffset - i * 0.2 + plumeWave * (i / 10);
            ctx.fillRect(-1 + i, py, 3, 4 + i);
        }
    }
    
    drawAthenaIdlePose(ctx, colors, state, armOffset) {
        // Left arm (holding shield)
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-20, -10, 6, 16);
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-20, -10, 2, 16);
        
        // Shield (Aegis with owl emblem)
        this.drawShield(ctx, colors, -26, -6);
        
        // Right arm (holding spear)
        ctx.fillStyle = colors.skin;
        ctx.fillRect(14, -10, 6, 16);
        ctx.fillStyle = colors.skinLight;
        ctx.fillRect(18, -10, 2, 16);
        
        // Spear (at rest, diagonal)
        this.drawSpear(ctx, colors, 20, -30, 0);
    }
    
    drawAthenaAttackPose(ctx, colors, frame) {
        // Left arm (shield forward)
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-18, -12, 6, 12);
        
        // Shield
        this.drawShield(ctx, colors, -22, -10);
        
        // Right arm extended (thrust animation)
        const thrustX = frame * 8;
        ctx.fillStyle = colors.skin;
        ctx.fillRect(14, -8, 10 + thrustX/2, 6);
        ctx.fillStyle = colors.skinLight;
        ctx.fillRect(20 + thrustX/2, -8, 4, 6);
        
        // Spear thrust
        this.drawSpear(ctx, colors, 24 + thrustX, -6, 1);
    }
    
    drawAthenaBlockPose(ctx, colors) {
        // Right arm behind
        ctx.fillStyle = colors.skin;
        ctx.fillRect(14, -8, 6, 14);
        
        // Spear vertical
        this.drawSpear(ctx, colors, 20, -40, 2);
        
        // Left arm forward
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-8, -10, 12, 6);
        
        // Shield raised (larger, in front)
        this.drawShieldRaised(ctx, colors, 4, -20);
    }
    
    drawShield(ctx, colors, x, y) {
        // Shield base (bronze circle)
        ctx.fillStyle = colors.armorBronze;
        ctx.beginPath();
        ctx.arc(x, y + 10, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner circle
        ctx.fillStyle = colors.armorGold;
        ctx.beginPath();
        ctx.arc(x, y + 10, 9, 0, Math.PI * 2);
        ctx.fill();
        
        // Center (owl emblem - simplified)
        ctx.fillStyle = colors.armorBronze;
        ctx.beginPath();
        ctx.arc(x, y + 10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Owl eyes
        ctx.fillStyle = colors.armorLight;
        ctx.fillRect(x - 4, y + 8, 3, 3);
        ctx.fillRect(x + 1, y + 8, 3, 3);
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 3, y + 9, 2, 2);
        ctx.fillRect(x + 2, y + 9, 2, 2);
        
        // Owl beak
        ctx.fillStyle = colors.armorGold;
        ctx.fillRect(x - 1, y + 12, 2, 2);
    }
    
    drawShieldRaised(ctx, colors, x, y) {
        // Large shield in front
        ctx.fillStyle = colors.armorBronze;
        ctx.beginPath();
        ctx.arc(x, y + 16, 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.armorGold;
        ctx.beginPath();
        ctx.arc(x, y + 16, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.armorBronze;
        ctx.beginPath();
        ctx.arc(x, y + 16, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Detailed owl
        ctx.fillStyle = colors.armorGold;
        ctx.fillRect(x - 6, y + 12, 12, 8);
        
        ctx.fillStyle = colors.armorLight;
        ctx.fillRect(x - 5, y + 13, 4, 4);
        ctx.fillRect(x + 1, y + 13, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 4, y + 14, 2, 2);
        ctx.fillRect(x + 2, y + 14, 2, 2);
        
        ctx.fillStyle = colors.armorBronze;
        ctx.fillRect(x - 1, y + 18, 2, 3);
    }
    
    drawSpear(ctx, colors, x, y, pose) {
        if (pose === 0) {
            // Idle - diagonal
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-0.4);
            
            // Shaft
            ctx.fillStyle = '#654321';
            ctx.fillRect(-2, 0, 4, 60);
            ctx.fillStyle = '#8B5A2B';
            ctx.fillRect(0, 0, 2, 60);
            
            // Spear tip
            ctx.fillStyle = colors.spear;
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(-4, 4);
            ctx.lineTo(4, 4);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = colors.spearGold;
            ctx.fillRect(-1, -8, 2, 8);
            
            ctx.restore();
        } else if (pose === 1) {
            // Attack - horizontal thrust
            ctx.fillStyle = '#654321';
            ctx.fillRect(x - 20, y, 50, 4);
            ctx.fillStyle = '#8B5A2B';
            ctx.fillRect(x - 20, y, 50, 2);
            
            // Tip
            ctx.fillStyle = colors.spear;
            ctx.beginPath();
            ctx.moveTo(x + 42, y + 2);
            ctx.lineTo(x + 28, y - 4);
            ctx.lineTo(x + 28, y + 8);
            ctx.closePath();
            ctx.fill();
            
            // Glow effect
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.moveTo(x + 46, y + 2);
            ctx.lineTo(x + 30, y - 6);
            ctx.lineTo(x + 30, y + 10);
            ctx.closePath();
            ctx.fill();
        } else {
            // Block - vertical
            ctx.fillStyle = '#654321';
            ctx.fillRect(x - 2, y, 4, 60);
            ctx.fillStyle = '#8B5A2B';
            ctx.fillRect(x, y, 2, 60);
            
            ctx.fillStyle = colors.spear;
            ctx.beginPath();
            ctx.moveTo(x, y - 12);
            ctx.lineTo(x - 4, y);
            ctx.lineTo(x + 4, y);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // ==========================================
    // SKELETON SPRITES
    // ==========================================
    createSkeletonSprites() {
        const frames = {
            walk: [],
            idle: []
        };
        
        for (let i = 0; i < 4; i++) {
            frames.walk.push(this.createSkeletonFrame('walk', i));
            frames.idle.push(this.createSkeletonFrame('idle', i));
        }
        
        this.sprites.skeleton = frames;
    }
    
    createSkeletonFrame(state, frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        const colors = {
            bone: '#E8E8D0',
            boneDark: '#C8C8B0',
            boneLight: '#FFFFF0',
            socket: '#2A0A0A',
            glow: '#FF4444',
            sword: '#888888',
            swordDark: '#666666',
            hilt: '#8B4513'
        };
        
        const walkOffset = state === 'walk' ? Math.sin(frame * Math.PI / 2) * 4 : 0;
        
        ctx.save();
        ctx.translate(24, 32);
        
        // ===== FEET =====
        ctx.fillStyle = colors.bone;
        ctx.fillRect(-12 - walkOffset, 26, 10, 6);
        ctx.fillRect(2 + walkOffset, 26, 10, 6);
        
        // ===== LEGS (femur + tibia) =====
        // Left leg
        ctx.fillStyle = colors.bone;
        ctx.fillRect(-10 - walkOffset/2, 14, 4, 14);
        ctx.fillStyle = colors.boneLight;
        ctx.fillRect(-8 - walkOffset/2, 14, 2, 14);
        
        // Right leg
        ctx.fillStyle = colors.bone;
        ctx.fillRect(6 + walkOffset/2, 14, 4, 14);
        ctx.fillStyle = colors.boneDark;
        ctx.fillRect(6 + walkOffset/2, 14, 2, 14);
        
        // ===== PELVIS =====
        ctx.fillStyle = colors.bone;
        ctx.fillRect(-10, 8, 20, 8);
        ctx.fillStyle = colors.boneDark;
        ctx.fillRect(-4, 10, 8, 6);
        
        // ===== SPINE =====
        ctx.fillStyle = colors.bone;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-3, -4 + i * 4, 6, 3);
        }
        
        // ===== RIBCAGE =====
        ctx.fillStyle = colors.bone;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-12, -6 + i * 4, 24, 3);
        }
        ctx.fillStyle = colors.boneLight;
        ctx.fillRect(-10, -4, 2, 12);
        
        // ===== ARMS =====
        // Left arm
        ctx.fillStyle = colors.bone;
        ctx.fillRect(-18, -8, 4, 14);
        ctx.fillStyle = colors.boneLight;
        ctx.fillRect(-16, -8, 2, 14);
        
        // Right arm (raised with sword)
        ctx.save();
        ctx.translate(14, -6);
        ctx.rotate(Math.sin(frame * Math.PI / 2) * 0.2 - 0.5);
        
        ctx.fillStyle = colors.bone;
        ctx.fillRect(-2, -2, 4, 16);
        
        // Sword
        ctx.fillStyle = colors.hilt;
        ctx.fillRect(-2, 12, 4, 6);
        ctx.fillStyle = colors.sword;
        ctx.fillRect(-1, 16, 2, 20);
        ctx.fillStyle = colors.swordDark;
        ctx.fillRect(-1, 16, 1, 20);
        
        ctx.restore();
        
        // ===== SKULL =====
        ctx.fillStyle = colors.bone;
        ctx.fillRect(-10, -26, 20, 18);
        ctx.fillStyle = colors.boneLight;
        ctx.fillRect(-8, -24, 6, 10);
        
        // Eye sockets
        ctx.fillStyle = colors.socket;
        ctx.fillRect(-7, -22, 6, 8);
        ctx.fillRect(1, -22, 6, 8);
        
        // Evil red glow
        ctx.fillStyle = colors.glow;
        ctx.fillRect(-5, -20, 4, 5);
        ctx.fillRect(3, -20, 4, 5);
        
        // Glowing core
        ctx.fillStyle = '#FF8888';
        ctx.fillRect(-4, -19, 2, 3);
        ctx.fillRect(4, -19, 2, 3);
        
        // Nose hole
        ctx.fillStyle = colors.socket;
        ctx.fillRect(-2, -16, 4, 4);
        
        // Jaw
        ctx.fillStyle = colors.boneDark;
        ctx.fillRect(-8, -10, 16, 6);
        ctx.fillStyle = colors.socket;
        ctx.fillRect(-6, -10, 12, 2);
        
        // Teeth
        ctx.fillStyle = colors.boneLight;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-5 + i * 3, -10, 2, 3);
        }
        
        ctx.restore();
        
        return canvas;
    }
    
    // ==========================================
    // HARPY SPRITES
    // ==========================================
    createHarpySprites() {
        const frames = {
            fly: [],
            attack: []
        };
        
        for (let i = 0; i < 4; i++) {
            frames.fly.push(this.createHarpyFrame('fly', i));
            frames.attack.push(this.createHarpyFrame('attack', i));
        }
        
        this.sprites.harpy = frames;
    }
    
    createHarpyFrame(state, frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 56;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        const colors = {
            skin: '#DDB8A0',
            skinDark: '#BDA090',
            featherDark: '#4A2A6A',
            featherMid: '#6A3A8A',
            featherLight: '#8A5AAA',
            featherHighlight: '#AA7ACC',
            hair: '#4A2A6A',
            hairLight: '#6A4A8A',
            eye: '#FFFF00',
            eyeDark: '#000000',
            beak: '#FF6644',
            talon: '#4A4A4A',
            talonDark: '#2A2A2A'
        };
        
        const wingFlap = Math.sin(frame * Math.PI / 2) * 18;
        const bodyBob = Math.sin(frame * Math.PI / 2) * 2;
        
        ctx.save();
        ctx.translate(32, 28 + bodyBob);
        
        // ===== WINGS (behind body) =====
        // Left wing
        ctx.fillStyle = colors.featherDark;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-28, -10 - wingFlap);
        ctx.lineTo(-24, 8);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = colors.featherMid;
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.lineTo(-25, -8 - wingFlap);
        ctx.lineTo(-22, 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = colors.featherLight;
        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(-22, -5 - wingFlap);
        ctx.lineTo(-20, 2);
        ctx.closePath();
        ctx.fill();
        
        // Right wing
        ctx.fillStyle = colors.featherDark;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(28, -10 - wingFlap);
        ctx.lineTo(24, 8);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = colors.featherMid;
        ctx.beginPath();
        ctx.moveTo(10, -2);
        ctx.lineTo(25, -8 - wingFlap);
        ctx.lineTo(22, 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = colors.featherLight;
        ctx.beginPath();
        ctx.moveTo(12, -4);
        ctx.lineTo(22, -5 - wingFlap);
        ctx.lineTo(20, 2);
        ctx.closePath();
        ctx.fill();
        
        // ===== BODY =====
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-8, -4, 16, 14);
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-8, -4, 4, 14);
        
        // Feathered chest
        ctx.fillStyle = colors.featherMid;
        ctx.fillRect(-10, 2, 20, 6);
        ctx.fillStyle = colors.featherLight;
        ctx.fillRect(-8, 3, 16, 4);
        
        // ===== HEAD =====
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-7, -18, 14, 14);
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-7, -18, 4, 14);
        
        // Wild hair
        ctx.fillStyle = colors.hair;
        ctx.fillRect(-9, -22, 18, 8);
        ctx.fillRect(-11, -18, 4, 10);
        ctx.fillRect(7, -18, 4, 10);
        ctx.fillStyle = colors.hairLight;
        ctx.fillRect(-7, -20, 4, 4);
        ctx.fillRect(3, -20, 4, 4);
        
        // Hair strands
        ctx.fillStyle = colors.hair;
        ctx.fillRect(-13, -14, 3, 8);
        ctx.fillRect(10, -14, 3, 8);
        
        // Eyes (menacing)
        ctx.fillStyle = colors.eye;
        ctx.fillRect(-5, -14, 5, 5);
        ctx.fillRect(0, -14, 5, 5);
        ctx.fillStyle = colors.eyeDark;
        ctx.fillRect(-4, -13, 3, 3);
        ctx.fillRect(1, -13, 3, 3);
        
        // Angry eyebrows
        ctx.fillStyle = colors.hair;
        ctx.fillRect(-6, -16, 6, 2);
        ctx.fillRect(0, -16, 6, 2);
        
        // Beak
        ctx.fillStyle = colors.beak;
        ctx.fillRect(-2, -10, 4, 4);
        ctx.fillStyle = '#CC4422';
        ctx.fillRect(-1, -9, 2, 2);
        
        // ===== TALONS =====
        const talonOffset = state === 'attack' ? 8 : 0;
        
        ctx.fillStyle = colors.talon;
        ctx.fillRect(-6, 10 + talonOffset, 4, 12);
        ctx.fillRect(2, 10 + talonOffset, 4, 12);
        
        // Claws
        ctx.fillStyle = colors.talonDark;
        ctx.fillRect(-8, 20 + talonOffset, 8, 4);
        ctx.fillRect(0, 20 + talonOffset, 8, 4);
        
        ctx.restore();
        
        return canvas;
    }
    
    // ==========================================
    // CYCLOPS SPRITES
    // ==========================================
    createCyclopsSprites() {
        const frames = {
            idle: [],
            walk: [],
            attack: [],
            stomp: []
        };
        
        for (let i = 0; i < 4; i++) {
            frames.idle.push(this.createCyclopsFrame('idle', i));
            frames.walk.push(this.createCyclopsFrame('walk', i));
        }
        for (let i = 0; i < 4; i++) {
            frames.attack.push(this.createCyclopsFrame('attack', i));
            frames.stomp.push(this.createCyclopsFrame('stomp', i));
        }
        
        this.sprites.cyclops = frames;
    }
    
    createCyclopsFrame(state, frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 112;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        const colors = {
            skin: '#996644',
            skinDark: '#775522',
            skinLight: '#AA7755',
            skinHighlight: '#CC9977',
            belt: '#554422',
            beltDark: '#443311',
            club: '#4A3520',
            clubDark: '#3A2510',
            eye: '#FFFFCC',
            pupil: '#AA0000',
            pupilDark: '#660000',
            teeth: '#DDDDAA',
            mouth: '#442211',
            hair: '#664422'
        };
        
        const walkOffset = state === 'walk' ? Math.sin(frame * Math.PI / 2) * 6 : 0;
        const breathe = Math.sin(frame * Math.PI / 2) * 1;
        
        ctx.save();
        ctx.translate(48, 56);
        
        // ===== LEGS =====
        // Left leg
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-26 - walkOffset, 28, 20, 30);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-24 - walkOffset, 28, 16, 30);
        ctx.fillStyle = colors.skinLight;
        ctx.fillRect(-22 - walkOffset, 30, 4, 26);
        
        // Left foot
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-30 - walkOffset, 54, 28, 10);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-28 - walkOffset, 54, 24, 8);
        
        // Right leg
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(6 + walkOffset, 28, 20, 30);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(8 + walkOffset, 28, 16, 30);
        ctx.fillStyle = colors.skinLight;
        ctx.fillRect(10 + walkOffset, 30, 4, 26);
        
        // Right foot
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(2 + walkOffset, 54, 28, 10);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(4 + walkOffset, 54, 24, 8);
        
        // ===== LOINCLOTH =====
        ctx.fillStyle = colors.belt;
        ctx.fillRect(-28, 18 - breathe, 56, 16);
        ctx.fillStyle = colors.beltDark;
        ctx.fillRect(-20, 22 - breathe, 40, 14);
        
        // ===== BODY =====
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-32, -20 - breathe, 64, 44);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-28, -18 - breathe, 56, 40);
        ctx.fillStyle = colors.skinLight;
        ctx.fillRect(-24, -14 - breathe, 20, 32);
        ctx.fillStyle = colors.skinHighlight;
        ctx.fillRect(-20, -10 - breathe, 8, 24);
        
        // Belly
        ctx.fillStyle = colors.skinLight;
        ctx.fillRect(-16, 0 - breathe, 32, 18);
        
        // ===== ARMS =====
        // Left arm
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-44, -14 - breathe, 16, 40);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-42, -12 - breathe, 12, 36);
        ctx.fillStyle = colors.skinLight;
        ctx.fillRect(-40, -10 - breathe, 4, 32);
        
        // Right arm with club
        if (state === 'attack') {
            ctx.save();
            ctx.translate(36, -10 - breathe);
            ctx.rotate(-0.8 - frame * 0.3);
            
            ctx.fillStyle = colors.skinDark;
            ctx.fillRect(-8, -4, 16, 40);
            ctx.fillStyle = colors.skin;
            ctx.fillRect(-6, -2, 12, 36);
            
            // Club
            ctx.fillStyle = colors.club;
            ctx.fillRect(-6, 30, 12, 50);
            ctx.fillStyle = colors.clubDark;
            ctx.fillRect(-10, 70, 20, 16);
            
            ctx.restore();
        } else {
            ctx.fillStyle = colors.skinDark;
            ctx.fillRect(28, -10 - breathe, 16, 40);
            ctx.fillStyle = colors.skin;
            ctx.fillRect(30, -8 - breathe, 12, 36);
            ctx.fillStyle = colors.skinLight;
            ctx.fillRect(38, -6 - breathe, 4, 32);
            
            // Club at side
            ctx.fillStyle = colors.club;
            ctx.fillRect(36, 20 - breathe, 12, 50);
            ctx.fillStyle = colors.clubDark;
            ctx.fillRect(32, 60 - breathe, 20, 16);
        }
        
        // ===== HEAD =====
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-24, -50 - breathe, 48, 36);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-20, -48 - breathe, 40, 32);
        ctx.fillStyle = colors.skinLight;
        ctx.fillRect(-16, -44 - breathe, 16, 24);
        
        // Single Eye (large)
        ctx.fillStyle = colors.eye;
        ctx.fillRect(-12, -42 - breathe, 24, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-10, -40 - breathe, 8, 12);
        
        // Pupil (tracks player direction implied)
        ctx.fillStyle = colors.pupil;
        ctx.fillRect(-2, -38 - breathe, 10, 10);
        ctx.fillStyle = colors.pupilDark;
        ctx.fillRect(2, -36 - breathe, 4, 6);
        
        // Angry eyebrow
        ctx.fillStyle = colors.hair;
        ctx.fillRect(-16, -50 - breathe, 32, 8);
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-14, -48 - breathe, 28, 4);
        
        // Mouth
        ctx.fillStyle = colors.mouth;
        ctx.fillRect(-14, -24 - breathe, 28, 10);
        
        // Teeth
        ctx.fillStyle = colors.teeth;
        ctx.fillRect(-10, -24 - breathe, 6, 6);
        ctx.fillRect(-2, -24 - breathe, 6, 6);
        ctx.fillRect(6, -24 - breathe, 6, 6);
        
        // Ears
        ctx.fillStyle = colors.skinDark;
        ctx.fillRect(-28, -40 - breathe, 8, 16);
        ctx.fillRect(20, -40 - breathe, 8, 16);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(-26, -38 - breathe, 4, 12);
        ctx.fillRect(22, -38 - breathe, 4, 12);
        
        ctx.restore();
        
        return canvas;
    }
    
    // ==========================================
    // ENVIRONMENT SPRITES
    // ==========================================
    createEnvironmentSprites() {
        this.sprites.pillar = this.createPillarSprite();
        this.sprites.torch = this.createTorchFrames();
        this.sprites.urn = this.createUrnSprite();
    }
    
    createPillarSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 112;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        const colors = {
            marble: '#D4C4A8',
            marbleDark: '#B4A488',
            marbleLight: '#E4D4B8',
            marbleHighlight: '#F4E4C8'
        };
        
        // Base
        ctx.fillStyle = colors.marble;
        ctx.fillRect(0, 96, 64, 16);
        ctx.fillStyle = colors.marbleLight;
        ctx.fillRect(2, 96, 60, 4);
        ctx.fillRect(4, 100, 56, 4);
        
        // Column shaft with fluting
        ctx.fillStyle = colors.marble;
        ctx.fillRect(8, 16, 48, 80);
        
        // Fluting (grooves)
        ctx.fillStyle = colors.marbleDark;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(12 + i * 12, 16, 4, 80);
        }
        ctx.fillStyle = colors.marbleLight;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(16 + i * 12, 16, 4, 80);
        }
        
        // Capital (Ionic style)
        ctx.fillStyle = colors.marbleLight;
        ctx.fillRect(0, 0, 64, 16);
        ctx.fillStyle = colors.marble;
        ctx.fillRect(4, 4, 56, 8);
        ctx.fillRect(8, 12, 48, 4);
        
        // Volutes (spiral decorations)
        ctx.fillStyle = colors.marbleDark;
        ctx.beginPath();
        ctx.arc(8, 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(56, 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors.marbleLight;
        ctx.beginPath();
        ctx.arc(8, 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(56, 6, 3, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
    
    createTorchFrames() {
        const frames = [];
        for (let i = 0; i < 4; i++) {
            frames.push(this.createTorchFrame(i));
        }
        return frames;
    }
    
    createTorchFrame(frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Holder
        ctx.fillStyle = '#4A3A2A';
        ctx.fillRect(8, 24, 8, 24);
        ctx.fillStyle = '#5A4A3A';
        ctx.fillRect(10, 24, 4, 24);
        
        // Torch head
        ctx.fillStyle = '#5A4A3A';
        ctx.fillRect(4, 18, 16, 8);
        ctx.fillStyle = '#6A5A4A';
        ctx.fillRect(6, 20, 12, 4);
        
        // Flame (animated)
        const flicker = Math.sin(frame * Math.PI / 2);
        const flameHeight = 18 + frame * 2;
        
        // Outer glow
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#FF4400';
        ctx.beginPath();
        ctx.ellipse(12, 14, 10 + flicker, flameHeight / 2 + 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main flame
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.ellipse(12, 12, 6 + flicker, flameHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner flame
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFAA00';
        ctx.beginPath();
        ctx.ellipse(12, 10, 4, flameHeight / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = '#FFFF88';
        ctx.beginPath();
        ctx.ellipse(12, 12, 2, flameHeight / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }
    
    createUrnSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        const colors = {
            terracotta: '#A0522D',
            terracottaDark: '#8B4513',
            terracottaLight: '#CD853F',
            gold: '#DAA520'
        };
        
        // Base
        ctx.fillStyle = colors.terracottaDark;
        ctx.fillRect(6, 34, 20, 6);
        
        // Body
        ctx.fillStyle = colors.terracotta;
        ctx.beginPath();
        ctx.ellipse(16, 24, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors.terracottaLight;
        ctx.beginPath();
        ctx.ellipse(12, 22, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Neck
        ctx.fillStyle = colors.terracottaDark;
        ctx.fillRect(10, 8, 12, 10);
        ctx.fillStyle = colors.terracotta;
        ctx.fillRect(12, 8, 8, 10);
        
        // Rim
        ctx.fillStyle = colors.terracottaLight;
        ctx.fillRect(8, 4, 16, 6);
        ctx.fillStyle = colors.terracottaDark;
        ctx.fillRect(10, 6, 12, 2);
        
        // Decorative band
        ctx.fillStyle = colors.gold;
        ctx.fillRect(4, 20, 24, 4);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(6, 21, 20, 2);
        
        // Handles
        ctx.fillStyle = colors.terracottaDark;
        ctx.fillRect(0, 14, 4, 12);
        ctx.fillRect(28, 14, 4, 12);
        ctx.fillStyle = colors.terracotta;
        ctx.fillRect(0, 16, 3, 8);
        ctx.fillRect(29, 16, 3, 8);
        
        return canvas;
    }
    
    // ==========================================
    // HEART SPRITES (for health indicator)
    // ==========================================
    createHeartSprites() {
        const frames = [];
        // 8 frames for smooth heartbeat animation
        for (let i = 0; i < 8; i++) {
            frames.push(this.createHeartFrame(i));
        }
        this.sprites.heart = frames;
    }
    
    createHeartFrame(frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Calculate scale for heartbeat (systole/diastole)
        // Frames 0-2: expand (systole), 3-7: contract (diastole)
        let scale = 1;
        if (frame < 3) {
            scale = 1 + frame * 0.05;
        } else {
            scale = 1.1 - (frame - 2) * 0.02;
        }
        
        ctx.save();
        ctx.translate(16, 16);
        ctx.scale(scale, scale);
        
        const colors = {
            outline: '#880000',
            main: '#CC2222',
            light: '#FF4444',
            highlight: '#FF8888',
            shine: '#FFAAAA'
        };
        
        // Draw pixelated heart
        const heartData = [
            '  ####  ####  ',
            ' ########### ',
            '##############',
            '##############',
            '##############',
            ' ############ ',
            '  ##########  ',
            '   ########   ',
            '    ######    ',
            '     ####     ',
            '      ##      '
        ];
        
        const lightData = [
            '              ',
            '  ##    ##    ',
            ' ###   ###    ',
            ' ##    ##     ',
            '              ',
            '              ',
            '              ',
            '              ',
            '              ',
            '              ',
            '              '
        ];
        
        // Main heart
        ctx.fillStyle = colors.main;
        for (let y = 0; y < heartData.length; y++) {
            for (let x = 0; x < heartData[y].length; x++) {
                if (heartData[y][x] === '#') {
                    ctx.fillRect(x * 2 - 14, y * 2 - 10, 2, 2);
                }
            }
        }
        
        // Highlight
        ctx.fillStyle = colors.light;
        for (let y = 0; y < lightData.length; y++) {
            for (let x = 0; x < lightData[y].length; x++) {
                if (lightData[y][x] === '#') {
                    ctx.fillRect(x * 2 - 14, y * 2 - 10, 2, 2);
                }
            }
        }
        
        // Shine
        ctx.fillStyle = colors.shine;
        ctx.fillRect(-10, -6, 4, 4);
        ctx.fillRect(-6, -8, 2, 2);
        
        ctx.restore();
        
        return canvas;
    }
    
    // ==========================================
    // GETTERS
    // ==========================================
    getSprite(type) {
        return this.sprites[type];
    }
    
    getFrame(type, state, frameIndex) {
        if (this.sprites[type] && this.sprites[type][state]) {
            const frames = this.sprites[type][state];
            return frames[frameIndex % frames.length];
        }
        return null;
    }
}

// Global sprite manager instance
window.spriteManager = new SpriteManager();
