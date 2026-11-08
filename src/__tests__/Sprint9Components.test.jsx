import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UploadFoodLocation from '../food-upload/UploadFoodLocation';
import RecipientPastOrders from '../recipient-orders/RecipientPastOrders';
import * as FoodDraftModule from '../food-upload/foodDraft';

describe('Sprint 9 Frontend Components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('UploadFoodLocation (Story 326: Autocomplete & Saved Address Toggle)', () => {
        it('renders the address mode toggle buttons and privacy safeguard notice', () => {
            // Mock draft state so location view is not redirected
            vi.spyOn(FoodDraftModule, 'useFoodDraft').mockReturnValue([
                { foodItem: 'Canned Beans', description: 'Fresh beans', tags: ['Canned'], allergens: [], address: '', date: '2026-11-20', startTime: '10:00', endTime: '12:00' },
                vi.fn()
            ]);
            vi.spyOn(FoodDraftModule, 'detailsError').mockReturnValue(false);

            render(
                <MemoryRouter>
                    <UploadFoodLocation />
                </MemoryRouter>
            );

            expect(screen.getByRole('button', { name: /Use my saved profile address/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Enter a different pickup location/i })).toBeInTheDocument();
            expect(screen.getByText(/Privacy Safeguard:/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Start typing address/i)).toBeInTheDocument();
        });
    });

    describe('RecipientPastOrders (Story 108: Directions & 72-hr Review Eligibility)', () => {
        it('renders directions link for approved orders and reflects 72-hour review expiration', async () => {
            const mockOrders = [
                {
                    id: 1,
                    foodId: 1,
                    donor: 'Alice Donor',
                    date: '2026-11-06',
                    time: '14:00',
                    food: 'Apple Pie',
                    status: 'SCHEDULED',
                    address: '6000 J St, Sacramento, CA 95819',
                    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=6000+J+St',
                    reviewed: false,
                    reviewEligible: false
                },
                {
                    id: 2,
                    foodId: 2,
                    donor: 'Bob Donor',
                    date: '2026-11-01',
                    time: '12:00',
                    food: 'Bread',
                    status: 'COMPLETED',
                    address: '123 Sacramento Ave',
                    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=123+Sacramento+Ave',
                    reviewed: false,
                    reviewEligible: false,
                    reviewEligibilityMessage: 'Review window expired (72-hour limit reached)'
                }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockOrders
            });

            render(
                <MemoryRouter>
                    <RecipientPastOrders />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Alice Donor')).toBeInTheDocument();
            });

            // Check directions link
            const directionsLinks = screen.getAllByRole('link', { name: /directions/i });
            expect(directionsLinks.length).toBeGreaterThanOrEqual(1);
            expect(directionsLinks[0]).toHaveAttribute('href', expect.stringContaining('google.com/maps/dir'));

            // Check expired review button
            expect(screen.getByRole('button', { name: /Expired \(>72h\)/i })).toBeInTheDocument();
        });
    });
});
