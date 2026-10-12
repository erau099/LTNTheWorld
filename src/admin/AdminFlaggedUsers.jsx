import { useEffect, useState } from "react";
import AdminHeader from "./AdminHeader";

function AdminFlaggedUsers() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    const fetchFlaggedUsers = async () => {
      try {
        const response = await fetch("/api/admin/reports");

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        const flaggedUsers = data.filter(
          (report) =>
            report.reportType?.toUpperCase() === "USER" &&
            report.status?.toUpperCase() === "PENDING"
        );

        setReports(flaggedUsers);
      } catch (err) {
        console.error("Failed to load flagged users:", err);
        setError("Unable to load flagged users.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlaggedUsers();
  }, []);

  const handleResolve = async (reportId) => {
    if (!window.confirm("Mark this report as resolved?")) {
      return;
    }

    setResolvingId(reportId);

    try {
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      setReports((prev) =>
        prev.filter((report) => report.id !== reportId)
      );
    } catch (err) {
      console.error("Failed to resolve report:", err);
      alert("Unable to resolve report.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader />

      <main className="admin-main">
        <section className="admin-welcome">
          <h1>Flagged Users</h1>
          <p>Review users who have active reports against them.</p>
        </section>

        {loading && <p>Loading flagged users...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && reports.length === 0 && (
          <p>No flagged users found.</p>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="admin-user-table">
            <div className="admin-user-row admin-user-table-header">
              <span>User ID</span>
              <span>Reason</span>
              <span>Description</span>
              <span>Status</span>
              <span>Created</span>
              <span>Action</span>
            </div>

            {reports.map((report) => (
              <div className="admin-user-row" key={report.id}>
                <span>{report.reportedUserId || "N/A"}</span>
                <span>{report.reason}</span>
                <span>{report.description || "None"}</span>
                <span>{report.status}</span>
                <span>
                  {report.createdAt
                    ? new Date(report.createdAt).toLocaleString()
                    : "N/A"}
                </span>
                <span>
                  <button
                    className="admin-user-action admin-action-activate"
                    onClick={() => handleResolve(report.id)}
                    disabled={resolvingId === report.id}
                  >
                    {resolvingId === report.id ? "Resolving..." : "Resolve"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminFlaggedUsers;