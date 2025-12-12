"""
Results and Analysis routes
"""

from flask import Blueprint, render_template, request, jsonify, session
from app.services.statistics import StatisticalAnalyzer
from app.models.game_session import GameSession

analysis_bp = Blueprint('analysis', __name__)


@analysis_bp.route('/')
def analysis():
    """Render the results and analysis page"""
    return render_template('analysis.html')


@analysis_bp.route('/session-stats')
def session_stats():
    """Get statistics from current game session"""
    if 'game_data' not in session:
        return jsonify({'error': 'No game session found'}), 404
    
    game_session = GameSession.from_dict(session['game_data'])
    analyzer = StatisticalAnalyzer(game_session.history)
    
    return jsonify({
        'basic_stats': {
            'total_rounds': game_session.total_rounds,
            'wins': game_session.wins,
            'losses': game_session.losses,
            'win_rate': game_session.win_rate,
            'profit': game_session.profit,
            'balance': game_session.balance
        },
        'face_distribution': analyzer.face_distribution(),
        'profit_over_time': analyzer.profit_over_time(),
        'streak_analysis': analyzer.streak_analysis(),
        'bet_analysis': analyzer.bet_analysis()
    })


@analysis_bp.route('/chi-square', methods=['POST'])
def chi_square_test():
    """Perform chi-square goodness of fit test"""
    data = request.get_json()
    observed = data.get('observed', [])
    expected_probs = data.get('expected_probs', None)
    
    if len(observed) != 6:
        return jsonify({'error': 'Observed frequencies must have 6 values'}), 400
    
    analyzer = StatisticalAnalyzer([])
    result = analyzer.chi_square_test(observed, expected_probs)
    
    return jsonify(result)


@analysis_bp.route('/compare-modes', methods=['POST'])
def compare_modes():
    """Compare Fair vs Tweaked game results"""
    data = request.get_json()
    fair_results = data.get('fair_results', {})
    tweaked_results = data.get('tweaked_results', {})
    
    analyzer = StatisticalAnalyzer([])
    comparison = analyzer.compare_modes(fair_results, tweaked_results)
    
    return jsonify(comparison)


@analysis_bp.route('/export')
def export_data():
    """Export session data as JSON"""
    if 'game_data' not in session:
        return jsonify({'error': 'No game session found'}), 404
    
    game_session = GameSession.from_dict(session['game_data'])
    
    return jsonify({
        'player_name': game_session.player_name,
        'balance': game_session.balance,
        'initial_balance': game_session.initial_balance,
        'profit': game_session.profit,
        'total_rounds': game_session.total_rounds,
        'wins': game_session.wins,
        'losses': game_session.losses,
        'win_rate': game_session.win_rate,
        'history': game_session.history
    })
