# Sprint 7 Execution Report: DT-109 & DT-110 Implementation

## Overview
This report documents the implementation of tickets **DT-109** (Admin Dedicated Secure Login Page) and **DT-110** (Admin View List of Registered Users) as planned for Sprint 7.

---

## 1. DT-109: Admin Dedicated Secure Login Page
### Status: Completed

### Summary of Changes:
1. **Frontend Dedicated Login View (`/admin-login`)**:
   - Implemented [`AdminLogin.jsx`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/src/admin/AdminLogin.jsx) and [`AdminLogin.css`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/src/admin/AdminLogin.css).
   - Provides an isolated administrative login interface styled with distinctive branding and clear status feedback banners.
   - Captures user credentials and dispatches requests to `POST /api/admin/auth/login`.
   - On successful login, updates `AuthContext` with admin credentials and smoothly redirects to `/admin-dashboard`.
   - On failure, displays explicit, actionable alerts:
     - HTTP 403: "⛔ Access Denied: Administrator privileges required."
     - HTTP 401: "❌ Invalid username/email or password."
     - Network errors: "⚠️ Unable to reach server. Please ensure the backend is running."
2. **Protected Route Wrapper (`AdminProtectedRoute`)**:
   - Implemented [`AdminProtectedRoute.jsx`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/src/admin/AdminProtectedRoute.jsx).
   - Guards `/admin-dashboard` so unauthenticated users or non-admin accounts are redirected directly to `/admin-login`.
   - Wired in [`App.jsx`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/src/App.jsx).
3. **Sign Out Flow**:
   - Updated [`AdminHeader.jsx`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/src/admin/AdminHeader.jsx) to include an admin user identity badge and a "Sign Out" button.
   - Calling sign out clears the user state in `AuthContext` and returns the administrator to `/`.
4. **Backend Admin Authentication Endpoint**:
   - Implemented `POST /api/admin/auth/login` in [`AdminController.java`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/lovethyneighbor-backend/src/main/java/com/codecraft/lovethyneighbor/AdminController.java).
   - Validates credentials against test admin defaults (`admin`/`1234`) and registered database users with `role = 'ADMIN'`.
   - Returns HTTP 403 Forbidden when valid credentials belong to a non-admin user role.
   - Returns HTTP 401 Unauthorized when credentials are unknown or incorrect.

---

## 2. DT-110: Admin View List of Registered Users
### Status: Completed

### Summary of Changes:
1. **Data Model Updates**:
   - Updated [`User.java`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/lovethyneighbor-backend/src/main/java/com/codecraft/lovethyneighbor/User.java) with `status` (default `ACTIVE`) and `canPostListings` (default `true`) fields and getters/setters.
   - Added database migration script [`sprint7_admin_schema.sql`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/lovethyneighbor-backend/src/main/resources/sprint7_admin_schema.sql).
2. **DTO Projection (`UserSummaryDTO`)**:
   - Implemented [`UserSummaryDTO.java`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/lovethyneighbor-backend/src/main/java/com/codecraft/lovethyneighbor/UserSummaryDTO.java).
   - Strips sensitive passwords/password hashes while exposing `id`, `name`, `firstName`, `lastName`, `email`, `role`, `status`, `canPostListings`, `dateOfBirth`, and `phoneNumber`.
3. **Backend REST API**:
   - Implemented `GET /api/admin/users` in [`AdminController.java`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/lovethyneighbor-backend/src/main/java/com/codecraft/lovethyneighbor/AdminController.java).
   - Implemented `GET /api/admin/stats` returning platform aggregate counts.
   - Implemented `PATCH /api/admin/users/{id}/status` and `PATCH /api/admin/users/{id}/restrictions` to support moderation toggles.
4. **Dynamic Frontend User Management Table**:
   - Updated [`AdminUserManagement.jsx`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/src/admin/AdminUserManagement.jsx) to fetch live user data from `GET /api/admin/users` on component mount.
   - Added loading spinner and error alert banner with retry functionality.
   - Renders 6 columns: Name, Email, Role, Account Status (`ACTIVE`/`SUSPENDED`), Posting Ability (`Allowed`/`Restricted`), and Action button ("Suspend"/"Activate").
   - Updated [`AdminDashboard.jsx`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/src/admin/AdminDashboard.jsx) to sync the "Total Users" counter card dynamically.
   - Enhanced styling in [`AdminDashboard.css`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/src/admin/AdminDashboard.css).

---

## 3. Verification & Automated Tests
- **Backend Unit Tests**: Implemented [`AdminControllerTest.java`](file:///C:/Users/rauet/Desktop/Coding/csc190/LTNTheWorld/lovethyneighbor-backend/src/test/java/com/codecraft/lovethyneighbor/AdminControllerTest.java).
  - Validates `POST /api/admin/auth/login` (admin default credentials, DB admin user, non-admin 403 rejection, unknown user 401 rejection).
  - Validates `GET /api/admin/users` (all registered users returned as `UserSummaryDTO` without password field).
  - Validates user status patch.
  - Maven test suite result: **BUILD SUCCESS (7/7 tests passed)**.
- **Frontend Build**: Verified with `npm run build` (compiled clean with Vite) and `npx eslint src/admin` (0 errors, 0 warnings).
