"""
Authentication utilities for JWT token generation and validation
"""
import jwt
import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app


def generate_token(user_id, expires_in_hours=24):
    """
    Generate a JWT token for a user
    
    Args:
        user_id: The user ID to encode in the token
        expires_in_hours: Token expiration time in hours (default: 24 hours)
    
    Returns:
        JWT token string
    """
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=expires_in_hours),
        'iat': datetime.now(timezone.utc)
    }
    
    secret_key = current_app.config.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    return jwt.encode(payload, secret_key, algorithm='HS256')


def verify_token(token):
    """
    Verify a JWT token and extract the user_id
    
    Args:
        token: JWT token string
    
    Returns:
        Tuple of (success: bool, user_id: int or None, error: str or None)
    """
    try:
        secret_key = current_app.config.get('SECRET_KEY', 'dev-secret-key-change-in-production')
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return True, payload.get('user_id'), None
    except jwt.ExpiredSignatureError:
        return False, None, 'Token has expired'
    except jwt.InvalidTokenError as e:
        return False, None, f'Invalid token: {str(e)}'
    except Exception as e:
        return False, None, f'Token verification failed: {str(e)}'


def token_required(f):
    """
    Decorator to require a valid JWT token for a route
    
    Usage:
        @app.route('/protected')
        @token_required
        def protected_route():
            # current_user_id is available in the route function
            pass
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # "Bearer <token>"
            except IndexError:
                return jsonify({'error': 'Invalid authorization header format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        success, user_id, error = verify_token(token)
        if not success:
            return jsonify({'error': error or 'Token verification failed'}), 401
        
        # Store user_id in kwargs so the route function can access it
        kwargs['current_user_id'] = user_id
        
        return f(*args, **kwargs)
    
    return decorated
