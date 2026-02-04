"""
Configuration for Flask application
"""
import os
from pathlib import Path

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Access token lifetime in hours (default: 30 days)
    ACCESS_TOKEN_LIFETIME_HOURS = int(os.environ.get('ACCESS_TOKEN_LIFETIME_HOURS', '720'))
    
    # Database configuration with SSL support for PostgreSQL
    database_url = os.environ.get('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        # Railway uses postgres:// but SQLAlchemy needs postgresql://
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    # Add SSL mode for PostgreSQL connections (required by Railway)
    if database_url and database_url.startswith('postgresql://'):
        # Add sslmode=require if not already present
        if '?' not in database_url:
            database_url += '?sslmode=require'
        elif 'sslmode=' not in database_url:
            database_url += '&sslmode=require'
    
    SQLALCHEMY_DATABASE_URI = database_url or \
        'sqlite:///' + os.path.join(basedir, 'workout_planner.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Additional SQLAlchemy engine options for PostgreSQL SSL
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,  # Verify connections before using them
        'pool_recycle': 300,     # Recycle connections after 5 minutes
    }
    
    # CORS settings
    CORS_HEADERS = 'Content-Type'
    
    # CalDAV settings (read from credentials file or environment variables)
    @staticmethod
    def get_caldav_credentials():
        """
        Get CalDAV credentials from file or environment variables
        Priority: environment variables > credentials file
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Check environment variables first
        url = os.environ.get('CALDAV_URL')
        username = os.environ.get('CALDAV_USERNAME')
        password = os.environ.get('CALDAV_PASSWORD')
        calendar_name = os.environ.get('CALDAV_CALENDAR_NAME')
        
        logger.info(f"Reading CalDAV credentials - URL: {'set' if url else 'not set'}, "
                   f"Username: {'set' if username else 'not set'}, "
                   f"Password: {'set' if password else 'not set'}, "
                   f"Calendar Name: {calendar_name if calendar_name else 'not set'}")
        
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

# Explicit exports for type checkers / static analysis
__all__ = ['Config', 'DevelopmentConfig', 'ProductionConfig', 'TestConfig', 'config']
