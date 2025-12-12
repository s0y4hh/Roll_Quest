"""
RollQuest Flask Application Factory
"""

from flask import Flask, send_from_directory
from flask_session import Session
import os

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'rollquest-secret-key-2024')
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = False
    
    # Initialize extensions
    Session(app)
    
    # SEO routes - serve robots.txt and sitemap.xml from root
    @app.route('/robots.txt')
    def robots():
        return send_from_directory(app.static_folder, 'robots.txt')
    
    @app.route('/sitemap.xml')
    def sitemap():
        return send_from_directory(app.static_folder, 'sitemap.xml', mimetype='application/xml')
    
    # Register blueprints
    from app.routes.home import home_bp
    from app.routes.game import game_bp
    from app.routes.simulation import simulation_bp
    from app.routes.analysis import analysis_bp
    from app.routes.about import about_bp
    
    app.register_blueprint(home_bp)
    app.register_blueprint(game_bp, url_prefix='/game')
    app.register_blueprint(simulation_bp, url_prefix='/simulation')
    app.register_blueprint(analysis_bp, url_prefix='/analysis')
    app.register_blueprint(about_bp, url_prefix='/about')
    
    return app
