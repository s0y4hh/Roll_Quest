"""
Monte Carlo Simulation Engine for RollQuest
"""

import numpy as np
from typing import List, Dict, Optional
from app.models.dice import Dice
from app.config import Config


class MonteCarloSimulation:
    """
    Monte Carlo simulation engine for dice game analysis.
    
    Supports various betting strategies and provides comprehensive
    statistical analysis of outcomes.
    """
    
    def __init__(
        self,
        num_trials: int = 10000,
        starting_balance: float = 1000,
        bet_amount: float = 10,
        bet_strategy: str = 'fixed',
        probabilities: Optional[List[float]] = None,
        target_face: Optional[int] = None
    ):
        """
        Initialize Monte Carlo simulation.
        
        Args:
            num_trials: Number of rounds to simulate
            starting_balance: Initial player balance
            bet_amount: Base bet amount
            bet_strategy: 'fixed', 'martingale', 'kelly', or 'anti_martingale'
            probabilities: Custom dice probabilities (None = fair)
            target_face: Face to always bet on (None = random)
        """
        self.num_trials = num_trials
        self.starting_balance = starting_balance
        self.base_bet = bet_amount
        self.bet_strategy = bet_strategy
        self.dice = Dice(probabilities)
        self.target_face = target_face
        self.payout = Config.PAYOUT_MULTIPLIER
    
    def _get_bet_amount(self, current_balance: float, last_won: bool, current_bet: float) -> float:
        """
        Calculate bet amount based on strategy.
        
        Args:
            current_balance: Current player balance
            last_won: Whether the last bet won
            current_bet: Current bet amount
            
        Returns:
            New bet amount
        """
        if self.bet_strategy == 'fixed':
            return min(self.base_bet, current_balance)
        
        elif self.bet_strategy == 'martingale':
            # Double bet after loss, reset after win
            if last_won:
                new_bet = self.base_bet
            else:
                new_bet = current_bet * 2
            return min(new_bet, current_balance)
        
        elif self.bet_strategy == 'anti_martingale':
            # Double bet after win, reset after loss
            if last_won:
                new_bet = current_bet * 2
            else:
                new_bet = self.base_bet
            return min(new_bet, current_balance)
        
        elif self.bet_strategy == 'kelly':
            # Kelly Criterion: f = (bp - q) / b
            # b = payout - 1, p = win prob, q = loss prob
            win_prob = 1/6 if self.dice.mode == 'fair' else self.dice.probabilities[0]
            b = self.payout - 1
            p = win_prob
            q = 1 - p
            kelly_fraction = max(0, (b * p - q) / b)
            return min(current_balance * kelly_fraction, current_balance)
        
        return min(self.base_bet, current_balance)
    
    def _choose_bet_face(self) -> int:
        """Choose which face to bet on."""
        if self.target_face is not None:
            return self.target_face
        return np.random.randint(1, 7)
    
    def run(self) -> Dict:
        """
        Run the Monte Carlo simulation.
        
        Returns:
            Dictionary with simulation results and statistics
        """
        balance = self.starting_balance
        current_bet = self.base_bet
        last_won = False
        
        # Track results
        balances = [balance]
        wins = 0
        losses = 0
        results = []
        face_counts = {i: 0 for i in range(1, 7)}
        max_balance = balance
        min_balance = balance
        bankruptcies = 0
        
        for trial in range(self.num_trials):
            if balance <= 0:
                bankruptcies = 1
                break
            
            # Determine bet
            bet = self._get_bet_amount(balance, last_won, current_bet)
            if bet <= 0:
                break
            
            bet_face = self._choose_bet_face()
            
            # Roll dice
            result = self.dice.roll()
            face_counts[result] += 1
            results.append(result)
            
            # Determine outcome
            won = result == bet_face
            if won:
                balance += bet * (self.payout - 1)
                wins += 1
                last_won = True
            else:
                balance -= bet
                losses += 1
                last_won = False
            
            current_bet = bet
            balances.append(balance)
            max_balance = max(max_balance, balance)
            min_balance = min(min_balance, balance)
        
        # Calculate statistics
        total_rounds = wins + losses
        win_rate = (wins / total_rounds * 100) if total_rounds > 0 else 0
        profit = balance - self.starting_balance
        
        # Theoretical calculations
        if self.target_face:
            theoretical_win_prob = self.dice.get_probability(self.target_face)
        else:
            theoretical_win_prob = 1/6
        
        expected_value_per_bet = (theoretical_win_prob * self.payout - 1) * self.base_bet
        house_edge = (1 - theoretical_win_prob * self.payout) * 100
        
        # Sample balance trajectory (downsample for large simulations)
        if len(balances) > 1000:
            step = len(balances) // 1000
            sampled_balances = balances[::step]
        else:
            sampled_balances = balances
        
        return {
            'summary': {
                'total_rounds': total_rounds,
                'wins': wins,
                'losses': losses,
                'win_rate': round(win_rate, 2),
                'final_balance': round(balance, 2),
                'profit': round(profit, 2),
                'profit_percentage': round((profit / self.starting_balance) * 100, 2),
                'max_balance': round(max_balance, 2),
                'min_balance': round(min_balance, 2),
                'went_bankrupt': balance <= 0
            },
            'theoretical': {
                'expected_win_prob': round(theoretical_win_prob * 100, 2),
                'expected_value_per_bet': round(expected_value_per_bet, 4),
                'house_edge': round(house_edge, 2),
                'dice_expected_value': round(self.dice.expected_value(), 4),
                'dice_variance': round(self.dice.variance(), 4)
            },
            'face_distribution': face_counts,
            'balance_trajectory': sampled_balances,
            'parameters': {
                'num_trials': self.num_trials,
                'starting_balance': self.starting_balance,
                'bet_amount': self.base_bet,
                'bet_strategy': self.bet_strategy,
                'game_mode': self.dice.mode,
                'probabilities': self.dice.probabilities
            }
        }
    
    def convergence_analysis(self, checkpoints: int = 50) -> Dict:
        """
        Analyze how empirical probability converges to theoretical.
        
        Args:
            checkpoints: Number of data points to collect
            
        Returns:
            Dictionary with convergence data
        """
        target = self.target_face or 1
        theoretical_prob = self.dice.get_probability(target)
        
        # Roll dice many times
        results = self.dice.roll_multiple(self.num_trials)
        
        # Calculate running empirical probability
        step = max(1, self.num_trials // checkpoints)
        trials_points = []
        empirical_probs = []
        
        hits = 0
        for i, result in enumerate(results):
            if result == target:
                hits += 1
            
            if (i + 1) % step == 0 or i == len(results) - 1:
                trials_points.append(i + 1)
                empirical_probs.append(hits / (i + 1) * 100)
        
        # Calculate confidence intervals
        confidence_intervals = []
        for i, n in enumerate(trials_points):
            p = empirical_probs[i] / 100
            if n > 0:
                se = np.sqrt(p * (1 - p) / n)
                ci_low = max(0, (p - 1.96 * se) * 100)
                ci_high = min(100, (p + 1.96 * se) * 100)
                confidence_intervals.append([ci_low, ci_high])
            else:
                confidence_intervals.append([0, 100])
        
        return {
            'target_face': target,
            'theoretical_probability': round(theoretical_prob * 100, 4),
            'trials': trials_points,
            'empirical_probabilities': [round(p, 4) for p in empirical_probs],
            'confidence_intervals': confidence_intervals,
            'final_empirical': round(empirical_probs[-1], 4) if empirical_probs else 0,
            'convergence_error': round(abs(empirical_probs[-1] - theoretical_prob * 100), 4) if empirical_probs else 0
        }
    
    def batch_simulation(self, num_simulations: int = 100) -> Dict:
        """
        Run multiple simulations for distribution analysis.
        
        Args:
            num_simulations: Number of separate simulations to run
            
        Returns:
            Dictionary with batch results
        """
        final_balances = []
        profits = []
        bankruptcies = 0
        win_rates = []
        
        for _ in range(num_simulations):
            result = self.run()
            final_balances.append(result['summary']['final_balance'])
            profits.append(result['summary']['profit'])
            win_rates.append(result['summary']['win_rate'])
            if result['summary']['went_bankrupt']:
                bankruptcies += 1
        
        # Calculate statistics
        mean_profit = np.mean(profits)
        std_profit = np.std(profits)
        median_profit = np.median(profits)
        
        # Value at Risk (5th percentile)
        var_5 = np.percentile(profits, 5)
        
        # Profit distribution histogram
        hist, bin_edges = np.histogram(profits, bins=20)
        
        return {
            'num_simulations': num_simulations,
            'trials_per_simulation': self.num_trials,
            'statistics': {
                'mean_final_balance': round(float(np.mean(final_balances)), 2),
                'std_final_balance': round(float(np.std(final_balances)), 2),
                'mean_profit': round(float(mean_profit), 2),
                'std_profit': round(float(std_profit), 2),
                'median_profit': round(float(median_profit), 2),
                'mean_win_rate': round(float(np.mean(win_rates)), 2),
                'ruin_probability': round((bankruptcies / num_simulations) * 100, 2),
                'value_at_risk_5': round(float(var_5), 2)
            },
            'distribution': {
                'profits': [round(p, 2) for p in profits],
                'final_balances': [round(b, 2) for b in final_balances],
                'histogram': {
                    'counts': hist.tolist(),
                    'bins': [round(b, 2) for b in bin_edges.tolist()]
                }
            }
        }
