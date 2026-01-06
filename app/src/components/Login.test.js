import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

// Mock the apiCall function
jest.mock('../config/api', () => ({
  apiCall: jest.fn(),
  API_ENDPOINTS: {
    LOGIN: 'http://localhost:5000/api/auth/login',
  },
}));

import { apiCall } from '../config/api';

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form', () => {
    render(<Login onLoginSuccess={jest.fn()} />);
    
    expect(screen.getByText('Workout Planner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('shows info about single-user app', () => {
    render(<Login onLoginSuccess={jest.fn()} />);
    
    expect(screen.getByText(/Don't have an account yet?/i)).toBeInTheDocument();
    expect(screen.getByText(/single-user app/i)).toBeInTheDocument();
  });

  test('submits login with username and password', async () => {
    const mockOnLoginSuccess = jest.fn();
    apiCall.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test-token',
        user: { id: 1, username: 'joe' },
      }),
    });

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'joe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'joe', password: 'password123' }),
        })
      );
    });
  });

  test('stores token in localStorage on successful login', async () => {
    const mockOnLoginSuccess = jest.fn();
    apiCall.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test-token',
        user: { id: 1, username: 'joe' },
      }),
    });

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'joe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe('test-token');
    });
  });

  test('calls onLoginSuccess callback on successful login', async () => {
    const mockOnLoginSuccess = jest.fn();
    apiCall.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test-token',
        user: { id: 1, username: 'joe' },
      }),
    });

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'joe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith({ id: 1, username: 'joe' });
    });
  });

  test('displays error message on login failure', async () => {
    const mockOnLoginSuccess = jest.fn();
    apiCall.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'joe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('disables submit button while loading', async () => {
    const mockOnLoginSuccess = jest.fn();
    apiCall.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({ token: 'test-token', user: { username: 'joe' } }),
        });
      }, 100))
    );

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'joe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /please wait/i })).toBeInTheDocument();
  });

  test('requires username field', () => {
    render(<Login onLoginSuccess={jest.fn()} />);

    const usernameInput = screen.getByLabelText('Username');
    expect(usernameInput).toBeRequired();
  });

  test('requires password field', () => {
    render(<Login onLoginSuccess={jest.fn()} />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toBeRequired();
  });

  test('displays connection error when server is unavailable', async () => {
    const mockOnLoginSuccess = jest.fn();
    apiCall.mockRejectedValueOnce(new Error('Network error'));

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'joe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to connect to the server/i)).toBeInTheDocument();
    });
  });
});
