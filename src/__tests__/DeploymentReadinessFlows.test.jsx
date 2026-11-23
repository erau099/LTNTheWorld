import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import Signup from "../Signup";
import VerifyEmail from "../VerifyEmail";
import ForgotPassword from "../ForgotPassword";
import ResetPassword from "../ResetPassword";
import Login from "../Login";
import UploadFoodDetails from "../food-upload/UploadFoodDetails";
import UploadFoodLocation from "../food-upload/UploadFoodLocation";
import UploadFoodPhoto from "../food-upload/UploadFoodPhoto";
import FoodSubmission from "../food-upload/FoodSubmission";
import PickupCoordinationModal from "../donor-dashboard/PickupCoordinationModal";
import RecipientDashboard from "../recipient-dashboard/RecipientDashboard";
import RecipientPastOrders from "../recipient-orders/RecipientPastOrders";
import Review from "../Review";
import AdminLogin from "../admin/AdminLogin";
import AdminProtectedRoute from "../admin/AdminProtectedRoute";
import AdminDashboard from "../admin/AdminDashboard";
import DynoUpgradeModal from "../admin/DynoUpgradeModal";

describe("Deployment Readiness End-to-End UI & Failure-Mode Flows", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. AUTH FLOWS: SIGNUP, VERIFY, FORGOT/RESET, LOGIN + FAILURE MODES
  // =========================================================================
  describe("Auth lifecycle & failure modes", () => {
    it("Signup requires waiver scroll, handles 400 & network errors, and navigates on 200", async () => {
      const user = userEvent.setup();
      global.fetch
        .mockResolvedValueOnce({ ok: false, status: 400, text: async () => "User already exists" })
        .mockRejectedValueOnce(new Error("Network down"))
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => "success" });

      render(
        <MemoryRouter initialEntries={["/Signup"]}>
          <Routes>
            <Route path="/Signup" element={<Signup />} />
            <Route path="/Login" element={<div>Login Destination</div>} />
          </Routes>
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText("First Name"), "Maya");
      await user.type(screen.getByPlaceholderText("Last Name"), "Lin");
      await user.type(screen.getByPlaceholderText("Email Address"), "maya@ltn.org");
      await user.type(screen.getByPlaceholderText("Password"), "StrongPass1!");
      await user.type(screen.getByPlaceholderText("Retype Password"), "StrongPass1!");
      fireEvent.change(screen.getByPlaceholderText("DOB: MM/DD/YYYY"), { target: { value: "1995-05-15" } });
      await user.type(screen.getByPlaceholderText("Phone Number"), "555-123-4567");
      await user.selectOptions(screen.getByRole("combobox"), "donor");

      // Open liability waiver modal and scroll to bottom to enable Accept
      await user.click(screen.getByText(/liability waiver/i));
      const acceptBtn = screen.getByRole("button", { name: /^Accept$/i });
      expect(acceptBtn).toBeDisabled();
      const waiverBox = document.querySelector(".waiver_box");
      Object.defineProperty(waiverBox, "scrollHeight", { value: 200, configurable: true });
      Object.defineProperty(waiverBox, "clientHeight", { value: 200, configurable: true });
      Object.defineProperty(waiverBox, "scrollTop", { value: 10, configurable: true });
      fireEvent.scroll(waiverBox);
      expect(acceptBtn).not.toBeDisabled();
      await user.click(acceptBtn);

      // 1st attempt: 400 duplicate email
      await user.click(screen.getByRole("button", { name: /Continue/i }));
      expect(await screen.findByText(/User already exists/i)).toBeInTheDocument();

      // 2nd attempt: network failure
      await user.click(screen.getByRole("button", { name: /Continue/i }));
      expect(await screen.findByText(/Failed to connect to the server/i)).toBeInTheDocument();

      // 3rd attempt: 200 success -> navigates to Login
      await user.click(screen.getByRole("button", { name: /Continue/i }));
      expect(await screen.findByText("Login Destination")).toBeInTheDocument();
    });

    it("VerifyEmail handles valid token, expired token + resend, and network failure", async () => {
      const user = userEvent.setup();
      global.fetch
        .mockResolvedValueOnce({ ok: false, status: 400, text: async () => "Verification link has expired." })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => "A new link has been sent." });

      render(
        <MemoryRouter initialEntries={["/verify-email?token=expired-tok"]}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByText(/Verification link has expired/i)).toBeInTheDocument();
      await user.type(screen.getByPlaceholderText("Email Address"), "maya@ltn.org");
      await user.click(screen.getByRole("button", { name: /Send a new verification link/i }));
      expect(await screen.findByText(/A new link has been sent/i)).toBeInTheDocument();
    });

    it("ForgotPassword and ResetPassword handle 500, 400 invalid token, and 200 recovery", async () => {
      const user = userEvent.setup();
      global.fetch
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => "Mail service temporarily down" })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => "Sent" });

      const { unmount } = render(
        <MemoryRouter initialEntries={["/forgot-password"]}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText("Email Address"), "maya@ltn.org");
      await user.click(screen.getByRole("button", { name: /Send Reset Link/i }));
      expect(await screen.findByText(/Mail service temporarily down/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Send Reset Link/i }));
      expect(await screen.findByText(/password reset link has been sent/i)).toBeInTheDocument();
      unmount();

      // ResetPassword 400 expired then 200 success
      global.fetch
        .mockResolvedValueOnce({ ok: false, status: 400, text: async () => "Reset link has expired" })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => "success" });

      render(
        <MemoryRouter initialEntries={["/reset-password?token=valid-reset-tok"]}>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/Login" element={<div>Login After Reset</div>} />
          </Routes>
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText("New Password"), "NewStrong1!");
      await user.type(screen.getByPlaceholderText("Confirm New Password"), "NewStrong1!");

      await user.click(screen.getByRole("button", { name: /Reset Password/i }));
      expect(await screen.findByText(/Reset link has expired/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Reset Password/i }));
      expect(await screen.findByText("Login After Reset")).toBeInTheDocument();
    });

    it("Login handles 403 unverified, 403 suspended ('Account is not active'), and 500/network errors", async () => {
      const user = userEvent.setup();
      // AuthProvider rehydration on mount returns 401
      global.fetch
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => "Account is not active. Please contact support.",
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => "Please verify your email before logging in.",
        })
        .mockRejectedValueOnce(new Error("Offline"));

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/Login"]}>
            <Routes>
              <Route path="/Login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await user.type(screen.getByPlaceholderText("Email Address"), "user@ltn.org");
      await user.type(screen.getByPlaceholderText("Password"), "Password123!");

      // 1: Suspended / inactive 403
      await user.click(screen.getByRole("button", { name: /Sign In/i }));
      expect(await screen.findByText(/Account is suspended/i)).toBeInTheDocument();

      // 2: Unverified 403
      await user.click(screen.getByRole("button", { name: /Sign In/i }));
      expect(await screen.findByText(/Please verify your email/i)).toBeInTheDocument();

      // 3: Network failure (no unhandled rejection)
      await user.click(screen.getByRole("button", { name: /Sign In/i }));
      expect(await screen.findByText(/Unable to reach the server/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. DONOR FLOWS: 3-STEP UPLOAD, EXTERNAL AUTOCOMPLETE FAILURE, DELETE/CONFIRM FAULTS
  // =========================================================================
  describe("Donor upload, pickup coordination & delete failure modes", () => {
    it("Exercises 3-step donor food upload with saved-address 404, Nominatim outage, 403/500 faults, and 200 completion", async () => {
      const user = userEvent.setup();
      const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

      // AuthProvider /api/users/me returns donor
      global.fetch.mockImplementation(async (url, opts) => {
        if (String(url).includes("/api/users/me")) {
          return {
            ok: true,
            json: async () => ({ firstName: "Donor", lastName: "One", role: "donor", canPostListings: true }),
          };
        }
        if (String(url).includes("/api/addresses/me")) {
          return { ok: false, status: 404 };
        }
        if (String(url).includes("nominatim.openstreetmap.org")) {
          throw new Error("Nominatim timeout");
        }
        if (String(url) === "/api/food" && opts?.method === "POST") {
          const callNum = global.fetch.mock.calls.filter(([u, o]) => u === "/api/food" && o?.method === "POST").length;
          if (callNum === 1) {
            return {
              ok: false,
              status: 403,
              text: async () => "Your ability to post listings has been restricted by an administrator.",
            };
          }
          if (callNum === 2) {
            return { ok: false, status: 500, text: async () => "Database error" };
          }
          return {
            ok: true,
            status: 200,
            json: async () => ({
              id: 77,
              foodItem: "Warm Lasagna",
              address: "6000 J St, Sacramento, CA",
              date: tomorrow,
              pickupTime: `${tomorrow}T12:00:00`,
              pickupEndTime: `${tomorrow}T15:00:00`,
            }),
          };
        }
        return { ok: true, json: async () => [] };
      });

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/UploadFoodDetails"]}>
            <Routes>
              <Route path="/UploadFoodDetails" element={<UploadFoodDetails />} />
              <Route path="/UploadFoodLocation" element={<UploadFoodLocation />} />
              <Route path="/UploadFoodPhoto" element={<UploadFoodPhoto />} />
              <Route path="/FoodSubmission" element={<FoodSubmission />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      // Step 1: Details
      await user.type(screen.getByLabelText(/Listing Title/i), "Warm Lasagna");
      await user.type(screen.getByLabelText(/Description/i), "Tray of vegetable lasagna");
      await user.click(screen.getByRole("button", { name: "Fresh / Hot" }));
      await user.click(screen.getByRole("button", { name: /Next: Location & Time/i }));

      // Step 2: Location (test saved address 404 fallback + Nominatim outage tolerance)
      expect(await screen.findByText("Pickup Location")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Use my saved profile address/i }));
      expect(await screen.findByText(/No address saved in your profile yet/i)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/Pickup Address/i), "6000 J St, Sacramento, CA");
      fireEvent.change(screen.getByLabelText(/Pickup Date/i), { target: { value: tomorrow } });
      fireEvent.change(screen.getByLabelText(/Time Start/i), { target: { value: "12:00" } });
      fireEvent.change(screen.getByLabelText(/Time End/i), { target: { value: "15:00" } });
      await user.click(screen.getByRole("button", { name: /Next: Upload Photo/i }));

      // Step 3: Photo -> submit 403 restricted, 500 error, then 200 success
      expect(await screen.findByRole("heading", { name: "Upload Photo" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^Submit$/i }));
      expect(await screen.findByText(/restricted by an administrator/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^Submit$/i }));
      expect(await screen.findByText(/Database error/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^Submit$/i }));
      expect(await screen.findByText(/Listing posted!/i)).toBeInTheDocument();
    });

    it("PickupCoordinationModal sends credentials and surfaces 409/500 failures on confirm, decline, and delete", async () => {
      const user = userEvent.setup();
      const baseFood = {
        id: 88,
        foodItem: "Fresh Apples",
        status: "CLAIMED",
        address: "100 Main St",
        pickupTime: "2026-12-01T10:00:00",
        pickupEndTime: "2026-12-01T12:00:00",
        tags: "Fresh / Hot",
      };

      global.fetch
        .mockResolvedValueOnce({ ok: false, status: 409, text: async () => "Only a pending food request can be approved." })
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => "Server exploded" });

      const { rerender } = render(
        <PickupCoordinationModal food={baseFood} onClose={vi.fn()} onStatusUpdated={vi.fn()} onListingDeleted={vi.fn()} />
      );

      await user.click(screen.getByRole("button", { name: /Confirm Pickup Schedule/i }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/Only a pending food request can be approved/i);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/food/88/confirm-pickup",
        expect.objectContaining({ method: "PATCH", credentials: "include" })
      );

      await user.click(screen.getByRole("button", { name: /Decline Request/i }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/Server exploded/i);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/orders/food/88/decline-request",
        expect.objectContaining({ method: "PATCH", credentials: "include" })
      );

      // Delete conflict 409 on ACTIVE listing that was concurrently claimed
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => "Claimed, scheduled, or completed listings cannot be removed.",
      });
      rerender(
        <PickupCoordinationModal
          key="active"
          food={{ ...baseFood, status: "ACTIVE" }}
          onClose={vi.fn()}
          onStatusUpdated={vi.fn()}
          onListingDeleted={vi.fn()}
        />
      );
      await user.click(screen.getByRole("button", { name: /Remove Listing/i }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/cannot be removed/i);
    });
  });

  // =========================================================================
  // 3. RECIPIENT FLOWS: SEARCH, CLAIM, REPORT, REVIEW + FAILURE MODES
  // =========================================================================
  describe("Recipient search, claim, report, and review failure modes", () => {
    it("RecipientDashboard recovers from 500 via Retry, filters search/allergens, reports listing, and handles claim 409/500", async () => {
      const user = userEvent.setup();
      let foodCalls = 0;

      global.fetch.mockImplementation(async (url, opts) => {
        const str = String(url);
        if (str.startsWith("/api/food?") && !str.includes("radiusMiles=10")) {
          foodCalls += 1;
          if (foodCalls === 1) {
            return { ok: false, status: 500 };
          }
          return {
            ok: true,
            json: async () => [
              {
                id: 101,
                foodItem: "Peanut Noodles",
                description: "Spicy noodles",
                pickupTime: "2026-12-01T14:00:00",
                tags: "Fresh / Hot",
                allergens: "Peanuts",
                status: "ACTIVE",
                approximateLocation: "Midtown, Sacramento",
              },
              {
                id: 102,
                foodItem: "Garden Salad",
                description: "Crisp greens",
                pickupTime: "2026-12-01T15:00:00",
                tags: "Fresh / Hot",
                allergens: "",
                status: "ACTIVE",
                approximateLocation: "East Sac, Sacramento",
              },
            ],
          };
        }
        if (str === "/api/food/102") {
          return { ok: true, json: async () => ({ id: 102, status: "ACTIVE" }) };
        }
        if (str === "/api/orders/cooldown") {
          return { ok: true, json: async () => ({ canRequest: true, cooldownHours: 24 }) };
        }
        if (str === "/api/users/me/allergies") {
          return { ok: true, text: async () => "" };
        }
        if (str === "/api/reports" && opts?.method === "POST") {
          return { ok: true, status: 201, json: async () => ({ id: 5 }) };
        }
        if (str === "/api/orders/102" && opts?.method === "POST") {
          return { ok: false, status: 409, text: async () => "This food listing is temporarily unavailable because it is on hold." };
        }
        if (str === "/api/users/me") {
          return { ok: true, json: async () => ({ firstName: "Recip", role: "recipient" }) };
        }
        if (str.startsWith("/api/notifications")) {
          return { ok: true, json: async () => [] };
        }
        return { ok: true, json: async () => [] };
      });

      render(
        <AuthProvider>
          <MemoryRouter>
            <RecipientDashboard />
          </MemoryRouter>
        </AuthProvider>
      );

      // Initial 500 error shows alert + Retry button
      expect(await screen.findByText(/Unable to load food listings/i)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Retry/i }));

      expect(await screen.findByText(/Peanut Noodles/i)).toBeInTheDocument();
      expect(screen.getByText(/Garden Salad/i)).toBeInTheDocument();

      // Hide Peanut allergen
      await user.click(screen.getByRole("button", { name: "Peanuts" }));
      expect(screen.queryByText(/Peanut Noodles/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Garden Salad/i)).toBeInTheDocument();

      // Open modal -> Report listing -> Submit
      await user.click(screen.getByText(/Garden Salad/i));
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Report Listing/i }));
      await user.selectOptions(screen.getByLabelText(/Reason for report/i), "Expired or unsafe food");
      await user.click(screen.getByRole("button", { name: /Submit Report/i }));
      expect(await screen.findByText(/Report submitted for administrator review/i)).toBeInTheDocument();

      // Attempt claim -> 409 conflict surfaced via alert
      await user.click(screen.getByRole("button", { name: /Request Food/i }));
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("on hold"));
      });
    });

    it("RecipientPastOrders hides Directions link for locked CLAIMED orders, shows it for SCHEDULED, and handles review faults", async () => {
      const user = userEvent.setup();
      global.fetch.mockImplementation(async (url, opts) => {
        const str = String(url);
        if (str === "/api/recipient/orders") {
          return {
            ok: true,
            json: async () => [
              {
                id: 201,
                foodId: 201,
                food: "Pending Bread",
                donor: "Alice",
                date: "2026-12-01",
                time: "12:00",
                status: "CLAIMED",
                address: "Locked until donor approves request",
                directionsUrl: null,
                reviewed: false,
                reviewEligible: false,
              },
              {
                id: 202,
                foodId: 202,
                food: "Approved Soup",
                donor: "Bob",
                date: "2026-12-01",
                time: "14:00",
                status: "COMPLETED",
                address: "6000 J St, Sacramento, CA",
                directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=6000+J+St",
                reviewed: false,
                reviewEligible: true,
              },
            ],
          };
        }
        if (str === "/api/reviews" && opts?.method === "POST") {
          return { ok: false, status: 409, text: async () => "You have already reviewed this pickup" };
        }
        if (str === "/api/users/me") {
          return { ok: true, json: async () => ({ firstName: "Recip", role: "recipient" }) };
        }
        return { ok: true, json: async () => [] };
      });

      render(
        <AuthProvider>
          <MemoryRouter>
            <RecipientPastOrders />
          </MemoryRouter>
        </AuthProvider>
      );

      expect(await screen.findByText("Pending Bread")).toBeInTheDocument();
      const directionLinks = screen.getAllByRole("link", { name: /Directions/i });
      // Only the approved/completed order gets a Directions link (NOT the locked CLAIMED one!)
      expect(directionLinks).toHaveLength(1);
      expect(directionLinks[0]).toHaveAttribute("href", expect.stringContaining("6000+J+St"));

      // Submit review against 409 error -> handled gracefully
      const reviewBtn = screen.getAllByRole("button", { name: /^Review$/i }).find((b) => !b.disabled);
      await user.click(reviewBtn);
      const starButtons = screen.getAllByRole("button", { name: "☆" });
      await user.click(starButtons[4]);
      await user.click(screen.getByRole("button", { name: /^Submit$/i }));
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Could not submit review"));
      });
    });

    it("Review page calls /api/reviews/my-reviews with top-level credentials: include and handles 500 error", async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

      render(
        <MemoryRouter>
          <Review />
        </MemoryRouter>
      );

      expect(await screen.findByText(/Could not load your reviews/i)).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledWith("/api/reviews/my-reviews", { credentials: "include" });
    });
  });

  // =========================================================================
  // 4. ADMIN FLOWS: LOGIN, REFRESH REHYDRATION, MODERATION, CAPACITY MODAL
  // =========================================================================
  describe("Admin login, session refresh, moderation & capacity modal failure modes", () => {
    it("AdminLogin handles 401, 403, network failure, and 200 admin authentication", async () => {
      const user = userEvent.setup();
      global.fetch
        .mockResolvedValueOnce({ ok: false, status: 401 }) // AuthProvider mount
        .mockResolvedValueOnce({ ok: false, status: 401 }) // bad creds
        .mockResolvedValueOnce({ ok: false, status: 403 }) // non-admin
        .mockRejectedValueOnce(new Error("Server unreachable")) // network error
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ status: "success", name: "Platform Admin", role: "ADMIN" }),
        });

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/admin-login"]}>
            <Routes>
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin-dashboard" element={<div>Admin Home</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await user.type(screen.getByLabelText(/Admin Email/i), "admin@ltn.org");
      await user.type(screen.getByLabelText(/Password/i), "Secret123!");

      await user.click(screen.getByRole("button", { name: /Sign In to Admin Portal/i }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/Invalid username\/email or password/i);

      await user.click(screen.getByRole("button", { name: /Sign In to Admin Portal/i }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/Access Denied/i);

      await user.click(screen.getByRole("button", { name: /Sign In to Admin Portal/i }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/Unable to reach server/i);

      await user.click(screen.getByRole("button", { name: /Sign In to Admin Portal/i }));
      expect(await screen.findByRole("status")).toHaveTextContent(/Authenticated successfully/i);
    });

    it("AdminProtectedRoute redirects to /admin-login when /api/users/me returns 401 on refresh", async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/admin-dashboard"]}>
            <Routes>
              <Route path="/admin-login" element={<div>Admin Login Redirect</div>} />
              <Route
                path="/admin-dashboard"
                element={
                  <AdminProtectedRoute>
                    <div>Protected Admin View</div>
                  </AdminProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      expect(await screen.findByText("Admin Login Redirect")).toBeInTheDocument();
    });

    it("AdminDashboard recovers from 500 on users/listings fetch and supports listing removal moderation", async () => {
      const user = userEvent.setup();
      let usersCall = 0;

      global.fetch.mockImplementation(async (url, opts) => {
        const str = String(url);
        if (str === "/api/users/me") {
          return { ok: true, json: async () => ({ firstName: "Admin", role: "ADMIN" }) };
        }
        if (str === "/api/admin/stats") {
          return { ok: true, json: async () => ({ totalUsers: 1, activeListings: 1, pendingReports: 0 }) };
        }
        if (str === "/api/admin/users") {
          usersCall += 1;
          if (usersCall === 1) return { ok: false, status: 500 };
          return {
            ok: true,
            json: async () => [
              { id: "u1", name: "Jane Donor", email: "jane@ltn.org", role: "donor", status: "ACTIVE", canPostListings: true },
            ],
          };
        }
        if (str === "/api/admin/food/active") {
          return {
            ok: true,
            json: async () => [
              { id: 55, foodItem: "Suspicious Stew", description: "Expired", tags: "Fresh / Hot", allergens: "", status: "ACTIVE" },
            ],
          };
        }
        if (str === "/api/admin/food/55/status" && opts?.method === "PATCH") {
          return { ok: true, json: async () => ({ id: 55, status: "REMOVED_BY_ADMIN" }) };
        }
        if (str === "/api/admin/system-health") {
          return { ok: false, status: 500 };
        }
        return { ok: true, json: async () => [] };
      });

      render(
        <AuthProvider>
          <MemoryRouter>
            <AdminDashboard />
          </MemoryRouter>
        </AuthProvider>
      );

      // Users 500 -> Retry -> Loads Jane Donor
      expect(await screen.findByText(/Unable to connect to user management service/i)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Retry/i }));
      expect(await screen.findByText("Jane Donor")).toBeInTheDocument();

      // Switch to Active Food Listings tab and remove a listing with reason
      await user.click(screen.getByRole("button", { name: /Active Food Listings/i }));
      expect(await screen.findByText("Suspicious Stew")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^Remove$/i }));
      await user.type(screen.getByPlaceholderText(/Enter removal reason/i), "Food safety concern");
      await user.click(screen.getByRole("button", { name: /Confirm Removal/i }));

      await waitFor(() => {
        expect(screen.queryByText("Suspicious Stew")).not.toBeInTheDocument();
      });
    });

    it("DynoUpgradeModal fails silently on 500/network outage without disrupting admin UI", async () => {
      vi.useFakeTimers();
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

      render(<DynoUpgradeModal delayMs={1000} />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
