import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import AdminProtectedRoute from "./AdminProtectedRoute";

describe("AdminProtectedRoute session rehydration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps admin authenticated on refresh when /api/users/me returns ADMIN role", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        firstName: "Admin",
        lastName: "Staff",
        email: "admin@ltn.org",
        role: "ADMIN",
      }),
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/admin-dashboard"]}>
          <Routes>
            <Route path="/admin-login" element={<div>Admin Login Page</div>} />
            <Route
              path="/admin-dashboard"
              element={
                <AdminProtectedRoute>
                  <div>Admin Dashboard Content</div>
                </AdminProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Verifying administrator session/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard Content")).toBeInTheDocument();
    });
  });

  it("redirects to /admin-login when /api/users/me returns non-admin", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        firstName: "Donor",
        lastName: "User",
        email: "donor@ltn.org",
        role: "donor",
      }),
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/admin-dashboard"]}>
          <Routes>
            <Route path="/admin-login" element={<div>Admin Login Page</div>} />
            <Route
              path="/admin-dashboard"
              element={
                <AdminProtectedRoute>
                  <div>Admin Dashboard Content</div>
                </AdminProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Admin Login Page")).toBeInTheDocument();
    });
  });
});
