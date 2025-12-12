/**
 * RollQuest - Monte Carlo Simulation Logic
 */

let simState = {
    probabilities: [16.67, 16.67, 16.67, 16.67, 16.67, 16.67],
    gameMode: 'fair',
    isRunning: false
};

document.addEventListener('DOMContentLoaded', function() {
    initializeSimulation();
});

function initializeSimulation() {
    document.querySelectorAll('input[name="simGameMode"]').forEach(radio => {
        radio.addEventListener('change', handleSimModeChange);
    });
    
    document.querySelectorAll('.sim-prob-slider').forEach(slider => {
        slider.addEventListener('input', handleSimProbChange);
    });
    
    document.getElementById('betStrategy').addEventListener('change', updateStrategyDescription);
    
    updateTheoreticalValues();
}

function handleSimModeChange(e) {
    simState.gameMode = e.target.value;
    const sliderContainer = document.getElementById('simProbSliders');
    
    if (simState.gameMode === 'tweaked') {
        sliderContainer.style.display = 'block';
    } else {
        sliderContainer.style.display = 'none';
        simState.probabilities = [16.67, 16.67, 16.67, 16.67, 16.67, 16.67];
        updateSimProbDisplays();
    }
    updateTheoreticalValues();
}

function handleSimProbChange(e) {
    const face = parseInt(e.target.dataset.face);
    const newValue = parseFloat(e.target.value);
    
    simState.probabilities[face - 1] = newValue;
    
    const remaining = 100 - newValue;
    const otherTotal = simState.probabilities.reduce((sum, val, idx) => 
        idx !== face - 1 ? sum + val : sum, 0);
    
    if (otherTotal > 0) {
        for (let i = 0; i < 6; i++) {
            if (i !== face - 1) {
                simState.probabilities[i] = (simState.probabilities[i] / otherTotal) * remaining;
            }
        }
    } else {
        const equalShare = remaining / 5;
        for (let i = 0; i < 6; i++) {
            if (i !== face - 1) {
                simState.probabilities[i] = equalShare;
            }
        }
    }
    
    updateSimProbDisplays();
    updateTheoreticalValues();
}

function updateSimProbDisplays() {
    for (let i = 1; i <= 6; i++) {
        const value = simState.probabilities[i - 1];
        document.getElementById(`simProbValue${i}`).textContent = value.toFixed(2) + '%';
        document.getElementById(`simProb${i}`).value = value;
    }
}

function updateStrategyDescription() {
    const strategy = document.getElementById('betStrategy').value;
    const descriptions = {
        'fixed': 'Bet the same amount every round.',
        'martingale': 'Double your bet after each loss, reset after win. High risk!',
        'anti_martingale': 'Double your bet after each win, reset after loss.',
        'kelly': 'Bet a fraction of bankroll based on edge. Mathematically optimal.'
    };
    document.getElementById('strategyDescription').textContent = descriptions[strategy];
}

function updateTheoreticalValues() {
    const targetFace = document.getElementById('targetFace').value;
    let winProb;
    
    if (simState.gameMode === 'fair') {
        winProb = 1/6;
    } else if (targetFace) {
        winProb = simState.probabilities[parseInt(targetFace) - 1] / 100;
    } else {
        winProb = 1/6;
    }
    
    const payout = 6;
    const betAmount = parseFloat(document.getElementById('simBetAmount').value) || 10;
    
    const ev = (winProb * payout - 1) * betAmount;
    
    const houseEdge = (1 - winProb * payout) * 100;
    
    document.getElementById('theoreticalWinProb').textContent = (winProb * 100).toFixed(2) + '%';
    document.getElementById('theoreticalEV').textContent = '$' + ev.toFixed(4);
    document.getElementById('theoreticalHouseEdge').textContent = houseEdge.toFixed(2) + '%';
}

async function runSimulation() {
    if (simState.isRunning) return;
    
    simState.isRunning = true;
    showLoading(true);
    
    const params = getSimulationParams();
    
    try {
        const response = await fetch('/simulation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displaySingleSimResults(data);
        } else {
            showError(data.error || 'Simulation failed');
        }
    } catch (error) {
        console.error('Simulation error:', error);
        showError('Failed to run simulation');
    }
    
    simState.isRunning = false;
    showLoading(false);
}

