import { useState, useEffect, useCallback } from "react";

function AdminUserManagement({ onUserCountChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
      if (onUserCountChange) {
        onUserCountChange(data.length);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Unable to connect to user management service. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }, [onUserCountChange]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId, currentStatus) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMessage = nextStatus === "SUSPENDED"
      ? "Are you sure you want to suspend this user? They will be blocked from logging in."
      : "Are you sure you want to reactivate this user account?";

    if (!window.confirm(confirmMessage)) return;

    setUpdatingId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error(`Status update failed with HTTP ${response.status}`);
      }

      const updatedUser = await response.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: updatedUser.status } : u))
      );
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Failed to update user status. Please check backend connection.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="admin-user-management">
      <div className="admin-section-header">
        <div>
          <h2>User Management</h2>
          <p>Review and moderate registered users across the platform.</p>
        </div>
        <button
          className="admin-refresh-btn"
          onClick={fetchUsers}
          disabled={loading}
          title="Refresh user list from database"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="admin-error-banner" role="alert">
          <div className="admin-error-text">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button className="admin-retry-btn" onClick={fetchUsers}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-loading-container">
          <div className="admin-spinner" />
          <p>Loading registered users...</p>
        </div>
      ) : (
        <div className="admin-user-table">
          <div className="admin-user-row admin-user-table-header">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Account Status</span>
            <span>Posting Ability</span>
            <span>Action</span>
          </div>

          {users.length === 0 ? (
            <div className="admin-empty-users">
              <p>No registered users found in database.</p>
            </div>
          ) : (
            users.map((user) => {
              const displayName =
                user.name ||
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                "N/A";
              const userStatus = (user.status || "ACTIVE").toUpperCase();
              const canPost = user.canPostListings !== false;

              return (
                <div className="admin-user-row" key={user.id}>
                  <span className="user-name-cell">{displayName}</span>
                  <span className="user-email-cell" title={user.email}>
                    {user.email}
                  </span>
                  <span className="user-role-cell">
                    <span className="role-badge">{user.role}</span>
                  </span>
                  <span className="user-status-cell">
                    <span
                      className={`status-badge ${
                        userStatus === "ACTIVE" ? "badge-active" : "badge-suspended"
                      }`}
                    >
                      {userStatus}
                    </span>
                  </span>
                  <span className="user-posting-cell">
                    <span
                      className={`posting-badge ${
                        canPost ? "badge-allowed" : "badge-restricted"
                      }`}
                    >
                      {canPost ? "Allowed" : "Restricted"}
                    </span>
                  </span>

                  <span className="user-action-cell">
                    <button
                      className={`admin-user-action ${
                        userStatus === "ACTIVE"
                          ? "admin-action-suspend"
                          : "admin-action-activate"
                      }`}
                      onClick={() => handleStatusChange(user.id, userStatus)}
                      disabled={updatingId === user.id}
                    >
                      {updatingId === user.id
                        ? "Saving..."
                        : userStatus === "ACTIVE"
                        ? "Suspend"
                        : "Activate"}
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

export default AdminUserManagement;