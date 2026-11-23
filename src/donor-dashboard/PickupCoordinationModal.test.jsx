import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PickupCoordinationModal from './PickupCoordinationModal';

describe('PickupCoordinationModal Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  const claimedFood = {
    id: 42,
    foodItem: 'Fresh Pasta',
    description: 'Homemade tagliatelle',
    status: 'CLAIMED',
    address: '123 Main St',
    pickupTime: '2026-11-10T15:00:00',
    pickupEndTime: '2026-11-10T16:00:00',
    tags: 'Italian, Fresh',
  };

  it('renders details and action buttons for CLAIMED status', () => {
    render(
      <PickupCoordinationModal
        food={claimedFood}
        onClose={vi.fn()}
        onStatusUpdated={vi.fn()}
      />
    );

    expect(screen.getByText('Fresh Pasta')).toBeInTheDocument();
    expect(screen.getByText('Homemade tagliatelle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Pickup Schedule/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decline Request/i })).toBeInTheDocument();
  });

  it('calls confirm-pickup endpoint when donor confirms', async () => {
    const user = userEvent.setup();
    const mockOnStatusUpdated = vi.fn();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...claimedFood, status: 'SCHEDULED' }),
    });

    render(
      <PickupCoordinationModal
        food={claimedFood}
        onClose={vi.fn()}
        onStatusUpdated={mockOnStatusUpdated}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirm Pickup Schedule/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/food/42/confirm-pickup',
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(mockOnStatusUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'SCHEDULED' })
      );
    });
  });

  it('calls decline-request endpoint when donor declines', async () => {
    const user = userEvent.setup();
    const mockOnStatusUpdated = vi.fn();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...claimedFood, status: 'ACTIVE' }),
    });

    render(
      <PickupCoordinationModal
        food={claimedFood}
        onClose={vi.fn()}
        onStatusUpdated={mockOnStatusUpdated}
      />
    );

    const declineBtn = screen.getByRole('button', { name: /Decline Request/i });
    await user.click(declineBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orders/food/42/decline-request',
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(mockOnStatusUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE' })
      );
    });
  });

  it('renders complete button when status is SCHEDULED', () => {
    const scheduledFood = { ...claimedFood, status: 'SCHEDULED' };
    render(
      <PickupCoordinationModal
        food={scheduledFood}
        onClose={vi.fn()}
        onStatusUpdated={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Mark Pickup as Completed/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Confirm Pickup Schedule/i })).not.toBeInTheDocument();
  });

  it('calls DELETE /api/food/{id} when donor removes an unclaimed ACTIVE listing', async () => {
    const user = userEvent.setup();
    const mockOnDeleted = vi.fn();
    const mockOnClose = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    global.fetch.mockResolvedValueOnce({ ok: true });

    render(
      <PickupCoordinationModal
        food={{ ...claimedFood, status: 'ACTIVE' }}
        onClose={mockOnClose}
        onStatusUpdated={vi.fn()}
        onListingDeleted={mockOnDeleted}
      />
    );

    await user.click(screen.getByRole('button', { name: /Remove Listing/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/food/42',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' })
      );
      expect(mockOnDeleted).toHaveBeenCalledWith(42);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});