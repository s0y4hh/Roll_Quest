# RollQuest

A Stochastic Dice Game Simulation for **CSEC 413 - Modeling and Simulation**

## Overview

RollQuest is an interactive web-based simulation that demonstrates fundamental concepts in probability theory, stochastic processes, and statistical analysis through a simple dice betting game.

## Features

- **Interactive Dice Game** - Real-time betting with animated dice rolls
- **Fair & Tweaked Modes** - Compare uniform vs. custom probability distributions
- **Monte Carlo Simulation** - Run thousands of trials to analyze outcomes
- **Statistical Analysis** - Chi-square tests, convergence analysis, and more
- **Multiple Betting Strategies** - Fixed, Martingale, Anti-Martingale, Kelly Criterion
- **Data Export** - Export results as JSON or CSV for further analysis

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. Clone or download this repository:
```bash
cd RollQuest
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python run.py
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
RollQuest/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py            # Configuration settings
│   ├── routes/              # Route blueprints
│   │   ├── home.py          # Home page
│   │   ├── game.py          # Dice game
│   │   ├── simulation.py    # Monte Carlo simulation
│   │   ├── analysis.py      # Results & analysis
│   │   └── about.py         # About page
│   ├── models/              # Data models
│   │   ├── dice.py          # Dice mechanics
│   │   └── game_session.py  # Player session
│   ├── services/            # Business logic
│   │   ├── monte_carlo.py   # MC simulation engine
│   │   └── statistics.py    # Statistical analysis
│   ├── static/              # Static assets
│   │   ├── css/             # Stylesheets
│   │   └── js/              # JavaScript files
│   └── templates/           # HTML templates
├── requirements.txt         # Python dependencies
├── run.py                   # Application entry point
└── README.md
```

## Usage Guide

### Play Game
1. Navigate to "Play Game" from the navigation menu
2. Choose game mode (Fair or Tweaked)
3. Select a dice face to bet on
4. Enter your bet amount
5. Click "ROLL" to play!

### Monte Carlo Simulation
1. Go to "Simulation" page
2. Configure parameters (trials, balance, strategy)
3. Run single simulation, batch simulation, or convergence analysis
4. Analyze the generated charts and statistics

### Results & Analysis
1. Visit "Analysis" page to review your game session
2. View face distribution and balance progression
3. Run Chi-square tests to check for dice fairness
4. Compare Fair vs Tweaked game outcomes
5. Export your data for external analysis

## Academic Concepts

This project demonstrates:

- **Stochastic Processes** - Random variables and their sequences
- **Law of Large Numbers** - Convergence of empirical to theoretical probability
- **Central Limit Theorem** - Distribution of sample means
- **Monte Carlo Methods** - Random sampling for numerical estimation
- **Gambler's Ruin Problem** - Probability of bankruptcy
- **Statistical Hypothesis Testing** - Chi-square goodness-of-fit

## Technologies

- **Backend**: Python, Flask
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Visualization**: Plotly.js
- **Scientific Computing**: NumPy, SciPy, Pandas

## Team

**CSEC 413 - Modeling and Simulation**  
Bachelor of Science in Computer Science 4A

- ASIADO
- VALLE
- MEDIADO

## License

This project is for educational purposes as part of CSEC 413 coursework.
