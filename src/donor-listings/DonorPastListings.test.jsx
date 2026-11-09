import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DonorPastListings from './DonorPastListings';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'Jane' },
    logout: vi.fn(),
  }),
}));

// Mock apiFetch helper
vi.mock('../api', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../api';

const mockListings = [
  {
    id: 1,
    foodItem: 'Artisan Sourdough',
    recipientName: 'Alice',
    date: '2026-11-08',
    pickupTime: '2026-11-08T18:00:00',
    status: 'COMPLETED',
    reviewRating: 5,
    reviewComment: 'Delicious bread!',
  },
  {
    id: 2,
    foodItem: 'Fresh Apples',
    recipientName: null,
    date: '2026-11-09',
    pickupTime: '2026-11-09T14:00:00',
    status: 'ACTIVE',
  },
];

describe('DonorPastListings Component', () => {
  beforeEach(() => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => mockListings,
    });
  });

  it('renders listings loaded from the API', async () => {
    render(
      <MemoryRouter>
        <DonorPastListings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Artisan Sourdough')).toBeInTheDocument();
      expect(screen.getByText('Fresh Apples')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Unclaimed')).toBeInTheDocument();
    });
  });

  it('filters listings when a filter pill is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DonorPastListings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Artisan Sourdough')).toBeInTheDocument();
    });

    // Click "Completed" filter
    const completedFilterBtn = screen.getByRole('button', { name: /^Completed$/i });
    await user.click(completedFilterBtn);

    // Completed item stays, active item disappears
    expect(screen.getByText('Artisan Sourdough')).toBeInTheDocument();
    expect(screen.queryByText('Fresh Apples')).not.toBeInTheDocument();
  });
});