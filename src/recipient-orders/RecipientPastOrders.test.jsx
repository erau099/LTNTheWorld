import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecipientPastOrders from './RecipientPastOrders';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'Taylor' },
    logout: vi.fn(),
  }),
}));

vi.mock('../ReviewModal.jsx', () => ({
  default: ({ foodId, onClose, onSubmit }) => (
    <div data-testid="review-modal">
      <span>Review Modal for {foodId}</span>
      <button onClick={() => onSubmit({ foodId, rating: 5, comment: 'Great food!' })}>
        Confirm Submit
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  ),
}));

const mockOrders = [
  {
    id: 1,
    food: 'Fresh Apples',
    donor: 'Green Orchard',
    date: '11/08/2026',
    time: '10:15 PM',
    status: 'completed',
    reviewed: false,
    reviewEligible: true,
  },
  {
    id: 2,
    food: 'Canned Beans',
    donor: 'Community Pantry',
    date: '11/08/2026',
    time: '02:00 PM',
    status: 'claimed',
    reviewed: false,
    reviewEligible: false,
  },
  {
    id: 3,
    food: 'Sourdough Bread',
    donor: 'City Bakery',
    date: '11/07/2026',
    time: '09:00 AM',
    status: 'completed',
    reviewed: true,
    reviewRating: 5,
    reviewComment: 'Super fresh!',
  },
];

describe('RecipientPastOrders Component', () => {
  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn());

    // URL-aware mock to handle DashboardHeader (/api/users/me) and orders (/api/recipient/orders)
    vi.stubGlobal('fetch', vi.fn((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/users/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ firstName: 'Taylor', role: 'recipient' }),
        });
      }
      if (urlStr.includes('/api/recipient/orders')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockOrders,
        });
      }
      if (urlStr.includes('/api/reviews')) {
        return Promise.resolve({
          ok: true,
          text: async () => 'Review saved',
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    }));
  });

  it('renders orders and respects review button states based on status', async () => {
    render(
      <MemoryRouter>
        <RecipientPastOrders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Fresh Apples')).toBeInTheDocument();
      expect(screen.getByText('Canned Beans')).toBeInTheDocument();
      expect(screen.getByText('Sourdough Bread')).toBeInTheDocument();
    });

    const reviewButtons = screen.getAllByRole('button', { name: /^Review$/i });
    // First order (completed, reviewEligible) -> enabled
    expect(reviewButtons[0]).not.toBeDisabled();
    // Second order (claimed) -> disabled
    expect(reviewButtons[1]).toBeDisabled();

    // Third order (reviewed) -> shows view review button
    expect(screen.getByRole('button', { name: /5\/5 View/i })).toBeInTheDocument();
  });

  it('opens ReviewModal and submits POST /api/reviews', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RecipientPastOrders />
      </MemoryRouter>
    );

    // Wait for orders to load, then select the enabled Review button
    const reviewButtons = await screen.findAllByRole('button', { name: /^Review$/i });
    const activeReviewBtn = reviewButtons.find((btn) => !btn.disabled);
    await user.click(activeReviewBtn);

    // Modal appears
    expect(screen.getByTestId('review-modal')).toBeInTheDocument();

    // Submit review
    await user.click(screen.getByRole('button', { name: /Confirm Submit/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reviews',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ foodId: 1, rating: 5, comment: 'Great food!' }),
        })
      );
      expect(window.alert).toHaveBeenCalledWith('Review submitted successfully!');
    });
  });
});