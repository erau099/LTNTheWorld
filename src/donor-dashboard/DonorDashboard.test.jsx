import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DonorDashboard from './DonorDashboard';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'Sarah', name: 'Sarah Donor' },
    logout: vi.fn(),
  }),
}));

// Mock apiFetch helper
vi.mock('../api', () => ({
  apiFetch: vi.fn(),
}));

// Mock subcomponents
vi.mock('./DonorNotificationBell', () => ({
  default: () => <div data-testid="notification-bell">Bell</div>,
}));

vi.mock('./PickupCoordinationModal', () => ({
  default: ({ food, onClose }) => (
    <div data-testid="pickup-modal">
      <span>Modal for {food?.foodItem}</span>
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { apiFetch } from '../api';

const mockFoodListings = [
  {
    id: 101,
    foodItem: 'Box of Bagels',
    date: '2026-11-10',
    pickupTime: '2026-11-10T09:00:00',
    pickupEndTime: '2026-11-10T11:00:00',
    status: 'ACTIVE',
    tags: 'Bakery',
  },
  {
    id: 102,
    foodItem: 'Vegetable Soup',
    date: '2026-11-10',
    pickupTime: '2026-11-10T12:00:00',
    pickupEndTime: '2026-11-10T14:00:00',
    status: 'CLAIMED',
    tags: 'Hot Food',
  },
];

describe('DonorDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => mockFoodListings,
    });

    global.fetch = vi.fn((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/users/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ firstName: 'Sarah', role: 'donor' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it('renders listings and user greeting from DashboardHeader', async () => {
    render(
      <MemoryRouter>
        <DonorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Hello, Sarah/i)).toBeInTheDocument();
      expect(screen.getByText('Box of Bagels')).toBeInTheDocument();
      expect(screen.getByText('Vegetable Soup')).toBeInTheDocument();
    });
  });

  it('filters listings by status button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DonorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Box of Bagels')).toBeInTheDocument();
    });

    // Click "Claimed" filter
    const claimedFilter = screen.getByRole('button', { name: /^Claimed$/i });
    await user.click(claimedFilter);

    expect(screen.getByText('Vegetable Soup')).toBeInTheDocument();
    expect(screen.queryByText('Box of Bagels')).not.toBeInTheDocument();
  });

  it('opens PickupCoordinationModal when a card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DonorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Box of Bagels')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Box of Bagels'));

    expect(screen.getByTestId('pickup-modal')).toBeInTheDocument();
    expect(screen.getByText('Modal for Box of Bagels')).toBeInTheDocument();
  });

  it('navigates to /UploadFoodDetails when the add button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DonorDashboard />
      </MemoryRouter>
    );

    const addBtn = screen.getByTitle('Add new listing');
    await user.click(addBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/UploadFoodDetails');
  });
});