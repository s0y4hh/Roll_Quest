/**
 * Dice Animation and Display Functions
 */

// Create dice face HTML with dots
function createDiceFaceHTML(value) {
    const dotsHTML = [];
    for (let i = 0; i < value; i++) {
        dotsHTML.push('<span class="die-dot"></span>');
    }
    
    return `
        <div class="dice-dots">
            ${dotsHTML.join('')}
        </div>
    `;
}

// Update the dice display with a specific value
function updateDiceDisplay(value, isWin = null) {
    const diceFace = document.getElementById('diceResultFace');
    const dice3D = document.getElementById('dice3D');
    
    // Set the value and update display
    diceFace.setAttribute('data-value', value);
    diceFace.innerHTML = createDiceFaceHTML(value);
    
    // Add win/loss effect
    if (isWin !== null) {
        dice3D.classList.remove('win-effect', 'loss-effect');
        void dice3D.offsetWidth; // Trigger reflow
        
        if (isWin) {
            dice3D.classList.add('win-effect');
        } else {
            dice3D.classList.add('loss-effect');
        }
    }
}

// Animate dice roll
function animateDiceRoll(callback) {
    const dice3D = document.getElementById('dice3D');
    const diceFace = document.getElementById('diceResultFace');
    
    // Add rolling class
    dice3D.classList.add('rolling');
    
    // Rapid random number display during animation
    let rollCount = 0;
    const rollInterval = setInterval(() => {
        const randomValue = Math.floor(Math.random() * 6) + 1;
        diceFace.setAttribute('data-value', randomValue);
        diceFace.innerHTML = createDiceFaceHTML(randomValue);
        rollCount++;
        
        if (rollCount >= 10) {
            clearInterval(rollInterval);
        }
    }, 80);
    
    // End animation after delay
    setTimeout(() => {
        dice3D.classList.remove('rolling');
        clearInterval(rollInterval);
        if (callback) callback();
    }, 800);
}

// Initialize dice display
function initializeDice() {
    const diceFace = document.getElementById('diceResultFace');
    if (diceFace) {
        diceFace.innerHTML = '<span class="dice-number">?</span>';
    }
}

// Export functions for use in game.js
window.DiceAnimation = {
    update: updateDiceDisplay,
    roll: animateDiceRoll,
    init: initializeDice,
    createFace: createDiceFaceHTML
};