async function runBatchSimulation() {
    if (simState.isRunning) return;
    
    simState.isRunning = true;
    showLoading(true);
    
    const params = getSimulationParams();
    params.num_simulations = 100;
    params.trials_per_sim = Math.min(params.num_trials, 1000);
    
    try {
        const response = await fetch('/simulation/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayBatchResults(data);
        } else {
            showError(data.error || 'Batch simulation failed');
        }
    } catch (error) {
        console.error('Batch simulation error:', error);
        showError('Failed to run batch simulation');
    }
    
    simState.isRunning = false;
    showLoading(false);
}

async function runConvergenceAnalysis() {
    if (simState.isRunning) return;
    
    simState.isRunning = true;
    showLoading(true);
    
    const targetFace = document.getElementById('targetFace').value || 1;
    const params = {
        max_trials: parseInt(document.getElementById('numTrials').value),
        game_mode: simState.gameMode,
        probabilities: simState.gameMode === 'tweaked' ? simState.probabilities.map(p => p / 100) : null,
        target_face: parseInt(targetFace)
    };
    
    try {
        const response = await fetch('/simulation/convergence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayConvergenceResults(data);
        } else {
            showError(data.error || 'Convergence analysis failed');
        }
    } catch (error) {
        console.error('Convergence error:', error);
        showError('Failed to run convergence analysis');
    }
    
    simState.isRunning = false;
    showLoading(false);
}

function getSimulationParams() {
    return {
        num_trials: parseInt(document.getElementById('numTrials').value),
        starting_balance: parseFloat(document.getElementById('startingBalance').value),
        bet_amount: parseFloat(document.getElementById('simBetAmount').value),
        bet_strategy: document.getElementById('betStrategy').value,
        game_mode: simState.gameMode,
        probabilities: simState.gameMode === 'tweaked' ? simState.probabilities.map(p => p / 100) : null,
        target_face: document.getElementById('targetFace').value ? parseInt(document.getElementById('targetFace').value) : null
    };
}

function showLoading(show) {
    document.getElementById('simLoading').style.display = show ? 'block' : 'none';
    if (show) {
        document.getElementById('simResults').innerHTML = '';
    }
}

function showError(message) {
    document.getElementById('simResults').innerHTML = `
        <div class="game-card text-center py-4">
            <i class="bi bi-exclamation-triangle display-4 text-danger mb-3"></i>
            <h5 class="text-danger">${message}</h5>
        </div>
    `;
}

