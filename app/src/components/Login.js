import React, { useState } from 'react';
import { apiCall } from '../config/api';
import '../styles/Login.css';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'An error occurred');
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);
      
      setSuccessMessage('Login successful!');

      // Call the callback to notify parent component
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 500);

    } catch (err) {
      setError('Failed to connect to the server');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Workout Planner</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Login</h2>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </form>

        <div className="login-info">
          <p>Don't have an account yet?</p>
          <p className="info-text">
            This is a single-user app. The administrator needs to create your account using the command-line setup script.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
