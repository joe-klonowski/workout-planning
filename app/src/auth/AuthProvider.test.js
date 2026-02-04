import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthProvider';
import authService from '../services/authService';

jest.mock('../services/authService', () => ({
  getToken: jest.fn(),
  setToken: jest.fn(),
  clearToken: jest.fn(),
  verify: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

function TestConsumer() {
  const { isAuthenticated, currentUser, loading } = useAuth();
  return (
    <div>
      <div data-testid="auth-loading">{String(loading)}</div>
      <div data-testid="auth-authenticated">{String(isAuthenticated)}</div>
      <div data-testid="auth-user">{currentUser ? currentUser.username : ''}</div>
    </div>
  );
}

describe('AuthProvider', () => {
  test('renders not authenticated when no token', async () => {
    authService.getToken.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('false');
      expect(screen.getByTestId('auth-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('auth-user').textContent).toBe('');
    });
  });

  test('verifies token on mount and sets user', async () => {
    localStorage.setItem('auth_token', 'abc');
    authService.getToken.mockReturnValue('abc');
    authService.verify.mockResolvedValueOnce({ id: 5, username: 'bob' });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').textContent).toBe('false');
      expect(screen.getByTestId('auth-authenticated').textContent).toBe('true');
      expect(screen.getByTestId('auth-user').textContent).toBe('bob');
    });
  });

  test('clears token on verify failure', async () => {
    localStorage.setItem('auth_token', 'abc');
    authService.getToken.mockReturnValue('abc');
    authService.verify.mockRejectedValueOnce(new Error('Fail'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authService.clearToken).toHaveBeenCalled();
      expect(screen.getByTestId('auth-authenticated').textContent).toBe('false');
    });
  });
});
