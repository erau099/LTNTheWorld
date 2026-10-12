import { useState, useEffect } from "react";
import "./AdminDashboard.css";
import AdminHeader from "./AdminHeader";
import AdminUserManagement from "./AdminUserManagement";

function AdminDashboard() {
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    pendingReports: 0,
  });

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((stats) => {
        if (isMounted && stats) {
          setDashboardStats((prev) => ({
            ...prev,
            totalUsers: stats.totalUsers ?? prev.totalUsers,
            activeListings: stats.activeListings ?? prev.activeListings,
            pendingReports: stats.pendingReports ?? prev.pendingReports,
          }));
        }
      })
      .catch(() => {
        // Fallback gracefully if stats endpoint is not yet reachable
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUserCountChange = (count) => {
    setDashboardStats((prev) => ({
      ...prev,
      totalUsers: count,
    }));
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader />

      <main className="admin-main">
        {/* Admin Dashboard Title */}
        <section className="admin-welcome">
          <h1>Admin Dashboard</h1>
          <p>
            Manage users and review activity across the Lighten The World
            platform.
          </p>
        </section>

        {/* Dashboard Overview */}
        <section className="admin-overview">
          <div className="admin-card">
            <h2>Total Users</h2>
            <p className="admin-card-number">
              {dashboardStats.totalUsers}
            </p>
          </div>

          <div className="admin-card">
            <h2>Active Listings</h2>
            <p className="admin-card-number">
              {dashboardStats.activeListings}
            </p>
          </div>

          <div className="admin-card">
            <h2>Pending Reports</h2>
            <p className="admin-card-number">
              {dashboardStats.pendingReports}
            </p>
          </div>
        </section>

        {/* User Management */}
        <AdminUserManagement onUserCountChange={handleUserCountChange} />
      </main>
    </div>
  );
}

export default AdminDashboard;