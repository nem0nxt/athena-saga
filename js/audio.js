// Athena Saga - 8-bit Audio System
// Procedural chiptune music and sound effects using Web Audio API

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        
        // State
        this.initialized = false;
        this.muted = false;
        this.sfxMuted = false;
        this.musicMuted = false;
        this.volume = 0.5;
        
        // Music state
        this.currentMusic = null;
        this.musicPlaying = false;
        this.musicIntervalId = null;
        this.musicTimeoutIds = [];
        
        // Heartbeat state
        this.heartbeatOscillators = [];
        this.heartbeatInterval = null;
        this.currentHeartbeatBPM = 60;
        
        // For chiptune music
        this.arpeggiatorInterval = null;
        this.bassInterval = null;
        this.melodyNoteIndex = 0;
    }
    
    init() {
        if (this.initialized) return;
        
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.ctx.destination);
            
            // SFX gain
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.6;
            this.sfxGain.connect(this.masterGain);
            
            // Music gain
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.masterGain);
            
            this.initialized = true;
            console.log('🎵 Audio system initialized');
        } catch (e) {
            console.error('Failed to initialize audio:', e);
        }
    }
    
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SOUND EFFECTS - 8-bit Retro Style
    // ═══════════════════════════════════════════════════════════════
    
    playSpearAttack() {
        if (!this.initialized || this.sfxMuted) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Whoosh/slash sound - frequency sweep with noise
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        
        filter.type = 'highpass';
        filter.frequency.value = 300;
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
        
        // Add noise component for metallic effect
        this.playNoiseBurst(0.1, 0.08, 2000, 800);
    }
    
    playJump() {
        if (!this.initialized || this.sfxMuted) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Classic 8-bit jump - ascending pitch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    playLanding() {
        if (!this.initialized || this.sfxMuted) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Thud sound - low frequency hit
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.1);
        
        // Add subtle noise
        this.playNoiseBurst(0.05, 0.05, 500, 100);
    }
    
    playEnemyHit() {
        if (!this.initialized || this.sfxMuted) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Impact sound
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(300, now);
        osc1.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.12);
        osc2.stop(now + 0.12);
    }
    
    playEnemyDeath() {
        if (!this.initialized || this.sfxMuted) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Explosion/death sound - descending with noise
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.3);
        
        // Noise burst
        this.playNoiseBurst(0.2, 0.25, 3000, 200);
    }
    
    playPlayerDamage() {
        if (!this.initialized || this.sfxMuted) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Hurt sound - harsh descending
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.2);
        
        // Add dissonant tone
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(180, now);
        osc2.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        
        osc2.start(now);
        osc2.stop(now + 0.15);
    }
    
    playPowerUp() {
        if (!this.initialized || this.sfxMuted) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Ascending arpeggio - classic power-up
        const notes = [262, 330, 392, 523, 659, 784]; // C major arpeggio
        
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            const startTime = now + i * 0.06;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.1);
        });
    }
    
    playShieldBlock() {
        if (!this.initialized || this.sfxMuted) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Metallic clang
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const osc3 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        // Metallic harmonics
        osc1.type = 'square';
        osc1.frequency.value = 800;
        
        osc2.type = 'square';
        osc2.frequency.value = 1200;
        
        osc3.type = 'sawtooth';
        osc3.frequency.value = 1800;
        
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 5;
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.15);
        osc3.stop(now + 0.15);
        
        // Add noise for impact
        this.playNoiseBurst(0.15, 0.1, 4000, 1000);
    }
    
    playBossRoar() {
        if (!this.initialized || this.sfxMuted) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Deep, menacing roar
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(100, now);
        osc1.frequency.linearRampToValueAtTime(80, now + 0.2);
        osc1.frequency.linearRampToValueAtTime(120, now + 0.4);
        osc1.frequency.exponentialRampToValueAtTime(40, now + 0.8);
        
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(50, now);
        osc2.frequency.linearRampToValueAtTime(70, now + 0.3);
        osc2.frequency.exponentialRampToValueAtTime(30, now + 0.8);
        
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
        
        // Add rumble noise
        this.playNoiseBurst(0.3, 0.6, 200, 50);
    }
    
    playBossAttack() {
        if (!this.initialized || this.sfxMuted) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Heavy impact
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.3);
        
        // Add impact noise
        this.playNoiseBurst(0.25, 0.2, 800, 100);
    }
    
    // Noise generator helper
    playNoiseBurst(volume, duration, highFreq, lowFreq) {
        if (!this.initialized) return;
        
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = (highFreq + lowFreq) / 2;
        filter.Q.value = 1;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        noise.start(now);
        noise.stop(now + duration);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // HEARTBEAT SOUND - Synced with visual animation
    // ═══════════════════════════════════════════════════════════════
    
    startHeartbeat(bpm = 60) {
        if (!this.initialized || this.sfxMuted) return;
        this.stopHeartbeat();
        this.resume();
        
        this.currentHeartbeatBPM = bpm;
        const interval = (60 / bpm) * 1000; // ms between beats
        
        // Play initial beat
        this.playHeartbeatSound();
        
        // Schedule continuous beats
        this.heartbeatInterval = setInterval(() => {
            if (!this.sfxMuted) {
                this.playHeartbeatSound();
            }
        }, interval);
    }
    
    updateHeartbeatRate(healthPercent) {
        // Calculate BPM based on health (lower health = faster heartbeat)
        let bpm;
        if (healthPercent <= 0.25) {
            bpm = 250; // Critical - extremely fast (250 BPM!)
        } else if (healthPercent <= 0.5) {
            bpm = 100; // Low health - fast
        } else if (healthPercent <= 0.75) {
            bpm = 75; // Medium health
        } else {
            bpm = 60; // Good health - normal
        }
        
        // Only restart if BPM changed significantly
        if (Math.abs(bpm - this.currentHeartbeatBPM) > 10) {
            this.startHeartbeat(bpm);
        }
    }
    
    playHeartbeatSound() {
        if (!this.initialized || this.sfxMuted) return;
        
        const now = this.ctx.currentTime;
        const healthPercent = window.game?.player?.health / window.game?.player?.maxHealth || 1;
        
        // Adjust volume and intensity based on health
        let volumeMultiplier = 1;
        let pitchMultiplier = 1;
        
        if (healthPercent <= 0.25) {
            volumeMultiplier = 1.5; // Louder when critical
            pitchMultiplier = 1.1; // Slightly higher pitch for urgency
        } else if (healthPercent <= 0.5) {
            volumeMultiplier = 1.2;
            pitchMultiplier = 1.05;
        }
        
        // LUB (first heart sound - louder, lower)
        this.playHeartbeatPulse(now, 60 * pitchMultiplier, 0.12 * volumeMultiplier, 0.12);
        
        // DUB (second heart sound - quieter, higher, delayed)
        this.playHeartbeatPulse(now + 0.15, 80 * pitchMultiplier, 0.08 * volumeMultiplier, 0.1);
    }
    
    playHeartbeatPulse(time, frequency, volume, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        // Use sine wave for realistic thump
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, time);
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, time + duration);
        
        // Low pass filter for muffled sound
        filter.type = 'lowpass';
        filter.frequency.value = 150;
        filter.Q.value = 1;
        
        // Quick attack, gradual release
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(time);
        osc.stop(time + duration);
        
        // Add subtle sub-bass thump
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        
        subOsc.type = 'sine';
        subOsc.frequency.value = frequency * 0.5;
        
        subGain.gain.setValueAtTime(0, time);
        subGain.gain.linearRampToValueAtTime(volume * 0.5, time + 0.01);
        subGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.7);
        
        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        
        subOsc.start(time);
        subOsc.stop(time + duration);
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // BACKGROUND MUSIC - 8-bit Chiptune
    // ═══════════════════════════════════════════════════════════════
    
    playMainTheme() {
        if (!this.initialized || this.musicMuted) return;
        this.stopMusic();
        this.resume();
        
        this.currentMusic = 'main';
        this.musicPlaying = true;
        
        // Greek-inspired epic melody in Dorian mode
        // E Dorian: E F# G A B C# D E
        const melody = [
            // Phrase 1 - Epic opening
            { note: 329.63, duration: 0.25 }, // E4
            { note: 369.99, duration: 0.25 }, // F#4
            { note: 392.00, duration: 0.5 },  // G4
            { note: 440.00, duration: 0.25 }, // A4
            { note: 493.88, duration: 0.25 }, // B4
            { note: 440.00, duration: 0.5 },  // A4
            { note: 392.00, duration: 0.25 }, // G4
            { note: 369.99, duration: 0.25 }, // F#4
            { note: 329.63, duration: 1.0 },  // E4 (hold)
            
            // Phrase 2 - Ascending heroic
            { note: 440.00, duration: 0.25 }, // A4
            { note: 493.88, duration: 0.25 }, // B4
            { note: 554.37, duration: 0.5 },  // C#5
            { note: 587.33, duration: 0.25 }, // D5
            { note: 659.25, duration: 0.75 }, // E5
            { note: 587.33, duration: 0.25 }, // D5
            { note: 554.37, duration: 0.25 }, // C#5
            { note: 493.88, duration: 0.25 }, // B4
            { note: 440.00, duration: 0.5 },  // A4
            
            // Phrase 3 - Resolution
            { note: 392.00, duration: 0.25 }, // G4
            { note: 440.00, duration: 0.25 }, // A4
            { note: 493.88, duration: 0.5 },  // B4
            { note: 440.00, duration: 0.25 }, // A4
            { note: 392.00, duration: 0.25 }, // G4
            { note: 369.99, duration: 0.5 },  // F#4
            { note: 329.63, duration: 1.0 },  // E4
        ];
        
        // Bass line
        const bassNotes = [164.81, 196.00, 220.00, 246.94]; // E3, G3, A3, B3
        
        let melodyIndex = 0;
        let bassIndex = 0;
        const tempo = 140; // BPM
        const beatDuration = 60 / tempo;
        
        const playMelodyNote = () => {
            if (!this.musicPlaying || this.musicMuted) return;
            
            const note = melody[melodyIndex];
            this.playChiptuneNote(note.note, note.duration * beatDuration, 'square', 0.15);
            
            melodyIndex = (melodyIndex + 1) % melody.length;
            
            const timeoutId = setTimeout(playMelodyNote, note.duration * beatDuration * 1000);
            this.musicTimeoutIds.push(timeoutId);
        };
        
        const playBass = () => {
            if (!this.musicPlaying || this.musicMuted) return;
            
            this.playChiptuneNote(bassNotes[bassIndex], beatDuration * 0.9, 'triangle', 0.2);
            bassIndex = (bassIndex + 1) % bassNotes.length;
        };
        
        const playArpeggio = () => {
            if (!this.musicPlaying || this.musicMuted) return;
            
            // Quick arpeggiated chords
            const chords = [
                [164.81, 196.00, 246.94], // Em
                [196.00, 246.94, 293.66], // G
                [220.00, 277.18, 329.63], // A
                [246.94, 293.66, 369.99], // Bm
            ];
            
            const chord = chords[bassIndex % chords.length];
            chord.forEach((freq, i) => {
                setTimeout(() => {
                    if (this.musicPlaying) {
                        this.playChiptuneNote(freq, beatDuration * 0.3, 'square', 0.08);
                    }
                }, i * 50);
            });
        };
        
        // Start music loops
        playMelodyNote();
        this.bassInterval = setInterval(playBass, beatDuration * 1000);
        this.arpeggiatorInterval = setInterval(playArpeggio, beatDuration * 2000);
    }
    
    playBossTheme() {
        if (!this.initialized || this.musicMuted) return;
        this.stopMusic();
        this.resume();
        
        this.currentMusic = 'boss';
        this.musicPlaying = true;
        
        // Intense, faster boss fight music
        // Phrygian mode for tension: E F G A B C D E
        const melody = [
            { note: 329.63, duration: 0.125 }, // E4
            { note: 349.23, duration: 0.125 }, // F4
            { note: 329.63, duration: 0.125 }, // E4
            { note: 349.23, duration: 0.125 }, // F4
            { note: 392.00, duration: 0.25 },  // G4
            { note: 349.23, duration: 0.125 }, // F4
            { note: 329.63, duration: 0.375 }, // E4
            
            { note: 440.00, duration: 0.125 }, // A4
            { note: 493.88, duration: 0.125 }, // B4
            { note: 523.25, duration: 0.25 },  // C5
            { note: 493.88, duration: 0.125 }, // B4
            { note: 440.00, duration: 0.125 }, // A4
            { note: 392.00, duration: 0.25 },  // G4
            { note: 349.23, duration: 0.25 },  // F4
            { note: 329.63, duration: 0.5 },   // E4
        ];
        
        const bassNotes = [82.41, 87.31, 98.00, 110.00]; // E2, F2, G2, A2
        
        let melodyIndex = 0;
        let bassIndex = 0;
        const tempo = 180; // Faster tempo for boss
        const beatDuration = 60 / tempo;
        
        const playMelodyNote = () => {
            if (!this.musicPlaying || this.musicMuted) return;
            
            const note = melody[melodyIndex];
            this.playChiptuneNote(note.note, note.duration * beatDuration, 'sawtooth', 0.12);
            
            melodyIndex = (melodyIndex + 1) % melody.length;
            
            const timeoutId = setTimeout(playMelodyNote, note.duration * beatDuration * 1000);
            this.musicTimeoutIds.push(timeoutId);
        };
        
        const playBass = () => {
            if (!this.musicPlaying || this.musicMuted) return;
            
            // Driving bass
            this.playChiptuneNote(bassNotes[bassIndex], beatDuration * 0.4, 'square', 0.25);
            bassIndex = (bassIndex + 1) % bassNotes.length;
        };
        
        const playDrum = () => {
            if (!this.musicPlaying || this.musicMuted) return;
            
            // 8-bit drum beat
            this.playNoiseBurst(0.15, 0.05, 200, 50);
        };
        
        playMelodyNote();
        this.bassInterval = setInterval(playBass, beatDuration * 500);
        this.arpeggiatorInterval = setInterval(playDrum, beatDuration * 250);
    }
    
    playVictoryJingle() {
        if (!this.initialized || this.musicMuted) return;
        this.stopMusic();
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Triumphant ascending fanfare
        const notes = [
            { freq: 523.25, time: 0, dur: 0.15 },     // C5
            { freq: 659.25, time: 0.15, dur: 0.15 },  // E5
            { freq: 783.99, time: 0.3, dur: 0.15 },   // G5
            { freq: 1046.50, time: 0.45, dur: 0.5 },  // C6
            { freq: 987.77, time: 0.7, dur: 0.15 },   // B5
            { freq: 1046.50, time: 0.85, dur: 0.8 },  // C6 (hold)
        ];
        
        notes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.value = n.freq;
            
            gain.gain.setValueAtTime(0, now + n.time);
            gain.gain.linearRampToValueAtTime(0.2, now + n.time + 0.02);
            gain.gain.setValueAtTime(0.2, now + n.time + n.dur - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + n.time + n.dur);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(now + n.time);
            osc.stop(now + n.time + n.dur);
        });
        
        // Harmony
        const harmony = [
            { freq: 261.63, time: 0, dur: 0.5 },      // C4
            { freq: 329.63, time: 0.5, dur: 0.5 },    // E4
            { freq: 392.00, time: 0.7, dur: 0.8 },    // G4
        ];
        
        harmony.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = n.freq;
            
            gain.gain.setValueAtTime(0, now + n.time);
            gain.gain.linearRampToValueAtTime(0.15, now + n.time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + n.time + n.dur);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(now + n.time);
            osc.stop(now + n.time + n.dur);
        });
    }
    
    playGameOverSound() {
        if (!this.initialized || this.musicMuted) return;
        this.stopMusic();
        this.resume();
        
        const now = this.ctx.currentTime;
        
        // Sad descending phrase
        const notes = [
            { freq: 392.00, time: 0, dur: 0.3 },     // G4
            { freq: 349.23, time: 0.3, dur: 0.3 },   // F4
            { freq: 329.63, time: 0.6, dur: 0.3 },   // E4
            { freq: 293.66, time: 0.9, dur: 0.3 },   // D4
            { freq: 261.63, time: 1.2, dur: 0.8 },   // C4 (hold)
        ];
        
        notes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = n.freq;
            
            gain.gain.setValueAtTime(0, now + n.time);
            gain.gain.linearRampToValueAtTime(0.2, now + n.time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + n.time + n.dur);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(now + n.time);
            osc.stop(now + n.time + n.dur);
        });
        
        // Low bass drone
        const bass = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        
        bass.type = 'sawtooth';
        bass.frequency.value = 65.41; // C2
        
        bassGain.gain.setValueAtTime(0.15, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 2);
        
        bass.connect(bassGain);
        bassGain.connect(this.musicGain);
        
        bass.start(now);
        bass.stop(now + 2);
    }
    
    playChiptuneNote(frequency, duration, waveform = 'square', volume = 0.15) {
        if (!this.initialized) return;
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = waveform;
        osc.frequency.value = frequency;
        
        // Classic 8-bit envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.01);
        gain.gain.setValueAtTime(volume * 0.8, now + duration * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start(now);
        osc.stop(now + duration);
    }
    
    stopMusic() {
        this.musicPlaying = false;
        this.currentMusic = null;
        
        if (this.bassInterval) {
            clearInterval(this.bassInterval);
            this.bassInterval = null;
        }
        
        if (this.arpeggiatorInterval) {
            clearInterval(this.arpeggiatorInterval);
            this.arpeggiatorInterval = null;
        }
        
        // Clear all scheduled timeouts
        this.musicTimeoutIds.forEach(id => clearTimeout(id));
        this.musicTimeoutIds = [];
    }
    
    // ═══════════════════════════════════════════════════════════════
    // AUDIO CONTROLS
    // ═══════════════════════════════════════════════════════════════
    
    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : this.volume;
        }
        return this.muted;
    }
    
    toggleSFX() {
        this.sfxMuted = !this.sfxMuted;
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxMuted ? 0 : 0.6;
        }
        if (this.sfxMuted) {
            this.stopHeartbeat();
        }
        return this.sfxMuted;
    }
    
    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicMuted ? 0 : 0.3;
        }
        if (this.musicMuted) {
            this.stopMusic();
        }
        return this.musicMuted;
    }
    
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain && !this.muted) {
            this.masterGain.gain.value = this.volume;
        }
    }
}

// Create global instance
window.audioManager = new AudioManager();
