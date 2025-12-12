"""
Home page routes
"""

from flask import Blueprint, render_template

home_bp = Blueprint('home', __name__)


@home_bp.route('/')
def index():
    """Render the home/landing page"""
    return render_template('home.html')
