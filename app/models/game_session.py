"""
Game session model for player state management
"""

from typing import List, Dict, Optional
from app.config import Config


class GameSession:
    """
    Manages the state of a player's game session.
    
    Tracks balance, profit/loss, game history, and statistics.
    """
    
    def __init__(
        self,
        player_name: str = "Player",
        initial_balance: float = None
    ):
        """
        Initialize a new game session.
        
        Args:
            player_name: Name of the player
            initial_balance: Starting balance (defaults to Config.DEFAULT_BALANCE)
        """
        self.player_name = player_name
        self.initial_balance = initial_balance or Config.DEFAULT_BALANCE
        self.balance = self.initial_balance
        self.profit = 0.0
        self.total_rounds = 0
        self.wins = 0
        self.losses = 0
        self.history: List[Dict] = []
        self.face_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
        self.current_streak = 0
        self.max_win_streak = 0
        self.max_lose_streak = 0
    
    @property
    def win_rate(self) -> float:
        """Calculate current win rate as percentage."""
        if self.total_rounds == 0:
            return 0.0
        return round((self.wins / self.total_rounds) * 100, 2)
    
    def add_history(self, entry: Dict):
        """
        Add a game round to history.
        
        Args:
            entry: Dictionary with round information
        """
        self.history.append(entry)
        
        # Update face counts
        result = entry.get('result', 0)
        if result in self.face_counts:
            self.face_counts[result] += 1
        
        # Update streak tracking
        if entry.get('won', False):
            if self.current_streak > 0:
                self.current_streak += 1
            else:
                self.current_streak = 1
            self.max_win_streak = max(self.max_win_streak, self.current_streak)
        else:
            if self.current_streak < 0:
                self.current_streak -= 1
            else:
                self.current_streak = -1
            self.max_lose_streak = max(self.max_lose_streak, abs(self.current_streak))
        
        # Keep only last 100 entries to prevent memory issues
        if len(self.history) > 100:
            self.history = self.history[-100:]
    
    def reset(self):
        """Reset the game session to initial state."""
        self.balance = self.initial_balance
        self.profit = 0.0
        self.total_rounds = 0
        self.wins = 0
        self.losses = 0
        self.history = []
        self.face_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
        self.current_streak = 0
        self.max_win_streak = 0
        self.max_lose_streak = 0
    
    def to_dict(self) -> Dict:
        """
        Convert session to dictionary for storage.
        
        Returns:
            Dictionary representation of session
        """
        return {
            'player_name': self.player_name,
            'initial_balance': self.initial_balance,
            'balance': self.balance,
            'profit': self.profit,
            'total_rounds': self.total_rounds,
            'wins': self.wins,
            'losses': self.losses,
            'history': self.history,
            'face_counts': self.face_counts,
            'current_streak': self.current_streak,
            'max_win_streak': self.max_win_streak,
            'max_lose_streak': self.max_lose_streak
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'GameSession':
        """
        Create session from dictionary.
        
        Args:
            data: Dictionary with session data
            
        Returns:
            GameSession instance
        """
        session = cls(
            player_name=data.get('player_name', 'Player'),
            initial_balance=data.get('initial_balance', Config.DEFAULT_BALANCE)
        )
        session.balance = data.get('balance', session.initial_balance)
        session.profit = data.get('profit', 0.0)
        session.total_rounds = data.get('total_rounds', 0)
        session.wins = data.get('wins', 0)
        session.losses = data.get('losses', 0)
        session.history = data.get('history', [])
        session.face_counts = data.get('face_counts', {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0})
        session.current_streak = data.get('current_streak', 0)
        session.max_win_streak = data.get('max_win_streak', 0)
        session.max_lose_streak = data.get('max_lose_streak', 0)
        return session
    
    def get_statistics(self) -> Dict:
        """
        Get comprehensive statistics for the session.
        
        Returns:
            Dictionary with various statistics
        """
        return {
            'player_name': self.player_name,
            'balance': self.balance,
            'initial_balance': self.initial_balance,
            'profit': self.profit,
            'profit_percentage': round((self.profit / self.initial_balance) * 100, 2) if self.initial_balance > 0 else 0,
            'total_rounds': self.total_rounds,
            'wins': self.wins,
            'losses': self.losses,
            'win_rate': self.win_rate,
            'face_distribution': self.face_counts,
            'current_streak': self.current_streak,
            'max_win_streak': self.max_win_streak,
            'max_lose_streak': self.max_lose_streak
        }
