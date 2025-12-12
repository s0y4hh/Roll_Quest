"""
Dice game routes
"""

from flask import Blueprint, render_template, request, jsonify, session
from app.models.dice import Dice
from app.models.game_session import GameSession
from app.config import Config

game_bp = Blueprint('game', __name__)


def get_game_session():
    """Get or create game session from flask session"""
    if 'game_data' not in session:
        session['game_data'] = GameSession().to_dict()
    return GameSession.from_dict(session['game_data'])


def save_game_session(game_session):
    """Save game session to flask session"""
    session['game_data'] = game_session.to_dict()
    session.modified = True


@game_bp.route('/')
def game():
    """Render the dice game page"""
    game_session = get_game_session()
    return render_template('game.html', game=game_session)


@game_bp.route('/roll', methods=['POST'])
def roll():
    """Handle dice roll"""
    data = request.get_json()
    bet_face = data.get('bet_face', 1)
    bet_amount = data.get('bet_amount', 10)
    probabilities = data.get('probabilities', None)
    
    game_session = get_game_session()
    
    if bet_amount < Config.MIN_BET or bet_amount > Config.MAX_BET:
        return jsonify({'error': f'Bet must be between ${Config.MIN_BET} and ${Config.MAX_BET}'}), 400
    
    if bet_amount > game_session.balance:
        return jsonify({'error': 'Insufficient balance'}), 400
    
    if bet_face < 1 or bet_face > 6:
        return jsonify({'error': 'Invalid bet face'}), 400
    
    dice = Dice(probabilities)
    result = dice.roll()
    won = result == bet_face
    if won:
        winnings = bet_amount * Config.PAYOUT_MULTIPLIER
        game_session.balance += winnings - bet_amount
        game_session.profit += winnings - bet_amount
        game_session.wins += 1
    else:
        game_session.balance -= bet_amount
        game_session.profit -= bet_amount
        game_session.losses += 1
    
    game_session.total_rounds += 1
    
    game_session.add_history({
        'round': game_session.total_rounds,
        'bet_face': bet_face,
        'bet_amount': bet_amount,
        'result': result,
        'won': won,
        'balance': game_session.balance
    })
    
    save_game_session(game_session)
    
    return jsonify({
        'result': result,
        'won': won,
        'balance': game_session.balance,
        'profit': game_session.profit,
        'total_rounds': game_session.total_rounds,
        'wins': game_session.wins,
        'losses': game_session.losses,
        'win_rate': game_session.win_rate
    })


@game_bp.route('/add-funds', methods=['POST'])
def add_funds():
    """Add funds to player balance"""
    data = request.get_json()
    amount = data.get('amount', 0)
    
    if amount <= 0 or amount > Config.MAX_FUNDS_ADD:
        return jsonify({'error': f'Amount must be between $1 and ${Config.MAX_FUNDS_ADD}'}), 400
    
    game_session = get_game_session()
    game_session.balance += amount
    save_game_session(game_session)
    
    return jsonify({
        'balance': game_session.balance,
        'message': f'Added ${amount} to balance'
    })


@game_bp.route('/set-player', methods=['POST'])
def set_player():
    """Set player name"""
    data = request.get_json()
    name = data.get('name', 'Player')
    
    game_session = get_game_session()
    game_session.player_name = name[:20]
    save_game_session(game_session)
    
    return jsonify({
        'player_name': game_session.player_name
    })


@game_bp.route('/reset', methods=['POST'])
def reset():
    """Reset game session"""
    session['game_data'] = GameSession().to_dict()
    session.modified = True
    
    return jsonify({
        'message': 'Game reset successfully',
        'balance': Config.DEFAULT_BALANCE
    })


@game_bp.route('/stats')
def stats():
    """Get current game statistics"""
    game_session = get_game_session()
    return jsonify({
        'balance': game_session.balance,
        'profit': game_session.profit,
        'total_rounds': game_session.total_rounds,
        'wins': game_session.wins,
        'losses': game_session.losses,
        'win_rate': game_session.win_rate,
        'history': game_session.history[-10:]
    })
