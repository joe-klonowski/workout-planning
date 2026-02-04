import React, { useState } from 'react';
import '../styles/Login.css';
import logger from '../utils/logger';
import { useAuth } from '../auth/AuthProvider';

function Login() {
  const { login } = useAuth();

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
      logger.log('📤 Attempting login with username:', username);
      logger.log('📤 Request body: { username, password: (redacted) }');

      const user = await login(username, password);

      setSuccessMessage('Login successful!');

      // Keep a small delay for UX parity with previous behavior
      setTimeout(() => {}, 500);
    } catch (err) {
      setError(err.message || 'Failed to connect to the server');
      logger.error('Auth error:', err);
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
