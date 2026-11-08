-- Sprint 9 Seed Script: Placeholder Listings for Distance & Proximity Testing
-- Centered around Sacramento State (6000 J St: 38.5601, -121.4243)
-- Distances span: ~0.2 mi, ~2.1 mi, ~4.3 mi, ~6.8 mi, ~14.2 mi, ~18.5 mi, ~21.4 mi, ~76 mi

DO $$
DECLARE
    donor_uuid UUID;
BEGIN
    SELECT id INTO donor_uuid FROM logins LIMIT 1;

    IF donor_uuid IS NULL THEN
        RAISE NOTICE 'No user found in logins table. Please create/register a user first.';
    ELSE
        INSERT INTO food (user_id, "foodItem", description, tags, allergens, address, latitude, longitude, date, pickup_time, pickup_end_time, status, created_at)
        VALUES
        -- ~0.2 miles from CSUS center (Within 5 miles)
        (donor_uuid, 'Fresh Box Lunches (CSUS Campus)', 'Healthy deli box lunches and fruit from campus event', 'Fresh / Hot', 'Wheat', '6000 J St, Sacramento, CA 95819', 38.5595, -121.4230, CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 2 hours', 'ACTIVE', CURRENT_TIMESTAMP),

        -- ~2.1 miles from CSUS (Within 5 miles)
        (donor_uuid, 'Artisan Sourdough Loaves (McKinley Park)', 'Fresh baked organic sourdough loaves', 'Fresh / Hot', 'Wheat', '601 Alhambra Blvd, Sacramento, CA 95816', 38.5772, -121.4645, CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 3 hours', 'ACTIVE', CURRENT_TIMESTAMP),

        -- ~4.3 miles from CSUS (Within 5 miles)
        (donor_uuid, 'Assorted Gourmet Bagels (Downtown / DOCO)', 'Assorted fresh bagels with cream cheese spreads', 'Fresh / Hot', 'Wheat, Milk', '500 David J Stern Walk, Sacramento, CA 95814', 38.5802, -121.4997, CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 2 hours', 'ACTIVE', CURRENT_TIMESTAMP),

        -- ~6.8 miles from CSUS (Within 10 miles)
        (donor_uuid, 'Canned Soups & Legumes (Arden)', 'Canned lentil soup, black beans, and chickpeas', 'Canned', '', '2405 Butano Dr, Sacramento, CA 95821', 38.6042, -121.3653, CURRENT_DATE + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days 4 hours', 'ACTIVE', CURRENT_TIMESTAMP),

        -- ~14.2 miles from CSUS (Within 25 miles)
        (donor_uuid, 'Farm Fresh Produce Crate (Elk Grove)', 'Fresh greens, zucchini, carrots, and crisp apples', 'Fresh / Hot', '', '8450 Laguna Blvd, Elk Grove, CA 95758', 38.4235, -121.4225, CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 2 hours', 'ACTIVE', CURRENT_TIMESTAMP),

        -- ~18.5 miles from CSUS (Within 25 miles)
        (donor_uuid, 'Fruit & Pastries (UC Davis)', 'Croissants, apples, oranges, and bananas', 'Fresh / Hot', 'Wheat, Eggs', '1 Shields Ave, Davis, CA 95616', 38.5419, -121.7486, CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 3 hours', 'ACTIVE', CURRENT_TIMESTAMP),

        -- ~21.4 miles from CSUS (Within 25 miles)
        (donor_uuid, 'Canned Vegetables & Tuna (Roseville)', 'Canned sweet corn, green beans, and wild tuna cans', 'Canned', 'Fish', '1151 Galleria Blvd, Roseville, CA 95678', 38.7708, -121.2687, CURRENT_DATE + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days 3 hours', 'ACTIVE', CURRENT_TIMESTAMP),

        -- ~76 miles from CSUS (Excluded when 25-mile filter applied)
        (donor_uuid, 'Artisan Cheeses (San Francisco)', 'Specialty cheeses and artisanal crackers', 'Fresh / Hot', 'Milk, Wheat', '1 Ferry Building, San Francisco, CA 94111', 37.7955, -122.3937, CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 2 hours', 'ACTIVE', CURRENT_TIMESTAMP);

        RAISE NOTICE 'Successfully seeded 8 placeholder food listings with geographic coordinates!';
    END IF;
END $$;
