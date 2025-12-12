/**
 * RollQuest - Game Logic
 */

let gameState = {
    selectedFace: 1,
    probabilities: [16.67, 16.67, 16.67, 16.67, 16.67, 16.67],
    gameMode: 'fair',
    isRolling: false
};

document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

function initializeGame() {
    // Initialize dice display
    if (window.DiceAnimation) {
        window.DiceAnimation.init();
    }
    
    // Set up game mode listeners
    document.querySelectorAll('input[name="gameMode"]').forEach(radio => {
        radio.addEventListener('change', handleGameModeChange);
    });
    
    // Set up probability sliders
    document.querySelectorAll('.prob-slider').forEach(slider => {
        slider.addEventListener('input', handleProbabilityChange);
    });
    
    // Initialize first face as selected
    selectFace(1);
}

function handleGameModeChange(e) {
    gameState.gameMode = e.target.value;
    const sliderContainer = document.getElementById('probabilitySliders');
    
    if (gameState.gameMode === 'tweaked') {
        sliderContainer.style.display = 'block';
    } else {
        sliderContainer.style.display = 'none';
        // Reset to fair probabilities
        gameState.probabilities = [16.67, 16.67, 16.67, 16.67, 16.67, 16.67];
        updateProbabilityDisplays();
    }
}

function handleProbabilityChange(e) {
    const face = parseInt(e.target.dataset.face);
    const newValue = parseFloat(e.target.value);
    
    // Update the changed face
    gameState.probabilities[face - 1] = newValue;
    
    // Calculate remaining probability to distribute
    const remaining = 100 - newValue;
    const otherTotal = gameState.probabilities.reduce((sum, val, idx) => 
        idx !== face - 1 ? sum + val : sum, 0);
    
    // Redistribute remaining probability proportionally
    if (otherTotal > 0) {
        for (let i = 0; i < 6; i++) {
            if (i !== face - 1) {
                gameState.probabilities[i] = (gameState.probabilities[i] / otherTotal) * remaining;
            }
        }
    } else {
        // If all others are 0, distribute equally
        const equalShare = remaining / 5;
        for (let i = 0; i < 6; i++) {
            if (i !== face - 1) {
                gameState.probabilities[i] = equalShare;
            }
        }
    }
    
    updateProbabilityDisplays();
}

function updateProbabilityDisplays() {
    for (let i = 1; i <= 6; i++) {
        const value = gameState.probabilities[i - 1];
        const valueDisplay = document.getElementById(`probValue${i}`);
        const slider = document.getElementById(`probSlider${i}`);
        
        if (valueDisplay) {
            valueDisplay.textContent = value.toFixed(2) + '%';
        }
        if (slider) {
            slider.value = value;
        }
    }
}

function selectFace(face) {
    gameState.selectedFace = face;
    
    document.querySelectorAll('.dice-face-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`.dice-face-btn[data-face="${face}"]`).classList.add('selected');
}

async function rollDice() {
    if (gameState.isRolling) return;
    
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    
    if (isNaN(betAmount) || betAmount < 1) {
        showToast('Please enter a valid bet amount', 'error');
        return;
    }
    
    gameState.isRolling = true;
    const rollBtn = document.getElementById('rollBtn');
    rollBtn.disabled = true;
    
    const resultIndicator = document.getElementById('resultIndicator');
    resultIndicator.style.display = 'none';
    
    const probabilities = gameState.gameMode === 'tweaked' 
        ? gameState.probabilities.map(p => p / 100)
        : null;
    
    window.DiceAnimation.roll(async () => {
        try {
            const response = await fetch('/game/roll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bet_face: gameState.selectedFace,
                    bet_amount: betAmount,
                    probabilities: probabilities
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                window.DiceAnimation.update(data.result, data.won);
                
                resultIndicator.className = `result-indicator ${data.won ? 'win' : 'loss'}`;
                resultIndicator.textContent = data.won ? '🎉 WIN!' : '😢 LOSS';
                resultIndicator.style.display = 'inline-block';
                
                updateGameStats(data);
                
                addHistoryEntry({
                    round: data.total_rounds,
                    bet_face: gameState.selectedFace,
                    result: data.result,
                    won: data.won
                });
                
            } else {
                showToast(data.error || 'An error occurred', 'error');
                window.DiceAnimation.init();
            }
            
        } catch (error) {
            console.error('Roll error:', error);
            showToast('Failed to roll dice. Please try again.', 'error');
            window.DiceAnimation.init();
        }
        
        gameState.isRolling = false;
        rollBtn.disabled = false;
    });
}

function updateGameStats(data) {
    const balanceDisplay = document.getElementById('balanceDisplay');
    balanceDisplay.textContent = '$' + data.balance.toFixed(2);
    
    const profitDisplay = document.getElementById('profitDisplay');
    const profitValue = data.profit;
    profitDisplay.textContent = (profitValue >= 0 ? '+' : '') + '$' + profitValue.toFixed(2);
    profitDisplay.className = `stat-value ${profitValue >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('totalRounds').textContent = data.total_rounds;
    document.getElementById('winRate').textContent = data.win_rate.toFixed(1) + '%';
    document.getElementById('winsCount').textContent = data.wins;
    document.getElementById('lossesCount').textContent = data.losses;
}

function addHistoryEntry(entry) {
    const historyList = document.getElementById('historyList');
    
    const noGamesMsg = historyList.querySelector('.text-muted');
    if (noGamesMsg) {
        noGamesMsg.remove();
    }
    
    const entryDiv = document.createElement('div');
    entryDiv.className = `history-item ${entry.won ? 'win' : 'loss'}`;
    entryDiv.innerHTML = `
        <span>R${entry.round}: Bet ${entry.bet_face} → Got ${entry.result}</span>
        <span class="${entry.won ? 'text-success-custom' : 'text-danger-custom'}">
            ${entry.won ? 'WIN' : 'LOSS'}
        </span>
    `;
    
    historyList.insertBefore(entryDiv, historyList.firstChild);
    
    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}

async function setPlayerName() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    
    if (!name) {
        showToast('Please enter a name', 'error');
        return;
    }
    
    try {
        const response = await fetch('/game/set-player', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(`Welcome, ${data.player_name}!`, 'success');
        } else {
            showToast(data.error || 'Failed to set name', 'error');
        }
    } catch (error) {
        console.error('Set name error:', error);
        showToast('Failed to set name', 'error');
    }
}

async function addFunds() {
    const amount = parseFloat(document.getElementById('addFundsAmount').value);
    
    if (isNaN(amount) || amount < 1 || amount > 100000) {
        showToast('Please enter a valid amount (1 - 100,000)', 'error');
        return;
    }
    
    try {
        const response = await fetch('/game/add-funds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: amount })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('balanceDisplay').textContent = '$' + data.balance.toFixed(2);
            showToast(`Added $${amount.toFixed(2)} to balance`, 'success');
        } else {
            showToast(data.error || 'Failed to add funds', 'error');
        }
    } catch (error) {
        console.error('Add funds error:', error);
        showToast('Failed to add funds', 'error');
    }
}

async function resetGame() {
    if (!confirm('Are you sure you want to reset the game? All progress will be lost.')) {
        return;
    }
    
    try {
        const response = await fetch('/game/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.location.reload();
        } else {
            showToast(data.error || 'Failed to reset game', 'error');
        }
    } catch (error) {
        console.error('Reset error:', error);
        showToast('Failed to reset game', 'error');
    }
}

function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show`;
    toast.style.cssText = `
        min-width: 250px;
        margin-bottom: 10px;
        animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
