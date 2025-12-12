"""
Monte Carlo simulation routes
"""

from flask import Blueprint, render_template, request, jsonify
from app.services.monte_carlo import MonteCarloSimulation
from app.config import Config

simulation_bp = Blueprint('simulation', __name__)


@simulation_bp.route('/')
def simulation():
    """Render the Monte Carlo simulation page"""
    return render_template('simulation.html')


@simulation_bp.route('/run', methods=['POST'])
def run_simulation():
    """Run Monte Carlo simulation"""
    data = request.get_json()
    
    num_trials = min(data.get('num_trials', 10000), Config.MAX_SIMULATION_TRIALS)
    starting_balance = data.get('starting_balance', 1000)
    bet_amount = data.get('bet_amount', 10)
    bet_strategy = data.get('bet_strategy', 'fixed')
    game_mode = data.get('game_mode', 'fair')
    probabilities = data.get('probabilities', None)
    target_face = data.get('target_face', None)
    
    if num_trials < 100:
        return jsonify({'error': 'Minimum 100 trials required'}), 400
    
    if starting_balance < 10:
        return jsonify({'error': 'Starting balance must be at least $10'}), 400
    
    if bet_amount < 1:
        return jsonify({'error': 'Bet amount must be at least $1'}), 400
    
    mc = MonteCarloSimulation(
        num_trials=num_trials,
        starting_balance=starting_balance,
        bet_amount=bet_amount,
        bet_strategy=bet_strategy,
        probabilities=probabilities if game_mode == 'tweaked' else None,
        target_face=target_face
    )
    
    results = mc.run()
    
    return jsonify(results)


@simulation_bp.route('/convergence', methods=['POST'])
def convergence_analysis():
    """Run convergence analysis - shows how empirical probability approaches theoretical"""
    data = request.get_json()
    
    max_trials = min(data.get('max_trials', 10000), 100000)
    game_mode = data.get('game_mode', 'fair')
    probabilities = data.get('probabilities', None)
    target_face = data.get('target_face', 1)
    
    mc = MonteCarloSimulation(
        num_trials=max_trials,
        starting_balance=10000,
        bet_amount=10,
        probabilities=probabilities if game_mode == 'tweaked' else None,
        target_face=target_face
    )
    
    convergence_data = mc.convergence_analysis(checkpoints=50)
    
    return jsonify(convergence_data)


@simulation_bp.route('/batch', methods=['POST'])
def batch_simulation():
    """Run multiple simulations for ruin probability and distribution analysis"""
    data = request.get_json()
    
    num_simulations = min(data.get('num_simulations', 100), 1000)
    trials_per_sim = min(data.get('trials_per_sim', 1000), 10000)
    starting_balance = data.get('starting_balance', 1000)
    bet_amount = data.get('bet_amount', 10)
    bet_strategy = data.get('bet_strategy', 'fixed')
    game_mode = data.get('game_mode', 'fair')
    probabilities = data.get('probabilities', None)
    
    mc = MonteCarloSimulation(
        num_trials=trials_per_sim,
        starting_balance=starting_balance,
        bet_amount=bet_amount,
        bet_strategy=bet_strategy,
        probabilities=probabilities if game_mode == 'tweaked' else None
    )
    
    batch_results = mc.batch_simulation(num_simulations)
    
    return jsonify(batch_results)