function displaySingleSimResults(data) {
    const summary = data.summary;
    const theoretical = data.theoretical;
    
    let html = `
        <!-- Summary Stats -->
        <div class="row mb-4">
            <div class="col-md-3 col-6 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value">${summary.total_rounds.toLocaleString()}</div>
                    <div class="stat-label">Total Rounds</div>
                </div>
            </div>
            <div class="col-md-3 col-6 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value text-teal">${summary.win_rate}%</div>
                    <div class="stat-label">Win Rate</div>
                </div>
            </div>
            <div class="col-md-3 col-6 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value ${summary.profit >= 0 ? 'positive' : 'negative'}">
                        ${summary.profit >= 0 ? '+' : ''}$${summary.profit.toFixed(2)}
                    </div>
                    <div class="stat-label">Final Profit</div>
                </div>
            </div>
            <div class="col-md-3 col-6 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value">$${summary.final_balance.toFixed(2)}</div>
                    <div class="stat-label">Final Balance</div>
                </div>
            </div>
        </div>
        
        <!-- Balance Trajectory Chart -->
        <div class="game-card mb-4">
            <h5 class="text-teal mb-3"><i class="bi bi-graph-up me-2"></i>Balance Over Time</h5>
            <div id="balanceChart" class="chart-container"></div>
        </div>
        
        <!-- Face Distribution -->
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="game-card">
                    <h5 class="text-teal mb-3"><i class="bi bi-pie-chart me-2"></i>Face Distribution</h5>
                    <div id="faceDistChart" class="chart-container" style="min-height: 300px;"></div>
                </div>
            </div>
            <div class="col-md-6 mb-4">
                <div class="game-card">
                    <h5 class="text-teal mb-3"><i class="bi bi-list-check me-2"></i>Detailed Statistics</h5>
                    <table class="stats-table">
                        <tr><td>Wins</td><td class="text-end text-success-custom">${summary.wins.toLocaleString()}</td></tr>
                        <tr><td>Losses</td><td class="text-end text-danger-custom">${summary.losses.toLocaleString()}</td></tr>
                        <tr><td>Max Balance</td><td class="text-end">$${summary.max_balance.toFixed(2)}</td></tr>
                        <tr><td>Min Balance</td><td class="text-end">$${summary.min_balance.toFixed(2)}</td></tr>
                        <tr><td>Went Bankrupt</td><td class="text-end">${summary.went_bankrupt ? '<span class="text-danger">Yes</span>' : '<span class="text-success">No</span>'}</td></tr>
                        <tr><td>Expected Win Prob</td><td class="text-end">${theoretical.expected_win_prob}%</td></tr>
                        <tr><td>House Edge</td><td class="text-end">${theoretical.house_edge}%</td></tr>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('simResults').innerHTML = html;
    
    Plotly.newPlot('balanceChart', [{
        y: data.balance_trajectory,
        type: 'scatter',
        mode: 'lines',
        name: 'Balance',
        line: { color: '#4fc3c3', width: 2 }
    }], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 20, r: 20, b: 40, l: 60 },
        xaxis: { title: 'Round', gridcolor: 'rgba(255,255,255,0.1)' },
        yaxis: { title: 'Balance ($)', gridcolor: 'rgba(255,255,255,0.1)' },
        shapes: [{
            type: 'line',
            x0: 0, x1: data.balance_trajectory.length,
            y0: data.parameters.starting_balance, y1: data.parameters.starting_balance,
            line: { color: 'rgba(255,255,255,0.3)', dash: 'dash', width: 1 }
        }]
    }, { responsive: true });
    
    const faceLabels = ['Face 1', 'Face 2', 'Face 3', 'Face 4', 'Face 5', 'Face 6'];
    const faceCounts = Object.values(data.face_distribution);
    
    Plotly.newPlot('faceDistChart', [{
        x: faceLabels,
        y: faceCounts,
        type: 'bar',
        marker: { 
            color: ['#1a4a4f', '#247a7a', '#35a3a3', '#4fc3c3', '#6fd3d3', '#8fe3e3']
        }
    }], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 20, r: 20, b: 40, l: 60 },
        xaxis: { gridcolor: 'rgba(255,255,255,0.1)' },
        yaxis: { title: 'Count', gridcolor: 'rgba(255,255,255,0.1)' }
    }, { responsive: true });
}

function displayBatchResults(data) {
    const stats = data.statistics;
    
    let html = `
        <!-- Summary Stats -->
        <div class="row mb-4">
            <div class="col-md-3 col-6 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value">${data.num_simulations}</div>
                    <div class="stat-label">Simulations Run</div>
                </div>
            </div>
            <div class="col-md-3 col-6 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value ${stats.mean_profit >= 0 ? 'positive' : 'negative'}">
                        ${stats.mean_profit >= 0 ? '+' : ''}$${stats.mean_profit.toFixed(2)}
                    </div>
                    <div class="stat-label">Mean Profit</div>
                </div>
            </div>
            <div class="col-md-3 col-6 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value text-danger-custom">${stats.ruin_probability}%</div>
                    <div class="stat-label">Ruin Probability</div>
                </div>
            </div>
            <div class="col-md-3 col-6 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value text-teal">${stats.mean_win_rate}%</div>
                    <div class="stat-label">Mean Win Rate</div>
                </div>
            </div>
        </div>
        
        <!-- Profit Distribution -->
        <div class="game-card mb-4">
            <h5 class="text-teal mb-3"><i class="bi bi-bar-chart me-2"></i>Profit Distribution</h5>
            <div id="profitDistChart" class="chart-container"></div>
        </div>
        
        <!-- Detailed Stats -->
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="game-card">
                    <h5 class="text-teal mb-3"><i class="bi bi-calculator me-2"></i>Statistical Summary</h5>
                    <table class="stats-table">
                        <tr><td>Mean Final Balance</td><td class="text-end">$${stats.mean_final_balance.toFixed(2)}</td></tr>
                        <tr><td>Std Dev (Balance)</td><td class="text-end">$${stats.std_final_balance.toFixed(2)}</td></tr>
                        <tr><td>Median Profit</td><td class="text-end">$${stats.median_profit.toFixed(2)}</td></tr>
                        <tr><td>Std Dev (Profit)</td><td class="text-end">$${stats.std_profit.toFixed(2)}</td></tr>
                        <tr><td>Value at Risk (5%)</td><td class="text-end text-danger-custom">$${stats.value_at_risk_5.toFixed(2)}</td></tr>
                    </table>
                </div>
            </div>
            <div class="col-md-6 mb-4">
                <div class="game-card">
                    <h5 class="text-teal mb-3"><i class="bi bi-scatter-chart me-2"></i>Final Balances</h5>
                    <div id="balanceDistChart" class="chart-container" style="min-height: 250px;"></div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('simResults').innerHTML = html;
    
    const histData = data.distribution.histogram;
    Plotly.newPlot('profitDistChart', [{
        x: histData.bins.slice(0, -1),
        y: histData.counts,
        type: 'bar',
        marker: { color: '#4fc3c3' }
    }], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 20, r: 20, b: 40, l: 60 },
        xaxis: { title: 'Profit ($)', gridcolor: 'rgba(255,255,255,0.1)' },
        yaxis: { title: 'Frequency', gridcolor: 'rgba(255,255,255,0.1)' }
    }, { responsive: true });
    
    Plotly.newPlot('balanceDistChart', [{
        y: data.distribution.final_balances,
        type: 'box',
        marker: { color: '#4fc3c3' },
        boxpoints: 'outliers'
    }], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 20, r: 20, b: 20, l: 60 },
        yaxis: { title: 'Final Balance ($)', gridcolor: 'rgba(255,255,255,0.1)' }
    }, { responsive: true });
}

