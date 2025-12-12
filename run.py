"""
RollQuest - A Stochastic Dice Game Simulation
CSEC 413 - Modeling and Simulation
"""

from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
