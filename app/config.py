"""
Configuration settings for RollQuest
"""

import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'rollquest-secret-key-2024')
    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = False
    
    DEFAULT_BALANCE = 1000
    MIN_BET = 1
    MAX_BET = 10000
    MAX_FUNDS_ADD = 100000
    PAYOUT_MULTIPLIER = 6
    
    MAX_SIMULATION_TRIALS = 1000000
    DEFAULT_SIMULATION_TRIALS = 10000


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
