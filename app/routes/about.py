"""
About page routes
"""

from flask import Blueprint, render_template

about_bp = Blueprint('about', __name__)


@about_bp.route('/')
def about():
    """Render the about page"""
    return render_template('about.html')
