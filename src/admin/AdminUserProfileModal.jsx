import { useState, useEffect } from "react";
import "./AdminUserProfileModal.css";

function AdminUserProfileModal({ userId, onClose, onUserUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/admin/users/${userId}/activity`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((resData) => setData(resData))
      .catch((err) => {
        console.error("Failed to load user activity:", err);
        setError("Unable to load user profile and activity history.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  const user = data?.user;
  const listings = data?.listings || [];

  const handleToggleStatus = async () => {
    if (!user) return;
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updatedUser = await res.json();
      setData((prev) => ({
        ...prev,
        user: { ...prev.user, status: updatedUser.status },
      }));
      if (onUserUpdated) onUserUpdated(updatedUser);
    } catch (err) {
      alert("Error updating status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRestrictions = async () => {
    if (!user) return;
    const nextCanPost = !user.canPostListings;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/restrictions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canPostListings: nextCanPost }),
      });
      if (!res.ok) throw new Error("Failed to update restrictions");
      const updatedUser = await res.json();
      setData((prev) => ({
        ...prev,
        user: { ...prev.user, canPostListings: updatedUser.canPostListings },
      }));
      if (onUserUpdated) onUserUpdated(updatedUser);
    } catch (err) {
      alert("Error updating restrictions: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getStatusClass = (status) => {
    switch ((status || "").toUpperCase()) {
      case "ACTIVE":
        return "tag-active";
      case "CLAIMED":
        return "tag-claimed";
      case "SCHEDULED":
        return "tag-scheduled";
      case "COMPLETED":
        return "tag-completed";
      case "REMOVED_BY_ADMIN":
        return "tag-removed";
      default:
        return "";
    }
  };

  const displayName =
    user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User Profile";

  return (
    <div className="admin-profile-modal-overlay" onClick={onClose}>
      <div className="admin-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-profile-modal-header">
          <h2>User Profile &amp; Activity History</h2>
          <button className="admin-profile-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="admin-profile-modal-body">
          {error && <div className="admin-error-banner">{error}</div>}

          {loading ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              Loading user history...
            </p>
          ) : user ? (
            <>
              {/* Header Card */}
              <div className="user-identity-card">
                <div className="user-avatar-circle">{getInitials(displayName)}</div>
                <div className="user-identity-meta">
                  <h3>{displayName}</h3>
                  <p>{user.email}</p>
                  <div className="user-badges-row">
                    <span className="role-badge">{user.role}</span>
                    <span
                      className={`status-badge ${
                        user.status === "ACTIVE" ? "badge-active" : "badge-suspended"
                      }`}
                    >
                      {user.status || "ACTIVE"}
                    </span>
                    <span
                      className={`posting-badge ${
                        user.canPostListings !== false ? "badge-allowed" : "badge-restricted"
                      }`}
                    >
                      {user.canPostListings !== false ? "Posting Allowed" : "Posting Restricted"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-box">
                  <p className="admin-stat-num">{data.totalListings}</p>
                  <p className="admin-stat-label">Total Listings</p>
                </div>
                <div className="admin-stat-box">
                  <p className="admin-stat-num">{data.activeListings}</p>
                  <p className="admin-stat-label">Active</p>
                </div>
                <div className="admin-stat-box">
                  <p className="admin-stat-num">{data.claimedListings}</p>
                  <p className="admin-stat-label">Claimed/Scheduled</p>
                </div>
                <div className="admin-stat-box">
                  <p className="admin-stat-num">{data.completedListings}</p>
                  <p className="admin-stat-label">Completed</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="user-details-grid">
                <div className="user-detail-item">
                  <span className="user-detail-label">Account ID</span>
                  <span className="user-detail-val" style={{ fontSize: "0.82rem", wordBreak: "break-all" }}>
                    {user.id}
                  </span>
                </div>
                <div className="user-detail-item">
                  <span className="user-detail-label">Phone Number</span>
                  <span className="user-detail-val">{user.phoneNumber || "Not provided"}</span>
                </div>
                <div className="user-detail-item">
                  <span className="user-detail-label">Date of Birth</span>
                  <span className="user-detail-val">{user.dateOfBirth || "Not provided"}</span>
                </div>
                <div className="user-detail-item">
                  <span className="user-detail-label">Platform Role</span>
                  <span className="user-detail-val">{user.role?.toUpperCase()}</span>
                </div>
              </div>

              {/* Activity History Table */}
              <div className="user-activity-section">
                <h4>
                  <span>Donation Listings History</span>
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                    {listings.length} record{listings.length === 1 ? "" : "s"}
                  </span>
                </h4>

                {listings.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "0.9rem", fontStyle: "italic" }}>
                    No food listings created by this user yet.
                  </p>
                ) : (
                  <div className="activity-table-wrap">
                    <table className="activity-table">
                      <thead>
                        <tr>
                          <th>Food Item</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listings.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 600 }}>{item.foodItem}</td>
                            <td>{item.tags || "General"}</td>
                            <td>{item.date || "N/A"}</td>
                            <td>
                              <span
                                className={`activity-status-tag ${getStatusClass(item.status)}`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {user && (
          <div className="admin-profile-modal-footer">
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className={`admin-user-action ${
                  user.status === "ACTIVE" ? "admin-action-suspend" : "admin-action-activate"
                }`}
                onClick={handleToggleStatus}
                disabled={actionLoading}
              >
                {user.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
              </button>

              <button
                className={`admin-user-action ${
                  user.canPostListings !== false
                    ? "admin-action-restrict"
                    : "admin-action-allow"
                }`}
                onClick={handleToggleRestrictions}
                disabled={actionLoading}
              >
                {user.canPostListings !== false ? "Restrict Posting" : "Allow Posting"}
              </button>
            </div>

            <button
              type="button"
              className="admin-retry-btn"
              onClick={onClose}
              style={{ padding: "8px 16px" }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUserProfileModal;
