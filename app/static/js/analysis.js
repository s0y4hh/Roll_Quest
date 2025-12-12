/**
 * RollQuest - Analysis Page Logic
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSessionStats();
});

// Load session statistics
async function loadSessionStats() {
    try {
        const response = await fetch('/analysis/session-stats');
        
        if (response.ok) {
            const data = await response.json();
            displaySessionStats(data);
        } else if (response.status === 404) {
            displayNoSession();
        } else {
            console.error('Failed to load session stats');
        }
    } catch (error) {
        console.error('Error loading session stats:', error);
        displayNoSession();
    }
}

function displayNoSession() {
    document.getElementById('sessionStats').innerHTML = `
        <div class="text-center py-3">
            <i class="bi bi-info-circle display-4 text-muted mb-2"></i>
            <p class="text-muted small">No game session found. Play some rounds first!</p>
            <a href="/game" class="btn btn-primary-custom btn-sm">Go to Game</a>
        </div>
    `;
    
    // Clear stats
    document.getElementById('statTotalRounds').textContent = '0';
    document.getElementById('statWinRate').textContent = '0%';
    document.getElementById('statProfit').textContent = '$0.00';
    document.getElementById('statBalance').textContent = '$0.00';
}

function displaySessionStats(data) {
    const basic = data.basic_stats;
    
    // Update quick stats
    document.getElementById('statTotalRounds').textContent = basic.total_rounds.toLocaleString();
    document.getElementById('statWinRate').textContent = basic.win_rate.toFixed(1) + '%';
    
    const profitEl = document.getElementById('statProfit');
    profitEl.textContent = (basic.profit >= 0 ? '+' : '') + '$' + basic.profit.toFixed(2);
    profitEl.className = 'stat-value ' + (basic.profit >= 0 ? 'positive' : 'negative');
    
    document.getElementById('statBalance').textContent = '$' + basic.balance.toFixed(2);
    
    // Update session panel
    document.getElementById('sessionStats').innerHTML = `
        <div class="small">
            <div class="d-flex justify-content-between mb-2">
                <span>Wins:</span>
                <span class="text-success-custom">${basic.wins}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
                <span>Losses:</span>
                <span class="text-danger-custom">${basic.losses}</span>
            </div>
            <div class="d-flex justify-content-between">
                <span>Win Rate:</span>
                <span class="text-teal">${basic.win_rate.toFixed(2)}%</span>
            </div>
        </div>
    `;
    
    // Update streak stats
    const streaks = data.streak_analysis;
    document.getElementById('maxWinStreak').textContent = streaks.max_win_streak;
    document.getElementById('maxLoseStreak').textContent = streaks.max_lose_streak;
    
    const currentStreakEl = document.getElementById('currentStreak');
    currentStreakEl.textContent = Math.abs(streaks.current_streak);
    currentStreakEl.className = 'stat-value ' + (streaks.current_streak >= 0 ? 'positive' : 'negative');
    
    // Create face distribution chart
    createFaceDistributionChart(data.face_distribution);
    
    // Create balance over time chart
    createBalanceTimeChart(data.profit_over_time);
    
    // Update bet performance table
    updateBetPerformanceTable(data.bet_analysis);
}

function createFaceDistributionChart(faceData) {
    if (!faceData || faceData.total_rolls === 0) {
        document.getElementById('faceDistributionChart').innerHTML = `
            <div class="text-center text-muted py-5">No data yet</div>
        `;
        return;
    }
    
    const labels = ['Face 1', 'Face 2', 'Face 3', 'Face 4', 'Face 5', 'Face 6'];
    const counts = Object.values(faceData.counts);
    const percentages = Object.values(faceData.percentages);
    
    // Expected counts (fair dice)
    const expectedCount = faceData.total_rolls / 6;
    const expected = Array(6).fill(expectedCount);
    
    Plotly.newPlot('faceDistributionChart', [
        {
            x: labels,
            y: counts,
            type: 'bar',
            name: 'Observed',
            marker: { color: '#4fc3c3' },
            text: percentages.map(p => p.toFixed(1) + '%'),
            textposition: 'outside'
        },
        {
            x: labels,
            y: expected,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Expected (16.67%)',
            line: { color: '#e74c3c', dash: 'dash', width: 2 },
            marker: { size: 8 }
        }
    ], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff', size: 11 },
        margin: { t: 30, r: 20, b: 40, l: 50 },
        xaxis: { gridcolor: 'rgba(255,255,255,0.1)' },
        yaxis: { title: 'Count', gridcolor: 'rgba(255,255,255,0.1)' },
        legend: { x: 0.7, y: 1, bgcolor: 'rgba(0,0,0,0.3)' },
        barmode: 'group'
    }, { responsive: true });
}

function createBalanceTimeChart(profitData) {
    if (!profitData || profitData.rounds.length === 0) {
        document.getElementById('balanceTimeChart').innerHTML = `
            <div class="text-center text-muted py-5">No data yet</div>
        `;
        return;
    }
    
    Plotly.newPlot('balanceTimeChart', [{
        x: profitData.rounds,
        y: profitData.balances,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#4fc3c3', width: 2 },
        fill: 'tozeroy',
        fillcolor: 'rgba(79, 195, 195, 0.2)'
    }], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff', size: 11 },
        margin: { t: 20, r: 20, b: 40, l: 60 },
        xaxis: { title: 'Round', gridcolor: 'rgba(255,255,255,0.1)' },
        yaxis: { title: 'Balance ($)', gridcolor: 'rgba(255,255,255,0.1)' }
    }, { responsive: true });
}

function updateBetPerformanceTable(betData) {
    const tbody = document.getElementById('betPerformanceBody');
    
    if (!betData || Object.keys(betData.bet_face_performance).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No betting data available</td></tr>';
        return;
    }
    
    const expectedWinRate = 16.67;
    let html = '';
    
    for (let face = 1; face <= 6; face++) {
        const perf = betData.bet_face_performance[face];
        if (perf && perf.times_bet > 0) {
            const diff = perf.win_rate - expectedWinRate;
            const diffClass = diff >= 0 ? 'text-success-custom' : 'text-danger-custom';
            const diffSign = diff >= 0 ? '+' : '';
            
            html += `
                <tr>
                    <td><i class="bi bi-dice-${face}-fill text-teal me-2"></i>Face ${face}</td>
                    <td>${perf.times_bet}</td>
                    <td class="text-success-custom">${perf.wins}</td>
                    <td>${perf.win_rate.toFixed(2)}%</td>
                    <td class="${diffClass}">${diffSign}${diff.toFixed(2)}%</td>
                </tr>
            `;
        }
    }
    
    tbody.innerHTML = html || '<tr><td colspan="5" class="text-center text-muted">No betting data available</td></tr>';
}

// Run Chi-Square test
async function runChiSquareTest() {
    const resultDiv = document.getElementById('chiSquareResult');
    resultDiv.innerHTML = '<div class="spinner mx-auto"></div>';
    
    try {
        // First get session stats
        const statsResponse = await fetch('/analysis/session-stats');
        if (!statsResponse.ok) {
            resultDiv.innerHTML = '<p class="text-danger small">No session data available</p>';
            return;
        }
        
        const statsData = await statsResponse.json();
        const observed = Object.values(statsData.face_distribution.counts);
        
        if (observed.every(v => v === 0)) {
            resultDiv.innerHTML = '<p class="text-warning small">Not enough data. Play some rounds first!</p>';
            return;
        }
        
        // Run chi-square test
        const response = await fetch('/analysis/chi-square', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ observed: observed })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const resultClass = data.is_fair_at_95_confidence ? 'text-success-custom' : 'text-danger-custom';
            resultDiv.innerHTML = `
                <div class="small">
                    <div class="d-flex justify-content-between mb-1">
                        <span>χ² Statistic:</span>
                        <span>${data.chi_square_statistic}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                        <span>p-value:</span>
                        <span>${data.p_value.toFixed(6)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Critical Value:</span>
                        <span>${data.critical_value_95}</span>
                    </div>
                    <hr style="border-color: var(--card-border);">
                    <p class="${resultClass} mb-0"><strong>${data.interpretation}</strong></p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<p class="text-danger small">${data.error || 'Test failed'}</p>`;
        }
    } catch (error) {
        console.error('Chi-square test error:', error);
        resultDiv.innerHTML = '<p class="text-danger small">Error running test</p>';
    }
}

// Run comparison simulation
async function runComparison() {
    const resultsDiv = document.getElementById('comparisonResults');
    const trials = parseInt(document.getElementById('comparisonTrials').value);
    
    resultsDiv.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner mx-auto mb-2"></div>
            <p class="text-muted small">Running comparison simulations...</p>
        </div>
    `;
    
    try {
        // Run fair simulation
        const fairResponse = await fetch('/simulation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                num_trials: trials,
                starting_balance: 1000,
                bet_amount: 10,
                bet_strategy: 'fixed',
                game_mode: 'fair',
                target_face: 1
            })
        });
        const fairData = await fairResponse.json();
        
        // Run tweaked simulation (biased against player)
        const tweakedResponse = await fetch('/simulation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                num_trials: trials,
                starting_balance: 1000,
                bet_amount: 10,
                bet_strategy: 'fixed',
                game_mode: 'tweaked',
                probabilities: [0.10, 0.18, 0.18, 0.18, 0.18, 0.18], // Face 1 has 10% (player bets on 1)
                target_face: 1
            })
        });
        const tweakedData = await tweakedResponse.json();
        
        // Display comparison
        displayComparison(fairData, tweakedData);
        
    } catch (error) {
        console.error('Comparison error:', error);
        resultsDiv.innerHTML = '<p class="text-danger">Error running comparison</p>';
    }
}

function displayComparison(fairData, tweakedData) {
    const fair = fairData.summary;
    const tweaked = tweakedData.summary;
    
    const metrics = [
        { label: 'Win Rate', fair: fair.win_rate + '%', tweaked: tweaked.win_rate + '%', 
          diff: (fair.win_rate - tweaked.win_rate).toFixed(2) + '%' },
        { label: 'Final Profit', fair: '$' + fair.profit.toFixed(2), tweaked: '$' + tweaked.profit.toFixed(2),
          diff: '$' + (fair.profit - tweaked.profit).toFixed(2) },
        { label: 'Final Balance', fair: '$' + fair.final_balance.toFixed(2), tweaked: '$' + tweaked.final_balance.toFixed(2),
          diff: '$' + (fair.final_balance - tweaked.final_balance).toFixed(2) },
        { label: 'Bankrupt', fair: fair.went_bankrupt ? 'Yes' : 'No', tweaked: tweaked.went_bankrupt ? 'Yes' : 'No',
          diff: '-' }
    ];
    
    let html = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th class="text-center">Fair</th>
                    <th class="text-center">Tweaked</th>
                    <th class="text-center">Δ Difference</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    metrics.forEach(m => {
        html += `
            <tr>
                <td>${m.label}</td>
                <td class="text-center">${m.fair}</td>
                <td class="text-center">${m.tweaked}</td>
                <td class="text-center text-teal">${m.diff}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <p class="small text-muted mt-3 mb-0">
            <strong>Note:</strong> Tweaked game has Face 1 at 10% probability (vs 16.67% fair),
            demonstrating how a slight bias significantly impacts player outcomes.
        </p>
    `;
    
    document.getElementById('comparisonResults').innerHTML = html;
}

// Export functions
async function exportSessionData() {
    try {
        const response = await fetch('/analysis/export');
        const data = await response.json();
        
        if (response.ok) {
            downloadJSON(data, 'rollquest_session.json');
        } else {
            alert(data.error || 'Export failed');
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export data');
    }
}

function exportAsCSV() {
    fetch('/analysis/export')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            // Convert history to CSV
            const headers = ['Round', 'Bet Face', 'Bet Amount', 'Result', 'Won', 'Balance'];
            let csv = headers.join(',') + '\n';
            
            data.history.forEach(entry => {
                csv += `${entry.round},${entry.bet_face},${entry.bet_amount},${entry.result},${entry.won},${entry.balance}\n`;
            });
            
            downloadCSV(csv, 'rollquest_history.csv');
        })
        .catch(error => {
            console.error('CSV export error:', error);
            alert('Failed to export CSV');
        });
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
