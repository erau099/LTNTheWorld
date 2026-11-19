import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './Login';

// Mock AuthContext
vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    setUser: vi.fn(),
  }),
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders email, password inputs and submit button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('displays error popup when login returns non-ok response', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/Email Address/i), 'wrong@example.com');
    await user.type(screen.getByPlaceholderText(/Password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Incorrect username or password/i)).toBeInTheDocument();
    });
  });
});