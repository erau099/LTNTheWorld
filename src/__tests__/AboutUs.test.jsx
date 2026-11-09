import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from '../AboutUs';
import * as AuthModule from '../context/AuthContext';

describe('AboutUs component', () => {
  it('renders guest navigation when no user is logged in', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: null,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByText('Love Thy Neighbor')).toBeInTheDocument();
    expect(screen.getByText('Our Story')).toBeInTheDocument();
    expect(screen.getByText('Our Goal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders user greeting and logout button when logged in', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: { name: 'Sarah' },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByText('Hi, Sarah')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});