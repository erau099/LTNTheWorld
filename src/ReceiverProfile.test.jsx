import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReceiverProfile from './ReceiverProfile';

vi.mock('./Waivers/WaiverText.jsx', () => ({
  default: () => <div>Waiver Text Content</div>,
}));

describe('ReceiverProfile Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('alert', vi.fn());
  });

  it('loads profile and allergies, and saves changes via PATCH', async () => {
    const user = userEvent.setup();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'alex@example.com',
        dateOfBirth: '1995-04-12',
        phoneNumber: '555-0123',
        allergies: 'Peanuts, Shellfish',
      }),
    });

    render(
      <MemoryRouter>
        <ReceiverProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alex')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Peanuts, Shellfish')).toBeInTheDocument();
    });

    // Inputs start disabled
    const allergiesInput = screen.getByPlaceholderText(/Allergies/i);
    expect(allergiesInput).toBeDisabled();

    // Toggle edit for allergies
    const editAllergiesBtn = screen.getByRole('button', { name: /Edit allergies/i });
    await user.click(editAllergiesBtn);
    expect(allergiesInput).not.toBeDisabled();

    // Update allergies text
    await user.clear(allergiesInput);
    await user.type(allergiesInput, 'Peanuts, Shellfish, Dairy');

    // Mock save response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'alex@example.com',
        dateOfBirth: '1995-04-12',
        phoneNumber: '555-0123',
        allergies: 'Peanuts, Shellfish, Dairy',
      }),
    });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Peanuts, Shellfish, Dairy'),
        })
      );
      // Ensure donor address endpoint is never touched
      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/addresses/me',
        expect.anything()
      );
      expect(window.alert).toHaveBeenCalledWith('Profile updated successfully!');
    });
  });
});