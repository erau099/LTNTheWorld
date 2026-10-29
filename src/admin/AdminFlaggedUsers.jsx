
import { useEffect, useState } from "react";
import AdminHeader from "./AdminHeader";

function AdminFlaggedUsers() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [suspendingId, setSuspendingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchFlaggedUsers = async () => {
      try {
        // DT-50: Retrieve reports and existing user account statuses.
        const [reportsResponse, usersResponse] = await Promise.all([
          fetch("/api/admin/reports"),
          fetch("/api/admin/users"),
        ]);

        if (!reportsResponse.ok) {
          throw new Error(
            `Failed to load reports: HTTP ${reportsResponse.status}`
          );
        }

        if (!usersResponse.ok) {
          throw new Error(
            `Failed to load users: HTTP ${usersResponse.status}`
          );
        }

        const [reportsData, usersData] = await Promise.all([
          reportsResponse.json(),
          usersResponse.json(),
        ]);

        const flaggedUsers = reportsData.filter(
          (report) =>
            report.reportType?.toUpperCase() === "USER" &&
            report.status?.toUpperCase() === "PENDING"
        );

        setReports(flaggedUsers);
        setUsers(usersData);
      } catch (err) {
        console.error("Failed to load flagged users:", err);
        setError("Unable to load flagged users.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlaggedUsers();
  }, []);

  // DT-50: Suspend a reported user using existing account management.
  const handleSuspend = async (report) => {
    if (!report.reportedUserId) {
      alert("This report does not identify a user to suspend.");
      return;
    }

    const user = users.find(
      (item) => item.id === report.reportedUserId
    );

    if (!user) {
      alert("The reported user could not be found.");
      return;
    }

    if (user.status?.toUpperCase() === "SUSPENDED") {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to suspend this user? " +
      "They will be blocked from logging in."
    );

    if (!confirmed) return;

    setSuspendingId(report.id);
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/admin/users/${report.reportedUserId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "SUSPENDED",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to suspend user: HTTP ${response.status}`
        );
      }

      const updatedUser = await response.json();

      setUsers((prev) =>
        prev.map((user) =>
          user.id === updatedUser.id
            ? { ...user, status: updatedUser.status }
            : user
        )
      );

      setSuccessMessage(
        "User suspended successfully. You can now resolve the report."
      );
    } catch (err) {
      console.error("Failed to suspend user:", err);
      alert("Unable to suspend the reported user.");
    } finally {
      setSuspendingId(null);
    }
  };

  // Preserve existing report resolution behavior.
  // The backend endpoint is implemented in DT-50.
  const handleResolve = async (reportId) => {
    if (!window.confirm("Mark this report as resolved?")) {
      return;
    }

    setResolvingId(reportId);
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/admin/reports/${reportId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "RESOLVED",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to resolve report: HTTP ${response.status}`
        );
      }

      setReports((prev) =>
        prev.filter((report) => report.id !== reportId)
      );

      setSuccessMessage("Report resolved successfully.");
    } catch (err) {
      console.error("Failed to resolve report:", err);
      alert("Unable to resolve report.");
    } finally {
      setResolvingId(null);
    }
  };

  const getReportedUser = (userId) => {
    return users.find((user) => user.id === userId);
  };

  const formatDate = (value) => {
    return value
      ? new Date(value).toLocaleString()
      : "N/A";
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader />

      <main className="admin-main">
        <section className="admin-welcome">
          <h1>Flagged Users</h1>
          <p>
            Review users who have active reports against them.
          </p>
        </section>

        {loading && <p>Loading flagged users...</p>}

        {error && (
          <p role="alert">{error}</p>
        )}

        {successMessage && (
          <p role="status">{successMessage}</p>
        )}

        {!loading && !error && reports.length === 0 && (
          <p>No flagged users found.</p>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="admin-user-table">
            <div className="admin-user-row admin-user-table-header">
              <span>Reported User</span>
              <span>Reason</span>
              <span>Description</span>
              <span>Account Status</span>
              <span>Created</span>
              <span>Actions</span>
            </div>

            {reports.map((report) => {
              const reportedUser = getReportedUser(
                report.reportedUserId
              );

              const accountStatus =
                reportedUser?.status?.toUpperCase() || "UNKNOWN";

              const isSuspended =
                accountStatus === "SUSPENDED";

              const isUpdating =
                resolvingId === report.id ||
                suspendingId === report.id;

              return (
                <div
                  className="admin-user-row"
                  key={report.id}
                >
                  <span>
                    <strong>
                      {reportedUser?.name ||
                        `${reportedUser?.firstName || ""} ${reportedUser?.lastName || ""}`.trim() ||
                        "Unknown User"}
                    </strong>

                    <div
                      style={{
                        fontSize: "0.75rem",
                        wordBreak: "break-all",
                      }}
                    >
                      {report.reportedUserId || "N/A"}
                    </div>
                  </span>

                  <span>{report.reason}</span>

                  <span>
                    {report.description || "None"}
                  </span>

                  <span>
                    <span
                      className={`status-badge ${
                        accountStatus === "ACTIVE"
                          ? "badge-active"
                          : "badge-suspended"
                      }`}
                    >
                      {accountStatus}
                    </span>
                  </span>

                  <span>
                    {formatDate(report.createdAt)}
                  </span>

                  <span className="user-action-cell">
                    {/* DT-50: Suspend the reported account. */}
                    <button
                      type="button"
                      className="admin-user-action admin-action-suspend"
                      onClick={() => handleSuspend(report)}
                      disabled={
                        isUpdating ||
                        isSuspended ||
                        !reportedUser
                      }
                      title={
                        isSuspended
                          ? "This account is already suspended"
                          : "Suspend reported user"
                      }
                    >
                      {suspendingId === report.id
                        ? "Suspending..."
                        : isSuspended
                        ? "Suspended"
                        : "Suspend"}
                    </button>

                    {/* Existing resolve action */}
                    <button
                      type="button"
                      className="admin-user-action admin-action-activate"
                      onClick={() => handleResolve(report.id)}
                      disabled={isUpdating}
                    >
                      {resolvingId === report.id
                        ? "Resolving..."
                        : "Resolve"}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminFlaggedUsers;
