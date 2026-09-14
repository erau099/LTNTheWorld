import { useState } from "react";
import "./AdminDashboard.css";

function AdminDashboard() {

  // Temporary dashboard data
  // This can be replaced with backend data later
  const [dashboardStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    pendingReports: 0,
  });

  return (
    <div className="admin-dashboard">

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

      </main>

    </div>
  );
}

export default AdminDashboard;