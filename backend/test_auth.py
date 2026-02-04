"""
Tests for authentication endpoints
"""
import pytest
import json
import jwt
from app import create_app
from models import db, User


@pytest.fixture
def app():
    """Create app for testing"""
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def user_with_token(client):
    """Create a user and return username and token"""
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        user = User(username='joe')
        user.set_password('securepassword')
        db.session.add(user)
        db.session.commit()
        
        # Generate token
        from auth import generate_token
        token = generate_token(user.id)
        
        return {
            'username': 'joe',
            'password': 'securepassword',
            'user_id': user.id,
            'token': token
        }


class TestAuthRegister:
    """Tests for registration endpoint (should be disabled)"""
    
    def test_register_disabled(self, client):
        """Test that registration endpoint is disabled"""
        response = client.post('/api/auth/register', json={
            'username': 'joe',
            'password': 'securepassword'
        })
        
        assert response.status_code == 403
        data = json.loads(response.data)
        assert 'disabled' in data['error'].lower()


class TestAuthLogin:
    """Tests for user login"""
    
    @pytest.fixture
    def registered_user(self, app):
        """Create a user in the database"""
        with app.app_context():
            user = User(username='joe')
            user.set_password('securepassword')
            db.session.add(user)
            db.session.commit()
    
    def test_login_success(self, client, registered_user):
        """Test successful login"""
        response = client.post('/api/auth/login', json={
            'username': 'joe',
            'password': 'securepassword'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Login successful'
        assert 'token' in data
        assert data['user']['username'] == 'joe'
    
    def test_login_missing_username(self, client):
        """Test login with missing username"""
        response = client.post('/api/auth/login', json={
            'password': 'securepassword'
        })
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_login_missing_password(self, client):
        """Test login with missing password"""
        response = client.post('/api/auth/login', json={
            'username': 'joe'
        })
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_login_invalid_username(self, client):
        """Test login with invalid username"""
        response = client.post('/api/auth/login', json={
            'username': 'nonexistent',
            'password': 'securepassword'
        })
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'Invalid username or password' in data['error']
    
    def test_login_invalid_password(self, client, registered_user):
        """Test login with invalid password"""
        response = client.post('/api/auth/login', json={
            'username': 'joe',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'Invalid username or password' in data['error']


class TestAuthVerify:
    """Tests for token verification"""
    
    @pytest.fixture
    def valid_token(self, app):
        """Create a user and get a valid token"""
        with app.app_context():
            from auth import generate_token
            user = User(username='joe')
            user.set_password('securepassword')
            db.session.add(user)
            db.session.commit()
            
            token = generate_token(user.id)
            return token
    
    def test_verify_valid_token(self, client, valid_token):
        """Test verifying a valid token"""
        response = client.get(
            '/api/auth/verify',
            headers={'Authorization': f'Bearer {valid_token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['valid'] is True
        assert data['user']['username'] == 'joe'
    
    def test_verify_missing_token(self, client):
        """Test verification with missing token"""
        response = client.get('/api/auth/verify')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'Token is missing' in data['error']
    
    def test_verify_invalid_token(self, client):
        """Test verification with invalid token"""
        response = client.get(
            '/api/auth/verify',
            headers={'Authorization': 'Bearer invalidtoken'}
        )
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_verify_invalid_auth_header(self, client):
        """Test verification with malformed auth header"""
        response = client.get(
            '/api/auth/verify',
            headers={'Authorization': 'InvalidToken'}
        )
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data


class TestGetCurrentUser:
    """Tests for getting current user"""
    
    @pytest.fixture
    def valid_token(self, app):
        """Create a user and get a valid token"""
        with app.app_context():
            from auth import generate_token
            user = User(username='joe')
            user.set_password('securepassword')
            db.session.add(user)
            db.session.commit()
            
            token = generate_token(user.id)
            return token
    
    def test_get_current_user_success(self, client, valid_token):
        """Test getting current user info"""
        response = client.get(
            '/api/auth/me',
            headers={'Authorization': f'Bearer {valid_token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['username'] == 'joe'
        assert 'createdAt' in data
    
    def test_get_current_user_missing_token(self, client):
        """Test getting current user without token"""
        response = client.get('/api/auth/me')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'Token is missing' in data['error']
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        response = client.get(
            '/api/auth/me',
            headers={'Authorization': 'Bearer invalidtoken'}
        )
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data


def test_default_token_lifetime_uses_config(app):
    """Default token lifetime should use ACCESS_TOKEN_LIFETIME_HOURS from config"""
    with app.app_context():
        from auth import generate_token
        user = User(username='joe')
        user.set_password('securepassword')
        db.session.add(user)
        db.session.commit()

        token = generate_token(user.id)
        secret_key = app.config.get('SECRET_KEY', 'dev-secret-key-change-in-production')
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])

        exp = payload.get('exp')
        iat = payload.get('iat')
        assert exp is not None and iat is not None

        delta = int(exp) - int(iat)
        expected_hours = int(app.config.get('ACCESS_TOKEN_LIFETIME_HOURS', 720))
        expected_seconds = expected_hours * 3600
        # allow a small clock drift (5 seconds)
        assert abs(delta - expected_seconds) <= 5

