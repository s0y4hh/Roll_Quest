"""
Statistical analysis services for RollQuest
"""

import numpy as np
from scipy import stats
from typing import List, Dict, Optional


class StatisticalAnalyzer:
    """
    Provides statistical analysis for game session data.
    """
    
    def __init__(self, history: List[Dict]):
        """
        Initialize analyzer with game history.
        
        Args:
            history: List of game round dictionaries
        """
        self.history = history
    
    def face_distribution(self) -> Dict:
        """
        Calculate the distribution of dice faces from history.
        
        Returns:
            Dictionary with face counts and percentages
        """
        if not self.history:
            return {
                'counts': {i: 0 for i in range(1, 7)},
                'percentages': {i: 0 for i in range(1, 7)},
                'expected_percentage': 16.67
            }
        
        counts = {i: 0 for i in range(1, 7)}
        for entry in self.history:
            result = entry.get('result', 0)
            if result in counts:
                counts[result] += 1
        
        total = sum(counts.values())
        percentages = {
            face: round((count / total) * 100, 2) if total > 0 else 0
            for face, count in counts.items()
        }
        
        return {
            'counts': counts,
            'percentages': percentages,
            'total_rolls': total,
            'expected_percentage': 16.67
        }
    
    def profit_over_time(self) -> Dict:
        """
        Calculate profit progression over rounds.
        
        Returns:
            Dictionary with rounds and cumulative profit
        """
        if not self.history:
            return {'rounds': [], 'profits': [], 'balances': []}
        
        rounds = []
        balances = []
        
        for entry in self.history:
            rounds.append(entry.get('round', len(rounds) + 1))
            balances.append(entry.get('balance', 0))
        
        return {
            'rounds': rounds,
            'balances': balances
        }
    
    def streak_analysis(self) -> Dict:
        """
        Analyze win/loss streaks in history.
        
        Returns:
            Dictionary with streak statistics
        """
        if not self.history:
            return {
                'current_streak': 0,
                'max_win_streak': 0,
                'max_lose_streak': 0,
                'streaks': []
            }
        
        streaks = []
        current_streak = 0
        max_win = 0
        max_lose = 0
        
        for entry in self.history:
            won = entry.get('won', False)
            
            if won:
                if current_streak > 0:
                    current_streak += 1
                else:
                    if current_streak != 0:
                        streaks.append(current_streak)
                    current_streak = 1
                max_win = max(max_win, current_streak)
            else:
                if current_streak < 0:
                    current_streak -= 1
                else:
                    if current_streak != 0:
                        streaks.append(current_streak)
                    current_streak = -1
                max_lose = max(max_lose, abs(current_streak))
        
        if current_streak != 0:
            streaks.append(current_streak)
        
        return {
            'current_streak': current_streak,
            'max_win_streak': max_win,
            'max_lose_streak': max_lose,
            'streak_history': streaks[-20:]  # Last 20 streaks
        }
    
    def bet_analysis(self) -> Dict:
        """
        Analyze betting patterns and outcomes.
        
        Returns:
            Dictionary with bet statistics
        """
        if not self.history:
            return {
                'total_wagered': 0,
                'total_won': 0,
                'total_lost': 0,
                'avg_bet': 0,
                'bet_face_performance': {}
            }
        
        total_wagered = 0
        total_won = 0
        face_bets = {i: {'count': 0, 'wins': 0} for i in range(1, 7)}
        
        for entry in self.history:
            bet_amount = entry.get('bet_amount', 0)
            bet_face = entry.get('bet_face', 1)
            won = entry.get('won', False)
            
            total_wagered += bet_amount
            if won:
                total_won += bet_amount * 6  # Payout
            
            if bet_face in face_bets:
                face_bets[bet_face]['count'] += 1
                if won:
                    face_bets[bet_face]['wins'] += 1
        
        # Calculate win rate per face bet
        face_performance = {}
        for face, data in face_bets.items():
            if data['count'] > 0:
                face_performance[face] = {
                    'times_bet': data['count'],
                    'wins': data['wins'],
                    'win_rate': round((data['wins'] / data['count']) * 100, 2)
                }
        
        return {
            'total_wagered': total_wagered,
            'total_won': total_won,
            'total_lost': total_wagered - total_won,
            'avg_bet': round(total_wagered / len(self.history), 2) if self.history else 0,
            'bet_face_performance': face_performance
        }
    
    def chi_square_test(
        self,
        observed: List[int],
        expected_probs: Optional[List[float]] = None
    ) -> Dict:
        """
        Perform chi-square goodness of fit test.
        
        Tests if observed dice frequencies match expected distribution.
        
        Args:
            observed: Observed frequency counts for faces 1-6
            expected_probs: Expected probability for each face (None = uniform)
            
        Returns:
            Dictionary with test results
        """
        if len(observed) != 6:
            return {'error': 'Observed must have 6 values'}
        
        total = sum(observed)
        if total == 0:
            return {'error': 'No observations'}
        
        # Calculate expected frequencies
        if expected_probs is None:
            expected = [total / 6] * 6
        else:
            expected = [total * p for p in expected_probs]
        
        # Perform chi-square test
        chi2, p_value = stats.chisquare(observed, expected)
        
        # Degrees of freedom = 6 - 1 = 5
        critical_value = stats.chi2.ppf(0.95, 5)
        
        # Interpretation
        is_fair = p_value > 0.05
        
        return {
            'chi_square_statistic': round(float(chi2), 4),
            'p_value': round(float(p_value), 6),
            'degrees_of_freedom': 5,
            'critical_value_95': round(float(critical_value), 4),
            'is_fair_at_95_confidence': is_fair,
            'interpretation': (
                'The dice appears to be FAIR (cannot reject null hypothesis).'
                if is_fair else
                'The dice appears to be BIASED (reject null hypothesis at 95% confidence).'
            ),
            'observed': observed,
            'expected': [round(e, 2) for e in expected]
        }
    
    def z_test_proportion(
        self,
        observed_wins: int,
        total_trials: int,
        expected_prob: float = 1/6
    ) -> Dict:
        """
        Perform z-test for win rate proportion.
        
        Tests if observed win rate is significantly different from expected.
        
        Args:
            observed_wins: Number of wins
            total_trials: Total number of trials
            expected_prob: Expected win probability
            
        Returns:
            Dictionary with test results
        """
        if total_trials == 0:
            return {'error': 'No trials'}
        
        observed_prob = observed_wins / total_trials
        
        # Standard error
        se = np.sqrt(expected_prob * (1 - expected_prob) / total_trials)
        
        # Z-score
        z = (observed_prob - expected_prob) / se if se > 0 else 0
        
        # Two-tailed p-value
        p_value = 2 * (1 - stats.norm.cdf(abs(z)))
        
        # 95% confidence interval for observed proportion
        ci_low = max(0, observed_prob - 1.96 * np.sqrt(observed_prob * (1 - observed_prob) / total_trials))
        ci_high = min(1, observed_prob + 1.96 * np.sqrt(observed_prob * (1 - observed_prob) / total_trials))
        
        is_significant = p_value < 0.05
        
        return {
            'observed_wins': observed_wins,
            'total_trials': total_trials,
            'observed_proportion': round(observed_prob, 4),
            'expected_proportion': round(expected_prob, 4),
            'z_score': round(float(z), 4),
            'p_value': round(float(p_value), 6),
            'confidence_interval_95': [round(ci_low, 4), round(ci_high, 4)],
            'is_significant_at_95': is_significant,
            'interpretation': (
                'The observed win rate is SIGNIFICANTLY DIFFERENT from expected.'
                if is_significant else
                'The observed win rate is NOT significantly different from expected.'
            )
        }
    
    def compare_modes(
        self,
        fair_results: Dict,
        tweaked_results: Dict
    ) -> Dict:
        """
        Compare results between Fair and Tweaked game modes.
        
        Args:
            fair_results: Results from fair game simulation
            tweaked_results: Results from tweaked game simulation
            
        Returns:
            Dictionary with comparison statistics
        """
        comparison = {
            'metrics': [],
            'conclusion': ''
        }
        
        metrics = [
            ('Win Rate (%)', 'win_rate'),
            ('Final Balance ($)', 'final_balance'),
            ('Profit ($)', 'profit'),
            ('Max Balance ($)', 'max_balance')
        ]
        
        fair_better = 0
        tweaked_better = 0
        
        for label, key in metrics:
            fair_val = fair_results.get('summary', {}).get(key, 0)
            tweaked_val = tweaked_results.get('summary', {}).get(key, 0)
            diff = fair_val - tweaked_val
            
            comparison['metrics'].append({
                'metric': label,
                'fair': round(fair_val, 2),
                'tweaked': round(tweaked_val, 2),
                'difference': round(diff, 2),
                'better': 'Fair' if diff > 0 else 'Tweaked' if diff < 0 else 'Equal'
            })
            
            if diff > 0:
                fair_better += 1
            elif diff < 0:
                tweaked_better += 1
        
        if fair_better > tweaked_better:
            comparison['conclusion'] = 'Fair game mode performed better overall.'
        elif tweaked_better > fair_better:
            comparison['conclusion'] = 'Tweaked game mode performed better overall.'
        else:
            comparison['conclusion'] = 'Both modes performed similarly.'
        
        return comparison
