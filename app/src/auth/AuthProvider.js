import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import authService from '../services/authService';
import logger from '../utils/logger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const doVerify = async () => {
      const token = authService.getToken();
      if (!token) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const user = await authService.verify(5000);
        if (!mounted) return;
        setIsAuthenticated(true);
        setCurrentUser(user);
      } catch (err) {
        if (err && err.name === 'AbortError') {
          logger.warn('Auth verify timed out after 5000ms');
        } else {
          logger.error('Error verifying token in AuthProvider:', err);
        }
        authService.clearToken();
        if (!mounted) return;
        setIsAuthenticated(false);
        setCurrentUser(null);
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    doVerify();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    setError(null);
    const user = await authService.login(username, password);
    setIsAuthenticated(true);
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback for tests or components rendered without provider: expose minimal sync behavior
    const token = localStorage.getItem('auth_token');
    return {
      isAuthenticated: Boolean(token),
      currentUser: null,
      loading: false,
      error: null,
      login: async () => { throw new Error('useAuth used outside AuthProvider'); },
      logout: () => { localStorage.removeItem('auth_token'); },
    };
  }
  return ctx;
}

export default AuthProvider;
