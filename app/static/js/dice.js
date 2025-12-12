/**
 * 3D Dice Animation and Sound Effects
 * RollQuest - Immersive Gaming Experience
 */

// ============================================
// SOUND MANAGER
// ============================================

class DiceSoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.volume = 0.5;
        this.audioContext = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Create audio context on user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Generate sounds programmatically (no external files needed)
            this.sounds.click = this.createClickSound();
            this.sounds.roll = this.createRollSound();
            this.sounds.win = this.createWinSound();
            this.sounds.loss = this.createLossSound();
            
            this.initialized = true;
            console.log('Sound system initialized');
        } catch (e) {
            console.warn('Audio not supported:', e);
        }
    }

    createClickSound() {
        // Short, snappy click
        return () => {
            if (!this.audioContext || this.muted) return;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.05);
            
            gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.05);
        };
    }

    createRollSound() {
        // Dice rolling/tumbling sound
        return () => {
            if (!this.audioContext || this.muted) return;
            
            const duration = 1.2;
            const numBounces = 8;
            
            for (let i = 0; i < numBounces; i++) {
                const delay = (i / numBounces) * duration * 0.8;
                const intensity = 1 - (i / numBounces) * 0.7;
                
                setTimeout(() => {
                    this.playBounce(intensity);
                }, delay * 1000);
            }
        };
    }

    playBounce(intensity) {
        if (!this.audioContext || this.muted) return;
        
        // Create noise for dice hitting surface
        const bufferSize = this.audioContext.sampleRate * 0.05;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800 + Math.random() * 400;
        filter.Q.value = 1;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = this.volume * intensity * 0.4;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        noise.start();
    }

    createWinSound() {
        // Triumphant win jingle
        return () => {
            if (!this.audioContext || this.muted) return;
            
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const times = [0, 0.1, 0.2, 0.35];
            
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    const now = this.audioContext.currentTime;
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    
                    osc.start(now);
                    osc.stop(now + 0.3);
                }, times[i] * 1000);
            });
        };
    }

    createLossSound() {
        // Descending loss sound
        return () => {
            if (!this.audioContext || this.muted) return;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.type = 'sawtooth';
            const now = this.audioContext.currentTime;
            
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
            
            gain.gain.setValueAtTime(this.volume * 0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
        };
    }

    play(soundName) {
        if (this.muted || !this.sounds[soundName]) return;
        
        try {
            this.sounds[soundName]();
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }

    toggle() {
        this.muted = !this.muted;
        return !this.muted;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
}

// Global sound manager instance
const DiceSound = new DiceSoundManager();

// ============================================
// 3D DICE ANIMATION
// ============================================

class Dice3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.cube = null;
        this.currentValue = 1;
        this.isRolling = false;
        
        if (this.container) {
            this.init();
        }
    }

    init() {
        // Create the 3D dice structure
        this.container.innerHTML = `
            <div class="dice-scene" id="diceScene">
                <div class="dice-3d-cube idle" id="dice3DCube">
                    ${this.createAllFaces()}
                </div>
            </div>
            <button class="sound-toggle" id="soundToggle" title="Toggle Sound">
                <i class="bi bi-volume-up-fill"></i>
            </button>
        `;
        
        this.scene = document.getElementById('diceScene');
        this.cube = document.getElementById('dice3DCube');
        
        // Setup sound toggle
        const soundBtn = document.getElementById('soundToggle');
        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSound();
        });
        
        // Initialize sound on first interaction
        this.container.addEventListener('click', () => DiceSound.init(), { once: true });
    }

    createAllFaces() {
        let html = '';
        for (let face = 1; face <= 6; face++) {
            html += `
                <div class="dice-face dice-face-${face}">
                    <div class="dice-dots">
                        ${this.createDots(face)}
                    </div>
                </div>
            `;
        }
        return html;
    }

    createDots(count) {
        let dots = '';
        for (let i = 0; i < count; i++) {
            dots += '<span class="dice-dot"></span>';
        }
        return dots;
    }

    async roll(targetValue, callback) {
        if (this.isRolling) return;
        
        this.isRolling = true;
        
        // Initialize sound system
        await DiceSound.init();
        
        // Play click sound
        DiceSound.play('click');
        
        // Remove previous classes
        this.cube.classList.remove('idle', 'show-1', 'show-2', 'show-3', 'show-4', 'show-5', 'show-6');
        this.scene.classList.remove('win-effect', 'loss-effect', 'rolling');
        
        // Add rolling animation
        this.cube.classList.add('rolling');
        this.scene.classList.add('rolling');
        
        // Play rolling sound
        setTimeout(() => DiceSound.play('roll'), 50);
        
        // Wait for animation to complete (1.4s animation duration)
        setTimeout(() => {
            this.cube.classList.remove('rolling');
            this.scene.classList.remove('rolling');
            
            // Show the result face with smooth transition
            this.cube.classList.add(`show-${targetValue}`);
            this.currentValue = targetValue;
            
            this.isRolling = false;
            
            if (callback) callback(targetValue);
        }, 1400);
    }

    showResult(isWin) {
        // Remove any existing effects
        this.scene.classList.remove('win-effect', 'loss-effect');
        
        // Force reflow
        void this.scene.offsetWidth;
        
        if (isWin) {
            this.scene.classList.add('win-effect');
            DiceSound.play('win');
        } else {
            this.scene.classList.add('loss-effect');
            DiceSound.play('loss');
        }
    }

    reset() {
        this.cube.classList.remove('rolling', 'show-1', 'show-2', 'show-3', 'show-4', 'show-5', 'show-6');
        this.scene.classList.remove('win-effect', 'loss-effect', 'rolling');
        this.cube.classList.add('idle');
        this.currentValue = 1;
    }

    toggleSound() {
        const soundOn = DiceSound.toggle();
        const btn = document.getElementById('soundToggle');
        const icon = btn.querySelector('i');
        
        if (soundOn) {
            btn.classList.remove('muted');
            icon.className = 'bi bi-volume-up-fill';
        } else {
            btn.classList.add('muted');
            icon.className = 'bi bi-volume-mute-fill';
        }
    }
}

// ============================================
// LEGACY API COMPATIBILITY
// ============================================

let dice3DInstance = null;

function initializeDice() {
    const container = document.getElementById('diceResult');
    if (container && !dice3DInstance) {
        dice3DInstance = new Dice3D('diceResult');
    }
}

function updateDiceDisplay(value, isWin = null) {
    if (!dice3DInstance) {
        initializeDice();
    }
    
    if (dice3DInstance && isWin !== null) {
        dice3DInstance.showResult(isWin);
    }
}

function animateDiceRoll(targetValue, callback) {
    if (!dice3DInstance) {
        initializeDice();
    }
    
    if (dice3DInstance) {
        dice3DInstance.roll(targetValue || 1, callback);
    } else if (callback) {
        callback();
    }
}

// Export for use in game.js
window.DiceAnimation = {
    update: updateDiceDisplay,
    roll: function(targetValue, callback) {
        if (!dice3DInstance) {
            initializeDice();
        }
        if (dice3DInstance) {
            dice3DInstance.roll(targetValue, callback);
        } else if (callback) {
            callback();
        }
    },
    init: initializeDice,
    showResult: function(isWin) {
        if (dice3DInstance) {
            dice3DInstance.showResult(isWin);
        }
    },
    reset: function() {
        if (dice3DInstance) {
            dice3DInstance.reset();
        }
    },
    getInstance: function() {
        return dice3DInstance;
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializeDice);
