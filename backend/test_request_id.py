"""
Tests for request ID functionality
"""
import pytest
from app import create_app
from models import db
import uuid


@pytest.fixture
def client():
    """Create a test client"""
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_request_id_in_response_header(client):
    """Test that request ID is included in response headers"""
    response = client.get('/api/workouts')
    
    # Should have X-Request-ID in response headers
    assert 'X-Request-ID' in response.headers
    
    # Should be a valid UUID
    request_id = response.headers['X-Request-ID']
    try:
        uuid.UUID(request_id)
    except ValueError:
        pytest.fail(f"Request ID '{request_id}' is not a valid UUID")


def test_custom_request_id_is_preserved(client):
    """Test that a custom request ID from client is preserved"""
    custom_id = str(uuid.uuid4())
    
    response = client.get('/api/workouts', headers={
        'X-Request-ID': custom_id
    })
    
    # Should echo back the same request ID
    assert response.headers['X-Request-ID'] == custom_id


def test_request_id_works_for_post_requests(client):
    """Test that request ID works for POST requests"""
    response = client.post('/api/login', json={
        'username': 'testuser',
        'password': 'testpass'
    })
    
    # Should have X-Request-ID even for failed auth
    assert 'X-Request-ID' in response.headers
    
    # Should be a valid UUID
    request_id = response.headers['X-Request-ID']
    try:
        uuid.UUID(request_id)
    except ValueError:
        pytest.fail(f"Request ID '{request_id}' is not a valid UUID")


def test_request_id_different_per_request(client):
    """Test that each request gets a different ID"""
    response1 = client.get('/api/workouts')
    response2 = client.get('/api/workouts')
    
    id1 = response1.headers['X-Request-ID']
    id2 = response2.headers['X-Request-ID']
    
    # IDs should be different
    assert id1 != id2
