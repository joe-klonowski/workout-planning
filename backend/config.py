"""
Configuration for Flask application
"""
import os
from pathlib import Path

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'workout_planner.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS settings
    CORS_HEADERS = 'Content-Type'
    
    # CalDAV settings (read from credentials file or environment variables)
    @staticmethod
    def get_caldav_credentials():
        """
        Get CalDAV credentials from file or environment variables
        Priority: environment variables > credentials file
        """
        # Check environment variables first
        url = os.environ.get('CALDAV_URL')
        username = os.environ.get('CALDAV_USERNAME')
        password = os.environ.get('CALDAV_PASSWORD')
        calendar_name = os.environ.get('CALDAV_CALENDAR_NAME')
        
        if url and username and password:
            return {
                'url': url,
                'username': username,
                'password': password,
                'calendar_name': calendar_name
            }
        
        # Try to read from credentials file
        credentials_path = Path.home() / '.config' / 'workout-planner' / 'caldav-credentials-apple.env'
        if credentials_path.exists():
            try:
                with open(credentials_path) as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            if '=' in line:
                                key, value = line.split('=', 1)
                                if key == 'CALDAV_URL':
                                    url = value
                                elif key == 'CALDAV_USERNAME':
                                    username = value
                                elif key == 'CALDAV_PASSWORD':
                                    password = value
                                elif key == 'CALDAV_CALENDAR_NAME':
                                    calendar_name = value
            except Exception as e:
                print(f"Warning: Could not read CalDAV credentials file: {e}")
        
        return {
            'url': url,
            'username': username,
            'password': password,
            'calendar_name': calendar_name
        }


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


class TestConfig(Config):
    """Test configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    DEBUG = True


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestConfig,
    'default': DevelopmentConfig
}
