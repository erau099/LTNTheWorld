import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DonorProfile from './DonorProfile';

// Mock subcomponents
vi.mock('./donor-dashboard/DonorNotificationBell', () => ({
  default: () => <div>Bell</div>,
}));

vi.mock('./donor-dashboard/PickupCoordinationModal', () => ({
  default: () => <div>Modal</div>,
}));

vi.mock('./Waivers/WaiverText.jsx', () => ({
  default: () => <div>Waiver Text Content</div>,
}));

describe('DonorProfile Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('alert', vi.fn());
  });

  it('loads user profile and address on initial render', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          firstName: 'Robert',
          lastName: 'Paulson',
          email: 'robert@example.com',
          dateOfBirth: '1990-05-15',
          phoneNumber: '555-0199',
          waiver: { acceptedAt: '2026-01-10T10:00:00' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          streetAddress: '742 Evergreen Terrace',
          zipCode: '90210',
          city: 'Springfield',
          state: 'California',
          country: 'United States',
        }),
      });

    render(
      <MemoryRouter>
        <DonorProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Robert')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Paulson')).toBeInTheDocument();
      expect(screen.getByDisplayValue('742 Evergreen Terrace')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Springfield')).toBeInTheDocument();
    });
  });

  it('unlocks field for editing when clicking its pencil button', async () => {
    const user = userEvent.setup();

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ firstName: 'Robert', lastName: 'Paulson' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    render(
      <MemoryRouter>
        <DonorProfile />
      </MemoryRouter>
    );

    const firstNameInput = await screen.findByDisplayValue('Robert');
    expect(firstNameInput).toBeDisabled();

    // Click edit pencil for First Name
    const editFirstNameBtn = screen.getByRole('button', { name: /Edit firstName/i });
    await user.click(editFirstNameBtn);

    expect(firstNameInput).not.toBeDisabled();
  });

  it('submits profile PATCH and address PUT on save', async () => {
    const user = userEvent.setup();

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          firstName: 'Robert',
          lastName: 'Paulson',
          email: 'robert@example.com',
          dateOfBirth: '1990-05-15',
          phoneNumber: '555-0199',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          streetAddress: '123 Fake St',
          city: 'Sacramento',
          zipCode: '95814',
          state: 'California',
          country: 'United States',
        }),
      });

    render(
      <MemoryRouter>
        <DonorProfile />
      </MemoryRouter>
    );

    await screen.findByDisplayValue('Robert');

    // Mock save responses
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          firstName: 'Robert',
          lastName: 'Paulson',
          email: 'robert@example.com',
          dateOfBirth: '1990-05-15',
          phoneNumber: '555-0199',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/addresses/me',
        expect.objectContaining({ method: 'PUT' })
      );
      expect(window.alert).toHaveBeenCalledWith('Profile updated successfully');
    });
  });
});