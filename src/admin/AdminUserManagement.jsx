import { useState, useEffect, useCallback } from "react";

function AdminUserManagement({ onUserCountChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [updatingRestrictionId, setUpdatingRestrictionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

    setUpdatingStatusId(userId);
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
      setUpdatingStatusId(null);
    }
  };

  const handleRestrictionChange = async (userId, currentCanPost) => {
    const nextCanPost = !currentCanPost;
    const confirmMessage = !nextCanPost
      ? "Are you sure you want to restrict this user from posting food listings?"
      : "Are you sure you want to allow this user to post food listings again?";

    if (!window.confirm(confirmMessage)) return;

    setUpdatingRestrictionId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/restrictions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canPostListings: nextCanPost }),
      });

      if (!response.ok) {
        throw new Error(`Restriction update failed with HTTP ${response.status}`);
      }

      const updatedUser = await response.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, canPostListings: updatedUser.canPostListings } : u))
      );
    } catch (err) {
      console.error("Error updating user posting restriction:", err);
      alert("Failed to update user posting permissions. Please check backend connection.");
    } finally {
      setUpdatingRestrictionId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const name = (user.name || `${user.firstName || ""} ${user.lastName || ""}`).toLowerCase();
    const email = (user.email || "").toLowerCase();
    return name.includes(query) || email.includes(query);
  });

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

      {/* DT-111: Search Input & Toolbar */}
      <div className="admin-search-toolbar">
        <div className="admin-search-wrapper">
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="admin-search-clear-btn"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="admin-results-count">
          Showing <strong>{filteredUsers.length}</strong> of {users.length} registered user{users.length === 1 ? "" : "s"}
        </div>
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
            <span>Actions</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="admin-empty-users">
              {searchQuery ? (
                <>
                  <p>No users found matching &ldquo;<strong>{searchQuery}</strong>&rdquo;.</p>
                  <button
                    className="admin-clear-search-btn"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <p>No registered users found in database.</p>
              )}
            </div>
          ) : (
            filteredUsers.map((user) => {
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
                    {/* DT-113: Suspend / Reactivate User */}
                    <button
                      className={`admin-user-action ${
                        userStatus === "ACTIVE"
                          ? "admin-action-suspend"
                          : "admin-action-activate"
                      }`}
                      onClick={() => handleStatusChange(user.id, userStatus)}
                      disabled={updatingStatusId === user.id}
                      title={userStatus === "ACTIVE" ? "Suspend user account" : "Reactivate user account"}
                    >
                      {updatingStatusId === user.id
                        ? "Saving..."
                        : userStatus === "ACTIVE"
                        ? "Suspend"
                        : "Activate"}
                    </button>

                    {/* DT-114: Restrict / Allow Food Listings */}
                    <button
                      className={`admin-user-action ${
                        canPost
                          ? "admin-action-restrict"
                          : "admin-action-allow"
                      }`}
                      onClick={() => handleRestrictionChange(user.id, canPost)}
                      disabled={updatingRestrictionId === user.id}
                      title={canPost ? "Restrict from posting listings" : "Allow posting listings"}
                    >
                      {updatingRestrictionId === user.id
                        ? "Saving..."
                        : canPost
                        ? "Restrict"
                        : "Allow"}
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