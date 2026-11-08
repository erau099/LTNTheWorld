# Sprint 9 Implementation & Testing Plan

## 1. Executive Summary & Context Reflection

### Reflection on Past Notes & Architecture
- **Sprint 7**: Established the Admin portal, moderation controls, and `UserSummaryDTO` projections with comprehensive unit tests (`sprint7_execution_report.md`).
- **Sprint 8**: Established the in-app notification engine, food claim status lifecycle (`ACTIVE` -> `CLAIMED` -> `SCHEDULED` -> `COMPLETED`), and the 24-hour recipient request cooldown (`app.claims.cooldown-hours=24` via `FoodClaimService`).
- **Hosting Environment Transition**:
  - The backend is now actively configured for Heroku hosting (`ltn-backend-api-a5616004dfe6.herokuapp.com`) with Heroku PostgreSQL (`JDBC_DATABASE_URL`), dynamic port binding (`$PORT`), and `spring.jpa.hibernate.ddl-auto=update`.
  - The frontend is deployed via Vercel (`ltn-the-world.vercel.app`) with reverse-proxy rewrites routing `/api/*` requests directly to the Heroku deployment.

---

## 2. Sprint 9 Stories & Acceptance Criteria

### Story 108: Recipient Food Request & Tracking Safe Coordination
*Encompasses recipient flow tasks across claim lifecycle and progressive privacy.*
- **Sub-task 1 │ Enforce 24-hr cooldown during request (`FoodClaimService`)**: [COMPLETED in Sprint 8]
- **Sub-task 2 │ In-app notification bell on approval/decline (`RecipientNotificationBell`)**: [COMPLETED in Sprint 8]
- **Sub-task 3 │ Progressive Address Disclosure (lock street address until APPROVED)**:
  - *Backlog Gap*: Public browsing (`GET /api/food`) and unapproved claim status must only disclose approximate location / neighborhood / city. Exact street address is only disclosed to the claimant once the status transitions to `SCHEDULED` (approved) or `COMPLETED`.
- **Sub-task 4 │ Directions link / map pin on approved order card**:
  - *Backlog Gap*: On `RecipientPastOrders.jsx`, approved/scheduled orders must display the resolved address with a map pin icon and a one-click directions link (`https://www.google.com/maps/dir/?api=1&destination=...`).
- **Sub-task 5 │ Enforce 72-hour review eligibility after COMPLETED**:
  - *Backlog Gap*: In `ReviewController.java` and `RecipientPastOrders.jsx`, reviews are strictly permitted only for completed orders within 72 hours of completion. Post 72 hours, the review action is locked.

---

### Story 325: Geocoding Backend Service
*As a system, I want to convert text addresses into latitude and longitude coordinates upon saving so that listings can be queried and sorted by geographic distance.*
- **Database**: Add `latitude` (`DOUBLE PRECISION`) and `longitude` (`DOUBLE PRECISION`) columns to `food` and `addresses` tables.
- **Entities**: Update [`Food.java`](lovethyneighbor-backend/src/main/java/com/codecraft/lovethyneighbor/Food.java) and [`Address.java`](lovethyneighbor-backend/src/main/java/com/codecraft/lovethyneighbor/Address.java) with latitude and longitude properties, getters, and setters.
- **Service**: Implement `GeocodingService` utilizing OpenStreetMap Nominatim API (`https://nominatim.openstreetmap.org/search`) with custom User-Agent, timeout configuration, and non-blocking fallback handling so listing and address creation never fails if geocoding is unavailable or input is invalid.
- **Tests**: Mock external HTTP geocoding calls to verify coordinate resolution, persistence, and fallback resilience.

---

### Story 326: Address Autocomplete & Saved Profile Address Toggle
*As a donor, I want address autocomplete or the option to use my saved home/work address when creating a listing so that entering the pickup location is quick and accurate.*
- **Quick Toggle**: In [`UploadFoodLocation.jsx`](src/food-upload/UploadFoodLocation.jsx), add toggle between:
  1. *"Use my saved profile address"* (one-click autofill from `GET /api/addresses/me`).
  2. *"Enter a different pickup location"* (manual entry with autocomplete).
- **Autocomplete Suggestions**: Integrate live Sacramento-area address autocomplete dropdown using Nominatim search API with debounce.
- **Privacy Notice**: Display clear privacy safeguard informing donors that only approximate neighborhood/city is displayed publicly, and full street address is locked until claim approval.

---

### Story 327: Recipient Proximity & Distance Search
*As a recipient, I want to search for food listings within a certain distance (e.g., 5, 10, or 25 miles) of my location so that I only see food I can realistically travel to pick up.*
- **Backend API**: Add query parameters `lat`, `lng`, and `radiusMiles` to `GET /api/food` (or dedicated endpoint `/api/food/nearby`).
- **Distance Calculation**: Compute geographic distance using the Haversine formula in miles:
  $$d = 2 R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **Sorting & Filtering**: Exclude listings beyond `radiusMiles`, sort remaining listings ascending by proximity (closest first), and attach a formatted string (e.g. `"1.4 miles away"`).
- **Recipient UI**: Add distance filter buttons / proximity selector on [`RecipientDashboard.jsx`](src/recipient-dashboard/RecipientDashboard.jsx) with current location detection support.
- **Unit Tests**: Verify distance calculation accuracy, radius filtering boundaries, and sorting order.

---

## 3. Heroku Environment Validation Strategy
1. **Schema Evolution**:
   - `spring.jpa.hibernate.ddl-auto=update` handles PostgreSQL schema updates on Heroku.
   - Accompanying script `sprint9_schema.sql` prepared for manual inspection / migration sanity check.
2. **Environment Configuration**:
   - Ensure external geocoding requests honor Heroku outbound networking requirements (proper HTTP User-Agent header and timeouts).
3. **End-to-End Staging Verification**:
   - Verify donor address submission -> automatic geocoding to lat/long in Heroku PostgreSQL.
   - Verify recipient distance query against Heroku Postgres coords.
   - Verify address masking until donor confirms pickup.
