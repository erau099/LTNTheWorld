import { useState, useEffect } from "react";
import "./AdminDashboard.css";
import AdminHeader from "./AdminHeader";
import AdminUserManagement from "./AdminUserManagement";
import AdminFoodListings from "./AdminFoodListings";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users"); // 'users' or 'food'
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

  const handleListingCountChange = (count) => {
    setDashboardStats((prev) => ({
      ...prev,
      activeListings: count,
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
            Manage users, monitor active donations, and review activity across the Lighten The World platform.
          </p>
        </section>

        {/* Dashboard Overview Cards */}
        <section className="admin-overview">
          <div
            className={`admin-card admin-card-clickable ${activeTab === "users" ? "admin-card-active" : ""}`}
            onClick={() => setActiveTab("users")}
            role="button"
            tabIndex={0}
            title="View user management"
          >
            <h2>Total Users</h2>
            <p className="admin-card-number">{dashboardStats.totalUsers}</p>
            <span className="admin-card-hint">Click to manage users →</span>
          </div>

          <div
            className={`admin-card admin-card-clickable ${activeTab === "food" ? "admin-card-active" : ""}`}
            onClick={() => setActiveTab("food")}
            role="button"
            tabIndex={0}
            title="View active food listings"
          >
            <h2>Active Listings</h2>
            <p className="admin-card-number">{dashboardStats.activeListings}</p>
            <span className="admin-card-hint">Click to manage listings →</span>
          </div>

          <div className="admin-card">
            <h2>Pending Reports</h2>
            <p className="admin-card-number">{dashboardStats.pendingReports}</p>
            <span className="admin-card-hint">Review queue clean</span>
          </div>
        </section>

        {/* Management Tab Navigation */}
        <div className="admin-tab-nav">
          <button
            className={`admin-tab-btn ${activeTab === "users" ? "admin-tab-active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 User Management ({dashboardStats.totalUsers})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "food" ? "admin-tab-active" : ""}`}
            onClick={() => setActiveTab("food")}
          >
            🍱 Active Food Listings ({dashboardStats.activeListings})
          </button>
        </div>

        {/* Active Tab Content */}
        {activeTab === "users" ? (
          <AdminUserManagement onUserCountChange={handleUserCountChange} />
        ) : (
          <AdminFoodListings onListingCountChange={handleListingCountChange} />
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;