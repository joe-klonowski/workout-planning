import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import authService from '../services/authService';
import { AuthProvider } from '../auth/AuthProvider';

// Mock the authService
jest.mock('../services/authService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  getToken: jest.fn(),
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form', () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
    
    expect(screen.getByText('Workout Planner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('shows info about single-user app', () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
    
    expect(screen.getByText(/Don't have an account yet?/i)).toBeInTheDocument();
    expect(screen.getByText(/single-user app/i)).toBeInTheDocument();
  });

  test('submits login with username and password', async () => {
    authService.login.mockResolvedValueOnce({ id: 1, username: 'joe' });

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'joe' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('joe', 'password123');
    });
  });

  test('shows success message on successful login', async () => {
    authService.login.mockImplementationOnce(() => {
      // mimic authService setting token
      localStorage.setItem('auth_token', 'test-token');
      return Promise.resolve({ id: 1, username: 'joe' });
    });

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'joe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Login successful!')).toBeInTheDocument();
      expect(localStorage.getItem('auth_token')).toBe('test-token');
    });
  });

  test('calls authService.login and updates UI', async () => {
    authService.login.mockResolvedValueOnce({ id: 1, username: 'joe' });

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'joe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('joe', 'password123');
    });
  });

  test('displays error message on login failure', async () => {
    authService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'joe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('disables submit button while loading', async () => {
    authService.login.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ id: 1, username: 'joe' }), 100)));

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'joe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /please wait/i })).toBeInTheDocument();
  });

  test('requires username field', () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const usernameInput = screen.getByLabelText('Username');
    expect(usernameInput).toBeRequired();
  });

  test('requires password field', () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toBeRequired();
  });

  test('displays connection error when server is unavailable', async () => {
    authService.login.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'joe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
