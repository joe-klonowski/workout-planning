import authService from './authService';
import { apiCall } from '../config/api';

jest.mock('../config/api', () => ({ apiCall: jest.fn(), API_ENDPOINTS: { LOGIN: 'http://localhost/api/auth/login', VERIFY: 'http://localhost/api/auth/verify' } }));

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('login stores token and returns user', async () => {
    apiCall.mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'abc', user: { id: 1, username: 'joe' } }) });

    const user = await authService.login('joe', 'pass');

    expect(user).toEqual({ id: 1, username: 'joe' });
    expect(localStorage.getItem('auth_token')).toBe('abc');
  });

  test('logout clears token', () => {
    localStorage.setItem('auth_token', 'abc');
    authService.logout();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  test('verify returns user on OK', async () => {
    apiCall.mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 2, username: 'anna' } }) });
    const user = await authService.verify(1000);
    expect(user).toEqual({ id: 2, username: 'anna' });
  });

  test('verify throws on non-ok', async () => {
    apiCall.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(authService.verify(1000)).rejects.toBeDefined();
  });
});