function displayConvergenceResults(data) {
    let html = `
        <!-- Summary -->
        <div class="row mb-4">
            <div class="col-md-4 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value text-teal">${data.theoretical_probability}%</div>
                    <div class="stat-label">Theoretical Probability</div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value">${data.final_empirical}%</div>
                    <div class="stat-label">Final Empirical Probability</div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="game-card text-center">
                    <div class="stat-value ${data.convergence_error < 1 ? 'positive' : 'negative'}">${data.convergence_error}%</div>
                    <div class="stat-label">Convergence Error</div>
                </div>
            </div>
        </div>
        
        <!-- Convergence Chart -->
        <div class="game-card mb-4">
            <h5 class="text-teal mb-3">
                <i class="bi bi-graph-up me-2"></i>
                Probability Convergence (Face ${data.target_face})
            </h5>
            <p class="text-muted small mb-3">
                Demonstrates the <strong>Law of Large Numbers</strong>: As trials increase, 
                empirical probability converges to theoretical probability.
            </p>
            <div id="convergenceChart" class="chart-container" style="min-height: 400px;"></div>
        </div>
        
        <!-- Explanation -->
        <div class="game-card">
            <h5 class="text-teal mb-3"><i class="bi bi-lightbulb me-2"></i>Interpretation</h5>
            <p class="mb-2">
                The blue line shows the running empirical probability of rolling Face ${data.target_face}, 
                while the red dashed line shows the theoretical probability (${data.theoretical_probability}%).
            </p>
            <p class="mb-0">
                The shaded area represents the 95% confidence interval. As the number of trials increases,
                this interval narrows, and the empirical probability converges to the theoretical value.
            </p>
        </div>
    `;
    
    document.getElementById('simResults').innerHTML = html;
    
    const ciLower = data.confidence_intervals.map(ci => ci[0]);
    const ciUpper = data.confidence_intervals.map(ci => ci[1]);
    
    Plotly.newPlot('convergenceChart', [
        {
            x: data.trials.concat(data.trials.slice().reverse()),
            y: ciUpper.concat(ciLower.slice().reverse()),
            fill: 'toself',
            fillcolor: 'rgba(79, 195, 195, 0.2)',
            line: { color: 'transparent' },
            name: '95% CI',
            hoverinfo: 'skip'
        },
        {
            x: data.trials,
            y: data.empirical_probabilities,
            type: 'scatter',
            mode: 'lines',
            name: 'Empirical Probability',
            line: { color: '#4fc3c3', width: 2 }
        },
        {
            x: [data.trials[0], data.trials[data.trials.length - 1]],
            y: [data.theoretical_probability, data.theoretical_probability],
            type: 'scatter',
            mode: 'lines',
            name: 'Theoretical',
            line: { color: '#e74c3c', dash: 'dash', width: 2 }
        }
    ], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 20, r: 20, b: 50, l: 60 },
        xaxis: { 
            title: 'Number of Trials', 
            gridcolor: 'rgba(255,255,255,0.1)',
            type: 'log'
        },
        yaxis: { 
            title: 'Probability (%)', 
            gridcolor: 'rgba(255,255,255,0.1)',
            range: [0, 40]
        },
        legend: {
            x: 0.7,
            y: 0.95,
            bgcolor: 'rgba(0,0,0,0.5)'
        }
    }, { responsive: true });
}
