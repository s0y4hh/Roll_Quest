"""
Dice model with fair and tweaked probability modes
"""

import numpy as np
from typing import List, Optional


class Dice:
    """
    A six-sided dice with configurable probability distribution.
    
    Fair Mode: Each face has equal probability (1/6 ≈ 16.67%)
    Tweaked Mode: Custom probability distribution (must sum to 1)
    """
    
    FACES = [1, 2, 3, 4, 5, 6]
    
    def __init__(self, probabilities: Optional[List[float]] = None):
        """
        Initialize dice with given probabilities.
        
        Args:
            probabilities: List of 6 probabilities for faces 1-6.
                          If None, uses fair distribution (1/6 each).
        """
        if probabilities is None:
            # Fair dice - equal probability for each face
            self.probabilities = [1/6] * 6
            self.mode = 'fair'
        else:
            # Tweaked dice - custom probabilities
            if len(probabilities) != 6:
                raise ValueError("Probabilities must have exactly 6 values")
            
            # Normalize probabilities to sum to 1
            total = sum(probabilities)
            if total <= 0:
                raise ValueError("Probabilities must sum to a positive value")
            
            self.probabilities = [p / total for p in probabilities]
            self.mode = 'tweaked'
    
    def roll(self) -> int:
        """
        Roll the dice and return the result (1-6).
        
        Returns:
            int: The face that came up (1-6)
        """
        return int(np.random.choice(self.FACES, p=self.probabilities))
    
    def roll_multiple(self, n: int) -> List[int]:
        """
        Roll the dice n times.
        
        Args:
            n: Number of rolls
            
        Returns:
            List of results
        """
        return list(np.random.choice(self.FACES, size=n, p=self.probabilities))
    
    def expected_value(self) -> float:
        """
        Calculate the expected value E[X] of the dice.
        
        Returns:
            float: Expected value
        """
        return sum(face * prob for face, prob in zip(self.FACES, self.probabilities))
    
    def variance(self) -> float:
        """
        Calculate the variance Var(X) of the dice.
        
        Returns:
            float: Variance
        """
        ev = self.expected_value()
        return sum(prob * (face - ev) ** 2 for face, prob in zip(self.FACES, self.probabilities))
    
    def std_dev(self) -> float:
        """
        Calculate the standard deviation σ of the dice.
        
        Returns:
            float: Standard deviation
        """
        return np.sqrt(self.variance())
    
    def get_probability(self, face: int) -> float:
        """
        Get the probability of rolling a specific face.
        
        Args:
            face: Face value (1-6)
            
        Returns:
            float: Probability of that face
        """
        if face < 1 or face > 6:
            raise ValueError("Face must be between 1 and 6")
        return self.probabilities[face - 1]
    
    def probability_info(self) -> dict:
        """
        Get full probability information for the dice.
        
        Returns:
            dict: Probability information including mode, probabilities, and statistics
        """
        return {
            'mode': self.mode,
            'probabilities': {face: prob for face, prob in zip(self.FACES, self.probabilities)},
            'expected_value': self.expected_value(),
            'variance': self.variance(),
            'std_dev': self.std_dev()
        }
    
    @staticmethod
    def adjust_probability(current_probs: List[float], face_index: int, new_prob: float) -> List[float]:
        """
        Adjust the probability of one face and redistribute the remaining probability.
        
        Args:
            current_probs: Current probability list (6 values)
            face_index: Index of face to adjust (0-5)
            new_prob: New probability for that face (0-1)
            
        Returns:
            List of adjusted probabilities that sum to 1
        """
        if face_index < 0 or face_index > 5:
            raise ValueError("Face index must be between 0 and 5")
        
        new_prob = max(0, min(1, new_prob))  # Clamp between 0 and 1
        
        # Calculate remaining probability to distribute
        remaining = 1 - new_prob
        
        # Get current total of other faces
        other_total = sum(p for i, p in enumerate(current_probs) if i != face_index)
        
        # Create new probability list
        new_probs = []
        for i, p in enumerate(current_probs):
            if i == face_index:
                new_probs.append(new_prob)
            elif other_total > 0:
                # Proportionally distribute remaining probability
                new_probs.append((p / other_total) * remaining)
            else:
                # If all other probs were 0, distribute equally
                new_probs.append(remaining / 5)
        
        return new_probs


def create_fair_dice() -> Dice:
    """Create a fair dice with equal probabilities."""
    return Dice()


def create_tweaked_dice(probabilities: List[float]) -> Dice:
    """Create a tweaked dice with custom probabilities."""
    return Dice(probabilities)
